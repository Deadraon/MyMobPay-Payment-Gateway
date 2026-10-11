export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { authenticateMerchant } from '@/lib/merchantAuth';
import { transitionLinkToCancelled } from '@/lib/paymentLinks';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`cancel_link_${clientIp}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 });
    }

    const body = await request.json().catch(() => ({}));
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Payment link token is required.' }, { status: 400 });
    }

    // Authenticate the merchant
    const { merchant, error: authError, status: authStatus } = await authenticateMerchant(request, body);
    if (authError || !merchant) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: authStatus || 401 });
    }

    // Cancel the link (atomically checks merchant ownership and active status)
    const result = await transitionLinkToCancelled(token, merchant.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment link successfully cancelled.',
      link: {
        token: result.link.token,
        status: result.link.status,
        cancelled_at: result.link.cancelled_at
      }
    });
  } catch (err) {
    console.error('[API Cancel Payment Link Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
