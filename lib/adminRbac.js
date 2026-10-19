/**
 * MyMobPay Enterprise Role-Based Access Control (RBAC) Engine
 * 
 * Defines granular operational roles, permissions, and server-side authorization guards.
 * Follows Razorpay / Stripe enterprise security separation of duties.
 */

export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  OPERATIONS: 'operations',
  FINANCE: 'finance',
  SUPPORT: 'support',
  RISK: 'risk',
  DEVELOPER: 'developer',
  ANALYST: 'analyst',
};

// Granular permissions catalog
export const PERMISSIONS = {
  // Merchant operations
  MERCHANTS_VIEW: 'merchants.view',
  MERCHANTS_EDIT: 'merchants.edit',
  MERCHANTS_SUSPEND: 'merchants.suspend',
  MERCHANTS_DELETE: 'merchants.delete',
  MERCHANTS_IMPERSONATE: 'merchants.impersonate',
  
  // KYC & Compliance
  KYC_REVIEW: 'kyc.review',
  VPA_APPROVE: 'vpa.approve',

  // Transactions & Ledger
  TRANSACTIONS_VIEW: 'transactions.view',
  TRANSACTIONS_VERIFY: 'transactions.verify',
  TRANSACTIONS_REJECT: 'transactions.reject',
  TRANSACTIONS_EXPORT: 'transactions.export',
  TRANSACTIONS_FLAG: 'transactions.flag',

  // Billing & Monetization
  BILLING_VIEW: 'billing.view',
  BILLING_EDIT: 'billing.edit',
  PLANS_MANAGE: 'plans.manage',
  INVOICES_GENERATE: 'invoices.generate',

  // Developer & Integrations
  WEBHOOKS_MANAGE: 'webhooks.manage',
  API_KEYS_ROTATE: 'api_keys.rotate',
  API_LOGS_VIEW: 'api_logs.view',
  SYSTEM_DIAGNOSTICS: 'system.diagnostics',

  // Risk, Fraud & Blocklists
  RISK_MANAGE: 'risk.manage',
  BLOCKLIST_MANAGE: 'blocklist.manage',

  // Disputes & Support
  DISPUTES_MANAGE: 'disputes.manage',
  SUPPORT_MANAGE: 'support.manage',
  BROADCASTS_MANAGE: 'broadcasts.manage',

  // Reports & Analytics
  REPORTS_VIEW: 'reports.view',
  ANALYTICS_VIEW: 'analytics.view',

  // Security & Admin Team
  AUDIT_VIEW: 'audit.view',
  ADMINS_MANAGE: 'admins.manage',
  DATA_REVEAL: 'data.reveal',
  SETTINGS_MANAGE: 'settings.manage',
};

// Role-to-permissions mapping matrix
export const ROLE_PERMISSIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: ['*'], // Unrestricted access

  [ADMIN_ROLES.OPERATIONS]: [
    PERMISSIONS.MERCHANTS_VIEW,
    PERMISSIONS.MERCHANTS_EDIT,
    PERMISSIONS.MERCHANTS_SUSPEND,
    PERMISSIONS.MERCHANTS_IMPERSONATE,
    PERMISSIONS.KYC_REVIEW,
    PERMISSIONS.VPA_APPROVE,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_VERIFY,
    PERMISSIONS.TRANSACTIONS_REJECT,
    PERMISSIONS.TRANSACTIONS_EXPORT,
    PERMISSIONS.DISPUTES_MANAGE,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.BROADCASTS_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.DATA_REVEAL,
  ],

  [ADMIN_ROLES.FINANCE]: [
    PERMISSIONS.MERCHANTS_VIEW,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_EDIT,
    PERMISSIONS.PLANS_MANAGE,
    PERMISSIONS.INVOICES_GENERATE,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_EXPORT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AUDIT_VIEW,
  ],

  [ADMIN_ROLES.SUPPORT]: [
    PERMISSIONS.MERCHANTS_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.DISPUTES_MANAGE,
    PERMISSIONS.SUPPORT_MANAGE,
    PERMISSIONS.BROADCASTS_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
  ],

  [ADMIN_ROLES.RISK]: [
    PERMISSIONS.MERCHANTS_VIEW,
    PERMISSIONS.MERCHANTS_SUSPEND,
    PERMISSIONS.KYC_REVIEW,
    PERMISSIONS.VPA_APPROVE,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.TRANSACTIONS_FLAG,
    PERMISSIONS.RISK_MANAGE,
    PERMISSIONS.BLOCKLIST_MANAGE,
    PERMISSIONS.DISPUTES_MANAGE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.DATA_REVEAL,
  ],

  [ADMIN_ROLES.DEVELOPER]: [
    PERMISSIONS.MERCHANTS_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.WEBHOOKS_MANAGE,
    PERMISSIONS.API_KEYS_ROTATE,
    PERMISSIONS.API_LOGS_VIEW,
    PERMISSIONS.SYSTEM_DIAGNOSTICS,
    PERMISSIONS.AUDIT_VIEW,
  ],

  [ADMIN_ROLES.ANALYST]: [
    PERMISSIONS.MERCHANTS_VIEW,
    PERMISSIONS.TRANSACTIONS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.AUDIT_VIEW,
  ],
};

/**
 * Checks if a given admin user or role has the required permission.
 *
 * @param {string|object} roleOrUser - The role string or admin user object
 * @param {string} permission - The permission to check
 * @returns {boolean}
 */
export function hasPermission(roleOrUser, permission) {
  if (!roleOrUser) return false;
  
  const role = typeof roleOrUser === 'string' ? roleOrUser : roleOrUser.role;
  if (!role) return false;

  // Super admin possesses wildcard capability
  if (role === ADMIN_ROLES.SUPER_ADMIN) return true;

  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed) return false;

  if (allowed.includes('*')) return true;
  return allowed.includes(permission);
}

/**
 * Returns human-readable metadata for each role.
 */
export function getRoleDetails(role) {
  switch (role) {
    case ADMIN_ROLES.SUPER_ADMIN:
      return { label: 'Super Admin', color: 'bg-purple-100 text-purple-800 border-purple-200', desc: 'Full platform authority' };
    case ADMIN_ROLES.OPERATIONS:
      return { label: 'Operations Lead', color: 'bg-blue-100 text-blue-800 border-blue-200', desc: 'Merchant onboarding & daily ops' };
    case ADMIN_ROLES.FINANCE:
      return { label: 'Finance & Billing', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', desc: 'Invoicing & plan monetization' };
    case ADMIN_ROLES.SUPPORT:
      return { label: 'Partner Support', color: 'bg-sky-100 text-sky-800 border-sky-200', desc: 'Tickets & merchant assistance' };
    case ADMIN_ROLES.RISK:
      return { label: 'Risk & Fraud', color: 'bg-rose-100 text-rose-800 border-rose-200', desc: 'Velocity rules & blocklists' };
    case ADMIN_ROLES.DEVELOPER:
      return { label: 'Integration Engineer', color: 'bg-amber-100 text-amber-800 border-amber-200', desc: 'Webhooks & API diagnostics' };
    case ADMIN_ROLES.ANALYST:
      return { label: 'Read-Only Analyst', color: 'bg-slate-100 text-slate-800 border-slate-200', desc: 'Reports & volume metrics' };
    default:
      return { label: role || 'Admin', color: 'bg-slate-100 text-slate-700 border-slate-200', desc: 'Standard admin' };
  }
}
