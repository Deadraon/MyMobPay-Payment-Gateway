import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

const MAX_ATTEMPTS = 5;

function hashOtp(otp, phone) {
  return createHash('sha256').update(`${otp}:${phone}:${process.env.SUPABASE_SERVICE_KEY || 'mymobpay'}`).digest('hex');
}

export async function POST(req) {
  try {
    const { phone, otp, purpose = 'login' } = await req.json();

    // ── Validate inputs ─────────────────────────────────────────────
    const cleanPhone = (phone || '').toString().trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({ error: 'Invalid phone number.' }, { status: 400 });
    }

    const cleanOtp = (otp || '').toString().trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json({ error: 'OTP must be exactly 6 digits.' }, { status: 400 });
    }

    const dbPhone = `+91${cleanPhone}`;

    // ── Find the latest unverified, non-expired OTP ─────────────────
    const { data: otpRecord, error: fetchError } = await supabaseAdmin
      .from('whatsapp_otps')
      .select('*')
      .eq('phone', dbPhone)
      .eq('purpose', purpose)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: 'OTP has expired or was not found. Please request a new one.' },
        { status: 400 }
      );
    }

    // ── Check attempt limit ─────────────────────────────────────────
    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await supabaseAdmin.from('whatsapp_otps').delete().eq('id', otpRecord.id);
      return NextResponse.json(
        { error: 'Too many incorrect attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }

    // ── Verify hash ─────────────────────────────────────────────────
    const expectedHash = hashOtp(cleanOtp, dbPhone);
    if (otpRecord.otp_hash !== expectedHash) {
      // Increment attempts
      await supabaseAdmin
        .from('whatsapp_otps')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      const remaining = MAX_ATTEMPTS - otpRecord.attempts - 1;
      return NextResponse.json(
        {
          error: remaining > 0
            ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
            : 'Incorrect OTP. No attempts remaining. Please request a new OTP.',
          remaining,
        },
        { status: 400 }
      );
    }

    // ── OTP is valid — mark as verified ────────────────────────────
    await supabaseAdmin
      .from('whatsapp_otps')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    // ── Find or create the merchant account ────────────────────────
    // Look up merchant by phone
    const { data: merchant, error: merchantFetchErr } = await supabaseAdmin
      .from('merchants')
      .select('id, phone_number, phone_verified')
      .or(`phone_number.eq.${cleanPhone},phone_number.eq.${dbPhone},phone_number.eq.91${cleanPhone}`)
      .limit(1)
      .maybeSingle();

    if (merchantFetchErr) {
      console.error('[WA OTP VERIFY] Merchant lookup error:', merchantFetchErr);
    }

    if (!merchant) {
      // No account linked to this phone — return a token indicating verification success
      // but account doesn't exist (frontend will show signup prompt)
      return NextResponse.json({
        success: true,
        verified: true,
        accountExists: false,
        phone: dbPhone,
        message: purpose === 'signup' ? 'WhatsApp number verified successfully!' : 'Phone verified! No account found. Please complete signup.',
      });
    }

    // ── Mark phone as verified in merchant record ───────────────────
    if (!merchant.phone_verified) {
      await supabaseAdmin
        .from('merchants')
        .update({ phone_verified: true })
        .eq('id', merchant.id);
    }

    // ── Generate Supabase magiclink token for seamless client sign-in ─
    let userEmail = null;
    let tokenHash = null;
    let actionLink = null;
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(merchant.id);
      userEmail = userData?.user?.email || null;
      if (userEmail) {
        const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
          type: 'magiclink',
          email: userEmail,
        });
        tokenHash = linkData?.properties?.hashed_token || null;
        actionLink = linkData?.properties?.action_link || null;
      }
    } catch (linkEx) {
      console.warn('[WA OTP VERIFY] generateLink warning:', linkEx?.message);
    }

    // Short-lived session token (HMAC signed)
    const sessionPayload = {
      merchantId: merchant.id,
      email: userEmail,
      phone: dbPhone,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
    };

    const { createHmac } = await import('crypto');
    const payloadStr = JSON.stringify(sessionPayload);
    const sig = createHmac('sha256', process.env.SUPABASE_SERVICE_KEY || 'mymobpay-secret')
      .update(payloadStr)
      .digest('hex');
    const sessionToken = Buffer.from(payloadStr).toString('base64url') + '.' + sig;

    return NextResponse.json({
      success: true,
      verified: true,
      accountExists: true,
      merchantId: merchant.id,
      email: userEmail,
      phone: dbPhone,
      tokenHash,
      actionLink,
      sessionToken,
      message: 'WhatsApp OTP verified! Signing you in...',
    });

  } catch (err) {
    console.error('[WA OTP VERIFY] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Unexpected server error during OTP verification.' },
      { status: 500 }
    );
  }
}
