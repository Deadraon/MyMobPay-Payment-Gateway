import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/lib/mailer';

export async function POST(req) {
  try {
    const { email, password, businessName, upiId, phone } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || '').toString().trim();
    const finalBusinessName = (businessName && businessName.trim()) ? businessName.trim() : (cleanEmail.split('@')[0] || 'My Merchant Store');
    const finalUpiId = (upiId && upiId.includes('@')) ? upiId.trim() : `${cleanEmail.split('@')[0]}@upi`;

    // 1. Attempt to create the user directly in Supabase Auth
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        business_name: finalBusinessName,
        upi_id: finalUpiId,
        phone: cleanPhone,
      },
    });

    let userId = createData?.user?.id;

    if (createError) {
      // Check if user already exists
      const errMsg = createError.message?.toLowerCase() || '';
      if (errMsg.includes('already') || createError.code === 'email_exists' || createError.status === 422) {
        return NextResponse.json({
          error: 'This email is already registered. Please click "Already have an account? Sign In" below.',
          code: 'email_exists',
        }, { status: 400 });
      }

      console.error('[REGISTER API] User creation error:', createError);
      return NextResponse.json({
        error: createError.message || `Auth API error: ${JSON.stringify(createError)}`,
        code: createError.code,
      }, { status: 400 });
    }

    // 2. Insert/Upsert merchant profile in public.merchants
    if (userId) {
      const { error: merchantError } = await supabaseAdmin
        .from('merchants')
        .upsert({
          id: userId,
          business_name: finalBusinessName,
          upi_id: finalUpiId,
          phone_number: cleanPhone || undefined,
          subscription_status: 'inactive',
          sandbox_mode: true,
          theme_color: '#3B82F6',
        }, { onConflict: 'id' });

      if (merchantError) {
        console.error('[REGISTER API] Merchant profile upsert warning:', merchantError);
      }

      // 3. Dispatch Welcome & Merchant Credentials Email
      try {
        const mid = `MID-${userId.slice(0, 8).toUpperCase()}`;
        await sendWelcomeEmail({
          to: cleanEmail,
          businessName: businessName.trim(),
          upiId: upiId.trim(),
          mid,
        });
      } catch (welcomeErr) {
        console.warn('[REGISTER API] Welcome email send notice:', welcomeErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Account registered successfully! Logging you in...',
      userId,
    });

  } catch (err) {
    console.error('[REGISTER API] Unexpected exception:', err);
    const detailedError = err?.message || err?.cause?.message || 'An unexpected error occurred during registration.';
    return NextResponse.json({
      error: `Registration Error: ${detailedError}`,
      cause: err?.cause?.toString() || undefined,
    }, { status: 500 });
  }
}
