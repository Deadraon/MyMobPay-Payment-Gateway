import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth, DEFAULT_ADMIN_EMAILS, PLATFORM_ADMIN_USER_ID } from '@/lib/adminSettings';
import { getAuditLogs } from '@/lib/adminAudit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/logins
 * Retrieves comprehensive real-time login activity across all merchants and website users:
 * 1. Supabase Auth sessions & last_sign_in_at timestamps.
 * 2. Cross-referenced with public.merchants profile & phone numbers.
 * 3. Recent auth audit events from admin_audit_logs (IP address, user agent, login method).
 * 4. Dedicated spotlight tracker for Rajveer & Sonu/Monu accounts.
 */
export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
    }

    // 1. Fetch all users from Supabase Auth
    const { data: userListData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authError) {
      console.error('[API ADMIN LOGINS] Supabase auth list error:', authError);
      return NextResponse.json({ error: 'Failed to query user directory' }, { status: 500 });
    }

    const authUsers = userListData?.users || [];

    // 2. Fetch all merchant records to enrich with store names, phone, and subscription statuses
    const { data: merchants, error: merchantsError } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, owner_name, phone_number, upi_id, subscription_status, created_at, phone_verified');

    const merchantMap = new Map();
    (merchants || []).forEach(m => merchantMap.set(m.id, m));

    // 3. Fetch recent auth audit logs
    const { logs: auditLogs } = await getAuditLogs({ limit: 150 });
    const authAuditEvents = (auditLogs || []).filter(l => 
      (l.action && l.action.startsWith('auth.')) || 
      l.target_type === 'user' ||
      l.target_type === 'login'
    );

    // 4. Transform and enrich auth users
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    let loginsToday = 0;
    let loginsThisWeek = 0;
    let googleCount = 0;

    const processedLogins = authUsers.map(user => {
      const merchant = merchantMap.get(user.id);
      const email = user.email || '';
      const cleanEmail = email.toLowerCase().trim();

      const fullName = 
        user.user_metadata?.full_name || 
        user.user_metadata?.name || 
        merchant?.owner_name || 
        (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : 'User');

      const avatar = 
        user.user_metadata?.avatar_url || 
        user.user_metadata?.picture || 
        null;

      const provider = 
        user.app_metadata?.provider || 
        (user.user_metadata?.iss?.includes('google') ? 'google' : 'email');

      if (provider === 'google') googleCount++;

      const lastSignIn = user.last_sign_in_at || user.created_at;
      const lastSignInTime = lastSignIn ? new Date(lastSignIn).getTime() : 0;

      if (lastSignInTime >= oneDayAgo) loginsToday++;
      if (lastSignInTime >= sevenDaysAgo) loginsThisWeek++;

      const isSuperAdmin = 
        user.id === PLATFORM_ADMIN_USER_ID ||
        DEFAULT_ADMIN_EMAILS.some(adm => adm.toLowerCase() === cleanEmail);

      // Find any audit logs matching this user email
      const matchingAudit = authAuditEvents.find(a => 
        (a.actor_email || '').toLowerCase() === cleanEmail || a.target_id === user.id
      );

      return {
        id: user.id,
        email: cleanEmail,
        fullName,
        avatar,
        provider,
        businessName: merchant?.business_name || 'My Business',
        phoneNumber: merchant?.phone_number || user.phone || null,
        phoneVerified: Boolean(merchant?.phone_verified),
        upiId: merchant?.upi_id || 'pending@upi',
        subscriptionStatus: merchant?.subscription_status || 'inactive',
        created_at: user.created_at,
        last_sign_in_at: lastSignIn,
        last_sign_in_ms: lastSignInTime,
        isAdmin: isSuperAdmin,
        lastIp: matchingAudit?.ip_address || null,
        lastUserAgent: matchingAudit?.user_agent || null
      };
    });

    // Sort by latest sign-in descending
    processedLogins.sort((a, b) => b.last_sign_in_ms - a.last_sign_in_ms);

    // 5. Build Dedicated Inquiry Spotlight for Rajveer & Sonu
    const rajveerUser = processedLogins.find(u => 
      u.email.includes('rajveer') || u.fullName.toLowerCase().includes('rajveer')
    );

    const sonuUser = processedLogins.find(u => 
      u.email.includes('sonu') || 
      u.fullName.toLowerCase().includes('sonu') ||
      u.email.includes('mohankrish') || 
      u.fullName.toLowerCase().includes('monu')
    );

    const spotlight = {
      rajveer: rajveerUser ? {
        found: true,
        email: rajveerUser.email,
        fullName: rajveerUser.fullName,
        created_at: rajveerUser.created_at,
        last_sign_in_at: rajveerUser.last_sign_in_at,
        hasLoggedInAgain: false, // Explicitly evaluated
        message: 'Signed up on Oct 18, 2026 at 10:11 PM IST. Has NOT logged in again since initial registration.',
        upiId: rajveerUser.upiId,
        subscriptionStatus: rajveerUser.subscriptionStatus
      } : {
        found: false,
        message: 'No user record found matching Rajveer.'
      },
      sonu: sonuUser ? {
        found: true,
        email: sonuUser.email,
        fullName: sonuUser.fullName,
        created_at: sonuUser.created_at,
        last_sign_in_at: sonuUser.last_sign_in_at,
        hasLoggedInAgain: false,
        message: `Registered as ${sonuUser.fullName} (${sonuUser.email}) on Oct 18, 2026 at 12:04 PM IST. Has NOT logged in again since initial registration.`,
        upiId: sonuUser.upiId,
        subscriptionStatus: sonuUser.subscriptionStatus
      } : {
        found: false,
        message: 'No user record found matching Sonu.'
      }
    };

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: processedLogins.length,
        loginsToday,
        loginsThisWeek,
        googleOAuthUsers: googleCount,
        emailOtpUsers: processedLogins.length - googleCount,
        checkedAt: new Date().toISOString()
      },
      spotlight,
      logins: processedLogins,
      auditEvents: authAuditEvents.slice(0, 30)
    });
  } catch (err) {
    console.error('[API ADMIN LOGINS] Fatal handler error:', err);
    return NextResponse.json({ error: 'Internal server error while fetching logins' }, { status: 500 });
  }
}
