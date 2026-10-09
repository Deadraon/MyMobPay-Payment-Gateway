import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { parseBankSms } from '@/lib/parseSms';
import { CONFIG } from '@/lib/config';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { checkAndProcessSubscription } from '@/lib/adminSettings';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { resolveMerchantIdToUuid } from '@/lib/merchantId';

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
    
    let merchant = null;
    let isAuthorized = false;

    // Check if the global secret is provided (timing-safe)
    if (secret && safeCompare(secret, validSecret)) {
      isAuthorized = true;
    }

    // Authenticate merchant using api_key if provided
    if (apiKey) {
      const { data, error } = await supabaseAdmin
        .from('merchants')
        .select('id, subscription_status, subscription_expires_at')
        .eq('api_key', apiKey)
        .single();
      
      if (!error && data) {
        merchant = data;
        isAuthorized = true;
      }
    }

    // Fallback: Check if the 'secret' sent is actually a merchant's private API Key
    if (!merchant && secret && secret !== validSecret) {
      const { data, error } = await supabaseAdmin
        .from('merchants')
        .select('id, subscription_status, subscription_expires_at')
        .eq('api_key', secret)
        .single();
        
      if (!error && data) {
        merchant = data;
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Invalid secret or API Key' }, { status: 401 });
    }

    if (merchant) {
       let isSubActive = merchant.subscription_status === 'active';
       if (isSubActive && merchant.subscription_expires_at) {
          if (new Date(merchant.subscription_expires_at) < new Date()) {
              isSubActive = false;
          }
       }
       const isAdminMerchant = merchant.id === '677d9312-a53f-4b96-815f-53e0eee1b292' || merchant.id === 'dd45279e-7a2c-413c-9e24-24d88011b680' || apiKey === CONFIG.platformApiKey || secret === CONFIG.platformApiKey;
       if (!isSubActive && !isAdminMerchant) {
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

    const isPlatformReceiver = merchant ? (merchant.id === '677d9312-a53f-4b96-815f-53e0eee1b292' || merchant.id === 'dd45279e-7a2c-413c-9e24-24d88011b680' || apiKey === CONFIG.platformApiKey || secret === CONFIG.platformApiKey) : false;

    let matchedOrder = null;

    // 1. Prioritize customer-submitted UTR match
    if (utr && utr !== 'UNKNOWN_REF') {
      let utrQuery = supabaseAdmin
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .eq('customer_utr', utr);

      if (merchant && !isPlatformReceiver) {
        utrQuery = utrQuery.eq('merchant_id', merchant.id);
      }

      const { data: utrOrder } = await utrQuery.limit(1);
      if (utrOrder && utrOrder.length > 0) {
        matchedOrder = utrOrder[0];
      }
    }

    // 2. Check if Order ID is referenced directly in the SMS text
    if (!matchedOrder) {
      const orderMatch = message.match(/\b(MMP_[0-9A-Za-z_]+)\b/i);
      if (orderMatch) {
        const { data: oByRef } = await supabaseAdmin
          .from('orders')
          .select('*')
          .eq('id', orderMatch[1])
          .eq('status', 'pending')
          .limit(1);
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
        
      if (merchant && !isPlatformReceiver) {
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

    if (!matchedOrder) {
      // Smart Fallback for Platform Subscription payments:
      const isSubAmount = amount === 499 || amount === 1497 || amount === 1 || (amount >= 495 && amount <= 505);
      if (isPlatformReceiver && isSubAmount) {
        const merchantMatch = message.match(/(?:Subscription|Trial)_[0-9A-Za-z]+_([0-9A-Za-z-]{8,36})/i);
        let targetMerchantId = null;
        if (merchantMatch) {
          targetMerchantId = await resolveMerchantIdToUuid(merchantMatch[1]);
        }

        if (!targetMerchantId) {
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
          const planId = amount >= 1400 ? '3m' : amount === 1 ? 'trial' : '1m';
          const orderId = `MMP_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_AUTO_${Date.now().toString().slice(-4)}`;
          
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
            await checkAndProcessSubscription(autoOrder, apiKey || CONFIG.platformApiKey);
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
    await checkAndProcessSubscription(updatedOrder, apiKey);

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
