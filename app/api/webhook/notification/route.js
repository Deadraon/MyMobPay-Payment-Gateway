import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { parseTransactionText } from '@/lib/parseSms';
import { CONFIG } from '@/lib/config';
import { checkAndProcessSubscription } from '@/lib/adminSettings';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { syncOrderVerificationToPaymentLink } from '@/lib/paymentLinks';

export async function POST(request) {
  try {
    const body = await request.json();
    const { secret, title, message, text } = body;

    // Validate webhook secret
    const validSecret = process.env.WEBHOOK_SECRET || CONFIG.webhookSecret;
    if (!secret || secret !== validSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid secret' }, { status: 401 });
    }

    // Combine title and description text to parse
    const textToParse = [
      title || '',
      message || '',
      text || ''
    ].join(' ').trim();

    if (!textToParse) {
      return NextResponse.json({ error: 'Notification message content is empty' }, { status: 400 });
    }

    // Parse notification text
    const parsed = parseTransactionText(textToParse);
    if (!parsed) {
      return NextResponse.json({
        success: false,
        code: 'NOTIFICATION_NOT_PARSED',
        message: 'Notification alert text did not match transaction parameters.'
      }, { status: 200 });
    }

    const { amount, utr } = parsed;

    let matchedOrder = null;

    // 1. Prioritize customer-submitted UTR match
    if (utr && utr !== 'UNKNOWN_REF') {
      const { data: utrOrder } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .eq('customer_utr', utr)
        .limit(1);

      if (utrOrder && utrOrder.length > 0) {
        matchedOrder = utrOrder[0];
      }
    }

    // 2. Check for order ID in text
    if (!matchedOrder) {
      const orderMatch = textToParse.match(/\b(MMP_[0-9A-Za-z_]+)\b/i);
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

    // 3. Find the most recent pending order matching the amount (support paise offset for subscriptions)
    if (!matchedOrder) {
      const isSubAmount = amount === 499 || amount === 1497 || amount === 998 || amount === 1 || (amount >= 495 && amount <= 505);
      let orderQuery = supabaseAdmin
        .from('orders')
        .select('*')
        .eq('status', 'pending');

      if (isSubAmount) {
        const minAmt = Math.floor(amount);
        const maxAmt = Math.floor(amount) + 0.99;
        orderQuery = orderQuery.gte('amount', minAmt).lte('amount', maxAmt);
      } else {
        orderQuery = orderQuery.eq('amount', amount);
      }

      const { data: orders, error: findError } = await orderQuery
        .order('created_at', { ascending: false })
        .limit(1);

      if (findError) {
        console.error('Error finding matching order:', findError);
        return NextResponse.json({ error: findError.message }, { status: 500 });
      }

      if (orders && orders.length > 0) {
        matchedOrder = orders[0];
      }
    }

    if (!matchedOrder) {
      return NextResponse.json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: `No matching pending order found for amount ₹${amount}`,
        parsed: { amount, utr }
      }, { status: 200 });
    }

    // Check for double spending UTR
    const { data: duplicateUtr, error: dupError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('utr', utr)
      .limit(1);

    if (!dupError && duplicateUtr && duplicateUtr.length > 0) {
      return NextResponse.json({
        success: false,
        code: 'DUPLICATE_UTR',
        message: `Security warning: UTR ${utr} has already been verified on another invoice.`,
        parsed: { amount, utr }
      }, { status: 200 });
    }

    // Auto verify matched order
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
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Call subscription renewal and trial activation check
    await checkAndProcessSubscription(updatedOrder, '');

    // Synchronize verification with associated payment link (idempotent, honors late payments)
    try {
      await syncOrderVerificationToPaymentLink(matchedOrder.id, utr);
    } catch (linkSyncErr) {
      console.error('Payment link sync error on notification webhook:', linkSyncErr);
    }

    // Trigger outbound webhook safely
    await triggerMerchantWebhook(matchedOrder.id);

    return NextResponse.json({
      success: true,
      code: 'NOTIFICATION_VERIFIED',
      message: `Verified transaction ${matchedOrder.id} for Rs. ${amount} via push notification webhook.`,
      order: updatedOrder
    });
  } catch (err) {
    console.error('API webhook notification error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
