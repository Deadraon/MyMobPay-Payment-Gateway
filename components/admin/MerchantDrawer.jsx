'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Store, 
  Phone, 
  Mail, 
  Key, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  Calendar,
  Save,
  MessageCircle,
  Eye,
  EyeOff
} from 'lucide-react';

export default function MerchantDrawer({
  merchant,
  onClose,
  onUpdateMerchant,
  onRotateApiKey,
  onExtendSubscription,
  actionLoading = false,
  showToast
}) {
  const [businessName, setBusinessName] = useState(merchant?.business_name || '');
  const [phoneNumber, setPhoneNumber] = useState(merchant?.phone_number || '');
  const [upiId, setUpiId] = useState(merchant?.upi_id || '');
  const [webhookUrl, setWebhookUrl] = useState(merchant?.webhook_url || '');
  const [subscriptionStatus, setSubscriptionStatus] = useState(merchant?.subscription_status || 'active');
  const [isKeyRevealed, setIsKeyRevealed] = useState(false);
  const [testWebhookStatus, setTestWebhookStatus] = useState(null); // { loading, code, msg }

  // Sync state if merchant prop changes
  React.useEffect(() => {
    if (merchant) {
      setBusinessName(merchant.business_name || '');
      setPhoneNumber(merchant.phone_number || '');
      setUpiId(merchant.upi_id || '');
      setWebhookUrl(merchant.webhook_url || '');
      setSubscriptionStatus(merchant.subscription_status || 'active');
      setIsKeyRevealed(false);
      setTestWebhookStatus(null);
    }
  }, [merchant]);

  if (!merchant) return null;

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    if (showToast) showToast(`Copied ${label} to clipboard!`, 'info');
  };

  const handleSaveProfile = async () => {
    if (onUpdateMerchant) {
      await onUpdateMerchant(merchant.id, {
        business_name: businessName,
        phone_number: phoneNumber,
        upi_id: upiId,
        webhook_url: webhookUrl,
        subscription_status: subscriptionStatus
      });
    }
  };

  const handleSendTestWebhook = async () => {
    if (!webhookUrl) {
      if (showToast) showToast('Please configure a webhook URL first', 'error');
      return;
    }
    setTestWebhookStatus({ loading: true });
    try {
      const res = await fetch('/api/merchant/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhook_url: webhookUrl })
      });
      const data = await res.json();
      setTestWebhookStatus({ 
        loading: false, 
        code: res.status, 
        success: res.ok, 
        message: data.message || (res.ok ? 'HTTP 200 OK received' : 'Delivery failed') 
      });
      if (showToast) {
        showToast(res.ok ? 'Webhook ping delivered successfully!' : 'Webhook endpoint returned error', res.ok ? 'info' : 'error');
      }
    } catch (err) {
      setTestWebhookStatus({ loading: false, code: 500, success: false, message: err.message });
      if (showToast) showToast(`Webhook test failed: ${err.message}`, 'error');
    }
  };

  const cleanPhone = (phoneNumber || '').replace(/\D/g, '');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 animate-slideInRight overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
              {businessName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm leading-tight">{businessName}</h3>
              <p className="text-[10px] text-slate-400 font-mono">ID: {merchant.id.slice(0, 8)}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-1 text-xs">
          
          {/* Quick Communication Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div>
              <p className="font-bold text-slate-900">Direct Merchant Contact</p>
              <p className="text-[11px] text-slate-500 font-mono">{phoneNumber || merchant.email || 'No contact saved'}</p>
            </div>
            <div className="flex items-center gap-1.5">
              {cleanPhone && (
                <a
                  href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1 font-bold"
                  title="Chat on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
              {merchant.email && (
                <a
                  href={`mailto:${merchant.email}`}
                  className="p-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors"
                  title="Send Email"
                >
                  <Mail className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Account Status & Risk Controls */}
          <div className="space-y-2">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Operational State &amp; Risk Control
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'active', label: 'Active', desc: 'Accepting checkouts', color: 'border-emerald-300 text-emerald-800 bg-emerald-50' },
                { id: 'frozen', label: 'Frozen / Suspend', desc: 'Halt all links', color: 'border-rose-300 text-rose-800 bg-rose-50' },
                { id: 'trial', label: 'Trial Mode', desc: '3-day evaluation', color: 'border-blue-300 text-blue-800 bg-blue-50' },
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSubscriptionStatus(st.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    subscriptionStatus === st.id ? `${st.color} font-black shadow-xs` : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <p className="font-bold text-xs">{st.label}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{st.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Profile Inputs */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Profile &amp; Bank Settings
            </h4>

            <div className="space-y-1">
              <label className="text-slate-500 font-semibold">Business Store Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-semibold">Verified Contact Phone (+91)</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-500 font-semibold">Merchant Settlement UPI VPA</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="merchant@upi"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* API Key Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                API Key Credentials
              </h4>
              <button
                onClick={() => onRotateApiKey && onRotateApiKey(merchant.id)}
                disabled={actionLoading}
                className="text-[10px] font-bold text-rose-600 hover:text-rose-800 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Rotate Key</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 font-mono">
              <span className="text-slate-700 truncate">
                {isKeyRevealed ? (merchant.api_key || 'No key generated') : '••••••••••••••••••••••••••••••••'}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setIsKeyRevealed(!isKeyRevealed)}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded"
                >
                  {isKeyRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => handleCopy(merchant.api_key, 'API Key')}
                  className="p-1 text-slate-400 hover:text-slate-800 rounded"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Webhook Configuration & Test Console */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Outbound Webhook Route
              </h4>
              <button
                onClick={handleSendTestWebhook}
                disabled={testWebhookStatus?.loading}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>{testWebhookStatus?.loading ? 'Sending...' : 'Test Webhook Ping'}</span>
              </button>
            </div>

            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://api.yourbusiness.com/webhook"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-medium text-slate-800 focus:outline-none focus:border-blue-500"
            />

            {testWebhookStatus && !testWebhookStatus.loading && (
              <div className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between ${
                testWebhookStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                <span>{testWebhookStatus.message}</span>
                <span className="font-bold font-mono">HTTP {testWebhookStatus.code}</span>
              </div>
            )}
          </div>

          {/* Subscription Validity Extension */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Extend Subscription Validity
            </h4>
            <div className="flex items-center gap-2">
              {[
                { days: 7, label: '+7 Days Trial' },
                { days: 30, label: '+30 Days Pro' },
                { days: 365, label: '+1 Year' },
              ].map(opt => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => onExtendSubscription && onExtendSubscription(merchant.id, opt.days, merchant.subscription_expires_at)}
                  disabled={actionLoading}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex items-center gap-3">
          <button
            onClick={handleSaveProfile}
            disabled={actionLoading}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Changes</span>
          </button>

          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
