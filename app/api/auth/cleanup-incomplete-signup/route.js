import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { DEFAULT_ADMIN_EMAILS, PLATFORM_ADMIN_USER_ID } from '@/lib/adminSettings';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * POST /api/auth/cleanup-incomplete-signup
 * Safely purges an uncompleted/abandoned signup so that the user's email
 * is never stored as registered if they drop off before finishing registration.
 */
export async function POST(req) {
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`cleanup_signup_${clientIp}`, 15, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: 429 });
  }

  try {
    // ── SECURITY: Authenticate requesting session ─────────────────────
    // Account cleanup/purge can ONLY be performed by the authenticated user themselves
    // or by a platform administrator.
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication token is required to discard signup session.' },
        { status: 401 }
      );
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired session.' },
        { status: 401 }
      );
    }

    const sessionUser = authData.user;
    const body = await req.json().catch(() => ({}));
    const { userId, email } = body;

    const cleanEmail = (email || sessionUser.email || '').toString().trim().toLowerCase();
    const targetId = userId || sessionUser.id;

    // Verify ownership: the authenticated session MUST match the target user ID or verified email
    const isOwner = sessionUser.id === targetId || (sessionUser.email && sessionUser.email.toLowerCase() === cleanEmail);
    const isAdmin = sessionUser.id === PLATFORM_ADMIN_USER_ID || DEFAULT_ADMIN_EMAILS.some(adm => adm.toLowerCase() === sessionUser.email?.toLowerCase());

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: You cannot discard an account belonging to another user.' },
        { status: 403 }
      );
    }

    // 1. Guard platform root administrators
    if (
      targetId === PLATFORM_ADMIN_USER_ID ||
      DEFAULT_ADMIN_EMAILS.some(adm => adm.toLowerCase() === cleanEmail)
    ) {
      return NextResponse.json({ error: 'Cannot delete platform admin account.' }, { status: 403 });
    }

    // 2. Resolve target user from Supabase Auth
    let targetUser = null;
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(targetId);
    if (userData?.user) targetUser = userData.user;

    if (!targetUser && cleanEmail) {
      const { data: userListData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      targetUser = userListData?.users?.find(u => u.email?.toLowerCase() === cleanEmail) || null;
    }

    if (!targetUser) {
      return NextResponse.json({ success: true, message: 'User not found in auth records.' });
    }

    // Guard against deleting any account that has completed user_metadata
    const meta = targetUser.user_metadata || {};
    const metaPhone = (meta.phone || '').toString().trim().replace(/\D/g, '');
    const isMetaCompleted = Boolean(
      meta.business_name &&
      meta.business_name !== 'My Business' &&
      meta.upi_id &&
      meta.upi_id !== 'pending@upi' &&
      meta.upi_id.includes('@') &&
      metaPhone.length === 10
    );
    if (isMetaCompleted) {
      return NextResponse.json({
        error: 'Cannot purge account: Account registration is already completed.',
      }, { status: 400 });
    }

    // 3. Check if user has an active/completed merchant profile
    const { data: merchantProf } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, upi_id, phone_number, subscription_status')
      .eq('id', targetId)
      .maybeSingle();

    const cleanPhone = (merchantProf?.phone_number || '').trim().replace(/\D/g, '');
    const isCompleted = Boolean(
      merchantProf &&
      merchantProf.business_name &&
      merchantProf.business_name.trim().length > 0 &&
      merchantProf.business_name !== 'My Business' &&
      merchantProf.upi_id &&
      merchantProf.upi_id !== 'pending@upi' &&
      merchantProf.upi_id.includes('@') &&
      cleanPhone.length === 10
    );

    // If merchant is fully completed, DO NOT delete
    if (isCompleted) {
      return NextResponse.json({
        error: 'Cannot purge account: Merchant profile is already registered and completed.',
      }, { status: 400 });
    }

    // 4. Check if user has any active orders or transactions
    const { data: existingOrders } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('merchant_id', targetId)
      .limit(1);

    if (existingOrders && existingOrders.length > 0) {
      return NextResponse.json({
        error: 'Cannot purge account: Operational orders exist for this merchant.',
      }, { status: 400 });
    }

    // 5. Clean up any partial merchant row
    if (merchantProf) {
      await supabaseAdmin.from('merchants').delete().eq('id', targetId);
    }

    // 6. Delete uncompleted user from Supabase Auth so email is completely released
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(targetId);
    if (deleteErr) {
      console.warn('[CLEANUP SIGNUP] Auth deleteUser warning:', deleteErr.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Incomplete signup discarded. You can register fresh with Google or Email OTP.',
    });

  } catch (err) {
    console.error('[CLEANUP SIGNUP] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Server error while discarding signup.' }, { status: 500 });
  }
}
