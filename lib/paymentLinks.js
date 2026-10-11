import crypto from 'crypto';
import { supabaseAdmin } from './supabase.js';
import { triggerPaymentLinkWebhook } from './webhook.js';

export const EXPIRY_LIMITS = {
  MIN_MINUTES: 5,
  MAX_MINUTES: 30 * 24 * 60, // 30 days = 43,200 minutes
  DEFAULTS: {
    shared: 24 * 60, // 24 hours
    checkout: 15,    // 15 minutes
  },
  PRESETS: {
    '15m': 15,
    '1h': 60,
    '24h': 24 * 60,
    '7d': 7 * 24 * 60,
  }
};

/**
 * Generate a cryptographically secure random token (at least 24 bytes hex = 48 hex chars)
 * @param {number} bytes Number of random bytes (min 24)
 * @returns {string} Unguessable hex string
 */
export function generateSecureToken(bytes = 24) {
  const byteLength = Math.max(24, bytes);
  return crypto.randomBytes(byteLength).toString('hex');
}

/**
 * Validate and calculate expiry duration in minutes
 * @param {number|string} expireIn Duration in minutes or preset string ('15m', '1h', etc.)
 * @param {'shared'|'checkout'} linkType Type of payment link
 * @returns {{ valid: boolean, minutes: number, error?: string }}
 */
export function validateAndComputeExpiryMinutes(expireIn, linkType = 'shared') {
  let minutes;

  if (expireIn === undefined || expireIn === null || expireIn === '') {
    minutes = EXPIRY_LIMITS.DEFAULTS[linkType] || EXPIRY_LIMITS.DEFAULTS.shared;
  } else if (typeof expireIn === 'string' && EXPIRY_LIMITS.PRESETS[expireIn.toLowerCase()]) {
    minutes = EXPIRY_LIMITS.PRESETS[expireIn.toLowerCase()];
  } else {
    minutes = Number(expireIn);
  }

  if (isNaN(minutes) || !Number.isFinite(minutes)) {
    return {
      valid: false,
      minutes: 0,
      error: `Invalid expiry value. Must be a number between ${EXPIRY_LIMITS.MIN_MINUTES} and ${EXPIRY_LIMITS.MAX_MINUTES} minutes, or a preset ('15m', '1h', '24h', '7d').`
    };
  }

  minutes = Math.round(minutes);

  if (minutes < EXPIRY_LIMITS.MIN_MINUTES) {
    return {
      valid: false,
      minutes,
      error: `Expiry duration too short. Minimum allowed is ${EXPIRY_LIMITS.MIN_MINUTES} minutes.`
    };
  }

  if (minutes > EXPIRY_LIMITS.MAX_MINUTES) {
    return {
      valid: false,
      minutes,
      error: `Expiry duration too long. Maximum allowed is 30 days (${EXPIRY_LIMITS.MAX_MINUTES} minutes).`
    };
  }

  return { valid: true, minutes };
}

/**
 * Calculate UTC ISO timestamp for expiry from minutes
 * @param {number} minutes
 * @returns {string} UTC ISO string
 */
export function computeExpiresAt(minutes) {
  const expiresDate = new Date(Date.now() + minutes * 60 * 1000);
  return expiresDate.toISOString();
}

/**
 * Convert any amount safely to paise (integer)
 * @param {number|string} amount Amount in Rupees or Paise
 * @param {boolean} isAlreadyPaise If true, treat as paise
 * @returns {number} Integer paise
 */
export function parseAmountToPaise(amount, isAlreadyPaise = false) {
  const num = Number(amount);
  if (isNaN(num) || num <= 0) return 0;
  if (isAlreadyPaise) return Math.round(num);
  return Math.round(num * 100);
}

/**
 * Format paise to INR display string
 * @param {number|string} paise
 * @returns {string} e.g. "150.00"
 */
export function paiseToRupees(paise) {
  const num = Number(paise);
  if (isNaN(num)) return '0.00';
  return (num / 100).toFixed(2);
}

/**
 * Central Expiry & Usability Check function.
 * ONE shared function used everywhere:
 * - Opening the link page
 * - Starting the payment
 * - Processing payment callback
 *
 * @param {object|null} link Payment link record from database
 * @returns {{
 *   usable: boolean,
 *   code: 'ACTIVE' | 'EXPIRED' | 'PAID' | 'CANCELLED' | 'PROCESSING' | 'NOT_FOUND',
 *   httpStatus: number,
 *   message: string,
 *   link: object|null
 * }}
 */
export function isLinkUsable(link) {
  if (!link || typeof link !== 'object') {
    return {
      usable: false,
      code: 'NOT_FOUND',
      httpStatus: 404,
      message: 'Payment link not found or invalid token.',
      link: null
    };
  }

  const now = Date.now();

  // 1. Check if paid
  if (link.status === 'paid') {
    const paidTimestamp = link.paid_at ? new Date(link.paid_at).getTime() : new Date(link.created_at).getTime();
    const ageSincePaidMs = now - paidTimestamp;
    const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

    // User Rule: If checked within 24 hours of payment success, show paid.
    // After 24 hours of payment success, acts as if it doesn't exist on public server.
    if (ageSincePaidMs > TWENTY_FOUR_HOURS_MS || link.is_archived) {
      return {
        usable: false,
        code: 'NOT_FOUND',
        httpStatus: 404,
        message: 'Payment link has closed and is no longer available.',
        link
      };
    }

    return {
      usable: false,
      code: 'PAID',
      httpStatus: 200,
      message: 'This payment link has already been paid.',
      link
    };
  }

  // 2. Check if cancelled
  if (link.status === 'cancelled') {
    return {
      usable: false,
      code: 'CANCELLED',
      httpStatus: 410,
      message: 'This payment link has been cancelled by the merchant.',
      link
    };
  }

  // 3. Check if currently in processing (protected from expiry while payment is in-flight)
  if (link.status === 'processing') {
    const processingStartedMs = link.processing_started_at ? new Date(link.processing_started_at).getTime() : 0;
    const processingAgeMs = now - processingStartedMs;
    const TEN_MINUTES_MS = 10 * 60 * 1000;

    // While processing is within the 10-minute active window, protect it from expiry
    if (processingAgeMs < TEN_MINUTES_MS) {
      return {
        usable: false,
        code: 'PROCESSING',
        httpStatus: 409,
        message: 'A payment is currently being processed for this link. Please check back shortly.',
        link
      };
    }

    // Stuck in processing for > 10 minutes: check if past expiry
    const expiresAtMs = link.expires_at ? new Date(link.expires_at).getTime() : 0;
    if (now >= expiresAtMs) {
      return {
        usable: false,
        code: 'EXPIRED',
        httpStatus: 410,
        message: 'Payment session timed out and link has expired.',
        link
      };
    }
  }

  // 4. Check expiry timestamp against Server UTC Time
  const expiresAtMs = link.expires_at ? new Date(link.expires_at).getTime() : 0;
  const isPastExpiry = now >= expiresAtMs;

  if (link.status === 'expired' || isPastExpiry) {
    return {
      usable: false,
      code: 'EXPIRED',
      httpStatus: 410,
      message: 'This payment link has expired.',
      link
    };
  }

  // 5. Must be active and within valid expiry window
  if (link.status === 'active' && !isPastExpiry) {
    return {
      usable: true,
      code: 'ACTIVE',
      httpStatus: 200,
      message: 'Payment link is active.',
      link
    };
  }

  return {
    usable: false,
    code: 'EXPIRED',
    httpStatus: 410,
    message: 'This payment link is not usable.',
    link
  };
}

/**
 * Atomically transitions an active payment link to 'processing'.
 * Only succeeds if the link is currently 'active' and not yet expired.
 * Prevents the background cron from expiring the link while payment is in progress.
 *
 * @param {string} token
 * @param {string} orderId
 * @returns {Promise<{ success: boolean, link?: object, error?: string }>}
 */
export async function transitionLinkToProcessing(token, orderId) {
  try {
    const nowIso = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('payment_links')
      .update({
        status: 'processing',
        processing_started_at: nowIso,
        order_id: orderId,
        updated_at: nowIso
      })
      .eq('token', token)
      .eq('status', 'active')
      .gt('expires_at', nowIso)
      .select('*')
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'Link is no longer active or has already expired/processing.'
      };
    }

    return { success: true, link: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Idempotently marks a payment link as paid.
 * Handles late bank confirmation (payment arrives after link expired):
 * Honors the payment, marks paid, flags metadata as paid_after_expiry.
 *
 * @param {string} token
 * @param {{ orderId?: string, utr?: string }} details
 * @returns {Promise<{ success: boolean, link?: object, alreadyPaid?: boolean, latePaid?: boolean, error?: string }>}
 */
export async function transitionLinkToPaid(token, { orderId, utr } = {}) {
  try {
    // 1. Fetch current link state
    const { data: link, error: fetchErr } = await supabaseAdmin
      .from('payment_links')
      .select('*')
      .eq('token', token)
      .single();

    if (fetchErr || !link) {
      return { success: false, error: 'Payment link not found.' };
    }

    // 2. Idempotency: If already paid, return immediately without duplicate side effects
    if (link.status === 'paid') {
      return { success: true, link, alreadyPaid: true };
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const isLate = link.status === 'expired' || (link.expires_at && now.getTime() > new Date(link.expires_at).getTime());

    const updatedMetadata = {
      ...(link.metadata || {}),
      paid_utr: utr || link.metadata?.paid_utr || null,
      paid_after_expiry: isLate,
      paid_via_order_id: orderId || link.order_id
    };

    // 3. Update payment link atomically to paid
    const { data: updatedLink, error: updateErr } = await supabaseAdmin
      .from('payment_links')
      .update({
        status: 'paid',
        paid_at: nowIso,
        order_id: orderId || link.order_id,
        metadata: updatedMetadata,
        updated_at: nowIso
      })
      .eq('id', link.id)
      .select('*')
      .single();

    if (updateErr || !updatedLink) {
      return { success: false, error: updateErr?.message || 'Failed to update link to paid.' };
    }

    return {
      success: true,
      link: updatedLink,
      alreadyPaid: false,
      latePaid: isLate
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Cancels an active payment link manually.
 * Strictly verifies that the merchant owns the link.
 *
 * @param {string} token
 * @param {string} merchantId
 * @returns {Promise<{ success: boolean, link?: object, error?: string }>}
 */
export async function transitionLinkToCancelled(token, merchantId) {
  try {
    const nowIso = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('payment_links')
      .update({
        status: 'cancelled',
        cancelled_at: nowIso,
        updated_at: nowIso
      })
      .eq('token', token)
      .eq('merchant_id', merchantId)
      .in('status', ['active', 'processing'])
      .select('*')
      .single();

    if (error || !data) {
      return {
        success: false,
        error: 'Link cannot be cancelled (either not found, not owned by merchant, or already paid/expired).'
      };
    }

    return { success: true, link: data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Regenerates an expired or cancelled payment link.
 * Creates a brand new link with a fresh token, keeping the old link dead.
 *
 * @param {string} token
 * @param {string} merchantId
 * @param {number|string} [newExpireIn]
 * @returns {Promise<{ success: boolean, newLink?: object, error?: string }>}
 */
export async function regeneratePaymentLink(token, merchantId, newExpireIn) {
  try {
    const { data: oldLink, error: fetchErr } = await supabaseAdmin
      .from('payment_links')
      .select('*')
      .eq('token', token)
      .eq('merchant_id', merchantId)
      .single();

    if (fetchErr || !oldLink) {
      return { success: false, error: 'Original payment link not found or access denied.' };
    }

    if (oldLink.status === 'paid') {
      return { success: false, error: 'Cannot regenerate a link that is already paid.' };
    }

    const { valid, minutes, error: valErr } = validateAndComputeExpiryMinutes(
      newExpireIn !== undefined ? newExpireIn : oldLink.metadata?.initial_expire_in,
      oldLink.link_type
    );

    if (!valid) {
      return { success: false, error: valErr };
    }

    const newToken = generateSecureToken(24);
    const expiresAt = computeExpiresAt(minutes);
    const nowIso = new Date().toISOString();

    const { data: newLink, error: insertErr } = await supabaseAdmin
      .from('payment_links')
      .insert([
        {
          merchant_id: merchantId,
          token: newToken,
          amount: oldLink.amount,
          currency: oldLink.currency || 'INR',
          title: oldLink.title,
          description: oldLink.description,
          status: 'active',
          link_type: oldLink.link_type,
          expires_at: expiresAt,
          customer_name: oldLink.customer_name,
          customer_phone: oldLink.customer_phone,
          redirect_url: oldLink.redirect_url,
          metadata: {
            regenerated_from: oldLink.token,
            initial_expire_in: minutes
          },
          created_at: nowIso,
          updated_at: nowIso
        }
      ])
      .select('*')
      .single();

    if (insertErr || !newLink) {
      return { success: false, error: insertErr?.message || 'Failed to create regenerated link.' };
    }

    return { success: true, newLink };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Background Batch Expiry Processor
 * Runs every minute to expire active links where expires_at < now.
 * Skips 'processing' links (unless stuck for > 10 min).
 * Safe batched update prevents duplicate execution across multiple server instances.
 * Triggers payment_link.expired webhooks for each newly expired link.
 *
 * @param {number} batchLimit
 * @returns {Promise<{ expiredCount: number, recoveredCount: number, errors: string[] }>}
 */
export async function processExpiredPaymentLinks(batchLimit = 100) {
  const nowIso = new Date().toISOString();
  const errors = [];
  let expiredCount = 0;
  let recoveredCount = 0;

  try {
    // 1. Recover processing links stuck for > 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: stuckLinks, error: stuckErr } = await supabaseAdmin
      .from('payment_links')
      .select('id, token, expires_at, order_id')
      .eq('status', 'processing')
      .lt('processing_started_at', tenMinutesAgo)
      .limit(batchLimit);

    if (!stuckErr && stuckLinks && stuckLinks.length > 0) {
      for (const stuck of stuckLinks) {
        // If an associated order exists and was completed, transition to paid
        let isOrderPaid = false;
        if (stuck.order_id) {
          const { data: order } = await supabaseAdmin
            .from('orders')
            .select('status, utr')
            .eq('id', stuck.order_id)
            .single();

          if (order && (order.status === 'verified' || order.status === 'paid' || order.status === 'completed')) {
            isOrderPaid = true;
            await transitionLinkToPaid(stuck.token, { orderId: stuck.order_id, utr: order.utr });
            recoveredCount++;
            continue;
          }
        }

        // If not paid, check if past expires_at
        if (!isOrderPaid) {
          if (new Date(stuck.expires_at) < new Date()) {
            // Expire it
            await supabaseAdmin
              .from('payment_links')
              .update({
                status: 'expired',
                expired_at: nowIso,
                updated_at: nowIso
              })
              .eq('id', stuck.id);
            expiredCount++;
          } else {
            // Return back to active so customer can retry
            await supabaseAdmin
              .from('payment_links')
              .update({
                status: 'active',
                processing_started_at: null,
                updated_at: nowIso
              })
              .eq('id', stuck.id);
            recoveredCount++;
          }
        }
      }
    }

    // 2. Select active links past expires_at in a safe batch
    const { data: linksToExpire, error: fetchError } = await supabaseAdmin
      .from('payment_links')
      .select('*')
      .eq('status', 'active')
      .lt('expires_at', nowIso)
      .limit(batchLimit);

    if (fetchError) {
      errors.push(`Fetch error: ${fetchError.message}`);
      return { expiredCount, recoveredCount, errors };
    }

    if (!linksToExpire || linksToExpire.length === 0) {
      return { expiredCount, recoveredCount, errors };
    }

    // 3. Atomically update them in batch so another concurrent worker won't process the same IDs
    const idsToExpire = linksToExpire.map((l) => l.id);
    const { data: updatedLinks, error: updateError } = await supabaseAdmin
      .from('payment_links')
      .update({
        status: 'expired',
        expired_at: nowIso,
        updated_at: nowIso
      })
      .in('id', idsToExpire)
      .eq('status', 'active') // Concurrency safeguard: only update if still active
      .select('*');

    if (updateError) {
      errors.push(`Update error: ${updateError.message}`);
      return { expiredCount, recoveredCount, errors };
    }

    if (updatedLinks && updatedLinks.length > 0) {
      expiredCount += updatedLinks.length;

      // 4. Trigger webhook for each newly expired link
      for (const link of updatedLinks) {
        try {
          await triggerPaymentLinkWebhook(link.id, 'payment_link.expired');
        } catch (whErr) {
          errors.push(`Webhook dispatch error for link ${link.id}: ${whErr.message}`);
        }
      }
    }

    // 5. Post-24 hour cleanup of paid links: soft archive so they 404 publicly
    // while remaining fully visible in the merchant dashboard history
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabaseAdmin
      .from('payment_links')
      .update({ is_archived: true })
      .eq('status', 'paid')
      .eq('is_archived', false)
      .lt('paid_at', twentyFourHoursAgo);

    return { expiredCount, recoveredCount, errors };
  } catch (err) {
    errors.push(`Exception in processExpiredPaymentLinks: ${err.message}`);
    return { expiredCount, recoveredCount, errors };
  }
}

/**
 * Synchronizes order verification to linked payment links.
 * Called from payment callbacks, webhooks, and status checks.
 * - Idempotent: duplicate callbacks will not trigger duplicate actions
 * - Honors bank payments even if the link has already expired (marks paid with late flag)
 *
 * @param {string} orderId
 * @param {string} [utr]
 * @returns {Promise<{ synced: boolean, link?: object, latePaid?: boolean }>}
 */
export async function syncOrderVerificationToPaymentLink(orderId, utr) {
  if (!orderId) return { synced: false };

  try {
    // Check if any payment link is tied to this order
    const { data: matchedLink, error } = await supabaseAdmin
      .from('payment_links')
      .select('*')
      .or(`order_id.eq.${orderId},token.eq.${orderId.replace(/^pl_/, '')}`)
      .limit(1)
      .maybeSingle();

    if (error || !matchedLink) {
      return { synced: false };
    }

    // Transition to paid idempotently
    const transitionRes = await transitionLinkToPaid(matchedLink.token, { orderId, utr });

    if (transitionRes.success && !transitionRes.alreadyPaid) {
      // Fire webhook for payment link paid
      try {
        await triggerPaymentLinkWebhook(matchedLink.id, 'payment_link.paid');
      } catch (e) {
        console.warn('[Sync Payment Link] Webhook dispatch warning:', e.message);
      }
    }

    return {
      synced: true,
      link: transitionRes.link,
      latePaid: transitionRes.latePaid
    };
  } catch (err) {
    console.warn('[Sync Payment Link Error]:', err.message);
    return { synced: false };
  }
}

