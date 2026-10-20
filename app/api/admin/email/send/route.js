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
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 580px; margin: 0 auto;">
          
          <!-- Logo & Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="https://mymob.tech/icon.png" width="42" height="42" alt="MyMobPay" style="width: 42px; height: 42px; border-radius: 12px; display: block;" />
                  </td>
                  <td style="vertical-align: middle;">
                    <span style="font-size: 22px; font-weight: 800; color: #0c2340; letter-spacing: -0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">MyMobPay</span>
                    <div style="font-size: 10.5px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase;">Direct Bank UPI Payment Rails</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 36px 32px; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);">
              
              <!-- Subject Header -->
              <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 18px; margin-bottom: 22px;">
                <span style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                  Official Communication
                </span>
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.35;">
                  ${subject}
                </h1>
              </div>

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 700; color: #1e293b;">
                Hello ${recipientName},
              </p>

              <!-- Body Message -->
              <div style="color: #334155; font-size: 14.5px; line-height: 1.65;">
                ${formattedBody}
              </div>

              <!-- Call to Action Button (if provided) -->
              ${callToActionText && callToActionUrl ? `
                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 28px 0 20px 0;">
                  <tr>
                    <td align="center">
                      <a href="${callToActionUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 32px; border-radius: 12px; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);">
                        ${callToActionText} &rarr;
                      </a>
                    </td>
                  </tr>
                </table>
              ` : ''}

              <!-- Security / Operational Notice -->
              <div style="background-color: #f8fafc; border-left: 3.5px solid #2563eb; padding: 12px 16px; border-radius: 0 10px 10px 0; margin-top: 26px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                  <strong>Zero-Commission Rails:</strong> MyMobPay delivers customer UPI payments directly to your linked bank account with 0% transaction fees.
                </p>
              </div>

              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0 20px 0;" />

              <!-- Sign-off -->
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                Warm regards,<br />
                <strong style="color: #0f172a;">MyMobPay Merchant Operations Team</strong><br />
                <span style="font-size: 12px; color: #94a3b8;">Direct UPI Rails &bull; mymob.tech</span>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 24px;">
              <p style="margin: 0 0 6px 0; font-size: 11.5px; color: #94a3b8;">
                This direct email was sent by an authorized administrator of MyMobPay Payments Private Limited.
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
