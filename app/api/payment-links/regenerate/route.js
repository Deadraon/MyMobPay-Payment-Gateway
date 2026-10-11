export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { authenticateMerchant } from '@/lib/merchantAuth';
import { regeneratePaymentLink, paiseToRupees } from '@/lib/paymentLinks';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`regenerate_link_${clientIp}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { token, expire_in } = body;

    if (!token) {
      return NextResponse.json({ error: 'Original payment link token is required.' }, { status: 400 });
    }

    // Authenticate the merchant
    const { merchant, error: authError, status: authStatus } = await authenticateMerchant(request, body);
    if (authError || !merchant) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: authStatus || 401 });
    }

    // Regenerate link: generates a brand new token, keeps original link dead
    const result = await regeneratePaymentLink(token, merchant.id, expire_in);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    const domain = process.env.NEXT_PUBLIC_APP_URL || (hostHeader ? `${proto}://${hostHeader}` : 'https://mymob.tech');
    const paymentUrl = `${domain.replace(/\/+$/, '')}/pay/${result.newLink.token}`;

    return NextResponse.json({
      success: true,
      message: 'New payment link generated successfully. Original link remains expired/closed.',
      payment_url: paymentUrl,
      token: result.newLink.token,
      amount: Number(result.newLink.amount),
      amount_in_rupees: paiseToRupees(result.newLink.amount),
      currency: result.newLink.currency,
      status: result.newLink.status,
      expires_at: result.newLink.expires_at,
      created_at: result.newLink.created_at
    });
  } catch (err) {
    console.error('[API Regenerate Payment Link Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
