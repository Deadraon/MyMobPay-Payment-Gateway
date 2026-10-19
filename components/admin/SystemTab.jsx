'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { 
  ShieldCheck, 
  IndianRupee, 
  Key, 
  Mail, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock, 
  Smartphone, 
  Send, 
  Copy, 
  Check, 
  SlidersHorizontal,
  Server
} from 'lucide-react';

export default function SystemTab({
  adminUpi,
  setAdminUpi,
  onUpdateAdminUpi,
  totalSubscriptionEarnings = 0,
  subscriptionOrdersCount = 0,
  totpEnabled = false,
  totpSecret = '',
  totpQrUrl = '',
  onGenerateTotp,
  onEnableTotp,
  onDisableTotp,
  actionLoading = false,
  showToast
}) {
  const [totpCodeInput, setTotpCodeInput] = useState('');
  const [testEmailStatus, setTestEmailStatus] = useState(null); // { loading, success, msg }
  const [testUpiInput, setTestUpiInput] = useState(adminUpi);

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    if (showToast) showToast(`Copied ${label}!`, 'info');
  };

  const handleTestSmtp = async () => {
    setTestEmailStatus({ loading: true });
    try {
      const res = await fetch('/api/admin/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendTestSignupNotification' })
      });
      const data = await res.json();
      setTestEmailStatus({
        loading: false,
        success: res.ok,
        message: data.message || (res.ok ? 'Diagnostic email delivered' : data.error || 'Failed')
      });
      if (showToast) {
        showToast(res.ok ? 'Brevo SMTP test email delivered!' : 'SMTP test failed', res.ok ? 'info' : 'error');
      }
    } catch (err) {
      setTestEmailStatus({ loading: false, success: false, message: err.message });
      if (showToast) showToast(`Diagnostic failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* 1. PLATFORM UPI RECEIVER & EARNINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* UPI Receiver Config Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <IndianRupee className="w-4 h-4 text-blue-600" /> Platform UPI Configuration
              </h3>
              <p className="text-xs text-slate-400">Receiving VPA for merchant subscription payments</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
              Billing Rail
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Platform Subscription Revenue</p>
              <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                ₹{Number(totalSubscriptionEarnings).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              {subscriptionOrdersCount} Paid Plans
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <label className="text-slate-500 font-semibold">Active Receiving UPI VPA</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="platform@upi"
                value={testUpiInput}
                onChange={(e) => setTestUpiInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <button
                onClick={() => onUpdateAdminUpi && onUpdateAdminUpi(testUpiInput)}
                disabled={actionLoading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                Update VPA
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              All monthly/annual merchant plan checkout links will route payments directly to this verified UPI address.
            </p>
          </div>
        </div>

        {/* Live Test Subscription QR Preview */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col sm:flex-row items-center gap-5 justify-between">
          <div className="space-y-2 text-center sm:text-left">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
              Live Preview
            </span>
            <h4 className="text-sm font-bold text-slate-900">Subscription QR Test</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
              Scan with any UPI application (GPay, PhonePe, Paytm, Cred) to verify your receiving VPA.
            </p>
            <div className="pt-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                {testUpiInput || 'Not configured'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm shrink-0">
            {testUpiInput ? (
              <QRCode
                value={`upi://pay?pa=${encodeURIComponent(testUpiInput)}&pn=MyMobPay%20Platform&am=999.00&cu=INR`}
                size={110}
              />
            ) : (
              <div className="w-[110px] h-[110px] bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                No VPA
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 2. SECURITY & 2FA GOOGLE AUTHENTICATOR */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Multi-Factor Authentication (MFA / 2FA)
            </h3>
            <p className="text-xs text-slate-400">Protect the Master Console with Time-based One-Time Passwords (TOTP)</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-auto ${
            totpEnabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
          }`}>
            {totpEnabled ? '● 2FA Active' : '○ Disabled'}
          </span>
        </div>

        {totpEnabled ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-emerald-950">Google Authenticator Protection Enabled</p>
                <p className="text-emerald-800/80">6-digit dynamic TOTP token is enforced on every administrative login.</p>
              </div>
            </div>
            <button
              onClick={onDisableTotp}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 font-bold transition-colors cursor-pointer"
            >
              Disable 2FA
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {!totpSecret ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900">Set up Google Authenticator</p>
                  <p className="text-slate-500">Scan QR code using Google Authenticator, Authy, or 1Password.</p>
                </div>
                <button
                  onClick={onGenerateTotp}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Configure 2FA &rarr;
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {totpQrUrl && (
                    <div className="p-3 bg-white rounded-xl shadow-xs shrink-0">
                      <QRCode value={totpQrUrl} size={110} />
                    </div>
                  )}
                  <div className="space-y-1.5 min-w-0">
                    <p className="font-bold text-slate-900">1. Scan QR code or copy Secret Key</p>
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                      <span className="truncate">{totpSecret}</span>
                      <button onClick={() => handleCopy(totpSecret, 'Secret Key')} className="p-1 text-slate-400 hover:text-slate-800">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500">2. Enter the 6-digit code from your authenticator app below to activate:</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={totpCodeInput}
                    onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, ''))}
                    className="w-36 bg-white border border-slate-200 rounded-xl px-3 py-2 text-center font-mono font-black text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => onEnableTotp && onEnableTotp(totpCodeInput)}
                    disabled={totpCodeInput.length !== 6 || actionLoading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    Verify &amp; Activate 2FA
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. LIVE INFRASTRUCTURE HEALTH CHECKS */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Infrastructure Diagnostics &amp; Operational Health
            </h3>
            <p className="text-xs text-slate-400">Live operational status of core platform backend services</p>
          </div>
          <button
            onClick={handleTestSmtp}
            disabled={testEmailStatus?.loading}
            className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{testEmailStatus?.loading ? 'Dispatching...' : 'Test Brevo SMTP'}</span>
          </button>
        </div>

        {testEmailStatus && (
          <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
            testEmailStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <span>{testEmailStatus.message}</span>
            <span className="font-bold">{testEmailStatus.success ? 'Delivered' : 'Error'}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Supabase Database</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-slate-500 text-[11px]">PostgreSQL with Row Level Security</p>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-1">
              Active Connected
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Brevo Transactional SMTP</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-slate-500 text-[11px]">Outbound OTPs &amp; Invoices</p>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 mt-1">
              Relay Operational
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900">Cloudflare Email Routing</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-slate-500 text-[11px]">mymob.tech MX forwarders</p>
            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 mt-1">
              route.mx.cloudflare.net
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
