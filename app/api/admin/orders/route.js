import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { verifyAdminAuth, checkAndProcessSubscription } from '@/lib/adminSettings';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password, orderId, action, utr } = body;

    const isAuthorized = await verifyAdminAuth(request);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Action must be verify or reject' }, { status: 400 });
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
