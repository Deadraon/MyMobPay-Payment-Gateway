import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    // 1. Rate limiting
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`pending_status_${clientIp}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': rateLimit.resetInSeconds.toString() } }
      );
    }

    const body = await request.json();
    const { orderId, method } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const cleanOrderId = String(orderId).trim();

    // 2. Fetch current order status to prevent tampering
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('id', cleanOrderId)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 3. Never allow reverting a finalized or verified order
    if (order.status === 'verified') {
      return NextResponse.json({
        error: 'Cannot update status: Order has already been verified.',
        code: 'ORDER_ALREADY_VERIFIED'
      }, { status: 400 });
    }

    if (order.status === 'cancelled' || order.status === 'failed') {
      return NextResponse.json({
        error: `Cannot update status: Order is ${order.status}.`,
        code: 'ORDER_FINALIZED'
      }, { status: 400 });
    }

    const updateFields = { status: 'pending' };
    if (method && typeof method === 'string') {
      updateFields.method = method.trim().slice(0, 50);
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateFields)
      .eq('id', cleanOrderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order to pending:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error('API payments pending error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
