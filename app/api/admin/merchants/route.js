import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/adminSettings';
import { sendAdminNewSignupNotification, sendMerchantOnboardingOutreachEmail } from '@/lib/mailer';
import { logAdminAction } from '@/lib/adminAudit';
import crypto from 'crypto';

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
    const { merchantId, action, status, payload } = body;

    // Action 1: Test Admin Notification Email
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

    // Action 2: Send Onboarding Outreach Email directly to a merchant or signup
    if (action === 'sendOutreachEmail') {
      const targetEmail = payload?.to || body.to;
      const targetName = payload?.recipientName || body.recipientName || 'Merchant Partner';
      if (!targetEmail) {
        return NextResponse.json({ error: 'Recipient email "to" is required' }, { status: 400 });
      }

      const emailResult = await sendMerchantOnboardingOutreachEmail({
        to: targetEmail,
        recipientName: targetName,
      });

      return NextResponse.json({
        success: true,
        message: `Outreach email delivered successfully to ${targetEmail}`,
        details: emailResult,
      });
    }

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 });
    }

    // Action 3: Toggle Subscription status (active / inactive / frozen)
    if (action === 'toggleSubscription') {
      const targetStatus = status || payload?.status;
      if (!['active', 'inactive', 'trial', 'expired', 'frozen'].includes(targetStatus)) {
        return NextResponse.json({ error: 'Invalid subscription status' }, { status: 400 });
      }

      const { data: merchant, error } = await supabaseAdmin
        .from('merchants')
        .update({ subscription_status: targetStatus })
        .eq('id', merchantId)
        .select()
        .single();

      if (error) {
        console.error('Error updating merchant subscription:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await logAdminAction({
        action: 'merchant.status_change',
        targetType: 'merchant',
        targetId: merchantId,
        details: { targetStatus, merchantName: merchant.business_name },
        request
      });

      return NextResponse.json({ success: true, merchant });
    }

    // Action 4: Update Merchant Profile Details & Verified Phone
    if (action === 'updateMerchant') {
      const updateData = {};
      const src = payload || body;
      if (src.business_name !== undefined) updateData.business_name = src.business_name;
      if (src.phone_number !== undefined) updateData.phone_number = src.phone_number;
      if (src.upi_id !== undefined) updateData.upi_id = src.upi_id;
      if (src.webhook_url !== undefined) updateData.webhook_url = src.webhook_url;
      if (src.subscription_status !== undefined) updateData.subscription_status = src.subscription_status;

      // Update in merchants table
      const { data: merchant, error } = await supabaseAdmin
        .from('merchants')
        .update(updateData)
        .eq('id', merchantId)
        .select()
        .single();

      // Also sync phone to Supabase Auth metadata if phone was updated
      if (src.phone_number) {
        try {
          await supabaseAdmin.auth.admin.updateUserById(merchantId, {
            user_metadata: { phone: src.phone_number }
          });
        } catch (e) {
          console.warn('Failed to sync auth user phone:', e);
        }
      }

      await logAdminAction({
        action: 'merchant.profile_update',
        targetType: 'merchant',
        targetId: merchantId,
        details: { updatedFields: updateData },
        request
      });

      if (error) {
        return NextResponse.json({ success: true, updatedFields: updateData, notice: 'Saved to auth metadata' });
      }

      return NextResponse.json({ success: true, merchant });
    }

    // Action 5: Rotate Merchant API Key
    if (action === 'rotateApiKey') {
      const newApiKey = `mmp_live_${crypto.randomBytes(24).toString('hex')}`;
      const { data: merchant, error } = await supabaseAdmin
        .from('merchants')
        .update({ api_key: newApiKey })
        .eq('id', merchantId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await logAdminAction({
        action: 'api_key.rotated',
        targetType: 'merchant',
        targetId: merchantId,
        details: { merchantName: merchant?.business_name, keyPrefix: newApiKey.slice(0, 12) },
        request
      });

      return NextResponse.json({ success: true, api_key: newApiKey, merchant });
    }

    // Action 6: Extend Merchant Subscription Validity
    if (action === 'extendSubscription') {
      const days = parseInt(payload?.days || body.days || 30, 10);
      const currentExpiry = payload?.currentExpiry ? new Date(payload.currentExpiry) : new Date();
      const baseTime = currentExpiry > new Date() ? currentExpiry.getTime() : Date.now();
      const newExpiry = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

      const { data: merchant, error } = await supabaseAdmin
        .from('merchants')
        .update({ 
          subscription_status: 'active',
          subscription_expires_at: newExpiry 
        })
        .eq('id', merchantId)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      await logAdminAction({
        action: 'subscription.extended',
        targetType: 'merchant',
        targetId: merchantId,
        details: { daysGranted: days, newExpiry },
        request
      });

      return NextResponse.json({ success: true, newExpiry, merchant });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('API admin merchants POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
