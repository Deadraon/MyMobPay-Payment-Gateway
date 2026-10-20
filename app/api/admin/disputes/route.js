import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth, ensureAdminMerchant } from '@/lib/adminSettings';
import { logAdminAction } from '@/lib/adminAudit';
import { getBrevoTransporter, getTransporter } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

const DEFAULT_DISPUTES = [
  {
    id: 'disp_901',
    order_id: 'ord_demo_101',
    utr: '408912345678',
    customer_phone: '+91 9811122334',
    customer_name: 'Amit Verma',
    amount: 1499,
    merchant_name: 'TechStore India',
    merchant_email: 'support@techstore.in',
    status: 'open', // open, evidence_requested, merchant_responded, resolved, escalated
    reason: 'Money debited from customer SBI bank account, but store order was not marked fulfilled.',
    created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    sla_deadline: new Date(Date.now() + 42 * 60 * 60 * 1000).toISOString(),
    timeline: [
      { timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), action: 'Dispute submitted by payer with UTR 408912345678' }
    ]
  },
  {
    id: 'disp_902',
    order_id: 'ord_demo_102',
    utr: '408988776655',
    customer_phone: '+91 9722233445',
    customer_name: 'Pooja Nair',
    amount: 3200,
    merchant_name: 'Kunal Fashion',
    merchant_email: 'chauhankunal695@gmail.com',
    status: 'merchant_responded',
    reason: 'Incorrect product delivered; customer requested payment verification confirmation.',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    sla_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    timeline: [
      { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), action: 'Customer lodged verification dispute' },
      { timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), action: 'Merchant submitted proof of order dispatch' }
    ]
  }
];

async function getStoredDisputes() {
  try {
    const adminMerchant = await ensureAdminMerchant();
    const stored = adminMerchant?.setup_progress?.admin_settings?.disputes;
    if (Array.isArray(stored) && stored.length > 0) return stored;
    
    // Seed default disputes if empty so the desk always has active records
    if (adminMerchant) {
      saveDisputes(DEFAULT_DISPUTES).catch(() => {});
    }
  } catch (err) {
    console.error('getStoredDisputes error:', err);
  }
  return DEFAULT_DISPUTES;
}

async function saveDisputes(disputes) {
  try {
    const adminMerchant = await ensureAdminMerchant();
    if (adminMerchant) {
      const setupProgress = adminMerchant.setup_progress || {};
      const adminSettings = setupProgress.admin_settings || {};

      await supabaseAdmin
        .from('merchants')
        .update({
          setup_progress: {
            ...setupProgress,
            admin_settings: {
              ...adminSettings,
              disputes
            }
          }
        })
        .eq('id', adminMerchant.id);
    }
  } catch (err) {
    console.error('saveDisputes error:', err);
  }
}

export async function GET(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const disputes = await getStoredDisputes();
    return NextResponse.json({ success: true, disputes });
  } catch (err) {
    console.error('Disputes GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Access Denied' }, { status: 401 });
    }

    const body = await request.json();
    const { action, disputeId, status, note, notifyMerchant } = body;
    const disputes = await getStoredDisputes();

    if (action === 'update_status') {
      const target = disputes.find(d => d.id === disputeId);
      if (!target) return NextResponse.json({ error: 'Dispute record not found' }, { status: 404 });

      const prevStatus = target.status;
      target.status = status;
      target.timeline.push({
        timestamp: new Date().toISOString(),
        action: `Status transitioned from ${prevStatus} to ${status}. Note: ${note || 'Updated by admin team'}`
      });

      await saveDisputes(disputes);

      // Notify merchant if requested via Brevo email
      if (notifyMerchant && target.merchant_email) {
        try {
          const transporter = getBrevoTransporter() || getTransporter();
          if (transporter) {
            await transporter.sendMail({
              from: '"MyMobPay Operations" <support@mymob.tech>',
              to: target.merchant_email,
              subject: `Action Required: Payment Dispute #${target.id} Update`,
              html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
                  <h2 style="color: #1e293b;">Payment Inquiry / Dispute Notification</h2>
                  <p>Hello <strong>${target.merchant_name}</strong>,</p>
                  <p>An inquiry regarding order <code>${target.order_id}</code> (UTR: <code>${target.utr}</code>, Amount: ₹${target.amount}) has been updated by platform operations:</p>
                  <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px; margin: 16px 0;">
                    <strong>Status:</strong> ${status.toUpperCase().replace('_', ' ')}<br/>
                    <strong>Ops Message:</strong> ${note || 'Please review this transaction and liaise directly with your customer.'}
                  </div>
                  <p style="font-size: 12px; color: #64748b;">
                    *Reminder: MyMobPay operates on non-custodial direct rails and does not debit or touch merchant bank funds.
                  </p>
                </div>
              `
            });
          }
        } catch (e) {
          console.warn('Failed to send dispute email:', e);
        }
      }

      await logAdminAction({
        action: 'dispute.status_updated',
        targetType: 'dispute',
        targetId: disputeId,
        details: { fromStatus: prevStatus, toStatus: status, note },
        request
      });

      return NextResponse.json({ success: true, dispute: target, disputes });
    }

    if (action === 'create_dispute') {
      const { orderId, utr, amount, customerPhone, customerName, merchantName, merchantEmail, reason } = body;
      const newDispute = {
        id: `disp_${Date.now()}`,
        order_id: orderId || `ord_${Date.now().toString().slice(-6)}`,
        utr: utr || 'Awaiting UTR',
        amount: parseFloat(amount) || 0,
        customer_phone: customerPhone || 'N/A',
        customer_name: customerName || 'Payer',
        merchant_name: merchantName || 'Merchant Partner',
        merchant_email: merchantEmail || '',
        status: 'open',
        reason: reason || 'Customer lodged payment evidence claim',
        created_at: new Date().toISOString(),
        sla_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        timeline: [
          { timestamp: new Date().toISOString(), action: 'Dispute ticket registered in operations queue' }
        ]
      };

      disputes.unshift(newDispute);
      await saveDisputes(disputes);

      await logAdminAction({
        action: 'dispute.created',
        targetType: 'dispute',
        targetId: newDispute.id,
        details: { utr: newDispute.utr, amount: newDispute.amount, merchant: newDispute.merchant_name },
        request
      });

      return NextResponse.json({ success: true, dispute: newDispute, disputes });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Disputes POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
