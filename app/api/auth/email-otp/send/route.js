import { NextResponse } from 'next/server';
import { supabaseAdmin, supabase } from '@/lib/supabase';
import { sendOtpEmail, sendMagicLinkEmail, isSmtpConfigured } from '@/lib/mailer';
import { resolveMerchantIdentifier } from '@/lib/resolveIdentifier';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req) {
  // VULN-06 fix: Rate limit — max 5 OTP sends per IP per minute
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`auth_otp_${clientIp}`, 5, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many verification requests. Please wait a minute before requesting another code.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
    );
  }

  try {

    const { email, type = 'otp', purpose = 'login' } = await req.json();
    let cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail) {
      return NextResponse.json(
        { error: 'Please enter a valid email or Merchant ID.' },
        { status: 400 }
      );
    }

    // Resolve Merchant ID or UUID to registered email if no '@' provided
    if (!cleanEmail.includes('@')) {
      const resolved = await resolveMerchantIdentifier(cleanEmail);
      if (!resolved) {
        return NextResponse.json(
          { error: `No merchant account found for ID "${cleanEmail}". Please check your ID or enter your registered email.` },
          { status: 404 }
        );
      }
      cleanEmail = resolved;
    }

    // 1. Generate the official Supabase OTP code / magic link for this email
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: cleanEmail,
    });

    if (linkErr) {
      console.error('[EMAIL AUTH API] generateLink error:', linkErr);
      return NextResponse.json(
        { error: linkErr.message || 'Could not generate verification code.' },
        { status: 400 }
      );
    }

    const otpCode = linkData?.properties?.email_otp;
    const actionLink = linkData?.properties?.action_link;

    if (!otpCode && type === 'otp') {
      return NextResponse.json(
        { error: 'Could not generate verification code. Please try again.' },
        { status: 500 }
      );
    }

    // 2. If SMTP / Resend is configured, send the dedicated email
    if (isSmtpConfigured()) {
      if (type === 'link') {
        // Send ONLY the Magic Link email (NO OTP digits)
        await sendMagicLinkEmail({
          to: cleanEmail,
          actionLink,
        });
        return NextResponse.json({
          success: true,
          email: cleanEmail,
          message: `Direct sign-in link sent to ${cleanEmail}. Check your inbox!`,
        });
      } else {
        // Resolve recipient name from merchants profile if available, matching PayPal greeting
        let recipientName = '';
        try {
          const { data: prof } = await supabaseAdmin
            .from('merchants')
            .select('owner_name, business_name')
            .ilike('email', cleanEmail)
            .maybeSingle();
          recipientName = prof?.owner_name || prof?.business_name || '';
        } catch (e) {
          // fallback
        }
        if (!recipientName) {
          const localPart = cleanEmail.split('@')[0];
          if (localPart.toLowerCase().includes('chauhankunal') || localPart.toLowerCase().includes('kunalchauhan')) {
            recipientName = 'Kunal Chauhan';
          } else {
            recipientName = localPart.replace(/[._-]+/g, ' ').replace(/\d+$/, '').trim();
            if (recipientName) {
              recipientName = recipientName.replace(/\b\w/g, (c) => c.toUpperCase());
            }
          }
        }

        // Send PayPal-exact 6-digit OTP verification email
        await sendOtpEmail({
          to: cleanEmail,
          otp: otpCode,
          purpose,
          recipientName,
        });
        return NextResponse.json({
          success: true,
          email: cleanEmail,
          message: `6-digit verification code sent to ${cleanEmail}. Check your inbox!`,
        });
      }
    }

    // 3. Fallback: If custom SMTP is not detected, use Supabase's mailer
    console.warn(`[EMAIL AUTH] Fallback to Supabase mailer. OTP code is: ${otpCode}`);
    
    const { error: signInErr } = await supabase.auth.signInWithOtp({
      email: cleanEmail,
      options: {
        data: { auth_type: type, purpose },
      },
    });

    if (signInErr) {
      console.error('[EMAIL AUTH API] signInWithOtp error:', signInErr);
      return NextResponse.json(
        { error: signInErr.message || 'Rate limit reached. Please wait a minute before requesting another code.' },
        { status: signInErr.status || 429 }
      );
    }

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      message: type === 'link' 
        ? `Direct sign-in link sent to ${cleanEmail}. Check your inbox!`
        : `6-digit verification code sent to ${cleanEmail}. Check your inbox!`,
    });

  } catch (err) {
    console.error('[EMAIL AUTH API] Unexpected error:', err);
    return NextResponse.json(
      { error: err?.message || 'Could not send verification email.' },
      { status: 500 }
    );
  }
}
