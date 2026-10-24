'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Play, 
  Sliders, 
  RefreshCw,
  Lock,
  Phone,
  Globe,
  Smartphone,
  CreditCard
} from 'lucide-react';
import { useModalTransition } from '../useModalTransition';

export default function RiskTab({ showToast, getAuthHeaders }) {
  const [blocklist, setBlocklist] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filter & Search
  const [searchBlocklist, setSearchBlocklist] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { isMounted: isAddMounted, modalClass: addModalClass, overlayClass: addOverlayClass } = useModalTransition(isAddOpen);
  const [newItemType, setNewItemType] = useState('phone');
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemReason, setNewItemReason] = useState('');

  const [dryRunResults, setDryRunResults] = useState(null);
  const [isDryRunning, setIsDryRunning] = useState(false);

  const fetchRiskData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      const res = await fetch('/api/admin/risk', { headers });
      if (!res.ok) throw new Error('Failed to load risk rules and blocklist');
      const data = await res.json();
      setBlocklist(data.blocklist || []);
      setRules(data.rules || []);
    } catch (err) {
      if (showToast) showToast('Failed to load risk center data', 'error');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    fetchRiskData();
  }, [fetchRiskData]);

  const handleAddBlocklist = async (e) => {
    e.preventDefault();
    if (!newItemValue.trim()) return;

    setActionLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/risk', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'add_blocklist',
          item: {
            type: newItemType,
            value: newItemValue.trim(),
            reason: newItemReason.trim()
          }
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add blocklist item');

      if (showToast) showToast(`Added ${newItemValue} to platform blocklist!`, 'info');
      setIsAddOpen(false);
      setNewItemValue('');
      setNewItemReason('');
      fetchRiskData();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveBlocklist = async (id, value) => {
    if (!confirm(`Unblock ${value}?`)) return;
    setActionLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/risk', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'remove_blocklist', id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to remove item');

      if (showToast) showToast(`Removed ${value} from blocklist`, 'info');
      fetchRiskData();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRule = async (ruleId, currentEnabled, currentDryRun, toggleField) => {
    setActionLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/risk', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'toggle_rule',
          ruleId,
          enabled: toggleField === 'enabled' ? !currentEnabled : currentEnabled,
          isDryRun: toggleField === 'dryRun' ? !currentDryRun : currentDryRun
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update rule');

      if (showToast) showToast('Risk rule updated and logged to audit', 'info');
      fetchRiskData();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDryRunSimulation = async () => {
    setIsDryRunning(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/risk', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'dry_run_evaluation' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed');

      setDryRunResults(data.dryRunResults);
      if (showToast) showToast('Dry-run completed against live checkout traffic', 'info');
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setIsDryRunning(false);
    }
  };

  const filteredBlocklist = blocklist.filter(b => {
    const matchesSearch = 
      b.value.toLowerCase().includes(searchBlocklist.toLowerCase()) ||
      (b.reason && b.reason.toLowerCase().includes(searchBlocklist.toLowerCase()));
    const matchesType = typeFilter === 'all' || b.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Risk, Fraud &amp; Velocity Control</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              {blocklist.length} Blocklisted Entities
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Multi-layered defense against replay attacks, rapid burst checkouts, and abusive VPAs. Configure heuristic thresholds and execute non-blocking dry-runs before production enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDryRunSimulation}
            disabled={isDryRunning}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 text-blue-600 ${isDryRunning ? 'animate-spin' : ''}`} />
            <span>{isDryRunning ? 'Simulating...' : 'Dry-Run Rules'}</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Block Entity</span>
          </button>
        </div>
      </div>

      {/* Dry Run Simulation Results Banner */}
      {dryRunResults && (
        <div className="p-5 rounded-3xl bg-slate-900 text-slate-100 border border-slate-800 shadow-xl space-y-3 animate-scale-up">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <strong className="text-white">Dry-Run Evaluation Report</strong>
            </div>
            <button
              onClick={() => setDryRunResults(null)}
              className="text-slate-400 hover:text-slate-200 text-xs font-mono"
            >
              Dismiss ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-bold">Orders Inspected</span>
              <span className="text-xl font-black text-white">{dryRunResults.totalEvaluated}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-bold">Simulated Flags</span>
              <span className="text-xl font-black text-amber-400">{dryRunResults.flaggedCount}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-[10px] text-slate-400 block font-bold">Simulated Action</span>
              <span className="text-xs font-bold text-blue-400">{dryRunResults.simulatedAction}</span>
            </div>
          </div>
        </div>
      )}

      {/* Section 1: Active Velocity & Anomaly Rules */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <span>Configurable Velocity &amp; Anomaly Rules</span>
          </h3>
          <span className="text-[11px] font-mono text-slate-400">NPCI Compliance Safeguards</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div key={rule.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs leading-tight">{rule.name}</h4>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">{rule.condition}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                  rule.rule_type === 'fraud' ? 'bg-rose-100 text-rose-800' :
                  rule.rule_type === 'velocity' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {rule.rule_type}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-[10px] font-bold uppercase">Mode:</span>
                  <button
                    onClick={() => handleToggleRule(rule.id, rule.enabled, rule.dry_run, 'dryRun')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-colors cursor-pointer ${
                      rule.dry_run ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    {rule.dry_run ? 'Dry-Run Only' : 'Active Enforcement'}
                  </button>
                </div>

                <button
                  onClick={() => handleToggleRule(rule.id, rule.enabled, rule.dry_run, 'enabled')}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-black border transition-colors cursor-pointer ${
                    rule.enabled ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}
                >
                  {rule.enabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Blocklist Registry Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-600" />
              <span>Platform Blocklist Registry</span>
            </h3>
            <p className="text-xs text-slate-400">Pre-emptively blocks checkout initiation for banned entities</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search blocklist..."
                value={searchBlocklist}
                onChange={(e) => setSearchBlocklist(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-medium"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="phone">Phone</option>
              <option value="vpa">UPI VPA</option>
              <option value="ip">IP Address</option>
              <option value="device">Device</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 text-left">Blocked Entity</th>
                <th className="px-4 py-3 text-left">Entity Type</th>
                <th className="px-4 py-3 text-left">Flag Reason</th>
                <th className="px-4 py-3 text-left">Added By</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredBlocklist.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-400">
                    No blocklist entries match your criteria.
                  </td>
                </tr>
              ) : (
                filteredBlocklist.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {item.value}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium max-w-xs truncate">
                      {item.reason}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400">
                      {item.added_by}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveBlocklist(item.id, item.value)}
                        disabled={actionLoading}
                        className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Unblock entity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Blocklist Modal (transitions-dev 06-modal.md) */}
      {isAddMounted && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 ${addOverlayClass}`}
          onClick={() => setIsAddOpen(false)}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className={`bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 ${addModalClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Add Entity to Blocklist</h3>
              </div>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAddBlocklist} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Entity Type</label>
                <select
                  value={newItemType}
                  onChange={(e) => setNewItemType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-bold"
                >
                  <option value="phone">Customer Phone (+91)</option>
                  <option value="vpa">Customer UPI VPA</option>
                  <option value="ip">IPv4 / IPv6 Address</option>
                  <option value="device">Device Fingerprint ID</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Entity Identifier / Value</label>
                <input
                  type="text"
                  required
                  placeholder={newItemType === 'phone' ? '+91 9876543210' : newItemType === 'vpa' ? 'badactor@upi' : '192.168.1.1'}
                  value={newItemValue}
                  onChange={(e) => setNewItemValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Mandatory Justification / Incident ID</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Repeated fraudulent UTR attempts on merchant ID #m_921"
                  value={newItemReason}
                  onChange={(e) => setNewItemReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-medium resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Add to Blocklist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
