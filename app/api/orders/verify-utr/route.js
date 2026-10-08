import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { checkAndProcessSubscription } from '@/lib/adminSettings';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`utr_submit_${clientIp}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': rateLimit.resetInSeconds.toString() } }
      );
    }

    const { order_id, utr } = await request.json();

    if (!order_id || !utr) {
      return NextResponse.json({ error: 'Order ID and UTR / Reference No. are required.' }, { status: 400 });
    }

    const cleanUtr = String(utr).trim();
    if (cleanUtr.length < 8 || cleanUtr.length > 35) {
      return NextResponse.json({ error: 'Invalid UTR format. Please enter a valid 10-16 digit bank reference or UTR.' }, { status: 400 });
    }

    // 1. Fetch the order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, amount, status, merchant_id, mode, note, external_ref')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status === 'verified') {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Order is already verified.'
      }, { status: 200 });
    }

    // 2. Check for duplicate UTR fraud against already verified orders
    const { data: existingUtr } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('utr', cleanUtr)
      .eq('status', 'verified')
      .neq('id', order.id)
      .limit(1);

    if (existingUtr && existingUtr.length > 0) {
      return NextResponse.json({
        error: `UTR ${cleanUtr} has already been verified for another transaction.`,
        code: 'DUPLICATE_UTR'
      }, { status: 400 });
    }

    // 3. Check for matching bank credit in email_logs with strict amount verification
    let isBankConfirmed = false;
    const { data: matchedEmail } = await supabaseAdmin
      .from('email_logs')
      .select('*')
      .ilike('body_snippet', `%${cleanUtr}%`)
      .limit(1);

    if (matchedEmail && matchedEmail.length > 0) {
      const emailRecord = matchedEmail[0];
      const snippet = emailRecord.body_snippet || '';
      const orderAmt = parseFloat(order.amount);
      const formattedAmt = orderAmt.toFixed(2);
      const integerAmt = Math.floor(orderAmt).toString();

      // SECURITY CHECK: Verify that the bank email actually credited the matching order amount
      const hasMatchingAmount =
        snippet.includes(formattedAmt) ||
        snippet.includes(`INR ${formattedAmt}`) ||
        snippet.includes(`Rs. ${formattedAmt}`) ||
        snippet.includes(`Rs.${formattedAmt}`) ||
        snippet.includes(`₹${formattedAmt}`) ||
        snippet.includes(`Rs. ${integerAmt}`) ||
        snippet.includes(`Rs.${integerAmt}`) ||
        snippet.includes(`INR ${integerAmt}`);

      if (hasMatchingAmount) {
        isBankConfirmed = true;
      } else {
        console.warn(`[Security Warning] UTR ${cleanUtr} found in bank log, but credited amount does not match required order amount ₹${formattedAmt}. Skipping auto-verification.`);
      }
    }

    // 4. In test mode OR if bank alert has already matched, verify the order
    if (order.mode === 'test' || isBankConfirmed) {
      const { data: updatedOrder, error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'verified',
          utr: cleanUtr,
          customer_utr: cleanUtr,
          verified_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) {
        console.error('Error verifying order with UTR:', updateErr);
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Trigger subscription activation only for live, authentic verified orders
      if (order.mode !== 'test') {
        try {
          await checkAndProcessSubscription(updatedOrder, '');
        } catch (subErr) {
          console.error('Subscription process error on UTR verify:', subErr);
        }
      }

      // Trigger outbound merchant webhook
      try {
        await triggerMerchantWebhook(order.id);
      } catch (whErr) {
        console.error('Webhook error on UTR verify:', whErr);
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Payment verified successfully!',
        order: updatedOrder
      }, { status: 200 });
    }

    // 5. In live mode without immediate bank match: Save customer_utr and keep pending
    await supabaseAdmin
      .from('orders')
      .update({ customer_utr: cleanUtr })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      verified: false,
      message: 'UTR saved. Automatic verification in progress via bank credit alert...'
    }, { status: 200 });

  } catch (err) {
    console.error('Verify UTR error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
