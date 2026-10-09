export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { generateOrderId } from '@/lib/orderId';

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

    // 1. Authenticate the merchant using the API Key
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, subscription_status, sandbox_mode, subscription_expires_at')
      .eq('api_key', actualKey)
      .single();

    if (merchantError || !merchant) {
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

    let finalAmount = parseFloat(amount);

    // 2. Auto-cancel: expire all pending orders older than 15 minutes FOR THIS MERCHANT
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('orders')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .eq('merchant_id', merchant.id)
      .lt('created_at', fifteenMinutesAgo);

    // 3. Fetch all active pending orders FOR THIS MERCHANT to ensure a unique amount offset
    const { data: pendingOrders } = await supabaseAdmin
      .from('orders')
      .select('amount')
      .eq('status', 'pending')
      .eq('merchant_id', merchant.id);

    const pendingAmounts = new Set(pendingOrders?.map(o => parseFloat(o.amount).toFixed(2)) || []);

    // 4. Find the first unique amount by adding a paise offset (e.g., 2.00, 2.01, 2.02)
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

    // 5. Generate a cryptographically secure Order ID (Format: MMP_<YYYYMMDD>_<12-char random base62>)
    // E.g. MMP_20260927_8F3kQ9zR2x1A
    let orderId = '';
    const requestedOrderId = (body.order_id || body.orderId || '').trim().replace(/^[-#]+/, '');
    if (requestedOrderId && /^[A-Za-z0-9_-]{4,64}$/.test(requestedOrderId)) {
      orderId = requestedOrderId;
    } else {
      orderId = generateOrderId();
    }

    // 6. Insert order into Supabase linked to the merchant
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
    const rawId = searchParams.get('id');

    if (!rawId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
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
    } else if (cleanId !== rawId) {
      const res2 = await supabaseAdmin
        .from('orders')
        .select('id, amount, status, note, created_at, verified_at, mode, utr, merchant_id, project, callback_url, external_ref')
        .eq('id', rawId)
        .maybeSingle();
      order = res2.data;
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const paidTime = new Date(order.verified_at || order.created_at).getTime();
    const isPostPaymentExpired = (order.status === 'verified' || order.status === 'completed' || order.status === 'paid') &&
      !isNaN(paidTime) &&
      (Date.now() - paidTime) > (24 * 60 * 60 * 1000);

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
