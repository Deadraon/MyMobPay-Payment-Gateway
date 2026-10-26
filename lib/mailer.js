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

  let displayName = recipientName || businessName || '';
  if (!displayName && to) {
    const localPart = String(to).split('@')[0];
    displayName = localPart.replace(/[._-]+/g, ' ').replace(/\d+$/, '').trim();
    if (displayName) displayName = displayName.replace(/\b\w/g, c => c.toUpperCase());
  }
  if (!displayName) displayName = 'there';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Your verification code</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    @media only screen and (max-width: 480px) {
      .outer-cell { padding: 16px 10px !important; }
      .card-pad { padding: 20px 16px !important; }
      .otp-code { font-size: 28px !important; letter-spacing: 6px !important; text-indent: 6px !important; padding: 12px 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Your verification code is ${cleanOtp}. Valid for 10 minutes.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 28px 14px 40px 14px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 520px; margin: 0 auto;">
          
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
                      Security
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
                  <td class="card-pad" style="padding: 28px 24px; text-align: center;">
                    <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      Verification code
                    </h1>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                      Hi ${displayName}, enter this code to complete sign-in. Valid for 10 minutes.
                    </p>

                    <!-- CODE BOX -->
                    <table border="0" cellpadding="0" cellspacing="0" align="center" role="presentation" style="margin: 0 auto 20px auto; width: 100%; max-width: 260px;">
                      <tr>
                        <td align="center">
                          <div class="otp-code" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; text-indent: 8px; padding: 14px 20px; background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; text-align: center; box-sizing: border-box; line-height: 1.1;">
                            ${cleanOtp}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">
                      Never share this code. If you didn&apos;t request this, ignore this email.
                    </p>
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

/**
 * ─────────────────────────────────────────────────────────────
 * Dedicated Magic Link Email Template (ONLY Button, NO OTP Digits)
 * ─────────────────────────────────────────────────────────────
 */
export function buildMagicLinkEmailHtml({ actionLink } = {}) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Sign in to MyMobPay</title>
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
    Click to sign in to your MyMobPay dashboard. Valid for 15 minutes.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 28px 14px 40px 14px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 520px; margin: 0 auto;">
          
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
                      Sign In
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
                  <td class="card-pad" style="padding: 28px 24px; text-align: center;">
                    <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      Sign in to MyMobPay
                    </h1>
                    <p style="margin: 0 0 22px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                      Click the button below to access your merchant console. Valid for 15 minutes.
                    </p>

                    <!-- CTA BUTTON -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 0 0 20px 0;">
                      <tr>
                        <td align="center">
                          <a href="${actionLink}" target="_blank" class="cta-btn" style="display: inline-block; width: 100%; max-width: 260px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 13px 20px; border-radius: 8px; text-align: center; box-sizing: border-box;">
                            Sign In to Console &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8;">
                      If you didn&apos;t request this sign-in link, ignore this email.
                    </p>
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
  const currentYear = new Date().getFullYear();

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Welcome to MyMobPay</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    @media only screen and (max-width: 480px) {
      .outer-cell { padding: 16px 10px !important; }
      .card-pad { padding: 20px 16px !important; }
      .k-col { width: 38% !important; font-size: 12px !important; }
      .v-col { font-size: 12px !important; }
      .cta-btn { width: 100% !important; display: block !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Welcome to MyMobPay! Your merchant account (${mid || 'Active'}) is configured for direct UPI payments.
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
                    <span style="display: inline-block; background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 9999px; border: 1px solid #a7f3d0;">
                      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; margin-right: 4px; vertical-align: middle;"></span>Active
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
                  <td class="card-pad" style="padding: 28px 24px;">
                    <h1 style="margin: 0 0 6px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      Welcome to MyMobPay
                    </h1>
                    <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                      Hi ${businessName}, your account is active and ready to accept zero-fee UPI payments directly into your bank account.
                    </p>

                    <!-- SPEC TABLE -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; border-collapse: separate;">
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0; width: 36%;">Account ID</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12px; font-family: ui-monospace, Menlo, monospace; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0; word-break: break-all;">${mid || 'ACTIVE'}</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Business</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12.5px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${businessName}</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Registered Email</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12.5px; color: #0f172a; border-bottom: 1px solid #e2e8f0; word-break: break-all;">${to}</td>
                      </tr>
                      ${upiId ? `
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Settlement UPI</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12px; font-family: ui-monospace, Menlo, monospace; color: #0f172a; border-bottom: 1px solid #e2e8f0; word-break: break-all;">${upiId}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500;">Gateway Fee</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12.5px; color: #059669; font-weight: 600;">0.00% (Direct to bank)</td>
                      </tr>
                    </table>

                    <!-- QUICK LAUNCH CHECKLIST -->
                    <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                      <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Next steps:</div>
                      <div style="font-size: 13px; line-height: 1.6; color: #475569;">
                        1. Add bank account &amp; UPI ID in Settings<br/>
                        2. Copy API credentials for checkout integration<br/>
                        3. Create a payment link to test live settlement
                      </div>
                    </div>

                    <!-- CTA BUTTON -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                      <tr>
                        <td align="center">
                          <a href="https://mymob.tech/dashboard" target="_blank" class="cta-btn" style="display: inline-block; width: 100%; max-width: 260px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px; text-align: center; box-sizing: border-box;">
                            Open Dashboard &rarr;
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
</html>`;

  const subject = `Welcome to MyMobPay, ${businessName}`;
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
  const bankText = bankDetails
    ? [bankDetails.bank_name, bankDetails.account_number ? `****${String(bankDetails.account_number).slice(-4)}` : '', bankDetails.ifsc].filter(Boolean).join(' • ') || 'Configured'
    : '<span style="color: #94a3b8;">Pending setup</span>';
  const bankPlain = bankDetails
    ? [bankDetails.bank_name, bankDetails.account_number ? `****${String(bankDetails.account_number).slice(-4)}` : '', bankDetails.ifsc].filter(Boolean).join(' • ') || 'Configured'
    : 'Pending setup';
  const subject = `New signup: ${displayName}`;

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>New merchant signup</title>
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
    New merchant registered: ${displayName} (${userEmail}) via ${provider}.
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
                    <span style="display: inline-block; background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 9999px; border: 1px solid #a7f3d0;">
                      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; margin-right: 4px; vertical-align: middle;"></span>New signup
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
                      New merchant registered
                    </h1>
                    <p style="margin: 0 0 20px 0; font-size: 13.5px; color: #64748b; line-height: 1.5;">
                      ${displayName} registered an account on MyMobPay.
                    </p>

                    <!-- SPEC TABLE -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; border-collapse: separate;">
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0; width: 34%;">Business</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12.5px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${businessName || displayName}</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Email</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12.5px; color: #0f172a; border-bottom: 1px solid #e2e8f0; word-break: break-all;">
                          <a href="mailto:${userEmail}" style="color: #0f172a; text-decoration: none; font-weight: 600;">${userEmail}</a>
                        </td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Phone</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12.5px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">
                          ${phone ? `<a href="https://wa.me/${phone.replace(/\\D/g, '')}" target="_blank" style="color: #047857; text-decoration: none; font-weight: 600;">${phone} (WhatsApp)</a>` : '<span style="color: #94a3b8;">Not provided</span>'}
                        </td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">UPI VPA</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12px; font-family: ui-monospace, Menlo, monospace; color: #0f172a; border-bottom: 1px solid #e2e8f0; word-break: break-all;">
                          ${upiId || '<span style="color: #94a3b8; font-family: sans-serif;">Pending</span>'}
                        </td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Bank KYC</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12px; color: #0f172a; border-bottom: 1px solid #e2e8f0; word-break: break-word;">
                          ${bankText}
                        </td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Time</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12px; color: #475569; border-bottom: 1px solid #e2e8f0;">${istDateStr}</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500;">User ID</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 11.5px; font-family: ui-monospace, Menlo, monospace; color: #64748b; word-break: break-all;">${userId || 'N/A'}</td>
                      </tr>
                    </table>

                    <!-- CTA BUTTON -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 16px;">
                      <tr>
                        <td align="center">
                          <a href="https://mymob.tech/dashboard" target="_blank" class="cta-btn" style="display: inline-block; width: 100%; max-width: 260px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px; text-align: center; box-sizing: border-box;">
                            Open Admin Console &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- QUICK CONTACT LINKS -->
                    <p style="margin: 0; font-size: 12px; text-align: center; color: #94a3b8;">
                      <a href="mailto:${userEmail}" style="color: #64748b; text-decoration: none; font-weight: 600;">Email merchant</a>
                      ${phone ? `&nbsp;&bull;&nbsp;<a href="https://wa.me/${phone.replace(/\\D/g, '')}" target="_blank" style="color: #047857; text-decoration: none; font-weight: 600;">WhatsApp</a>` : ''}
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding-top: 20px; text-align: center;">
              <p style="margin: 0; font-size: 11.5px; color: #94a3b8;">
                MyMobPay &bull; Automated admin alert &bull; <a href="https://mymob.tech" style="color: #64748b; text-decoration: none;">mymob.tech</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `New merchant signup: ${displayName}\nEmail: ${userEmail}\nPhone: ${phone || 'N/A'}\nUPI: ${upiId || 'Pending'}\nBank: ${bankText}\nTime: ${istDateStr}\nUser ID: ${userId}\n\nOpen Console: https://mymob.tech/dashboard`;

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
  <title>Tax invoice #${refCode}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    @media only screen and (max-width: 480px) {
      .outer-cell { padding: 16px 10px !important; }
      .card-pad { padding: 20px 16px !important; }
      .k-col { width: 38% !important; font-size: 12px !important; }
      .v-col { font-size: 12px !important; }
      .cta-btn { width: 100% !important; display: block !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Tax Invoice #${refCode}. Amount: ₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}. License active until ${expiryFormatted}.
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
                    <span style="display: inline-block; background-color: #ecfdf5; color: #065f46; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 9999px; border: 1px solid #a7f3d0;">
                      <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background-color: #10b981; margin-right: 4px; vertical-align: middle;"></span>Paid
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
                    <div style="margin-bottom: 16px;">
                      <span style="font-size: 12px; font-weight: 600; color: #64748b;">Tax invoice #${refCode}</span>
                      <div style="font-size: 26px; font-weight: 800; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin-top: 4px; line-height: 1.2;">
                        &#8377;${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style="font-size: 12.5px; color: #64748b; margin-top: 4px;">
                        Paid on ${dateFormatted} &bull; Valid until ${expiryFormatted}
                      </div>
                    </div>

                    <!-- SPEC TABLE -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; border-collapse: separate;">
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0; width: 36%;">Plan</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12.5px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0;">${planName} (${durationDays} days)</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Billed To</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12.5px; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0; word-break: break-all;">${businessName} (${to})</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Merchant ID</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12px; font-family: ui-monospace, Menlo, monospace; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0; word-break: break-all;">${mid}</td>
                      </tr>
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Payment Rail</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12.5px; color: #0f172a; border-bottom: 1px solid #e2e8f0;">${paymentMethod}</td>
                      </tr>
                      ${utr ? `
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500; border-bottom: 1px solid #e2e8f0;">Bank UTR</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12px; font-family: ui-monospace, Menlo, monospace; color: #0f172a; font-weight: 600; border-bottom: 1px solid #e2e8f0; word-break: break-all;">${utr}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td class="k-col" style="padding: 9px 12px; font-size: 12.5px; color: #64748b; font-weight: 500;">Gateway Fee</td>
                        <td class="v-col" style="padding: 9px 12px; font-size: 12.5px; color: #059669; font-weight: 600;">0.00% (Direct to bank)</td>
                      </tr>
                    </table>

                    <!-- CTA BUTTON -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 16px;">
                      <tr>
                        <td align="center">
                          <a href="https://mymob.tech/dashboard" target="_blank" class="cta-btn" style="display: inline-block; width: 100%; max-width: 260px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px; text-align: center; box-sizing: border-box;">
                            Open Dashboard &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; font-size: 11.5px; color: #94a3b8; text-align: center;">
                      Computer-generated invoice. No physical signature required.
                    </p>
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

  const orderRowsHtml = recentOrders.slice(0, 10).map(order => {
    const dt = order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Recent';
    const isSuccess = order.status === 'verified' || order.status === 'completed' || order.status === 'paid';
    const badgeColor = isSuccess ? '#065f46' : '#991b1b';
    const badgeBg = isSuccess ? '#ecfdf5' : '#fef2f2';
    const badgeBorder = isSuccess ? '#a7f3d0' : '#fecaca';
    const amountStr = parseFloat(order.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 });
    const utrStr = order.utr || order.customer_utr || '—';
    const refStr = order.external_ref || order.id?.slice(0, 8) || 'N/A';

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 8px 10px; font-size: 12px; color: #0f172a;">
          <div style="font-weight: 600; word-break: break-all;">${refStr}</div>
          <div style="font-size: 10.5px; color: #64748b; font-family: ui-monospace, Menlo, monospace;">${dt}${utrStr !== '—' ? ` &bull; ${utrStr}` : ''}</div>
        </td>
        <td align="right" style="padding: 8px 10px; font-size: 12px; font-weight: 700; color: #0f172a; font-family: ui-monospace, Menlo, monospace;">
          &#8377;${amountStr}
        </td>
        <td align="right" style="padding: 8px 10px;">
          <span style="display: inline-block; padding: 2px 7px; border-radius: 9999px; font-size: 10px; font-weight: 600; background-color: ${badgeBg}; color: ${badgeColor}; border: 1px solid ${badgeBorder};">
            ${isSuccess ? 'Settled' : (order.status || 'Pending')}
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
  <title>Monthly statement &bull; ${monthYear || 'Summary'}</title>
  <style type="text/css">
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; }
    @media only screen and (max-width: 480px) {
      .outer-cell { padding: 16px 10px !important; }
      .card-pad { padding: 20px 14px !important; }
      .kpi-col { display: block !important; width: 100% !important; padding: 0 0 8px 0 !important; box-sizing: border-box !important; }
      .cta-btn { width: 100% !important; display: block !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f8fafc; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Monthly statement for ${businessName} (${monthYear}). Settled volume: ₹${formattedVolume}.
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
                      Statement
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
                      Statement &bull; ${monthYear || 'Summary'}
                    </h1>
                    <p style="margin: 0 0 18px 0; font-size: 13.5px; color: #64748b; line-height: 1.5;">
                      Reconciled UPI settlements for ${businessName}.
                    </p>

                    <!-- KPI 2x2 GRID -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 16px;">
                      <tr>
                        <td width="50%" class="kpi-col" style="padding-right: 5px; padding-bottom: 10px; vertical-align: top;">
                          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;">
                            <div style="font-size: 11px; font-weight: 600; color: #64748b;">Settled Volume</div>
                            <div style="font-size: 18px; font-weight: 800; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin-top: 2px;">&#8377;${formattedVolume}</div>
                            <div style="font-size: 10.5px; color: #059669; font-weight: 600; margin-top: 2px;">100% Direct Passthrough</div>
                          </div>
                        </td>
                        <td width="50%" class="kpi-col" style="padding-left: 5px; padding-bottom: 10px; vertical-align: top;">
                          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;">
                            <div style="font-size: 11px; font-weight: 600; color: #64748b;">Total Orders</div>
                            <div style="font-size: 18px; font-weight: 800; color: #0f172a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin-top: 2px;">${transactionCount}</div>
                            <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">${successfulCount} Settled &bull; ${failedCount} Failed</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" class="kpi-col" style="padding-right: 5px; vertical-align: top;">
                          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;">
                            <div style="font-size: 11px; font-weight: 600; color: #64748b;">Success Rate</div>
                            <div style="font-size: 18px; font-weight: 800; color: #059669; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin-top: 2px;">${successRate}%</div>
                            <div style="font-size: 10.5px; color: #059669; font-weight: 600; margin-top: 2px;">Automated Bank UTR</div>
                          </div>
                        </td>
                        <td width="50%" class="kpi-col" style="padding-left: 5px; vertical-align: top;">
                          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px;">
                            <div style="font-size: 11px; font-weight: 600; color: #64748b;">Gateway Fee</div>
                            <div style="font-size: 18px; font-weight: 800; color: #059669; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; margin-top: 2px;">&#8377;0.00</div>
                            <div style="font-size: 10.5px; color: #059669; font-weight: 600; margin-top: 2px;">0% MDR (Direct to bank)</div>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- RECENT TRANSACTIONS -->
                    <div style="font-size: 11.5px; font-weight: 700; color: #64748b; margin-bottom: 6px;">
                      Recent Transactions (${recentOrders.length > 0 ? recentOrders.length : '0'})
                    </div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; border-collapse: separate;">
                      ${orderRowsHtml || `
                        <tr>
                          <td colspan="3" align="center" style="padding: 16px; color: #94a3b8; font-size: 12px;">
                            No processed transactions for this statement period.
                          </td>
                        </tr>
                      `}
                    </table>

                    <!-- CTA BUTTON -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation">
                      <tr>
                        <td align="center">
                          <a href="https://mymob.tech/dashboard" target="_blank" class="cta-btn" style="display: inline-block; width: 100%; max-width: 260px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px; text-align: center; box-sizing: border-box;">
                            Open Full Ledger &rarr;
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

  const subject = `Monthly statement: ${monthYear || 'Summary'} &bull; ${businessName}`;
  const text = `Monthly Statement for ${businessName} (${mid})\nPeriod: ${statementPeriod || monthYear}\nGross Volume: ₹${parseFloat(totalVolume || 0).toLocaleString('en-IN')}\nOrders: ${transactionCount} (Settled: ${successfulCount}, Failed: ${failedCount})\nGateway Fee: ₹0.00\n\nOpen ledger: https://mymob.tech/dashboard`;

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
  <title>Complete your onboarding</title>
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
    Complete your onboarding on MyMobPay and activate 0% fee direct bank settlements.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f8fafc;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 28px 14px 40px 14px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 520px; margin: 0 auto;">
          
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
                      Onboarding
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
                    <h1 style="margin: 0 0 6px 0; font-size: 19px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                      Complete your onboarding
                    </h1>
                    <p style="margin: 0 0 18px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                      Hi ${recipientName}, activate 0% fee direct bank &amp; UPI settlements on your account.
                    </p>

                    <!-- CHECKLIST BOX -->
                    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                      <div style="font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 8px;">Please reply to this email with:</div>
                      <div style="font-size: 13px; line-height: 1.6; color: #475569;">
                        1. Your active WhatsApp / phone number<br/>
                        2. Preferred time for a quick call or message
                      </div>
                    </div>

                    <!-- CTA BUTTON -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 16px;">
                      <tr>
                        <td align="center">
                          <a href="mailto:support@mymob.tech?subject=Contact%20Number%20for%20Onboarding%20-${encodeURIComponent(recipientName)}" class="cta-btn" style="display: inline-block; width: 100%; max-width: 260px; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 20px; border-radius: 8px; text-align: center; box-sizing: border-box;">
                            Reply with Contact Number &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center;">
                      Our team will verify your settlement UPI and help you launch.
                    </p>
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



