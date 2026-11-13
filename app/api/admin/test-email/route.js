import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import {
  sendOtpEmail,
  sendSubscriptionInvoiceEmail,
  isMailflareConfigured,
  isSendpulseConfigured,
  isResendConfigured,
  isBrevoConfigured,
  isEmailLabsConfigured,
  isMailerooConfigured,
  isUnitpostConfigured,
  getMailflareTransporter,
  getEmailLabsTransporter,
  getMailerooTransporter,
  getUnitpostTransporter
} from '@/lib/mailer';
import { verifyAdminAuth } from '@/lib/adminSettings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function mask(str, visibleChars = 4) {
  if (!str) return '(not set)';
  if (str.length <= visibleChars) return '***';
  return str.slice(0, visibleChars) + '***' + str.slice(-2);
}

export async function GET(req) {
  return handleDiagnostic(req);
}

export async function POST(req) {
  return handleDiagnostic(req);
}

async function handleDiagnostic(req) {
  const isAuthorized = await verifyAdminAuth(req);
  if (!isAuthorized) {
    return NextResponse.json({ error: 'Unauthorized: Invalid or missing admin credentials.' }, { status: 401 });
  }

  const url = new URL(req.url);
  const targetEmail = url.searchParams.get('to') || 'chauhankunal695@gmail.com';
  const timestamp = new Date().toISOString();

  const envAudit = {
    mailflare: {
      user: mask(process.env.MAILFLARE_SMTP_USER),
      passSet: Boolean(process.env.MAILFLARE_SMTP_PASS || process.env.MAILFLARE_API_KEY),
      mailboxIdSet: Boolean(process.env.MAILFLARE_MAILBOX_ID),
      host: process.env.MAILFLARE_SMTP_HOST || 'email.mymobpay.tech (default)',
      port: process.env.MAILFLARE_SMTP_PORT || '587 (default)',
      isConfigured: isMailflareConfigured(),
    },
    sendpulse: {
      user: mask(process.env.SENDPULSE_SMTP_USER),
      passSet: Boolean(process.env.SENDPULSE_SMTP_PASS),
      host: process.env.SENDPULSE_SMTP_HOST || 'smtp-pulse.com (default)',
      port: process.env.SENDPULSE_SMTP_PORT || '465 (default)',
      isConfigured: isSendpulseConfigured(),
    },
    emaillabs: {
      user: mask(process.env.EMAILLABS_SMTP_USER),
      passSet: Boolean(process.env.EMAILLABS_SMTP_PASS),
      host: process.env.EMAILLABS_SMTP_HOST || 'smtp-relay.emaillabs.net.pl (default)',
      port: process.env.EMAILLABS_SMTP_PORT || '587 (default)',
      isConfigured: isEmailLabsConfigured(),
    },
    maileroo: {
      user: mask(process.env.MAILEROO_SMTP_USER),
      passSet: Boolean(process.env.MAILEROO_SMTP_PASS),
      apiKeySet: Boolean(process.env.MAILEROO_API_KEY),
      host: process.env.MAILEROO_SMTP_HOST || 'smtp.maileroo.com (default)',
      port: process.env.MAILEROO_SMTP_PORT || '587 (default)',
      isConfigured: isMailerooConfigured(),
    },
    unitpost: {
      user: mask(process.env.UNITPOST_SMTP_USER || 'unitpost'),
      passSet: Boolean(process.env.UNITPOST_SMTP_PASS || process.env.UNITPOST_API_KEY),
      apiKeySet: Boolean(process.env.UNITPOST_API_KEY),
      host: process.env.UNITPOST_SMTP_HOST || 'smtp.unitpost.com (default)',
      port: process.env.UNITPOST_SMTP_PORT || '587 (default)',
      isConfigured: isUnitpostConfigured(),
    },
    resend: {
      apiKey: mask(process.env.RESEND_API_KEY || (process.env.SMTP_PASS?.startsWith('re_') ? process.env.SMTP_PASS : null)),
      isConfigured: isResendConfigured(),
    },
    brevo: {
      user: mask(process.env.BREVO_SMTP_USER),
      keySet: Boolean(process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS),
      host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com (default)',
      port: process.env.BREVO_SMTP_PORT || '587 (default)',
      isConfigured: isBrevoConfigured(),
    },
  };

  const testResults = {
    mailflare: { status: 'PENDING', message: '' },
    sendpulse: { status: 'PENDING', message: '' },
    emaillabs: { status: 'PENDING', message: '' },
    maileroo: { status: 'PENDING', message: '' },
    unitpost: { status: 'PENDING', message: '' },
    brevo: { status: 'PENDING', message: '' },
    resend: { status: 'PENDING', message: '' },
  };

  // 0. Test Mailflare
  if (isMailflareConfigured()) {
    const apiKey = process.env.MAILFLARE_API_KEY || process.env.MAILFLARE_SMTP_PASS;
    const mailboxId = process.env.MAILFLARE_MAILBOX_ID;
    const rawHost = process.env.MAILFLARE_SMTP_HOST || 'email.mymobpay.tech';
    const baseUrl = process.env.MAILFLARE_BASE_URL || (rawHost.startsWith('http') ? rawHost : `https://${rawHost}`);
    const cleanBase = baseUrl.replace(/\/$/, '');

    if (apiKey && mailboxId) {
      try {
        const from = process.env.MAILFLARE_FROM || 'MyMobPay <noreply@mymobpay.tech>';
        const res = await fetch(`${cleanBase}/api/v1/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            mailboxId,
            from,
            to: [targetEmail],
            subject: `🚀 MyMobPay Server Test: Mailflare [${new Date().toLocaleTimeString('en-IN')}]`,
            html: `<div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #0f172a; margin-top: 0;">🎉 Mailflare Connected Successfully!</h2>
              <p style="color: #334155;">This email verifies that your self-hosted Mailflare instance (<strong>${cleanBase}</strong>) is transmitting emails cleanly for <strong>MyMobPay</strong> via REST API (Port 443).</p>
              <ul style="color: #64748b; font-size: 13px;">
                <li><strong>Provider:</strong> Mailflare REST API</li>
                <li><strong>Mailbox ID:</strong> ${mailboxId}</li>
                <li><strong>Recipient:</strong> ${targetEmail}</li>
              </ul>
            </div>`,
            text: `This email verifies that your Mailflare instance (${cleanBase}) is functioning correctly for MyMobPay.`,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const errMsg = errData.error?.message || (typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error || errData));
          testResults.mailflare = {
            status: 'FAILED',
            error: `Mailflare REST error (HTTP ${res.status}): ${errMsg || res.statusText}`,
          };
        } else {
          const data = await res.json().catch(() => ({}));
          testResults.mailflare = {
            status: 'SUCCESS',
            messageId: data.id || data.messageId || 'mf-verified',
            message: 'Authenticated & test email dispatched successfully via Mailflare REST API.',
          };
        }
      } catch (err) {
        testResults.mailflare = {
          status: 'FAILED',
          error: `Mailflare connection error: ${err.message}`,
        };
      }
    } else if (apiKey && !mailboxId) {
      // Validate the API key against /api/v1/send
      try {
        const probeRes = await fetch(`${cleanBase}/api/v1/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({}),
        });

        if (probeRes.status === 400) {
          testResults.mailflare = {
            status: 'ACTION_REQUIRED',
            message: 'API Key is authenticated and valid! Add MAILFLARE_MAILBOX_ID to .env.local to dispatch emails (Cloudflare blocks raw SMTP port 587).',
          };
        } else if (probeRes.status === 401) {
          testResults.mailflare = {
            status: 'FAILED',
            error: 'Mailflare rejected the API key (HTTP 401 Unauthorized). Please check MAILFLARE_SMTP_PASS.',
          };
        } else {
          testResults.mailflare = {
            status: 'ACTION_REQUIRED',
            message: `Mailflare responded with HTTP ${probeRes.status}. Set MAILFLARE_MAILBOX_ID to send emails.`,
          };
        }
      } catch (err) {
        testResults.mailflare = {
          status: 'FAILED',
          error: `Could not reach ${cleanBase}: ${err.message}`,
        };
      }
    }
  } else {
    testResults.mailflare = {
      status: 'NOT_CONFIGURED',
      message: 'MAILFLARE_SMTP_PASS (API Key) or MAILFLARE_SMTP_USER is not defined.',
    };
  }

  // 1. Test Brevo
  if (isBrevoConfigured()) {
    try {
      const port = parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
      const host = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user: process.env.BREVO_SMTP_USER,
          pass: process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS,
        },
      });

      await transporter.verify();
      const info = await transporter.sendMail({
        from: process.env.AUTH_FROM || 'MyMobPay Security <auth@mymobpay.tech>',
        to: targetEmail,
        subject: `✅ MyMobPay Vercel Server Test: Brevo [${new Date().toLocaleTimeString('en-IN')}]`,
        html: `<p>This email verifies that Brevo is working on the live Vercel cloud server.</p>`,
      });
      testResults.brevo = {
        status: 'SUCCESS',
        messageId: info.messageId,
        message: 'Handshake verified & email delivered successfully from Vercel.',
      };
    } catch (err) {
      testResults.brevo = {
        status: 'FAILED',
        error: err.message,
      };
    }
  } else {
    testResults.brevo = {
      status: 'NOT_CONFIGURED',
      message: 'BREVO_SMTP_USER or BREVO_SMTP_KEY is not defined in Vercel environment.',
    };
  }

  // 2. Test SendPulse
  if (isSendpulseConfigured()) {
    try {
      const port = parseInt(process.env.SENDPULSE_SMTP_PORT || '465', 10);
      const host = process.env.SENDPULSE_SMTP_HOST || 'smtp-pulse.com';
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user: process.env.SENDPULSE_SMTP_USER,
          pass: process.env.SENDPULSE_SMTP_PASS,
        },
      });

      await transporter.verify();
      const info = await transporter.sendMail({
        from: process.env.SENDPULSE_FROM || 'MyMobPay Billing <trx@mymobpay.tech>',
        to: targetEmail,
        subject: `🧾 MyMobPay Vercel Server Test: SendPulse [${new Date().toLocaleTimeString('en-IN')}]`,
        html: `<p>This email verifies that SendPulse SMTP is working on the live Vercel cloud server.</p>`,
      });
      testResults.sendpulse = {
        status: 'SUCCESS',
        messageId: info.messageId,
        message: 'Handshake verified & invoice email delivered successfully from Vercel.',
      };
    } catch (err) {
      testResults.sendpulse = {
        status: 'FAILED',
        error: err.message,
      };
    }
  } else {
    testResults.sendpulse = {
      status: 'NOT_CONFIGURED',
      message: 'SENDPULSE_SMTP_USER or SENDPULSE_SMTP_PASS is not defined in Vercel environment.',
    };
  }

  // 3. Test EmailLabs
  if (isEmailLabsConfigured()) {
    try {
      const transporter = getEmailLabsTransporter();
      await transporter.verify();
      const info = await transporter.sendMail({
        from: process.env.AUTH_FROM || 'MyMobPay Security <auth@mymobpay.tech>',
        to: targetEmail,
        subject: `🌐 MyMobPay Vercel Server Test: EmailLabs [${new Date().toLocaleTimeString('en-IN')}]`,
        html: `<p>This email verifies that EmailLabs SMTP is working on the live Vercel cloud server.</p>`,
      });
      testResults.emaillabs = {
        status: 'SUCCESS',
        messageId: info.messageId,
        message: 'Handshake verified & email delivered successfully from Vercel via EmailLabs.',
      };
    } catch (err) {
      testResults.emaillabs = {
        status: 'FAILED',
        error: err.message,
      };
    }
  } else {
    testResults.emaillabs = {
      status: 'NOT_CONFIGURED',
      message: 'EMAILLABS_SMTP_USER or EMAILLABS_SMTP_PASS is not defined in Vercel environment.',
    };
  }

  // 4. Test Maileroo
  if (isMailerooConfigured()) {
    try {
      const transporter = getMailerooTransporter();
      if (transporter) {
        await transporter.verify();
        const info = await transporter.sendMail({
          from: process.env.AUTH_FROM || 'MyMobPay Security <auth@mymobpay.tech>',
          to: targetEmail,
          subject: `🦘 MyMobPay Vercel Server Test: Maileroo [${new Date().toLocaleTimeString('en-IN')}]`,
          html: `<p>This email verifies that Maileroo SMTP is working on the live Vercel cloud server.</p>`,
        });
        testResults.maileroo = {
          status: 'SUCCESS',
          messageId: info.messageId,
          message: 'Handshake verified & email delivered successfully from Vercel via Maileroo SMTP.',
        };
      } else if (process.env.MAILEROO_API_KEY) {
        const from = process.env.AUTH_FROM || 'MyMobPay Security <auth@mymobpay.tech>';
        const res = await fetch('https://smtp.maileroo.com/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.MAILEROO_API_KEY,
          },
          body: JSON.stringify({
            from,
            to: targetEmail,
            subject: `🦘 MyMobPay Vercel Server Test: Maileroo API [${new Date().toLocaleTimeString('en-IN')}]`,
            html: `<p>This email verifies that Maileroo REST API is working on the live Vercel cloud server.</p>`,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`Maileroo API Error HTTP ${res.status}: ${errData.message || res.statusText}`);
        }
        const data = await res.json();
        testResults.maileroo = {
          status: 'SUCCESS',
          messageId: data.id || data.message_id,
          message: 'Maileroo API authenticated & email dispatched successfully from Vercel.',
        };
      }
    } catch (err) {
      testResults.maileroo = {
        status: 'FAILED',
        error: err.message,
      };
    }
  } else {
    testResults.maileroo = {
      status: 'NOT_CONFIGURED',
      message: 'MAILEROO_SMTP_USER/PASS or MAILEROO_API_KEY is not defined in Vercel environment.',
    };
  }

  // 5. Test Unitpost
  if (isUnitpostConfigured()) {
    try {
      const apiKey = process.env.UNITPOST_API_KEY;
      const from = process.env.AUTH_FROM || 'MyMobPay Security <auth@mymobpay.tech>';

      if (apiKey) {
        const res = await fetch('https://www.unitpost.com/api/v1/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from,
            to: [targetEmail],
            subject: `📮 MyMobPay Vercel Server Test: Unitpost [${new Date().toLocaleTimeString('en-IN')}]`,
            html: `<p>This email verifies that Unitpost API is working on the live Vercel cloud server.</p>`,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(`Unitpost API Error HTTP ${res.status}: ${errData.message || res.statusText}`);
        }
        const data = await res.json().catch(() => ({}));
        testResults.unitpost = {
          status: 'SUCCESS',
          messageId: data.id || data.message_id || 'unitpost-test-ok',
          message: 'Unitpost API authenticated & email dispatched successfully from Vercel.',
        };
      } else {
        const transporter = getUnitpostTransporter();
        await transporter.verify();
        const info = await transporter.sendMail({
          from,
          to: targetEmail,
          subject: `📮 MyMobPay Vercel Server Test: Unitpost SMTP [${new Date().toLocaleTimeString('en-IN')}]`,
          html: `<p>This email verifies that Unitpost SMTP is working on the live Vercel cloud server.</p>`,
        });
        testResults.unitpost = {
          status: 'SUCCESS',
          messageId: info.messageId,
          message: 'Handshake verified & email delivered successfully from Vercel via Unitpost SMTP.',
        };
      }
    } catch (err) {
      testResults.unitpost = {
        status: 'FAILED',
        error: err.message,
      };
    }
  } else {
    testResults.unitpost = {
      status: 'NOT_CONFIGURED',
      message: 'UNITPOST_API_KEY or UNITPOST_SMTP_PASS is not defined in Vercel environment.',
    };
  }

  // 6. Test Resend
  const resendApiKey = process.env.RESEND_API_KEY || (process.env.SMTP_PASS?.startsWith('re_') ? process.env.SMTP_PASS : null);
  if (resendApiKey) {
    try {
      const from = process.env.AUTH_FROM || 'MyMobPay Security <auth@mymobpay.tech>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [targetEmail],
          subject: `⚡ MyMobPay Vercel Server Test: Resend [${new Date().toLocaleTimeString('en-IN')}]`,
          html: `<p>This email verifies that Resend REST API is working on the live Vercel cloud server.</p>`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`Resend API Error HTTP ${res.status}: ${errData.message || res.statusText}`);
      }

      const data = await res.json();
      testResults.resend = {
        status: 'SUCCESS',
        messageId: data.id,
        message: 'Resend API authenticated & email dispatched successfully from Vercel.',
      };
    } catch (err) {
      testResults.resend = {
        status: 'FAILED',
        error: err.message,
      };
    }
  } else {
    testResults.resend = {
      status: 'NOT_CONFIGURED',
      message: 'RESEND_API_KEY is not defined in Vercel environment.',
    };
  }

  return NextResponse.json({
    success: true,
    server: 'Vercel Cloud Production',
    targetEmail,
    timestamp,
    environmentAudit: envAudit,
    testResults,
  });
}
