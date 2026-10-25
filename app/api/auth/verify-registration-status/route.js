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
 * 3. Fresh Google OAuth sign-ins are auto-provisioned into sandbox mode and welcomed into onboarding.
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
        isComplete: true,
        needsRegistration: false,
        isAdmin: true,
        email: cleanEmail,
        merchantId: userId || PLATFORM_ADMIN_USER_ID,
        businessName: 'MyMobPay Platform Admin',
      });
    }

    // ── 2. Check if a merchant profile already exists for this userId ─────────
    let merchant = null;
    let authUser = null;

    if (userId) {
      const { data: mById, error: errById } = await supabaseAdmin
        .from('merchants')
        .select('id, business_name, upi_id, phone_number, phone_verified, subscription_status, setup_progress')
        .eq('id', userId)
        .maybeSingle();

      if (!errById && mById) {
        merchant = mById;
      }

      const { data: uData } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (uData?.user) {
        authUser = uData.user;
      }
    }

    const isProfileComplete = (m) => {
      if (!m) return false;
      if (m.subscription_status === 'active') return true;
      if (m.setup_progress?.onboarding_completed) return true;
      const ph = (m.phone_number || '').trim().replace(/\D/g, '').slice(-10);
      const validPhone = ph.length === 10;
      const validUpi = Boolean(m.upi_id && m.upi_id !== 'pending@upi' && m.upi_id.includes('@'));
      const validBiz = Boolean(m.business_name && m.business_name.trim().length > 0 && m.business_name !== 'My Business');
      return Boolean((validPhone && validUpi && validBiz) || (m.business_name && m.upi_id && m.upi_id !== 'pending@upi'));
    };

    // ── 3. Check by Email across auth users if not found or incomplete by ID ───
    if ((!merchant || !isProfileComplete(merchant)) && cleanEmail) {
      const { data: userListData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      const matchedUsers = userListData?.users?.filter(
        u => u.email?.toLowerCase() === cleanEmail
      ) || [];

      for (const u of matchedUsers) {
        if (!authUser) authUser = u;
        const { data: mByMatchedUser } = await supabaseAdmin
          .from('merchants')
          .select('id, business_name, upi_id, phone_number, phone_verified, subscription_status, setup_progress')
          .eq('id', u.id)
          .maybeSingle();

        if (mByMatchedUser && isProfileComplete(mByMatchedUser)) {
          merchant = mByMatchedUser;
          break;
        } else if (!merchant && mByMatchedUser) {
          merchant = mByMatchedUser;
        }
      }
    }

    // ── 3b. Synchronize complete merchant profile to active session userId ───
    if (merchant && userId && merchant.id !== userId && isProfileComplete(merchant)) {
      const { data: syncedMerchant, error: syncErr } = await supabaseAdmin
        .from('merchants')
        .upsert({
          id: userId,
          business_name: merchant.business_name,
          upi_id: merchant.upi_id,
          phone_number: merchant.phone_number,
          phone_verified: merchant.phone_verified ?? true,
          subscription_status: merchant.subscription_status || 'inactive',
          sandbox_mode: merchant.sandbox_mode ?? true,
          theme_color: merchant.theme_color || '#3B82F6',
          setup_progress: merchant.setup_progress || {},
        }, { onConflict: 'id' })
        .select('id, business_name, upi_id, phone_number, phone_verified, subscription_status, setup_progress')
        .maybeSingle();

      if (!syncErr && syncedMerchant) {
        merchant = syncedMerchant;
      }
    }

    // ── 4. Verify Merchant Completion & Auto-heal from User Metadata ─────────
    let rawPhone = (merchant?.phone_number || '').trim().replace(/\D/g, '');
    let cleanPhone = rawPhone.slice(-10);
    let hasValidPhone = Boolean(
      cleanPhone.length === 10 &&
      /^[6-9]\d{9}$/.test(cleanPhone) &&
      !/^(\d)\1{9}$/.test(cleanPhone)
    );
    let hasValidUpi = Boolean(
      merchant?.upi_id && 
      merchant.upi_id !== 'pending@upi' && 
      merchant.upi_id.includes('@')
    );
    let hasValidBusiness = Boolean(
      merchant?.business_name && 
      merchant.business_name.trim().length > 0 && 
      merchant.business_name !== 'My Business'
    );

    let isComplete = Boolean(
      (hasValidPhone && hasValidUpi && hasValidBusiness) ||
      (merchant?.subscription_status === 'active') ||
      (merchant?.setup_progress?.onboarding_completed) ||
      (merchant?.business_name && merchant?.upi_id && merchant.upi_id !== 'pending@upi' && merchant.business_name !== 'My Business')
    );

    // If merchant record is incomplete but auth user_metadata has the completed onboarding info, auto-heal
    if (!isComplete && authUser?.user_metadata) {
      const metaBusiness = (authUser.user_metadata.business_name || '').toString().trim();
      const metaUpi = (authUser.user_metadata.upi_id || '').toString().trim().toLowerCase();
      const metaRawPhone = (authUser.user_metadata.phone || '').toString().trim().replace(/\D/g, '');
      const metaPhone = metaRawPhone.slice(-10);
      const metaWebsite = authUser.user_metadata.business_website || authUser.user_metadata.website_url || '';

      const metaPhoneValid = Boolean(
        metaPhone.length === 10 &&
        /^[6-9]\d{9}$/.test(metaPhone) &&
        !/^(\d)\1{9}$/.test(metaPhone)
      );
      const metaUpiValid = Boolean(
        metaUpi && metaUpi !== 'pending@upi' && metaUpi.includes('@')
      );
      const metaBusinessValid = Boolean(
        metaBusiness.length > 0 && metaBusiness !== 'My Business'
      );

      if (metaPhoneValid && metaUpiValid && metaBusinessValid) {
        const targetMerchantId = merchant?.id || userId || authUser.id;
        const { data: healedMerchant, error: healError } = await supabaseAdmin
          .from('merchants')
          .upsert({
            id: targetMerchantId,
            business_name: metaBusiness,
            upi_id: metaUpi,
            phone_number: metaPhone,
            phone_verified: true,
            subscription_status: merchant?.subscription_status || 'inactive',
            sandbox_mode: true,
            theme_color: '#3B82F6',
            setup_progress: {
              ...(merchant?.setup_progress || {}),
              website_url: metaWebsite,
              business_website: metaWebsite,
              onboarding_completed_at: new Date().toISOString(),
            },
          }, { onConflict: 'id' })
          .select('id, business_name, upi_id, phone_number, phone_verified, subscription_status, setup_progress')
          .maybeSingle();

        if (!healError && healedMerchant) {
          merchant = healedMerchant;
          cleanPhone = metaPhone;
          hasValidPhone = true;
          hasValidUpi = true;
          hasValidBusiness = true;
          isComplete = true;
        }
      }
    }

    if (merchant) {
      const websiteUrl = merchant?.setup_progress?.website_url || 
                         merchant?.setup_progress?.business_website || 
                         authUser?.user_metadata?.business_website || 
                         authUser?.user_metadata?.website_url || '';

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
          phoneNumber: cleanPhone,
          upiId: merchant.upi_id,
          phoneVerified: true,
          websiteUrl,
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
        websiteUrl,
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
    return NextResponse.json({
      allowed: true,
      registered: false,
      isComplete: false,
      needsRegistration: true,
      fallback: true,
      warning: 'Proceeding with safe session fallback.',
    });
  }
}

