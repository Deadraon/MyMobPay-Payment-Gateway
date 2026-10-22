import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { findMerchantByApiKey } from '@/lib/merchantAuth';

export async function GET(req) {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`merchant_fetch_${clientIp}`, 30, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
    );
  }

  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({ error: 'Missing API key' }, { status: 400 });
  }

  try {
    const data = await findMerchantByApiKey(key, 'id, business_name, upi_id, theme_color, subscription_status, subscription_expires_at, bank_account_number, bank_ifsc, bank_account_name, bank_name, enable_bank_transfer');

    if (!data) {
      return NextResponse.json({ error: 'Merchant not found or invalid API key' }, { status: 404 });
    }

    let isSubActive = data.subscription_status === 'active';
    if (isSubActive && data.subscription_expires_at) {
       if (new Date(data.subscription_expires_at) < new Date()) {
           isSubActive = false;
       }
    }

    const isAdminMerchant = data.id === '677d9312-a53f-4b96-815f-53e0eee1b292' || key === CONFIG.platformApiKey;

    if (!isSubActive && !isAdminMerchant) {
      return NextResponse.json({ error: 'Merchant account is inactive or expired' }, { status: 403 });
    }

    // Never return the api_key itself or webhook_urls to the client
    const safeUpiId = (data.upi_id && data.upi_id !== 'pending@upi' && data.upi_id.includes('@')) 
      ? data.upi_id 
      : CONFIG.upiId;

    return NextResponse.json({
      business_name: data.business_name,
      upi_id: safeUpiId,
      theme_color: data.theme_color,
      bank_account_number: data.bank_account_number,
      bank_ifsc: data.bank_ifsc,
      bank_account_name: data.bank_account_name,
      bank_name: data.bank_name,
      enable_bank_transfer: data.enable_bank_transfer !== false
    });

  } catch (err) {
    console.error('Merchant fetch error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
