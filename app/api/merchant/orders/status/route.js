import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateMerchant } from '@/lib/merchantAuth';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { syncOrderVerificationToPaymentLink } from '@/lib/paymentLinks';
import { checkAndProcessSubscription } from '@/lib/adminSettings';
import { CONFIG } from '@/lib/config';

/**
 * POST /api/merchant/orders/status
 * Allows authenticated merchants (or platform admins) to manually mark
 * an order as Paid (verified) or Unpaid (pending/rejected).
 * 
 * Body:
 * - orderId: string (required)
 * - action: 'verify' | 'unpaid' | 'reject'
 * - utr: string (optional, defaults to customer_utr or existing utr)
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { orderId, action, utr, status } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const targetAction = (action || status || 'verify').toLowerCase();
    if (!['verify', 'unpaid', 'pending', 'reject', 'rejected'].includes(targetAction)) {
      return NextResponse.json({ error: "Invalid action. Must be 'verify', 'unpaid', or 'reject'." }, { status: 400 });
    }

    // 1. Authenticate Merchant
    const { merchant, error: authErr, status: authStatus } = await authenticateMerchant(request, body);
    if (authErr || !merchant) {
      return NextResponse.json({ error: authErr || 'Unauthorized' }, { status: authStatus || 401 });
    }

    // 2. Fetch the target order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    // 3. Authorization check: order must belong to this merchant OR caller is platform admin
    const isAdmin =
      merchant.id === 'dd45279e-7a2c-413c-9e24-24d88011b680' ||
      merchant.id === '677d9312-a53f-4b96-815f-53e0eee1b292' ||
      merchant.api_key === CONFIG.platformApiKey;

    if (order.merchant_id !== merchant.id && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You do not own this order.' }, { status: 403 });
    }

    // 4. Handle Actions
    if (targetAction === 'verify') {
      const finalUtr = (utr || order.customer_utr || order.utr || `MANUAL_${Date.now().toString().slice(-6)}`).trim();
      const nowIso = new Date().toISOString();

      const { data: updatedOrder, error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'verified',
          utr: finalUtr,
          customer_utr: order.customer_utr || finalUtr,
          verified_at: nowIso
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Sync payment link if tied
      try {
        await syncOrderVerificationToPaymentLink(order.id, finalUtr);
      } catch (plErr) {
        console.error('Payment link sync error on manual verify:', plErr);
      }

      // Trigger merchant webhook
      try {
        await triggerMerchantWebhook(order.id);
      } catch (whErr) {
        console.error('Webhook error on manual verify:', whErr);
      }

      // Check subscription if subscription order
      try {
        await checkAndProcessSubscription(updatedOrder, merchant.api_key);
      } catch (subErr) {
        console.error('Subscription check error on manual verify:', subErr);
      }

      return NextResponse.json({
        success: true,
        action: 'verify',
        message: 'Order marked as Paid successfully.',
        order: updatedOrder
      }, { status: 200 });

    } else if (targetAction === 'unpaid' || targetAction === 'pending') {
      const { data: updatedOrder, error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'pending',
          verified_at: null
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Sync associated payment link back to active if tied
      try {
        await supabaseAdmin
          .from('payment_links')
          .update({
            status: 'active',
            paid_at: null,
            updated_at: new Date().toISOString()
          })
          .eq('order_id', order.id)
          .eq('status', 'paid');
      } catch (plErr) {
        console.error('Payment link sync error on manual unpaid:', plErr);
      }

      return NextResponse.json({
        success: true,
        action: 'unpaid',
        message: 'Order status reverted to Pending (Unpaid).',
        order: updatedOrder
      }, { status: 200 });

    } else if (targetAction === 'reject' || targetAction === 'rejected') {
      const { data: updatedOrder, error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'rejected',
          verified_at: null
        })
        .eq('id', order.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        action: 'reject',
        message: 'Order marked as Rejected.',
        order: updatedOrder
      }, { status: 200 });
    }

  } catch (err) {
    console.error('Manual order status change error:', err);
    return NextResponse.json({ error: 'Internal server error: ' + err.message }, { status: 500 });
  }
}
