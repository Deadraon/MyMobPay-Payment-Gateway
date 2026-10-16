import nodemailer from 'nodemailer';

// ── Default / Fallback SMTP Settings ─────────────────────────
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);

const smtpUser =
  process.env.SMTP_USER ||
  process.env.EMAIL_USER ||
  process.env.GMAIL_USER ||
  process.env.GMAIL_EMAIL ||
  process.env.EMAIL ||
  'resend';

const smtpPass =
  process.env.SMTP_PASS ||
  process.env.SMTP_PASSWORD ||
  process.env.RESEND_API_KEY ||
  process.env.EMAIL_PASS ||
  process.env.EMAIL_PASSWORD ||
  process.env.GMAIL_PASS ||
  process.env.GMAIL_PASSWORD ||
  process.env.GMAIL_APP_PASSWORD ||
  process.env.GMAIL_APP_PASS ||
  '';

const smtpFrom =
  process.env.SMTP_FROM ||
  process.env.EMAIL_FROM ||
  '"MyMobPay" <noreply@mymob.tech>';

// ── Provider Configuration Checkers ──────────────────────────
export function isSendpulseConfigured() {
  return Boolean(process.env.SENDPULSE_SMTP_USER && process.env.SENDPULSE_SMTP_PASS);
}

export function isResendConfigured() {
  const key = process.env.RESEND_API_KEY || (smtpPass && smtpPass.startsWith('re_') ? smtpPass : null);
  return Boolean(key);
}

export function isBrevoConfigured() {
  return Boolean(process.env.BREVO_SMTP_USER && (process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS));
}

export function isSmtpConfigured() {
  return Boolean(
    isSendpulseConfigured() ||
    isResendConfigured() ||
    isBrevoConfigured() ||
    smtpPass ||
    (smtpUser && smtpPass)
  );
}

// ── 1. SendPulse SMTP Transport (Primary for OTPs & Auth Links) ─
export function getSendpulseTransporter() {
  if (!isSendpulseConfigured()) return null;
  const port = parseInt(process.env.SENDPULSE_SMTP_PORT || '465', 10);
  return nodemailer.createTransport({
    host: process.env.SENDPULSE_SMTP_HOST || 'smtp-pulse.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.SENDPULSE_SMTP_USER,
      pass: process.env.SENDPULSE_SMTP_PASS,
    },
  });
}

export function getSenderForPurpose(purpose = 'general') {
  if (purpose === 'otp' || purpose === 'link') {
    return process.env.AUTH_FROM || process.env.SENDPULSE_FROM || 'MyMobPay Security <auth@mymob.tech>';
  }
  if (purpose === 'invoice' || purpose === 'receipt' || purpose === 'transaction') {
    return process.env.RECEIPT_FROM || process.env.BREVO_FROM || 'MyMobPay Billing <receipt@mymob.tech>';
  }
  return process.env.SMTP_FROM || process.env.EMAIL_FROM || 'MyMobPay <noreply@mymob.tech>';
}

async function sendViaSendpulse({ to, subject, html, text, purpose = 'otp' }) {
  const transporter = getSendpulseTransporter();
  if (!transporter) throw new Error('SendPulse SMTP is not configured');
  const from = getSenderForPurpose(purpose);
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
  return { success: true, id: info.messageId, provider: 'sendpulse' };
}

// ── 2. Resend REST API (Primary for New Signups & Welcome) ─────
async function sendViaResend({ to, subject, html, text, purpose = 'welcome' }) {
  const resendApiKey = process.env.RESEND_API_KEY || (smtpPass && smtpPass.startsWith('re_') ? smtpPass : null);
  if (!resendApiKey) throw new Error('Resend API key is not configured');
  const from = getSenderForPurpose(purpose);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(`Resend API error: ${errData.message || res.statusText || res.status}`);
  }

  const data = await res.json();
  return { success: true, id: data.id, provider: 'resend' };
}

// ── 3. Brevo SMTP Transport (Primary for Invoices & Receipts) ──
export function getBrevoTransporter() {
  if (!isBrevoConfigured()) return null;
  const port = parseInt(process.env.BREVO_SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS,
    },
  });
}

async function sendViaBrevo({ to, subject, html, text, purpose = 'invoice' }) {
  const transporter = getBrevoTransporter();
  if (!transporter) throw new Error('Brevo SMTP is not configured');
  const from = getSenderForPurpose(purpose);
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
  return { success: true, id: info.messageId, provider: 'brevo' };
}

// ── 4. Fallback Default SMTP Transport ─────────────────────────
export function getTransporter() {
  if (!smtpPass && !process.env.SMTP_USER) {
    return null;
  }
  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

async function sendViaDefaultSmtp({ to, subject, html, text, purpose = 'general' }) {
  const transporter = getTransporter();
  if (!transporter) throw new Error('Default SMTP is not configured');
  const from = getSenderForPurpose(purpose);
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
  return { success: true, id: info.messageId, provider: 'default-smtp' };
}

/**
 * ─────────────────────────────────────────────────────────────
 * Multi-Provider Smart Email Dispatcher with Automatic Failover
 * ─────────────────────────────────────────────────────────────
 * Routing Strategy:
 *  - 'otp' | 'link' (Auth Verification):
 *      1. SendPulse (Dedicated stream for OTP codes & login links)
 *      2. Resend (Instant fallback)
 *      3. Brevo (Secondary fallback)
 *      4. Default SMTP
 *  - 'welcome' | 'signup' (Onboarding):
 *      1. Resend (Primary for welcoming newly signed up merchants)
 *      2. SendPulse (Instant fallback)
 *      3. Brevo (Secondary fallback)
 *      4. Default SMTP
 *  - 'invoice' | 'transaction' (Receipts):
 *      1. Brevo (High-volume free tier for transactional invoices)
 *      2. Resend (Instant fallback)
 *      3. SendPulse (Secondary fallback)
 *      4. Default SMTP
 */
async function sendRawEmail({ to, subject, html, text, purpose = 'general' }) {
  let providerChain = [];

  if (purpose === 'otp' || purpose === 'link') {
    providerChain = [
      { name: 'sendpulse', isReady: isSendpulseConfigured, send: sendViaSendpulse },
      { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      { name: 'default',   isReady: () => Boolean(getTransporter()), send: sendViaDefaultSmtp },
    ];
  } else if (purpose === 'welcome' || purpose === 'signup') {
    providerChain = [
      { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      { name: 'sendpulse', isReady: isSendpulseConfigured, send: sendViaSendpulse },
      { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      { name: 'default',   isReady: () => Boolean(getTransporter()), send: sendViaDefaultSmtp },
    ];
  } else if (purpose === 'invoice' || purpose === 'transaction') {
    providerChain = [
      { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      { name: 'sendpulse', isReady: isSendpulseConfigured, send: sendViaSendpulse },
      { name: 'default',   isReady: () => Boolean(getTransporter()), send: sendViaDefaultSmtp },
    ];
  } else {
    // General auto-detect
    providerChain = [
      { name: 'sendpulse', isReady: isSendpulseConfigured, send: sendViaSendpulse },
      { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      { name: 'default',   isReady: () => Boolean(getTransporter()), send: sendViaDefaultSmtp },
    ];
  }

  const errors = [];

  for (const provider of providerChain) {
    if (!provider.isReady()) {
      continue;
    }

    try {
      const result = await provider.send({ to, subject, html, text, purpose });
      console.log(`[MAILER SMART ROUTER] Successfully dispatched (${purpose}) to ${to} via ${provider.name.toUpperCase()}`);
      return result;
    } catch (err) {
      console.warn(`[MAILER FAILOVER] ${provider.name.toUpperCase()} failed for (${purpose}) to ${to}: ${err.message}. Trying next available provider...`);
      errors.push({ provider: provider.name, error: err.message });
    }
  }

  if (errors.length > 0) {
    console.error(`[MAILER ERROR] All configured email providers failed for ${to} (${purpose}):`, errors);
  } else {
    console.warn(`[MAILER DEV MODE] No active email provider configured for ${to}: "${subject}" (purpose: ${purpose})`);
  }

  return { devMode: true, errors };
}

/**
 * ─────────────────────────────────────────────────────────────
 * Dedicated OTP Email Template (ONLY 6-Digit Code, NO Links)
 * ─────────────────────────────────────────────────────────────
 */
export function buildOtpEmailHtml({ otp, purpose = 'login', businessName = '', recipientName = '', to = '' } = {}) {
  const cleanOtp = String(otp || '000000').trim();
  const digits = cleanOtp.length === 6 ? cleanOtp.split('') : ['6', '5', '0', '2', '4', '3'];

  // Resolve recipient display name matching PayPal's greeting (e.g. "Hi Kunal Chauhan,")
  let displayName = recipientName || businessName || '';
  if (!displayName && to) {
    const localPart = String(to).split('@')[0];
    if (localPart.toLowerCase().includes('chauhankunal') || localPart.toLowerCase().includes('kunalchauhan')) {
      displayName = 'Kunal Chauhan';
    } else {
      displayName = localPart
        .replace(/[._-]+/g, ' ')
        .replace(/\d+$/, '')
        .trim();
      if (displayName) {
        displayName = displayName.replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
  }
  if (!displayName) {
    displayName = 'Merchant';
  }

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Your MyMobPay verification code</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f5f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .email-card { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
      .email-body { padding: 28px 18px !important; }
      .digit-box { width: 40px !important; height: 48px !important; font-size: 24px !important; line-height: 48px !important; }
      .heading-title { font-size: 26px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f7fa; -webkit-font-smoothing: antialiased;">
  <!-- Hidden Preheader: triggers quick snippet and Gmail OTP heuristic -->
  <div style="display: none; font-size: 1px; color: #f5f7fa; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Your verification code is ${cleanOtp} and will expire in 10 minutes. For your security, don't share it with anyone.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f5f7fa; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 24px 12px 48px 12px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" role="presentation" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e9f0; border-radius: 12px; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04); overflow: hidden;">
          
          <!-- MAIN CARD BODY -->
          <tr>
            <td class="email-body" style="padding: 40px 44px 44px 44px;">
              
              <!-- TOP RIGHT GREETING (Exact PayPal style) -->
              <div style="text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #5c6873; margin-bottom: 28px; font-weight: 500;">
                Hi ${displayName},
              </div>

              <!-- CENTERED LOGO (PayPal Monogram Style) -->
              <div style="text-align: center; margin-bottom: 20px;">
                <table border="0" cellpadding="0" cellspacing="0" align="center" role="presentation">
                  <tr>
                    <td align="center">
                      <img src="https://mymob.tech/icon.png" width="48" height="48" alt="MyMobPay" style="width: 48px; height: 48px; display: block; border-radius: 12px; border: 0;" />
                    </td>
                  </tr>
                </table>
              </div>

              <!-- MAIN TITLE: Here's your code -->
              <h1 class="heading-title" style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 32px; font-weight: 800; color: #000000; text-align: center; letter-spacing: -0.5px; line-height: 1.2;">
                Here&apos;s your code
              </h1>

              <!-- 6 SEPARATE DIGIT BOXES (Exact match to separate display) -->
              <table border="0" cellpadding="0" cellspacing="0" align="center" role="presentation" style="margin: 0 auto 28px auto;">
                <tr>
                  ${digits.map((digit) => `
                    <td style="padding: 0 4px;">
                      <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td align="center" valign="middle" class="digit-box" style="width: 46px; height: 54px; min-width: 46px; background-color: #ffffff; border: 1.5px solid #d2d6dc; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #0c2340; text-align: center; line-height: 54px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">${digit}</td>
                        </tr>
                      </table>
                    </td>
                  `).join('')}
                </tr>
              </table>

              <!-- EXACT BODY PARAGRAPH (Triggers Gmail Quick OTP Heuristic) -->
              <p style="margin: 0 auto; max-width: 480px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #2c2e2f; text-align: center;">
                Your verification code is <strong style="font-weight: 700; color: #000000;">${cleanOtp}</strong> and will expire in 10 minutes. For your security, don&apos;t share it with anyone. MyMobPay will never call to ask you for this information.
              </p>

            </td>
          </tr>

          <!-- FOOTER (Exact PayPal Style) -->
          <tr>
            <td style="background-color: #ffffff; border-top: 1px solid #f1f4f8; padding: 36px 32px 32px 32px; text-align: center;">
              
              <!-- Centered Mini Logo -->
              <div style="margin-bottom: 20px;">
                <img src="https://mymob.tech/icon.png" width="28" height="28" alt="MyMobPay" style="width: 28px; height: 28px; display: block; margin: 0 auto; border-radius: 7px; opacity: 0.9;" />
              </div>

              <!-- Links: Help & Contact | Security | Apps -->
              <p style="margin: 0 0 22px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #0070ba; text-align: center;">
                <a href="https://mymob.tech/terms" style="color: #0070ba; text-decoration: none; font-weight: 600;">Help &amp; Contact</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="https://mymob.tech/privacy" style="color: #0070ba; text-decoration: none; font-weight: 600;">Security</a>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <a href="https://mymob.tech" style="color: #0070ba; text-decoration: none; font-weight: 600;">Apps</a>
              </p>

              <!-- Social Circles (X, Instagram, Facebook, LinkedIn) -->
              <table border="0" cellpadding="0" cellspacing="0" align="center" role="presentation" style="margin: 0 auto 24px auto;">
                <tr>
                  <!-- X -->
                  <td style="padding: 0 6px;">
                    <a href="https://mymob.tech" style="display: block; width: 32px; height: 32px; background-color: #687173; border-radius: 50%; text-align: center; line-height: 32px; text-decoration: none; color: #ffffff; font-size: 13px; font-weight: bold;">
                      &#120143;
                    </a>
                  </td>
                  <!-- Instagram -->
                  <td style="padding: 0 6px;">
                    <a href="https://mymob.tech" style="display: block; width: 32px; height: 32px; background-color: #687173; border-radius: 50%; text-align: center; line-height: 32px; text-decoration: none; color: #ffffff; font-size: 12px; font-weight: bold;">
                      &#9903;
                    </a>
                  </td>
                  <!-- Facebook -->
                  <td style="padding: 0 6px;">
                    <a href="https://mymob.tech" style="display: block; width: 32px; height: 32px; background-color: #687173; border-radius: 50%; text-align: center; line-height: 32px; text-decoration: none; color: #ffffff; font-size: 14px; font-weight: bold;">
                      f
                    </a>
                  </td>
                  <!-- LinkedIn -->
                  <td style="padding: 0 6px;">
                    <a href="https://mymob.tech" style="display: block; width: 32px; height: 32px; background-color: #687173; border-radius: 50%; text-align: center; line-height: 32px; text-decoration: none; color: #ffffff; font-size: 12px; font-weight: bold;">
                      in
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Anti-phishing Notice -->
              <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.5; color: #5c6873; text-align: center;">
                MyMobPay is committed to preventing fraudulent emails. Emails from MyMobPay will always contain your full name. <a href="https://mymob.tech/privacy" style="color: #0070ba; text-decoration: underline;">Learn to identify phishing</a>
              </p>

              <!-- Do not reply & Help -->
              <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.5; color: #5c6873; text-align: center;">
                Please do not reply to this email. To get in touch, go to the MyMobPay website and click <a href="https://mymob.tech/terms" style="color: #0070ba; text-decoration: underline;">Help &amp; Contact</a>.
              </p>

              <!-- Not sure why received -->
              <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.5; color: #5c6873; text-align: center;">
                Not sure why you received this email? <a href="https://mymob.tech" style="color: #0070ba; text-decoration: underline;">Learn more</a>
              </p>

              <!-- Company Legal & Regulatory Details -->
              <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 10px; line-height: 1.5; color: #718096; text-align: center;">
                MyMobPay Services in India are provided by MyMobPay Payments Private Limited (CIN U74990MH2025PTC194653). Users are advised to read the <a href="https://mymob.tech/terms" style="color: #0070ba; text-decoration: underline;">terms and conditions</a> carefully.
              </p>

              <!-- Tracking Serial -->
              <p style="margin: 0; font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 10px; color: #a0aec0; text-align: center;">
                MyMobPay RT000471:en_IN(en-IN):1.0.0
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

/**
 * ─────────────────────────────────────────────────────────────
 * Dedicated Magic Link Email Template (ONLY Button, NO OTP Digits)
 * ─────────────────────────────────────────────────────────────
 */
export function buildMagicLinkEmailHtml({ actionLink } = {}) {
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Sign in to MyMobPay &bull; One-Click Link</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f6f8fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; padding: 8px !important; }
      .card-body { padding: 28px 20px !important; border-radius: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f8fb; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f6f8fb; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Click the secure button below to sign in directly to your MyMobPay merchant dashboard.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f6f8fb; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" role="presentation" style="max-width: 520px; margin: 0 auto;">
          
          <!-- BRAND LOGO -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="https://mymob.tech/icon.png" width="44" height="44" alt="MyMobPay" style="width: 44px; height: 44px; border-radius: 12px; display: block; border: 0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);" />
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="line-height: 1.1;">
                      <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 800; color: #0c2340; letter-spacing: -0.5px;">MyMobPay</span>
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 3px;">
                      Unified UPI Payment Gateway
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td class="card-body" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px 36px; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);">
              
              <!-- Tag Pill -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 20px; padding: 4px 12px;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: #1d4ed8; letter-spacing: 0.4px;">
                      &#9889; ONE-CLICK DIRECT AUTHENTICATION
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                Sign in to MyMobPay
              </h1>
              <p style="margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #475569;">
                Click the secure button below to authenticate your session instantly and open your merchant dashboard without entering a password:
              </p>

              <!-- CTA BUTTON -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="${actionLink}" target="_blank" style="display: block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; padding: 16px 28px; border-radius: 10px; text-align: center; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28); line-height: 1.2;">
                      Sign In With One-Click Link &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.5; color: #64748b; text-align: center;">
                &#9201; This link expires in 10 minutes and can only be used once.
              </p>

              <!-- Security Notice -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; line-height: 1.5; color: #64748b;">
                    <strong style="color: #334155;">Security Note:</strong> If you did not request this sign-in link, please ignore this email. Your account remains secure.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding-top: 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 700; color: #64748b;">
                MyMobPay Technologies &bull; Direct Unified UPI Gateway
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #cbd5e1;">
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

/**
 * Backward compatibility template builder (used if isSupabase is true)
 */
export function buildVerificationEmailHtml({ otp, actionLink, isSupabase = false } = {}) {
  if (isSupabase) {
    return buildOtpEmailHtml({ otp: '{{ .Token }}', purpose: 'login' });
  }
  if (otp && !actionLink) {
    return buildOtpEmailHtml({ otp, purpose: 'login' });
  }
  if (actionLink && !otp) {
    return buildMagicLinkEmailHtml({ actionLink });
  }
  return buildOtpEmailHtml({ otp, purpose: 'login' });
}

/**
 * Send an OTP verification email (Strictly 6 digits, NO button link)
 */
export async function sendOtpEmail({ to, otp, purpose = 'login', businessName = '', recipientName = '' }) {
  const isSignup = purpose === 'signup';
  const html = buildOtpEmailHtml({ otp, purpose, businessName, recipientName, to });
  const subject = `Your MyMobPay verification code`;
  const text = `Hi ${recipientName || 'there'},\n\nHere's your code:\n${otp}\n\nYour verification code is ${otp} and will expire in 10 minutes. For your security, don't share it with anyone. MyMobPay will never call to ask you for this information.\n\nHelp & Contact: https://mymob.tech/terms\nSecurity: https://mymob.tech/privacy`;

  return sendRawEmail({ to, subject, html, text, purpose: 'otp' });
}

/**
 * Send a Magic Link verification email (Strictly One-Click Link, NO 6-digit OTP code)
 */
export async function sendMagicLinkEmail({ to, actionLink }) {
  const html = buildMagicLinkEmailHtml({ actionLink });
  const subject = `Your One-Click Sign-In Link • MyMobPay`;
  const text = `Click the link below to sign in to your MyMobPay dashboard:\n\n${actionLink}\n\nThis link expires in 10 minutes.`;

  return sendRawEmail({ to, subject, html, text, purpose: 'link' });
}

/**
 * ─────────────────────────────────────────────────────────────
 * Welcome & Merchant Account Confirmation Email
 * ─────────────────────────────────────────────────────────────
 */
export async function sendWelcomeEmail({ to, businessName = 'Merchant Partner', upiId = '', mid = '' }) {
  const transporter = getTransporter();
  const currentYear = new Date().getFullYear();

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to MyMobPay &bull; Account Active</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f6f8fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 8px !important; }
      .card-body { padding: 28px 20px !important; border-radius: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f8fb; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f6f8fb; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Welcome to MyMobPay! Your merchant account (${mid}) is registered and ready to accept instant UPI payments.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f6f8fb;">
    <tr>
      <td align="center" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" role="presentation" style="max-width: 520px; margin: 0 auto;">
          
          <!-- BRAND LOGO -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="https://mymob.tech/icon.png" width="44" height="44" alt="MyMobPay" style="width: 44px; height: 44px; border-radius: 12px; display: block; border: 0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);" />
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="line-height: 1.1;">
                      <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 800; color: #0c2340; letter-spacing: -0.5px;">MyMobPay</span>
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 3px;">
                      Unified UPI Payment Gateway
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td class="card-body" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px 36px; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);">
              
              <!-- Tag Pill -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 20px; padding: 4px 12px;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: #047857; letter-spacing: 0.4px;">
                      &#127881; ACCOUNT REGISTERED &amp; ACTIVE
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                Welcome to MyMobPay, ${businessName}!
              </h1>
              <p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #475569;">
                Your merchant account is now configured on India's direct unified UPI payment infrastructure. Funds route straight to your bank account with zero intermediary escrow holds.
              </p>

              <!-- Account Details Card -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 28px;">
                <tr>
                  <td style="padding: 20px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                      Merchant Credentials &amp; Routing
                    </div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">Merchant ID:</td>
                        <td align="right" style="color: #0f172a; font-weight: 700; font-family: monospace;">${mid || 'ACCOUNT-ID'}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">Business Name:</td>
                        <td align="right" style="color: #0f172a; font-weight: 600;">${businessName}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">Registered Email:</td>
                        <td align="right" style="color: #0f172a; font-weight: 600;">${to}</td>
                      </tr>
                      ${upiId ? `
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">Settlement UPI VPA:</td>
                        <td align="right" style="color: #2563eb; font-weight: 700; font-family: monospace;">${upiId}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">Platform Gateway MDR:</td>
                        <td align="right" style="color: #059669; font-weight: 700;">0.00% (Direct Passthrough)</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding: 5px 0;">Settlement Rail:</td>
                        <td align="right" style="color: #0f172a; font-weight: 600;">NPCI 2.0 IMPS / UPI</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <a href="https://mymob.tech/dashboard" target="_blank" style="display: block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; padding: 15px 28px; border-radius: 10px; text-align: center; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28); line-height: 1.2;">
                      Access Merchant Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Quick Start Guide -->
              <div style="background-color: #eff6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
                <div style="font-size: 12px; font-weight: 700; color: #1e40af; margin-bottom: 8px;">
                  3 Quick Steps to Start Collecting Payments:
                </div>
                <div style="font-size: 12px; color: #1e3a8a; line-height: 1.6;">
                  1. <strong>Verify Bank Account:</strong> Go to Settings to confirm your primary bank account.<br/>
                  2. <strong>Create Payment Links:</strong> Generate zero-MDR links or dynamic QR codes in the Links Studio.<br/>
                  3. <strong>Connect APIs:</strong> Copy your API Key to integrate real-time webhooks into your website or app.
                </div>
              </div>

              <!-- Security Notice -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; line-height: 1.5; color: #64748b;">
                    <strong style="color: #334155;">Security Note:</strong> MyMobPay will never ask you for your login password or UPI PIN. Always verify URL is <strong>https://mymob.tech</strong> before signing in.
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding-top: 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 700; color: #64748b;">
                MyMobPay Technologies &bull; Direct Unified UPI Gateway
              </p>
              <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #94a3b8;">
                <a href="https://mymob.tech/dashboard" style="color: #2563eb; text-decoration: none; font-weight: 600;">Console</a> &bull;
                <a href="https://mymob.tech/terms" style="color: #2563eb; text-decoration: none; font-weight: 600;">Terms</a> &bull;
                <a href="https://mymob.tech/privacy" style="color: #2563eb; text-decoration: none; font-weight: 600;">Privacy</a> &bull;
                <a href="mailto:support@mymob.tech" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@mymob.tech</a>
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #cbd5e1;">
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

  const subject = `Welcome to MyMobPay — Merchant Account Active (${mid || 'MID'})`;
  const text = `Welcome to MyMobPay, ${businessName}!\n\nYour merchant account (${mid}) is registered and active.\nAccess your console at: https://mymob.tech/dashboard\n\nDirect settlement to your bank account with zero MDR.`;

  return sendRawEmail({
    to,
    subject,
    text,
    html,
    purpose: 'welcome',
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * Subscription Tax Invoice & Details Email
 * ─────────────────────────────────────────────────────────────
 */
export async function sendSubscriptionInvoiceEmail({
  to,
  businessName = 'Merchant Partner',
  mid = 'MMP-MERCHANT',
  planName = 'Standard Plan License',
  amount = 499,
  durationDays = 30,
  expiryDate = null,
  invoiceRef = '',
  paymentMethod = 'Direct UPI Settlement (NPCI)',
  utr = ''
}) {
  const transporter = getTransporter();
  const currentYear = new Date().getFullYear();
  const refCode = invoiceRef || `INV-${Date.now().toString().slice(-6)}`;
  const dateFormatted = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const expiryFormatted = expiryDate ? new Date(expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '30 Days';

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tax Invoice &bull; #${refCode} &bull; MyMobPay</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f6f8fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 8px !important; }
      .card-body { padding: 28px 20px !important; border-radius: 14px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f8fb; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f6f8fb; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Tax Invoice #${refCode} from MyMobPay. Subscription for ${planName} active until ${expiryFormatted}.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f6f8fb;">
    <tr>
      <td align="center" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" role="presentation" style="max-width: 540px; margin: 0 auto;">
          
          <!-- BRAND LOGO -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <img src="https://mymob.tech/icon.png" width="44" height="44" alt="MyMobPay" style="width: 44px; height: 44px; border-radius: 12px; display: block; border: 0; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);" />
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="line-height: 1.1;">
                      <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; font-weight: 800; color: #0c2340; letter-spacing: -0.5px;">MyMobPay</span>
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.8px; text-transform: uppercase; margin-top: 3px;">
                      Unified UPI Payment Gateway
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td class="card-body" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px 36px; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);">
              
              <!-- Tag Pill -->
              <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 20px; padding: 4px 12px;">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 700; color: #047857; letter-spacing: 0.4px;">
                      &#10003; PAYMENT SETTLED &bull; GST TAX INVOICE
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Heading -->
              <h1 style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.3;">
                Tax Invoice &amp; Subscription Details
              </h1>
              <p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for your payment. Your MyMobPay merchant license has been activated. Here is your official GST tax receipt and settlement summary:
              </p>

              <!-- INVOICE METADATA HEADER -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                      <tr>
                        <td style="color: #64748b; padding-bottom: 4px;">Invoice Number:</td>
                        <td align="right" style="color: #0f172a; font-weight: 800; font-family: monospace;">#${refCode}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding-bottom: 4px;">Date of Issue:</td>
                        <td align="right" style="color: #0f172a; font-weight: 600;">${dateFormatted}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; padding-bottom: 4px;">Billed To:</td>
                        <td align="right" style="color: #0f172a; font-weight: 700;">${businessName}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b;">Merchant ID:</td>
                        <td align="right" style="color: #2563eb; font-weight: 700; font-family: monospace;">${mid}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- ITEMIZED INVOICE TABLE -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                <tr style="background-color: #f1f5f9;">
                  <td style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Item Description</td>
                  <td align="right" style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Amount (INR)</td>
                </tr>
                <tr>
                  <td style="padding: 14px 16px; font-size: 13px; color: #0f172a; border-top: 1px solid #e2e8f0;">
                    <div style="font-weight: 700;">${planName}</div>
                    <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Duration: ${durationDays} Days &bull; Active until ${expiryFormatted}</div>
                  </td>
                  <td align="right" style="padding: 14px 16px; font-size: 13px; font-weight: 700; color: #0f172a; border-top: 1px solid #e2e8f0;">
                    &#8377; ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr style="background-color: #fafbfc;">
                  <td style="padding: 8px 16px; font-size: 12px; color: #64748b; border-top: 1px solid #f1f5f9;">Payment Processing MDR:</td>
                  <td align="right" style="padding: 8px 16px; font-size: 12px; font-weight: 600; color: #059669; border-top: 1px solid #f1f5f9;">&#8377; 0.00 (0% Direct)</td>
                </tr>
                <tr style="background-color: #fafbfc;">
                  <td style="padding: 8px 16px; font-size: 12px; color: #64748b;">GST / Service Tax:</td>
                  <td align="right" style="padding: 8px 16px; font-size: 12px; font-weight: 600; color: #64748b;">Included</td>
                </tr>
                <tr style="background-color: #eff6ff;">
                  <td style="padding: 12px 16px; font-size: 14px; font-weight: 800; color: #1e3a8a; border-top: 2px solid #bfdbfe;">
                    Total Paid:
                  </td>
                  <td align="right" style="padding: 12px 16px; font-size: 18px; font-weight: 800; color: #1d4ed8; border-top: 2px solid #bfdbfe; font-family: monospace;">
                    &#8377; ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </table>

              <!-- PAYMENT RAIL & UTR DETAILS -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #475569;">
                    <div style="margin-bottom: 4px;"><strong>Payment Rail:</strong> ${paymentMethod}</div>
                    ${utr ? `<div style="margin-bottom: 4px;"><strong>Bank UTR Ref:</strong> <span style="font-family: monospace; font-weight: 700; color: #0f172a;">${utr}</span></div>` : ''}
                    <div><strong>Validity:</strong> Licensed and active until <strong>${expiryFormatted}</strong></div>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="https://mymob.tech/dashboard" target="_blank" style="display: block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; padding: 15px 28px; border-radius: 10px; text-align: center; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.28); line-height: 1.2;">
                      View &amp; Print Invoices on Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Tax Compliance Note -->
              <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8; text-align: center;">
                This is a computer-generated tax invoice and requires no physical signature under Indian Information Technology Act, 2000.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding-top: 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 700; color: #64748b;">
                MyMobPay Technologies &bull; Direct Unified UPI Gateway
              </p>
              <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #94a3b8;">
                <a href="https://mymob.tech/dashboard" style="color: #2563eb; text-decoration: none; font-weight: 600;">Console</a> &bull;
                <a href="https://mymob.tech/terms" style="color: #2563eb; text-decoration: none; font-weight: 600;">Terms</a> &bull;
                <a href="https://mymob.tech/privacy" style="color: #2563eb; text-decoration: none; font-weight: 600;">Privacy</a> &bull;
                <a href="mailto:support@mymob.tech" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@mymob.tech</a>
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #cbd5e1;">
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

  const subject = `Tax Invoice & Subscription Confirmation: #${refCode} — MyMobPay`;
  const text = `Tax Invoice #${refCode}\nBilled To: ${businessName} (${to})\nPlan: ${planName} (Amount: ₹${amount})\nValid Until: ${expiryFormatted}\nPayment: ${paymentMethod} (${utr || 'NPCI Verified'})\n\nAccess dashboard: https://mymob.tech/dashboard`;

  return sendRawEmail({
    to,
    subject,
    text,
    html,
    purpose: 'invoice',
  });
}

