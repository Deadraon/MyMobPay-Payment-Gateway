import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth, ensureAdminMerchant } from '@/lib/adminSettings';
import { isBrevoConfigured, isSendpulseConfigured } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
    }

    let outbox = [];
    try {
      const adminMerchant = await ensureAdminMerchant();
      const stored = adminMerchant?.setup_progress?.admin_settings?.email_outbox;
      if (Array.isArray(stored)) {
        outbox = stored;
      }
    } catch (err) {
      console.warn('Failed to fetch outbox history:', err);
    }

    // Provider status
    const brevoReady = isBrevoConfigured();
    const sendpulseReady = isSendpulseConfigured();

    return NextResponse.json({
      success: true,
      outbox,
      provider: {
        primary: brevoReady ? 'Brevo SMTP (Active)' : 'Default SMTP',
        brevo: brevoReady,
        sendpulse: sendpulseReady
      }
    });
  } catch (err) {
    console.error('Email history API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
