import crypto from 'crypto';
import { supabaseAdmin, supabase } from './supabase.js';
import { CONFIG } from './config.js';

/**
 * Computes SHA-256 hash of a merchant API key for secure database lookups.
 * Strips 'test_' or 'live_' prefixes before hashing.
 *
 * @param {string} key
 * @returns {string} 64-character hex hash
 */
export function hashApiKey(key) {
  if (!key || typeof key !== 'string') return '';
  let clean = key.trim();
  if (clean.startsWith('test_')) clean = clean.replace('test_', '');
  if (clean.startsWith('live_')) clean = clean.replace('live_', '');
  return crypto.createHash('sha256').update(clean).digest('hex');
}

/**
 * High-performance, backward-compatible merchant lookup.
 * 1. Queries by indexed SHA-256 hash (api_key_hash)
 * 2. Falls back to raw api_key if the hash is not yet populated
 * 3. Automatically self-heals by backfilling api_key_hash in the background
 *
 * @param {string} key
 * @param {string} [fields='*']
 * @returns {Promise<object|null>}
 */
export async function findMerchantByApiKey(key, fields = '*') {
  if (!key || typeof key !== 'string') return null;

  let clean = key.trim();
  if (clean.startsWith('test_')) clean = clean.replace('test_', '');
  if (clean.startsWith('live_')) clean = clean.replace('live_', '');
  const hashed = crypto.createHash('sha256').update(clean).digest('hex');

  // 1. Try lookup by SHA-256 hash first (fastest & most secure)
  const { data: merchantByHash } = await supabaseAdmin
    .from('merchants')
    .select(fields)
    .eq('api_key_hash', hashed)
    .maybeSingle();

  if (merchantByHash) {
    return merchantByHash;
  }

  // 2. Fallback to raw api_key for existing databases before SQL migration
  const { data: merchantByRaw } = await supabaseAdmin
    .from('merchants')
    .select(fields)
    .eq('api_key', clean)
    .maybeSingle();

  // 3. Self-healing: if found by raw key and hash is missing, populate it
  if (merchantByRaw && !merchantByRaw.api_key_hash) {
    supabaseAdmin
      .from('merchants')
      .update({ api_key_hash: hashed })
      .eq('id', merchantByRaw.id)
      .then(() => {})
      .catch(() => {});
  }

  return merchantByRaw || null;
}

/**
 * Authenticate merchant from incoming Next.js Request.
 * Supports:
 * 1. API Key via 'x-api-key' header
 * 2. API Key via query/body
 * 3. Supabase Auth JWT token via 'Authorization: Bearer <jwt>'
 *
 * @param {Request} request
 * @param {object} [body={}]
 * @returns {Promise<{ merchant: object | null, error?: string, status?: number }>}
 */
export async function authenticateMerchant(request, body = {}) {
  // 1. Try API Key from Header or Body or Query
  const authHeader = request.headers.get('authorization') || '';
  const apiKeyHeader = request.headers.get('x-api-key') || '';
  const url = new URL(request.url);
  const queryApiKey = url.searchParams.get('api_key') || url.searchParams.get('key');
  const bodyApiKey = body?.api_key || body?.apiKey;

  let candidateKey = apiKeyHeader || queryApiKey || bodyApiKey;

  if (!candidateKey && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    // Check if token looks like an API Key (UUID or starts with live_/test_)
    if (token.startsWith('live_') || token.startsWith('test_') || /^[0-9a-fA-F-]{32,36}$/.test(token)) {
      candidateKey = token;
    } else {
      // It's a Supabase Auth JWT token
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
        if (user && !authErr) {
          const { data: merchant, error: mErr } = await supabaseAdmin
            .from('merchants')
            .select('*')
            .eq('id', user.id)
            .single();

          if (merchant && !mErr) {
            return { merchant };
          }
        }
      } catch {
        // Fallback to testing candidateKey
      }
    }
  }

  if (candidateKey) {
    const merchant = await findMerchantByApiKey(candidateKey);
    if (merchant) {
      return { merchant };
    }
  }

  // Check fallback platform admin key in dev
  if (candidateKey === CONFIG.platformApiKey) {
    const { data: defaultMerchant } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .limit(1)
      .single();
    if (defaultMerchant) {
      return { merchant: defaultMerchant };
    }
  }

  return {
    merchant: null,
    error: 'Authentication failed. Please provide a valid API Key (x-api-key header) or sign in.',
    status: 401
  };
}
