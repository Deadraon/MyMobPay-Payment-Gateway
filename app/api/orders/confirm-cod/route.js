import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { triggerMerchantWebhook } from '@/lib/webhook';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`cod_submit_${clientIp}`, 15, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': rateLimit.resetInSeconds.toString() } }
      );
    }

    const body = await request.json();
    const { order_id, customer_name, customer_phone, delivery_address, pincode, city } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required.' }, { status: 400 });
    }

    if (!customer_name || !customer_phone || !delivery_address || !pincode) {
      return NextResponse.json({ error: 'Please fill in all delivery details (Name, Phone, Address, and Pincode).' }, { status: 400 });
    }

    const cleanPhone = String(customer_phone).replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Please enter a valid 10-digit mobile number for delivery.' }, { status: 400 });
    }

    // 1. Fetch order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status === 'verified') {
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Order is already confirmed.'
      }, { status: 200 });
    }

    // SECURITY CHECK: Cash on Delivery is strictly for physical goods, never SaaS subscriptions or platform plans
    const isSubscriptionOrder = Boolean(
      (order.note && (
        order.note.startsWith('Subscription_') ||
        order.note.includes('Subscription') ||
        order.note.includes('Trial_Setup') ||
        order.note.includes('Autopay_Setup')
      )) ||
      order.merchant_id === '677d9312-a53f-4b96-815f-53e0eee1b292' ||
      order.merchant_id === 'dd45279e-7a2c-413c-9e24-24d88011b680'
    );

    if (isSubscriptionOrder) {
      return NextResponse.json({
        error: 'Cash on Delivery is not supported for digital software licenses and platform subscriptions. Please pay via UPI or Net Banking.',
        code: 'METHOD_NOT_ALLOWED'
      }, { status: 400 });
    }

    // Generate unique COD Reference
    const codRef = `COD_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // 2. Update order as confirmed with delivery note
    const deliveryNote = `COD Delivery to: ${customer_name.trim()}, Phone: ${cleanPhone}, Addr: ${delivery_address.trim()}, Pincode: ${pincode}, City: ${city || 'N/A'}`;

    const updatePayload = {
      status: 'verified',
      utr: codRef,
      customer_utr: codRef,
      note: order.note ? `${order.note} | ${deliveryNote}` : deliveryNote,
      verified_at: new Date().toISOString()
    };

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', order.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // 3. Trigger Merchant webhook to notify merchant of new physical order
    try {
      await triggerMerchantWebhook(order.id);
    } catch (whErr) {
      console.error('[COD] Webhook trigger error:', whErr);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Cash on Delivery order placed successfully! Pay upon delivery.',
      cod_ref: codRef,
      order: updatedOrder
    }, { status: 200 });

  } catch (err) {
    console.error('Confirm COD error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
