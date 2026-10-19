import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/auth/verify-registration-status
 * Verifies whether an authenticated account (e.g. Google OAuth or session token)
 * is already registered with a completed merchant profile and compulsory phone number.
 *
 * If the user has not registered first, this returns `allowed: false` so that the client
 * can immediately sign them out and redirect them to complete registration with their mobile number.
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

    // 1. Check if a merchant profile exists for this userId
    let merchant = null;
    if (userId) {
      const { data: mById, error: errById } = await supabaseAdmin
        .from('merchants')
        .select('id, business_name, upi_id, phone_number, phone_verified')
        .eq('id', userId)
        .maybeSingle();

      if (!errById && mById) {
        merchant = mById;
      }
    }

    // 2. If not found by ID or incomplete, check if this email exists under another auth user with a completed merchant profile
    if ((!merchant || !merchant.phone_number) && cleanEmail) {
      const { data: userListData } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      const matchedUsers = userListData?.users?.filter(
        u => u.email?.toLowerCase() === cleanEmail
      ) || [];

      for (const u of matchedUsers) {
        if (u.id === userId && merchant) continue;
        const { data: mByMatchedUser } = await supabaseAdmin
          .from('merchants')
          .select('id, business_name, upi_id, phone_number, phone_verified')
          .eq('id', u.id)
          .maybeSingle();

        if (
          mByMatchedUser &&
          mByMatchedUser.business_name &&
          mByMatchedUser.business_name !== 'My Business' &&
          mByMatchedUser.upi_id &&
          mByMatchedUser.upi_id !== 'pending@upi' &&
          mByMatchedUser.phone_number &&
          mByMatchedUser.phone_number.trim().length >= 10
        ) {
          merchant = mByMatchedUser;
          break;
        }
      }
    }

    // 3. Strict verification of completed merchant registration:
    // - Must have a real business name (not dummy 'My Business')
    // - Must have a real settlement UPI ID (not dummy 'pending@upi')
    // - MUST have a compulsory mobile phone number (at least 10 digits)
    const isRegistered = Boolean(
      merchant &&
      merchant.business_name &&
      merchant.business_name.trim() !== '' &&
      merchant.business_name !== 'My Business' &&
      merchant.upi_id &&
      merchant.upi_id !== 'pending@upi' &&
      merchant.phone_number &&
      merchant.phone_number.trim().replace(/\D/g, '').length >= 10
    );

    if (!isRegistered) {
      // Clean up any dummy merchant row that might have been inadvertently created
      if (userId && merchant && (merchant.business_name === 'My Business' || !merchant.phone_number)) {
        await supabaseAdmin
          .from('merchants')
          .delete()
          .eq('id', userId)
          .eq('business_name', 'My Business');
      }

      return NextResponse.json({
        allowed: false,
        registered: false,
        email: cleanEmail,
        error: cleanEmail
          ? `This Google account (${cleanEmail}) is not registered yet. Please complete merchant registration below first.`
          : 'Your account is not registered yet. Please complete merchant registration below first.',
      });
    }

    return NextResponse.json({
      allowed: true,
      registered: true,
      email: cleanEmail,
      merchantId: merchant.id,
      businessName: merchant.business_name,
      phoneNumber: merchant.phone_number,
    });
  } catch (err) {
    console.error('[VERIFY-REGISTRATION-STATUS] Unexpected error:', err);
    return NextResponse.json(
      { allowed: false, registered: false, error: 'Registration verification service error.' },
      { status: 500 }
    );
  }
}
