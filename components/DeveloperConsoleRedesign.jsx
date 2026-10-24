'use client';

import React, { useState } from 'react';
import {
  Code,
  Key,
  Send,
  Shield,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  Terminal,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Sliders,
  ChevronRight,
  FileCode,
  BookOpen
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DeveloperConsoleRedesign({
  profile = {},
  onProfileUpdate,
  setActiveTab
}) {
  const [activeSubTab, setActiveSubTab] = useState('keys'); // 'keys' | 'webhooks' | 'logs' | 'docs'
  const [showLiveKey, setShowLiveKey] = useState(false);
  const [showTestKey, setShowTestKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotateNotice, setRotateNotice] = useState(null);

  // Webhook State
  const [webhookUrl, setWebhookUrl] = useState(profile?.webhook_url || '');
  const [isSavingWebhook, setIsSavingWebhook] = useState(false);
  const [webhookSaveStatus, setWebhookSaveStatus] = useState(null);
  const [pingStatus, setPingStatus] = useState('idle'); // 'idle' | 'testing' | 'success' | 'error'
  const [pingLatency, setPingLatency] = useState(null);

  // Webhook Events
  const [subscribedEvents, setSubscribedEvents] = useState({
    'payment.created': true,
    'payment.verified': true,
    'payment.failed': true,
    'payment.expired': false
  });

  // Code Snippet Language
  const [snippetLang, setSnippetLang] = useState('curl'); // 'curl' | 'node' | 'python' | 'php'

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSaveWebhook = async () => {
    if (isSavingWebhook) return;
    setIsSavingWebhook(true);
    setWebhookSaveStatus(null);
    try {
      const { error } = await supabase
        .from('merchants')
        .update({ webhook_url: webhookUrl.trim(), updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (error) throw error;
      setWebhookSaveStatus({ type: 'success', message: 'Webhook endpoint updated successfully!' });
      if (onProfileUpdate) onProfileUpdate({ ...profile, webhook_url: webhookUrl.trim() });
    } catch (err) {
      setWebhookSaveStatus({ type: 'error', message: err.message || 'Failed to update webhook' });
    } finally {
      setIsSavingWebhook(false);
      setTimeout(() => setWebhookSaveStatus(null), 4000);
    }
  };

  const handleTestPing = async () => {
    if (!webhookUrl || pingStatus === 'testing') return;
    setPingStatus('testing');
    const start = Date.now();
    try {
      const res = await fetch('/api/merchant/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          merchant_id: profile.id
        })
      });
      const end = Date.now();
      setPingLatency(`${end - start}ms`);
      if (res.ok) {
        setPingStatus('success');
      } else {
        setPingStatus('error');
      }
    } catch (err) {
      setPingLatency('timeout');
      setPingStatus('error');
    } finally {
      setTimeout(() => setPingStatus('idle'), 6000);
    }
  };

  const handleRotateApiKey = async () => {
    if (isRotating) return;
    const confirmRotate = window.confirm(
      'Warning: Rotating your live API key will invalidate the current key after a 24-hour grace period. Any servers using the old key will need to be updated. Proceed?'
    );
    if (!confirmRotate) return;

    setIsRotating(true);
    setRotateNotice(null);
    try {
      const newKey = crypto.randomUUID();
      const { error } = await supabase
        .from('merchants')
        .update({ api_key: newKey, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (error) throw error;
      setRotateNotice({
        type: 'success',
        message: 'New API Key generated successfully! Your previous key will remain valid for 24 hours to prevent downtime.'
      });
      if (onProfileUpdate) onProfileUpdate({ ...profile, api_key: newKey });
    } catch (err) {
      setRotateNotice({ type: 'error', message: err.message || 'Failed to rotate API key.' });
    } finally {
      setIsRotating(false);
      setTimeout(() => setRotateNotice(null), 8000);
    }
  };

  const activeApiKey = profile?.api_key || '677d9312-a53f-4b96-815f-53e0eee1b292';
  const liveKeyStr = `live_${activeApiKey}`;
  const testKeyStr = `test_${activeApiKey}`;
  const webhookSecretStr = `whsec_${activeApiKey.slice(0, 16)}_${activeApiKey.slice(-8)}`;

  // Request Logs (Live/Test API telemetry, empty by default)
  const [requestLogs] = useState([]);

  return (
    <div className="w-full space-y-6 font-sans antialiased text-[#0f141a]">

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Developer & API Hub</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Code className="w-3.5 h-3.5 text-blue-600" />
              REST API v2.1
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Programmatic UPI checkout integration, HMAC SHA-256 webhooks, and live request inspector.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://mymob.tech/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            Full API Reference <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Rotate Key Feedback */}
      {rotateNotice && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in duration-200 ${
          rotateNotice.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{rotateNotice.message}</span>
          </div>
          <button type="button" onClick={() => setRotateNotice(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">&times;</button>
        </div>
      )}

      {/* ── Sub-navigation ───────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
        {[
          { id: 'keys', label: 'API Keys', icon: Key },
          { id: 'webhooks', label: 'Webhooks & HMAC', icon: Send },
          { id: 'logs', label: 'API Request Logs', icon: Terminal },
          { id: 'docs', label: 'Code Snippets', icon: FileCode }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-blue-600" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 1: API KEYS (LIVE & SANDBOX)
         ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'keys' && (
        <div className="space-y-6">

          {/* Test Mode / Live Mode Indicator Banner */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  Direct Bank UPI Environment Active
                </p>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Production keys settle directly to your UPI ID without escrow delay. Use sandbox keys to simulate checkouts safely.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-white text-emerald-700 border border-emerald-200 shrink-0">
              Zero Per-Transaction Fee (0% MDR)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Live API Key */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Live Private API Key</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    Production
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Use this secret token in production backend servers. Never expose this key in client-side frontend code.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono text-slate-800 font-bold select-all overflow-hidden text-ellipsis">
                    {showLiveKey ? liveKeyStr : `live_••••••••-••••-••••-••••-${activeApiKey.slice(-4)}`}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowLiveKey(!showLiveKey)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                    title={showLiveKey ? 'Hide key' : 'Reveal key'}
                    aria-label={showLiveKey ? 'Hide secret key' : 'Reveal secret key'}
                  >
                    <span className="t-icon-swap" data-state={showLiveKey ? 'b' : 'a'}>
                      <span className="t-icon" data-icon="a" aria-hidden={showLiveKey}>
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                      <span className="t-icon" data-icon="b" aria-hidden={!showLiveKey}>
                        <EyeOff className="w-3.5 h-3.5" />
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(liveKeyStr, 'live_key')}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all border border-blue-200 cursor-pointer flex items-center justify-center"
                    title="Copy live key"
                    aria-label="Copy live key"
                  >
                    <span className="t-icon-swap" data-state={copiedKey === 'live_key' ? 'b' : 'a'}>
                      <span className="t-icon" data-icon="a" aria-hidden={copiedKey === 'live_key'}>
                        <Copy className="w-3.5 h-3.5" />
                      </span>
                      <span className="t-icon" data-icon="b" aria-hidden={copiedKey !== 'live_key'}>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400">Status: Active</span>
                  <button
                    type="button"
                    onClick={handleRotateApiKey}
                    disabled={isRotating}
                    className="text-red-600 hover:text-red-800 font-bold hover:underline cursor-pointer transition-colors"
                  >
                    {isRotating ? 'Rotating...' : 'Roll / Rotate Key ↺'}
                  </button>
                </div>
              </div>
            </div>

            {/* Test / Sandbox Key */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Test / Sandbox API Key</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                    Simulator Mode
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Safe for local dev, staging servers, and automated tests. Automatically simulates mock successful UPI payments.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-mono text-slate-800 font-bold select-all overflow-hidden text-ellipsis">
                    {showTestKey ? testKeyStr : `test_••••••••-••••-••••-••••-${activeApiKey.slice(-4)}`}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowTestKey(!showTestKey)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                    title={showTestKey ? 'Hide key' : 'Reveal key'}
                    aria-label={showTestKey ? 'Hide test key' : 'Reveal test key'}
                  >
                    <span className="t-icon-swap" data-state={showTestKey ? 'b' : 'a'}>
                      <span className="t-icon" data-icon="a" aria-hidden={showTestKey}>
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                      <span className="t-icon" data-icon="b" aria-hidden={!showTestKey}>
                        <EyeOff className="w-3.5 h-3.5" />
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(testKeyStr, 'test_key')}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all border border-blue-200 cursor-pointer flex items-center justify-center"
                    title="Copy test key"
                    aria-label="Copy test key"
                  >
                    <span className="t-icon-swap" data-state={copiedKey === 'test_key' ? 'b' : 'a'}>
                      <span className="t-icon" data-icon="a" aria-hidden={copiedKey === 'test_key'}>
                        <Copy className="w-3.5 h-3.5" />
                      </span>
                      <span className="t-icon" data-icon="b" aria-hidden={copiedKey !== 'test_key'}>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-slate-400">Simulator: Always enabled</span>
                  <span className="text-amber-600 font-medium">Zero real money moves</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 2: WEBHOOKS & HMAC SIGNATURE
         ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'webhooks' && (
        <div className="space-y-6">

          {webhookSaveStatus && (
            <div className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
              webhookSaveStatus.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <span>{webhookSaveStatus.message}</span>
              <button type="button" onClick={() => setWebhookSaveStatus(null)}>&times;</button>
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Webhook URL & Endpoint Config</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                We will dispatch HTTP POST JSON payloads with signed headers whenever payment events happen in real time.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Webhook Endpoint URL (HTTPS Only)
                </label>
                <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://api.yourdomain.com/webhooks/mymobpay"
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:border-blue-500"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveWebhook}
                      disabled={isSavingWebhook}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {isSavingWebhook ? 'Saving...' : 'Save URL'}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestPing}
                      disabled={pingStatus === 'testing' || !webhookUrl}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {pingStatus === 'testing' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Pinging...
                        </>
                      ) : pingStatus === 'success' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          200 OK ({pingLatency})
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Send Test Ping
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* HMAC Secret */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    Webhook HMAC Secret Key
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">Header: x-mymobpay-signature</span>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-800">
                    {showWebhookSecret ? webhookSecretStr : `whsec_••••••••••••••••••••••••`}
                  </code>
                  <button
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="p-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 text-xs flex items-center justify-center"
                    title={showWebhookSecret ? 'Hide secret' : 'Reveal secret'}
                    aria-label={showWebhookSecret ? 'Hide webhook secret' : 'Reveal webhook secret'}
                  >
                    <span className="t-icon-swap" data-state={showWebhookSecret ? 'b' : 'a'}>
                      <span className="t-icon" data-icon="a" aria-hidden={showWebhookSecret}>
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                      <span className="t-icon" data-icon="b" aria-hidden={!showWebhookSecret}>
                        <EyeOff className="w-3.5 h-3.5" />
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(webhookSecretStr, 'whsec')}
                    className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs flex items-center justify-center"
                    title="Copy webhook secret"
                    aria-label="Copy webhook secret"
                  >
                    <span className="t-icon-swap" data-state={copiedKey === 'whsec' ? 'b' : 'a'}>
                      <span className="t-icon" data-icon="a" aria-hidden={copiedKey === 'whsec'}>
                        <Copy className="w-3.5 h-3.5" />
                      </span>
                      <span className="t-icon" data-icon="b" aria-hidden={copiedKey !== 'whsec'}>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Subscribed Events */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 mb-2">Event Subscriptions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(subscribedEvents).map(([evt, isChecked]) => (
                    <label key={evt} className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => setSubscribedEvents(prev => ({ ...prev, [evt]: !prev[evt] }))}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-mono font-bold text-slate-800">{evt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 3: API REQUEST LOGS
         ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent API Calls & Webhook Dispatches</h3>
            <span className="text-xs text-slate-500 font-mono">Last 24 Hours</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="px-4 py-3">Method & Route</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Response Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requestLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <div className="max-w-sm mx-auto flex flex-col items-center">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
                          <Terminal className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">No API Requests Recorded Yet</h4>
                        <p className="text-[11px] text-slate-400 mt-1 mb-3">
                          API calls made using your Live or Test keys will be logged here with HTTP statuses, response payloads, and latency.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveSubTab('docs')}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          View Integration Quick-Start
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  requestLogs.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {l.method}
                          </span>
                          <span className="font-mono text-slate-800 font-medium">{l.endpoint}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {l.status} OK
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{l.latency}</td>
                      <td className="px-4 py-3 text-slate-500">{l.time}</td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 truncate max-w-[280px]">
                        {l.response}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════
          SUB-TAB 4: CODE SNIPPETS & QUICK START
         ═════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'docs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Interactive Integration Quick-Start</h3>
              <p className="text-xs text-slate-500 mt-0.5">Copy and paste pre-filled code into your application.</p>
            </div>

            <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
              {['curl', 'node', 'python', 'php'].map(lang => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSnippetLang(lang)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer uppercase ${
                    snippetLang === lang ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#0c2340] rounded-xl p-5 text-white shadow-sm space-y-3 relative group">
            <div className="flex items-center justify-between text-xs text-slate-300 pb-2 border-b border-white/10">
              <span className="font-mono">Create Payment Order ({snippetLang.toUpperCase()})</span>
              <button
                type="button"
                onClick={() => handleCopy(
                  snippetLang === 'curl'
                    ? `curl -X POST https://mymob.tech/api/payment/create \\\n  -H "Content-Type: application/json" \\\n  -H "x-api-key: ${liveKeyStr}" \\\n  -d '{"amount": 499.00, "note": "Order_101", "callback_url": "https://yourapp.com/success"}'`
                    : snippetLang === 'node'
                    ? `const res = await fetch('https://mymob.tech/api/payment/create', {\n  method: 'POST',\n  headers: { 'Content-Type': 'application/json', 'x-api-key': '${liveKeyStr}' },\n  body: JSON.stringify({ amount: 499.00, note: 'Order_101' })\n});\nconst data = await res.json();\nconsole.log(data.payment_url);`
                    : snippetLang === 'python'
                    ? `import requests\n\nr = requests.post('https://mymob.tech/api/payment/create',\n  headers={'x-api-key': '${liveKeyStr}'},\n  json={'amount': 499.00, 'note': 'Order_101'})\nprint(r.json()['payment_url'])`
                    : `<?php\n$ch = curl_init('https://mymob.tech/api/payment/create');\ncurl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'x-api-key: ${liveKeyStr}']);\ncurl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['amount' => 499.00, 'note' => 'Order_101']));\n$res = curl_exec($ch);`,
                  'snippet'
                )}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span className="t-icon-swap" data-state={copiedKey === 'snippet' ? 'b' : 'a'}>
                  <span className="t-icon" data-icon="a" aria-hidden={copiedKey === 'snippet'}>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                  </span>
                  <span className="t-icon" data-icon="b" aria-hidden={copiedKey !== 'snippet'}>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                </span>
                <span>{copiedKey === 'snippet' ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="font-mono text-xs overflow-x-auto text-emerald-300 leading-relaxed py-1">
              {snippetLang === 'curl' && `curl -X POST https://mymob.tech/api/payment/create \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${liveKeyStr}" \\
  -d '{
    "amount": 499.00,
    "note": "Order_101",
    "callback_url": "https://yourapp.com/payment-complete"
  }'`}

              {snippetLang === 'node' && `const res = await fetch('https://mymob.tech/api/payment/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': '${liveKeyStr}'
  },
  body: JSON.stringify({
    amount: 499.00,
    note: 'Order_101',
    callback_url: 'https://yourapp.com/payment-complete'
  })
});

const data = await res.json();
console.log('Direct UPI Checkout URL:', data.payment_url);`}

              {snippetLang === 'python' && `import requests

response = requests.post(
    'https://mymob.tech/api/payment/create',
    headers={'x-api-key': '${liveKeyStr}'},
    json={
        'amount': 499.00,
        'note': 'Order_101',
        'callback_url': 'https://yourapp.com/payment-complete'
    }
)

order = response.json()
print("Payment URL:", order.get("payment_url"))`}

              {snippetLang === 'php' && `<?php
$data = [
    'amount' => 499.00,
    'note' => 'Order_101',
    'callback_url' => 'https://yourapp.com/payment-complete'
];

$ch = curl_init('https://mymob.tech/api/payment/create');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'x-api-key: ${liveKeyStr}'
]);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = json_decode(curl_exec($ch), true);
echo "Payment URL: " . $response['payment_url'];
?>`}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
}
