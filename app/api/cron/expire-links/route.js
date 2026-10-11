export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { processExpiredPaymentLinks } from '@/lib/paymentLinks';
import { processPendingWebhookRetries } from '@/lib/webhook';

/**
 * GET /api/cron/expire-links
 * Background worker endpoint executed every minute by Vercel Cron or external system cron.
 * - Safely batches and expires active links where expires_at < now
 * - Expires pending orders older than 15 minutes in public.orders
 * - Skips 'processing' links (unless stuck > 10 min)
 * - Fires payment_link.expired webhooks
 * - Retries pending webhooks with exponential backoff
 */
export async function GET(request) {
  try {
    // 1. Verify cron secret if configured
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization');

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
    }

    // 2. Process expired payment links in safe atomic batch
    const expiryResult = await processExpiredPaymentLinks(100);

    // 3. Expire pending orders in public.orders older than 15 minutes
    let expiredOrdersCount = 0;
    try {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: expiredOrders } = await supabaseAdmin
        .from('orders')
        .update({ status: 'expired' })
        .eq('status', 'pending')
        .lt('created_at', fifteenMinutesAgo)
        .select('id');
      expiredOrdersCount = expiredOrders?.length || 0;
    } catch (orderExpErr) {
      console.warn('[Cron Expire Orders Error]:', orderExpErr);
    }

    // 4. Process any pending webhook retries based on backoff schedule
    const retryResult = await processPendingWebhookRetries();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      expired_links: expiryResult.expiredCount,
      expired_orders: expiredOrdersCount,
      recovered_links: expiryResult.recoveredCount,
      webhooks_retried: retryResult.retried,
      errors: expiryResult.errors
    });

  } catch (err) {
    console.error('[Cron Expire-Links Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
