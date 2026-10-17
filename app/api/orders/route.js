export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { generateOrderId } from '@/lib/orderId';
import { findMerchantByApiKey } from '@/lib/merchantAuth';
import { syncOrderVerificationToPaymentLink } from '@/lib/paymentLinks';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`order_create_${clientIp}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded for order creation. Please slow down your requests.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: { 'Retry-After': rateLimit.resetInSeconds.toString() },
        }
      );
    }
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_KEY;

    if (!hasUrl || !hasServiceKey) {
      return NextResponse.json({ 
        error: `Server configuration error: Missing ${!hasUrl ? 'SUPABASE_URL' : ''} ${!hasServiceKey ? 'SERVICE_KEY' : ''}`.trim()
      }, { status: 500 });
    }

    const body = await request.json();
    const { api_key, amount, method, note, customer_name, customer_phone, project, callback_url, external_ref } = body;

    const effectiveApiKey = api_key || CONFIG.platformApiKey;
    if (!effectiveApiKey) {
      return NextResponse.json({ error: 'API Key is required to create an order.' }, { status: 400 });
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0 || numAmount > 1000000) {
      return NextResponse.json({ error: 'Valid amount between ₹1.00 and ₹10,00,000.00 is required.' }, { status: 400 });
    }

    let actualKey = effectiveApiKey;
    let isTestFromKey = false;
    
    if (effectiveApiKey.startsWith('test_')) {
      actualKey = effectiveApiKey.replace('test_', '');
      isTestFromKey = true;
    } else if (effectiveApiKey.startsWith('live_')) {
      actualKey = effectiveApiKey.replace('live_', '');
    }

    // 1. Authenticate the merchant using the API Key (SHA-256 hashed lookup)
    const merchant = await findMerchantByApiKey(actualKey, 'id, subscription_status, sandbox_mode, subscription_expires_at');

    if (!merchant) {
      return NextResponse.json({ error: 'Invalid API Key or Merchant not found.' }, { status: 401 });
    }

    let isSubActive = merchant.subscription_status === 'active';
    if (isSubActive && merchant.subscription_expires_at) {
       if (new Date(merchant.subscription_expires_at) < new Date()) {
           isSubActive = false;
       }
    }

    const isTestMode = isTestFromKey || merchant.sandbox_mode !== false;
    const isAdminMerchant = merchant.id === '677d9312-a53f-4b96-815f-53e0eee1b292' || actualKey === CONFIG.platformApiKey;

    if (!isSubActive && !isAdminMerchant && !isTestMode) {
      return NextResponse.json({ error: 'Merchant account is inactive or expired. Please subscribe or activate trial to accept live payments.' }, { status: 403 });
    }

    // 2. If external_ref is provided (e.g. from payment links), check for existing orders
    // NOTE: Subscriptions & renewals are recurring and must NOT be blocked by past verified orders.
    const isSubscriptionOrder = Boolean(note && (note.startsWith('Subscription_') || note.includes('Subscription') || note.includes('Trial_Setup') || note.includes('Autopay_Setup')));

    if (external_ref && !isSubscriptionOrder) {
      const cleanRef = String(external_ref).trim();
      const { data: existingOrders } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('merchant_id', merchant.id)
        .ilike('external_ref', cleanRef)
        .order('created_at', { ascending: false });

      if (existingOrders && existingOrders.length > 0) {
        // If an order with this external_ref was already paid / verified:
        const paidOrder = existingOrders.find(o => o.status === 'verified' || o.status === 'completed' || o.status === 'paid');
        if (paidOrder) {
          const paidTime = new Date(paidOrder.verified_at || paidOrder.created_at).getTime();
          const isPost24h = !isNaN(paidTime) && (Date.now() - paidTime) > (24 * 60 * 60 * 1000);
          if (isPost24h) {
            return NextResponse.json({
              error: 'This payment link has closed and is no longer available.',
              code: 'NOT_FOUND',
              status: 'not_found'
            }, { status: 404 });
          }

          return NextResponse.json({
            error: 'This payment order has already been completed and settled.',
            code: 'ALREADY_PAID',
            status: 'paid',
            orderId: paidOrder.id,
            amount: paidOrder.amount
          }, { status: 400 });
        }

        // Check if matching payment link is expired
        const plToken = cleanRef.split(':')[0];
        const { data: pl } = await supabaseAdmin
          .from('payment_links')
          .select('status, expires_at')
          .or(`token.eq.${plToken},metadata->>custom_ref.eq.${plToken}`)
          .maybeSingle();

        if (pl) {
          const isPlExpired = pl.status === 'expired' || pl.status === 'cancelled' ||
            (pl.expires_at && new Date(pl.expires_at).getTime() < Date.now());
          if (isPlExpired) {
            return NextResponse.json({
              error: 'This payment link has expired and cannot accept payments.',
              code: 'EXPIRED',
              status: 'expired'
            }, { status: 410 });
          }
        }

        // If latest order is still active pending (< 15 mins), reuse it!
        const latestOrder = existingOrders[0];
        const ageMs = Date.now() - new Date(latestOrder.created_at).getTime();
        if (latestOrder.status === 'pending' && ageMs < 15 * 60 * 1000) {
          return NextResponse.json({
            orderId: latestOrder.id,
            order_id: latestOrder.id,
            orderAmount: latestOrder.amount,
            amount: latestOrder.amount,
            status: 'pending',
            mode: latestOrder.mode,
            note: latestOrder.note
          }, { status: 200 });
        }
      }
    } else if (external_ref && isSubscriptionOrder) {
      // For subscription checkouts: if an active pending subscription order exists with same amount within 15 min, reuse it
      const cleanRef = String(external_ref).trim();
      const { data: existingSubOrders } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('merchant_id', merchant.id)
        .ilike('external_ref', cleanRef)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingSubOrders && existingSubOrders.length > 0) {
        const latestPending = existingSubOrders[0];
        const ageMs = Date.now() - new Date(latestPending.created_at).getTime();
        if (ageMs < 15 * 60 * 1000 && Math.abs(parseFloat(latestPending.amount) - numAmount) < 1) {
          return NextResponse.json({
            orderId: latestPending.id,
            order_id: latestPending.id,
            orderAmount: latestPending.amount,
            amount: latestPending.amount,
            status: 'pending',
            mode: latestPending.mode,
            note: latestPending.note
          }, { status: 200 });
        }
      }
    }

    let finalAmount = parseFloat(amount);

    // 3. Auto-cancel: expire all pending orders older than 15 minutes FOR THIS MERCHANT
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('orders')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .eq('merchant_id', merchant.id)
      .lt('created_at', fifteenMinutesAgo);

    // 4. Fetch all active pending orders FOR THIS MERCHANT to ensure a unique amount offset
    const { data: pendingOrders } = await supabaseAdmin
      .from('orders')
      .select('amount')
      .eq('status', 'pending')
      .eq('merchant_id', merchant.id);

    const pendingAmounts = new Set(pendingOrders?.map(o => parseFloat(o.amount).toFixed(2)) || []);

    // 5. Find the first unique amount by adding a paise offset (e.g., 2.00, 2.01, 2.02)
    let offset = 0;
    const requestedAmount = parseFloat(amount);
    while (offset < 100) {
      const candidate = (requestedAmount + offset / 100).toFixed(2);
      if (!pendingAmounts.has(candidate)) {
        finalAmount = parseFloat(candidate);
        break;
      }
      offset++;
    }

    // 6. Generate a cryptographically secure Order ID (Format: MMP_<YYYYMMDD>_<12-char random base62>)
    // E.g. MMP_20260927_8F3kQ9zR2x1A
    let orderId = '';
    const requestedOrderId = (body.order_id || body.orderId || '').trim().replace(/^[-#]+/, '');
    if (requestedOrderId && /^[A-Za-z0-9_-]{4,64}$/.test(requestedOrderId)) {
      orderId = requestedOrderId;
    } else {
      orderId = generateOrderId();
    }

    // 7. Insert order into Supabase linked to the merchant
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert([
        {
          id: orderId,
          merchant_id: merchant.id,
          amount: finalAmount,
          method: method || 'GENERIC',
          note: note || '',
          customer_name: customer_name || '',
          customer_phone: customer_phone || '',
          project: project || merchant.business_name,
          callback_url: callback_url || null,
          external_ref: external_ref || null,
          status: 'pending',
          mode: (isTestFromKey || merchant.sandbox_mode !== false) ? 'test' : 'live'
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting order:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ orderId: data.id, orderAmount: finalAmount, mode: (isTestFromKey || merchant.sandbox_mode !== false) ? 'test' : 'live' }, { status: 201 });
  } catch (err) {
    console.error('API orders error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id') || searchParams.get('order_id') || searchParams.get('ref');

    if (!rawId) {
      return NextResponse.json({ error: 'Order ID or reference is required' }, { status: 400 });
    }

    const cleanId = rawId.trim().replace(/^[-#]+/, '');

    let order = null;
    const res1 = await supabaseAdmin
      .from('orders')
      .select('id, amount, status, note, created_at, verified_at, mode, utr, merchant_id, project, callback_url, external_ref')
      .eq('id', cleanId)
      .maybeSingle();

    if (res1.data) {
      order = res1.data;
    } else {
      // Public receipt identifiers must match literally, never as search patterns.
      const res2 = await supabaseAdmin
        .from('orders')
        .select('id, amount, status, note, created_at, verified_at, mode, utr, merchant_id, project, callback_url, external_ref')
        .eq('external_ref', cleanId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (res2.data) {
        order = res2.data;
      } else if (cleanId.length >= 24) {
        // Fallback lookup: if cleanId is a payment link token
        const { data: pl } = await supabaseAdmin
          .from('payment_links')
          .select('order_id')
          .eq('token', cleanId)
          .maybeSingle();

        if (pl?.order_id) {
          const { data: plOrder } = await supabaseAdmin
            .from('orders')
            .select('id, amount, status, note, created_at, verified_at, mode, utr, merchant_id, project, callback_url, external_ref')
            .eq('id', pl.order_id)
            .maybeSingle();
          if (plOrder) {
            order = plOrder;
          }
        }
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ── Auto-expire pending orders older than 15 minutes ──
    if (order.status === 'pending') {
      const createdAtMs = new Date(order.created_at).getTime();
      const ageMs = Date.now() - createdAtMs;
      if (!isNaN(createdAtMs) && ageMs > 15 * 60 * 1000) {
        await supabaseAdmin
          .from('orders')
          .update({ status: 'expired' })
          .eq('id', order.id);
        order.status = 'expired';
      }
    }

    // ── Check matching payment link status if external_ref is linked ──
    if (order.external_ref && order.status === 'pending') {
      const cleanRef = order.external_ref.split(':')[0];
      const { data: pl } = await supabaseAdmin
        .from('payment_links')
        .select('status, expires_at')
        .or(`token.eq.${cleanRef},metadata->>custom_ref.eq.${cleanRef}`)
        .maybeSingle();

      if (pl) {
        const isPlExpired = pl.status === 'expired' || pl.status === 'cancelled' ||
          (pl.expires_at && new Date(pl.expires_at).getTime() < Date.now());
        if (isPlExpired) {
          await supabaseAdmin.from('orders').update({ status: 'expired' }).eq('id', order.id);
          order.status = 'expired';
        } else if (pl.status === 'paid') {
          order.status = 'paid';
        }
      }
    }

    const paidTime = new Date(order.verified_at || order.created_at).getTime();
    const isPaid = order.status === 'verified' || order.status === 'completed' || order.status === 'paid';
    
    // Automatically ensure payment_links status is synced to paid
    if (isPaid) {
      syncOrderVerificationToPaymentLink(order.id, order.utr).catch(() => {});
    }

    const isPostPaymentExpired = isPaid && !isNaN(paidTime) && (Date.now() - paidTime) > (24 * 60 * 60 * 1000);

    // If order was paid > 24 hours ago, expire the link completely (404 NOT_FOUND)
    if (isPostPaymentExpired) {
      return NextResponse.json({
        error: 'This payment link has closed and is no longer available.',
        code: 'NOT_FOUND',
        status: 'not_found'
      }, {
        status: 404,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
    }

    // Fetch matching merchant branding settings and UPI ID
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('business_name, upi_id, theme_color, bank_account_number, bank_ifsc, bank_account_name, bank_name, enable_bank_transfer')
      .eq('id', order.merchant_id)
      .single();

    if (merchant) {
      if (!merchant.upi_id || merchant.upi_id === 'pending@upi' || !merchant.upi_id.includes('@')) {
        merchant.upi_id = CONFIG.upiId || '9410181307@okbizaxis';
      }
    }

    return NextResponse.json({ 
      orderId: order.id, 
      amount: order.amount, 
      status: order.status, 
      note: order.note,
      mode: order.mode,
      utr: order.utr,
      project: order.project,
      callback_url: order.callback_url,
      external_ref: order.external_ref,
      verified_at: order.verified_at,
      created_at: order.created_at,
      isPostPaymentExpired,
      merchant: merchant || null
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (err) {
    console.error('API get order error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  }
}
