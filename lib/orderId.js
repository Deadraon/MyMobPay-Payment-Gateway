/**
 * Enterprise Order ID Generator & Utilities
 * Format: MMP_<YYYYMMDD>_<12-char random base62>
 * Example: MMP_20260927_8F3kQ9zR2x1A
 */

export function generateOrderId() {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = istFormatter.formatToParts(now);
  const y = parts.find(p => p.type === 'year')?.value || String(now.getFullYear());
  const m = parts.find(p => p.type === 'month')?.value || String(now.getMonth() + 1).padStart(2, '0');
  const d = parts.find(p => p.type === 'day')?.value || String(now.getDate()).padStart(2, '0');
  const dateStr = `${y}${m}${d}`;

  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let randPart = '';

  if (typeof crypto !== 'undefined') {
    try {
      if (typeof crypto.randomBytes === 'function') {
        const bytes = crypto.randomBytes(12);
        for (let i = 0; i < 12; i++) {
          randPart += chars[bytes[i] % chars.length];
        }
      } else if (typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(12);
        crypto.getRandomValues(bytes);
        for (let i = 0; i < 12; i++) {
          randPart += chars[bytes[i] % chars.length];
        }
      }
    } catch {}
  }

  if (!randPart || randPart.length < 12) {
    randPart = '';
    for (let i = 0; i < 12; i++) {
      randPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }

  return `MMP_${dateStr}_${randPart}`;
}

export function formatOrderId(id) {
  if (!id) return '';
  return String(id).trim().replace(/^#+/, '');
}

/**
 * Cleanly format long hex tokens, hashes, or UUIDs for display in UI headers, receipts,
 * and specification tables (e.g., 'bb7068f30f763390f55a0aee2722618841b878d32d751443' -> 'bb7068f3…751443')
 * while preserving standard MyMobPay order IDs (e.g. 'MMP_20261011_wCbcxr0x63Nm')
 * and short human-friendly codes.
 */
export function formatRefId(id) {
  if (!id) return '';
  const str = String(id).trim().replace(/^#+/, '');
  if (str.startsWith('MMP_') && str.length <= 26) return str;
  if (str.length <= 16) return str;
  return `${str.slice(0, 8)}…${str.slice(-6)}`;
}
