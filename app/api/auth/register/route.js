import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWelcomeEmail, sendAdminNewSignupNotification } from '@/lib/mailer';
import { formatMerchantId } from '@/lib/merchantId';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { validateStrongPassword } from '@/lib/passwordValidation';

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
    const { email, password, businessName, upiId, phone, userId: requestUserId } = await req.json();

    // ── 1. Validate Email & Strong Password format ───────────────────
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    const pwdCheck = validateStrongPassword(password);
    if (!pwdCheck.valid) {
      return NextResponse.json({ error: pwdCheck.error }, { status: 400 });
    }

    // ── 2. Validate & Enforce Mandatory Mobile Phone ─────────────────
    const cleanPhone = (phone || '').toString().trim().replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone) || /^(\d)\1{9}$/.test(cleanPhone)) {
      return NextResponse.json({
        error: 'Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).'
      }, { status: 400 });
    }

    // ── 3. Validate Mandatory Business Name & UPI ID ─────────────────
    if (!businessName || !businessName.trim()) {
      return NextResponse.json({
        error: 'Please enter your Business / Brand Name to complete registration.'
      }, { status: 400 });
    }

    if (!upiId || !upiId.trim() || !upiId.includes('@')) {
      return NextResponse.json({
        error: 'Please enter a valid Settlement UPI ID (e.g. store@upi, merchant@okaxis).'
      }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const finalBusinessName = businessName.trim();
    const finalUpiId = upiId.trim().toLowerCase();

    // ── 4. Verify Email Confirmation (via OTP or Google OAuth) ───────
    let existingUser = null;
    if (requestUserId) {
      const { data: uData } = await supabaseAdmin.auth.admin.getUserById(requestUserId);
      if (uData?.user) {
        existingUser = uData.user;
      }
    }

    if (!existingUser) {
      const { data: userListData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (listError) {
        console.error('[REGISTER API] listUsers error:', listError);
        return NextResponse.json({
          error: 'Authentication service temporarily busy. Please try again in a moment.'
        }, { status: 500 });
      }

      existingUser = userListData?.users?.find(
        u => u.email?.toLowerCase() === cleanEmail
      ) || null;
    }

    const isConfirmed = Boolean(
      existingUser?.email_confirmed_at || 
      existingUser?.app_metadata?.provider === 'google' ||
      existingUser?.identities?.some(id => id.provider === 'google')
    );

    if (!existingUser || !isConfirmed) {
      return NextResponse.json({
        error: `Email address (${cleanEmail}) has not been verified. Please click "Verify" to confirm your email address before registering.`
      }, { status: 400 });
    }

    // ── 5. Check if user is already a completed merchant ────────────
    const { data: existingMerchant } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, upi_id')
      .eq('id', existingUser.id)
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
      .neq('id', existingUser.id)
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
      .neq('id', existingUser.id)
      .limit(1)
      .maybeSingle();

    if (upiConflict) {
      return NextResponse.json({
        error: `Settlement UPI ID "${finalUpiId}" is already registered by another merchant. Please enter your unique UPI address.`,
        code: 'upi_exists',
      }, { status: 409 });
    }

    // ── 6. Update user's credentials and verified metadata ──────────
    const userId = existingUser.id;
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: password,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata || {}),
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

    // ── 9. Dispatch Instant Admin Notification Email ─────────────────
    try {
      await sendAdminNewSignupNotification({
        userEmail: cleanEmail,
        userName: finalBusinessName,
        businessName: finalBusinessName,
        upiId: finalUpiId,
        phone: cleanPhone ? `+91 ${cleanPhone}` : '',
        provider: 'Email & WhatsApp OTP',
        userId,
        createdAt: new Date().toISOString(),
      });
    } catch (adminNotifyErr) {
      console.warn('[REGISTER API] Admin new signup notification notice:', adminNotifyErr?.message);
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
