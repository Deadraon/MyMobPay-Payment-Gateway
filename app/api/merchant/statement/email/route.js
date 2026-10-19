import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendMonthlyStatementEmail } from '@/lib/mailer';
import { formatMerchantId } from '@/lib/merchantId';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req) {
  try {
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(`statement_email_${clientIp}`, 10, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many statement requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return NextResponse.json({ error: 'Please sign in to request a statement.' }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    const user = authData?.user;
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session. Please sign in again.' }, { status: 401 });
    }

    // Only the authenticated account and its confirmed email may receive a statement.
    const actualMerchantId = user.id;
    const recipientEmail = user.email;
    if (!recipientEmail || !user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'A verified account email is required to receive statements.' },
        { status: 403 }
      );
    }

    const { month, year } = await req.json();

    // 1. Fetch merchant details
    const { data: merchant, error: fetchErr } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, upi_id')
      .eq('id', actualMerchantId)
      .single();

    if (fetchErr || !merchant) {
      return NextResponse.json({ error: 'Merchant account not found.' }, { status: 404 });
    }

    // 2. Calculate target month and date boundaries
    const now = new Date();
    const targetYear = parseInt(year, 10) || now.getFullYear();
    const targetMonth = parseInt(month, 10) || (now.getMonth() + 1); // 1-12

    const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthName = monthNames[targetMonth - 1] || 'Current';
    const monthYear = `${monthName} ${targetYear}`;
    const statementPeriod = `01 ${monthName.slice(0, 3)} ${targetYear} – ${endDate.getUTCDate()} ${monthName.slice(0, 3)} ${targetYear}`;

    // 3. Query merchant orders for this month
    const { data: orders, error: ordersErr } = await supabaseAdmin
      .from('orders')
      .select('id, amount, status, utr, customer_utr, external_ref, customer_name, created_at, mode')
      .eq('merchant_id', actualMerchantId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (ordersErr) {
      console.error('[STATEMENT EMAIL API] Orders query error:', ordersErr);
      return NextResponse.json({ error: 'Failed to retrieve transactions for statement.' }, { status: 500 });
    }

    const orderList = orders || [];
    const settledOrders = orderList.filter(o => o.status === 'verified' || o.status === 'completed' || o.status === 'paid');
    const totalVolume = settledOrders.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    const successfulCount = settledOrders.length;
    const failedCount = orderList.filter(o => o.status === 'failed' || o.status === 'cancelled' || o.status === 'expired').length;
    const transactionCount = orderList.length;

    // 4. Send the statement via SendPulse
    const result = await sendMonthlyStatementEmail({
      to: recipientEmail,
      businessName: merchant.business_name || 'Merchant Partner',
      mid: formatMerchantId(actualMerchantId),
      monthYear,
      totalVolume,
      transactionCount,
      successfulCount,
      failedCount,
      settlementVpa: merchant.upi_id || merchant.settlement_vpa || 'Direct Bank Settlement (NPCI)',
      statementPeriod,
      recentOrders: orderList.slice(0, 20),
    });

    return NextResponse.json({
      success: true,
      message: `Monthly account statement for ${monthYear} successfully dispatched to ${recipientEmail} via SendPulse.`,
      recipientEmail,
      monthYear,
      totalVolume,
      transactionCount,
      provider: result.provider || 'sendpulse',
      messageId: result.id || null
    });

  } catch (err) {
    console.error('[STATEMENT EMAIL API] Unexpected error:', err);
    return NextResponse.json({ error: err.message || 'Failed to dispatch monthly statement' }, { status: 500 });
  }
}
