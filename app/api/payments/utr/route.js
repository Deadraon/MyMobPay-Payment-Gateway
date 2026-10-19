import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // 1. IP & Order Rate Limiting (Prevents automated UTR brute-forcing and enumeration)
    const clientIp = getClientIp(request);
    const ipLimit = checkRateLimit(`utr_submit_ip_${clientIp}`, 15, 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait a minute before retrying.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': ipLimit.resetInSeconds.toString() } }
      );
    }

    const body = await request.json();
    const { orderId, utr } = body;

    if (!orderId || !utr) {
      return NextResponse.json({ error: 'Order ID and UTR / Reference number are required.' }, { status: 400 });
    }

    const cleanOrderId = String(orderId).trim();
    const orderLimit = checkRateLimit(`utr_submit_ord_${cleanOrderId}`, 5, 60 * 1000);
    if (!orderLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many UTR submissions for this order. Please wait a moment.', code: 'ORDER_RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': orderLimit.resetInSeconds.toString() } }
      );
    }

    // 2. Strict UTR format validation (UPI RRN / UTR typically 12 numeric digits or 10-22 alphanumeric)
    const cleanUtr = String(utr).trim();
    if (!/^[0-9a-zA-Z]{10,25}$/.test(cleanUtr)) {
      return NextResponse.json({
        error: 'Invalid UTR format. Please enter a valid 10-18 digit UPI Reference number or UTR.',
        code: 'INVALID_UTR_FORMAT'
      }, { status: 400 });
    }

    // 3. Fetch order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', cleanOrderId)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found.', code: 'ORDER_NOT_FOUND' }, { status: 404 });
    }

    // Guard against terminal states
    if (order.status === 'verified') {
      return NextResponse.json({ success: true, verified: true, message: 'Order is already verified.' }, { status: 200 });
    }

    if (order.status === 'cancelled' || order.status === 'failed' || order.status === 'expired') {
      return NextResponse.json({
        error: `Order has been ${order.status} and cannot be verified.`,
        code: 'ORDER_TERMINATED'
      }, { status: 400 });
    }

    // 4. Check for duplicate UTR fraud against already verified orders
    const { data: existingUtr } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('utr', cleanUtr)
      .eq('status', 'verified')
      .neq('id', cleanOrderId)
      .limit(1);

    if (existingUtr && existingUtr.length > 0) {
      return NextResponse.json({
        error: `UTR ${cleanUtr} has already been verified for another transaction.`,
        code: 'DUPLICATE_UTR'
      }, { status: 400 });
    }

    // Diagnostic alert text cannot authorize a live payment. Live references
    // await authenticated bank processing or merchant review.
    if (order.mode === 'test') {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({
          utr: cleanUtr,
          customer_utr: cleanUtr,
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', cleanOrderId)
        .eq('mode', 'test')
        .eq('status', 'pending')
        .select()
        .single();

      if (error) {
        console.error('Error updating UTR in database:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Trigger merchant webhook
      try {
        await triggerMerchantWebhook(cleanOrderId);
      } catch (wErr) {
        console.error('Webhook error on payments/utr:', wErr);
      }

      // Send instant WhatsApp payment receipt if customer phone exists
      const targetPhone = data.customer_phone || data.customer_whatsapp || order.customer_phone;
      if (targetPhone) {
        try {
          const { sendWhatsAppPaymentReceipt } = await import('@/lib/whatsapp');
          await sendWhatsAppPaymentReceipt({
            toPhone: targetPhone,
            orderId: data.id,
            amount: data.amount,
            utr: cleanUtr,
            businessName: order.merchant_name || 'MyMobPay'
          });
        } catch (waErr) {
          console.warn('[WA RECEIPT] Could not send receipt on payments/utr:', waErr.message);
        }
      }

      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Payment verified successfully!',
        order: data
      });
    }

    // Record the live reference for authenticated bank processing or merchant review.
    await supabaseAdmin
      .from('orders')
      .update({ customer_utr: cleanUtr })
      .eq('id', cleanOrderId)
      .eq('status', 'pending');

    return NextResponse.json({
      success: true,
      verified: false,
      message: 'UTR recorded. Automatic verification in progress via bank alert matching...'
    }, { status: 200 });

  } catch (err) {
    console.error('API payments utr error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
