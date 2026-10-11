/**
 * Modern Gateway Order ID Generator & Utilities (Razorpay / Stripe Style)
 * Format: order_<14-char random base62> (e.g. order_8F3kQ9zR2x1AmP)
 * 
 * Unifies Order Number and Transaction Reference into a single canonical ID
 * used consistently across API requests, webhooks, checkout UI, and merchant dashboard.
 */

export function generateOrderId(prefix = 'order') {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let randPart = '';

  if (typeof crypto !== 'undefined') {
    try {
      if (typeof crypto.randomBytes === 'function') {
        const bytes = crypto.randomBytes(14);
        for (let i = 0; i < 14; i++) {
          randPart += chars[bytes[i] % chars.length];
        }
      } else if (typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(14);
        crypto.getRandomValues(bytes);
        for (let i = 0; i < 14; i++) {
          randPart += chars[bytes[i] % chars.length];
        }
      }
    } catch {}
  }

  if (!randPart || randPart.length < 14) {
    randPart = '';
    for (let i = 0; i < 14; i++) {
      randPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return `${prefix}_${randPart}`;
}

export function formatOrderId(id) {
  if (!id) return '';
  return String(id).trim().replace(/^#+/, '');
}

/**
 * Cleanly format long hex tokens, hashes, or UUIDs for display in UI headers, receipts,
 * and specification tables (e.g., 'bb7068f30f763390f55a0aee2722618841b878d32d751443' -> 'bb7068f3…751443')
 * while preserving standard MyMobPay order IDs (e.g. 'order_wCbcxr0x63Nm', 'pay_...', 'MMP_...')
 * and short human-friendly codes.
 */
export function formatRefId(id) {
  if (!id) return '';
  const str = String(id).trim().replace(/^#+/, '');
  if ((str.startsWith('order_') || str.startsWith('pay_') || str.startsWith('mmp_') || str.startsWith('MMP_')) && str.length <= 32) {
    return str;
  }
  if (str.length <= 16) return str;
  return `${str.slice(0, 8)}…${str.slice(-6)}`;
}
