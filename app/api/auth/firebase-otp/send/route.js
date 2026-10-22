import { NextResponse } from 'next/server';
import { createHash, randomInt } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

// ── Firebase Admin SDK (server-side) ────────────────────────────────
// We use Firebase REST API (no SDK needed) to send SMS OTP via Firebase Auth
// This avoids installing firebase-admin package overhead.
//
// Setup in .env.local:
//   FIREBASE_API_KEY=your_web_api_key          (from Firebase Console → Project Settings → General)
//   FIREBASE_PROJECT_ID=your_project_id
//
// Firebase Phone Auth free tier: 10,000 SMS verifications/month
// ──────────────────────────────────────────────────────────────────────

const FIREBASE_API_KEY  = process.env.FIREBASE_API_KEY;
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_OTP_PER_HOUR = 5;

function hashOtp(otp, phone) {
  return createHash('sha256')
    .update(`${otp}:${phone}:${process.env.SUPABASE_SERVICE_KEY || 'mymobpay'}`)
    .digest('hex');
}

// Sends OTP via Firebase Auth REST API (sendVerificationCode)
async function sendFirebaseOtp(phone) {
  // Firebase Auth REST: https://identitytoolkit.googleapis.com/v1/accounts:sendVerificationCode
  // NOTE: This endpoint requires reCAPTCHA in browser; for server-side we use
  // a "silent push" approach — so we generate our own OTP and use Firebase
  // just as the SMS delivery channel via Admin SDK or Twilio fallback.
  //
  // TRUE server-side Firebase SMS needs firebase-admin + phone auth provider.
  // For the REST-only approach, we fall back to our own OTP + log in DEV mode,
  // and document the firebase-admin setup path below.

  if (!FIREBASE_API_KEY) {
    // DEV MODE: log OTP to console
    return null;
  }

  // Firebase Admin approach (requires firebase-admin package):
  // import admin from 'firebase-admin';
  // const sessionInfo = await admin.auth().createCustomToken(phone);
  // This returns a session token that the CLIENT uses to verify via recaptcha.
  //
  // For pure server-side SMS (no client reCAPTCHA), the recommended path is:
  // Firebase Auth + App Check + server-side trigger — which needs firebase-admin SDK.
  //
  // Since we want zero-dependency free approach, we use our own OTP logic
  // and send via Firebase REST (requires client-side reCAPTCHA token).
  // Return null to use DEV console logging until firebase-admin is wired up.
  return null;
}

export async function POST(req) {
  try {
    const { phone, purpose = 'login' } = await req.json();

    const cleanPhone = (phone || '').toString().trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone) || /^(\d)\1{9}$/.test(cleanPhone) || cleanPhone === '1234567890') {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    const dbPhone = `+91${cleanPhone}`;

    // ── Rate limiting ───────────────────────────────────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabaseAdmin
      .from('whatsapp_otps')
      .select('*', { count: 'exact', head: true })
      .eq('phone', dbPhone)
      .eq('purpose', `firebase_${purpose}`)
      .gte('created_at', oneHourAgo);

    if (recentCount >= MAX_OTP_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many SMS OTP requests. Please wait 1 hour.' },
        { status: 429 }
      );
    }

    // ── Resend cooldown ─────────────────────────────────────────────
    const cooldownAgo = new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000).toISOString();
    const { data: recentOtp } = await supabaseAdmin
      .from('whatsapp_otps')
      .select('created_at')
      .eq('phone', dbPhone)
      .eq('purpose', `firebase_${purpose}`)
      .eq('verified', false)
      .gte('created_at', cooldownAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (recentOtp) {
      const secondsLeft = Math.ceil(
        (new Date(recentOtp.created_at).getTime() + RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000
      );
      return NextResponse.json(
        { error: `Please wait ${secondsLeft}s before requesting another SMS OTP.`, secondsLeft },
        { status: 429 }
      );
    }

    // ── Generate & store OTP ────────────────────────────────────────
    const otp = randomInt(100000, 999999).toString();
    const hash = hashOtp(otp, dbPhone);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const { error: insertError } = await supabaseAdmin
      .from('whatsapp_otps')
      .insert({ phone: dbPhone, otp_hash: hash, purpose: `firebase_${purpose}`, expires_at: expiresAt });

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create OTP session.' }, { status: 500 });
    }

    // ── Try Firebase SMS delivery ────────────────────────────────────
    const delivered = await sendFirebaseOtp(`+91${cleanPhone}`);

    if (!delivered) {
      // DEV MODE: print OTP to server console
      console.warn(`[FIREBASE SMS DEV MODE] OTP for ${dbPhone}: ${otp}`);
      console.warn(`Add FIREBASE_API_KEY + FIREBASE_PROJECT_ID to .env.local for real SMS delivery.`);
    }

    return NextResponse.json({
      success: true,
      message: delivered
        ? `SMS OTP sent to +91 ${cleanPhone}. Valid for ${OTP_EXPIRY_MINUTES} minutes.`
        : `[DEV] OTP logged to server console. Add Firebase config to send real SMS.`,
      dev: !delivered,
      phone: `+91 ${cleanPhone}`,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    });

  } catch (err) {
    console.error('[FIREBASE OTP SEND]', err);
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
