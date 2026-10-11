import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { 
  getAdminSettings, 
  updateAdminSettings, 
  ensureAdminMerchant, 
  verifyAdminAuth,
  generateSecret,
  verifyTOTP
} from '@/lib/adminSettings';

// GET: Retrieve Platform & Security Settings
export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminMerchant = await ensureAdminMerchant();
    const settings = await getAdminSettings();

    // Get Platform Subscription Metrics (Total Subscription Revenue)
    // Subscription payments are orders where merchant_id = admin merchant id, status = 'verified'
    const { data: subscriptionOrders } = await supabaseAdmin
      .from('orders')
      .select('amount, status, created_at, id, note, external_ref')
      .eq('merchant_id', adminMerchant.id)
      .eq('status', 'verified');

    const totalEarnings = subscriptionOrders?.reduce((sum, o) => sum + parseFloat(o.amount), 0) || 0;

    return NextResponse.json({
      success: true,
      upi_id: adminMerchant.upi_id,
      totp_enabled: settings.totp_enabled || false,
      admin_email: settings.admin_email || '',
      total_earnings: totalEarnings,
      subscription_orders: subscriptionOrders || []
    });
  } catch (err) {
    console.error('GET admin settings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Manage Platform Config Updates with authentication validation
export async function POST(request) {
  try {
    const body = await request.json();
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const adminMerchant = await ensureAdminMerchant();

    if (action === 'generate_totp') {
      const secret = generateSecret();
      return NextResponse.json({ success: true, secret });
    }

    if (action === 'enable_totp') {
      const { secret, code } = body;
      if (!secret || !code) {
        return NextResponse.json({ error: 'Secret and OTP Code are required' }, { status: 400 });
      }

      const isValid = verifyTOTP(secret, code);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid verification code. Setup failed.' }, { status: 400 });
      }

      await updateAdminSettings({
        totp_secret: secret,
        totp_enabled: true
      });

      return NextResponse.json({ success: true, message: 'Google Authenticator 2FA activated.' });
    }

    if (action === 'disable_totp') {
      await updateAdminSettings({
        totp_secret: null,
        totp_enabled: false
      });
      return NextResponse.json({ success: true, message: '2FA security deactivated.' });
    }

    if (action === 'update_upi') {
      const { upi_id } = body;
      if (!upi_id || !upi_id.includes('@')) {
        return NextResponse.json({ error: 'Please enter a valid UPI address' }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from('merchants')
        .update({ upi_id })
        .eq('id', adminMerchant.id);

      if (error) throw error;

      return NextResponse.json({ success: true, upi_id, message: 'Platform receiving UPI ID updated.' });
    }

    if (action === 'update_email') {
      const { admin_email } = body;
      
      await updateAdminSettings({
        admin_email: admin_email || null
      });

      return NextResponse.json({ success: true, admin_email, message: 'Authorized Google email updated.' });
    }

    return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
  } catch (err) {
    console.error('POST admin settings error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
