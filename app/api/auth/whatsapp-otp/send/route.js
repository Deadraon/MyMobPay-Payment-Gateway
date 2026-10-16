import { NextResponse } from 'next/server';
import { createHash, randomInt } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppOtp, isWhatsAppConfigured } from '@/lib/whatsapp';

// OTP config
const OTP_EXPIRY_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_OTP_PER_HOUR = 5;

function hashOtp(otp, phone) {
  // Salt with phone to prevent rainbow table attacks
  return createHash('sha256').update(`${otp}:${phone}:${process.env.SUPABASE_SERVICE_KEY || 'mymobpay'}`).digest('hex');
}

export async function POST(req) {
  try {
    const { phone, purpose = 'login' } = await req.json();

    // ── Validate phone ──────────────────────────────────────────────
    const cleanPhone = (phone || '').toString().trim().replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid 10-digit Indian mobile number.' },
        { status: 400 }
      );
    }

    const e164Phone = `91${cleanPhone}`;      // WhatsApp needs this format
    const dbPhone   = `+91${cleanPhone}`;     // Stored in DB with +

    // ── Rate limiting: max 5 OTPs per hour per phone ────────────────
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabaseAdmin
      .from('whatsapp_otps')
      .select('*', { count: 'exact', head: true })
      .eq('phone', dbPhone)
      .gte('created_at', oneHourAgo);

    if (recentCount >= MAX_OTP_PER_HOUR) {
      return NextResponse.json(
        { error: 'Too many OTP requests. Please wait 1 hour before trying again.' },
        { status: 429 }
      );
    }

    // ── Resend cooldown: 30s between sends ──────────────────────────
    const cooldownAgo = new Date(Date.now() - RESEND_COOLDOWN_SECONDS * 1000).toISOString();
    const { data: recentOtp } = await supabaseAdmin
      .from('whatsapp_otps')
      .select('created_at')
      .eq('phone', dbPhone)
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
        { error: `Please wait ${secondsLeft} seconds before requesting a new OTP.`, secondsLeft },
        { status: 429 }
      );
    }

    // ── Generate OTP ────────────────────────────────────────────────
    const otp  = randomInt(100000, 999999).toString();
    const hash = hashOtp(otp, dbPhone);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

    // ── Store hashed OTP in Supabase ────────────────────────────────
    const { error: insertError } = await supabaseAdmin
      .from('whatsapp_otps')
      .insert({ phone: dbPhone, otp_hash: hash, purpose, expires_at: expiresAt });

    if (insertError) {
      console.error('[WA OTP SEND] DB insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create OTP session. Please try again.' },
        { status: 500 }
      );
    }

    // ── Send via WhatsApp ───────────────────────────────────────────
    const waConfigured = isWhatsAppConfigured();

    if (waConfigured) {
      try {
        await sendWhatsAppOtp({ toPhone: cleanPhone, otp, expiryMinutes: OTP_EXPIRY_MINUTES });
      } catch (waErr) {
        console.error('[WA OTP SEND] WhatsApp API error:', waErr);
        // Delete the OTP we just stored so user can retry
        await supabaseAdmin.from('whatsapp_otps').delete().eq('phone', dbPhone).eq('otp_hash', hash);
        return NextResponse.json(
          { error: `WhatsApp delivery failed: ${waErr.message}. Please check your WhatsApp API credentials.` },
          { status: 502 }
        );
      }
    } else {
      // ── DEV/DEMO mode: log OTP to console since API isn't configured ──
      console.warn(`[WA OTP DEV MODE] OTP for ${dbPhone}: ${otp} (configure WHATSAPP_ACCESS_TOKEN + WHATSAPP_PHONE_NUMBER_ID to send real messages)`);
    }

    return NextResponse.json({
      success: true,
      message: waConfigured
        ? `OTP sent to your WhatsApp (+91 ${cleanPhone}). Valid for ${OTP_EXPIRY_MINUTES} minutes.`
        : `[DEV MODE] OTP logged to server console. Configure WhatsApp API to send real messages.`,
      dev: !waConfigured,
      phone: `+91 ${cleanPhone}`,
      expiresIn: OTP_EXPIRY_MINUTES * 60,
    });

  } catch (err) {
    console.error('[WA OTP SEND] Unexpected error:', err);
    return NextResponse.json(
      { error: err.message || 'Unexpected server error.' },
      { status: 500 }
    );
  }
}
