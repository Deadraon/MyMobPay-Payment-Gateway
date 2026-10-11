export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { CONFIG } from '@/lib/config';
import { generateOrderId } from '@/lib/orderId';
import {
  isLinkUsable,
  paiseToRupees,
  transitionLinkToProcessing
} from '@/lib/paymentLinks';

/**
 * GET /api/pay/[token]
 * Resolves a public payment link using the central isLinkUsable check.
 * Zero information leak on invalid tokens.
 * Returns 410 on expired/cancelled, 200 on paid, 200 on active.
 */
export async function GET(request, { params }) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`pay_token_view_${clientIp}`, 100, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a moment.' },
        { status: 429, headers: { 'Retry-After': rateLimit.resetInSeconds.toString() } }
      );
    }

    const token = params?.token?.trim();
    // Validate token format (hex string >= 48 chars)
    if (!token || !/^[0-9a-fA-F]{48,}$/.test(token)) {
      return NextResponse.json({ error: 'Payment link not found.' }, { status: 404 });
    }

    // 1. Fetch link from database
    const { data: link, error: linkErr } = await supabaseAdmin
      .from('payment_links')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (linkErr || !link) {
      // 404 with no information leak
      return NextResponse.json({ error: 'Payment link not found.' }, { status: 404 });
    }

    // 2. Run central usability check
    const usability = isLinkUsable(link);

    // 3. Fetch public-safe merchant profile
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('business_name, upi_id, theme_color, enable_bank_transfer, bank_account_name, bank_name, bank_account_number, bank_ifsc')
      .eq('id', link.merchant_id)
      .single();

    const safeMerchantName = merchant?.business_name || 'Verified Merchant';
    const safeUpiId = (merchant?.upi_id && merchant.upi_id !== 'pending@upi' && merchant.upi_id.includes('@'))
      ? merchant.upi_id
      : (CONFIG.upiId || '9410181307@okbizaxis');

    // 4. Handle Unusable Cases (Expired, Cancelled, Already Paid, Not Found)
    if (!usability.usable) {
      if (usability.code === 'EXPIRED' || usability.code === 'CANCELLED') {
        return NextResponse.json(
          {
            error: usability.message,
            code: usability.code,
            merchant_name: safeMerchantName,
            status: link.status,
            expires_at: link.expires_at,
            expired_at: link.expired_at || link.expires_at
          },
          { status: 410 } // HTTP 410 Gone
        );
      }

      if (usability.code === 'PAID') {
        return NextResponse.json(
          {
            error: usability.message,
            code: 'PAID',
            merchant_name: safeMerchantName,
            status: 'paid',
            paid_at: link.paid_at,
            amount: Number(link.amount),
            amount_in_rupees: paiseToRupees(link.amount),
            title: link.title
          },
          { status: 200 }
        );
      }

      if (usability.code === 'PROCESSING') {
        return NextResponse.json(
          {
            error: usability.message,
            code: 'PROCESSING',
            merchant_name: safeMerchantName,
            status: 'processing'
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: usability.message }, { status: usability.httpStatus || 404 });
    }

    // 5. Active Link — Return sanitized public checkout information
    const now = Date.now();
    const expiresAtMs = new Date(link.expires_at).getTime();
    const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));

    return NextResponse.json(
      {
        success: true,
        token: link.token,
        amount: Number(link.amount),
        amount_in_rupees: paiseToRupees(link.amount),
        currency: link.currency || 'INR',
        title: link.title || 'Direct Payment',
        description: link.description || '',
        customer_name: link.customer_name || '',
        customer_phone: link.customer_phone || '',
        link_type: link.link_type,
        status: 'active',
        expires_at: link.expires_at,
        remaining_seconds: remainingSeconds,
        merchant: {
          business_name: safeMerchantName,
          upi_id: safeUpiId,
          theme_color: merchant?.theme_color || '#2563EB',
          bank_account_number: merchant?.bank_account_number ? `...${String(merchant.bank_account_number).slice(-4)}` : null,
          bank_name: merchant?.bank_name || null,
          bank_ifsc: merchant?.bank_ifsc || null
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      }
    );
  } catch (err) {
    console.error('[API Pay Token GET Error]:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * POST /api/pay/[token]
 * Starts payment execution:
 * Atomically transitions link to 'processing' so cron cannot expire it mid-payment.
 * Creates an order record if not already created.
 */
export async function POST(request, { params }) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`pay_token_start_${clientIp}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many payment requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const token = params?.token?.trim();
    if (!token || !/^[0-9a-fA-F]{48,}$/.test(token)) {
      return NextResponse.json({ error: 'Payment link not found.' }, { status: 404 });
    }

    // 1. Fetch link
    const { data: link, error: linkErr } = await supabaseAdmin
      .from('payment_links')
      .select('*')
      .eq('token', token)
      .single();

    if (linkErr || !link) {
      return NextResponse.json({ error: 'Payment link not found.' }, { status: 404 });
    }

    // 2. Central usability check
    const usability = isLinkUsable(link);
    if (!usability.usable) {
      return NextResponse.json(
        { error: usability.message, code: usability.code },
        { status: usability.httpStatus || 400 }
      );
    }

    // 3. Generate Order ID
    const orderId = link.order_id || generateOrderId();
    const amountInRupees = parseFloat(paiseToRupees(link.amount));

    // 4. Atomically set status to 'processing' (only if still active and not expired)
    const transitionResult = await transitionLinkToProcessing(token, orderId);
    if (!transitionResult.success) {
      return NextResponse.json(
        {
          error: transitionResult.error || 'Payment link expired or is no longer active.',
          code: 'TRANSITION_FAILED'
        },
        { status: 410 }
      );
    }

    // 5. Create or sync order record in public.orders
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .maybeSingle();

    if (!existingOrder) {
      await supabaseAdmin
        .from('orders')
        .insert([
          {
            id: orderId,
            merchant_id: link.merchant_id,
            amount: amountInRupees,
            method: 'UPI',
            note: link.title || 'Payment Link Checkout',
            customer_name: link.customer_name || '',
            customer_phone: link.customer_phone || '',
            external_ref: `pl_${link.token.slice(0, 12)}`,
            status: 'pending',
            mode: 'live'
          }
        ]);
    }

    // 6. Fetch merchant VPA
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('business_name, upi_id, theme_color')
      .eq('id', link.merchant_id)
      .single();

    const safeUpiId = (merchant?.upi_id && merchant.upi_id !== 'pending@upi' && merchant.upi_id.includes('@'))
      ? merchant.upi_id
      : (CONFIG.upiId || '9410181307@okbizaxis');

    return NextResponse.json({
      success: true,
      order_id: orderId,
      amount: Number(link.amount),
      amount_in_rupees: amountInRupees.toFixed(2),
      status: 'processing',
      merchant_upi: safeUpiId,
      merchant_name: merchant?.business_name || 'MyMobPay Merchant'
    });

  } catch (err) {
    console.error('[API Pay Token POST Error]:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
