import crypto from 'crypto';
import { supabaseAdmin } from './supabase.js';

const BACKOFF_SCHEDULE_MS = [
  1 * 60 * 1000,       // Retry 1: 1 minute
  5 * 60 * 1000,       // Retry 2: 5 minutes
  30 * 60 * 1000,      // Retry 3: 30 minutes
  2 * 60 * 60 * 1000,  // Retry 4: 2 hours
];

/**
 * SSRF Guard: Validates that an outbound webhook URL does NOT resolve to
 * private, loopback, link-local, cloud metadata, or reserved networks.
 * Protects against Server-Side Request Forgery (SSRF) attacks.
 *
 * @param {string} urlStr
 * @returns {boolean}
 */
export function isSafeWebhookUrl(urlStr) {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr);
    
    // 1. Only HTTP and HTTPS protocols are permitted
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }

    // In production, enforce HTTPS strictly
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // 2. Reject localhost, local names, internal domains
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1'
    ) {
      return false;
    }

    // 3. Reject IPv4 Private, Loopback, Link-Local, and Cloud Metadata ranges:
    // 127.0.0.0/8 (Loopback)
    // 10.0.0.0/8 (RFC 1918 Private)
    // 172.16.0.0/12 (RFC 1918 Private)
    // 192.168.0.0/16 (RFC 1918 Private)
    // 169.254.0.0/16 (AWS / GCP / Azure Cloud Metadata Service: 169.254.169.254)
    // 100.64.0.0/10 (Carrier-Grade NAT)
    const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipv4Match) {
      const o1 = parseInt(ipv4Match[1], 10);
      const o2 = parseInt(ipv4Match[2], 10);

      if (o1 === 0 || o1 === 127) return false;
      if (o1 === 10) return false;
      if (o1 === 172 && o2 >= 16 && o2 <= 31) return false;
      if (o1 === 192 && o2 === 168) return false;
      if (o1 === 169 && o2 === 254) return false;
      if (o1 === 100 && o2 >= 64 && o2 <= 127) return false;
    }

    // 4. Reject IPv6 private / loopback / link-local addresses
    if (hostname.includes(':') || hostname.startsWith('[')) {
      if (
        hostname.includes('::1') ||
        hostname.startsWith('fc') ||
        hostname.startsWith('fd') ||
        hostname.startsWith('fe80')
      ) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Triggers an outbound webhook POST request to the merchant's endpoint
 * when a payment is verified. Sign the payload using their API key as HMAC secret.
 * 
 * @param {string} orderId The ID of the verified order.
 * @returns {Promise<{ success: boolean, message: string }>} Result of the webhook call.
 */
export async function triggerMerchantWebhook(orderId) {
  if (!orderId) {
    return { success: false, message: 'Missing Order ID' };
  }

  try {
    // 1. Fetch order details
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error(`[Webhook Dispatch] Order ${orderId} not found:`, orderError);
      return { success: false, message: 'Order not found' };
    }

    // 2. Fetch merchant details
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('webhook_url, api_key')
      .eq('id', order.merchant_id)
      .single();

    if (merchantError || !merchant) {
      console.error(`[Webhook Dispatch] Merchant profile not found for order ${orderId}:`, merchantError);
      return { success: false, message: 'Merchant not found' };
    }

    const webhookUrl = merchant.webhook_url;
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      // Quiet return if no webhook url is configured
      return { success: true, message: 'No webhook URL configured for merchant' };
    }

    // SSRF Validation: Block internal/private endpoints
    if (!isSafeWebhookUrl(webhookUrl)) {
      console.warn(`[SSRF Block] Forbidden internal or metadata webhook URL: ${webhookUrl} for merchant ${merchant.id}`);
      return { success: false, message: 'Webhook URL blocked: private or internal network addresses are forbidden' };
    }

    // 3. Formulate standard webhook payload
    const payload = {
      event: 'payment.verified',
      order_id: order.id,
      amount: parseFloat(order.amount),
      utr: order.utr || 'AUTO_VERIFIED',
      status: order.status,
      customer_name: order.customer_name || '',
      customer_phone: order.customer_phone || '',
      external_ref: order.external_ref || '',
      note: order.note || '',
      verified_at: order.verified_at,
      created_at: order.created_at
    };

    const payloadString = JSON.stringify(payload);

    // 4. Compute SHA-256 HMAC signature using merchant's api_key
    const signature = crypto
      .createHmac('sha256', merchant.api_key)
      .update(payloadString)
      .digest('hex');

    console.log(`[Webhook Dispatch] Firing webhook for Order ${order.id} to ${webhookUrl}...`);

    // 5. Fire webhook request with a 6-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      redirect: 'manual', // Never follow redirects past the SSRF URL guard.
      headers: {
        'Content-Type': 'application/json',
        'X-MyMobPay-Signature': signature,
        'X-MyMobPay-Event': 'payment.verified',
        'User-Agent': 'MyMobPay-Webhook-Dispatcher/2.0'
      },
      body: payloadString,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Endpoint returned status ${response.status}: ${errorText.slice(0, 100)}`);
    }

    console.log(`[Webhook Dispatch] Webhook successfully delivered to ${webhookUrl} for Order ${order.id}`);
    return { success: true, message: 'Webhook successfully delivered' };

  } catch (err) {
    console.error(`[Webhook Dispatch Error] Failed to deliver webhook for Order ${orderId}:`, err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Triggers an outbound webhook POST request for Payment Link events
 * (e.g., 'payment_link.expired', 'payment_link.paid', 'payment_link.cancelled')
 * Signs payload with HMAC-SHA256 and handles retries with exponential backoff.
 * 
 * @param {string} linkId UUID of the payment link
 * @param {string} event Event name (default: 'payment_link.expired')
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function triggerPaymentLinkWebhook(linkId, event = 'payment_link.expired') {
  if (!linkId) {
    return { success: false, message: 'Missing Payment Link ID' };
  }

  try {
    // 1. Fetch link details
    const { data: link, error: linkErr } = await supabaseAdmin
      .from('payment_links')
      .select('*')
      .eq('id', linkId)
      .single();

    if (linkErr || !link) {
      console.error(`[Link Webhook] Link ${linkId} not found:`, linkErr);
      return { success: false, message: 'Payment link not found' };
    }

    // 2. Fetch merchant details
    const { data: merchant, error: merchantErr } = await supabaseAdmin
      .from('merchants')
      .select('id, webhook_url, api_key')
      .eq('id', link.merchant_id)
      .single();

    if (merchantErr || !merchant) {
      console.error(`[Link Webhook] Merchant ${link.merchant_id} not found:`, merchantErr);
      return { success: false, message: 'Merchant not found' };
    }

    const webhookUrl = merchant.webhook_url;
    if (!webhookUrl || !webhookUrl.startsWith('http')) {
      return { success: true, message: 'No webhook URL configured for merchant' };
    }

    // SSRF Validation: Block internal/private endpoints
    if (!isSafeWebhookUrl(webhookUrl)) {
      console.warn(`[SSRF Block] Forbidden internal or metadata webhook URL: ${webhookUrl} for merchant ${merchant.id}`);
      return { success: false, message: 'Webhook URL blocked: private or internal network addresses are forbidden' };
    }

    // 3. Construct event payload
    const payload = {
      event,
      event_id: `evt_${crypto.randomBytes(12).toString('hex')}`,
      timestamp: new Date().toISOString(),
      data: {
        token: link.token,
        link_type: link.link_type,
        amount: Number(link.amount),
        amount_in_rupees: (Number(link.amount) / 100).toFixed(2),
        currency: link.currency || 'INR',
        title: link.title || '',
        status: link.status,
        expires_at: link.expires_at,
        expired_at: link.expired_at,
        paid_at: link.paid_at,
        cancelled_at: link.cancelled_at,
        customer_name: link.customer_name || '',
        customer_phone: link.customer_phone || '',
        metadata: link.metadata || {}
      }
    };

    const payloadString = JSON.stringify(payload);

    // 4. Compute HMAC-SHA256 signature
    const signature = crypto
      .createHmac('sha256', merchant.api_key)
      .update(payloadString)
      .digest('hex');

    // 5. Create or find initial log entry in webhook_logs
    let logRecord = null;
    try {
      const { data: createdLog } = await supabaseAdmin
        .from('webhook_logs')
        .insert([
          {
            merchant_id: merchant.id,
            link_id: link.id,
            event,
            target_url: webhookUrl,
            payload,
            status: 'pending',
            attempts: 0,
            max_attempts: 4,
            next_retry_at: new Date().toISOString()
          }
        ])
        .select('*')
        .single();
      logRecord = createdLog;
    } catch (dbErr) {
      // Non-fatal if webhook_logs table is unavailable
      console.warn('[Link Webhook] Could not write to webhook_logs:', dbErr.message);
    }

    // 6. Attempt immediate delivery
    return await executeWebhookAttempt(logRecord?.id, webhookUrl, payloadString, signature, event, 0);

  } catch (err) {
    console.error(`[Link Webhook Error] Dispatch failed for link ${linkId}:`, err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Execute a single HTTP delivery attempt for a webhook
 */
async function executeWebhookAttempt(logId, targetUrl, payloadString, signature, event, currentAttempts) {
  if (!isSafeWebhookUrl(targetUrl)) {
    console.warn(`[SSRF Block] Blocked retry attempt to invalid/private URL: ${targetUrl}`);
    return { success: false, message: 'SSRF blocked: forbidden destination' };
  }

  const attemptIndex = currentAttempts + 1;
  let responseCode = null;
  let errorMessage = null;
  let isDelivered = false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(targetUrl, {
      method: 'POST',
      redirect: 'manual', // Never follow redirects past the SSRF URL guard.
      headers: {
        'Content-Type': 'application/json',
        'X-MyMobPay-Signature': signature,
        'X-MyMobPay-Event': event,
        'User-Agent': 'MyMobPay-Webhook-Dispatcher/2.0'
      },
      body: payloadString,
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    responseCode = response.status;

    if (response.ok) {
      isDelivered = true;
      console.log(`[Webhook Dispatch Success] Event '${event}' delivered to ${targetUrl} (HTTP ${responseCode})`);
    } else {
      const errText = await response.text().catch(() => '');
      errorMessage = `Server returned HTTP ${responseCode}: ${errText.slice(0, 150)}`;
      console.warn(`[Webhook Delivery Failed] ${targetUrl} returned HTTP ${responseCode}`);
    }
  } catch (fetchErr) {
    errorMessage = fetchErr.message;
    console.warn(`[Webhook Connection Error] ${targetUrl}: ${fetchErr.message}`);
  }

  // Update webhook log attempt if logId is present
  if (logId) {
    try {
      const hasRetriesLeft = attemptIndex < 4;
      const nextDelay = BACKOFF_SCHEDULE_MS[currentAttempts] || (2 * 60 * 60 * 1000);
      const nextRetryAt = isDelivered ? null : (hasRetriesLeft ? new Date(Date.now() + nextDelay).toISOString() : null);
      const finalStatus = isDelivered ? 'delivered' : (hasRetriesLeft ? 'pending' : 'failed');

      await supabaseAdmin
        .from('webhook_logs')
        .update({
          status: finalStatus,
          attempts: attemptIndex,
          last_response_code: responseCode,
          last_error: errorMessage,
          next_retry_at: nextRetryAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', logId);
    } catch (logUpdateErr) {
      console.warn('[Webhook Log Update Error]:', logUpdateErr.message);
    }
  }

  return {
    success: isDelivered,
    message: isDelivered ? 'Webhook delivered' : (errorMessage || 'Delivery failed')
  };
}

/**
 * Process any pending webhooks due for retry using exponential backoff schedule
 * (Called once per minute by the background cron)
 */
export async function processPendingWebhookRetries() {
  const nowIso = new Date().toISOString();
  let retryCount = 0;

  try {
    const { data: pendingLogs, error } = await supabaseAdmin
      .from('webhook_logs')
      .select('*, merchants(api_key)')
      .eq('status', 'pending')
      .lte('next_retry_at', nowIso)
      .limit(50);

    if (error || !pendingLogs || pendingLogs.length === 0) {
      return { retried: 0 };
    }

    for (const log of pendingLogs) {
      const apiKey = log.merchants?.api_key;
      if (!apiKey || !log.target_url) {
        await supabaseAdmin
          .from('webhook_logs')
          .update({ status: 'failed', last_error: 'Missing merchant API key or URL' })
          .eq('id', log.id);
        continue;
      }

      const payloadString = JSON.stringify(log.payload);
      const signature = crypto
        .createHmac('sha256', apiKey)
        .update(payloadString)
        .digest('hex');

      await executeWebhookAttempt(
        log.id,
        log.target_url,
        payloadString,
        signature,
        log.event,
        log.attempts || 0
      );
      retryCount++;
    }

    return { retried: retryCount };
  } catch (err) {
    console.error('[Webhook Retry Processor Error]:', err.message);
    return { retried: retryCount, error: err.message };
  }
}
