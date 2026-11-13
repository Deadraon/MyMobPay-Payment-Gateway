import nodemailer from 'nodemailer';
import { supabaseAdmin } from './supabase.js';

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
  '"MyMobPay" <noreply@mymobpay.tech>';

// ── Provider Configuration Checkers ──────────────────────────
export function isMailflareConfigured() {
  const hasKey = Boolean(process.env.MAILFLARE_API_KEY || process.env.MAILFLARE_SMTP_PASS);
  const hasTarget = Boolean(process.env.MAILFLARE_MAILBOX_ID || process.env.MAILFLARE_SMTP_USER);
  return hasKey && hasTarget;
}

export function isSendpulseConfigured() {
  return Boolean(process.env.SENDPULSE_SMTP_USER && process.env.SENDPULSE_SMTP_PASS);
}

export function isEmailLabsConfigured() {
  return Boolean(process.env.EMAILLABS_SMTP_USER && process.env.EMAILLABS_SMTP_PASS);
}

export function isMailerooConfigured() {
  return Boolean(
    (process.env.MAILEROO_SMTP_USER && process.env.MAILEROO_SMTP_PASS) ||
    process.env.MAILEROO_API_KEY
  );
}

export function isBrevoConfigured() {
  return Boolean(process.env.BREVO_SMTP_USER && (process.env.BREVO_SMTP_KEY || process.env.BREVO_SMTP_PASS));
}

export function isUnitpostConfigured() {
  return Boolean(
    process.env.UNITPOST_API_KEY ||
    (process.env.UNITPOST_SMTP_USER && (process.env.UNITPOST_SMTP_PASS || process.env.UNITPOST_API_KEY))
  );
}

export function isResendConfigured() {
  const key = process.env.RESEND_API_KEY || (smtpPass && smtpPass.startsWith('re_') ? smtpPass : null);
  return Boolean(key);
}

export function isSmtpConfigured() {
  return Boolean(
    isMailflareConfigured() ||
    isSendpulseConfigured() ||
    isEmailLabsConfigured() ||
    isMailerooConfigured() ||
    isBrevoConfigured() ||
    isUnitpostConfigured() ||
    isResendConfigured() ||
    smtpPass ||
    (smtpUser && smtpPass)
  );
}

// ── 0. Mailflare REST API / SMTP Transport (Self-Hosted on email.mymobpay.tech | Primary — Unlimited own-domain sends) ─
export function getMailflareTransporter() {
  if (!isMailflareConfigured()) return null;
  const port = parseInt(process.env.MAILFLARE_SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host: process.env.MAILFLARE_SMTP_HOST || 'email.mymobpay.tech',
    port,
    secure: port === 465,
    auth: {
      user: process.env.MAILFLARE_SMTP_USER,
      pass: process.env.MAILFLARE_SMTP_PASS || process.env.MAILFLARE_API_KEY,
    },
    // Mailflare is self-signed TLS on a subdomain; allow it
    tls: { rejectUnauthorized: false },
  });
}

async function sendViaMailflare({ to, subject, html, text, purpose = 'general', senderFormat = null }) {
  const apiKey = process.env.MAILFLARE_API_KEY || process.env.MAILFLARE_SMTP_PASS;
  const mailboxId = process.env.MAILFLARE_MAILBOX_ID;
  const rawHost = process.env.MAILFLARE_SMTP_HOST || 'email.mymobpay.tech';
  const baseUrl = process.env.MAILFLARE_BASE_URL || (rawHost.startsWith('http') ? rawHost : `https://${rawHost}`);

  // Resolve from address and sender display name
  let rawFrom;
  let senderName = 'MyMobPay';
  if (senderFormat === 'auth' || purpose === 'otp' || purpose === 'link') {
    rawFrom = process.env.MAILFLARE_AUTH_FROM || 'MyMobPay Security <noreply@mymobpay.tech>';
    senderName = 'MyMobPay Security';
  } else if (senderFormat === 'trx' || purpose === 'invoice' || purpose === 'subscription' || purpose === 'statement' || purpose === 'transaction' || purpose === 'receipt') {
    rawFrom = process.env.MAILFLARE_BILLING_FROM || 'MyMobPay Billing <noreply@mymobpay.tech>';
    senderName = 'MyMobPay Billing';
  } else {
    rawFrom = process.env.MAILFLARE_FROM || process.env.SMTP_FROM || 'MyMobPay <noreply@mymobpay.tech>';
    senderName = 'MyMobPay';
  }

  let cleanEmail = 'noreply@mymobpay.tech';
  if (rawFrom.includes('<') && rawFrom.includes('>')) {
    const match = rawFrom.match(/^["']?([^<"']+)["']?\s*<([^>]+)>/);
    if (match) {
      if (match[1].trim()) senderName = match[1].trim();
      cleanEmail = match[2].trim();
    }
  } else if (rawFrom.includes('@')) {
    cleanEmail = rawFrom.trim();
  }

  const from = `"${senderName}" <${cleanEmail}>`;

  // 1. Primary: REST API over HTTPS (Port 443 — bypasses Cloudflare port 587/465 blocks)
  if (apiKey && mailboxId) {
    const cleanBase = baseUrl.replace(/\/$/, '');
    const recipientList = Array.isArray(to) ? to : [to];

    const res = await fetch(`${cleanBase}/api/v1/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        mailboxId,
        from,
        fromName: senderName,
        name: senderName,
        displayName: senderName,
        senderName: senderName,
        to: recipientList,
        subject,
        html,
        text: text || (html ? html.replace(/<[^>]+>/g, ' ').trim() : ''),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const errMsg = err.error?.message || (typeof err.error === 'string' ? err.error : JSON.stringify(err.error || err));
      throw new Error(`Mailflare REST API error (HTTP ${res.status}): ${errMsg || res.statusText}`);
    }

    const data = await res.json().catch(() => ({}));
    return {
      success: true,
      id: data.id || data.messageId || `mf-${Date.now()}`,
      provider: 'mailflare',
    };
  }

  // 2. Secondary: SMTP Transport fallback (if unproxied direct connection is available)
  const transporter = getMailflareTransporter();
  if (transporter && !baseUrl.includes('email.mymobpay.tech')) {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    return { success: true, id: info.messageId, provider: 'mailflare' };
  }

  if (apiKey && !mailboxId) {
    throw new Error('Mailflare requires MAILFLARE_MAILBOX_ID in .env.local to send via REST API (Cloudflare proxy blocks port 587). Please configure MAILFLARE_MAILBOX_ID.');
  }

  throw new Error('Mailflare is not configured. Missing MAILFLARE_SMTP_PASS (or MAILFLARE_API_KEY) and MAILFLARE_MAILBOX_ID.');
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

// ── Provider Quota Limits & Daily Sent Tracker ─────────────────
export const PROVIDER_DAILY_LIMITS = {
  mailflare: parseInt(process.env.MAILFLARE_DAILY_LIMIT || '10000', 10), // Cloudflare Workers Free Tier quota: 10,000/day
  sendpulse: 500,  // Monthly 15,000 (~500/day)
  emaillabs: 300,  // Monthly 9,000 (~300/day)
  brevo: 300,      // Daily 300 free tier
  unitpost: 200,   // Monthly 5,000 (~200/day)
  maileroo: 100,   // Monthly 3,000 fair-use (~100/day)
  resend: 100,     // Monthly 3,000 (~100/day)
};

const dailySentTracker = new Map();

export function getTodayIstDateKey() {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

export function trackProviderSent(providerName) {
  if (!providerName) return;
  const cleanName = String(providerName).toLowerCase().replace(/-(smtp|api)$/, '').trim();
  const key = `${getTodayIstDateKey()}:${cleanName}`;
  const current = dailySentTracker.get(key) || 0;
  dailySentTracker.set(key, current + 1);

  // Auto garbage collect records older than today
  if (dailySentTracker.size > 80) {
    const todayKey = getTodayIstDateKey();
    for (const [k] of dailySentTracker.entries()) {
      if (!k.startsWith(todayKey)) {
        dailySentTracker.delete(k);
      }
    }
  }
}

export function getProviderDailySentCounts() {
  const todayKey = getTodayIstDateKey();
  const counts = {
    mailflare: 0,
    sendpulse: 0,
    emaillabs: 0,
    brevo: 0,
    unitpost: 0,
    maileroo: 0,
    resend: 0,
  };
  for (const [k, count] of dailySentTracker.entries()) {
    if (k.startsWith(todayKey)) {
      const provider = k.split(':')[1];
      if (provider && counts[provider] !== undefined) {
        counts[provider] += count;
      }
    }
  }
  return counts;
}

export async function recordOutboxEmail({
  to,
  recipient_name = '',
  subject,
  provider,
  status = 'delivered',
  message_id = null,
  error = null,
  purpose = 'general',
  sender_format = 'auto',
  snippet = '',
}) {
  try {
    let adminMerchant = null;
    try {
      const { ensureAdminMerchant } = await import('./adminSettings.js');
      adminMerchant = await ensureAdminMerchant();
    } catch (e) {}

    if (!adminMerchant) {
      const { data } = await supabaseAdmin
        .from('merchants')
        .select('id, setup_progress')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      adminMerchant = data;
    }

    if (!adminMerchant) return;

    const setupProgress = adminMerchant.setup_progress || {};
    const adminSettings = setupProgress.admin_settings || {};
    const outbox = Array.isArray(adminSettings.email_outbox) ? [...adminSettings.email_outbox] : [];

    outbox.unshift({
      id: `email_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      to: Array.isArray(to) ? to.join(', ') : String(to),
      recipient_name: recipient_name || (Array.isArray(to) ? to[0] : String(to)),
      subject: subject || 'Transaction Email',
      template_type: purpose || 'transaction',
      status,
      message_id: message_id || null,
      error: error || null,
      provider: provider || 'mailflare',
      sender_format: sender_format || 'auto',
      sent_at: new Date().toISOString(),
      snippet: snippet || subject || ''
    });

    const trimmedOutbox = outbox.slice(0, 300);

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
  } catch (err) {
    console.warn('[MAILER TELEMETRY] Non-blocking outbox record error:', err.message);
  }
}

function formatSenderAddress(senderValue, fallback) {
  if (!senderValue || typeof senderValue !== 'string' || !senderValue.includes('@')) {
    return fallback;
  }
  return senderValue.trim();
}

export function getSenderForPurpose(purpose = 'general', provider = null, senderFormat = null) {
  // Explicit format override (from Admin Panel Sender Format Selector)
  if (senderFormat === 'auth') {
    return formatSenderAddress(process.env.AUTH_FROM, 'MyMobPay Security <auth@mymobpay.tech>');
  }
  if (senderFormat === 'trx') {
    if (provider === 'sendpulse' && process.env.SENDPULSE_FROM) {
      return formatSenderAddress(process.env.SENDPULSE_FROM, 'MyMobPay Billing <trx@mymobpay.tech>');
    }
    return formatSenderAddress(process.env.BILLING_FROM, 'MyMobPay Billing <trx@mymobpay.tech>');
  }
  if (senderFormat === 'noreply') {
    return formatSenderAddress(process.env.SMTP_FROM || process.env.EMAIL_FROM, 'MyMobPay Support <noreply@mymobpay.tech>');
  }

  // STRICT RULE: trx@mymobpay.tech is exclusively reserved for transaction statements, receipts & alerts
  if (purpose === 'invoice' || purpose === 'subscription' || purpose === 'statement' || purpose === 'transaction' || purpose === 'receipt') {
    if (provider === 'sendpulse' && process.env.SENDPULSE_FROM) {
      return formatSenderAddress(process.env.SENDPULSE_FROM, 'MyMobPay Billing <trx@mymobpay.tech>');
    }
    return formatSenderAddress(process.env.BILLING_FROM, 'MyMobPay Billing <trx@mymobpay.tech>');
  }
  if (purpose === 'otp' || purpose === 'link') {
    return formatSenderAddress(process.env.AUTH_FROM, 'MyMobPay Security <auth@mymobpay.tech>');
  }
  return formatSenderAddress(process.env.SMTP_FROM || process.env.EMAIL_FROM, 'MyMobPay <noreply@mymobpay.tech>');
}

async function sendViaSendpulse({ to, subject, html, text, purpose = 'invoice', senderFormat = null }) {
  const transporter = getSendpulseTransporter();
  if (!transporter) throw new Error('SendPulse SMTP is not configured');
  const from = getSenderForPurpose(purpose, 'sendpulse', senderFormat);
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
async function sendViaResend({ to, subject, html, text, purpose = 'welcome', senderFormat = null }) {
  const resendApiKey = process.env.RESEND_API_KEY || (smtpPass && smtpPass.startsWith('re_') ? smtpPass : null);
  if (!resendApiKey) throw new Error('Resend API key is not configured');
  const from = getSenderForPurpose(purpose, 'resend', senderFormat);

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

async function sendViaBrevo({ to, subject, html, text, purpose = 'invoice', senderFormat = null }) {
  const transporter = getBrevoTransporter();
  if (!transporter) throw new Error('Brevo SMTP is not configured');
  let from = getSenderForPurpose(purpose, 'brevo', senderFormat);
  // Brevo only allows verified sender addresses: auth@mymobpay.tech or trx@mymobpay.tech
  if (from.includes('noreply@mymobpay.tech')) {
    from = process.env.AUTH_FROM || 'MyMobPay Security <auth@mymobpay.tech>';
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

// ── 4. EmailLabs SMTP Transport (300/day, 9k/month free) ──────
export function getEmailLabsTransporter() {
  if (!isEmailLabsConfigured()) return null;
  const port = parseInt(process.env.EMAILLABS_SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host: process.env.EMAILLABS_SMTP_HOST || 'smtp-relay.emaillabs.net.pl',
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAILLABS_SMTP_USER,
      pass: process.env.EMAILLABS_SMTP_PASS,
    },
  });
}

async function sendViaEmailLabs({ to, subject, html, text, purpose = 'general', senderFormat = null }) {
  const transporter = getEmailLabsTransporter();
  if (!transporter) throw new Error('EmailLabs SMTP is not configured');
  const from = getSenderForPurpose(purpose, 'emaillabs', senderFormat);
  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
  return { success: true, id: info.messageId, provider: 'emaillabs' };
}

// ── 5. Maileroo SMTP / REST API Transport (Flexible Daily / Burst Buffer, 3k/month free) ─
export function getMailerooTransporter() {
  if (!process.env.MAILEROO_SMTP_USER || !process.env.MAILEROO_SMTP_PASS) return null;
  const port = parseInt(process.env.MAILEROO_SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host: process.env.MAILEROO_SMTP_HOST || 'smtp.maileroo.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.MAILEROO_SMTP_USER,
      pass: process.env.MAILEROO_SMTP_PASS,
    },
  });
}

async function sendViaMaileroo({ to, subject, html, text, purpose = 'general', senderFormat = null }) {
  const transporter = getMailerooTransporter();
  const from = getSenderForPurpose(purpose, 'maileroo', senderFormat);

  if (transporter) {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    return { success: true, id: info.messageId, provider: 'maileroo-smtp' };
  }

  if (process.env.MAILEROO_API_KEY) {
    const apiKey = process.env.MAILEROO_API_KEY;
    let res = await fetch('https://smtp.maileroo.com/api/v2/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        html,
        plain: text,
      }),
    });

    if (!res.ok && res.status === 404) {
      // Fallback to legacy v1 send endpoint
      res = await fetch('https://smtp.maileroo.com/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          from,
          to: Array.isArray(to) ? to.join(',') : to,
          subject,
          html,
          plain: text,
        }),
      });
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Maileroo API error HTTP ${res.status}: ${err.message || err.error || res.statusText}`);
    }
    const data = await res.json();
    return { success: true, id: data.id || data.message_id || data.reference_id || 'maileroo-sent', provider: 'maileroo-api' };
  }

  throw new Error('Maileroo is not configured');
}

// ── 6. Unitpost REST API / SMTP Transport (200/day, 5k/month free) ─────
export function getUnitpostTransporter() {
  const user = process.env.UNITPOST_SMTP_USER || 'unitpost';
  const pass = process.env.UNITPOST_SMTP_PASS || process.env.UNITPOST_API_KEY;
  if (!pass) return null;
  const port = parseInt(process.env.UNITPOST_SMTP_PORT || '587', 10);
  return nodemailer.createTransport({
    host: process.env.UNITPOST_SMTP_HOST || 'smtp.unitpost.com',
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

async function sendViaUnitpost({ to, subject, html, text, purpose = 'general', senderFormat = null }) {
  const apiKey = process.env.UNITPOST_API_KEY;
  const from = getSenderForPurpose(purpose, 'unitpost', senderFormat);

  if (apiKey) {
    try {
      const res = await fetch('https://www.unitpost.com/api/v1/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
          text,
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: true, id: data.id || data.message_id || 'unitpost-sent', provider: 'unitpost-api' };
      }
      const errData = await res.json().catch(() => ({}));
      const errMsg = `Unitpost API Error HTTP ${res.status}: ${errData.message || errData.error || res.statusText}`;
      const transporter = getUnitpostTransporter();
      if (!transporter) {
        throw new Error(errMsg);
      }
      console.warn(`[UNITPOST API] ${errMsg}, falling back to SMTP...`);
    } catch (apiErr) {
      const transporter = getUnitpostTransporter();
      if (!transporter) throw apiErr;
      console.warn(`[UNITPOST API] API call failed (${apiErr.message}), trying SMTP...`);
    }
  }

  const transporter = getUnitpostTransporter();
  if (transporter) {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });
    return { success: true, id: info.messageId, provider: 'unitpost-smtp' };
  }

  throw new Error('Unitpost is not configured');
}

// ── 7. Fallback Default SMTP Transport ─────────────────────────
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

async function sendViaDefaultSmtp({ to, subject, html, text, purpose = 'general', senderFormat = null }) {
  const transporter = getTransporter();
  if (!transporter) throw new Error('Default SMTP is not configured');
  const from = getSenderForPurpose(purpose, 'default', senderFormat);
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
 * Real-Time Quota Telemetry for Admin Dashboard
 * Aggregates in-memory usage, database outbox counts for today (IST),
 * and circuit breaker cooldowns to calculate remaining limits.
 */
export function getProviderQuotaTelemetry(outboxRecords = []) {
  const istDateKey = getTodayIstDateKey();
  const memoryCounts = getProviderDailySentCounts();

  // Aggregate persistent outbox records sent today (IST)
  const dbCounts = {
    mailflare: 0,
    sendpulse: 0,
    emaillabs: 0,
    brevo: 0,
    unitpost: 0,
    maileroo: 0,
    resend: 0,
  };

  if (Array.isArray(outboxRecords)) {
    for (const item of outboxRecords) {
      if (item.status === 'delivered' && item.sent_at) {
        try {
          const itemDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date(item.sent_at));
          if (itemDate === istDateKey) {
            const p = String(item.provider || '').toLowerCase();
            for (const key of Object.keys(dbCounts)) {
              if (p.includes(key)) {
                dbCounts[key] += 1;
                break;
              }
            }
          }
        } catch (e) {}
      }
    }
  }

  const circuitStatus = getProviderCircuitStatus();

  const providerConfigs = {
    mailflare: {
      id: 'mailflare',
      name: 'Mailflare',
      dailyLimit: PROVIDER_DAILY_LIMITS.mailflare,
      type: 'Self-Hosted REST API',
      tier: '10,000/day Free (Cloudflare Workers Rail)',
      description: 'Self-hosted email engine on email.mymobpay.tech — Primary Rail',
      isConfigured: isMailflareConfigured(),
    },
    emaillabs: {
      id: 'emaillabs',
      name: 'EmailLabs',
      dailyLimit: PROVIDER_DAILY_LIMITS.emaillabs,
      type: 'SMTP Relay',
      tier: '300/day Free (9,000/mo)',
      description: 'Ultra-fast SMTP relay on apex @mymobpay.tech domain',
      isConfigured: isEmailLabsConfigured(),
    },
    unitpost: {
      id: 'unitpost',
      name: 'Unitpost',
      dailyLimit: PROVIDER_DAILY_LIMITS.unitpost,
      type: 'REST API / SMTP',
      tier: '200/day Free (5,000/mo)',
      description: 'High deliverability REST API & SMTP relay',
      isConfigured: isUnitpostConfigured(),
    },
    maileroo: {
      id: 'maileroo',
      name: 'Maileroo',
      dailyLimit: PROVIDER_DAILY_LIMITS.maileroo,
      type: 'Flexible Buffer',
      tier: '100/day Fair-Use (~3,000/mo)',
      description: 'Transactional cloud buffer with dedicated DKIM',
      isConfigured: isMailerooConfigured(),
    },
    sendpulse: {
      id: 'sendpulse',
      name: 'SendPulse',
      dailyLimit: PROVIDER_DAILY_LIMITS.sendpulse,
      type: 'SMTP Relay',
      tier: '500/day Free (15,000/mo)',
      description: 'Exclusively optimized for Invoices & Statements',
      isConfigured: isSendpulseConfigured(),
    },
    brevo: {
      id: 'brevo',
      name: 'Brevo',
      dailyLimit: PROVIDER_DAILY_LIMITS.brevo,
      type: 'SMTP Relay',
      tier: '300/day Free (9,000/mo)',
      description: 'Reliable transactional SMTP relay with domain verification',
      isConfigured: isBrevoConfigured(),
    },
    resend: {
      id: 'resend',
      name: 'Resend',
      dailyLimit: PROVIDER_DAILY_LIMITS.resend,
      type: 'REST API',
      tier: '100/day Free (3,000/mo)',
      description: 'Sub-second REST API delivery for urgent alerts',
      isConfigured: isResendConfigured(),
    },
  };

  let totalLimit = 0;
  let totalSentToday = 0;
  let activeProvidersCount = 0;

  const providers = Object.entries(providerConfigs).map(([key, config]) => {
    // Take max of in-memory tracked and db outbox to avoid double counting or losing counts on cold restart
    const sentToday = Math.max(memoryCounts[key] || 0, dbCounts[key] || 0);
    const remaining = Math.max(0, config.dailyLimit - sentToday);
    const circuit = circuitStatus[key] || null;

    if (config.isConfigured) {
      totalLimit += config.dailyLimit;
      totalSentToday += sentToday;
      activeProvidersCount += 1;
    }

    return {
      ...config,
      sentToday,
      remaining,
      circuit,
      status: !config.isConfigured ? 'not_configured' : (circuit?.isLimited ? 'cooldown' : 'active'),
    };
  });

  const allProvidersLimit = Object.values(PROVIDER_DAILY_LIMITS).reduce((sum, lim) => sum + lim, 0);
  const totalRemaining = Math.max(0, totalLimit - totalSentToday);

  return {
    providers,
    combined: {
      totalLimit,
      totalSentToday,
      totalRemaining,
      activeProvidersCount,
      allProvidersLimit,
      totalCapacityLabel: `${totalRemaining} / ${totalLimit} Left Today`,
      percentageRemaining: totalLimit > 0 ? Math.round((totalRemaining / totalLimit) * 100) : 0,
    },
    date: istDateKey,
  };
}

/**
 * ─────────────────────────────────────────────────────────────
 * Multi-Provider Smart Email Dispatcher with Strict Purpose Routing
 * & Dynamic Quota Circuit-Breaker Failover
 * ─────────────────────────────────────────────────────────────
 * Routing Strategy:
 *  - 'invoice' | 'subscription' | 'statement' (Subscription Invoices & Monthly Statements):
 *      1. SendPulse (Exclusively prioritized for billing invoices & monthly account statements)
 *      2. Brevo (Emergency failover with trx@mymobpay.tech)
 *      3. Resend (Emergency failover with trx@mymobpay.tech)
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
export async function sendRawEmail({ to, subject, html, text, purpose = 'general', provider = null, senderFormat = null }) {
  // ── Manual Provider Override (Direct selection from Admin Console) ──
  if (provider && provider !== 'auto') {
    const explicitProviders = {
      mailflare:  { name: 'mailflare',  isReady: isMailflareConfigured,  send: sendViaMailflare },
      emaillabs: { name: 'emaillabs', isReady: isEmailLabsConfigured, send: sendViaEmailLabs },
      unitpost:  { name: 'unitpost',  isReady: isUnitpostConfigured,  send: sendViaUnitpost },
      maileroo:  { name: 'maileroo',  isReady: isMailerooConfigured,  send: sendViaMaileroo },
      sendpulse: { name: 'sendpulse', isReady: isSendpulseConfigured, send: sendViaSendpulse },
      brevo:     { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      resend:    { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      default:   { name: 'default',   isReady: () => Boolean(getTransporter()), send: sendViaDefaultSmtp },
    };

    const normTarget = String(provider).toLowerCase().trim().replace(/-(smtp|api)$/, '');
    const chosenProvider = explicitProviders[normTarget];

    if (!chosenProvider) {
      throw new Error(`Requested email provider "${provider}" is not recognized.`);
    }

    if (!chosenProvider.isReady()) {
      throw new Error(`Requested email provider "${normTarget.toUpperCase()}" is not configured in environment.`);
    }

    try {
      const result = await chosenProvider.send({ to, subject, html, text, purpose, senderFormat });
      trackProviderSent(chosenProvider.name);
      console.log(`[MAILER MANUAL ROUTE] Successfully dispatched (${purpose}) to ${to} via ${chosenProvider.name.toUpperCase()}`);

      recordOutboxEmail({
        to,
        subject,
        provider: chosenProvider.name,
        status: 'delivered',
        message_id: result.id || result.messageId || null,
        purpose,
        sender_format: senderFormat || 'auto',
        snippet: text ? text.slice(0, 140) : subject
      }).catch(() => {});

      return result;
    } catch (err) {
      console.error(`[MAILER MANUAL ROUTE ERROR] Failed to dispatch via ${chosenProvider.name.toUpperCase()}:`, err.message);
      if (isRateLimitOrQuotaError(err)) {
        tripProviderLimit(chosenProvider.name, err.message);
      }
      throw err;
    }
  }

  let providerChain = [];

  if (purpose === 'invoice' || purpose === 'subscription' || purpose === 'statement') {
    // 🎯 Ranked by daily limit & capacity for invoices & statements:
    // 1. Mailflare (∞, self-hosted own domain) -> 2. SendPulse (500/day) -> 3. EmailLabs -> 4. Brevo -> 5. Unitpost -> 6. Maileroo -> 7. Resend -> 8. Default SMTP
    providerChain = [
      { name: 'mailflare',  isReady: isMailflareConfigured,  send: sendViaMailflare },
      { name: 'sendpulse', isReady: isSendpulseConfigured, send: sendViaSendpulse },
      { name: 'emaillabs', isReady: isEmailLabsConfigured, send: sendViaEmailLabs },
      { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      { name: 'unitpost',  isReady: isUnitpostConfigured,  send: sendViaUnitpost },
      { name: 'maileroo',  isReady: isMailerooConfigured,  send: sendViaMaileroo },
      { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      { name: 'default',   isReady: () => Boolean(getTransporter()), send: sendViaDefaultSmtp },
    ];
  } else if (purpose === 'otp' || purpose === 'link') {
    // 🔐 Auth OTPs & Magic Links — Mailflare first (instant delivery, own domain)
    providerChain = [
      { name: 'mailflare',  isReady: isMailflareConfigured,  send: sendViaMailflare },
      { name: 'emaillabs', isReady: isEmailLabsConfigured, send: sendViaEmailLabs },
      { name: 'unitpost',  isReady: isUnitpostConfigured,  send: sendViaUnitpost },
      { name: 'maileroo',  isReady: isMailerooConfigured,  send: sendViaMaileroo },
      { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      { name: 'default',   isReady: () => Boolean(getTransporter()), send: sendViaDefaultSmtp },
    ];
  } else if (purpose === 'welcome' || purpose === 'signup') {
    // 🚀 Welcome & Onboarding — Mailflare first
    providerChain = [
      { name: 'mailflare',  isReady: isMailflareConfigured,  send: sendViaMailflare },
      { name: 'emaillabs', isReady: isEmailLabsConfigured, send: sendViaEmailLabs },
      { name: 'unitpost',  isReady: isUnitpostConfigured,  send: sendViaUnitpost },
      { name: 'maileroo',  isReady: isMailerooConfigured,  send: sendViaMaileroo },
      { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      { name: 'default',   isReady: () => Boolean(getTransporter()), send: sendViaDefaultSmtp },
    ];
  } else if (purpose === 'transaction' || purpose === 'receipt') {
    // ⚡ Per-transaction link receipts & merchant notifications — Mailflare first (unlimited own-domain), then multi-rail failovers
    providerChain = [
      { name: 'mailflare',  isReady: isMailflareConfigured,  send: sendViaMailflare },
      { name: 'emaillabs', isReady: isEmailLabsConfigured, send: sendViaEmailLabs },
      { name: 'unitpost',  isReady: isUnitpostConfigured,  send: sendViaUnitpost },
      { name: 'maileroo',  isReady: isMailerooConfigured,  send: sendViaMaileroo },
      { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      { name: 'sendpulse', isReady: isSendpulseConfigured, send: sendViaSendpulse },
      { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      { name: 'default',   isReady: () => Boolean(getTransporter()), send: sendViaDefaultSmtp },
    ];
  } else {
    // General auto-detect — Mailflare first (unlimited own-domain)
    providerChain = [
      { name: 'mailflare',  isReady: isMailflareConfigured,  send: sendViaMailflare },
      { name: 'emaillabs', isReady: isEmailLabsConfigured, send: sendViaEmailLabs },
      { name: 'unitpost',  isReady: isUnitpostConfigured,  send: sendViaUnitpost },
      { name: 'maileroo',  isReady: isMailerooConfigured,  send: sendViaMaileroo },
      { name: 'resend',    isReady: isResendConfigured,    send: sendViaResend },
      { name: 'brevo',     isReady: isBrevoConfigured,     send: sendViaBrevo },
      { name: 'sendpulse', isReady: isSendpulseConfigured, send: sendViaSendpulse },
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
      const result = await provider.send({ to, subject, html, text, purpose, senderFormat });
      trackProviderSent(provider.name);
      console.log(`[MAILER SMART ROUTER] Successfully dispatched (${purpose}) to ${to} via ${provider.name.toUpperCase()}`);

      recordOutboxEmail({
        to,
        subject,
        provider: provider.name,
        status: 'delivered',
        message_id: result.id || result.messageId || null,
        purpose,
        sender_format: senderFormat || 'auto',
        snippet: text ? text.slice(0, 140) : subject
      }).catch(() => {});

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

  const currentYear = new Date().getFullYear();

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
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1d1d1f; }
    @media only screen and (max-width: 480px) {
      .outer-cell { padding: 24px 12px 32px 12px !important; }
      .card-pad { padding: 28px 20px !important; }
      .otp-digits { font-size: 32px !important; letter-spacing: 6px !important; text-indent: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f5f5f7; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Your verification code is ${cleanOtp}. Valid for 10 minutes.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 540px; margin: 0 auto;">
          
          <!-- APPLE BRAND HEADER -->
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
                      Security
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
                  <td class="card-pad" style="padding: 36px 32px; text-align: center;">
                    <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 600; color: #1d1d1f; line-height: 1.25; letter-spacing: -0.02em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                      Verification Code
                    </h1>
                    <p style="margin: 0 0 24px 0; font-size: 15px; color: #6e6e73; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      Hi ${displayName}, enter this code to complete sign-in. Valid for 10 minutes.
                    </p>

                    <!-- CODE DISPLAY (APPLE ID STYLE) -->
                    <div style="margin: 28px 0; text-align: center;">
                      <div class="otp-digits" style="display: inline-block; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', ui-monospace, Menlo, monospace; font-size: 38px; font-weight: 600; letter-spacing: 8px; color: #1d1d1f; text-indent: 8px; padding: 14px 28px; background-color: #f5f5f7; border-radius: 12px; border: 1px solid #e5e5ea; line-height: 1;">
                        ${cleanOtp}
                      </div>
                    </div>

                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #86868b; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      Do not share this code with anyone. If you didn&apos;t request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- APPLE FOOTER -->
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
  <title>Sign in to MyMobPay</title>
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
    Click to sign in to your MyMobPay dashboard. Valid for 15 minutes.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 540px; margin: 0 auto;">
          
          <!-- APPLE BRAND HEADER -->
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
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e5e5ea; border-radius: 18px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
                <tr>
                  <td class="card-pad" style="padding: 36px 32px; text-align: center;">
                    <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 600; color: #1d1d1f; line-height: 1.25; letter-spacing: -0.02em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                      Sign In to MyMobPay
                    </h1>
                    <p style="margin: 0 0 26px 0; font-size: 15px; color: #6e6e73; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      Click the button below to securely access your merchant dashboard. Valid for 15 minutes.
                    </p>

                    <!-- APPLE PILL CTA BUTTON -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 0 0 24px 0;">
                      <tr>
                        <td align="center">
                          <a href="${actionLink}" target="_blank" class="cta-btn" style="display: inline-block; background-color: #0071e3; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 13px 30px; border-radius: 980px; letter-spacing: -0.01em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif; box-sizing: border-box;">
                            Sign In to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #86868b; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      If you didn&apos;t request this sign-in link, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- APPLE FOOTER -->
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
  const text = `Hi ${recipientName || 'there'},\n\nHere's your code:\n${otp}\n\nYour verification code is ${otp} and will expire in 10 minutes. For your security, don't share it with anyone. MyMobPay will never call to ask you for this information.\n\nHelp & Contact: https://mymobpay.tech/terms\nSecurity: https://mymobpay.tech/privacy`;

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
    Welcome to MyMobPay! Your merchant account (${mid || 'Active'}) is configured for direct UPI payments.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 560px; margin: 0 auto;">
          
          <!-- APPLE BRAND HEADER -->
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
                      Getting Started
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
                  <td class="card-pad" style="padding: 36px 32px;">
                    <h1 style="margin: 0 0 12px 0; font-size: 24px; font-weight: 600; color: #1d1d1f; line-height: 1.25; letter-spacing: -0.02em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                      Welcome to MyMobPay
                    </h1>
                    <p style="margin: 0 0 24px 0; font-size: 15px; color: #6e6e73; line-height: 1.6; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      Hi ${businessName}, your account is active and ready to accept zero-fee UPI payments directly into your bank account with no intermediary escrow.
                    </p>

                    <!-- APPLE SPEC TABLE -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 24px 0; border-top: 1px solid #e5e5ea; border-bottom: 1px solid #e5e5ea;">
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Merchant ID</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, ui-monospace, Menlo, monospace;">${mid || 'ACTIVE'}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Business Name</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${businessName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Registered Email</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${to}</td>
                      </tr>
                      ${upiId ? `
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Settlement UPI VPA</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, ui-monospace, Menlo, monospace;">${upiId}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Transaction Fee</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 600; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">0.00% (Direct Pass-Through)</td>
                      </tr>
                    </table>

                    <!-- NEXT STEPS (APPLE STYLE) -->
                    <div style="margin: 24px 0; padding: 18px 20px; background-color: #f5f5f7; border-radius: 12px;">
                      <div style="font-size: 13px; font-weight: 600; color: #1d1d1f; margin-bottom: 6px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Next steps:</div>
                      <div style="font-size: 13px; line-height: 1.6; color: #6e6e73; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                        1. Verify your settlement bank UPI VPA in Settings<br/>
                        2. Generate payment links or integrate checkout APIs<br/>
                        3. Review real-time transaction telemetry on your dashboard
                      </div>
                    </div>

                    <!-- APPLE PILL CTA -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 28px 0 8px 0;">
                      <tr>
                        <td align="left">
                          <a href="https://mymobpay.tech/dashboard" target="_blank" class="cta-btn" style="display: inline-block; background-color: #0071e3; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 28px; border-radius: 980px; letter-spacing: -0.01em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif; box-sizing: border-box;">
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

  const subject = `Welcome to MyMobPay, ${businessName}`;
  const text = `Welcome to MyMobPay, ${businessName}!\n\nYour merchant account (${mid}) is registered and active.\nAccess your console at: https://mymobpay.tech/dashboard\n\nDirect settlement to your bank account with zero MDR.`;

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

  const currentYear = new Date().getFullYear();

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
    New merchant registered: ${displayName} (${userEmail}) via ${provider}.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 560px; margin: 0 auto;">
          
          <!-- APPLE BRAND HEADER -->
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
                      Signup Alert
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
                  <td class="card-pad" style="padding: 36px 32px;">
                    <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #1d1d1f; line-height: 1.25; letter-spacing: -0.02em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                      New Merchant Registered
                    </h1>
                    <p style="margin: 0 0 24px 0; font-size: 15px; color: #6e6e73; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      ${displayName} has registered an account on MyMobPay.
                    </p>

                    <!-- APPLE SPEC TABLE -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 24px 0; border-top: 1px solid #e5e5ea; border-bottom: 1px solid #e5e5ea;">
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Business</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${businessName || displayName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Email</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #0071e3; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                          <a href="mailto:${userEmail}" style="color: #0071e3; text-decoration: none;">${userEmail}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Phone</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                          ${phone ? `<a href="https://wa.me/${phone.replace(/\\D/g, '')}" target="_blank" style="color: #0071e3; text-decoration: none;">${phone}</a>` : 'Not provided'}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">UPI VPA</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: ui-monospace, Menlo, monospace;">
                          ${upiId || 'Pending'}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Bank KYC</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                          ${bankPlain}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Time</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${istDateStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">User ID</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 500; text-align: right; font-family: ui-monospace, Menlo, monospace;">${userId || 'N/A'}</td>
                      </tr>
                    </table>

                    <!-- APPLE PILL CTA BUTTON -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 28px 0 16px 0;">
                      <tr>
                        <td align="left">
                          <a href="https://mymobpay.tech/dashboard" target="_blank" class="cta-btn" style="display: inline-block; background-color: #0071e3; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 28px; border-radius: 980px; letter-spacing: -0.01em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif; box-sizing: border-box;">
                            Open Admin Console
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
            <td align="center" style="padding-top: 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; line-height: 1.6; color: #86868b; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                MyMobPay &bull; Automated admin alert &bull; <a href="https://mymobpay.tech" style="color: #0071e3; text-decoration: none;">mymobpay.tech</a>
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

  const text = `New merchant signup: ${displayName}\nEmail: ${userEmail}\nPhone: ${phone || 'N/A'}\nUPI: ${upiId || 'Pending'}\nBank: ${bankText}\nTime: ${istDateStr}\nUser ID: ${userId}\n\nOpen Console: https://mymobpay.tech/dashboard`;

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
    Tax Invoice #${refCode}. Amount: ₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}. License active until ${expiryFormatted}.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 560px; margin: 0 auto;">
          
          <!-- APPLE BRAND HEADER -->
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
                      Invoice
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
                  <td class="card-pad" style="padding: 36px 32px;">
                    
                    <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 600; color: #1d1d1f; line-height: 1.25; letter-spacing: -0.02em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                      Tax Invoice #${refCode}
                    </h1>

                    <!-- APPLE HERO AMOUNT -->
                    <div style="margin: 20px 0 28px 0; text-align: left;">
                      <div style="font-size: 12px; font-weight: 500; color: #86868b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Amount Paid</div>
                      <div style="font-size: 38px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.03em; line-height: 1.1; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                        ₹${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </div>
                      <div style="font-size: 13px; color: #86868b; margin-top: 6px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                        Paid on ${dateFormatted} &bull; Valid until ${expiryFormatted}
                      </div>
                    </div>

                    <!-- APPLE SPEC TABLE -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 24px 0; border-top: 1px solid #e5e5ea; border-bottom: 1px solid #e5e5ea;">
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Plan</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${planName} (${durationDays} days)</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Billed To</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${businessName} (${to})</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Merchant ID</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: ui-monospace, Menlo, monospace;">${mid}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Payment Method</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${paymentMethod}</td>
                      </tr>
                      ${utr ? `
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Bank UTR</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 600; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: ui-monospace, Menlo, monospace;">${utr}</td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Gateway Commission</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 600; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">₹0.00 (Zero MDR)</td>
                      </tr>
                    </table>

                    <!-- APPLE PILL CTA BUTTON -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 28px 0 16px 0;">
                      <tr>
                        <td align="left">
                          <a href="https://mymobpay.tech/dashboard" target="_blank" class="cta-btn" style="display: inline-block; background-color: #0071e3; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 28px; border-radius: 980px; letter-spacing: -0.01em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif; box-sizing: border-box;">
                            Open Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 16px 0 0 0; font-size: 12px; color: #86868b; text-align: left; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      This is an electronically generated tax invoice. No physical signature required.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- APPLE FOOTER -->
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

  const subject = `Tax Invoice & Subscription Confirmation: #${refCode} — MyMobPay`;
  const text = `Tax Invoice #${refCode}\nBilled To: ${businessName} (${to})\nPlan: ${planName} (Amount: ₹${amount})\nValid Until: ${expiryFormatted}\nPayment: ${paymentMethod} (${utr || 'NPCI Verified'})\n\nAccess dashboard: https://mymobpay.tech/dashboard`;

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
      <tr style="border-bottom: 1px solid #f2f2f7;">
        <td style="padding: 10px 0; font-size: 13px; color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
          <div style="font-weight: 500;">${refStr}</div>
          <div style="font-size: 11px; color: #86868b; font-family: ui-monospace, Menlo, monospace;">${dt}${utrStr !== '—' ? ` &bull; ${utrStr}` : ''}</div>
        </td>
        <td align="right" style="padding: 10px 0; font-size: 13px; font-weight: 500; color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, ui-monospace, Menlo, monospace;">
          ₹${amountStr}
        </td>
        <td align="right" style="padding: 10px 0; font-size: 12px; color: ${isSuccess ? '#1d1d1f' : '#86868b'}; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
          ${isSuccess ? 'Settled' : (order.status || 'Pending')}
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
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1d1d1f; }
    @media only screen and (max-width: 480px) {
      .outer-cell { padding: 24px 12px 32px 12px !important; }
      .card-pad { padding: 28px 20px !important; }
      .kpi-col { display: block !important; width: 100% !important; padding: 0 0 10px 0 !important; box-sizing: border-box !important; }
      .cta-btn { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f5f5f7; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Monthly statement for ${businessName} (${monthYear}). Settled volume: ₹${formattedVolume}.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 560px; margin: 0 auto;">
          
          <!-- APPLE BRAND HEADER -->
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
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e5e5ea; border-radius: 18px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
                <tr>
                  <td class="card-pad" style="padding: 36px 32px;">
                    <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 600; color: #1d1d1f; line-height: 1.25; letter-spacing: -0.02em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                      Statement &bull; ${monthYear || 'Summary'}
                    </h1>

                    <!-- APPLE HERO AMOUNT -->
                    <div style="margin: 20px 0 28px 0; text-align: left;">
                      <div style="font-size: 12px; font-weight: 500; color: #86868b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Settled Volume</div>
                      <div style="font-size: 38px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.03em; line-height: 1.1; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                        ₹${formattedVolume}
                      </div>
                      <div style="font-size: 13px; color: #86868b; margin-top: 6px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                        Reconciled settlements for ${businessName} &bull; 0% Fee
                      </div>
                    </div>

                    <!-- APPLE 2x2 METRICS GRID -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px;">
                      <tr>
                        <td width="50%" class="kpi-col" style="padding-right: 8px; padding-bottom: 12px; vertical-align: top;">
                          <div style="background-color: #f5f5f7; border-radius: 12px; padding: 14px 16px;">
                            <div style="font-size: 11px; font-weight: 500; color: #86868b; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Total Orders</div>
                            <div style="font-size: 20px; font-weight: 600; color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', Arial, sans-serif; margin-top: 4px;">${transactionCount}</div>
                            <div style="font-size: 11px; color: #86868b; margin-top: 2px;">${successfulCount} Settled &bull; ${failedCount} Failed</div>
                          </div>
                        </td>
                        <td width="50%" class="kpi-col" style="padding-left: 8px; padding-bottom: 12px; vertical-align: top;">
                          <div style="background-color: #f5f5f7; border-radius: 12px; padding: 14px 16px;">
                            <div style="font-size: 11px; font-weight: 500; color: #86868b; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Success Rate</div>
                            <div style="font-size: 20px; font-weight: 600; color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', Arial, sans-serif; margin-top: 4px;">${successRate}%</div>
                            <div style="font-size: 11px; color: #86868b; margin-top: 2px;">Automated Bank UTR</div>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" class="kpi-col" style="padding-right: 8px; vertical-align: top;">
                          <div style="background-color: #f5f5f7; border-radius: 12px; padding: 14px 16px;">
                            <div style="font-size: 11px; font-weight: 500; color: #86868b; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Commission Paid</div>
                            <div style="font-size: 20px; font-weight: 600; color: #1d1d1f; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', Arial, sans-serif; margin-top: 4px;">₹0.00</div>
                            <div style="font-size: 11px; color: #86868b; margin-top: 2px;">0% MDR (Direct to bank)</div>
                          </div>
                        </td>
                        <td width="50%" class="kpi-col" style="padding-left: 8px; vertical-align: top;">
                          <div style="background-color: #f5f5f7; border-radius: 12px; padding: 14px 16px;">
                            <div style="font-size: 11px; font-weight: 500; color: #86868b; text-transform: uppercase; letter-spacing: 0.05em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Settlement VPA</div>
                            <div style="font-size: 14px; font-weight: 600; color: #1d1d1f; font-family: ui-monospace, Menlo, monospace; margin-top: 6px; truncate;">${settlementVpa || 'Bank Account'}</div>
                            <div style="font-size: 11px; color: #86868b; margin-top: 2px;">Real-time Pass-Through</div>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- RECENT TRANSACTIONS TABLE (APPLE STYLE) -->
                    <div style="font-size: 12px; font-weight: 600; color: #86868b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      Recent Transactions (${recentOrders.length > 0 ? recentOrders.length : '0'})
                    </div>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 24px; border-top: 1px solid #e5e5ea; border-bottom: 1px solid #e5e5ea;">
                      ${orderRowsHtml || `
                        <tr>
                          <td colspan="3" align="center" style="padding: 16px 0; color: #86868b; font-size: 13px;">
                            No processed transactions for this statement period.
                          </td>
                        </tr>
                      `}
                    </table>

                    <!-- APPLE PILL CTA BUTTON -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 28px 0 8px 0;">
                      <tr>
                        <td align="left">
                          <a href="https://mymobpay.tech/dashboard" target="_blank" class="cta-btn" style="display: inline-block; background-color: #0071e3; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 28px; border-radius: 980px; letter-spacing: -0.01em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif; box-sizing: border-box;">
                            Open Full Ledger
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
  const text = `Monthly Statement for ${businessName} (${mid})\nPeriod: ${statementPeriod || monthYear}\nGross Volume: ₹${parseFloat(totalVolume || 0).toLocaleString('en-IN')}\nOrders: ${transactionCount} (Settled: ${successfulCount}, Failed: ${failedCount})\nGateway Fee: ₹0.00\n\nOpen ledger: https://mymobpay.tech/dashboard`;

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
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1d1d1f; }
    @media only screen and (max-width: 480px) {
      .outer-cell { padding: 20px 12px !important; }
      .card-pad { padding: 24px 20px !important; }
      .cta-btn { width: 100% !important; display: block !important; box-sizing: border-box !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; -webkit-font-smoothing: antialiased;">
  <div style="display: none; font-size: 1px; color: #f5f5f7; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    Complete your onboarding on MyMobPay and activate 0% fee direct bank settlements.
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
              <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #ffffff; border: 1px solid #e5e5ea; border-radius: 18px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);">
                <tr>
                  <td class="card-pad" style="padding: 32px 28px;">
                    <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.02em; line-height: 1.25;">
                      Complete your onboarding
                    </h1>
                    <p style="margin: 0 0 22px 0; font-size: 14px; color: #424245; line-height: 1.5;">
                      Hi ${recipientName}, activate zero-fee direct bank and UPI settlements on your account.
                    </p>

                    <!-- CHECKLIST BOX -->
                    <div style="background-color: #f5f5f7; border-radius: 12px; padding: 16px 18px; margin-bottom: 24px;">
                      <div style="font-size: 12px; font-weight: 600; color: #1d1d1f; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px;">Please reply with:</div>
                      <div style="font-size: 13px; line-height: 1.6; color: #424245;">
                        1. Your active WhatsApp or phone number<br/>
                        2. Preferred time for a quick call or message
                      </div>
                    </div>

                    <!-- APPLE PILL CTA -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin-bottom: 16px;">
                      <tr>
                        <td align="center">
                          <a href="mailto:support@mymobpay.tech?subject=Contact%20Number%20for%20Onboarding%20-${encodeURIComponent(recipientName)}" class="cta-btn" style="display: inline-block; background-color: #0071e3; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 32px; border-radius: 980px; text-align: center;">
                            Reply with Contact Details
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #86868b; text-align: center;">
                      Our team will verify your settlement UPI and help you launch.
                    </p>
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
</html>`;

  const subject = `Complete your MyMobPay merchant registration - Contact details required`;
  const text = `Hi ${recipientName},\n\nThank you for signing up on MyMobPay (mymobpay.tech)!\n\nWe noticed you recently registered your account with us. To help you finalize your onboarding and activate 0% fee direct bank & UPI settlements on your account, our onboarding team would like to assist you directly.\n\nPlease reply to this email with:\n1. Your active Mobile / WhatsApp Contact Number\n2. A preferred time for a quick call or WhatsApp message\n\nOnce we have your contact details, our team will get in touch to verify your UPI VPA and ensure your merchant portal is active.\n\nWarm regards,\nMyMobPay Merchant Onboarding Team\nhttps://mymobpay.tech`;

  // Brevo SMTP is primary for transactional delivery
  const transporter = getBrevoTransporter() || getTransporter();
  if (transporter) {
    const info = await transporter.sendMail({
      from: '"MyMobPay Onboarding" <noreply@mymobpay.tech>',
      to,
      replyTo: 'chauhankunal695@gmail.com, support@mymobpay.tech',
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

/**
 * ─────────────────────────────────────────────────────────────
 * Instant Merchant Notification Email for Payment Link Inflows
 * ─────────────────────────────────────────────────────────────
 */
export async function sendPaymentLinkMerchantNotificationEmail({
  to,
  businessName = 'Merchant Partner',
  customerName = 'Valued Customer',
  customerPhone = '',
  customerEmail = '',
  amount = '0.00',
  orderId = '',
  utr = '',
  linkTitle = 'Payment Link',
  merchantUpi = '',
  paidAt = null,
} = {}) {
  if (!to || !to.includes('@')) {
    return { success: false, error: 'Valid merchant email is required' };
  }

  const istDateStr = new Date(paidAt || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const formattedAmount = typeof amount === 'number' ? amount.toFixed(2) : amount;
  const cleanUtr = utr && utr !== 'N/A' ? utr : 'Pending reconciliation';
  const cleanOrderId = orderId || 'MMP-ORD';

  const currentYear = new Date().getFullYear();

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Payment Received: ₹${formattedAmount}</title>
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
    ₹${formattedAmount} received on "${linkTitle}" from ${customerName}. UTR: ${cleanUtr}.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 560px; margin: 0 auto;">
          
          <!-- APPLE BRAND HEADER -->
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
                      Inflow &bull; 0% Fee
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
                  <td class="card-pad" style="padding: 36px 32px;">
                    
                    <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 600; color: #1d1d1f; line-height: 1.25; letter-spacing: -0.02em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                      Payment Received
                    </h1>

                    <!-- APPLE HERO AMOUNT -->
                    <div style="margin: 20px 0 28px 0; text-align: left;">
                      <div style="font-size: 12px; font-weight: 500; color: #86868b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Total Amount</div>
                      <div style="font-size: 38px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.03em; line-height: 1.1; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                        ₹${formattedAmount}
                      </div>
                      <div style="font-size: 13px; color: #86868b; margin-top: 6px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                        Settled to <span style="color: #1d1d1f; font-weight: 500; font-family: ui-monospace, Menlo, monospace;">${merchantUpi || 'Your Bank Account'}</span> &bull; 0% Fee
                      </div>
                    </div>

                    <!-- APPLE RECEIPT SPEC TABLE -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 24px 0; border-top: 1px solid #e5e5ea; border-bottom: 1px solid #e5e5ea;">
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Payment Link</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${linkTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Customer</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${customerName}</td>
                      </tr>
                      ${customerPhone ? `<tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Customer Phone</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">+91 ${customerPhone}</td>
                      </tr>` : ''}
                      ${customerEmail ? `<tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Customer Email</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #0071e3; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${customerEmail}</td>
                      </tr>` : ''}
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Bank Ref (UTR)</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 600; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: ui-monospace, Menlo, monospace;">${cleanUtr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Order ID</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: ui-monospace, Menlo, monospace;">${cleanOrderId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Date &amp; Time (IST)</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${istDateStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Gateway Fee</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 600; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">₹0.00 (Zero MDR)</td>
                      </tr>
                    </table>

                    <!-- APPLE PILL CTA BUTTON -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 28px 0 8px 0;">
                      <tr>
                        <td align="left">
                          <a href="https://mymobpay.tech/dashboard" target="_blank" class="cta-btn" style="display: inline-block; background-color: #0071e3; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 12px 28px; border-radius: 980px; letter-spacing: -0.01em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif; box-sizing: border-box;">
                            View in Merchant Console
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

  const subject = `💰 Payment Received: ₹${formattedAmount} via "${linkTitle}"`;
  const text = `Payment Received: ₹${formattedAmount}\n\nLink: ${linkTitle}\nCustomer: ${customerName}\nAmount: ₹${formattedAmount}\nUTR: ${cleanUtr}\nOrder ID: ${cleanOrderId}\nSettled to: ${merchantUpi || 'Bank Account'}\nTime: ${istDateStr}\nStatus: Verified (Zero MDR)\n\nView transaction details: https://mymobpay.tech/dashboard`;

  return sendRawEmail({
    to,
    subject,
    text,
    html,
    purpose: 'transaction',
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * Instant Customer Receipt Email for Payment Link Transactions
 * ─────────────────────────────────────────────────────────────
 */
export async function sendPaymentLinkCustomerReceiptEmail({
  to,
  customerName = 'Valued Customer',
  businessName = 'Merchant Partner',
  merchantPhone = '',
  amount = '0.00',
  orderId = '',
  utr = '',
  linkTitle = 'Payment',
  paidAt = null,
} = {}) {
  if (!to || !to.includes('@')) {
    return { success: false, error: 'Valid customer email is required' };
  }

  const istDateStr = new Date(paidAt || Date.now()).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const formattedAmount = typeof amount === 'number' ? amount.toFixed(2) : amount;
  const cleanUtr = utr && utr !== 'N/A' ? utr : 'Verified';
  const cleanOrderId = orderId || 'MMP-ORD';

  const currentYear = new Date().getFullYear();

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Payment Receipt: ₹${formattedAmount}</title>
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
    Receipt for ₹${formattedAmount} paid to ${businessName}. Reference: ${cleanUtr}.
  </div>

  <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #f5f5f7;">
    <tr>
      <td align="center" class="outer-cell" style="padding: 40px 16px 48px 16px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="max-width: 560px; margin: 0 auto;">
          
          <!-- APPLE BRAND HEADER -->
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
                      Receipt
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
                  <td class="card-pad" style="padding: 36px 32px;">
                    
                    <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 600; color: #1d1d1f; line-height: 1.25; letter-spacing: -0.02em; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                      Payment Receipt
                    </h1>

                    <!-- APPLE HERO AMOUNT -->
                    <div style="margin: 20px 0 28px 0; text-align: left;">
                      <div style="font-size: 12px; font-weight: 500; color: #86868b; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Total Paid</div>
                      <div style="font-size: 38px; font-weight: 600; color: #1d1d1f; letter-spacing: -0.03em; line-height: 1.1; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif;">
                        ₹${formattedAmount}
                      </div>
                      <div style="font-size: 13px; color: #86868b; margin-top: 6px; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                        Paid to <strong style="color: #1d1d1f; font-weight: 500;">${businessName}</strong>
                      </div>
                    </div>

                    <!-- APPLE RECEIPT SPEC TABLE -->
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" role="presentation" style="margin: 24px 0; border-top: 1px solid #e5e5ea; border-bottom: 1px solid #e5e5ea;">
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Merchant</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${businessName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Description</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${linkTitle}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Billed To</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${customerName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Bank Ref (UTR)</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 600; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: ui-monospace, Menlo, monospace;">${cleanUtr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Transaction ID</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: ui-monospace, Menlo, monospace;">${cleanOrderId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Date &amp; Time (IST)</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 500; text-align: right; border-bottom: 1px solid #f2f2f7; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">${istDateStr}</td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0; font-size: 13px; color: #86868b; font-weight: 400; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Status</td>
                        <td style="padding: 12px 0; font-size: 13px; color: #1d1d1f; font-weight: 600; text-align: right; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">Successful &bull; Direct Settlement</td>
                      </tr>
                    </table>

                    <!-- APPLE MERCHANT ASSISTANCE NOTE -->
                    <div style="margin: 24px 0 8px 0; padding: 18px 20px; background-color: #f5f5f7; border-radius: 12px; font-size: 13px; color: #6e6e73; line-height: 1.5; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      <strong style="color: #1d1d1f; font-weight: 500;">Need assistance?</strong> If you have questions regarding this payment or your purchase, please contact <strong>${businessName}</strong>${merchantPhone ? ` at +91 ${merchantPhone}` : ''}.
                    </div>

                    <p style="margin: 20px 0 0 0; font-size: 12px; text-align: center; color: #86868b; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                      This is an electronically generated receipt for your records.
                    </p>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- APPLE FOOTER -->
          <tr>
            <td align="center" style="padding-top: 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; line-height: 1.6; color: #86868b; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', Arial, sans-serif;">
                MyMobPay &bull; Secure UPI Rails &bull; <a href="https://mymobpay.tech" style="color: #0071e3; text-decoration: none;">mymobpay.tech</a>
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

  const subject = `Payment Receipt: ₹${formattedAmount} paid to ${businessName}`;
  const text = `Payment Receipt\n\nMerchant: ${businessName}\nItem: ${linkTitle}\nAmount: ₹${formattedAmount}\nStatus: Successful\nBank Reference (UTR): ${cleanUtr}\nTransaction ID: ${cleanOrderId}\nDate: ${istDateStr}\n\nThank you for your payment.\nPowered by MyMobPay (https://mymobpay.tech)`;

  return sendRawEmail({
    to,
    subject,
    text,
    html,
    purpose: 'receipt',
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * Central Payment Link Transaction Email Orchestrator
 * Fires:
 *  1. Merchant credit alert email (to merchant's auth email)
 *  2. Customer receipt email (to customer if email provided)
 * ─────────────────────────────────────────────────────────────
 */
const paymentLinkEmailDedupCache = new Map();
const PAYMENT_LINK_EMAIL_COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

export async function sendPaymentLinkTransactionEmails({
  link,
  orderId = '',
  utr = '',
  paidAt = null,
  customerEmail = '',
  customerName = '',
  customerPhone = '',
} = {}) {
  try {
    if (!link) {
      console.warn('[PaymentLink Mailer] No link passed to sendPaymentLinkTransactionEmails.');
      return { success: false, error: 'No link provided' };
    }

    const linkToken = link.token || link.id || 'unknown';
    const effectiveOrderId = orderId || link.order_id || 'unknown';
    const dedupKey = `${linkToken}_${effectiveOrderId}`;
    const now = Date.now();

    if (paymentLinkEmailDedupCache.has(dedupKey)) {
      const lastSent = paymentLinkEmailDedupCache.get(dedupKey);
      if (now - lastSent < PAYMENT_LINK_EMAIL_COOLDOWN_MS) {
        console.log(`[PaymentLink Mailer] Duplicate email suppressed for link ${linkToken} (${Math.round((now - lastSent) / 1000)}s ago).`);
        return { success: true, deduplicated: true };
      }
    }
    paymentLinkEmailDedupCache.set(dedupKey, now);

    // Housekeep deduplication cache
    if (paymentLinkEmailDedupCache.size > 200) {
      for (const [k, ts] of paymentLinkEmailDedupCache.entries()) {
        if (now - ts > PAYMENT_LINK_EMAIL_COOLDOWN_MS * 2) {
          paymentLinkEmailDedupCache.delete(k);
        }
      }
    }

    // 1. Fetch matching order if available
    let order = null;
    const lookupOrderId = effectiveOrderId !== 'unknown' ? effectiveOrderId : null;
    if (lookupOrderId) {
      try {
        const { data: ord } = await supabaseAdmin
          .from('orders')
          .select('id, amount, customer_name, customer_email, customer_phone, utr, created_at, verified_at, note')
          .eq('id', lookupOrderId)
          .maybeSingle();
        if (ord) order = ord;
      } catch (ordErr) {
        console.warn('[PaymentLink Mailer] Order fetch error:', ordErr.message);
      }
    }

    // 2. Fetch merchant profile & merchant auth user email
    let merchant = null;
    let merchantEmail = null;
    if (link.merchant_id) {
      try {
        const [merchRes, authUserRes] = await Promise.all([
          supabaseAdmin
            .from('merchants')
            .select('business_name, upi_id, phone_number, owner_name')
            .eq('id', link.merchant_id)
            .maybeSingle(),
          supabaseAdmin.auth.admin.getUserById(link.merchant_id).catch(() => null)
        ]);

        merchant = merchRes?.data || null;
        merchantEmail = authUserRes?.data?.user?.email || null;
      } catch (merchErr) {
        console.warn('[PaymentLink Mailer] Merchant fetch error:', merchErr.message);
      }
    }

    // 3. Resolve unified values
    let rawAmount = 0;
    if (order?.amount != null) {
      rawAmount = parseFloat(order.amount);
    } else if (link.amount) {
      const num = Number(link.amount);
      // If amount was stored in paise (e.g. >= 100 for standard pricing or link creation paise)
      rawAmount = num >= 100 ? num / 100 : num;
    }
    const formattedAmount = (rawAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const finalUtr = utr || order?.utr || link?.metadata?.paid_utr || 'Direct UPI Settlement';
    const finalOrderId = lookupOrderId || link.order_id || linkToken.slice(0, 16);
    const finalPaidAt = paidAt || order?.verified_at || link?.paid_at || new Date().toISOString();
    const linkTitle = link.title || order?.note || 'Payment Link';
    const businessName = merchant?.business_name || 'MyMobPay Merchant';
    const merchantUpi = merchant?.upi_id || '';
    const merchantPhone = merchant?.phone_number || '';

    const finalCustName = customerName || order?.customer_name || link?.customer_name || 'Customer';
    const finalCustPhone = customerPhone || order?.customer_phone || link?.customer_phone || '';
    const finalCustEmail = (customerEmail || order?.customer_email || link?.metadata?.customer_email || '').trim().toLowerCase();

    const dispatchPromises = [];

    // 4. Send Merchant notification email
    if (merchantEmail && merchantEmail.includes('@')) {
      dispatchPromises.push(
        sendPaymentLinkMerchantNotificationEmail({
          to: merchantEmail,
          businessName,
          customerName: finalCustName,
          customerPhone: finalCustPhone,
          customerEmail: finalCustEmail,
          amount: formattedAmount,
          orderId: finalOrderId,
          utr: finalUtr,
          linkTitle,
          merchantUpi,
          paidAt: finalPaidAt,
        }).then(res => {
          console.log(`[PaymentLink Mailer] Merchant credit alert delivered to ${merchantEmail} for order ${finalOrderId}`);
          return { recipient: 'merchant', email: merchantEmail, success: true, res };
        }).catch(err => {
          console.error(`[PaymentLink Mailer ERROR] Merchant credit alert failed for ${merchantEmail}:`, err.message);
          return { recipient: 'merchant', email: merchantEmail, success: false, error: err.message };
        })
      );
    } else {
      console.log(`[PaymentLink Mailer] No merchant email found for merchant_id ${link.merchant_id}.`);
    }

    // 5. Send Customer receipt email
    if (finalCustEmail && finalCustEmail.includes('@')) {
      dispatchPromises.push(
        sendPaymentLinkCustomerReceiptEmail({
          to: finalCustEmail,
          customerName: finalCustName,
          businessName,
          merchantPhone,
          amount: formattedAmount,
          orderId: finalOrderId,
          utr: finalUtr,
          linkTitle,
          paidAt: finalPaidAt,
        }).then(res => {
          console.log(`[PaymentLink Mailer] Customer receipt delivered to ${finalCustEmail} for order ${finalOrderId}`);
          return { recipient: 'customer', email: finalCustEmail, success: true, res };
        }).catch(err => {
          console.error(`[PaymentLink Mailer ERROR] Customer receipt failed for ${finalCustEmail}:`, err.message);
          return { recipient: 'customer', email: finalCustEmail, success: false, error: err.message };
        })
      );
    }

    const results = await Promise.all(dispatchPromises);
    return {
      success: true,
      orderId: finalOrderId,
      dispatched: results
    };
  } catch (err) {
    console.error('[PaymentLink Mailer FATAL]:', err);
    return { success: false, error: err.message };
  }
}




