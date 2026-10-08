import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { identifier } = await req.json();
    if (!identifier || typeof identifier !== 'string') {
      return NextResponse.json({ error: 'Missing identifier' }, { status: 400 });
    }

    const clean = identifier.trim();

    // 1. If already an email, return as-is
    if (clean.includes('@')) {
      return NextResponse.json({ email: clean.toLowerCase() });
    }

    // 2. If it's a Merchant ID (MID-XXXX) or ID prefix
    let merchantId = null;
    if (clean.toUpperCase().startsWith('MID-')) {
      const prefix = clean.slice(4).toLowerCase();
      const { data } = await supabaseAdmin
        .from('merchants')
        .select('id')
        .ilike('id', `${prefix}%`)
        .limit(1);
      if (data && data.length > 0) {
        merchantId = data[0].id;
      }
    } else {
      // Try by exact UUID
      const { data: byId } = await supabaseAdmin
        .from('merchants')
        .select('id')
        .eq('id', clean)
        .limit(1);
      if (byId && byId.length > 0) {
        merchantId = byId[0].id;
      } else {
        // Try by business_name (case-insensitive)
        const { data: byName } = await supabaseAdmin
          .from('merchants')
          .select('id')
          .ilike('business_name', clean)
          .limit(1);
        if (byName && byName.length > 0) {
          merchantId = byName[0].id;
        }
      }
    }

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
    }

    // 3. Retrieve user email from Supabase Auth admin
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(merchantId);
    if (userError || !userData?.user?.email) {
      return NextResponse.json({ error: 'Associated user email not found' }, { status: 404 });
    }

    return NextResponse.json({ email: userData.user.email });
  } catch (err) {
    console.error('Resolve identifier error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
