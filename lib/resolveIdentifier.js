import { supabaseAdmin } from '@/lib/supabase';

/**
 * Resolves an email, Merchant ID (MID-XXXX), UUID, or business name to the merchant's registered email address.
 */
export async function resolveMerchantIdentifier(identifier) {
  if (!identifier || typeof identifier !== 'string') return null;
  const clean = identifier.trim();
  if (!clean) return null;

  // 1. If already an email, return as-is
  if (clean.includes('@')) {
    return clean.toLowerCase();
  }

  // 2. If it's a Merchant ID (MID-XXXX) or ID prefix
  let merchantId = null;
  if (clean.toUpperCase().startsWith('MID-')) {
    const prefix = clean.slice(4).toLowerCase();
    const { data } = await supabaseAdmin
      .from('merchants')
      .select('id, email')
      .ilike('id', `${prefix}%`)
      .limit(1);
    if (data && data.length > 0) {
      if (data[0].email) return data[0].email.toLowerCase();
      merchantId = data[0].id;
    }
  } else {
    // Try by exact UUID
    const { data: byId } = await supabaseAdmin
      .from('merchants')
      .select('id, email')
      .eq('id', clean)
      .limit(1);
    if (byId && byId.length > 0) {
      if (byId[0].email) return byId[0].email.toLowerCase();
      merchantId = byId[0].id;
    } else {
      // Try by business_name (case-insensitive)
      const { data: byName } = await supabaseAdmin
        .from('merchants')
        .select('id, email')
        .ilike('business_name', clean)
        .limit(1);
      if (byName && byName.length > 0) {
        if (byName[0].email) return byName[0].email.toLowerCase();
        merchantId = byName[0].id;
      }
    }
  }

  if (!merchantId) return null;

  // 3. Retrieve user email from Supabase Auth admin or merchants table
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(merchantId);
  if (userError || !userData?.user?.email) {
    return null;
  }

  return userData.user.email.toLowerCase();
}
