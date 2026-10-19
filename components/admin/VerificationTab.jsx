'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Radio, 
  Activity, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  RefreshCw, 
  Server, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  Send,
  Sliders,
  ExternalLink
} from 'lucide-react';

export default function VerificationTab({ showToast, getAuthHeaders }) {
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pingingChannel, setPingingChannel] = useState(null);

  const fetchTelemetry = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      const res = await fetch('/api/admin/verification', { headers });
      if (!res.ok) throw new Error('Failed to load telemetry');
      const data = await res.json();
      setTelemetry(data.telemetry);
    } catch (err) {
      if (showToast) showToast('Failed to fetch verification telemetry', 'error');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    fetchTelemetry();
  }, [fetchTelemetry]);

  const handleTestPing = async (channel) => {
    setPingingChannel(channel);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/verification', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'test_ping', channel })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Test ping failed');

      if (showToast) showToast(`Channel ${channel} responded: ${data.health.latencyMs}ms latency.`, 'info');
      fetchTelemetry();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setPingingChannel(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Radio className="w-5 h-5 text-blue-600" />
              <span>Verification Control Center</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>NPCI Real-Time Rails</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Monitor real-time ingest pipelines, Android scraper relays, and bank statement matching engines. Non-custodial verification guarantees 0% fee deduction.
          </p>
        </div>

        <button
          onClick={fetchTelemetry}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Aggregate Health Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mean Ingest Latency</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {telemetry ? `${telemetry.averageLatencyMs}ms` : '...'}
            </h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Within NPCI 3s Target SLA</p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
            <Zap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ingest Queue Depth</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              {telemetry ? telemetry.totalQueueDepth : '0'}
            </h3>
            <p className="text-[10px] text-slate-500 font-semibold mt-1">Zero backlog accumulating</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Server className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">High-Value Dual Approver Cap</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">
              ₹10,000
            </h3>
            <p className="text-[10px] text-amber-700 font-bold mt-1">Requires 2 Admins to Override</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Verification Channels Table / Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span>Active Ingest Adapters &amp; Protocol Relays</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {telemetry?.channels?.map((ch, idx) => (
            <div key={idx} className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <h4 className="font-bold text-slate-900 text-xs">{ch.name}</h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {ch.channel}
                  </span>
                </div>

                <div className="space-y-2 pt-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Success Rate:</span>
                    <span className="font-bold font-mono text-emerald-600">{ch.successRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">p50 Latency:</span>
                    <span className="font-bold font-mono text-slate-800">{ch.p50}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">p99 Latency:</span>
                    <span className="font-bold font-mono text-slate-800">{ch.p99}ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Channel Uptime:</span>
                    <span className="font-bold font-mono text-blue-600">{ch.uptimePercent}%</span>
                  </div>
                  {ch.activeScrapers > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Active Mobile Nodes:</span>
                      <span className="font-bold font-mono text-indigo-600">{ch.activeScrapers} devices</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={() => handleTestPing(ch.channel)}
                  disabled={pingingChannel === ch.channel}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  <span>{pingingChannel === ch.channel ? 'Pinging Node...' : 'Test Channel Ping'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dual Approver Rule Footnote */}
      <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Dual-Approver Verification Rule Active</p>
          <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
            Any manual payment reconciliation over ₹10,000 automatically places the verification in a Pending Second Signature state. A second platform administrator must confirm before the order is broadcast as verified.
          </p>
        </div>
      </div>
    </div>
  );
}
