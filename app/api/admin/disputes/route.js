import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth, ensureAdminMerchant } from '@/lib/adminSettings';
import { logAdminAction } from '@/lib/adminAudit';
import { sendRawEmail } from '@/lib/mailer';

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

      // Notify merchant if requested via Smart Router (support@mymobpay.tech)
      if (notifyMerchant && target.merchant_email) {
        try {
          const currentYear = new Date().getFullYear();
          const statusLabel = status.toUpperCase().replace('_', ' ');
          await sendRawEmail({
            to: target.merchant_email,
            subject: `Action Required: Payment Inquiry #${target.id} Update`,
            purpose: 'support',
            senderFormat: 'support',
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
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1d1d1f; }
    @media only screen and (max-width: 480px) {
      .outer-cell { padding: 20px 12px !important; }
      .card-pad { padding: 24px 20px !important; }
      .k-col { width: 38% !important; font-size: 12px !important; }
      .v-col { font-size: 12px !important; }
      .cta-btn { width: 100% !important; display: block !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f5f5f7; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Payment inquiry #${target.id} update: ${statusLabel}. Amount: ₹${target.amount}.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 520px; margin: 0 auto;">
          
          <!-- BRAND TOP BAR -->
          <tr>
            <td style="padding-bottom: 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 10px;">
                          <img src="https://mymobpay.tech/icon.png" width="28" height="28" alt="MyMobPay" style="width: 28px; height: 28px; border-radius: 7px; display: block; border: 1px solid #e5e5ea;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 15px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.01em;">MyMobPay</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="font-size: 11px; font-weight: 600; color: #86868b; text-transform: uppercase; letter-spacing: 0.04em;">
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
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e5e5ea; border-radius: 18px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
                <tr>
                  <td class="card-pad" style="padding: 32px 28px;">
                    <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.02em; line-height: 1.25;">
                      Payment inquiry update
                    </h1>
                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #424245; line-height: 1.5;">
                      Case #${target.id} &bull; ${target.merchant_name}
                    </p>

                    <!-- SPEC TABLE (HAIRLINE ROWS) -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="border-top: 1px solid #e5e5ea; border-bottom: 1px solid #e5e5ea; margin-bottom: 24px;">
                      <tr>
                        <td class="k-col" style="padding: 10px 0; font-size: 13px; color: #86868b; border-bottom: 1px solid #f2f2f7; width: 38%;">Order ID</td>
                        <td class="v-col" align="right" style="padding: 10px 0; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #1d1d1f; font-weight: 500; border-bottom: 1px solid #f2f2f7; word-break: break-all;">${target.order_id}</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 10px 0; font-size: 13px; color: #86868b; border-bottom: 1px solid #f2f2f7;">Bank UTR</td>
                        <td class="v-col" align="right" style="padding: 10px 0; font-size: 13px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #1d1d1f; font-weight: 500; border-bottom: 1px solid #f2f2f7; word-break: break-all;">${target.utr}</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 10px 0; font-size: 13px; color: #86868b; border-bottom: 1px solid #f2f2f7;">Amount</td>
                        <td class="v-col" align="right" style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #1d1d1f; border-bottom: 1px solid #f2f2f7;">&#8377;${target.amount}</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 10px 0; font-size: 13px; color: #86868b;">Status</td>
                        <td class="v-col" align="right" style="padding: 10px 0; font-size: 13px; font-weight: 600; color: #0071e3;">${statusLabel}</td>
                      </tr>
                    </table>

                    <!-- NOTE CALLOUT -->
                    <div style="background-color: #f5f5f7; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
                      <div style="font-size: 11px; font-weight: 600; color: #86868b; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px;">Resolution Note</div>
                      <div style="font-size: 13px; line-height: 1.5; color: #1d1d1f;">
                        ${note || 'Please review this transaction with your customer and verify in your bank statement.'}
                      </div>
                    </div>

                    <!-- APPLE PILL CTA -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                      <tr>
                        <td align="center">
                          <a href="https://mymobpay.tech/dashboard" target="_blank" class="cta-btn" style="display: inline-block; background-color: #0071e3; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 32px; border-radius: 980px; text-align: center;">
                            Open Merchant Console
                          </a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- APPLE FOOTER -->
          <tr>
            <td align="center" style="padding-top: 24px; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #86868b;">
                MyMobPay &bull; Direct Bank UPI Rails &bull; <a href="https://mymobpay.tech" style="color: #0071e3; text-decoration: none;">mymobpay.tech</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #aeaeb2;">
                &copy; 2026 MyMobPay Payments Inc. All rights reserved.
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
