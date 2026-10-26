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

// ── 1. SendPulse SMTP Transport (Exclusively for Subscription Invoices & Monthly Statements) ─
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
  // STRICT RULE: trx@mymob.tech is exclusively reserved for transaction statements & subscription receipts
  if (purpose === 'invoice' || purpose === 'subscription' || purpose === 'statement') {
    return process.env.SENDPULSE_FROM || process.env.BILLING_FROM || 'MyMobPay Billing <trx@mymob.tech>';
  }
  if (purpose === 'otp' || purpose === 'link') {
    return process.env.AUTH_FROM || 'MyMobPay Security <auth@mymob.tech>';
  }
  return process.env.SMTP_FROM || process.env.EMAIL_FROM || 'MyMobPay <noreply@mymob.tech>';
}

async function sendViaSendpulse({ to, subject, html, text, purpose = 'invoice' }) {
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
  let from = getSenderForPurpose(purpose);
  // Brevo only allows verified sender addresses: auth@mymob.tech or trx@mymob.tech
  if (from.includes('noreply@mymob.tech')) {
    from = process.env.AUTH_FROM || 'MyMobPay Security <auth@mymob.tech>';
  }
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

// ── Automatic Provider Quota / Rate-Limit Circuit Breaker ───────
const DEFAULT_LIMIT_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes cooldown
const providerCircuitBreaker = new Map();

// ── Instant Signup Alert Deduplication Cache (Anti-Double Send Guard) ─
const SIGNUP_ALERT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown
const recentSignupAlertsCache = new Map();

/**
 * Detects if an error is due to daily/monthly sending limits or rate-limiting
 */
export function isRateLimitOrQuotaError(err) {
  if (!err) return false;
  const msg = String(err.message || err.toString() || '').toLowerCase();
  const code = String(err.code || err.statusCode || err.status || '');

  return (
    code === '429' ||
    code === '550' ||
    code === '554' ||
    code === '421' ||
    code === '450' ||
    code === '452' ||
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('rate limit') ||
    msg.includes('too many') ||
    msg.includes('limit exceeded') ||
    msg.includes('credits exhausted') ||
    msg.includes('daily limit') ||
    msg.includes('sending limit') ||
    msg.includes('temporary limit') ||
    msg.includes('plan limit') ||
    msg.includes('threshold') ||
    msg.includes('over quota') ||
    msg.includes('maximum allowed')
  );
}

/**
 * Trip circuit breaker for a provider that has reached its limit
 */
export function tripProviderLimit(providerName, reason = 'Quota or rate limit reached', cooldownMs = DEFAULT_LIMIT_COOLDOWN_MS) {
  const cooldownUntil = Date.now() + cooldownMs;
  providerCircuitBreaker.set(providerName, {
    trippedAt: Date.now(),
    cooldownUntil,
    reason: String(reason).slice(0, 150),
  });
  console.warn(`[MAILER CIRCUIT BREAKER] ⚠️ Provider "${providerName.toUpperCase()}" reached sending limit (${reason}). Emergency failover activated until ${new Date(cooldownUntil).toLocaleTimeString('en-IN')}.`);
}

/**
 * Check if provider is currently in cooldown due to limit exhaustion.
 * Automatically restores provider as primary when cooldown expires.
 */
export function isProviderCircuitTripped(providerName) {
  const state = providerCircuitBreaker.get(providerName);
  if (!state) return false;

  if (Date.now() < state.cooldownUntil) {
    return true; // Still within cooldown window
  }

  // Cooldown window passed! Restore original source
  providerCircuitBreaker.delete(providerName);
  console.log(`[MAILER CIRCUIT BREAKER] 🔄 Cooldown window expired for "${providerName.toUpperCase()}". Sending limit reset — automatically restored as primary source.`);
  return false;
}

/**
 * Manually reset a provider's limit status
 */
export function resetProviderLimit(providerName) {
  if (providerName) {
    providerCircuitBreaker.delete(providerName);
  } else {
    providerCircuitBreaker.clear();
  }
}

/**
 * Get current status of all providers' sending limits
 */
export function getProviderCircuitStatus() {
  const status = {};
  const now = Date.now();
  for (const [name, state] of providerCircuitBreaker.entries()) {
    if (now < state.cooldownUntil) {
      status[name] = {
        isLimited: true,
        remainingSeconds: Math.ceil((state.cooldownUntil - now) / 1000),
        cooldownUntil: new Date(state.cooldownUntil).toISOString(),
        reason: state.reason,
      };
    } else {
      providerCircuitBreaker.delete(name);
    }
  }
  return status;
}

/**
 * ─────────────────────────────────────────────────────────────
 * Multi-Provider Smart Email Dispatcher with Strict Purpose Routing
 * & Dynamic Quota Circuit-Breaker Failover
 * ─────────────────────────────────────────────────────────────
 * Routing Strategy:
 *  - 'invoice' | 'subscription' | 'statement' (Subscription Invoices & Monthly Statements):
 *      1. SendPulse (Exclusively prioritized for billing invoices & monthly account statements)
 *      2. Brevo (Emergency failover with trx@mymob.tech)
 *      3. Resend (Emergency failover with trx@mymob.tech)
 *      4. Default SMTP
 *  - 'otp' | 'link' (Auth Verification):
 *      1. Resend (Instant API delivery for OTPs)
 *      2. Brevo (Fallback)
 *      3. Default SMTP
 *      (SendPulse is NOT used for OTPs, keeping quota clean for financial statements)
 *  - 'welcome' | 'signup' (Onboarding):
 *      1. Resend (Primary for welcoming merchants)
 *      2. Brevo (Fallback)
 *      3. Default SMTP
 *  - 'transaction' | 'receipt' (Customer payment receipts):
 *      SKIPPED (Per-transaction emails are disabled to save budget)
 */
async function sendRawEmail({ to, subject, html, text, purpose = 'general' }) {
  let providerChain = [];

  if (purpose === 'invoice' || purpose === 'subscription' || purpose === 'statement') {
    // 🎯 SENDPULSE IS EXCLUSIVELY DEDICATED FOR SUBSCRIPTION INVOICES & MONTHLY STATEMENTS
    providerChain = [
      { name: 'sendpulse', isReady: isSendpulseConfigured, send: sendViaSendpulse },
      { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      { name: 'default',   isReady: () => Boolean(getTransporter()), send: sendViaDefaultSmtp },
    ];
  } else if (purpose === 'otp' || purpose === 'link') {
    // 🔐 Auth OTPs & Magic Links — Keep off SendPulse to protect monthly quota & billing reputation
    providerChain = [
      { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      { name: 'default',   isReady: () => Boolean(getTransporter()), send: sendViaDefaultSmtp },
    ];
  } else if (purpose === 'welcome' || purpose === 'signup') {
    providerChain = [
      { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      { name: 'default',   isReady: () => Boolean(getTransporter()), send: sendViaDefaultSmtp },
    ];
  } else if (purpose === 'transaction' || purpose === 'receipt') {
    // 🚫 Per-transaction emails are disabled for budget control
    console.log(`[MAILER BUDGET GUARD] Per-transaction email to ${to} skipped (budget optimization active).`);
    return { success: true, skipped: true, reason: 'Per-transaction emails disabled for budget control' };
  } else {
    // General auto-detect
    providerChain = [
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

    // 🛑 If this provider reached its sending limit, automatically bypass to emergency failover provider:
    if (isProviderCircuitTripped(provider.name)) {
      console.log(`[MAILER CIRCUIT BREAKER] Provider "${provider.name.toUpperCase()}" is currently at sending limit (in cooldown). Shifting to next emergency provider...`);
      continue;
    }

    try {
      const result = await provider.send({ to, subject, html, text, purpose });
      console.log(`[MAILER SMART ROUTER] Successfully dispatched (${purpose}) to ${to} via ${provider.name.toUpperCase()}`);
      return result;
    } catch (err) {
      console.warn(`[MAILER FAILOVER] ${provider.name.toUpperCase()} failed for (${purpose}) to ${to}: ${err.message}.`);

      // 🚨 Detect if failure is due to reaching sending limit / quota
      if (isRateLimitOrQuotaError(err)) {
        tripProviderLimit(provider.name, err.message);
        console.warn(`[MAILER EMERGENCY RAIL] Tripped sending limit for "${provider.name.toUpperCase()}". Falling over to emergency backup provider...`);
      }

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
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px 8px !important; }
      .card-body { padding: 28px 18px !important; }
      .digit-box { width: 42px !important; height: 50px !important; font-size: 24px !important; line-height: 50px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <!-- Hidden Preheader for quick snippet and Gmail OTP heuristic -->
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Your verification code is ${cleanOtp} and will expire in 10 minutes. For your security, do not share it with anyone.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 14px 48px 14px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" role="presentation" style="max-width: 540px; margin: 0 auto;">
          
          <!-- BRAND TOP BAR -->
          <tr>
            <td style="padding-bottom: 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="https://mymob.tech/icon.png" width="38" height="38" alt="MyMobPay" style="width: 38px; height: 38px; border-radius: 10px; display: block; border: 1px solid #e2e8f0;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 20px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; display: block; line-height: 1.1;">MyMobPay</span>
                          <span style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.3px;">Authentication Security</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #f1f5f9; color: #334155; font-size: 10.5px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px; border: 1px solid #e2e8f0;">
                      <span style="color: #2563eb; font-size: 9px; vertical-align: middle; margin-right: 4px;">&#9679;</span> SECURITY CODE
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.06); overflow: hidden;">
                
                <!-- Card Header -->
                <tr>
                  <td style="padding: 32px 36px 20px 36px; text-align: center;">
                    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; line-height: 1.3;">
                      Your verification code
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                      Hi ${displayName}, use this single-use code to authenticate your sign-in to MyMobPay:
                    </p>
                  </td>
                </tr>

                <!-- Card Body (Digit Boxes) -->
                <tr>
                  <td class="card-body" style="padding: 10px 36px 36px 36px; text-align: center;">
                    
                    <!-- 6 Separate Digit Boxes -->
                    <table border="0" cellpadding="0" cellspacing="0" align="center" role="presentation" style="margin: 16px auto 20px auto;">
                      <tr>
                        ${digits.map((digit) => `
                          <td style="padding: 0 4px;">
                            <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                              <tr>
                                <td align="center" valign="middle" class="digit-box" style="width: 48px; height: 56px; min-width: 48px; background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 28px; font-weight: 800; color: #09090b; text-align: center; line-height: 56px; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">${digit}</td>
                              </tr>
                            </table>
                          </td>
                        `).join('')}
                      </tr>
                    </table>

                    <!-- Expiry Tag -->
                    <div style="margin-bottom: 22px;">
                      <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 9999px; padding: 4px 14px; font-size: 12px; font-weight: 600; color: #475569;">
                        &#9201; Expires in 10 minutes &bull; Single-use only
                      </span>
                    </div>

                    <!-- Clean Body Paragraph -->
                    <p style="margin: 0 auto 24px auto; max-width: 420px; font-size: 13.5px; line-height: 1.6; color: #475569;">
                      Your verification code is <strong style="font-weight: 800; color: #09090b; letter-spacing: 0.5px;">${cleanOtp}</strong>. For your security, never share this code or your UPI PIN with anyone. MyMobPay will never call to ask for this information.
                    </p>

                    <!-- Security Notice Box -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                      <tr>
                        <td style="padding: 12px 16px; font-size: 12px; line-height: 1.5; color: #64748b; text-align: left;">
                          <strong style="color: #0f172a;">Security Advisory:</strong> If you did not request this verification code, please ignore this email. Your account credentials remain protected.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Institutional Email Footer -->
          <tr>
            <td align="center" style="padding-top: 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #64748b;">
                MyMobPay Technologies &bull; Direct Unified UPI Gateway
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #94a3b8;">
                <a href="https://mymob.tech/dashboard" style="color: #2563eb; text-decoration: none; font-weight: 600;">Console</a> &bull;
                <a href="https://mymob.tech/terms" style="color: #2563eb; text-decoration: none; font-weight: 600;">Terms</a> &bull;
                <a href="https://mymob.tech/privacy" style="color: #2563eb; text-decoration: none; font-weight: 600;">Privacy</a> &bull;
                <a href="mailto:support@mymob.tech" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@mymob.tech</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                &copy; ${new Date().getFullYear()} MyMobPay (mymob.tech). All rights reserved.
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
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px 8px !important; }
      .card-body { padding: 28px 18px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <!-- Preheader -->
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Click the secure button below to sign in directly to your MyMobPay merchant dashboard without a password.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 14px 48px 14px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" role="presentation" style="max-width: 540px; margin: 0 auto;">
          
          <!-- BRAND TOP BAR -->
          <tr>
            <td style="padding-bottom: 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="https://mymob.tech/icon.png" width="38" height="38" alt="MyMobPay" style="width: 38px; height: 38px; border-radius: 10px; display: block; border: 1px solid #e2e8f0;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 20px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; display: block; line-height: 1.1;">MyMobPay</span>
                          <span style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.3px;">Direct Session Authentication</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #f1f5f9; color: #334155; font-size: 10.5px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px; border: 1px solid #e2e8f0;">
                      <span style="color: #2563eb; font-size: 9px; vertical-align: middle; margin-right: 4px;">&#9679;</span> ONE-CLICK LINK
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.06); overflow: hidden;">
                
                <!-- Card Header -->
                <tr>
                  <td style="padding: 32px 36px 20px 36px; text-align: center;">
                    <h1 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; line-height: 1.3;">
                      Sign in to MyMobPay
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                      Click the secure button below to authenticate your session instantly and open your merchant dashboard:
                    </p>
                  </td>
                </tr>

                <!-- Card Body -->
                <tr>
                  <td class="card-body" style="padding: 10px 36px 36px 36px; text-align: center;">
                    
                    <!-- Primary CTA Button -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 16px 0 20px 0;">
                      <tr>
                        <td align="center">
                          <a href="${actionLink}" target="_blank" style="display: block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14.5px; font-weight: 700; padding: 15px 32px; border-radius: 10px; text-align: center; letter-spacing: 0.2px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); border: 1px solid #0f172a;">
                            Sign In to Merchant Dashboard &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div style="margin-bottom: 24px;">
                      <span style="display: inline-block; background-color: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 9999px; padding: 4px 14px; font-size: 12px; font-weight: 600; color: #475569;">
                        &#9201; Expires in 10 minutes &bull; Single-use only
                      </span>
                    </div>

                    <!-- Security Notice Box -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;">
                      <tr>
                        <td style="padding: 12px 16px; font-size: 12px; line-height: 1.5; color: #64748b; text-align: left;">
                          <strong style="color: #0f172a;">Security Advisory:</strong> If you did not request this sign-in link, please ignore this email. Your account credentials remain protected.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Institutional Email Footer -->
          <tr>
            <td align="center" style="padding-top: 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #64748b;">
                MyMobPay Technologies &bull; Direct Unified UPI Gateway
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #94a3b8;">
                <a href="https://mymob.tech/dashboard" style="color: #2563eb; text-decoration: none; font-weight: 600;">Console</a> &bull;
                <a href="https://mymob.tech/terms" style="color: #2563eb; text-decoration: none; font-weight: 600;">Terms</a> &bull;
                <a href="https://mymob.tech/privacy" style="color: #2563eb; text-decoration: none; font-weight: 600;">Privacy</a> &bull;
                <a href="mailto:support@mymob.tech" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@mymob.tech</a>
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
  <meta name="x-apple-disable-message-reformatting" />
  <title>Welcome to MyMobPay &bull; Account Active</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px 8px !important; }
      .card-body { padding: 24px 18px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <!-- Preheader text -->
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Welcome to MyMobPay! Your merchant account (${mid || 'Active'}) is configured to accept instant zero-MDR UPI payments.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 14px 48px 14px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" role="presentation" style="max-width: 580px; margin: 0 auto;">
          
          <!-- BRAND TOP BAR -->
          <tr>
            <td style="padding-bottom: 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <!-- Brand Logo & Name -->
                  <td align="left" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="https://mymob.tech/icon.png" width="38" height="38" alt="MyMobPay" style="width: 38px; height: 38px; border-radius: 10px; display: block; border: 1px solid #e2e8f0;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 20px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; display: block; line-height: 1.1;">MyMobPay</span>
                          <span style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.3px;">Unified UPI Payment Gateway</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Live Status Badge -->
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #f1f5f9; color: #334155; font-size: 10.5px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px; border: 1px solid #e2e8f0;">
                      <span style="color: #10b981; font-size: 9px; vertical-align: middle; margin-right: 4px;">&#9679;</span> ACCOUNT ACTIVE
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.06); overflow: hidden;">
                
                <!-- Card Header -->
                <tr>
                  <td style="padding: 30px 32px 22px 32px; border-bottom: 1px solid #f1f5f9;">
                    <h1 style="margin: 0 0 8px 0; font-size: 21px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; line-height: 1.3;">
                      Welcome to MyMobPay, ${businessName}!
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                      Your merchant account is now registered on India&apos;s direct unified UPI payment infrastructure. Funds route straight to your bank account with zero intermediary holds.
                    </p>
                  </td>
                </tr>

                <!-- Card Body -->
                <tr>
                  <td class="card-body" style="padding: 24px 32px 32px 32px;">
                    
                    <!-- Account Credentials Table -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; width: 38%;">Merchant Account ID</td>
                        <td style="padding: 12px 16px; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #0f172a; font-weight: 700;">
                          <span style="background-color: #f1f5f9; padding: 3px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">${mid || 'ACCOUNT-ACTIVE'}</span>
                        </td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Business Name</td>
                        <td style="padding: 12px 16px; font-size: 13.5px; font-weight: 600; color: #0f172a;">${businessName}</td>
                      </tr>
                      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Registered Email</td>
                        <td style="padding: 12px 16px; font-size: 13px; font-weight: 500; color: #2563eb;">${to}</td>
                      </tr>
                      ${upiId ? `
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Settlement UPI VPA</td>
                        <td style="padding: 12px 16px; font-size: 12.5px; color: #0f172a;">
                          <code style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background-color: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 6px; color: #0f172a; font-size: 12px; font-weight: 700;">${upiId}</code>
                        </td>
                      </tr>
                      ` : ''}
                      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Platform Gateway MDR</td>
                        <td style="padding: 12px 16px; font-size: 13px; font-weight: 700; color: #059669;">0.00% (Direct Passthrough)</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Settlement Rail</td>
                        <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0f172a;">NPCI 2.0 IMPS / UPI Direct</td>
                      </tr>
                    </table>

                    <!-- Primary Action Button -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                      <tr>
                        <td align="center">
                          <a href="https://mymob.tech/dashboard" target="_blank" style="display: block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px; text-align: center; letter-spacing: 0.2px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); border: 1px solid #0f172a;">
                            Access Merchant Dashboard &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- 3-Step Launch Guide -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 22px;">
                      <div style="font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
                        Quick Steps to Start Collecting Payments:
                      </div>
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="font-size: 13px; line-height: 1.6; color: #334155;">
                        <tr>
                          <td style="vertical-align: top; width: 24px; padding-bottom: 8px;">
                            <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background-color: #0f172a; color: #ffffff; font-size: 10.5px; font-weight: 700; text-align: center; line-height: 18px;">1</span>
                          </td>
                          <td style="padding-bottom: 8px;">
                            <strong>Confirm Settlement Bank:</strong> Go to Settings to verify your primary settlement bank account and IFSC.
                          </td>
                        </tr>
                        <tr>
                          <td style="vertical-align: top; width: 24px; padding-bottom: 8px;">
                            <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background-color: #0f172a; color: #ffffff; font-size: 10.5px; font-weight: 700; text-align: center; line-height: 18px;">2</span>
                          </td>
                          <td style="padding-bottom: 8px;">
                            <strong>Create Payment Links:</strong> Generate zero-MDR payment links or dynamic QR codes in the Links Studio.
                          </td>
                        </tr>
                        <tr>
                          <td style="vertical-align: top; width: 24px;">
                            <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background-color: #0f172a; color: #ffffff; font-size: 10.5px; font-weight: 700; text-align: center; line-height: 18px;">3</span>
                          </td>
                          <td>
                            <strong>Connect Webhooks &amp; APIs:</strong> Copy your API Key to integrate real-time instant payment verification into your website or app.
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Security Notice -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;">
                      <tr>
                        <td style="padding: 12px 16px; font-size: 11.5px; line-height: 1.5; color: #64748b;">
                          <strong style="color: #0f172a;">Security Advisory:</strong> MyMobPay will never ask you for your login password or UPI PIN. Always confirm the URL is <strong>https://mymob.tech</strong> before signing in.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Institutional Email Footer -->
          <tr>
            <td align="center" style="padding-top: 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #64748b;">
                MyMobPay Technologies &bull; Direct Unified UPI Gateway
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #94a3b8;">
                <a href="https://mymob.tech/dashboard" style="color: #2563eb; text-decoration: none; font-weight: 600;">Console</a> &bull;
                <a href="https://mymob.tech/terms" style="color: #2563eb; text-decoration: none; font-weight: 600;">Terms</a> &bull;
                <a href="https://mymob.tech/privacy" style="color: #2563eb; text-decoration: none; font-weight: 600;">Privacy</a> &bull;
                <a href="mailto:support@mymob.tech" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@mymob.tech</a>
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
 * Instant Admin Notification Email on New User Signups
 * ─────────────────────────────────────────────────────────────
 */
export async function sendAdminNewSignupNotification({
  userEmail,
  userName = '',
  businessName = '',
  upiId = '',
  phone = '',
  provider = 'Google OAuth',
  userId = '',
  createdAt = new Date().toISOString(),
  bankDetails = null,
  dryRun = false,
} = {}) {
  // 0. Deduplication & Anti-Spam Guard (prevent duplicate email alerts within 5 minutes)
  const cleanUserEmail = String(userEmail || '').trim().toLowerCase();
  const cleanUserId = String(userId || '').trim().toLowerCase();
  const dedupKey = `${cleanUserId}|${cleanUserEmail}`;
  const now = Date.now();

  if (cleanUserEmail || cleanUserId) {
    if (recentSignupAlertsCache.has(dedupKey)) {
      const lastSentAt = recentSignupAlertsCache.get(dedupKey);
      if (now - lastSentAt < SIGNUP_ALERT_COOLDOWN_MS) {
        console.warn(`[ADMIN NOTIFY DEDUP] ⚠️ Suppressing duplicate signup alert for "${userEmail}" (${userId}). Already sent ${Math.round((now - lastSentAt) / 1000)}s ago.`);
        return {
          success: true,
          deduplicated: true,
          message: 'Duplicate signup alert suppressed within cooldown window.'
        };
      }
    }
    recentSignupAlertsCache.set(dedupKey, now);

    // Auto cleanup old cache entries
    if (recentSignupAlertsCache.size > 200) {
      for (const [k, ts] of recentSignupAlertsCache.entries()) {
        if (now - ts > SIGNUP_ALERT_COOLDOWN_MS * 3) {
          recentSignupAlertsCache.delete(k);
        }
      }
    }
  }

  // 1. Resolve Admin recipient emails
  // Dedicated notification email takes priority; otherwise send to the primary admin email only.
  // This prevents duplicate emails when multiple authorized login emails (e.g. chauhankunal695@gmail.com and deadraon@gmail.com)
  // are configured and forwarded to the same inbox.
  let adminRecipients = [];
  try {
    const { getAdminSettings, DEFAULT_ADMIN_EMAILS } = await import('./adminSettings.js');
    const settings = await getAdminSettings();

    // Check for explicit notification email configuration
    const notificationTarget = settings?.admin_notification_email || process.env.ADMIN_ALERT_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL;
    if (notificationTarget) {
      adminRecipients = notificationTarget
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(e => e && e.includes('@'));
    }

    // Fallback: If no dedicated notification address, use ONLY the primary administrator email
    // (first email in admin_email) so multiple login aliases don't receive duplicate emails
    if (adminRecipients.length === 0 && settings?.admin_email) {
      const authorizedLogins = settings.admin_email
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(e => e && e.includes('@'));
      if (authorizedLogins.length > 0) {
        adminRecipients = [authorizedLogins[0]];
      }
    }

    if (adminRecipients.length === 0 && Array.isArray(DEFAULT_ADMIN_EMAILS) && DEFAULT_ADMIN_EMAILS.length > 0) {
      adminRecipients = [DEFAULT_ADMIN_EMAILS[0].toLowerCase()];
    }
  } catch (err) {
    adminRecipients = ['chauhankunal695@gmail.com'];
  }

  if (adminRecipients.length === 0) {
    adminRecipients = ['chauhankunal695@gmail.com'];
  }
  adminRecipients = [...new Set(adminRecipients)];

  const istDateStr = new Date(createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  const displayName = userName || businessName || (userEmail ? userEmail.split('@')[0] : 'New User');
  const subject = `🚀 New Signup Alert: ${displayName} (${userEmail}) joined MyMobPay!`;

  const bankText = bankDetails && bankDetails.bank_account_number
    ? `${bankDetails.bank_name || 'Bank'} (A/C: ${bankDetails.bank_account_number}, IFSC: ${bankDetails.bank_ifsc || 'N/A'})`
    : 'Not configured yet';

  const avatarInitial = (displayName || 'U').trim().charAt(0).toUpperCase();

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>New User Signup Alert &bull; MyMobPay</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px 8px !important; }
      .card-body { padding: 24px 18px !important; }
      .avatar-col { display: block !important; margin-bottom: 12px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <!-- Preheader preview text for inbox -->
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    New merchant registered: ${displayName} (${userEmail}) via ${provider}. Review profile and account routing in Admin Console.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 14px 48px 14px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" role="presentation" style="max-width: 580px; margin: 0 auto;">
          
          <!-- BRAND TOP BAR -->
          <tr>
            <td style="padding-bottom: 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <!-- Brand Logo & Name -->
                  <td align="left" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="https://mymob.tech/icon.png" width="38" height="38" alt="MyMobPay" style="width: 38px; height: 38px; border-radius: 10px; display: block; border: 1px solid #e2e8f0;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 20px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; display: block; line-height: 1.1;">MyMobPay</span>
                          <span style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.3px;">Platform Security Alert</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <!-- Security Badge -->
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #f1f5f9; color: #334155; font-size: 10.5px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px; border: 1px solid #e2e8f0;">
                      <span style="color: #10b981; font-size: 9px; vertical-align: middle; margin-right: 4px;">&#9679;</span> NEW SIGNUP
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD CONTAINER -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.06); overflow: hidden;">
                
                <!-- Card Header -->
                <tr>
                  <td style="padding: 30px 32px 22px 32px; border-bottom: 1px solid #f1f5f9;">
                    <h1 style="margin: 0 0 6px 0; font-size: 21px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; line-height: 1.3;">
                      New Merchant Registered
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                      A new user has completed registration and provisioned an account on the MyMobPay direct UPI gateway.
                    </p>
                    <div style="margin-top: 12px; font-size: 12px; color: #94a3b8; font-weight: 500;">
                      &#128197; ${istDateStr}
                    </div>
                  </td>
                </tr>

                <!-- Profile Identity Card -->
                <tr>
                  <td class="card-body" style="padding: 24px 32px 32px 32px;">
                    
                    <!-- Merchant Hero Summary Box -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                            <tr>
                              <td class="avatar-col" style="width: 46px; vertical-align: middle;">
                                <div style="width: 44px; height: 44px; border-radius: 50%; background-color: #e0e7ff; color: #3730a3; font-size: 18px; font-weight: 800; text-align: center; line-height: 44px; border: 1px solid #c7d2fe;">
                                  ${avatarInitial}
                                </div>
                              </td>
                              <td style="vertical-align: middle; padding-left: 14px;">
                                <div style="font-size: 16px; font-weight: 700; color: #0f172a; line-height: 1.2;">
                                  ${displayName}
                                </div>
                                <div style="font-size: 13px; color: #2563eb; margin-top: 2px;">
                                  <a href="mailto:${userEmail}" style="color: #2563eb; text-decoration: none; font-weight: 500;">${userEmail}</a>
                                </div>
                              </td>
                              <td align="right" style="vertical-align: middle;">
                                <span style="display: inline-block; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 600; color: #475569;">
                                  ${provider}
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Structured Specifications Spec Sheet -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 26px;">
                      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; width: 35%;">Business / Store</td>
                        <td style="padding: 12px 16px; font-size: 13.5px; font-weight: 600; color: #0f172a;">${businessName || 'My Business'}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Settlement UPI VPA</td>
                        <td style="padding: 12px 16px; font-size: 13px; color: #0f172a;">
                          ${upiId ? `<code style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; background-color: #f1f5f9; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 6px; color: #0f172a; font-size: 12px; font-weight: 700;">${upiId}</code>` : '<span style="color: #94a3b8; font-style: italic; font-size: 12.5px;">Pending configuration</span>'}
                        </td>
                      </tr>
                      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Mobile / WhatsApp</td>
                        <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: #0f172a;">
                          ${phone ? `<a href="https://wa.me/${phone.replace(/\\D/g, '')}" target="_blank" style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #047857; text-decoration: none; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 6px;">&#128172; ${phone} &bull; Open WhatsApp</a>` : '<span style="color: #94a3b8; font-style: italic; font-size: 12.5px;">Not provided</span>'}
                        </td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 12px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Bank Settlement KYC</td>
                        <td style="padding: 12px 16px; font-size: 12.5px; color: #0f172a;">
                          ${bankDetails && bankDetails.bank_account_number ? `
                            <div style="font-weight: 700; color: #0f172a;">${bankDetails.bank_name || 'Bank'}</div>
                            <div style="font-size: 11.5px; color: #64748b; font-family: monospace; margin-top: 2px;">
                              A/C: <strong>${bankDetails.bank_account_number}</strong> &bull; IFSC: <strong>${bankDetails.bank_ifsc || 'N/A'}</strong> (${bankDetails.bank_account_name || displayName})
                            </div>
                          ` : '<span style="color: #94a3b8; font-style: italic; font-size: 12.5px;">Pending Bank KYC</span>'}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Merchant Account ID</td>
                        <td style="padding: 12px 16px; font-size: 11px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #64748b;">
                          <span style="background-color: #f1f5f9; padding: 3px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">${userId || 'N/A'}</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Primary Action Button -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 18px;">
                      <tr>
                        <td align="center">
                          <a href="https://mymob.tech/dashboard" target="_blank" style="display: block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px; text-align: center; letter-spacing: 0.2px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); border: 1px solid #0f172a;">
                            Review Merchant in Admin Console &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Quick Direct Action Links -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                      <tr>
                        <td align="center" style="font-size: 12.5px; color: #64748b;">
                          <a href="mailto:${userEmail}" style="color: #2563eb; text-decoration: none; font-weight: 600;">&#9993; Email Merchant</a>
                          ${phone ? `&nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="https://wa.me/${phone.replace(/\\D/g, '')}" target="_blank" style="color: #059669; text-decoration: none; font-weight: 600;">&#128172; WhatsApp</a>` : ''}
                          &nbsp;&nbsp;&bull;&nbsp;&nbsp;<a href="https://mymob.tech/dashboard" target="_blank" style="color: #475569; text-decoration: none; font-weight: 600;">&#128269; View All Users</a>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- Card Footer System Metadata -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 14px 28px; text-align: center;">
                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.4;">
                      Automated platform dispatch from MyMobPay Platform Security &bull; Primary Admin Alert
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Institutional Email Footer -->
          <tr>
            <td align="center" style="padding-top: 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #64748b;">
                MyMobPay Technologies &bull; Direct Unified UPI Gateway
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #94a3b8;">
                <a href="https://mymob.tech/dashboard" style="color: #2563eb; text-decoration: none; font-weight: 600;">Console</a> &bull;
                <a href="https://mymob.tech/terms" style="color: #2563eb; text-decoration: none; font-weight: 600;">Terms</a> &bull;
                <a href="https://mymob.tech/privacy" style="color: #2563eb; text-decoration: none; font-weight: 600;">Privacy</a> &bull;
                <a href="mailto:support@mymob.tech" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@mymob.tech</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                &copy; ${new Date().getFullYear()} MyMobPay (mymob.tech). All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `🎉 NEW SIGNUP ALERT - MyMobPay\n\nName: ${displayName}\nEmail: ${userEmail}\nPhone: ${phone || 'Not provided'}\nAuth Method: ${provider}\nStore: ${businessName || 'My Business'}\nUPI: ${upiId || 'pending@upi'}\nBank: ${bankText}\nRegistered: ${istDateStr}\nUser ID: ${userId}\n\nOpen Admin Console: https://mymob.tech/dashboard`;

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      recipients: adminRecipients,
      results: adminRecipients.map(adminTo => ({ email: adminTo, success: true, dryRun: true }))
    };
  }

  const results = [];
  for (const adminTo of adminRecipients) {
    try {
      const res = await sendRawEmail({
        to: adminTo,
        subject,
        text,
        html,
        purpose: 'welcome',
      });
      console.log(`[ADMIN NOTIFY] Signup alert successfully sent to ${adminTo}`);
      results.push({ email: adminTo, success: true, res });
    } catch (err) {
      console.error(`[ADMIN NOTIFY ERROR] Failed to send signup alert to ${adminTo}:`, err);
      results.push({ email: adminTo, success: false, error: err.message });
    }
  }

  return { success: true, recipients: adminRecipients, results };
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
  <meta name="x-apple-disable-message-reformatting" />
  <title>Tax Invoice &bull; #${refCode} &bull; MyMobPay</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px 8px !important; }
      .card-body { padding: 24px 18px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <!-- Preheader -->
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Tax Invoice #${refCode} from MyMobPay. Total: ₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}. License active until ${expiryFormatted}.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 14px 48px 14px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" role="presentation" style="max-width: 580px; margin: 0 auto;">
          
          <!-- BRAND TOP BAR -->
          <tr>
            <td style="padding-bottom: 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="https://mymob.tech/icon.png" width="38" height="38" alt="MyMobPay" style="width: 38px; height: 38px; border-radius: 10px; display: block; border: 1px solid #e2e8f0;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 20px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; display: block; line-height: 1.1;">MyMobPay</span>
                          <span style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.3px;">Official Tax Invoice &bull; Billing</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 10.5px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px; border: 1px solid #a7f3d0;">
                      <span style="color: #10b981; font-size: 9px; vertical-align: middle; margin-right: 4px;">&#9679;</span> PAID &bull; SETTLED
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.06); overflow: hidden;">
                
                <!-- Hero Invoice Header Banner -->
                <tr>
                  <td style="padding: 28px 32px 24px 32px; border-bottom: 1px solid #f1f5f9; background-color: #f8fafc;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                      <tr>
                        <td>
                          <div style="font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px;">
                            Total Amount Paid
                          </div>
                          <div style="font-size: 30px; font-weight: 800; color: #09090b; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; line-height: 1.2;">
                            &#8377;${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <div style="font-size: 12.5px; color: #64748b; margin-top: 4px;">
                            Paid on ${dateFormatted} &bull; Valid until <strong>${expiryFormatted}</strong>
                          </div>
                        </td>
                        <td align="right" style="vertical-align: top;">
                          <span style="display: inline-block; background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 4px 10px; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #0f172a;">
                            #${refCode}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Card Body -->
                <tr>
                  <td class="card-body" style="padding: 24px 32px 32px 32px;">
                    
                    <!-- Invoice Metadata Spec Table -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; width: 38%;">Billed To</td>
                        <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #0f172a;">${businessName} (${to})</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Merchant ID</td>
                        <td style="padding: 10px 16px; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #0f172a; font-weight: 700;">
                          ${mid}
                        </td>
                      </tr>
                      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Payment Rail</td>
                        <td style="padding: 10px 16px; font-size: 12.5px; font-weight: 600; color: #0f172a;">${paymentMethod}</td>
                      </tr>
                      ${utr ? `
                      <tr>
                        <td style="padding: 10px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Bank UTR Ref</td>
                        <td style="padding: 10px 16px; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #0f172a; font-weight: 700;">
                          ${utr}
                        </td>
                      </tr>` : ''}
                    </table>

                    <!-- Itemized Breakdown Table -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Description</td>
                        <td align="right" style="padding: 10px 16px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Amount</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 16px; font-size: 13.5px; color: #0f172a; border-bottom: 1px solid #f1f5f9;">
                          <div style="font-weight: 700; color: #0f172a;">${planName}</div>
                          <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Duration: ${durationDays} Days &bull; Active until ${expiryFormatted}</div>
                        </td>
                        <td align="right" style="padding: 14px 16px; font-size: 13.5px; font-weight: 700; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; border-bottom: 1px solid #f1f5f9;">
                          &#8377; ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 16px; font-size: 12px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Payment Processing Fee:</td>
                        <td align="right" style="padding: 8px 16px; font-size: 12px; font-weight: 600; color: #059669; border-bottom: 1px solid #f1f5f9;">&#8377; 0.00 (0% Direct)</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 16px; font-size: 12px; color: #64748b; border-bottom: 1px solid #f1f5f9;">GST / Applicable Taxes:</td>
                        <td align="right" style="padding: 8px 16px; font-size: 12px; font-weight: 600; color: #64748b; border-bottom: 1px solid #f1f5f9;">Included</td>
                      </tr>
                      <tr style="background-color: #f8fafc;">
                        <td style="padding: 12px 16px; font-size: 13.5px; font-weight: 800; color: #09090b;">
                          Total Paid:
                        </td>
                        <td align="right" style="padding: 12px 16px; font-size: 16px; font-weight: 800; color: #09090b; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
                          &#8377; ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </table>

                    <!-- Primary Action Button -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 18px;">
                      <tr>
                        <td align="center">
                          <a href="https://mymob.tech/dashboard" target="_blank" style="display: block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px; text-align: center; letter-spacing: 0.2px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); border: 1px solid #0f172a;">
                            View &amp; Print Invoices on Dashboard &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Tax Compliance Notice -->
                    <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8; text-align: center;">
                      This is a computer-generated tax invoice and requires no physical signature under Indian Information Technology Act, 2000.
                    </p>

                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Institutional Email Footer -->
          <tr>
            <td align="center" style="padding-top: 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #64748b;">
                MyMobPay Technologies &bull; Direct Unified UPI Gateway
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #94a3b8;">
                <a href="https://mymob.tech/dashboard" style="color: #2563eb; text-decoration: none; font-weight: 600;">Console</a> &bull;
                <a href="https://mymob.tech/terms" style="color: #2563eb; text-decoration: none; font-weight: 600;">Terms</a> &bull;
                <a href="https://mymob.tech/privacy" style="color: #2563eb; text-decoration: none; font-weight: 600;">Privacy</a> &bull;
                <a href="mailto:support@mymob.tech" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@mymob.tech</a>
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

/**
 * ─────────────────────────────────────────────────────────────
 * Monthly Settlement & Account Statement Email Template
 * Dispatched exclusively via SendPulse for merchant accounting
 * ─────────────────────────────────────────────────────────────
 */
export function buildMonthlyStatementEmailHtml({
  businessName = 'Merchant Partner',
  mid = 'MMP-MERCHANT',
  monthYear = '',
  totalVolume = 0,
  transactionCount = 0,
  successfulCount = 0,
  failedCount = 0,
  settlementVpa = '',
  statementPeriod = '',
  recentOrders = [],
} = {}) {
  const currentYear = new Date().getFullYear();
  const dateFormatted = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const successRate = transactionCount > 0 ? Math.round((successfulCount / transactionCount) * 100) : 100;
  const formattedVolume = parseFloat(totalVolume || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const orderRowsHtml = recentOrders.slice(0, 15).map(order => {
    const dt = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Recent';
    const isSuccess = order.status === 'verified' || order.status === 'completed' || order.status === 'paid';
    const badgeColor = isSuccess ? '#059669' : '#dc2626';
    const badgeBg = isSuccess ? '#ecfdf5' : '#fef2f2';
    const badgeBorder = isSuccess ? '#a7f3d0' : '#fecaca';
    const amountStr = parseFloat(order.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const utrStr = order.utr || order.customer_utr || '—';
    const refStr = order.external_ref || order.id?.slice(0, 8) || 'N/A';

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 10px 12px; font-size: 12px; color: #475569; font-family: monospace;">${dt}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #0f172a; font-weight: 600;">
          <div>${refStr}</div>
          <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">UTR: ${utrStr}</div>
        </td>
        <td align="right" style="padding: 10px 12px; font-size: 12px; font-weight: 700; color: #0f172a; font-family: monospace;">
          &#8377; ${amountStr}
        </td>
        <td align="center" style="padding: 10px 12px;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder}; text-transform: uppercase;">
            ${isSuccess ? 'SETTLED' : (order.status || 'PENDING')}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Monthly Account Statement &bull; ${monthYear || 'Account Summary'}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px 8px !important; }
      .card-body { padding: 24px 18px !important; }
      .kpi-col { display: block !important; width: 100% !important; margin-bottom: 8px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <!-- Preheader -->
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Official Monthly Account Statement for ${businessName} (${monthYear}). Total settlement volume: ₹${formattedVolume}.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 14px 48px 14px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" role="presentation" style="max-width: 600px; margin: 0 auto;">
          
          <!-- BRAND TOP BAR -->
          <tr>
            <td style="padding-bottom: 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="https://mymob.tech/icon.png" width="38" height="38" alt="MyMobPay" style="width: 38px; height: 38px; border-radius: 10px; display: block; border: 1px solid #e2e8f0;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 20px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; display: block; line-height: 1.1;">MyMobPay</span>
                          <span style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.3px;">Monthly Settlement Accounting</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #f1f5f9; color: #334155; font-size: 10.5px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px; border: 1px solid #e2e8f0;">
                      <span style="color: #10b981; font-size: 9px; vertical-align: middle; margin-right: 4px;">&#9679;</span> RECONCILED
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.06); overflow: hidden;">
                
                <!-- Card Header -->
                <tr>
                  <td style="padding: 30px 32px 22px 32px; border-bottom: 1px solid #f1f5f9;">
                    <h1 style="margin: 0 0 6px 0; font-size: 21px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; line-height: 1.3;">
                      Account Statement &bull; ${monthYear || 'Monthly Summary'}
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                      Here is your official reconciled statement of transactions, direct UPI settlement volume, and IMPS reconciliation for <strong>${businessName}</strong>.
                    </p>
                  </td>
                </tr>

                <!-- Card Body -->
                <tr>
                  <td class="card-body" style="padding: 24px 32px 32px 32px;">
                    
                    <!-- Statement Metadata Table -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; width: 38%;">Merchant Name</td>
                        <td style="padding: 10px 16px; font-size: 13px; font-weight: 600; color: #0f172a;">${businessName}</td>
                      </tr>
                      <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Merchant ID</td>
                        <td style="padding: 10px 16px; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #0f172a; font-weight: 700;">${mid}</td>
                      </tr>
                      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Statement Period</td>
                        <td style="padding: 10px 16px; font-size: 12.5px; font-weight: 600; color: #0f172a;">${statementPeriod || monthYear}</td>
                      </tr>
                      ${settlementVpa ? `
                      <tr>
                        <td style="padding: 10px 16px; font-size: 11.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Primary Settlement VPA</td>
                        <td style="padding: 10px 16px; font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; color: #0f172a; font-weight: 700;">${settlementVpa}</td>
                      </tr>
                      ` : ''}
                    </table>

                    <!-- 4-KPI Summary Grid -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                      <tr>
                        <td width="50%" class="kpi-col" style="padding-right: 6px; padding-bottom: 12px; vertical-align: top;">
                          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Settled Volume</div>
                            <div style="font-size: 20px; font-weight: 800; color: #09090b; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin-top: 4px;">&#8377;${formattedVolume}</div>
                            <div style="font-size: 10.5px; color: #059669; font-weight: 600; margin-top: 2px;">100% Direct Passthrough</div>
                          </div>
                        </td>
                        <td width="50%" class="kpi-col" style="padding-left: 6px; padding-bottom: 12px; vertical-align: top;">
                          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Orders Processed</div>
                            <div style="font-size: 20px; font-weight: 800; color: #09090b; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin-top: 4px;">${transactionCount}</div>
                            <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">${successfulCount} Settled &bull; ${failedCount} Failed</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" class="kpi-col" style="padding-right: 6px; vertical-align: top;">
                          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Success Rate</div>
                            <div style="font-size: 20px; font-weight: 800; color: #059669; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin-top: 4px;">${successRate}%</div>
                            <div style="font-size: 10.5px; color: #059669; font-weight: 600; margin-top: 2px;">Automated NPCI / Bank UTR</div>
                          </div>
                        </td>
                        <td width="50%" class="kpi-col" style="padding-left: 6px; vertical-align: top;">
                          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px 16px;">
                            <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Platform MDR Deducted</div>
                            <div style="font-size: 20px; font-weight: 800; color: #059669; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; margin-top: 4px;">&#8377;0.00</div>
                            <div style="font-size: 10.5px; color: #059669; font-weight: 600; margin-top: 2px;">Zero Gateway Commissions</div>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Recent Transactions Table -->
                    <div style="font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                      Reconciled Transactions (${recentOrders.length > 0 ? recentOrders.length : '0'} Shown)
                    </div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
                      <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Date</td>
                        <td style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Ref / UTR</td>
                        <td align="right" style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Amount</td>
                        <td align="center" style="padding: 10px 12px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Status</td>
                      </tr>
                      ${orderRowsHtml || `
                        <tr>
                          <td colspan="4" align="center" style="padding: 24px; color: #94a3b8; font-size: 13px;">
                            No processed transactions found for this statement period.
                          </td>
                        </tr>
                      `}
                    </table>

                    <!-- Primary Action Button -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 18px;">
                      <tr>
                        <td align="center">
                          <a href="https://mymob.tech/dashboard" target="_blank" style="display: block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px; text-align: center; letter-spacing: 0.2px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); border: 1px solid #0f172a;">
                            Access Full Ledger &amp; Export CSV / Excel &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Compliance Note -->
                    <p style="margin: 0; font-size: 11px; line-height: 1.5; color: #94a3b8; text-align: center;">
                      This monthly settlement advice is generated for merchant financial reconciliation under Indian IT Act 2000. All UPI credits route directly to your primary bank VPA with zero escrow holding.
                    </p>

                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Institutional Email Footer -->
          <tr>
            <td align="center" style="padding-top: 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #64748b;">
                MyMobPay Technologies &bull; Direct Unified UPI Gateway
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #94a3b8;">
                <a href="https://mymob.tech/dashboard" style="color: #2563eb; text-decoration: none; font-weight: 600;">Console</a> &bull;
                <a href="https://mymob.tech/terms" style="color: #2563eb; text-decoration: none; font-weight: 600;">Terms</a> &bull;
                <a href="https://mymob.tech/privacy" style="color: #2563eb; text-decoration: none; font-weight: 600;">Privacy</a> &bull;
                <a href="mailto:support@mymob.tech" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@mymob.tech</a>
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

/**
 * Send a Monthly Settlement & Account Statement Email via SendPulse
 */
export async function sendMonthlyStatementEmail({
  to,
  businessName = 'Merchant Partner',
  mid = 'MMP-MERCHANT',
  monthYear = '',
  totalVolume = 0,
  transactionCount = 0,
  successfulCount = 0,
  failedCount = 0,
  settlementVpa = '',
  statementPeriod = '',
  recentOrders = []
}) {
  const html = buildMonthlyStatementEmailHtml({
    businessName,
    mid,
    monthYear,
    totalVolume,
    transactionCount,
    successfulCount,
    failedCount,
    settlementVpa,
    statementPeriod,
    recentOrders
  });

  const subject = `Monthly Account Statement (${monthYear || 'Account Summary'}) • ${businessName} • MyMobPay`;
  const text = `Monthly Account Statement for ${businessName} (${mid})\nPeriod: ${statementPeriod || monthYear}\nGross Settled Volume: ₹${parseFloat(totalVolume || 0).toLocaleString('en-IN')}\nOrders Processed: ${transactionCount} (Settled: ${successfulCount}, Failed: ${failedCount})\nPlatform MDR Deducted: ₹0.00\n\nAccess full interactive ledger: https://mymob.tech/dashboard`;

  return sendRawEmail({
    to,
    subject,
    text,
    html,
    purpose: 'statement',
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * Merchant Onboarding & Contact Number Outreach Email
 * ─────────────────────────────────────────────────────────────
 */
export async function sendMerchantOnboardingOutreachEmail({ to, recipientName = 'Merchant Partner' }) {
  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Complete your MyMobPay registration</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; padding: 12px 8px !important; }
      .card-body { padding: 24px 18px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <!-- Preheader -->
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Complete your MyMobPay merchant onboarding and activate 0% fee direct bank &amp; UPI settlements.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 36px 14px 48px 14px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" role="presentation" style="max-width: 580px; margin: 0 auto;">
          
          <!-- BRAND TOP BAR -->
          <tr>
            <td style="padding-bottom: 20px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <table border="0" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <img src="https://mymob.tech/icon.png" width="38" height="38" alt="MyMobPay" style="width: 38px; height: 38px; border-radius: 10px; display: block; border: 1px solid #e2e8f0;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 20px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; display: block; line-height: 1.1;">MyMobPay</span>
                          <span style="font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.3px;">Merchant Success Team</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: #f1f5f9; color: #334155; font-size: 10.5px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; letter-spacing: 0.5px; border: 1px solid #e2e8f0;">
                      <span style="color: #2563eb; font-size: 9px; vertical-align: middle; margin-right: 4px;">&#9679;</span> ONBOARDING SUPPORT
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td>
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 8px 24px -4px rgba(15, 23, 42, 0.06); overflow: hidden;">
                
                <!-- Card Header -->
                <tr>
                  <td style="padding: 30px 32px 20px 32px; border-bottom: 1px solid #f1f5f9;">
                    <h1 style="margin: 0 0 8px 0; font-size: 21px; font-weight: 800; color: #09090b; letter-spacing: -0.4px; line-height: 1.3;">
                      Let&apos;s complete your merchant activation
                    </h1>
                    <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">
                      Hi <strong>${recipientName}</strong>, thank you for signing up on MyMobPay (<a href="https://mymob.tech" style="color: #2563eb; text-decoration: none; font-weight: 600;">mymob.tech</a>)!
                    </p>
                  </td>
                </tr>

                <!-- Card Body -->
                <tr>
                  <td class="card-body" style="padding: 24px 32px 32px 32px;">
                    <p style="margin: 0 0 18px 0; font-size: 14px; line-height: 1.65; color: #334155;">
                      We noticed you recently registered your account with us. To help you finalize your onboarding and activate <strong>0% fee direct bank &amp; UPI settlements</strong>, our onboarding team would like to assist you directly.
                    </p>

                    <!-- Clean Checklist / Action Box -->
                    <div style="background-color: #f8fafc; border: 1.5px dashed #cbd5e1; border-radius: 12px; padding: 20px 22px; margin-bottom: 24px;">
                      <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                        &#9993; Please reply to this email with:
                      </p>
                      <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="font-size: 13.5px; line-height: 1.6; color: #334155;">
                        <tr>
                          <td style="vertical-align: top; width: 22px; padding-bottom: 6px;">
                            <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background-color: #0f172a; color: #ffffff; font-size: 10px; font-weight: 700; text-align: center; line-height: 18px;">1</span>
                          </td>
                          <td style="padding-bottom: 6px;">
                            <strong>Your active Mobile / WhatsApp Contact Number</strong>
                          </td>
                        </tr>
                        <tr>
                          <td style="vertical-align: top; width: 22px;">
                            <span style="display: inline-block; width: 18px; height: 18px; border-radius: 50%; background-color: #0f172a; color: #ffffff; font-size: 10px; font-weight: 700; text-align: center; line-height: 18px;">2</span>
                          </td>
                          <td>
                            <strong>A preferred time for a quick WhatsApp message or call</strong>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <p style="margin: 0 0 24px 0; font-size: 13.5px; line-height: 1.6; color: #64748b;">
                      Once received, our onboarding specialists will verify your UPI VPA, assist you with dynamic QR integration, and ensure your merchant checkout links are ready.
                    </p>

                    <!-- Primary Action Button -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                      <tr>
                        <td align="center">
                          <a href="mailto:support@mymob.tech?subject=My%20Contact%20Number%20for%20Registration%20-${encodeURIComponent(recipientName)}" style="display: block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 10px; text-align: center; letter-spacing: 0.2px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); border: 1px solid #0f172a;">
                            Reply with Contact Number &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Signature Box -->
                    <div style="border-top: 1px solid #f1f5f9; padding-top: 18px;">
                      <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                        Warm regards,<br />
                        <strong style="color: #0f172a;">MyMobPay Merchant Onboarding Team</strong><br />
                        <span style="font-size: 11.5px; color: #94a3b8;">Direct UPI Rails &bull; 0% Transaction Fees &bull; mymob.tech</span>
                      </p>
                    </div>

                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Institutional Email Footer -->
          <tr>
            <td align="center" style="padding-top: 24px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #64748b;">
                MyMobPay Technologies &bull; Direct Unified UPI Gateway
              </p>
              <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #94a3b8;">
                <a href="https://mymob.tech/dashboard" style="color: #2563eb; text-decoration: none; font-weight: 600;">Console</a> &bull;
                <a href="https://mymob.tech/terms" style="color: #2563eb; text-decoration: none; font-weight: 600;">Terms</a> &bull;
                <a href="https://mymob.tech/privacy" style="color: #2563eb; text-decoration: none; font-weight: 600;">Privacy</a> &bull;
                <a href="mailto:support@mymob.tech" style="color: #2563eb; text-decoration: none; font-weight: 600;">support@mymob.tech</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                &copy; ${new Date().getFullYear()} MyMobPay (mymob.tech). All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const subject = `Complete your MyMobPay merchant registration - Contact details required`;
  const text = `Hi ${recipientName},\n\nThank you for signing up on MyMobPay (mymob.tech)!\n\nWe noticed you recently registered your account with us. To help you finalize your onboarding and activate 0% fee direct bank & UPI settlements on your account, our onboarding team would like to assist you directly.\n\nPlease reply to this email with:\n1. Your active Mobile / WhatsApp Contact Number\n2. A preferred time for a quick call or WhatsApp message\n\nOnce we have your contact details, our team will get in touch to verify your UPI VPA and ensure your merchant portal is active.\n\nWarm regards,\nMyMobPay Merchant Onboarding Team\nhttps://mymob.tech`;

  // Brevo SMTP is primary for transactional delivery
  const transporter = getBrevoTransporter() || getTransporter();
  if (transporter) {
    const info = await transporter.sendMail({
      from: '"MyMobPay Onboarding" <noreply@mymob.tech>',
      to,
      replyTo: 'chauhankunal695@gmail.com, support@mymob.tech',
      subject,
      html,
      text,
    });
    return { success: true, id: info.messageId, provider: 'brevo-smtp' };
  }

  return sendRawEmail({
    to,
    subject,
    text,
    html,
    purpose: 'welcome',
  });
}



