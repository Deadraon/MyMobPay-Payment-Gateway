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
  <title>Payment inquiry #${target.id}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    @media only screen and (max-width: 480px) {
      .outer-cell { padding: 16px 10px !important; }
      .card-pad { padding: 20px 16px !important; }
      .k-col { width: 36% !important; font-size: 12px !important; }
      .v-col { font-size: 12px !important; }
      .cta-btn { width: 100% !important; display: block !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Payment inquiry #${target.id} update: ${statusLabel}. Amount: ₹${target.amount}.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 28px 14px 40px 14px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 540px; margin: 0 auto;">
          
          <!-- BRAND TOP BAR -->
          <tr>
            <td style="padding-bottom: 16px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 10px;">
                          <img src="https://mymob.tech/icon.png" width="32" height="32" alt="MyMobPay" style="width: 32px; height: 32px; border-radius: 8px; display: block; border: 1px solid #e2e8f0;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 16px; font-weight: 700; color: #0f172a; display: block; line-height: 1.2;">MyMobPay</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #fef3c7; color: #92400e; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 9999px; border: 1px solid #fde68a;">
                      ${statusLabel}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
                <tr>
                  <td class="card-pad" style="padding: 24px 20px;">
                    <h1 style="margin: 0 0 4px 0; font-size: 19px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      Payment inquiry update
                    </h1>
                    <p style="margin: 0 0 18px 0; font-size: 13.5px; color: #64748b; line-height: 1.5;">
                      Ticket #${target.id} &bull; ${target.merchant_name}
                    </p>

                    <!-- SPEC TABLE -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; border-collapse: separate;">
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0; width: 36%;">Order ID</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12px; font-family: ui-monospace, Menlo, monospace; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0; word-break: break-all;">${target.order_id}</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Bank UTR</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12px; font-family: ui-monospace, Menlo, monospace; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0; word-break: break-all;">${target.utr}</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Amount</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 13px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0;">&#8377;${target.amount}</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500;">Status</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12.5px; font-weight: 600; color: #0f172a;">${statusLabel}</td>
                      </tr>
                    </table>

                    <!-- NOTE BOX -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; margin-bottom: 20px;">
                      <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px;">Operations Note</div>
                      <div style="font-size: 13px; line-height: 1.5; color: #1e293b;">
                        ${note || 'Please review this transaction with your customer and verify in your bank statement.'}
                      </div>
                    </div>

                    <!-- CTA BUTTON -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                      <tr>
                        <td align="center">
                          <a href="https://mymob.tech/dashboard" target="_blank" class="cta-btn" style="display: inline-block; width: 100%; max-width: 260px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px; text-align: center; box-sizing: border-box;">
                            Open Merchant Console &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding-top: 20px; text-align: center;">
              <p style="margin: 0; font-size: 11.5px; color: #94a3b8;">
                MyMobPay &bull; Direct UPI Rails &bull; <a href="https://mymob.tech" style="color: #64748b; text-decoration: none;">mymob.tech</a>
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
