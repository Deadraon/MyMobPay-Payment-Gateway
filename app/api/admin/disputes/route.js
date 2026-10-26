import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth, ensureAdminMerchant } from '@/lib/adminSettings';
import { logAdminAction } from '@/lib/adminAudit';
import { getBrevoTransporter, getTransporter } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

const DEFAULT_DISPUTES = [];

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
            const currentYear = new Date().getFullYear();
            const statusLabel = status.toUpperCase().replace('_', ' ');
            await transporter.sendMail({
              from: '"MyMobPay Operations" <support@mymob.tech>',
              to: target.merchant_email,
              subject: `Action Required: Payment Inquiry #${target.id} Update`,
              html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Payment Inquiry Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #334155;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 580px; margin: 0 auto;">
          
          <!-- BRAND TOP BAR -->
          <tr>
            <td style="padding-bottom: 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="https://mymob.tech/icon.png" width="38" height="38" alt="MyMobPay" style="width: 38px; height: 38px; border-radius: 10px; display: block; border: 0;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; line-height: 1.2;">MyMobPay</div>
                          <div style="font-size: 11px; font-weight: 500; color: #64748b; letter-spacing: 0.2px;">Merchant Operations &bull; Dispute Desk</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 10.5px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px;">
                      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #d97706; margin-right: 5px; vertical-align: middle;"></span>${statusLabel}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 36px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px -4px rgba(15,23,42,0.06);">
              
              <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.35; letter-spacing: -0.3px;">
                Payment Inquiry / Dispute Update
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 14.5px; line-height: 1.6; color: #475569;">
                Hello <strong style="color: #0f172a;">${target.merchant_name}</strong>, platform operations has updated the status of inquiry ticket <strong style="color: #0f172a;">#${target.id}</strong>.
              </p>

              <!-- INQUIRY DETAILS TABLE -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; border-collapse: separate;">
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0; width: 35%;">Order ID</td>
                  <td style="padding: 12px 16px; font-size: 12.5px; font-weight: 700; color: #0f172a; font-family: ui-monospace, Menlo, monospace; border-bottom: 1px solid #e2e8f0;">${target.order_id}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Bank UTR</td>
                  <td style="padding: 12px 16px; font-size: 12.5px; font-weight: 700; color: #0f172a; font-family: ui-monospace, Menlo, monospace; border-bottom: 1px solid #e2e8f0;">${target.utr}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b; border-bottom: 1px solid #e2e8f0;">Disputed Amount</td>
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: 800; color: #0f172a; border-bottom: 1px solid #e2e8f0;">₹${target.amount}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 600; color: #64748b;">Current Status</td>
                  <td style="padding: 12px 16px; font-size: 12.5px; font-weight: 700; color: #0f172a;">${statusLabel}</td>
                </tr>
              </table>

              <!-- OPS NOTE BOX -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 3.5px solid #0f172a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Operations Note</div>
                <div style="font-size: 13.5px; line-height: 1.6; color: #1e293b;">
                  ${note || 'Please review this transaction with your customer and verify receipt in your linked bank statement.'}
                </div>
              </div>

              <!-- CTA BUTTON -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td>
                    <a href="https://mymob.tech/dashboard" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 13.5px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; letter-spacing: 0.2px;">
                      Open Merchant Console &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- NON-CUSTODIAL NOTICE -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px;">
                <p style="margin: 0; font-size: 11.5px; line-height: 1.5; color: #64748b;">
                  <strong style="color: #0f172a;">Non-Custodial Architecture:</strong> MyMobPay operates on direct peer-to-merchant UPI rails and does not escrow, hold, or debit merchant bank funds. All chargebacks or refunds are coordinated directly between merchant and payer.
                </p>
              </div>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0 0 6px 0; font-size: 11.5px; color: #94a3b8;">
                Inquiry Reference: #${target.id} &bull; MyMobPay Operations Support
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                &copy; ${currentYear} MyMobPay (mymob.tech). All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
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
