import { NextResponse } from 'next/server';
import { resolveMerchantIdentifier } from '@/lib/resolveIdentifier';

export async function POST(req) {
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
