import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth, ensureAdminMerchant } from '@/lib/adminSettings';
import { logAdminAction } from '@/lib/adminAudit';
import {
  getBrevoTransporter,
  getTransporter,
  getSendpulseTransporter,
  sendRawEmail
} from '@/lib/mailer';

export const dynamic = 'force-dynamic';

function formatMessageToHtml(rawMessage) {
  if (!rawMessage) return '';
  // Convert newlines to paragraphs/breaks and preserve markdown-like bold/italic in Apple SF style
  const formatted = rawMessage
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #1d1d1f; font-weight: 600;">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color: #424245;">$1</em>')
    .split(/\n\s*\n/)
    .map(paragraph => `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #424245; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif;">${paragraph.replace(/\n/g, '<br/>')}</p>`)
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
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1d1d1f; }
    @media only screen and (max-width: 480px) {
      .outer-cell { padding: 24px 12px 32px 12px !important; }
      .card-pad { padding: 28px 20px !important; }
      .cta-btn { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f5f5f7; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${subject} &bull; MyMobPay official update.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 560px; margin: 0 auto;">
          
          <!-- APPLE MINIMAL BRAND HEADER -->
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
                          <span style="font-size: 15px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.015em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">MyMobPay</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="font-size: 11px; font-weight: 500; color: #86868b; text-transform: uppercase; letter-spacing: 0.08em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      ${templateType ? templateType.replace(/_/g, ' ') : 'Official'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD (APPLE PURE WHITE WITH HAIRLINE BORDER) -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e5e5ea; border-radius: 18px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
                <tr>
                  <td class="card-pad" style="padding: 36px 32px;">
                    
                    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #1d1d1f; line-height: 1.25; letter-spacing: -0.02em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                      ${subject}
                    </h1>

                    <p style="margin: 0 0 18px 0; font-size: 15px; font-weight: 500; color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      Hello ${recipientName},
                    </p>

                    <div style="color: #424245; font-size: 15px; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      ${formattedBody}
                    </div>

                    ${callToActionText && callToActionUrl ? `
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 28px 0 16px 0;">
                        <tr>
                          <td align="left">
                            <a href="${callToActionUrl}" target="_blank" class="cta-btn" style="display: inline-block; background-color: #0071e3; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 26px; border-radius: 980px; letter-spacing: -0.01em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif; box-sizing: border-box;">
                              ${callToActionText}
                            </a>
                          </td>
                        </tr>
                      </table>
                    ` : ''}

                    <div style="border-top: 1px solid #e5e5ea; padding-top: 20px; margin-top: 28px;">
                      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #86868b; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                        Warm regards,<br />
                        <strong style="color: #1d1d1f; font-weight: 500;">MyMobPay Team</strong>
                      </p>
                    </div>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- APPLE MINIMALIST FOOTER -->
          <tr>
            <td align="center" style="padding-top: 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; line-height: 1.6; color: #86868b; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                MyMobPay &bull; Direct UPI Rails &bull; <a href="https://mymobpay.tech" style="color: #0071e3; text-decoration: none;">mymobpay.tech</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #aeaeb2; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                Copyright &copy; ${currentYear} MyMobPay Inc. All rights reserved.
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
      merchantId = null,
      provider = 'auto',
      senderFormat = 'auto'
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

    const text = `Subject: ${subject}\n\nHi ${recipientName},\n\n${message}\n\n${callToActionText ? `${callToActionText}: ${callToActionUrl}\n\n` : ''}Warm regards,\nMyMobPay Merchant Operations\nhttps://mymobpay.tech`;

    // Dispatch using Multi-Provider Smart Router with automatic failover or direct manual override
    const dispatchResults = [];
    for (const recipient of recipientEmails) {
      try {
        const result = await sendRawEmail({
          to: recipient,
          subject,
          html,
          text,
          purpose: 'general',
          provider: provider !== 'auto' ? provider : null,
          senderFormat: senderFormat !== 'auto' ? senderFormat : null,
        });

        dispatchResults.push({
          email: recipient,
          success: true,
          messageId: result.id || result.messageId || 'sent',
          provider: result.provider || provider || 'smart-router',
          senderFormat: senderFormat || 'auto',
          timestamp: new Date().toISOString()
        });
      } catch (sendErr) {
        console.error(`Failed to dispatch email to ${recipient}:`, sendErr);
        dispatchResults.push({
          email: recipient,
          success: false,
          error: sendErr.message,
          provider: provider || 'smart-router',
          senderFormat: senderFormat || 'auto',
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
            provider: res.provider || 'smart-router',
            sender_format: res.senderFormat || 'auto',
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
