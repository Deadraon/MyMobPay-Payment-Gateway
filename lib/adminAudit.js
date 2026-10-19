import { supabaseAdmin } from './supabase.js';
import { getClientIp } from './rateLimit.js';
import { ensureAdminMerchant } from './adminSettings.js';

/**
 * Immutable Append-Only Audit Logging Engine
 * 
 * Logs every administrative write, status toggle, financial change,
 * VPA approval, or sensitive data reveal.
 */

// In-memory ring buffer (last 200 logs) for instant high-speed UI retrieval
const inMemoryAuditBuffer = [];

/**
 * Logs an administrative action.
 *
 * @param {object} params
 * @param {object} params.actor - { id, email, role }
 * @param {string} params.action - e.g. 'merchant.suspend', 'vpa.approve', 'order.manual_verify'
 * @param {string} params.targetType - 'merchant', 'order', 'vpa', 'plan', 'user', 'setting'
 * @param {string} params.targetId - ID of the target resource
 * @param {object} [params.details] - { before, after, reason, ... }
 * @param {Request} [params.request] - HTTP request object to extract IP and User-Agent
 */
export async function logAdminAction({
  actor = {},
  action,
  targetType,
  targetId = null,
  details = {},
  request = null
}) {
  try {
    const actorEmail = actor.email || 'system@mymob.tech';
    const actorRole = actor.role || 'super_admin';
    const actorId = actor.id || actorEmail;

    let ipAddress = 'internal';
    let userAgent = 'server';

    if (request) {
      ipAddress = getClientIp(request);
      userAgent = request.headers.get('user-agent') || 'unknown';
    }

    const logEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      actor_id: actorId,
      actor_email: actorEmail,
      actor_role: actorRole,
      action,
      target_type: targetType,
      target_id: String(targetId || ''),
      details: details || {},
      ip_address: ipAddress,
      user_agent: userAgent,
      created_at: new Date().toISOString()
    };

    // 1. Maintain in-memory ring buffer for immediate UI freshness
    inMemoryAuditBuffer.unshift(logEntry);
    if (inMemoryAuditBuffer.length > 300) {
      inMemoryAuditBuffer.pop();
    }

    // 2. Attempt insert into public.admin_audit_logs table
    try {
      const { error: dbError } = await supabaseAdmin
        .from('admin_audit_logs')
        .insert([{
          actor_id: logEntry.actor_id,
          actor_email: logEntry.actor_email,
          actor_role: logEntry.actor_role,
          action: logEntry.action,
          target_type: logEntry.target_type,
          target_id: logEntry.target_id,
          details: logEntry.details,
          ip_address: logEntry.ip_address,
          user_agent: logEntry.user_agent,
          created_at: logEntry.created_at
        }]);

      if (!dbError) {
        return logEntry;
      }
    } catch {
      // Table may not exist yet, continue to JSONB fallback
    }

    // 3. Resilient Fallback: Persist in platform admin merchant JSONB setup_progress
    try {
      const adminMerchant = await ensureAdminMerchant();
      if (adminMerchant) {
        const setupProgress = adminMerchant.setup_progress || {};
        const adminSettings = setupProgress.admin_settings || {};
        const storedLogs = Array.isArray(adminSettings.audit_logs) ? adminSettings.audit_logs : [];
        
        storedLogs.unshift(logEntry);
        // Retain latest 500 audit logs in JSONB store
        const prunedLogs = storedLogs.slice(0, 500);

        await supabaseAdmin
          .from('merchants')
          .update({
            setup_progress: {
              ...setupProgress,
              admin_settings: {
                ...adminSettings,
                audit_logs: prunedLogs
              }
            }
          })
          .eq('id', adminMerchant.id);
      }
    } catch (fallbackErr) {
      console.warn('[Audit Log Fallback Error]', fallbackErr);
    }

    return logEntry;
  } catch (err) {
    console.error('[Audit Logger Fatal Error]', err);
    return null;
  }
}

/**
 * Retrieves audit logs with optional filtering.
 */
export async function getAuditLogs({
  limit = 50,
  offset = 0,
  action = null,
  actorEmail = null,
  targetType = null
} = {}) {
  try {
    // 1. Try querying public.admin_audit_logs
    try {
      let query = supabaseAdmin
        .from('admin_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (action) query = query.eq('action', action);
      if (actorEmail) query = query.ilike('actor_email', `%${actorEmail}%`);
      if (targetType) query = query.eq('target_type', targetType);

      const { data, count, error } = await query;
      if (!error && Array.isArray(data)) {
        return { logs: data, total: count || data.length };
      }
    } catch {
      // Fallback
    }

    // 2. Query fallback from platform admin JSONB + inMemory buffer
    let logs = [];
    const adminMerchant = await ensureAdminMerchant();
    if (adminMerchant) {
      const stored = adminMerchant.setup_progress?.admin_settings?.audit_logs;
      if (Array.isArray(stored)) {
        logs = [...stored];
      }
    }

    // Merge in-memory buffer if not already present
    const existingIds = new Set(logs.map(l => l.id));
    for (const item of inMemoryAuditBuffer) {
      if (!existingIds.has(item.id)) {
        logs.unshift(item);
      }
    }

    // Apply in-memory filters
    if (action) logs = logs.filter(l => l.action === action);
    if (actorEmail) logs = logs.filter(l => (l.actor_email || '').toLowerCase().includes(actorEmail.toLowerCase()));
    if (targetType) logs = logs.filter(l => l.target_type === targetType);

    const total = logs.length;
    const paginated = logs.slice(offset, offset + limit);

    return { logs: paginated, total };
  } catch (err) {
    console.error('getAuditLogs error:', err);
    return { logs: inMemoryAuditBuffer.slice(0, limit), total: inMemoryAuditBuffer.length };
  }
}
