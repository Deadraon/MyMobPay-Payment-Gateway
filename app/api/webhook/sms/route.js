import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { parseBankSms } from '@/lib/parseSms';
import { CONFIG } from '@/lib/config';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { checkAndProcessSubscription } from '@/lib/adminSettings';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { resolveMerchantIdToUuid } from '@/lib/merchantId';
import { generateOrderId } from '@/lib/orderId';
import { findMerchantByApiKey, hashApiKey } from '@/lib/merchantAuth';

// Constant-time string comparison to prevent timing attacks
function safeCompare(a, b) {
  if (!a || !b || typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(request) {
  try {
    // 0. Rate limiting to prevent flood / DoS attacks
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`webhook_sms_${clientIp}`, 120, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const { secret, message } = body;

    const validSecret = process.env.WEBHOOK_SECRET || CONFIG.webhookSecret;
    const apiKey = body.api_key || request.headers.get('x-api-key') || request.headers.get('X-MyMobPay-API-Key');
    const publicPlatformKeyHash = hashApiKey(CONFIG.platformApiKey);
    // Only the private webhook secret grants platform-wide callback authority.
    const isPlatformReceiver = safeCompare(secret, validSecret) && hashApiKey(secret) !== publicPlatformKeyHash;

    let merchant = null;
    let authenticatedApiKey;

    if (!isPlatformReceiver) {
      // Accept a private merchant key in either field, retaining only the successful credential.
      for (const key of [apiKey, secret]) {
        // The checkout platform key is public, including its live_/test_ variants.
        if (!key || hashApiKey(key) === publicPlatformKeyHash) continue;
        const found = await findMerchantByApiKey(key, 'id, subscription_status, subscription_expires_at');
        if (found) {
          merchant = found;
          authenticatedApiKey = key;
          break;
        }
      }
    }

    if (!isPlatformReceiver && !merchant) {
      return NextResponse.json({ error: 'Unauthorized: Invalid secret or API Key' }, { status: 401 });
    }

    if (merchant) {
       let isSubActive = merchant.subscription_status === 'active';
       if (isSubActive && merchant.subscription_expires_at) {
          if (new Date(merchant.subscription_expires_at) < new Date()) {
              isSubActive = false;
          }
       }
       if (!isSubActive) {
         return NextResponse.json({ error: 'Merchant subscription is inactive or expired' }, { status: 403 });
       }
    }

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Parse the SMS text
    const parsed = parseBankSms(message);
    if (!parsed) {
      // Return 200 OK so that SMS forwarder doesn't keep retrying spam or non-bank SMS
      return NextResponse.json({
        success: false,
        code: 'SMS_NOT_PARSED',
        message: 'SMS message does not match credit format or has no valid UTR/amount.'
      }, { status: 200 });
    }

    const { amount, utr } = parsed;

    let matchedOrder = null;

    // 1. Prioritize customer-submitted UTR match
    if (utr && utr !== 'UNKNOWN_REF') {
      let utrQuery = supabaseAdmin
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .eq('customer_utr', utr);

      if (!isPlatformReceiver) {
        utrQuery = utrQuery.eq('merchant_id', merchant.id);
      }

      const { data: utrOrder } = await utrQuery.limit(1);
      if (utrOrder && utrOrder.length > 0) {
        matchedOrder = utrOrder[0];
      }
    }

    // 2. Check if Order ID is referenced directly in the SMS text
    if (!matchedOrder) {
      const orderMatch = message.match(/\b((?:order_|pay_|mmp_|MMP_)[0-9A-Za-z_]+)\b/i);
      if (orderMatch) {
        let refQuery = supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', orderMatch[1])
          .eq('status', 'pending');
        if (!isPlatformReceiver) {
          refQuery = refQuery.eq('merchant_id', merchant.id);
        }
        const { data: oByRef } = await refQuery.limit(1);
        if (oByRef && oByRef.length > 0) {
          matchedOrder = oByRef[0];
        }
      }
    }

    // 3. Find pending order matching amount
    if (!matchedOrder) {
      let orderQuery = supabaseAdmin
        .from('orders')
        .select('*')
        .eq('status', 'pending');
        
      if (!isPlatformReceiver) {
        orderQuery = orderQuery.eq('merchant_id', merchant.id).eq('amount', amount);
      } else {
        const isSubAmount = amount === 499 || amount === 1497 || amount === 998 || amount === 1 || (amount >= 495 && amount <= 505);
        if (isSubAmount) {
          const minAmt = Math.floor(amount);
          const maxAmt = Math.floor(amount) + 0.99;
          orderQuery = orderQuery.gte('amount', minAmt).lte('amount', maxAmt);
        } else {
          orderQuery = orderQuery.eq('amount', amount);
        }
      }

      const { data: orders, error: findError } = await orderQuery
        .order('created_at', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('Error searching for matching order:', findError);
        return NextResponse.json({ error: findError.message }, { status: 500 });
      }

      if (orders && orders.length > 0) {
        matchedOrder = orders[0];
      }
    }

    // 3c. Check if an active or processing payment link matches this amount
    if (!matchedOrder) {
      const amountInPaise = Math.round(amount * 100);
      let plQuery = supabaseAdmin
        .from('payment_links')
        .select('*')
        .in('status', ['active', 'processing'])
        .eq('amount', amountInPaise);

      if (!isPlatformReceiver) {
        plQuery = plQuery.eq('merchant_id', merchant.id);
      }

      const { data: matchedLinks } = await plQuery
        .order('created_at', { ascending: false })
        .limit(1);

      if (matchedLinks && matchedLinks.length > 0) {
        const link = matchedLinks[0];
        let linkOrderId = link.order_id;

        if (linkOrderId) {
          const { data: existingOrd } = await supabaseAdmin
            .from('orders')
            .select('*')
            .eq('id', linkOrderId)
            .eq('merchant_id', link.merchant_id)
            .maybeSingle();
          if (existingOrd) {
            matchedOrder = existingOrd;
          }
        }

        if (!matchedOrder) {
          // Auto-create order for this payment link so payment is attributed to the correct merchant
          const newOrderId = generateOrderId('order');
          const { data: createdOrd } = await supabaseAdmin
            .from('orders')
            .insert({
              id: newOrderId,
              merchant_id: link.merchant_id,
              amount: amount,
              method: 'UPI',
              note: link.title || 'Payment Link Checkout',
              external_ref: `pl_${link.token.slice(0, 12)}`,
              customer_utr: utr,
              status: 'pending',
              mode: 'live'
            })
            .select()
            .single();

          if (createdOrd) {
            matchedOrder = createdOrd;
            await supabaseAdmin
              .from('payment_links')
              .update({ order_id: newOrderId, updated_at: new Date().toISOString() })
              .eq('id', link.id);
          }
        }
      }
    }

    if (!matchedOrder) {
      // Smart Fallback for Platform Subscription payments:
      const isSubAmount = amount === 499 || amount === 1497 || (amount >= 495 && amount <= 505);
      const hasSubscriptionKeyword = /(?:Subscription|Platform\s*Plan|Monthly\s*Plan|Trial)/i.test(message);
      const merchantMatch = message.match(/(?:Subscription|Trial)_[0-9A-Za-z]+_([0-9A-Za-z-]{8,36})/i);
      if (isPlatformReceiver && (merchantMatch || (hasSubscriptionKeyword && isSubAmount))) {
        let targetMerchantId = null;
        if (merchantMatch) {
          targetMerchantId = await resolveMerchantIdToUuid(merchantMatch[1]);
        }

        // Only if explicit subscription keyword is present, match the most recent expired or renewing merchant
        if (!targetMerchantId && hasSubscriptionKeyword) {
          const { data: candidateMerchants } = await supabaseAdmin
            .from('merchants')
            .select('id')
            .neq('subscription_status', 'active')
            .order('created_at', { ascending: false })
            .limit(1);
          if (candidateMerchants && candidateMerchants.length > 0) {
            targetMerchantId = candidateMerchants[0].id;
          }
        }

        if (targetMerchantId) {
          const planId = amount >= 1400 ? '3m' : '1m';
          const orderId = generateOrderId('order');
          
          const { data: autoOrder } = await supabaseAdmin.from('orders').insert({
            id: orderId,
            merchant_id: targetMerchantId,
            amount: amount,
            status: 'verified',
            note: `Subscription_${planId}`,
            external_ref: targetMerchantId,
            utr: utr,
            customer_utr: utr,
            verified_at: new Date().toISOString()
          }).select().single();

          if (autoOrder) {
            await checkAndProcessSubscription(autoOrder, authenticatedApiKey);
            return NextResponse.json({
              success: true,
              code: 'ORDER_VERIFIED',
              message: `Auto-verified subscription payment of Rs. ${amount} for merchant ${targetMerchantId}`,
              order: autoOrder
            });
          }
        }
      }

      // Order not found
      return NextResponse.json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: `No matching pending order found for amount ${amount}`,
        parsed: { amount, utr }
      }, { status: 200 });
    }

    // Check if another order already has this UTR to prevent double-spending / fraud
    const { data: duplicateUtr, error: dupError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('utr', utr)
      .limit(1);

    if (!dupError && duplicateUtr && duplicateUtr.length > 0) {
      return NextResponse.json({
        success: false,
        code: 'DUPLICATE_UTR',
        message: `Fraud warning: UTR ${utr} has already been used for another transaction.`,
        parsed: { amount, utr }
      }, { status: 200 });
    }

    // Update the matched order to verified
    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'verified',
        utr: utr,
        verified_at: new Date().toISOString()
      })
      .eq('id', matchedOrder.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Call subscription renewal check
    await checkAndProcessSubscription(updatedOrder, authenticatedApiKey);

    // Trigger outbound webhook safely
    await triggerMerchantWebhook(matchedOrder.id);

    return NextResponse.json({
      success: true,
      code: 'ORDER_VERIFIED',
      message: `Successfully verified order ${matchedOrder.id} for Rs. ${amount}`,
      order: updatedOrder
    });
  } catch (err) {
    console.error('API webhook SMS error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
