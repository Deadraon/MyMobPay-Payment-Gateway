import { supabaseAdmin } from './supabase.js';
import { ensureAdminMerchant, DEFAULT_ADMIN_EMAILS, PLATFORM_ADMIN_USER_ID } from './adminSettings.js';
import { logAdminAction } from './adminAudit.js';

/**
 * Completely and permanently purges an account and all associated operational records
 * from every database table, including Supabase Auth credentials.
 *
 * @param {object} params
 * @param {string} [params.accountId] - Target account/user UUID
 * @param {string} [params.email] - Target account email
 * @param {string} [params.query] - Free-form search term (UUID, email, or store name)
 * @param {Request} [request] - Incoming HTTP request for audit logging
 */
export async function purgeAccountCompletely({ accountId, email, query } = {}, request = null) {
  let targetUserId = accountId || '';
  let targetEmail = email || '';
  let targetPhone = '';
  let targetBusiness = '';

  const lookupTerm = (query || email || accountId || '').trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // 0. Fast-path Security Guard: Protect platform root administrators
  const isEarlyRootAdmin =
    targetUserId === PLATFORM_ADMIN_USER_ID ||
    lookupTerm === PLATFORM_ADMIN_USER_ID ||
    (targetEmail && DEFAULT_ADMIN_EMAILS.some(e => e.toLowerCase() === targetEmail.toLowerCase().trim())) ||
    (lookupTerm && DEFAULT_ADMIN_EMAILS.some(e => e.toLowerCase() === lookupTerm.toLowerCase().trim()));

  if (isEarlyRootAdmin) {
    return {
      success: false,
      error: 'Security Guard: Primary root platform administrator accounts cannot be deleted.',
      status: 403
    };
  }

  // 1. Resolve target user ID if not a UUID or if lookup term provided
  if (!targetUserId || !uuidRegex.test(targetUserId)) {
    if (lookupTerm) {
      if (uuidRegex.test(lookupTerm)) {
        targetUserId = lookupTerm;
      } else {
        // Search in merchants table
        try {
          const { data: mMatch } = await supabaseAdmin
            .from('merchants')
            .select('id, email, phone_number, business_name')
            .or(`email.ilike.${lookupTerm},business_name.ilike.${lookupTerm},phone_number.ilike.%${lookupTerm}%`)
            .limit(1)
            .maybeSingle();

          if (mMatch) {
            targetUserId = mMatch.id;
            targetEmail = mMatch.email || targetEmail;
            targetPhone = mMatch.phone_number || targetPhone;
            targetBusiness = mMatch.business_name || targetBusiness;
          }
        } catch (e) {
          // ignore
        }
      }
    }
  }

  // 2. If still no UUID, scan Supabase Auth users
  if ((!targetUserId || !uuidRegex.test(targetUserId)) && lookupTerm) {
    try {
      const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const termLower = lookupTerm.toLowerCase();
      const authMatch = authList?.users?.find(u => 
        u.id === lookupTerm ||
        u.email?.toLowerCase() === termLower ||
        (u.phone && u.phone.includes(lookupTerm)) ||
        (u.user_metadata?.phone && String(u.user_metadata.phone).includes(lookupTerm))
      );
      if (authMatch) {
        targetUserId = authMatch.id;
        targetEmail = authMatch.email || targetEmail;
        targetPhone = authMatch.phone || authMatch.user_metadata?.phone || targetPhone;
        targetBusiness = authMatch.user_metadata?.business_name || authMatch.user_metadata?.full_name || targetBusiness;
      }
    } catch (e) {
      console.warn('Auth user scan notice:', e.message);
    }
  }

  if (!targetUserId) {
    return {
      success: false,
      error: `No existing account found matching identifier "${lookupTerm || 'provided details'}"`,
      status: 404
    };
  }

  // 3. Enrich details before deletion for auditing and phone OTP cleanup
  if (!targetEmail || !targetBusiness || !targetPhone) {
    try {
      const { data: mRow } = await supabaseAdmin
        .from('merchants')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();
      if (mRow) {
        targetEmail = targetEmail || mRow.email || '';
        targetPhone = targetPhone || mRow.phone_number || '';
        targetBusiness = targetBusiness || mRow.business_name || '';
      }
    } catch (e) {}

    try {
      const { data: aRow } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
      if (aRow?.user) {
        targetEmail = targetEmail || aRow.user.email || '';
        targetPhone = targetPhone || aRow.user.phone || aRow.user.user_metadata?.phone || '';
        targetBusiness = targetBusiness || aRow.user.user_metadata?.business_name || aRow.user.user_metadata?.full_name || '';
      }
    } catch (e) {}
  }

  // 4. Critical Security Guard: Protect platform root administrators
  const isRootAdmin =
    targetUserId === PLATFORM_ADMIN_USER_ID ||
    DEFAULT_ADMIN_EMAILS.some(e => e.toLowerCase() === (targetEmail || '').toLowerCase().trim());

  if (isRootAdmin) {
    return {
      success: false,
      error: 'Security Guard: Primary root platform administrator accounts cannot be deleted.',
      status: 403
    };
  }

  // 5. Completely purge records across all relational tables
  const secondaryTables = [
    { name: 'orders', col: 'merchant_id' },
    { name: 'payment_links', col: 'merchant_id' },
    { name: 'webhook_logs', col: 'merchant_id' },
    { name: 'email_logs', col: 'merchant_id' },
    { name: 'merchant_kyc', col: 'merchant_id' },
    { name: 'merchant_vpa_changes', col: 'merchant_id' },
    { name: 'disputes', col: 'merchant_id' },
    { name: 'support_tickets', col: 'merchant_id' },
    { name: 'staff_gateway_pool', col: 'merchant_id' }
  ];

  const purgedSummary = [];

  for (const t of secondaryTables) {
    try {
      const { error: tErr } = await supabaseAdmin.from(t.name).delete().eq(t.col, targetUserId);
      if (!tErr) purgedSummary.push(t.name);
    } catch (e) {}
  }

  // 6. Delete OTP records if linked to user phone
  if (targetPhone) {
    try {
      const cleanDigits = targetPhone.replace(/\D/g, '').slice(-10);
      if (cleanDigits) {
        await supabaseAdmin.from('whatsapp_otps').delete().ilike('phone', `%${cleanDigits}%`);
        purgedSummary.push('whatsapp_otps');
      }
    } catch (e) {}
  }

  // 7. Delete from merchants table
  try {
    const { error: mErr } = await supabaseAdmin.from('merchants').delete().eq('id', targetUserId);
    if (!mErr) purgedSummary.push('merchants');
  } catch (e) {}

  // 8. Delete from admin_users table (if it exists)
  try {
    let orFilter = `id.eq.${targetUserId}`;
    if (targetEmail) orFilter += `,email.eq.${targetEmail}`;
    await supabaseAdmin.from('admin_users').delete().or(orFilter);
    purgedSummary.push('admin_users');
  } catch (e) {}

  // 9. Clean up from adminMerchant setup_progress.admin_settings.admin_users
  try {
    const adminMerchant = await ensureAdminMerchant();
    if (adminMerchant) {
      const setupProgress = adminMerchant.setup_progress || {};
      const adminSettings = setupProgress.admin_settings || {};
      const currentUsers = adminSettings.admin_users || [];
      const updatedUsers = currentUsers.filter(u => u.id !== targetUserId && u.email !== targetEmail);
      if (updatedUsers.length !== currentUsers.length) {
        await supabaseAdmin.from('merchants').update({
          setup_progress: {
            ...setupProgress,
            admin_settings: {
              ...adminSettings,
              admin_users: updatedUsers
            }
          }
        }).eq('id', adminMerchant.id);
        purgedSummary.push('admin_settings.admin_users');
      }
    }
  } catch (e) {}

  // 10. Delete user from Supabase Auth
  let authDeleted = false;
  try {
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
    if (!authErr) {
      authDeleted = true;
      purgedSummary.push('auth.users');
    } else {
      console.warn('Notice: auth.admin.deleteUser:', authErr.message);
    }
  } catch (e) {
    console.warn('Notice: auth.admin.deleteUser threw:', e.message);
  }

  // 11. Immutable Audit Trail Entry
  await logAdminAction({
    action: 'account.permanently_deleted',
    targetType: 'account',
    targetId: targetUserId,
    details: {
      email: targetEmail,
      business_name: targetBusiness,
      phone: targetPhone,
      auth_deleted: authDeleted,
      purged_tables: purgedSummary,
      purged_at: new Date().toISOString()
    },
    request
  });

  return {
    success: true,
    deletedId: targetUserId,
    deletedEmail: targetEmail,
    deletedBusiness: targetBusiness,
    purgedTables: purgedSummary,
    message: `Account "${targetBusiness || targetEmail || targetUserId}" completely deleted from database.`
  };
}
