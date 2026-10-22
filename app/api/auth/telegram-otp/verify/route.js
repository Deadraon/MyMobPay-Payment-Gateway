import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

const MAX_ATTEMPTS = 5;

function hashOtp(otp, identifier) {
  return createHash('sha256')
    .update(`${otp}:${identifier}:${process.env.SUPABASE_SERVICE_KEY || 'mymobpay'}`)
    .digest('hex');
}

export async function POST(req) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`tg_verify_ip_${clientIp}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait a minute before retrying.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
      );
    }
    const { telegramUsername, otp, purpose = 'login' } = await req.json();

    const identifier = (telegramUsername || '').toString().trim().replace(/^@/, '').toLowerCase();
    if (!identifier || identifier.length < 3) {
      return NextResponse.json({ error: 'Invalid Telegram username.' }, { status: 400 });
    }

    const cleanOtp = (otp || '').toString().trim();
    if (!/^\d{6}$/.test(cleanOtp)) {
      return NextResponse.json({ error: 'OTP must be exactly 6 digits.' }, { status: 400 });
    }

    const dbKey = `tg:${identifier}`;

    // Find latest valid OTP
    const { data: otpRecord } = await supabaseAdmin
      .from('whatsapp_otps')
      .select('*')
      .eq('phone', dbKey)
      .eq('purpose', `telegram_${purpose}`)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'OTP expired or not found. Please request a new one.' },
        { status: 400 }
      );
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await supabaseAdmin.from('whatsapp_otps').delete().eq('id', otpRecord.id);
      return NextResponse.json(
        { error: 'Too many wrong attempts. Please request a new OTP.' },
        { status: 400 }
      );
    }

    const expectedHash = hashOtp(cleanOtp, dbKey);
    if (otpRecord.otp_hash !== expectedHash) {
      await supabaseAdmin
        .from('whatsapp_otps')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      const remaining = MAX_ATTEMPTS - otpRecord.attempts - 1;
      return NextResponse.json(
        {
          error: remaining > 0
            ? `Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
            : 'No attempts remaining. Please request a new OTP.',
          remaining,
        },
        { status: 400 }
      );
    }

    // OTP correct
    await supabaseAdmin.from('whatsapp_otps').update({ verified: true }).eq('id', otpRecord.id);

    // Look up merchant by telegram_username in metadata or phone field
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, telegram_username')
      .eq('telegram_username', identifier)
      .single();

    if (!merchant) {
      return NextResponse.json({
        success: true,
        verified: true,
        accountExists: false,
        telegramUsername: `@${identifier}`,
        message: 'Telegram verified! No account linked. Please sign up or link your Telegram.',
      });
    }

    // Generate session token
    const { createHmac } = await import('crypto');
    const sessionPayload = JSON.stringify({
      merchantId: merchant.id,
      telegramUsername: identifier,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
    });
    const sig = createHmac('sha256', process.env.SUPABASE_SERVICE_KEY || 'mymobpay-secret')
      .update(sessionPayload)
      .digest('hex');
    const sessionToken = Buffer.from(sessionPayload).toString('base64url') + '.' + sig;

    return NextResponse.json({
      success: true,
      verified: true,
      accountExists: true,
      merchantId: merchant.id,
      sessionToken,
      message: 'Telegram OTP verified! Signing you in...',
    });

  } catch (err) {
    console.error('[TELEGRAM OTP VERIFY]', err);
    return NextResponse.json({ error: err.message || 'Server error.' }, { status: 500 });
  }
}
