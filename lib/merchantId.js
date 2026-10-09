import { supabaseAdmin } from '@/lib/supabase';

/**
 * Standardized Merchant ID format across the entire application.
 * Example: "MID-DD45279E"
 *
 * @param {string} id - Full UUID or existing Merchant ID
 * @returns {string} Formatted Merchant ID (e.g. "MID-DD45279E")
 */
export function formatMerchantId(id) {
  if (!id || typeof id !== 'string') return 'MID-MMP88492';
  const clean = id.trim();
  if (clean.toUpperCase().startsWith('MID-')) {
    const raw = clean.slice(4).replace(/-/g, '');
    return `MID-${raw.slice(0, 8).toUpperCase()}`;
  }
  const hex = clean.replace(/-/g, '').slice(0, 8).toUpperCase();
  return `MID-${hex}`;
}

/**
 * Resolves a short Merchant ID (e.g. "MID-DD45279E" or "DD45279E")
 * to the internal full database UUID.
 *
 * @param {string} shortId
 * @returns {Promise<string|null>} Full UUID or null if not found
 */
export async function resolveMerchantIdToUuid(shortId) {
  if (!shortId || typeof shortId !== 'string') return null;
  const clean = shortId.trim();

  // If already a valid full 36-character UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean)) {
    return clean.toLowerCase();
  }

  const raw = clean.toUpperCase().replace(/^MID-/, '').replace(/-/g, '');
  if (!raw || raw.length < 8) return null;
  const prefix = raw.slice(0, 8).toLowerCase();

  const minUuid = `${prefix}-0000-0000-0000-000000000000`;
  const maxUuid = `${prefix}-ffff-ffff-ffff-ffffffffffff`;

  const { data } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .gte('id', minUuid)
    .lte('id', maxUuid)
    .limit(1);

  return data?.[0]?.id || null;
}
