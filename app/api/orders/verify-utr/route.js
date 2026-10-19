import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { syncOrderVerificationToPaymentLink } from '@/lib/paymentLinks';
import { generateOrderId } from '@/lib/orderId';

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

    // 1. Fetch the order (supports Order ID, custom reference, or Payment Link token)
    const cleanId = String(order_id).trim().replace(/^[-#]+/, '');
    let order = null;

    const { data: ordDirect } = await supabaseAdmin
      .from('orders')
      .select('id, amount, status, merchant_id, mode, note, external_ref')
      .eq('id', cleanId)
      .maybeSingle();

    if (ordDirect) {
      order = ordDirect;
    } else {
      // Check if cleanId is an external_ref (e.g. pl_xxxx)
      const { data: ordByRef } = await supabaseAdmin
        .from('orders')
        .select('id, amount, status, merchant_id, mode, note, external_ref')
        .ilike('external_ref', cleanId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (ordByRef) {
        order = ordByRef;
      } else if (cleanId.length >= 24) {
        // Check if cleanId is a payment link token
        const { data: pl } = await supabaseAdmin
          .from('payment_links')
          .select('*')
          .eq('token', cleanId)
          .maybeSingle();

        if (pl) {
          if (pl.order_id) {
            const { data: plOrder } = await supabaseAdmin
              .from('orders')
              .select('id, amount, status, merchant_id, mode, note, external_ref')
              .eq('id', pl.order_id)
              .maybeSingle();
            order = plOrder;
          }

          if (!order) {
            // Auto-create order for this payment link so UTR submission is never lost
            const { paiseToRupees } = await import('@/lib/paymentLinks');
            const newOrderId = generateOrderId('order');
            const amountInRupees = parseFloat(paiseToRupees(pl.amount));

            const { data: createdOrd } = await supabaseAdmin
              .from('orders')
              .insert([
                {
                  id: newOrderId,
                  merchant_id: pl.merchant_id,
                  amount: amountInRupees,
                  method: 'UPI',
                  note: pl.title || 'Payment Link Checkout',
                  customer_utr: cleanUtr,
                  external_ref: `pl_${pl.token.slice(0, 12)}`,
                  status: 'pending',
                  mode: 'live'
                }
              ])
              .select('id, amount, status, merchant_id, mode, note, external_ref')
              .single();

            if (createdOrd) {
              order = createdOrd;
              await supabaseAdmin
                .from('payment_links')
                .update({ order_id: newOrderId, updated_at: new Date().toISOString() })
                .eq('id', pl.id);
            }
          }
        }
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status === 'verified') {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Order is already verified.'
      }, { status: 200 });
    }

    if (order.status === 'cancelled' || order.status === 'failed' || order.status === 'expired') {
      return NextResponse.json({
        error: `Order has been ${order.status} and cannot be verified.`,
        code: 'ORDER_TERMINATED'
      }, { status: 400 });
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

    // Diagnostic email/SMS logs cannot authorize a payment.
    // Live verification is performed by the authenticated payment webhooks.
    if (order.mode === 'test') {
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

      // Synchronize verification with associated payment link (idempotent, honors late payments)
      try {
        await syncOrderVerificationToPaymentLink(order.id, cleanUtr);
      } catch (linkSyncErr) {
        console.error('Payment link sync error on UTR verify:', linkSyncErr);
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

    // Save the live customer reference for webhook matching and keep the order pending.
    await supabaseAdmin
      .from('orders')
      .update({ customer_utr: cleanUtr })
      .eq('id', order.id);

    return NextResponse.json({
      success: true,
      verified: false,
      message: '✓ UTR saved successfully! Verification is in progress and recorded on your order.'
    }, { status: 200 });

  } catch (err) {
    console.error('Verify UTR error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
