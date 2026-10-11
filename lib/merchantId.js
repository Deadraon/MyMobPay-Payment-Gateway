import { supabaseAdmin } from './supabase.js';

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function encodeBase62(bigint, targetLen = 14) {
  let str = '';
  let n = bigint;
  while (n > 0n) {
    const rem = n % 62n;
    str = BASE62[Number(rem)] + str;
    n = n / 62n;
  }
  return str.padStart(targetLen, '0');
}

function decodeBase62(str) {
  let n = 0n;
  for (let i = 0; i < str.length; i++) {
    const idx = BASE62.indexOf(str[i]);
    if (idx === -1) return null;
    n = n * 62n + BigInt(idx);
  }
  return n;
}

/**
 * Standardized 14-character Base62 Merchant ID (no prefix).
 * Example: "5DsTENhw5LQxQC" or "Hq2jK9xLmN4pRt"
 *
 * @param {string} id - Full UUID or existing Merchant ID
 * @returns {string} 14-character Base62 Merchant ID
 */
export function formatMerchantId(id) {
  if (!id || typeof id !== 'string') return 'MMP884920AB91X';
  const clean = id.trim();

  // If already a 14-character Base62 string
  if (/^[0-9A-Za-z]{14}$/.test(clean)) {
    return clean;
  }

  // Strip possible legacy prefixes if passed
  const stripped = clean.replace(/^MID-/i, '').replace(/-/g, '');

  // If it's a UUID (or at least 20 hex characters)
  if (/^[0-9a-f]{20,32}$/i.test(stripped)) {
    const hex20 = stripped.slice(0, 20);
    return encodeBase62(BigInt('0x' + hex20), 14);
  }

  // If 8 hex chars (legacy prefix), pad and encode
  if (/^[0-9a-f]{8}$/i.test(stripped)) {
    const hex20 = stripped.padEnd(20, '0');
    return encodeBase62(BigInt('0x' + hex20), 14);
  }

  return clean.slice(0, 14);
}

/**
 * Resolves a Merchant ID (14-character Base62, legacy MID-XXXX, or full UUID)
 * to the internal database UUID.
 *
 * @param {string} shortId
 * @returns {Promise<string|null>} Full UUID or null if not found
 */
export async function resolveMerchantIdToUuid(shortId) {
  if (!shortId || typeof shortId !== 'string') return null;
  const clean = shortId.trim();

  // 1. If already a valid full 36-character UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
    return clean.toLowerCase();
  }

  // 2. If 14-character Base62 ID (no prefix)
  const isBase62 = /^[0-9A-Za-z]{14}$/.test(clean);
  if (isBase62) {
    const decodedBig = decodeBase62(clean);
    if (decodedBig !== null) {
      const hex = decodedBig.toString(16).padStart(20, '0');
      const minUuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-000000000000`;
      const maxUuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-ffffffffffff`;

      const { data } = await supabaseAdmin
        .from('merchants')
        .select('id')
        .gte('id', minUuid)
        .lte('id', maxUuid)
        .limit(1);

      if (data && data[0]?.id) {
        return data[0].id;
      }
    }
  }

  // 3. Fallback for legacy 8-char hex or MID- prefixed identifiers
  const raw = clean.toUpperCase().replace(/^MID-/, '').replace(/-/g, '');
  if (raw && raw.length >= 8 && /^[0-9a-f]{8,}$/i.test(raw)) {
    const prefix = raw.slice(0, 8).toLowerCase();
    const minUuid = `${prefix}-0000-0000-0000-000000000000`;
    const maxUuid = `${prefix}-ffff-ffff-ffff-ffffffffffff`;

    const { data } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .gte('id', minUuid)
      .lte('id', maxUuid)
      .limit(1);

    if (data && data[0]?.id) {
      return data[0].id;
    }
  }

  return null;
}
