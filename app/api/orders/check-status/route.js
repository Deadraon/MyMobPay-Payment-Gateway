import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { triggerMerchantWebhook } from '@/lib/webhook';
import { checkAndProcessSubscription } from '@/lib/adminSettings';
import { syncOrderVerificationToPaymentLink } from '@/lib/paymentLinks';

export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`check_status_${clientIp}`, 60, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many status check requests. Please slow down.', code: 'RATE_LIMIT_EXCEEDED' },
        { status: 429, headers: { 'Retry-After': rateLimit.resetInSeconds.toString() } }
      );
    }

    const { order_id } = await request.json();
    if (!order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. Fetch order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('id, amount, status, note, created_at, mode, utr, customer_utr, merchant_id, project, callback_url, external_ref')
      .eq('id', order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. If already verified, return immediately
    if (order.status === 'verified' || order.status === 'completed' || order.status === 'paid') {
      return NextResponse.json({
        success: true,
        verified: true,
        status: order.status,
        message: 'Payment verified successfully!',
        order
      }, { status: 200 });
    }

    // 3. In Test Mode: Auto-verify when user tests the payment
    if (order.mode === 'test') {
      const mockUtr = 'TEST_' + Math.floor(100000000000 + Math.random() * 900000000000);
      const { data: updatedOrder, error: updateErr } = await supabaseAdmin
        .from('orders')
        .update({
          status: 'verified',
          utr: mockUtr,
          customer_utr: mockUtr,
          verified_at: new Date().toISOString()
        })
        .eq('id', order.id)
        .select()
        .single();

      if (!updateErr && updatedOrder) {
        try {
          await syncOrderVerificationToPaymentLink(order.id, mockUtr);
          await triggerMerchantWebhook(order.id);
        } catch (whErr) {
          console.error('Webhook error on test order check-status:', whErr);
        }

        return NextResponse.json({
          success: true,
          verified: true,
          status: 'verified',
          mode: 'test',
          message: 'Test payment verified successfully!',
          order: updatedOrder
        }, { status: 200 });
      }
    }

    // 4. In Live Mode: Check recent bank email alerts
    const cleanCustomerUtr = order.customer_utr ? String(order.customer_utr).trim() : null;

    // Check if any recent email matches customer UTR with matching amount
    if (cleanCustomerUtr && cleanCustomerUtr.length >= 8) {
      // Duplicate UTR check across already verified orders
      const { data: existingVerified } = await supabaseAdmin
        .from('orders')
        .select('id')
        .eq('utr', cleanCustomerUtr)
        .eq('status', 'verified')
        .neq('id', order.id)
        .limit(1);

      if (!existingVerified || existingVerified.length === 0) {
        let emailQuery = supabaseAdmin
          .from('email_logs')
          .select('*')
          .ilike('body_snippet', `%${cleanCustomerUtr}%`);

        if (order.merchant_id) {
          emailQuery = emailQuery.eq('merchant_id', order.merchant_id);
        }

        const { data: matchedEmail } = await emailQuery.limit(1);

        if (matchedEmail && matchedEmail.length > 0) {
          const snippet = matchedEmail[0].body_snippet || '';
          const orderAmt = parseFloat(order.amount);
          const formattedAmt = orderAmt.toFixed(2);
          const integerAmt = Math.floor(orderAmt).toString();

          const hasMatchingAmount =
            snippet.includes(formattedAmt) ||
            snippet.includes(`INR ${formattedAmt}`) ||
            snippet.includes(`Rs. ${formattedAmt}`) ||
            snippet.includes(`Rs.${formattedAmt}`) ||
            snippet.includes(`₹${formattedAmt}`) ||
            snippet.includes(`Rs. ${integerAmt}`) ||
            snippet.includes(`Rs.${integerAmt}`) ||
            snippet.includes(`INR ${integerAmt}`);

          if (hasMatchingAmount) {
            const { data: updatedOrder, error: updateErr } = await supabaseAdmin
              .from('orders')
              .update({
                status: 'verified',
                utr: cleanCustomerUtr,
                verified_at: new Date().toISOString()
              })
              .eq('id', order.id)
              .select()
              .single();

            if (!updateErr && updatedOrder) {
              try {
                await syncOrderVerificationToPaymentLink(order.id, cleanCustomerUtr);
                await checkAndProcessSubscription(updatedOrder, '');
                await triggerMerchantWebhook(order.id);
              } catch (e) {
                console.error('Post-verification tasks error:', e);
              }

              return NextResponse.json({
                success: true,
                verified: true,
                status: 'verified',
                message: 'Payment verified by bank credit alert!',
                order: updatedOrder
              }, { status: 200 });
            }
          } else {
            console.warn(`[Security Alert] UTR ${cleanCustomerUtr} found in bank log, but credited amount did not match required order amount ₹${formattedAmt}. Skipping auto-verification.`);
          }
        }
      }
    }

    // Check recent parsed emails matching exact amount created AFTER this order was placed
    const orderCreatedAt = order.created_at ? new Date(order.created_at).getTime() - 60000 : Date.now() - 30 * 60 * 1000;
    const orderCreatedIso = new Date(orderCreatedAt).toISOString();
    const formattedAmt = parseFloat(order.amount).toFixed(2);
    
    let recentEmailQuery = supabaseAdmin
      .from('email_logs')
      .select('*')
      .gte('created_at', orderCreatedIso)
      .order('created_at', { ascending: false });

    if (order.merchant_id) {
      recentEmailQuery = recentEmailQuery.eq('merchant_id', order.merchant_id);
    }

    const { data: recentEmails } = await recentEmailQuery.limit(10);

    if (recentEmails && recentEmails.length > 0) {
      for (const email of recentEmails) {
        const snippet = email.body_snippet || '';
        // Check if snippet contains matching amount
        if (
          snippet.includes(`AMT: ${formattedAmt}`) ||
          snippet.includes(`INR ${formattedAmt}`) ||
          snippet.includes(`Rs. ${formattedAmt}`) ||
          snippet.includes(`Rs.${formattedAmt}`) ||
          snippet.includes(`₹${formattedAmt}`)
        ) {
          // Extract genuine UTR from snippet if present
          const utrMatch =
            snippet.match(/UTR:\s*([A-Za-z0-9_]{8,35})/i) ||
            snippet.match(/UPI\/([0-9]{12})/i) ||
            snippet.match(/Ref\s*([0-9]{12})/i) ||
            snippet.match(/RRN\s*([0-9]{12})/i);

          // CRITICAL SECURITY: Never fabricate a fake UTR to auto-verify
          if (!utrMatch || !utrMatch[1]) {
            continue;
          }

          const foundUtr = utrMatch[1].trim();

          // Check if this UTR has already been used on ANY verified order
          const { data: dupCheck } = await supabaseAdmin
            .from('orders')
            .select('id')
            .eq('utr', foundUtr)
            .eq('status', 'verified')
            .limit(1);

          if (!dupCheck || dupCheck.length === 0) {
            const { data: updatedOrder, error: updateErr } = await supabaseAdmin
              .from('orders')
              .update({
                status: 'verified',
                utr: foundUtr,
                customer_utr: foundUtr,
                verified_at: new Date().toISOString()
              })
              .eq('id', order.id)
              .select()
              .single();

            if (!updateErr && updatedOrder) {
              try {
                await syncOrderVerificationToPaymentLink(order.id, foundUtr);
                await checkAndProcessSubscription(updatedOrder, '');
                await triggerMerchantWebhook(order.id);
              } catch (e) {
                console.error('Post-verification tasks error:', e);
              }

              return NextResponse.json({
                success: true,
                verified: true,
                status: 'verified',
                message: 'Payment confirmed via bank credit match!',
                order: updatedOrder
              }, { status: 200 });
            }
          }
        }
      }
    }

    // 5. Not verified yet
    return NextResponse.json({
      success: true,
      verified: false,
      status: order.status,
      message: 'Payment pending bank confirmation. If you already paid via UPI, enter your 12-digit UTR below to verify.'
    }, { status: 200 });

  } catch (err) {
    console.error('check-status error:', err);
    return NextResponse.json({ error: 'Internal server error', message: err.message }, { status: 500 });
  }
}
