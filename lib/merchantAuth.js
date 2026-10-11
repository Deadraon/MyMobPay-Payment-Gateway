import { supabaseAdmin, supabase } from './supabase.js';
import { CONFIG } from './config.js';

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
      } catch (e) {
        // Fallback to testing candidateKey
      }
    }
  }

  if (candidateKey) {
    let cleanKey = candidateKey;
    if (cleanKey.startsWith('test_')) cleanKey = cleanKey.replace('test_', '');
    if (cleanKey.startsWith('live_')) cleanKey = cleanKey.replace('live_', '');

    const { data: merchant, error } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('api_key', cleanKey)
      .single();

    if (merchant && !error) {
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
