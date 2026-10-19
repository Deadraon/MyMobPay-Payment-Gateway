import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendAdminNewSignupNotification } from '@/lib/mailer';

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, email, name, provider, phone, upiId, bankDetails } = body;

    if (!userId && !email) {
      return NextResponse.json({ error: 'Missing userId or email' }, { status: 400 });
    }

    // 1. Fetch user from Supabase Auth to guarantee accurate email and creation date
    let authUser = null;
    if (userId) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      authUser = userData?.user || null;
    }

    const targetEmail = authUser?.email || email;
    if (!targetEmail) {
      return NextResponse.json({ error: 'Could not resolve user email' }, { status: 400 });
    }

    // 2. Fetch merchant record to inspect notification state and banking details
    let merchantRecord = null;
    if (userId) {
      const { data: merchantData } = await supabaseAdmin
        .from('merchants')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      merchantRecord = merchantData;
    }

    const setupProgress = merchantRecord?.setup_progress || {};

    // Prevent duplicate emails if already sent
    if (setupProgress.admin_signup_notified) {
      return NextResponse.json({
        success: true,
        alreadyNotified: true,
        message: 'Admin notification already sent previously for this user.'
      });
    }

    // 3. Prepare details
    const finalName = name || merchantRecord?.owner_name || authUser?.user_metadata?.full_name || authUser?.user_metadata?.name || targetEmail.split('@')[0];
    const finalProvider = provider || authUser?.app_metadata?.provider || authUser?.identities?.[0]?.provider || 'Google OAuth';
    const finalPhone = phone || merchantRecord?.phone_number || authUser?.phone || authUser?.user_metadata?.phone || '';
    const finalUpi = upiId || merchantRecord?.upi_id || 'pending@upi';
    const finalBusinessName = merchantRecord?.business_name || authUser?.user_metadata?.business_name || 'My Business';
    
    const finalBank = bankDetails || {
      bank_name: merchantRecord?.bank_name,
      bank_account_number: merchantRecord?.bank_account_number,
      bank_ifsc: merchantRecord?.bank_ifsc,
      bank_account_name: merchantRecord?.bank_account_name,
    };

    // 4. Send email notification to all Admin addresses
    await sendAdminNewSignupNotification({
      userEmail: targetEmail,
      userName: finalName,
      businessName: finalBusinessName,
      upiId: finalUpi,
      phone: finalPhone,
      provider: finalProvider,
      userId: userId || authUser?.id || '',
      createdAt: merchantRecord?.created_at || authUser?.created_at || new Date().toISOString(),
      bankDetails: finalBank,
    });

    // 5. Flag admin_signup_notified: true so we don't spam the admin on subsequent logins
    if (userId && merchantRecord) {
      await supabaseAdmin
        .from('merchants')
        .update({
          setup_progress: {
            ...setupProgress,
            admin_signup_notified: true,
            admin_signup_notified_at: new Date().toISOString(),
          }
        })
        .eq('id', userId);
    }

    return NextResponse.json({
      success: true,
      message: 'Admin notified of new signup successfully.',
    });

  } catch (err) {
    console.error('[NOTIFY SIGNUP API] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
