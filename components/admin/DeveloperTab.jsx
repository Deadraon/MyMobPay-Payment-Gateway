'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Terminal, 
  Send, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Code2, 
  ExternalLink,
  Search,
  Filter,
  Eye,
  Activity,
  Layers
} from 'lucide-react';
import { useModalTransition } from '../useModalTransition';

export default function DeveloperTab({ showToast, getAuthHeaders }) {
  const [logs, setLogs] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState(null);
  const [inspectedPayload, setInspectedPayload] = useState(null);
  const { isMounted: isPayloadMounted, modalClass, overlayClass } = useModalTransition(Boolean(inspectedPayload));
  const lastPayloadRef = React.useRef(null);
  if (inspectedPayload) {
    lastPayloadRef.current = inspectedPayload;
  }
  const activePayload = inspectedPayload || lastPayloadRef.current;

  const fetchDeveloperData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      const res = await fetch('/api/admin/developer', { headers });
      if (!res.ok) throw new Error('Failed to load webhook logs');
      const data = await res.json();
      setLogs(data.webhook_logs || []);
      setTelemetry(data.api_telemetry);
    } catch (err) {
      if (showToast) showToast('Failed to load developer logs', 'error');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, showToast]);

  useEffect(() => {
    fetchDeveloperData();
  }, [fetchDeveloperData]);

  const handleRetryWebhook = async (logId) => {
    setRetryingId(logId);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      headers['Content-Type'] = 'application/json';
      const res = await fetch('/api/admin/developer', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'retry_webhook', logId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Retry attempt failed');

      if (showToast) showToast(`Dispatched webhook retry! HTTP ${data.updatedLog.http_status}`, 'info');
      fetchDeveloperData();
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Strip */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-600" />
              <span>Developer Platform &amp; Webhook Center</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Signed HMAC-SHA256 Delivery
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Inspect real-time outbound merchant webhook dispatches, replay failed notification calls with exponential backoff, and inspect raw API traffic payload signatures.
          </p>
        </div>

        <button
          onClick={fetchDeveloperData}
          disabled={loading}
          className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* API Telemetry Overview */}
      {telemetry && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">24H API Traffic</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {telemetry.total_api_calls_24h.toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ 100% Core Endpoints Responsive</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mean API Latency</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {telemetry.average_latency_ms}ms
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Fast edge execution</p>
            </div>
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Webhook Error Rate</p>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {telemetry.error_rate_percent}%
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ High merchant deliverability</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Webhook Delivery Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-blue-600" />
              <span>Outbound Webhook Delivery Log</span>
            </h3>
            <p className="text-xs text-slate-400">Real-time payment event notifications pushed to merchant servers</p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 text-left">Event Type</th>
                <th className="px-4 py-3 text-left">Merchant Store</th>
                <th className="px-4 py-3 text-left">Target URL</th>
                <th className="px-4 py-3 text-center">HTTP Status</th>
                <th className="px-4 py-3 text-center">Attempts</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">Loading webhook logs...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-medium">No webhook delivery logs recorded yet.</td>
                </tr>
              ) : (
                logs.map(log => {
                  const isSuccess = log.http_status >= 200 && log.http_status < 300;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {log.event}
                      </td>

                      <td className="px-4 py-3 font-bold text-slate-800">
                        {log.merchant_name}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {log.target_url}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono border ${
                          isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          HTTP {log.http_status}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center font-bold text-slate-700">
                        {log.attempts}x
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectedPayload(log)}
                            className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                            title="Inspect Payload"
                          >
                            <Code2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRetryWebhook(log.id)}
                            disabled={retryingId === log.id}
                            className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-[10px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {retryingId === log.id ? 'Replaying...' : 'Replay'}
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

      {/* Payload Inspector Modal (transitions-dev 06-modal.md) */}
      {isPayloadMounted && activePayload && (
        <div 
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 ${overlayClass}`}
          onClick={() => setInspectedPayload(null)}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className={`bg-slate-950 text-slate-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-800 space-y-4 ${modalClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-sm">Webhook Payload Inspector</h3>
              </div>
              <button onClick={() => setInspectedPayload(null)} className="text-slate-400 hover:text-slate-200">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                <span className="text-slate-500 block">Target Route:</span>
                <span className="text-blue-400 break-all">{activePayload.target_url}</span>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Raw JSON Payload</span>
                <pre className="p-3 rounded-2xl bg-black border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-56">
                  {JSON.stringify(activePayload.payload, null, 2)}
                </pre>
              </div>

              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider block mb-1">Server Response Body</span>
                <pre className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
                  {activePayload.response_body || 'No response body recorded'}
                </pre>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setInspectedPayload(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
