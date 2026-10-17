import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/mailer';
import { formatMerchantId } from '@/lib/merchantId';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req) {
  // Rate limit: max 10 register attempts per IP per minute
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`auth_register_${clientIp}`, 10, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please wait a minute and try again.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
    );
  }

  try {
    // Validate the requester's session before using administrative privileges.
    const accessToken = req.headers.get('authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!accessToken) {
      return NextResponse.json({ error: 'Please verify your email and sign in before registering.' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ error: 'Your session is invalid or expired. Please verify your email again.' }, { status: 401 });
    }
    if (!user.email || !user.email_confirmed_at) {
      return NextResponse.json({ error: 'Please verify your email before registering.' }, { status: 403 });
    }

    const { email, password, businessName, upiId, phone } = await req.json();

    // ── 1. Validate Email & Password format ─────────────────────────
    if (typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    // ── 2. Validate & Enforce Mandatory WhatsApp Phone ──────────────
    const cleanPhone = (phone || '').toString().trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json({
        error: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).'
      }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== user.email.trim().toLowerCase()) {
      return NextResponse.json({ error: 'Registration email must match your verified account.' }, { status: 403 });
    }
    const userId = user.id;
    const finalBusinessName = (businessName && businessName.trim()) ? businessName.trim() : (cleanEmail.split('@')[0] || 'My Merchant Store');
    const finalUpiId = (upiId && upiId.includes('@')) ? upiId.trim() : `${cleanEmail.split('@')[0]}@upi`;

    // ── 3. Enforce WhatsApp OTP Verification ────────────────────────
    const dbPhone = `+91${cleanPhone}`;
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: verifiedWaOtp, error: waOtpError } = await supabaseAdmin
      .from('whatsapp_otps')
      .select('id, verified, created_at')
      .eq('phone', dbPhone)
      .eq('verified', true)
      .gte('created_at', thirtyMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (waOtpError) {
      console.error('[REGISTER API] WhatsApp OTP verification check error:', waOtpError);
    }

    if (!verifiedWaOtp) {
      return NextResponse.json({
        error: `Mobile number (+91 ${cleanPhone}) has not been verified via WhatsApp OTP. Please verify your mobile number with the OTP sent to your WhatsApp to complete registration.`
      }, { status: 400 });
    }

    // ── 5. Check if user is already a completed merchant ────────────
    const { data: existingMerchant } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, upi_id')
      .eq('id', userId)
      .maybeSingle();

    if (
      existingMerchant &&
      existingMerchant.business_name &&
      existingMerchant.business_name !== 'My Business' &&
      existingMerchant.upi_id &&
      existingMerchant.upi_id !== 'pending@upi'
    ) {
      return NextResponse.json({
        error: 'An account with this email is already registered and active. Please click "Log In" above.',
        code: 'email_exists',
      }, { status: 400 });
    }

    // ── 5b. Check if Phone Number is already registered ─────────────
    const { data: phoneConflict } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .or(`phone_number.eq.${cleanPhone},phone_number.eq.+91${cleanPhone},phone_number.eq.91${cleanPhone}`)
      .neq('id', userId)
      .limit(1)
      .maybeSingle();

    if (phoneConflict) {
      return NextResponse.json({
        error: 'This WhatsApp mobile number is already registered to another account. Please use a different number or log in.',
        code: 'phone_exists',
      }, { status: 409 });
    }

    // ── 5c. Check if Settlement UPI ID is already registered ────────
    const { data: upiConflict } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .ilike('upi_id', finalUpiId)
      .neq('upi_id', 'pending@upi')
      .neq('id', userId)
      .limit(1)
      .maybeSingle();

    if (upiConflict) {
      return NextResponse.json({
        error: `Settlement UPI ID "${finalUpiId}" is already registered by another merchant. Please enter your unique UPI address.`,
        code: 'upi_exists',
      }, { status: 409 });
    }

    // ── 6. Update user's credentials and verified metadata ──────────
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password,
      user_metadata: {
        ...(user.user_metadata || {}),
        business_name: finalBusinessName,
        upi_id: finalUpiId,
        phone: cleanPhone,
        phone_verified: true,
        email_verified: true,
      },
    });

    if (updateErr) {
      console.error('[REGISTER API] User update error:', updateErr);
      return NextResponse.json({
        error: updateErr.message || 'Could not complete registration. Please sign in.',
      }, { status: 400 });
    }

    // ── 7. Insert / Upsert merchant profile in public.merchants ──────
    const { error: merchantError } = await supabaseAdmin
      .from('merchants')
      .upsert({
        id: userId,
        business_name: finalBusinessName,
        upi_id: finalUpiId,
        phone_number: cleanPhone,
        phone_verified: true,
        subscription_status: 'inactive',
        sandbox_mode: true,
        theme_color: '#3B82F6',
      }, { onConflict: 'id' });

    if (merchantError) {
      console.error('[REGISTER API] Merchant profile upsert warning:', merchantError);
    }

    // ── 8. Dispatch Welcome & Merchant Credentials Email ────────────
    try {
      const mid = formatMerchantId(userId);
      await sendWelcomeEmail({
        to: cleanEmail,
        businessName: finalBusinessName,
        upiId: finalUpiId,
        mid,
      });
    } catch (welcomeErr) {
      console.warn('[REGISTER API] Welcome email send notice:', welcomeErr?.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Account verified and registered successfully! Logging you in...',
      userId,
    });

  } catch (err) {
    console.error('[REGISTER API] Unexpected exception:', err);
    const detailedError = err?.message || err?.cause?.message || 'An unexpected error occurred during registration.';
    return NextResponse.json({
      error: `Registration Error: ${detailedError}`,
      cause: err?.cause?.toString() || undefined,
    }, { status: 500 });
  }
}
