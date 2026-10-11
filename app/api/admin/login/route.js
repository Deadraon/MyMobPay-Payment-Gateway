import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { 
  getAdminSettings, 
  verifyTOTP, 
  isAuthorizedAdminUser, 
  createAdminSessionToken,
  DEFAULT_ADMIN_TOTP_SECRET 
} from '@/lib/adminSettings';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

// GET: Check Authenticator configuration status (Safe: NEVER expose secrets publicly)
export async function GET() {
  try {
    const settings = await getAdminSettings();
    return NextResponse.json({
      success: true,
      totpEnabled: settings.totp_enabled !== false
    });
  } catch (e) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// POST: Passwordless Admin Login (Google OAuth SSO OR 6-Digit Dynamic Authenticator Code)
export async function POST(request) {
  try {
    // 0. Rate limiting to protect against brute-force attacks (5 attempts per minute)
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`admin_login_${clientIp}`, 5, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${rateLimit.resetInSeconds} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
        },
        {
          status: 429,
          headers: { 'Retry-After': rateLimit.resetInSeconds.toString() },
        }
      );
    }

    const body = await request.json();
    const { password, totpCode, provider, token } = body;

    // 1. Google OAuth Session Validation (Passwordless SSO)
    if (provider === 'google') {
      if (!token) {
        return NextResponse.json({ error: 'Authorization token is required' }, { status: 400 });
      }

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid Google authentication session' }, { status: 401 });
      }

      const settings = await getAdminSettings();
      if (!isAuthorizedAdminUser(user, settings?.admin_email)) {
        return NextResponse.json({ 
          error: `Google account (${user.email || 'unknown'}) is not registered as an administrator.` 
        }, { status: 403 });
      }

      // Generate signed, stateless admin session token
      const adminToken = createAdminSessionToken();

      return NextResponse.json({ 
        success: true, 
        token: adminToken,
        user: { email: user.email, id: user.id } 
      });
    }

    // 2. Passwordless TOTP Authenticator App Verification (Option 2)
    if (provider === 'totp' || totpCode) {
      const cleanCode = String(totpCode || '').trim();
      if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
        return NextResponse.json({ 
          error: 'Please enter a valid 6-digit Authenticator code.' 
        }, { status: 400 });
      }

      const settings = await getAdminSettings();
      const secret = settings.totp_secret || process.env.ADMIN_TOTP_SECRET || DEFAULT_ADMIN_TOTP_SECRET;

      const isValidTotp = verifyTOTP(secret, cleanCode, 2);
      if (!isValidTotp) {
        return NextResponse.json({ 
          error: 'Invalid 6-digit code. Please enter the current code from your Authenticator app.' 
        }, { status: 401 });
      }

      // Generate signed, stateless admin session token
      const adminToken = createAdminSessionToken();

      return NextResponse.json({ 
        success: true, 
        token: adminToken 
      });
    }



    return NextResponse.json({ 
      error: 'Please enter your 6-digit Authenticator code or sign in with Google.' 
    }, { status: 400 });
  } catch (err) {
    console.error('API admin login error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
