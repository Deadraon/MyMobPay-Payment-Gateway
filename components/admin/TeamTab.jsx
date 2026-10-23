'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  Key, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Search, 
  Filter, 
  Info,
  Clock,
  Sparkles,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { ADMIN_ROLES, ROLE_PERMISSIONS } from '@/lib/adminRbac';

const ROLE_COLORS = {
  [ADMIN_ROLES.SUPER_ADMIN]: 'bg-rose-50 text-rose-700 border-rose-200',
  [ADMIN_ROLES.OPERATIONS]: 'bg-blue-50 text-blue-700 border-blue-200',
  [ADMIN_ROLES.FINANCE]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ADMIN_ROLES.SUPPORT]: 'bg-purple-50 text-purple-700 border-purple-200',
  [ADMIN_ROLES.RISK]: 'bg-amber-50 text-amber-700 border-amber-200',
  [ADMIN_ROLES.DEVELOPER]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [ADMIN_ROLES.ANALYST]: 'bg-slate-50 text-slate-700 border-slate-200',
};

export default function TeamTab({ showToast, getAuthHeaders }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState(ADMIN_ROLES.SUPPORT);

  const [confirmModal, setConfirmModal] = useState(null); // { title, message, onConfirm }
  const [showMatrix, setShowMatrix] = useState(false);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      const res = await fetch('/api/admin/users', { headers });
      if (!res.ok) throw new Error('Failed to fetch admin team');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching admin users:', err);
      if (showToast) showToast('Failed to load admin team list', 'error');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle invite
  const handleInviteAdmin = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) {
      if (showToast) showToast('Please enter a valid email address', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'create_admin',
          email: inviteEmail.trim(),
          fullName: inviteName.trim(),
          role: inviteRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add administrator');

      if (showToast) showToast(`Administrator ${inviteEmail} registered!`, 'info');
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRole(ADMIN_ROLES.SUPPORT);
      fetchUsers();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'update_role',
          userId,
          role: newRole
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update role');

      if (showToast) showToast('Admin role updated and logged to audit trail', 'info');
      fetchUsers();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle toggle active status
  const handleToggleStatus = (user) => {
    setConfirmModal({
      title: user.is_active ? 'Deactivate Administrator' : 'Activate Administrator',
      message: user.is_active
        ? `Are you sure you want to deactivate ${user.email}? They will immediately lose access to all admin operations.`
        : `Re-activate administrator access for ${user.email}?`,
      confirmLabel: user.is_active ? 'Deactivate' : 'Activate',
      isDanger: user.is_active,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const headers = getAuthHeaders ? await getAuthHeaders() : {};
          headers['Content-Type'] = 'application/json';
          const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              action: 'toggle_status',
              userId: user.id,
              isActive: !user.is_active
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to change admin status');

          if (showToast) showToast(`Status updated for ${user.email}`, 'info');
          fetchUsers();
        } catch (err) {
          if (showToast) showToast(err.message, 'error');
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      }
    });
  };

  // Handle reset 2FA
  const handleReset2FA = (user) => {
    setConfirmModal({
      title: 'Reset TOTP 2FA Secret',
      message: `Reset Google Authenticator 2FA secret for ${user.email}? They will be prompted to re-bind on their next sign-in.`,
      confirmLabel: 'Reset 2FA',
      isDanger: true,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const headers = getAuthHeaders ? await getAuthHeaders() : {};
          headers['Content-Type'] = 'application/json';
          const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              action: 'reset_2fa',
              userId: user.id
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to reset 2FA');

          if (showToast) showToast(`2FA reset for ${user.email}`, 'info');
          fetchUsers();
        } catch (err) {
          if (showToast) showToast(err.message, 'error');
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      }
    });
  };

  // Handle delete admin
  const handleDeleteAdmin = (user) => {
    setConfirmModal({
      title: 'Remove Administrator',
      message: `Are you sure you want to permanently delete administrator account for ${user.email}? They will completely lose admin access and be removed from the database.`,
      confirmLabel: 'Delete Admin',
      isDanger: true,
      onConfirm: async () => {
        setActionLoading(true);
        try {
          const headers = getAuthHeaders ? await getAuthHeaders() : {};
          headers['Content-Type'] = 'application/json';
          const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              action: 'delete_admin',
              userId: user.id
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Failed to remove administrator');

          if (showToast) showToast(`Administrator ${user.email} removed`, 'info');
          fetchUsers();
        } catch (err) {
          if (showToast) showToast(err.message, 'error');
        } finally {
          setActionLoading(false);
          setConfirmModal(null);
        }
      }
    });
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Admin Team &amp; RBAC Control</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {users.length} Platform Officers
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Strict granular role-based access control with tamper-evident audit logging. Manage internal operations, risk analysts, finance personnel, and developer access.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-slate-500" />
            <span>{showMatrix ? 'Hide RBAC Matrix' : 'RBAC Matrix'}</span>
          </button>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Administrator</span>
          </button>
        </div>
      </div>

      {/* RBAC Matrix Explainer Drawer / Collapsible */}
      {showMatrix && (
        <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 shadow-xl border border-slate-800 space-y-4 animate-scale-up">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-white">Granular Role Permissions Matrix</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">NPCI &amp; ISO 27001 Access Compliance</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {Object.entries(ADMIN_ROLES).map(([key, role]) => (
              <div key={key} className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${ROLE_COLORS[role] || 'bg-slate-700 text-slate-300'}`}>
                    {role.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {ROLE_PERMISSIONS[role]?.includes('*') ? 'All Permissions' : `${ROLE_PERMISSIONS[role]?.length || 0} scopes`}
                  </span>
                </div>
                <ul className="space-y-1 text-[11px] text-slate-300">
                  {ROLE_PERMISSIONS[role]?.map((p, idx) => (
                    <li key={idx} className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search administrator name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">All Roles</option>
            {Object.values(ADMIN_ROLES).map(r => (
              <option key={r} value={r}>{r.toUpperCase().replace('_', ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="py-3 px-5">Platform Officer</th>
                <th className="py-3 px-4">Role Assignment</th>
                <th className="py-3 px-4">2FA Protection</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>Loading administrator directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">
                    No administrators matched your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isProtectedSuperAdmin = u.email === 'chauhankunal695@gmail.com' || u.email === 'deadraon@gmail.com';
                  return (
                    <tr key={u.id || u.email} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-black flex items-center justify-center text-xs shadow-xs">
                            {(u.full_name || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-900 leading-tight">
                                {u.full_name || 'Admin User'}
                              </p>
                              {isProtectedSuperAdmin && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                  Primary Root
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          disabled={actionLoading || isProtectedSuperAdmin}
                          className={`text-xs font-bold rounded-xl border px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                            ROLE_COLORS[u.role] || 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {Object.values(ADMIN_ROLES).map(r => (
                            <option key={r} value={r}>
                              {r.toUpperCase().replace('_', ' ')}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {u.totp_enabled ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>2FA Active</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Pending Setup</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-bold text-[11px]">
                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {u.last_login_at ? (
                          new Date(u.last_login_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        ) : (
                          <span className="text-slate-400 italic">Never logged in</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReset2FA(u)}
                            disabled={actionLoading || isProtectedSuperAdmin}
                            title="Reset 2FA Google Authenticator secret"
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={actionLoading || isProtectedSuperAdmin}
                            title={u.is_active ? 'Deactivate access' : 'Activate access'}
                            className={`p-1.5 rounded-xl border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                              u.is_active 
                                ? 'border-rose-200 text-rose-600 hover:bg-rose-50' 
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {u.is_active ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleDeleteAdmin(u)}
                            disabled={actionLoading || isProtectedSuperAdmin}
                            title={isProtectedSuperAdmin ? 'Primary root administrator cannot be removed' : 'Delete administrator account'}
                            className="p-1.5 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add Platform Administrator</h3>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteAdmin} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Administrator Work Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@mymob.tech"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Assigned Operational Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-slate-800 cursor-pointer"
                >
                  {Object.values(ADMIN_ROLES).map(r => (
                    <option key={r} value={r}>
                      {r.toUpperCase().replace('_', ' ')}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  Role can be adjusted later with supervisor audit approval.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Creating...' : 'Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-up">
            <div className="flex items-center gap-2.5 text-slate-900">
              {confirmModal.isDanger ? (
                <div className="p-2 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              )}
              <h3 className="font-bold text-sm leading-tight">{confirmModal.title}</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                disabled={actionLoading}
                className={`px-4 py-2 rounded-xl text-white font-bold transition-all shadow-xs cursor-pointer ${
                  confirmModal.isDanger 
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20' 
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                {confirmModal.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
