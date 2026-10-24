'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Clock, 
  User, 
  ExternalLink,
  ChevronRight,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Lock,
  FileText
} from 'lucide-react';
import { useModalTransition } from '../useModalTransition';

export default function AuditTab({ showToast, getAuthHeaders }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLogForModal, setSelectedLogForModal] = useState(null);
  const { isMounted: isModalMounted, modalClass, overlayClass } = useModalTransition(Boolean(selectedLogForModal));
  const lastLogRef = React.useRef(null);
  if (selectedLogForModal) {
    lastLogRef.current = selectedLogForModal;
  }
  const activeLog = selectedLogForModal || lastLogRef.current;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      const res = await fetch('/api/admin/audit?limit=150', { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
      if (showToast) showToast('Failed to load audit trail', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (actionFilter !== 'all' && log.action !== actionFilter) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchActor = (log.actor_email || '').toLowerCase().includes(q);
      const matchAction = (log.action || '').toLowerCase().includes(q);
      const matchTarget = (log.target_id || '').toLowerCase().includes(q);
      const matchDetails = JSON.stringify(log.details || {}).toLowerCase().includes(q);

      return matchActor || matchAction || matchTarget || matchDetails;
    });
  }, [logs, actionFilter, searchQuery]);

  const handleExportCsv = () => {
    if (filteredLogs.length === 0) {
      if (showToast) showToast('No logs to export', 'error');
      return;
    }

    const headers = ['Timestamp (IST)', 'Actor Email', 'Role', 'Action', 'Target Type', 'Target ID', 'IP Address', 'Details'];
    const rows = filteredLogs.map(l => [
      new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      l.actor_email,
      l.actor_role,
      l.action,
      l.target_type,
      l.target_id,
      l.ip_address,
      JSON.stringify(l.details || {}).replace(/"/g, '""')
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + 
      [headers.join(','), ...rows.map(e => `"${e.join('","')}"`)].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mymobpay_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) showToast('Audit trail exported successfully!', 'info');
  };

  const getActionBadge = (action) => {
    if (action.includes('verify') || action.includes('activated') || action.includes('approved')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('reject') || action.includes('deactivated') || action.includes('block')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('reveal')) {
      return 'bg-amber-50 text-amber-800 border-amber-300 font-extrabold animate-pulse';
    }
    if (action.includes('rotate') || action.includes('key')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner & Stats */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Immutable Audit Trail
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Append-only compliance log. Records every administrative decision, manual UTR verification, account suspension, key rotation, and sensitive data unmasking.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by actor email, action, target ID, or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-800"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Actions ({logs.length})</option>
          <option value="order.manual_verify">Manual UTR Verify</option>
          <option value="order.manual_reject">Manual UTR Reject</option>
          <option value="merchant.status_change">Merchant Status Toggle</option>
          <option value="merchant.profile_update">Merchant Profile Edit</option>
          <option value="api_key.rotated">API Key Rotated</option>
          <option value="subscription.extended">Subscription Extended</option>
          <option value="data.reveal">Sensitive Data Reveal</option>
          <option value="admin_user.created">Admin User Created</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp (IST)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Resource</th>
                <th className="py-3 px-4">IP / Forensics</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-purple-500" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900">{log.actor_email}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold uppercase">
                          {log.actor_role}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="text-slate-600 font-bold uppercase text-[10px] mr-1.5">
                        {log.target_type}:
                      </span>
                      <span className="font-mono text-slate-800 text-[11px]">
                        {log.target_id ? log.target_id.slice(0, 16) : 'N/A'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {log.ip_address || 'internal'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => setSelectedLogForModal(log)}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Inspector Modal (transitions-dev 06-modal.md) */}
      {isModalMounted && activeLog && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 ${overlayClass}`}
          onClick={() => setSelectedLogForModal(null)}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className={`bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 ${modalClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Audit Entry Forensics
                </h3>
              </div>
              <button
                onClick={() => setSelectedLogForModal(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl font-mono text-[11px]">
                <div><span className="text-slate-400">Action:</span> <strong>{activeLog.action}</strong></div>
                <div><span className="text-slate-400">Role:</span> <strong>{activeLog.actor_role}</strong></div>
                <div><span className="text-slate-400">Actor:</span> {activeLog.actor_email}</div>
                <div><span className="text-slate-400">IP:</span> {activeLog.ip_address}</div>
              </div>

              <div>
                <p className="font-bold text-slate-700 mb-1 text-[11px]">Action Details &amp; Payload:</p>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-60">
                  {JSON.stringify(activeLog.details || {}, null, 2)}
                </pre>
              </div>

              <p className="text-[10px] text-slate-400 font-mono">
                Entry ID: {activeLog.id} • User-Agent: {activeLog.user_agent}
              </p>
            </div>

            <button
              onClick={() => setSelectedLogForModal(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
