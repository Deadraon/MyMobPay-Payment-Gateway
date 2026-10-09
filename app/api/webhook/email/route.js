import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseTransactionText } from '@/lib/parseSms';
import { CONFIG } from '@/lib/config';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { checkAndProcessSubscription } from '@/lib/adminSettings';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { resolveMerchantIdToUuid } from '@/lib/merchantId';

export async function POST(request) {
  try {
    // 0. Rate limiting to prevent webhook flood attacks
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`webhook_email_${clientIp}`, 120, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { api_key, body: emailBody, from: emailSender } = await request.json();

    if (!api_key || !emailBody) {
      return NextResponse.json({ error: 'Missing API key or email body' }, { status: 400 });
    }

    // 1. Authenticate the merchant
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, subscription_status, subscription_expires_at')
      .eq('api_key', api_key)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Unauthorized: Invalid API Key' }, { status: 401 });
    }

    // -- Intercept Gmail Forwarding Confirmation Link & Numeric Code --
    const gmailLinkMatch = emailBody.match(/(https:\/\/(?:mail|mail-settings)\.google\.com\/mail\/vf-[^"'\s<>]+)/i);
    const gmailCodeMatch = emailBody.match(/(?:confirmation code|verification code)[\s:]+([0-9]{6,12})/i);
    if (gmailLinkMatch || gmailCodeMatch) {
      const codeOrLink = gmailLinkMatch ? gmailLinkMatch[1] : `CODE:${gmailCodeMatch[1]}`;
      
      // Save the link or code to the merchant's database row
      await supabaseAdmin
        .from('merchants')
        .update({ gmail_verification_code: codeOrLink })
        .eq('id', merchant.id);
        
      console.log(`✅ Intercepted Gmail verification for merchant ${merchant.id}: ${codeOrLink}`);
      return NextResponse.json({ success: true, message: 'Saved Gmail verification' }, { status: 200 });
    }

    // Block actual payment processing if subscription is inactive or expired
    let isSubActive = merchant.subscription_status === 'active';
    if (isSubActive && merchant.subscription_expires_at) {
       if (new Date(merchant.subscription_expires_at) < new Date()) {
           isSubActive = false;
       }
    }

    const isAdminMerchant = merchant.id === '677d9312-a53f-4b96-815f-53e0eee1b292' || merchant.id === 'dd45279e-7a2c-413c-9e24-24d88011b680' || api_key === CONFIG.platformApiKey;

    if (!isSubActive && !isAdminMerchant) {
      return NextResponse.json({ error: 'Merchant subscription is inactive or expired' }, { status: 403 });
    }


    // 2. Parse the email text to extract UTR and Amount
    const parsed = parseTransactionText(emailBody);
    
    // Helper to log emails to the database
    const logEmail = async (status, extraInfo = '') => {
      const summaryPrefix = parsed ? `[UTR: ${parsed.utr} | AMT: ${parsed.amount}] ` : '';
      const snippet = summaryPrefix + (extraInfo ? `[${extraInfo}] ` : '') + emailBody.substring(0, 1000);
      await supabaseAdmin.from('email_logs').insert({
        merchant_id: merchant.id,
        sender: emailSender || 'Unknown',
        body_snippet: snippet,
        status: status
      });
    };

    if (!parsed || !parsed.amount || !parsed.utr) {
      await logEmail('ignored');
      return NextResponse.json({
        success: false,
        code: 'EMAIL_NOT_PARSED',
        message: 'Could not extract valid Amount and UTR from the email body.'
      }, { status: 200 }); // Return 200 so Cloudflare doesn't retry
    }

    const { amount, utr } = parsed;

    // 3. Find matching pending order (support platform UPI orders when received by admin/platform merchant)
    let matchedOrder = null;

    // 3a. Prioritize exact Customer-submitted UTR match if available
    if (utr && utr !== 'UNKNOWN_REF') {
      let utrQuery = supabaseAdmin
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .eq('customer_utr', utr);

      if (!isAdminMerchant) {
        utrQuery = utrQuery.eq('merchant_id', merchant.id);
      }

      const { data: utrOrder } = await utrQuery.limit(1);
      if (utrOrder && utrOrder.length > 0) {
        matchedOrder = utrOrder[0];
      }
    }

    // 3a-2. Check if Order ID is referenced directly in the email body
    if (!matchedOrder) {
      const orderMatch = emailBody.match(/\b(MMP_[0-9A-Za-z_]+)\b/i);
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

    // 3b. Fallback: match by amount (supporting unique paise offset)
    if (!matchedOrder) {
      let amountQuery = supabaseAdmin
        .from('orders')
        .select('*')
        .eq('status', 'pending');

      if (!isAdminMerchant) {
        amountQuery = amountQuery.eq('merchant_id', merchant.id).eq('amount', amount);
      } else {
        const isSubAmount = amount === 499 || amount === 1497 || amount === 998 || amount === 1 || (amount >= 495 && amount <= 505);
        if (isSubAmount) {
          const minAmt = Math.floor(amount);
          const maxAmt = Math.floor(amount) + 0.99;
          amountQuery = amountQuery.gte('amount', minAmt).lte('amount', maxAmt);
        } else {
          amountQuery = amountQuery.eq('amount', amount);
        }
      }

      const { data: orders, error: findError } = await amountQuery
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
      // If a merchant scanned the QR directly from another device and no order was pre-created:
      const isSubAmount = amount === 499 || amount === 1497 || amount === 1 || (amount >= 495 && amount <= 505);
      if (isAdminMerchant && isSubAmount) {
        // Look for merchant ID encoded in email remark/body (e.g. Subscription_1m_MID-DD45279E)
        const merchantMatch = emailBody.match(/(?:Subscription|Trial)_[0-9A-Za-z]+_(?:MID-)?([0-9a-fA-F-]{8,36})/i);
        let targetMerchantId = null;
        if (merchantMatch) {
          targetMerchantId = await resolveMerchantIdToUuid(merchantMatch[1]);
        }

        // If not found in remarks, match the most recent expired or renewing merchant
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
            matchedOrder = autoOrder;
            await checkAndProcessSubscription(matchedOrder, api_key);
            await logEmail('matched', `Auto-matched subscription payment for merchant ${targetMerchantId}`);
            return NextResponse.json({
              success: true,
              code: 'ORDER_VERIFIED',
              message: `Auto-verified subscription payment of Rs. ${amount} for merchant ${targetMerchantId}`,
              order: matchedOrder
            });
          }
        }
      }

      await logEmail('parsed', `No order found for amount ${amount}`); // Parsed, but no matching order found
      return NextResponse.json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: `No matching pending order found for amount ${amount}.`,
        parsed: { amount, utr }
      }, { status: 200 });
    }

    // 4. Check for duplicate UTR fraud
    const { data: duplicateUtr, error: dupError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('utr', utr)
      .limit(1);

    if (!dupError && duplicateUtr && duplicateUtr.length > 0) {
      await logEmail('parsed'); // Parsed, but duplicate UTR
      return NextResponse.json({
        success: false,
        code: 'DUPLICATE_UTR',
        message: `Fraud warning: UTR ${utr} has already been used.`,
        parsed: { amount, utr }
      }, { status: 200 });
    }

    // 5. Update the matched order to verified
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

    // 6. SaaS Subscription Renewal Logic
    await checkAndProcessSubscription(updatedOrder, api_key);

    // 7. Trigger merchant outbound webhook safely
    await triggerMerchantWebhook(matchedOrder.id);
    
    // Log the successful match!
    await logEmail('matched');

    return NextResponse.json({
      success: true,
      code: 'ORDER_VERIFIED',
      message: `Successfully verified order ${matchedOrder.id} for Rs. ${amount}`,
      order: updatedOrder
    });

  } catch (err) {
    console.error('API Email Webhook error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
