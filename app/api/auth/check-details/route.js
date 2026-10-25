import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

/**
 * POST /api/auth/check-details
 * Pre-registration validator that checks if email, phone number, or settlement UPI ID
 * is already taken by an existing merchant account.
 */
export async function POST(req) {
  // Rate limit: max 20 check attempts per IP per minute
  const clientIp = getClientIp(req);
  const rateLimit = checkRateLimit(`auth_check_${clientIp}`, 20, 60 * 1000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetInSeconds) } }
    );
  }

  try {
    const { email, phone, upiId, userId } = await req.json();

    // ── 1. Check Email Uniqueness ───────────────────────────────────
    if (email) {
      const cleanEmail = email.toString().trim().toLowerCase();
      if (cleanEmail.includes('@')) {
        // Check if a registered user exists with this email (excluding current user)
        const { data: userListData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        if (!listError && userListData?.users) {
          const userFound = userListData.users.find(
            u => u.email?.toLowerCase() === cleanEmail && (!userId || u.id !== userId)
          );

          if (userFound) {
            // Check if user has an active or completed merchant profile
            const { data: merchantProf } = await supabaseAdmin
              .from('merchants')
              .select('id, business_name, upi_id')
              .eq('id', userFound.id)
              .maybeSingle();

            if (
              merchantProf &&
              merchantProf.business_name &&
              merchantProf.business_name !== 'My Business' &&
              merchantProf.upi_id &&
              merchantProf.upi_id !== 'pending@upi'
            ) {
              return NextResponse.json({
                available: false,
                field: 'email',
                error: 'This email address is already registered. Please click "Log In" above.',
              }, { status: 409 });
            }
          }
        }
      }
    }

    // ── 2. Check WhatsApp Mobile Number Uniqueness ─────────────────
    if (phone) {
      const cleanPhone = phone.toString().trim().replace(/\D/g, '');
      if (/^[6-9]\d{9}$/.test(cleanPhone)) {
        const dbPhone = `+91${cleanPhone}`;
        
        // Check in public.merchants by phone_number (excluding current user)
        let phoneQuery = supabaseAdmin
          .from('merchants')
          .select('id, phone_number, business_name')
          .or(`phone_number.eq.${cleanPhone},phone_number.eq.${dbPhone},phone_number.eq.91${cleanPhone}`);

        if (userId) {
          phoneQuery = phoneQuery.neq('id', userId);
        }

        const { data: existingMerchantPhone, error: phoneErr } = await phoneQuery
          .limit(1)
          .maybeSingle();

        if (existingMerchantPhone) {
          return NextResponse.json({
            available: false,
            field: 'phone',
            error: 'This WhatsApp mobile number is already registered to another account. Please use a different number or log in.',
          }, { status: 409 });
        }
      }
    }

    // ── 3. Check Settlement UPI ID Uniqueness ──────────────────────
    if (upiId) {
      const cleanUpi = upiId.toString().trim().toLowerCase();
      if (cleanUpi.includes('@') && cleanUpi !== 'pending@upi') {
        let upiQuery = supabaseAdmin
          .from('merchants')
          .select('id, upi_id, business_name')
          .ilike('upi_id', cleanUpi)
          .neq('upi_id', 'pending@upi');

        if (userId) {
          upiQuery = upiQuery.neq('id', userId);
        }

        const { data: existingMerchantUpi, error: upiErr } = await upiQuery
          .limit(1)
          .maybeSingle();

        if (existingMerchantUpi) {
          return NextResponse.json({
            available: false,
            field: 'upiId',
            error: `Settlement UPI ID "${cleanUpi}" is already registered by another merchant. Please enter your unique UPI address.`,
          }, { status: 409 });
        }
      }
    }

    return NextResponse.json({
      available: true,
      message: 'All details are available for registration.',
    });

  } catch (err) {
    console.error('[CHECK DETAILS API] Unexpected error:', err);
    return NextResponse.json({
      available: true, // Allow user to proceed if validation service encounters error
      warning: 'Could not perform pre-check validation.',
    });
  }
}
