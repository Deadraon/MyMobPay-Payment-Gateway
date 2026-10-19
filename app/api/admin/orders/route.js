import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { verifyAdminAuth, checkAndProcessSubscription } from '@/lib/adminSettings';
import { logAdminAction } from '@/lib/adminAudit';
import { hasPermission, PERMISSIONS } from '@/lib/adminRbac';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password, orderId, action, utr, reason } = body;

    const isAuthorized = await verifyAdminAuth(request);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    // Action: Re-trigger outbound webhook for an order
    if (action === 'resend_webhook') {
      const webhookRes = await triggerMerchantWebhook(orderId);
      await logAdminAction({
        action: 'order.resend_webhook',
        targetType: 'order',
        targetId: orderId,
        details: { result: webhookRes },
        request
      });
      return NextResponse.json({ 
        success: true, 
        message: 'Outbound webhook successfully re-dispatched to merchant URL.', 
        details: webhookRes 
      });
    }

    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be verify, reject, or resend_webhook' }, { status: 400 });
    }

    let updateFields = {};
    if (action === 'verify') {
      updateFields = {
        status: 'verified',
        utr: utr || `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
        verified_at: new Date().toISOString()
      };
    } else {
      updateFields = {
        status: 'rejected'
      };
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(updateFields)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error modifying order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record immutable audit entry
    await logAdminAction({
      action: action === 'verify' ? 'order.manual_verify' : 'order.manual_reject',
      targetType: 'order',
      targetId: orderId,
      details: {
        action,
        utr: updateFields.utr,
        amount: data.amount,
        merchant_id: data.merchant_id,
        reason: reason || 'Manual admin review'
      },
      request
    });

    // Trigger outbound webhook for the merchant and check subscription upon verification
    if (action === 'verify') {
      const { data: merchantData } = await supabaseAdmin
        .from('merchants')
        .select('api_key')
        .eq('id', data.merchant_id)
        .single();

      await checkAndProcessSubscription(data, merchantData?.api_key);
      await triggerMerchantWebhook(orderId);
    }

    return NextResponse.json({ success: true, order: data });
  } catch (err) {
    console.error('API admin orders error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
