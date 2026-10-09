import { supabaseAdmin } from '@/lib/supabase';
import { resolveMerchantIdToUuid } from './merchantId';

/**
 * Resolves an email, Merchant ID (MID-XXXX, 8-char hex, or full UUID), or business name
 * to the merchant's registered email address.
 */
export async function resolveMerchantIdentifier(identifier) {
  if (!identifier || typeof identifier !== 'string') return null;
  const clean = identifier.trim();
  if (!clean) return null;

  // 1. If already an email, return as-is
  if (clean.includes('@')) {
    return clean.toLowerCase();
  }

  // 2. Try resolving via Merchant ID (14-character Base62, legacy MID-, or full UUID)
  let merchantId = await resolveMerchantIdToUuid(clean);

  // 4. Try by business_name (case-insensitive)
  if (!merchantId) {
    const { data: byName } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .ilike('business_name', clean)
      .limit(1);
    if (byName && byName.length > 0) {
      merchantId = byName[0].id;
    }
  }

  if (!merchantId) return null;

  // 5. Retrieve user email from Supabase Auth admin
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(merchantId);
  if (userError || !userData?.user?.email) {
    return null;
  }

  return userData.user.email.toLowerCase();
}
