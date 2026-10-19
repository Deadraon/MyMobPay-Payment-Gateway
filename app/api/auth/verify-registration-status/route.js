import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { DEFAULT_ADMIN_EMAILS, PLATFORM_ADMIN_USER_ID } from '@/lib/adminSettings';

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

    // ── 4. Existing Merchant: Allow access immediately ───────────────────────
    if (merchant) {
      const hasPhone = Boolean(
        merchant.phone_number &&
        merchant.phone_number.trim().replace(/\D/g, '').length >= 10
      );

      return NextResponse.json({
        allowed: true,
        registered: true,
        needsOnboarding: !hasPhone || merchant.upi_id === 'pending@upi',
        email: cleanEmail,
        merchantId: merchant.id,
        businessName: merchant.business_name || 'My Business',
        phoneNumber: merchant.phone_number || null,
        phoneVerified: Boolean(merchant.phone_verified),
      });
    }

    // ── 5. New OAuth Sign-in: Auto-provision merchant profile ────────────────
    if (userId) {
      const newKey = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
      const fallbackName = cleanEmail ? (cleanEmail.split('@')[0] || 'Merchant Partner') : 'Merchant Partner';
      const now = new Date();
      const expiry = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3-day instant trial

      const newMerchantProfile = {
        id: userId,
        business_name: fallbackName,
        upi_id: 'pending@upi',
        api_key: newKey,
        subscription_status: 'trial_3day',
        subscription_expires_at: expiry.toISOString(),
        theme_color: '#3B82F6',
        setup_progress: {
          plan_type: 'trial_3day',
          trial_activated_at: now.toISOString(),
          trial_expires_at: expiry.toISOString(),
          onboarding_needed: true,
        },
      };

      const { data: insertedMerchant, error: insertErr } = await supabaseAdmin
        .from('merchants')
        .insert(newMerchantProfile)
        .select()
        .maybeSingle();

      if (insertErr) {
        console.error('[VERIFY-REGISTRATION-STATUS] Merchant auto-provision error:', insertErr);
      }

      // Notify platform admins of new signup in background
      try {
        fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://mymob.tech'}/api/auth/notify-signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            email: cleanEmail,
            name: fallbackName,
            provider: 'Google OAuth',
          }),
        }).catch(e => console.warn('Notify signup silent warning:', e?.message));
      } catch (notifyErr) {
        console.warn('Silent notify warning:', notifyErr?.message);
      }

      return NextResponse.json({
        allowed: true,
        registered: true,
        isNewMerchant: true,
        needsOnboarding: true,
        email: cleanEmail,
        merchantId: userId,
        businessName: fallbackName,
        phoneNumber: null,
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

