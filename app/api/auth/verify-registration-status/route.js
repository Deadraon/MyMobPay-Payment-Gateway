import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { DEFAULT_ADMIN_EMAILS, PLATFORM_ADMIN_USER_ID } from '@/lib/adminSettings';
import { logAdminAction } from '@/lib/adminAudit';

/**
 * POST /api/auth/verify-registration-status
 * Verifies whether an authenticated account (e.g. Google OAuth or session token)
 * is authorized to access the merchant console and ensures merchant profile provisioning.
 *
 * Rules:
 * 1. Platform Admins (chauhankunal695@gmail.com, deadraon@gmail.com, deadraon1@gmail.com) are ALWAYS allowed immediately.
 * 2. Existing merchants (even with partial profiles) are granted access.
 * 3. Fresh Google OAuth sign-ins are auto-provisioned with a 3-day trial profile and welcomed into onboarding.
 * 4. Never unilaterally delete merchant records or force signouts on authentic users.
 */
export async function POST(req) {
  try {
    const { userId, email } = await req.json();

    if (!userId && !email) {
      return NextResponse.json(
        { allowed: false, registered: false, error: 'User identifier or email required.' },
        { status: 400 }
      );
    }

    const cleanEmail = (email || '').toString().trim().toLowerCase();

    // ── 1. Fast-path: Unconditional access for Platform Admins ────────────────
    const isPlatformAdmin =
      (userId && userId === PLATFORM_ADMIN_USER_ID) ||
      (cleanEmail && DEFAULT_ADMIN_EMAILS.some(adm => adm.toLowerCase() === cleanEmail));

    if (isPlatformAdmin) {
      logAdminAction({
        actor: { id: userId || PLATFORM_ADMIN_USER_ID, email: cleanEmail, role: 'super_admin' },
        action: 'auth.admin_login',
        targetType: 'user',
        targetId: userId || PLATFORM_ADMIN_USER_ID,
        details: { method: 'Google OAuth / Session Token', provider: 'google', email: cleanEmail },
        request: req
      }).catch(() => {});

      return NextResponse.json({
        allowed: true,
        registered: true,
        isAdmin: true,
        email: cleanEmail,
        merchantId: userId || PLATFORM_ADMIN_USER_ID,
        businessName: 'MyMobPay Platform Admin',
      });
    }

    // ── 2. Check if a merchant profile already exists for this userId ─────────
    let merchant = null;
    if (userId) {
      const { data: mById, error: errById } = await supabaseAdmin
        .from('merchants')
        .select('id, business_name, upi_id, phone_number, phone_verified, subscription_status')
        .eq('id', userId)
        .maybeSingle();

      if (!errById && mById) {
        merchant = mById;
      }
    }

    // ── 3. Check by Email across auth users if not found by direct userId ────
    if (!merchant && cleanEmail) {
      const { data: userListData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      const matchedUsers = userListData?.users?.filter(
        u => u.email?.toLowerCase() === cleanEmail
      ) || [];

      for (const u of matchedUsers) {
        const { data: mByMatchedUser } = await supabaseAdmin
          .from('merchants')
          .select('id, business_name, upi_id, phone_number, phone_verified, subscription_status')
          .eq('id', u.id)
          .maybeSingle();

        if (mByMatchedUser) {
          merchant = mByMatchedUser;
          break;
        }
      }
    }

    // ── 4. Existing Merchant ────────────────────────────────────────────────
    if (merchant) {
      const cleanPhone = (merchant.phone_number || '').trim().replace(/\D/g, '');
      const hasValidPhone = Boolean(
        cleanPhone.length === 10 &&
        /^[6-9]\d{9}$/.test(cleanPhone) &&
        !/^(\d)\1{9}$/.test(cleanPhone)
      );
      const hasValidUpi = Boolean(
        merchant.upi_id && 
        merchant.upi_id !== 'pending@upi' && 
        merchant.upi_id.includes('@')
      );
      const hasValidBusiness = Boolean(
        merchant.business_name && 
        merchant.business_name.trim().length > 0 && 
        merchant.business_name !== 'My Business'
      );

      const isComplete = Boolean(hasValidPhone && hasValidUpi && hasValidBusiness);

      if (isComplete) {
        logAdminAction({
          actor: { id: merchant.id, email: cleanEmail, role: 'merchant' },
          action: 'auth.login_success',
          targetType: 'merchant',
          targetId: merchant.id,
          details: { businessName: merchant.business_name, provider: 'Google OAuth / Session' },
          request: req
        }).catch(() => {});

        return NextResponse.json({
          allowed: true,
          registered: true,
          isComplete: true,
          needsRegistration: false,
          email: cleanEmail,
          merchantId: merchant.id,
          businessName: merchant.business_name,
          phoneNumber: merchant.phone_number,
          phoneVerified: true,
        });
      }

      // If merchant record exists but lacks phone or UPI or real business name, require registration completion
      return NextResponse.json({
        allowed: true,
        registered: false,
        isComplete: false,
        needsRegistration: true,
        email: cleanEmail,
        merchantId: merchant.id,
        businessName: hasValidBusiness ? merchant.business_name : '',
        phoneNumber: hasValidPhone ? cleanPhone : '',
        upiId: hasValidUpi ? merchant.upi_id : '',
      });
    }

    // ── 5. New OAuth Sign-in: Prompt to complete registration details ────────
    if (userId) {
      return NextResponse.json({
        allowed: true,
        registered: false,
        isComplete: false,
        needsRegistration: true,
        isNewMerchant: true,
        email: cleanEmail,
        merchantId: userId,
        businessName: '',
        phoneNumber: '',
        upiId: '',
      });
    }

    // Fallback: If no userId and not an admin
    return NextResponse.json({
      allowed: true,
      registered: false,
      email: cleanEmail,
      message: 'Account verified. Please proceed to dashboard onboarding.',
    });
  } catch (err) {
    console.error('[VERIFY-REGISTRATION-STATUS] Unexpected error:', err);
    // On unexpected server error, allow authenticated OAuth user into dashboard rather than permanently locking them out
    return NextResponse.json({
      allowed: true,
      registered: true,
      fallback: true,
      warning: 'Proceeding with safe session fallback.',
    });
  }
}

