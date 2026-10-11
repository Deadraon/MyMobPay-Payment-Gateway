export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { authenticateMerchant } from '@/lib/merchantAuth';
import {
  generateSecureToken,
  validateAndComputeExpiryMinutes,
  computeExpiresAt,
  parseAmountToPaise,
  paiseToRupees,
  EXPIRY_LIMITS
} from '@/lib/paymentLinks';

/**
 * POST /api/payment-links
 * Create a new expiring payment link
 */
export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`payment_link_create_${clientIp}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded for creating payment links. Please slow down.',
          code: 'RATE_LIMIT_EXCEEDED'
        },
        {
          status: 429,
          headers: { 'Retry-After': rateLimit.resetInSeconds.toString() }
        }
      );
    }

    const body = await request.json().catch(() => ({}));

    // 1. Authenticate the merchant
    const { merchant, error: authError, status: authStatus } = await authenticateMerchant(request, body);
    if (authError || !merchant) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: authStatus || 401 });
    }

    // 2. Validate Link Type
    let linkType = (body.link_type || body.linkType || 'shared').toLowerCase();
    if (!['shared', 'checkout'].includes(linkType)) {
      return NextResponse.json(
        { error: "Invalid link_type. Must be either 'shared' (WhatsApp/SMS/email) or 'checkout' (live QR/checkout page)." },
        { status: 400 }
      );
    }

    // 3. Validate Amount (support both raw amount in rupees and amount_paise)
    let amountInPaise = 0;
    if (body.amount_paise !== undefined && body.amount_paise !== null) {
      amountInPaise = parseAmountToPaise(body.amount_paise, true);
    } else if (body.amount !== undefined && body.amount !== null) {
      amountInPaise = parseAmountToPaise(body.amount, false);
    } else {
      return NextResponse.json(
        { error: 'Payment amount is required.' },
        { status: 400 }
      );
    }

    // Minimum ₹1.00 (100 paise) and Maximum ₹10,00,000 (1,00,000,000 paise)
    if (amountInPaise < 100 || amountInPaise > 100000000) {
      return NextResponse.json(
        { error: 'Amount must be between ₹1.00 and ₹10,00,000.00 (100 to 1,00,000,000 paise).' },
        { status: 400 }
      );
    }

    // 4. Validate and compute expiry in UTC (Server Time only!)
    const expireInRaw = body.expire_in !== undefined ? body.expire_in : (body.expireIn !== undefined ? body.expireIn : body.validity);
    const { valid, minutes, error: expiryError } = validateAndComputeExpiryMinutes(expireInRaw, linkType);

    if (!valid) {
      return NextResponse.json(
        {
          error: expiryError,
          limits: {
            min_minutes: EXPIRY_LIMITS.MIN_MINUTES,
            max_minutes: EXPIRY_LIMITS.MAX_MINUTES,
            presets: Object.keys(EXPIRY_LIMITS.PRESETS)
          }
        },
        { status: 400 }
      );
    }

    const expiresAt = computeExpiresAt(minutes);
    const token = generateSecureToken(24); // 24 bytes hex = 48 chars crypto-secure random
    const nowIso = new Date().toISOString();

    // 5. Derive base public payment domain
    const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const domain = process.env.NEXT_PUBLIC_APP_URL || (hostHeader ? `${proto}://${hostHeader}` : 'https://mymob.tech');
    const paymentUrl = `${domain.replace(/\/+$/, '')}/pay/${token}`;

    // 6. Insert new payment link record
    const { data: newLink, error: dbError } = await supabaseAdmin
      .from('payment_links')
      .insert([
        {
          merchant_id: merchant.id,
          token,
          amount: amountInPaise,
          currency: 'INR',
          title: (body.title || body.purpose || body.note || 'Payment').trim().slice(0, 120),
          description: (body.description || '').trim().slice(0, 500),
          status: 'active',
          link_type: linkType,
          expires_at: expiresAt,
          customer_name: (body.customer_name || body.name || '').trim().slice(0, 100),
          customer_phone: (body.customer_phone || body.phone || '').trim().slice(0, 20),
          redirect_url: body.redirect_url || body.callback_url || null,
          metadata: {
            custom_ref: body.ref || body.reference || null,
            initial_expire_in: minutes,
            created_via: body.created_via || 'api'
          },
          created_at: nowIso,
          updated_at: nowIso
        }
      ])
      .select('*')
      .single();

    if (dbError || !newLink) {
      console.error('[Create Payment Link Error]:', dbError);
      return NextResponse.json(
        { error: dbError?.message || 'Failed to create payment link in database.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        id: newLink.id,
        token: newLink.token,
        payment_url: paymentUrl,
        amount: Number(newLink.amount),
        amount_in_rupees: paiseToRupees(newLink.amount),
        currency: newLink.currency,
        link_type: newLink.link_type,
        status: newLink.status,
        expires_at: newLink.expires_at,
        created_at: newLink.created_at,
        customer_name: newLink.customer_name || null,
        customer_phone: newLink.customer_phone || null
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API Payment Links POST Exception]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/payment-links
 * List payment links for the authenticated merchant
 */
export async function GET(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`payment_link_list_${clientIp}`, 120, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please slow down.' },
        { status: 429 }
      );
    }

    const { merchant, error: authError } = await authenticateMerchant(request);
    if (authError || !merchant) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const statusFilter = (searchParams.get('status') || 'all').toLowerCase();
    const searchQuery = (searchParams.get('search') || '').trim();
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('payment_links')
      .select('*', { count: 'exact' })
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (searchQuery) {
      query = query.or(`token.ilike.%${searchQuery}%,title.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%,customer_phone.ilike.%${searchQuery}%`);
    }

    const { data: links, count, error } = await query;

    if (error) {
      console.error('[API Payment Links GET Error]:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const domain = process.env.NEXT_PUBLIC_APP_URL || (hostHeader ? `${proto}://${hostHeader}` : 'https://mymob.tech');
    const now = Date.now();

    const formattedLinks = (links || []).map((l) => {
      const expiresAtMs = new Date(l.expires_at).getTime();
      const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
      const isPast = now >= expiresAtMs;
      const currentEffectiveStatus = (l.status === 'active' && isPast) ? 'expired' : l.status;

      return {
        id: l.id,
        token: l.token,
        payment_url: `${domain.replace(/\/+$/, '')}/pay/${l.token}`,
        amount: Number(l.amount),
        amount_in_rupees: paiseToRupees(l.amount),
        currency: l.currency,
        title: l.title,
        status: currentEffectiveStatus,
        link_type: l.link_type,
        expires_at: l.expires_at,
        paid_at: l.paid_at,
        expired_at: l.expired_at,
        cancelled_at: l.cancelled_at,
        remaining_seconds: remainingSeconds,
        customer_name: l.customer_name,
        customer_phone: l.customer_phone,
        created_at: l.created_at,
        order_id: l.order_id
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedLinks,
      pagination: {
        total: count || 0,
        page,
        limit,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (err) {
    console.error('[API Payment Links GET Exception]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
