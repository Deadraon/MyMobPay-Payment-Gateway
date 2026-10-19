import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth, ensureAdminMerchant } from '@/lib/adminSettings';
import { logAdminAction } from '@/lib/adminAudit';

export const dynamic = 'force-dynamic';

const DEFAULT_WEBHOOK_LOGS = [
  {
    id: 'wh_log_1',
    event: 'payment.verified',
    merchant_name: 'TechStore India',
    target_url: 'https://api.techstore.in/webhooks/mymobpay',
    http_status: 200,
    response_body: '{"received": true}',
    latency_ms: 142,
    attempts: 1,
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    payload: {
      event: 'payment.verified',
      order_id: 'ord_demo_101',
      utr: '408912345678',
      amount: 1499,
      status: 'verified'
    }
  },
  {
    id: 'wh_log_2',
    event: 'payment.failed',
    merchant_name: 'Kunal Fashion',
    target_url: 'https://kunal-fashion.com/api/payment-callback',
    http_status: 504,
    response_body: 'Gateway Timeout',
    latency_ms: 5002,
    attempts: 3,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    payload: {
      event: 'payment.failed',
      order_id: 'ord_demo_102',
      amount: 3200,
      reason: 'Mismatched UTR'
    }
  }
];

export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const adminMerchant = await ensureAdminMerchant();
    const storedLogs = adminMerchant?.setup_progress?.admin_settings?.webhook_logs || DEFAULT_WEBHOOK_LOGS;

    return NextResponse.json({
      success: true,
      webhook_logs: storedLogs,
      api_telemetry: {
        total_api_calls_24h: 12480,
        average_latency_ms: 88,
        error_rate_percent: 0.14
      }
    });
  } catch (err) {
    console.error('Developer GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const body = await request.json();
    const { action, logId } = body;

    if (action === 'retry_webhook') {
      const adminMerchant = await ensureAdminMerchant();
      const storedLogs = adminMerchant?.setup_progress?.admin_settings?.webhook_logs || DEFAULT_WEBHOOK_LOGS;
      const target = storedLogs.find(l => l.id === logId);

      if (!target) return NextResponse.json({ error: 'Log entry not found' }, { status: 404 });

      // Attempt live POST delivery to target URL
      let newStatus = 200;
      let newBody = '{"delivered": true}';
      try {
        const res = await fetch(target.target_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-MyMobPay-Retry': 'true' },
          body: JSON.stringify(target.payload)
        });
        newStatus = res.status;
        newBody = await res.text().catch(() => '');
      } catch (e) {
        newStatus = 500;
        newBody = e.message;
      }

      target.attempts = (target.attempts || 1) + 1;
      target.http_status = newStatus;
      target.response_body = newBody.slice(0, 500);

      await logAdminAction({
        action: 'developer.webhook_retry',
        targetType: 'webhook_log',
        targetId: logId,
        details: { targetUrl: target.target_url, newStatus },
        request
      });

      return NextResponse.json({ success: true, updatedLog: target });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Developer POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
