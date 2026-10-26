import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth, ensureAdminMerchant } from '@/lib/adminSettings';
import { logAdminAction } from '@/lib/adminAudit';
import { getBrevoTransporter, getTransporter, getSendpulseTransporter } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

function formatMessageToHtml(rawMessage) {
  if (!rawMessage) return '';
  // Convert newlines to paragraphs/breaks and preserve markdown-like bold
  const formatted = rawMessage
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .split(/\n\s*\n/)
    .map(paragraph => `<p style="margin: 0 0 16px 0; font-size: 14.5px; line-height: 1.65; color: #334155;">${paragraph.replace(/\n/g, '<br/>')}</p>`)
    .join('');
  return formatted;
}

function buildAdminBrandedEmailHtml({
  subject,
  message,
  recipientName = 'Merchant Partner',
  callToActionText = '',
  callToActionUrl = '',
  templateType = 'custom',
}) {
  const currentYear = new Date().getFullYear();
  const formattedBody = formatMessageToHtml(message);

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${subject}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    @media only screen and (max-width: 480px) {
      .outer-cell { padding: 16px 10px !important; }
      .card-pad { padding: 20px 16px !important; }
      .cta-btn { width: 100% !important; display: block !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${subject} &bull; MyMobPay official update.
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
                    <span style="display: inline-block; background-color: #f1f5f9; color: #475569; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 9999px; border: 1px solid #e2e8f0;">
                      Notice
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
                    <h1 style="margin: 0 0 16px 0; font-size: 19px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      ${subject}
                    </h1>

                    <p style="margin: 0 0 14px 0; font-size: 14px; font-weight: 600; color: #1e293b;">
                      Hello ${recipientName},
                    </p>

                    <div style="color: #334155; font-size: 14px; line-height: 1.6;">
                      ${formattedBody}
                    </div>

                    ${callToActionText && callToActionUrl ? `
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 22px 0 16px 0;">
                        <tr>
                          <td align="center">
                            <a href="${callToActionUrl}" target="_blank" class="cta-btn" style="display: inline-block; width: 100%; max-width: 260px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px; text-align: center; box-sizing: border-box;">
                              ${callToActionText} &rarr;
                            </a>
                          </td>
                        </tr>
                      </table>
                    ` : ''}

                    <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 20px;">
                      <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #64748b;">
                        Warm regards,<br />
                        <strong style="color: #0f172a;">MyMobPay Operations Team</strong>
                      </p>
                    </div>

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
</html>`;
}

export async function POST(request) {
  try {
    const isAuthorized = await verifyAdminAuth(request);
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin authentication required.' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      to, 
      recipientName = 'Merchant Partner', 
      subject, 
      message, 
      templateType = 'custom',
      callToActionText = '',
      callToActionUrl = '',
      includeBrandedTemplate = true,
      merchantId = null
    } = body;

    if (!to || !subject || !message) {
      return NextResponse.json({ 
        error: 'Recipient email ("to"), "subject", and "message" are all required.' 
      }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const recipientEmails = Array.isArray(to) ? to : [to];

    for (const email of recipientEmails) {
      if (!emailRegex.test(String(email).trim())) {
        return NextResponse.json({ error: `Invalid email address format: "${email}"` }, { status: 400 });
      }
    }

    // Prepare HTML content
    const html = includeBrandedTemplate
      ? buildAdminBrandedEmailHtml({
          subject,
          message,
          recipientName,
          callToActionText,
          callToActionUrl,
          templateType
        })
      : `<div><h2>${subject}</h2><div>${message.replace(/\n/g, '<br/>')}</div></div>`;

    const text = `Subject: ${subject}\n\nHi ${recipientName},\n\n${message}\n\n${callToActionText ? `${callToActionText}: ${callToActionUrl}\n\n` : ''}Warm regards,\nMyMobPay Merchant Operations\nhttps://mymob.tech`;

    // Dispatch using Brevo SMTP (primary transactional) or Fallback Default SMTP
    const transporter = getBrevoTransporter() || getTransporter();
    if (!transporter) {
      return NextResponse.json({ 
        error: 'No active email transporter configured on server. Please verify BREVO_SMTP credentials in environment.' 
      }, { status: 500 });
    }

    const fromAddress = process.env.SMTP_FROM || process.env.EMAIL_FROM || '"MyMobPay Operations" <noreply@mymob.tech>';
    const replyToAddress = 'chauhankunal695@gmail.com, support@mymob.tech';

    const dispatchResults = [];
    for (const recipient of recipientEmails) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: recipient,
          replyTo: replyToAddress,
          subject,
          html,
          text
        });

        dispatchResults.push({
          email: recipient,
          success: true,
          messageId: info.messageId,
          timestamp: new Date().toISOString()
        });
      } catch (sendErr) {
        console.error(`Failed to dispatch email to ${recipient}:`, sendErr);
        dispatchResults.push({
          email: recipient,
          success: false,
          error: sendErr.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Save in persistent outbox history in admin_settings
    try {
      const adminMerchant = await ensureAdminMerchant();
      if (adminMerchant) {
        const setupProgress = adminMerchant.setup_progress || {};
        const adminSettings = setupProgress.admin_settings || {};
        const emailOutbox = Array.isArray(adminSettings.email_outbox) ? adminSettings.email_outbox : [];

        for (const res of dispatchResults) {
          emailOutbox.unshift({
            id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            to: res.email,
            recipient_name: recipientName,
            subject,
            template_type: templateType,
            status: res.success ? 'delivered' : 'failed',
            message_id: res.messageId || null,
            error: res.error || null,
            sent_at: res.timestamp,
            merchant_id: merchantId,
            snippet: message.slice(0, 140)
          });
        }

        // Keep last 200 outbox records
        const trimmedOutbox = emailOutbox.slice(0, 200);

        await supabaseAdmin
          .from('merchants')
          .update({
            setup_progress: {
              ...setupProgress,
              admin_settings: {
                ...adminSettings,
                email_outbox: trimmedOutbox
              }
            }
          })
          .eq('id', adminMerchant.id);
      }
    } catch (dbErr) {
      console.warn('Failed to record email outbox history in DB:', dbErr);
    }

    // Record in tamper-evident Admin Audit Log
    await logAdminAction({
      action: 'email.direct_sent',
      targetType: 'email',
      targetId: recipientEmails.join(', '),
      details: {
        recipientsCount: recipientEmails.length,
        subject,
        templateType,
        results: dispatchResults
      },
      request
    });

    const anySuccess = dispatchResults.some(r => r.success);
    if (!anySuccess) {
      return NextResponse.json({ 
        error: 'Failed to deliver email through SMTP server.', 
        details: dispatchResults 
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: `Email successfully sent to ${dispatchResults.filter(r => r.success).length} recipient(s).`,
      results: dispatchResults
    });

  } catch (err) {
    console.error('Direct email API error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error while sending email.' }, { status: 500 });
  }
}
