import { NextResponse } from 'next/server';
import { resolveMerchantIdentifier } from '@/lib/resolveIdentifier';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req) {
  // VULN-06 fix: Rate limit — max 20 identifier lookups per IP per minute
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`resolve_id_${clientIp}`, 20, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment before trying again.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
    );
  }

  try {
    const { identifier } = await req.json();
    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
    }

    const email = await resolveMerchantIdentifier(identifier);
    if (!email) {
      return NextResponse.json({ error: 'Merchant account or registered email not found' }, { status: 404 });
    }

    return NextResponse.json({ email });
  } catch (err) {
    console.error('Resolve identifier error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

