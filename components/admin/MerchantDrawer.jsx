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
  ShieldCheck,
  Calendar,
  Save,
  MessageCircle,
  Eye,
  EyeOff,
  Lock,
  Building,
  FileText,
  Trash2
} from 'lucide-react';
import { 
  maskBankAccount, 
  maskPhone, 
  maskUpi, 
  maskApiKey, 
  maskPan, 
  maskGstin 
} from '@/lib/adminMasking';
import { useModalTransition } from '../useModalTransition';

export default function MerchantDrawer({
  merchant,
  onClose,
  onUpdateMerchant,
  onRotateApiKey,
  onExtendSubscription,
  onRequestDelete,
  actionLoading = false,
  showToast,
  getAuthHeaders
}) {
  const [businessName, setBusinessName] = useState(merchant?.business_name || '');
  const [phoneNumber, setPhoneNumber] = useState(merchant?.phone_number || '');
  const [upiId, setUpiId] = useState(merchant?.upi_id || '');
  const [webhookUrl, setWebhookUrl] = useState(merchant?.webhook_url || '');
  const [subscriptionStatus, setSubscriptionStatus] = useState(merchant?.subscription_status || 'active');
  const [testWebhookStatus, setTestWebhookStatus] = useState(null); // { loading, code, msg }

  // Revealed values cache: { [fieldName]: unmaskedValue }
  const [revealedFields, setRevealedFields] = useState({});
  // Unmask modal: { open: boolean, field: string, label: string }
  const [revealModal, setRevealModal] = useState({ open: false, field: '', label: '' });
  const { isMounted: isRevealMounted, modalClass: revealModalClass, overlayClass: revealOverlayClass } = useModalTransition(revealModal.open);
  const lastRevealModalRef = React.useRef(revealModal);
  if (revealModal.open) {
    lastRevealModalRef.current = revealModal;
  }
  const activeRevealModal = revealModal.open ? revealModal : lastRevealModalRef.current;
  const [revealReason, setRevealReason] = useState('');
  const [revealLoading, setRevealLoading] = useState(false);

  // Sync state if merchant prop changes
  useEffect(() => {
    if (merchant) {
      setBusinessName(merchant.business_name || '');
      setPhoneNumber(merchant.phone_number || '');
      setUpiId(merchant.upi_id || '');
      setWebhookUrl(merchant.webhook_url || '');
      setSubscriptionStatus(merchant.subscription_status || 'active');
      setRevealedFields({});
      setTestWebhookStatus(null);
    }
  }, [merchant]);

  if (!merchant) return null;

  const handleCopy = (text, label) => {
    if (!text) return;
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

  // Trigger unmask request
  const submitUnmask = async (e) => {
    e.preventDefault();
    if (!revealReason || revealReason.trim().length < 5) {
      if (showToast) showToast('A reason of at least 5 characters is required for audit justification', 'error');
      return;
    }

    setRevealLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      headers['Content-Type'] = 'application/json';

      const res = await fetch('/api/admin/reveal', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          merchantId: merchant.id,
          field: revealModal.field,
          reason: revealReason.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to unmask credential');
      }

      setRevealedFields(prev => ({
        ...prev,
        [revealModal.field]: data.unmaskedValue
      }));

      if (showToast) showToast(`Revealed ${revealModal.label}. Logged to audit trail.`, 'info');
      setRevealModal({ open: false, field: '', label: '' });
      setRevealReason('');
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setRevealLoading(false);
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
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 text-sm leading-tight">{businessName}</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {subscriptionStatus.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">ID: {merchant.id}</p>
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
              <p className="text-[11px] text-slate-500 font-mono">
                {revealedFields.phone_number || maskPhone(phoneNumber) || merchant.email || 'No contact saved'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {!revealedFields.phone_number && (
                <button
                  type="button"
                  onClick={() => setRevealModal({ open: true, field: 'phone_number', label: 'Phone Number' })}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-[10px] font-bold flex items-center gap-1"
                  title="Unmask Phone"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Reveal</span>
                </button>
              )}
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
                { id: 'inactive', label: 'Inactive', desc: 'Subscription required', color: 'border-amber-300 text-amber-800 bg-amber-50' },
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
              <div className="flex items-center justify-between">
                <label className="text-slate-500 font-semibold">Verified Contact Phone (+91)</label>
                {!revealedFields.phone_number && (
                  <button
                    type="button"
                    onClick={() => setRevealModal({ open: true, field: 'phone_number', label: 'Phone Number' })}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Unmask</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={revealedFields.phone_number || phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-slate-500 font-semibold">Merchant Settlement UPI VPA (Direct NPCI)</label>
                {!revealedFields.upi_id && (
                  <button
                    type="button"
                    onClick={() => setRevealModal({ open: true, field: 'upi_id', label: 'UPI VPA' })}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Unmask</span>
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={revealedFields.upi_id || upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="merchant@upi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Bank Account Details (Masked by default) */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <Building className="w-3.5 h-3.5 text-blue-600" />
                  <span>Direct Settlement Bank Account</span>
                </div>
                {!revealedFields.bank_account_number && (
                  <button
                    type="button"
                    onClick={() => setRevealModal({ open: true, field: 'bank_account_number', label: 'Bank Account' })}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Unmask with Reason</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-sans">Account No</span>
                  <span className="font-bold text-slate-800">
                    {revealedFields.bank_account_number || maskBankAccount(merchant.bank_account_number)}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-sans">IFSC Code</span>
                  <span className="font-bold text-slate-800">
                    {merchant.bank_ifsc || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* API Key Management */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                API Key Credentials (Hashed in Production)
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
                {revealedFields.api_key || maskApiKey(merchant.api_key)}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {!revealedFields.api_key ? (
                  <button
                    onClick={() => setRevealModal({ open: true, field: 'api_key', label: 'API Secret Key' })}
                    className="p-1 text-slate-400 hover:text-slate-800 rounded"
                    title="Audit-verified Unmask"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setRevealedFields(prev => ({ ...prev, api_key: null }))}
                    className="p-1 text-blue-600 hover:text-blue-800 rounded"
                    title="Hide key"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleCopy(revealedFields.api_key || merchant.api_key, 'API Key')}
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
              Extend Subscription Validity (Flat-Fee SaaS)
            </h4>
            <div className="flex items-center gap-2">
              {[
                { days: 7, label: '+7 Days Trial' },
                { days: 30, label: '+30 Days Pro' },
                { days: 365, label: '+1 Year Enterprise' },
              ].map(opt => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => onExtendSubscription && onExtendSubscription(merchant.id, opt.days, merchant.subscription_expires_at)}
                  disabled={actionLoading}
                  className="flex-1 py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Danger Zone: Permanent Account Deletion */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/90 space-y-3">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-rose-950">
                  Danger Zone: Permanent Account Purge
                </h4>
                <p className="text-[11px] text-rose-700 leading-relaxed mt-0.5">
                  Completely erase this merchant, their Supabase Auth account, store credentials, payment orders, payment links, and KYC compliance records from the database. This action is irreversible.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRequestDelete && onRequestDelete(merchant)}
              disabled={actionLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account Completely</span>
            </button>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 flex items-center gap-3">
          <button
            onClick={handleSaveProfile}
            disabled={actionLoading}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Changes</span>
          </button>

          <button
            onClick={onClose}
            className="py-3 px-5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Sensitive Data Reveal Modal (transitions-dev 06-modal.md) */}
      {isRevealMounted && (
        <div 
          className={`fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 ${revealOverlayClass}`}
          onClick={() => {
            setRevealModal({ open: false, field: '', label: '' });
            setRevealReason('');
          }}
        >
          <div 
            role="dialog"
            aria-modal="true"
            className={`bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 ${revealModalClass}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-slate-900 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Audit-Justified Credential Unmask</h3>
                <p className="text-[10px] text-slate-400">NPCI / Data Privacy Audit Requirement</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are requesting to view the raw <strong>{activeRevealModal.label}</strong> for <strong>{businessName}</strong>. This unmask event will be permanently recorded in the tamper-evident audit ledger.
            </p>

            <form onSubmit={submitUnmask} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Reason / Ticket ID for Access (Required)</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Investigating customer dispute #DISP-492 regarding VPA settlement failure"
                  value={revealReason}
                  onChange={(e) => setRevealReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium text-slate-800 resize-none"
                />
                <span className="text-[10px] text-slate-400">Minimum 5 characters justification.</span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRevealModal({ open: false, field: '', label: '' });
                    setRevealReason('');
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revealLoading}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{revealLoading ? 'Authorizing...' : 'Authorize & Reveal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
