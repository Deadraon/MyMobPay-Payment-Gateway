import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendSubscriptionInvoiceEmail } from '@/lib/mailer';
import { generateOrderId } from '@/lib/orderId';
import { resolveMerchantIdToUuid, formatMerchantId } from '@/lib/merchantId';

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      merchantId,
      planId = '1m',
      planName = '1 Month Starter Plan',
      amount = 499,
      durationDays = 30,
      utr = '',
    } = body;

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID is required.' }, { status: 400 });
    }

    const actualMerchantId = (await resolveMerchantIdToUuid(merchantId)) || merchantId;

    // 1. Fetch current merchant record
    const { data: merchant, error: fetchErr } = await supabaseAdmin
      .from('merchants')
      .select('id, business_name, upi_id, subscription_status, subscription_expires_at, setup_progress')
      .eq('id', actualMerchantId)
      .single();

    if (fetchErr || !merchant) {
      return NextResponse.json({ error: 'Merchant account not found.' }, { status: 404 });
    }

    const cleanUtr = String(utr || '').trim();

    // 1b. Duplicate UTR check to prevent replay fraud across different accounts
    if (cleanUtr && cleanUtr.length >= 10) {
      const { data: existingUtr } = await supabaseAdmin
        .from('orders')
        .select('id, merchant_id, external_ref')
        .eq('utr', cleanUtr)
        .eq('status', 'verified')
        .limit(1);

      if (existingUtr && existingUtr.length > 0) {
        const existing = existingUtr[0];
        if (existing.merchant_id !== actualMerchantId && existing.external_ref !== actualMerchantId) {
          return NextResponse.json({
            error: `UTR ${cleanUtr} has already been verified for another transaction.`,
            code: 'DUPLICATE_UTR'
          }, { status: 400 });
        }
      }
    }

    const isTrial = planId === 'trial' || planId === 'trial_3day';
    if (isTrial) {
      const alreadyUsed = Boolean(
        merchant.setup_progress?.trial_activated_at ||
        merchant.setup_progress?.plan_type === 'trial_3day' ||
        merchant.setup_progress?.trial_expired
      );
      if (alreadyUsed) {
        return NextResponse.json({
          error: 'Your 3-day free trial has already been used on this account. Please select a standard subscription plan.',
          code: 'TRIAL_ALREADY_USED',
        }, { status: 400 });
      }
    }

    // SECURITY: ALL plan activations (including 3-day trial ₹1 setup) MUST be backed by a verified order or authorized admin session
    const { verifyAdminAuth } = await import('@/lib/adminSettings');
    const isAdmin = await verifyAdminAuth(req);

    if (!isAdmin) {
      const orderLookupId = body.orderId || null;
      let verifiedOrder = null;

      if (orderLookupId) {
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('id, amount, status, merchant_id, external_ref, utr, method, mode')
          .eq('id', orderLookupId)
          .eq('status', 'verified')
          .maybeSingle();
        if (ord && (ord.merchant_id === actualMerchantId || ord.external_ref === actualMerchantId)) {
          const isCodOrMock = ord.method === 'COD' || 
                              (ord.utr && (ord.utr.startsWith('COD_') || ord.utr.startsWith('TS_MOCK_') || ord.utr.startsWith('TEST_')));
          if (!isCodOrMock && ord.mode !== 'test') {
            verifiedOrder = ord;
          }
        }
      } else if (cleanUtr) {
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('id, amount, status, merchant_id, external_ref, utr, method, mode')
          .eq('utr', cleanUtr)
          .eq('status', 'verified')
          .maybeSingle();
        if (ord && (ord.merchant_id === actualMerchantId || ord.external_ref === actualMerchantId)) {
          const isCodOrMock = ord.method === 'COD' || 
                              (ord.utr && (ord.utr.startsWith('COD_') || ord.utr.startsWith('TS_MOCK_') || ord.utr.startsWith('TEST_')));
          if (!isCodOrMock && ord.mode !== 'test') {
            verifiedOrder = ord;
          }
        }
      }

      if (!verifiedOrder) {
        return NextResponse.json({
          error: isTrial 
            ? 'Activating the 3-day trial requires payment of the ₹1.00 setup fee.' 
            : 'Paid subscription activation requires a verified transaction or active administrator authorization.',
          code: 'UNVERIFIED_PAYMENT'
        }, { status: 403 });
      }
    }

    // 2. Calculate new expiry date
    const effectiveDays = isTrial ? 3 : durationDays;
    const currentExpiry = merchant.subscription_expires_at ? new Date(merchant.subscription_expires_at) : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate.getTime() + effectiveDays * 24 * 60 * 60 * 1000);

    const nowIso = new Date().toISOString();
    const updatedProgress = {
      ...(merchant.setup_progress || {}),
      plan_type: isTrial ? 'trial_3day' : planId,
      last_payment_at: nowIso,
      subscription_activated_at: nowIso,
      ...(isTrial ? { trial_activated_at: nowIso } : {}),
    };

    // 3. Update merchant subscription in database (unlock live mode on trial/subscription)
    const { error: updateErr } = await supabaseAdmin
      .from('merchants')
      .update({
        subscription_status: 'active',
        subscription_expires_at: newExpiry.toISOString(),
        setup_progress: updatedProgress,
        sandbox_mode: false,
      })
      .eq('id', actualMerchantId);

    if (updateErr) {
      console.error('[SUB ACTIVATE API] Update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 4. Update matching pending subscription order or insert verified order for audit
    const invoiceRef = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const effectiveUtr = cleanUtr || `NPCI-${Date.now().toString().slice(-6)}`;

    let targetOrderId = body.orderId || null;
    if (!targetOrderId) {
      const { data: pendingOrders } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('external_ref', actualMerchantId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1);

      if (pendingOrders && pendingOrders.length > 0) {
        targetOrderId = pendingOrders[0].id;
      }
    }

    try {
      if (targetOrderId) {
        await supabaseAdmin
          .from('orders')
          .update({
            status: 'verified',
            utr: effectiveUtr,
            customer_utr: cleanUtr || null,
            verified_at: nowIso,
          })
          .eq('id', targetOrderId);
      } else {
        const orderId = generateOrderId();
        await supabaseAdmin.from('orders').insert({
          id: orderId,
          merchant_id: actualMerchantId,
          amount: parseFloat(amount) || 499,
          status: 'verified',
          note: `Subscription_${planId}`,
          external_ref: actualMerchantId,
          utr: effectiveUtr,
          customer_utr: cleanUtr || null,
          verified_at: nowIso,
        });
      }
    } catch (orderInsertErr) {
      console.warn('[SUB ACTIVATE API] Order insert/update notice:', orderInsertErr?.message);
    }

    // 5. Look up merchant email from Auth
    let recipientEmail = null;
    try {
      const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(actualMerchantId);
      recipientEmail = authUserData?.user?.email;
    } catch (authErr) {
      console.warn('[SUB ACTIVATE API] User auth lookup notice:', authErr?.message);
    }

    // 6. Send official GST Tax Invoice & Subscription Confirmation Email
    if (recipientEmail) {
      try {
        await sendSubscriptionInvoiceEmail({
          to: recipientEmail,
          businessName: merchant.business_name || 'Merchant Partner',
          mid: formatMerchantId(actualMerchantId),
          planName: planName,
          amount: parseFloat(amount) || 499,
          durationDays,
          expiryDate: newExpiry,
          invoiceRef,
          paymentMethod: 'Direct UPI Settlement (NPCI)',
          utr: utr || `NPCI-AUTO-${Date.now().toString().slice(-4)}`,
        });
        console.log(`[SUB ACTIVATE API] Dispatched subscription invoice to ${recipientEmail}`);
      } catch (mailErr) {
        console.error('[SUB ACTIVATE API] Invoice email dispatch error:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription successfully activated and invoice emailed.',
      subscription_status: 'active',
      subscription_expires_at: newExpiry.toISOString(),
      invoiceRef,
    });

  } catch (err) {
    console.error('[SUB ACTIVATE API] Exception:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
