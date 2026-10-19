import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/adminSettings';
import { sendAdminNewSignupNotification } from '@/lib/mailer';

// GET: Fetch all registered merchants and all signups with complete direct details
export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);

    // Verify admin access
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    // Parallel fetch: merchants table + Supabase Auth users + recent WhatsApp OTP attempts
    const [merchantsRes, authUsersRes, otpsRes] = await Promise.all([
      supabaseAdmin
        .from('merchants')
        .select('*')
        .order('created_at', { ascending: false }),
      supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      }),
      supabaseAdmin
        .from('whatsapp_otps')
        .select('id, phone, purpose, verified, created_at')
        .order('created_at', { ascending: false })
        .limit(30)
    ]);

    if (merchantsRes.error) {
      console.error('Error fetching merchants:', merchantsRes.error);
      return NextResponse.json({ error: merchantsRes.error.message }, { status: 500 });
    }

    const merchants = merchantsRes.data || [];
    const authUsers = authUsersRes.data?.users || [];
    const recentOtps = otpsRes.data || [];

    // Map Auth Users by ID for rapid O(1) enrichment
    const authMap = new Map();
    for (const u of authUsers) {
      authMap.set(u.id, {
        id: u.id,
        email: u.email || '',
        email_confirmed: Boolean(u.email_confirmed_at),
        phone: u.phone || u.user_metadata?.phone || '',
        full_name: u.user_metadata?.full_name || u.user_metadata?.name || '',
        avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
        provider: u.app_metadata?.provider || u.identities?.[0]?.provider || 'email',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at || null,
        user_metadata: u.user_metadata || {},
      });
    }

    const processedUserIds = new Set();

    // 1. Enrich existing merchants with user authentication & identity metadata
    const processedMerchants = merchants.map(m => {
      processedUserIds.add(m.id);
      const authUser = authMap.get(m.id);

      let isSubActive = m.subscription_status === 'active';
      if (isSubActive && m.subscription_expires_at) {
        if (new Date(m.subscription_expires_at) < new Date()) {
          m.subscription_status = 'expired';
        }
      }

      return {
        ...m,
        email: authUser?.email || '',
        email_confirmed: authUser?.email_confirmed ?? false,
        auth_provider: authUser?.provider || 'email',
        avatar_url: authUser?.avatar_url || null,
        owner_name: m.owner_name || authUser?.full_name || '',
        phone_number: m.phone_number || authUser?.phone || '',
        last_sign_in_at: authUser?.last_sign_in_at || null,
        user_created_at: authUser?.created_at || m.created_at,
        has_merchant_profile: true,
      };
    });

    // 2. Capture signups who registered in Auth but have not completed merchant profile
    const unonboardedUsers = [];
    for (const u of authUsers) {
      if (!processedUserIds.has(u.id)) {
        unonboardedUsers.push({
          id: u.id,
          business_name: u.user_metadata?.business_name || (u.user_metadata?.full_name ? `${u.user_metadata.full_name}'s Account` : 'Incomplete Registration'),
          owner_name: u.user_metadata?.full_name || u.user_metadata?.name || '',
          email: u.email || '',
          email_confirmed: Boolean(u.email_confirmed_at),
          phone_number: u.phone || u.user_metadata?.phone || '',
          upi_id: u.user_metadata?.upi_id || 'pending@upi',
          auth_provider: u.app_metadata?.provider || u.identities?.[0]?.provider || 'email',
          avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture || null,
          subscription_status: 'unonboarded',
          created_at: u.created_at,
          user_created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at || null,
          has_merchant_profile: false,
          setup_progress: { website: false, android_sdk: false, email_forwarding: false },
        });
      }
    }

    // 3. Combine into unified signups directory, sorted newest first
    const allSignups = [...processedMerchants, ...unonboardedUsers].sort((a, b) => {
      const timeA = new Date(a.created_at || a.user_created_at || 0).getTime();
      const timeB = new Date(b.created_at || b.user_created_at || 0).getTime();
      return timeB - timeA;
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last7DaysSignups = allSignups.filter(s => new Date(s.created_at || s.user_created_at) >= sevenDaysAgo);

    return NextResponse.json({
      success: true,
      merchants: processedMerchants,
      signups: allSignups,
      recent_otps: recentOtps,
      stats: {
        total_signups: allSignups.length,
        last_7_days_signups: last7DaysSignups.length,
        total_merchants: processedMerchants.length,
        unonboarded_signups: unonboardedUsers.length,
        google_signups: allSignups.filter(s => (s.auth_provider || '').toLowerCase().includes('google')).length,
      }
    });

  } catch (err) {
    console.error('API admin merchants GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Administrative actions on merchants & signups
export async function POST(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);

    // Verify admin access
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const body = await request.json();
    const { merchantId, action, status } = body;

    // Action: Test Admin Notification Email
    if (action === 'sendTestSignupNotification') {
      const testResult = await sendAdminNewSignupNotification({
        userEmail: 'new_merchant_demo@mymob.tech',
        userName: 'Demo Merchant (Test)',
        businessName: 'MyMobPay Store Demo',
        upiId: 'demo@upi',
        phone: '+91 9876543210',
        provider: 'Google OAuth (Test Verification)',
        userId: 'test_demo_user_id',
        createdAt: new Date().toISOString(),
        bankDetails: {
          bank_name: 'State Bank of India',
          bank_account_number: '123456789012',
          bank_ifsc: 'SBIN0001234',
          bank_account_name: 'Demo Merchant',
        }
      });
      return NextResponse.json({
        success: true,
        message: 'Test new signup notification email dispatched to configured admin emails.',
        details: testResult,
      });
    }

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 });
    }

    if (action === 'toggleSubscription') {
      if (!['active', 'inactive'].includes(status)) {
        return NextResponse.json({ error: 'Status must be active or inactive' }, { status: 400 });
      }

      const { data: merchant, error } = await supabaseAdmin
        .from('merchants')
        .update({ subscription_status: status })
        .eq('id', merchantId)
        .select()
        .single();

      if (error) {
        console.error('Error updating merchant subscription:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, merchant });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('API admin merchants POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
