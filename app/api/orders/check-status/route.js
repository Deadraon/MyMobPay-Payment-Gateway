import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { syncOrderVerificationToPaymentLink } from '@/lib/paymentLinks';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`check_status_${clientIp}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many status check requests. Please slow down.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': rateLimit.resetInSeconds.toString() } }
      );
    }

    const { order_id } = await request.json();
    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, amount, status, note, created_at, mode, utr, customer_utr, merchant_id, project, callback_url, external_ref')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. If already verified, return immediately
    if (order.status === 'verified' || order.status === 'completed' || order.status === 'paid') {
      return NextResponse.json({
        success: true,
        verified: true,
        status: order.status,
        message: 'Payment verified successfully!',
        order
      }, { status: 200 });
    }

    // 3. In Test Mode: Auto-verify when user tests the payment
    if (order.mode === 'test') {
      const mockUtr = 'TEST_' + Math.floor(100000000000 + Math.random() * 900000000000);
      const { data: updatedOrder, error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'verified',
          utr: mockUtr,
          customer_utr: mockUtr,
          verified_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .select()
        .single();

      if (!updateErr && updatedOrder) {
        try {
          await syncOrderVerificationToPaymentLink(order.id, mockUtr);
          await triggerMerchantWebhook(order.id);
        } catch (whErr) {
          console.error('Webhook error on test order check-status:', whErr);
        }

        return NextResponse.json({
          success: true,
          verified: true,
          status: 'verified',
          mode: 'test',
          message: 'Test payment verified successfully!',
          order: updatedOrder
        }, { status: 200 });
      }
    }

    // Live payment status comes from webhook or authorized merchant confirmation.
    // Diagnostic email logs must never authorize a payment during polling.
    return NextResponse.json({
      success: true,
      verified: false,
      status: order.status,
      message: 'Payment pending bank confirmation. If you already paid via UPI, enter your 12-digit UTR below to verify.'
    }, { status: 200 });

  } catch (err) {
    console.error('check-status error:', err);
    return NextResponse.json({ error: 'Internal server error', message: err.message }, { status: 500 });
  }
}
