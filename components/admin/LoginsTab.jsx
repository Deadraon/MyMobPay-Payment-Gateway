'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LogIn, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Clock, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink,
  Smartphone,
  Globe,
  Calendar,
  Zap,
  Users,
  Activity,
  ArrowUpRight
} from 'lucide-react';

export default function LoginsTab({ showToast, getAuthHeaders, onSelectMerchant }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLogins = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      const res = await fetch('/api/admin/logins', { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error('Failed to load login activity:', err);
      if (showToast) showToast('Failed to load recent logins', 'error');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    fetchLogins();
  }, [fetchLogins]);

  // Auto-refresh interval (every 30s if enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogins();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogins]);

  // Format IST dates cleanly
  const formatIST = (isoString) => {
    if (!isoString) return 'Never';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  // Format relative time (e.g. "2 hours ago")
  const getRelativeTime = (isoString) => {
    if (!isoString) return 'Never';
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffSec = Math.floor((now - then) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return `${Math.floor(diffSec / 604800)}w ago`;
  };

  const logins = data?.logins || [];
  const summary = data?.summary || { totalUsers: 0, loginsToday: 0, loginsThisWeek: 0, googleOAuthUsers: 0 };

  // Filtered logins list
  const filteredLogins = useMemo(() => {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return logins.filter(user => {
      // Provider filter
      if (providerFilter !== 'all' && user.provider !== providerFilter) return false;

      // Role filter
      if (roleFilter === 'admin' && !user.isAdmin) return false;
      if (roleFilter === 'merchant' && user.isAdmin) return false;

      // Timeframe filter
      if (timeFilter === 'today' && user.last_sign_in_ms < oneDayAgo) return false;
      if (timeFilter === 'week' && user.last_sign_in_ms < sevenDaysAgo) return false;
      if (timeFilter === 'month' && user.last_sign_in_ms < thirtyDaysAgo) return false;

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchEmail = (user.email || '').toLowerCase().includes(q);
      const matchName = (user.fullName || '').toLowerCase().includes(q);
      const matchPhone = (user.phoneNumber || '').toLowerCase().includes(q);
      const matchStore = (user.businessName || '').toLowerCase().includes(q);
      const matchUpi = (user.upiId || '').toLowerCase().includes(q);

      return matchEmail || matchName || matchPhone || matchStore || matchUpi;
    });
  }, [logins, providerFilter, timeFilter, roleFilter, searchQuery]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredLogins.length === 0) {
      if (showToast) showToast('No logins to export', 'error');
      return;
    }

    const headers = [
      'Full Name',
      'Email',
      'Auth Method',
      'Last Sign-in (IST)',
      'Account Created (IST)',
      'Store Name',
      'Settlement UPI',
      'WhatsApp Phone',
      'Subscription Plan',
      'Role'
    ];

    const rows = filteredLogins.map(u => [
      u.fullName || '',
      u.email,
      u.provider === 'google' ? 'Google Workspace' : 'Email / OTP',
      formatIST(u.last_sign_in_at),
      formatIST(u.created_at),
      u.businessName || '',
      u.upiId || '',
      u.phoneNumber || '',
      u.subscriptionStatus || '',
      u.isAdmin ? 'Super Admin' : 'Merchant'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => `"${e.join('","')}"`)].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mymobpay_recent_logins_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) showToast('Login activity exported successfully!', 'info');
  };

  return (
    <div className="space-y-6">

      {/* ── HEADER BANNER ──────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Recent Website Logins</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time user authentication audit, active session timestamps, and identity verification logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 cursor-pointer ${
              autoRefresh 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-300'}`} />
            <span>{autoRefresh ? 'Live Polling (30s)' : 'Auto Refresh: Off'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={fetchLogins}
            disabled={loading}
            className="p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ──────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Active Today */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Active Today (24h)</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{summary.loginsToday}</h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Daily Active Users</span>
            <span className="font-bold text-emerald-600">{summary.loginsToday > 0 ? 'Active Stream' : 'None today'}</span>
          </div>
        </div>

        {/* Weekly Active */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Weekly Active (7d)</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{summary.loginsThisWeek}</h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>7-Day Return Rate</span>
            <span className="font-bold text-indigo-600">
              {summary.totalUsers > 0 ? `${Math.round((summary.loginsThisWeek / summary.totalUsers) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Total Registered Accounts */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Total Users</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{summary.totalUsers}</h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Auth Accounts</span>
            <span className="font-bold text-blue-600">Verified</span>
          </div>
        </div>

        {/* Google Workspace Ratio */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Google OAuth</p>
              <h3 className="text-3xl font-black text-slate-900 mt-2">{summary.googleOAuthUsers}</h3>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>1-Click SSO Adoption</span>
            <span className="font-bold text-amber-600">
              {summary.totalUsers > 0 ? `${Math.round((summary.googleOAuthUsers / summary.totalUsers) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

      </section>

      {/* ── SEARCH & FILTER CONTROLS ───────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user name, email, phone number, or store name..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Provider Filter */}
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Auth Methods</option>
            <option value="google">Google Workspace</option>
            <option value="email">Email / OTP</option>
          </select>

          {/* Timeframe Filter */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Time</option>
            <option value="today">Today (24h)</option>
            <option value="week">Past 7 Days</option>
            <option value="month">Past 30 Days</option>
          </select>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="merchant">Merchants Only</option>
            <option value="admin">Super Admins Only</option>
          </select>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

        </div>
      </div>

      {/* ── DETAILED LOGINS TABLE ──────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">User Authentication Stream</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {filteredLogins.length} login record{filteredLogins.length !== 1 ? 's' : ''} sorted by most recent sign-in
            </p>
          </div>

          <span className="text-[11px] font-bold text-slate-400">
            Database UTC &bull; Rendered in IST (+05:30)
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Retrieving recent authentication logs...</p>
          </div>
        ) : filteredLogins.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <LogIn className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No login records found</p>
            <p className="text-xs text-slate-400">Try clearing your search query or timeframe filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 text-[10px] font-extrabold uppercase tracking-widest text-slate-500 border-b border-slate-100">
                  <th className="px-5 py-3.5">User & Identity</th>
                  <th className="px-4 py-3.5">Auth Method</th>
                  <th className="px-4 py-3.5">Last Login (IST)</th>
                  <th className="px-4 py-3.5">Store & Settlement UPI</th>
                  <th className="px-4 py-3.5">WhatsApp Phone</th>
                  <th className="px-4 py-3.5">Plan Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogins.map((user) => {
                  const isGoogle = user.provider === 'google';

                  return (
                    <tr 
                      key={user.id} 
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* User & Identity */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {user.avatar ? (
                            <img 
                              src={user.avatar} 
                              alt={user.fullName} 
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" 
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 border border-slate-200">
                              {user.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-extrabold text-slate-900 truncate">
                                {user.fullName}
                              </span>
                              {user.isAdmin && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-purple-100 text-purple-700 border border-purple-200">
                                  Super Admin
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5 font-medium">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Auth Method */}
                      <td className="px-4 py-3.5">
                        {isGoogle ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                              <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.66-5.17 3.66-9.12z" fill="#4285F4"></path>
                              <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.36 7.33 24 12 24z" fill="#34A853"></path>
                              <path d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z" fill="#FBBC05"></path>
                              <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z" fill="#EA4335"></path>
                            </svg>
                            <span>Google Workspace</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>Email / OTP</span>
                          </div>
                        )}
                      </td>

                      {/* Last Login Time */}
                      <td className="px-4 py-3.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-slate-900">
                              {getRelativeTime(user.last_sign_in_at)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({formatIST(user.last_sign_in_at).split(',')[0]})
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            {formatIST(user.last_sign_in_at).split(',')[1] || ''}
                          </p>
                        </div>
                      </td>

                      {/* Store & UPI */}
                      <td className="px-4 py-3.5">
                        <div className="max-w-[180px]">
                          <p className="font-bold text-slate-900 truncate">{user.businessName}</p>
                          <p className="font-mono text-[10px] text-blue-600 truncate mt-0.5">{user.upiId}</p>
                        </div>
                      </td>

                      {/* WhatsApp Phone */}
                      <td className="px-4 py-3.5">
                        {user.phoneNumber ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-semibold font-mono">
                            <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{user.phoneNumber}</span>
                            {user.phoneVerified && (
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Not linked</span>
                        )}
                      </td>

                      {/* Plan Status */}
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          user.subscriptionStatus === 'active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : user.subscriptionStatus === 'trial_3day' 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {user.subscriptionStatus}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        {onSelectMerchant ? (
                          <button
                            onClick={() => onSelectMerchant(user)}
                            className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 font-bold text-[11px] transition-all cursor-pointer inline-flex items-center gap-1 border border-slate-200"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
