'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDropdownTransition } from '../useDropdownTransition';
import { 
  Mail, 
  Send, 
  UserCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Sparkles, 
  ExternalLink, 
  Check, 
  Copy, 
  ChevronRight, 
  ShieldCheck, 
  Building, 
  Phone, 
  Radio, 
  Eye, 
  Zap, 
  Trash2,
  Users
} from 'lucide-react';

const EMAIL_TEMPLATES = [
  {
    id: 'custom',
    name: 'Blank Custom Email',
    badge: 'Custom',
    subject: '',
    message: '',
    ctaText: 'Open Merchant Portal',
    ctaUrl: 'https://mymob.tech/dashboard'
  },
  {
    id: 'onboarding_phone',
    name: 'Onboarding: Request Contact Number',
    badge: 'Onboarding',
    subject: 'Complete your MyMobPay merchant registration - Contact details required',
    message: `Thank you for signing up on MyMobPay (mymob.tech)!

We noticed you recently registered your account with us. To help you finalize your onboarding and activate 0% fee direct bank & UPI settlements on your account, our onboarding team would like to assist you directly.

Please reply to this email with:
1. Your active Mobile / WhatsApp Contact Number
2. A preferred time for a quick call or message

Once we have your contact details, our team will get in touch to verify your UPI VPA, guide you through testing dynamic QR and intent checkouts, and ensure your merchant portal is active.`,
    ctaText: 'Reply via Portal',
    ctaUrl: 'https://mymob.tech/dashboard'
  },
  {
    id: 'vpa_setup',
    name: 'Settlement: Connect UPI VPA',
    badge: 'Rails Setup',
    subject: 'Action Required: Connect your UPI VPA for Direct 0% Settlements',
    message: `Your MyMobPay merchant account is active and ready to accept payments!

To ensure customer payments land directly in your bank account in real-time with ZERO intermediary escrow or rolling reserves, please connect your primary business UPI VPA.

Steps to complete setup:
1. Log in to your merchant console at mymob.tech/dashboard.
2. Navigate to Settings &gt; Banking &amp; Settlement VPA.
3. Enter your verified bank UPI ID (e.g. yourname@okaxis or store@okhdfcbank).

Customer payments will credit directly to your account immediately with zero commission.`,
    ctaText: 'Configure Settlement VPA',
    ctaUrl: 'https://mymob.tech/dashboard#settings'
  },
  {
    id: 'payment_verification',
    name: 'Payment Support: Transaction Verification',
    badge: 'Operations',
    subject: 'Payment Inquiry & Transaction Verification Update',
    message: `We are writing to provide an operational update regarding a customer payment inquiry for your store.

Our operations desk has cross-verified the customer UTR bank confirmation against the direct UPI rail. If you have any questions or require an updated settlement statement, please review your real-time ledger on your merchant dashboard.

Remember: MyMobPay never holds, pools, or delays merchant funds. All successful customer checkouts settle directly to your registered bank account.`,
    ctaText: 'View Transaction Ledger',
    ctaUrl: 'https://mymob.tech/dashboard#transactions'
  },
  {
    id: 'platform_update',
    name: 'Platform Update: New Features & Upgrades',
    badge: 'Announcement',
    subject: 'MyMobPay Upgrade: Faster UPI Intent & Instant Telemetry Rails',
    message: `We are thrilled to announce a major upgrade to the MyMobPay UPI payment infrastructure!

What's new in this release:
- Instant UPI Intent & Dynamic QR auto-rotation.
- Zero-commission direct bank pass-through with sub-second latency.
- Upgraded merchant analytics and real-time settlement tracking.

Thank you for partnering with MyMobPay as your primary payments infrastructure.`,
    ctaText: 'Explore Merchant Dashboard',
    ctaUrl: 'https://mymob.tech/dashboard'
  },
  {
    id: 'subscription_notice',
    name: 'Subscription: Plan Active & Welcome',
    badge: 'Monetization',
    subject: 'Welcome to MyMobPay Premium - 0% Commission Rails Activated',
    message: `Welcome to MyMobPay! Your flat-fee subscription is active and operational.

With your active plan:
- You enjoy 100% UNLIMITED transactions with 0% commission fees (No MDR).
- Payments credit directly from your customer's bank app to your bank account.
- 24/7 API rails and instant developer webhook notifications.

Log in anytime to generate payment links, integrate dynamic checkout APIs, or review your settlement statement.`,
    ctaText: 'Access Control Center',
    ctaUrl: 'https://mymob.tech/dashboard'
  }
];

export default function EmailsTab({ showToast, getAuthHeaders, merchants = [] }) {
  // Mode: 'merchant' | 'custom' | 'broadcast'
  const [recipientMode, setRecipientMode] = useState('merchant');
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [merchantSearch, setMerchantSearch] = useState('');
  const { isMounted: isSearchDropdownMounted, dropdownClass: searchDropdownClass } = useDropdownTransition(Boolean(merchantSearch.trim()));
  const [customEmail, setCustomEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');

  // Email Content
  const [selectedTemplateId, setSelectedTemplateId] = useState('custom');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeCta, setIncludeCta] = useState(true);
  const [ctaText, setCtaText] = useState('Open Merchant Portal');
  const [ctaUrl, setCtaUrl] = useState('https://mymob.tech/dashboard');

  // Loading & States
  const [sending, setSending] = useState(false);
  const [outbox, setOutbox] = useState([]);
  const [outboxLoading, setOutboxLoading] = useState(false);
  const [providerInfo, setProviderInfo] = useState({ primary: 'Brevo SMTP (Active)', brevo: true });
  const [viewingEmailModal, setViewingEmailModal] = useState(null);
  const [outboxSearch, setOutboxSearch] = useState('');

  // Fetch Outbox History & Provider Status
  const fetchHistory = useCallback(async () => {
    setOutboxLoading(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      const res = await fetch('/api/admin/email/history', { headers });
      if (res.ok) {
        const data = await res.json();
        setOutbox(data.outbox || []);
        if (data.provider) setProviderInfo(data.provider);
      }
    } catch (err) {
      console.warn('Failed to load email history:', err);
    } finally {
      setOutboxLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Load template preset
  const handleSelectTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    const tmpl = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (tmpl) {
      if (tmpl.subject) setSubject(tmpl.subject);
      if (tmpl.message) setMessage(tmpl.message);
      if (tmpl.ctaText) setCtaText(tmpl.ctaText);
      if (tmpl.ctaUrl) setCtaUrl(tmpl.ctaUrl);
    }
  };

  // When a merchant is picked from dropdown
  const handleSelectMerchant = (merchant) => {
    setSelectedMerchantId(merchant.id);
    setRecipientName(merchant.business_name || merchant.owner_name || 'Merchant Partner');
    setCustomEmail(merchant.email || '');
    setMerchantSearch('');
  };

  // Quick button: Send Test to Admin
  const handleSetSendToMe = () => {
    setRecipientMode('custom');
    setCustomEmail('chauhankunal695@gmail.com');
    setRecipientName('Kunal Chauhan (Admin)');
    if (showToast) showToast('Test recipient set to chauhankunal695@gmail.com', 'info');
  };

  // Merchants with valid email list
  const eligibleMerchants = useMemo(() => {
    return (merchants || []).filter(m => m.email && m.email.includes('@'));
  }, [merchants]);

  const filteredMerchantsDropdown = useMemo(() => {
    if (!merchantSearch.trim()) return eligibleMerchants.slice(0, 8);
    const q = merchantSearch.toLowerCase();
    return eligibleMerchants.filter(m => 
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.business_name && m.business_name.toLowerCase().includes(q)) ||
      (m.owner_name && m.owner_name.toLowerCase().includes(q)) ||
      (m.phone_number && m.phone_number.includes(q))
    ).slice(0, 10);
  }, [eligibleMerchants, merchantSearch]);

  // Filtered Outbox
  const filteredOutbox = useMemo(() => {
    if (!outboxSearch.trim()) return outbox;
    const q = outboxSearch.toLowerCase();
    return outbox.filter(item => 
      (item.to && item.to.toLowerCase().includes(q)) ||
      (item.subject && item.subject.toLowerCase().includes(q)) ||
      (item.recipient_name && item.recipient_name.toLowerCase().includes(q))
    );
  }, [outbox, outboxSearch]);

  // Send Direct Email Handler
  const handleSendEmail = async (e) => {
    e.preventDefault();

    let targetEmails = [];
    let targetName = recipientName.trim() || 'Merchant Partner';

    if (recipientMode === 'merchant') {
      if (!customEmail) {
        if (showToast) showToast('Please select a merchant recipient first.', 'error');
        return;
      }
      targetEmails = [customEmail];
    } else if (recipientMode === 'custom') {
      if (!customEmail || !customEmail.includes('@')) {
        if (showToast) showToast('Please enter a valid recipient email address.', 'error');
        return;
      }
      targetEmails = [customEmail.trim()];
    } else if (recipientMode === 'broadcast') {
      const allEmails = eligibleMerchants.map(m => m.email).filter(Boolean);
      if (allEmails.length === 0) {
        if (showToast) showToast('No eligible merchants with email found for broadcast.', 'error');
        return;
      }
      const confirmBroadcast = window.confirm(
        `Are you sure you want to broadcast this email to all ${allEmails.length} registered merchants?`
      );
      if (!confirmBroadcast) return;
      targetEmails = allEmails;
      targetName = 'Merchant Partner';
    }

    if (!subject.trim()) {
      if (showToast) showToast('Please enter an email subject.', 'error');
      return;
    }

    if (!message.trim()) {
      if (showToast) showToast('Please enter your email message body.', 'error');
      return;
    }

    setSending(true);
    try {
      const headers = getAuthHeaders ? await getAuthHeaders() : {};
      headers['Content-Type'] = 'application/json';

      const payload = {
        to: targetEmails.length === 1 ? targetEmails[0] : targetEmails,
        recipientName: targetName,
        subject: subject.trim(),
        message: message.trim(),
        templateType: selectedTemplateId,
        callToActionText: includeCta ? ctaText.trim() : '',
        callToActionUrl: includeCta ? ctaUrl.trim() : '',
        includeBrandedTemplate: true,
        merchantId: selectedMerchantId || null
      };

      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch email.');

      if (showToast) {
        showToast(data.message || `Email sent successfully to ${targetEmails.length} recipient(s)!`, 'info');
      }

      // Refresh outbox
      fetchHistory();

      // Clear or reset form if custom
      if (recipientMode === 'custom' && customEmail !== 'chauhankunal695@gmail.com') {
        setCustomEmail('');
        setRecipientName('');
      }

    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Top Header & Provider Status ──────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Direct Email Communications &amp; Broadcast</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                  Brevo SMTP
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Send custom official announcements, onboarding verification emails, and settlement reminders.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSetSendToMe}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Populate your own admin email for a quick test preview"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Send Test to Me</span>
          </button>

          <button
            onClick={fetchHistory}
            disabled={outboxLoading}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh outbox logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${outboxLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync Outbox</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Status Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Emails Sent</span>
            <Send className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{outbox.length}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Total recorded in outbox</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Active Delivery Rail</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-slate-800 truncate">Brevo SMTP Relay</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected &amp; Verified
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Target Merchants</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{eligibleMerchants.length}</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Registered merchant inboxes</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Sender Identity</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xs font-bold font-mono text-slate-800 truncate">noreply@mymob.tech</div>
          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Reply-To: Kunal Chauhan</div>
        </div>
      </div>

      {/* ── Main Composer & Real-Time Preview Workspace ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Email Compose Form (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span>Compose Direct Email</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Choose your recipient, select a quick preset, and customize.</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 font-medium">UTF-8 HTML</span>
          </div>

          <form onSubmit={handleSendEmail} className="space-y-4">
            {/* 1. Recipient Mode Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Target Audience / Recipient Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRecipientMode('merchant')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    recipientMode === 'merchant'
                      ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/10'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Select Merchant
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('custom')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    recipientMode === 'custom'
                      ? 'bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/10'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Custom Email
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientMode('broadcast')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    recipientMode === 'broadcast'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/10'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Broadcast All ({eligibleMerchants.length})
                </button>
              </div>
            </div>

            {/* Recipient Details based on mode */}
            {recipientMode === 'merchant' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Search &amp; Pick Registered Merchant
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by store name, email or phone..."
                    value={merchantSearch}
                    onChange={(e) => setMerchantSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Dropdown Suggestions (transitions-dev: 05-menu-dropdown.md) */}
                {isSearchDropdownMounted && (
                  <div 
                    className={`max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg divide-y divide-slate-100 ${searchDropdownClass}`}
                    data-origin="top-center"
                  >
                    {filteredMerchantsDropdown.map(m => (
                      <div
                        key={m.id}
                        onClick={() => handleSelectMerchant(m)}
                        className="p-2.5 hover:bg-blue-50/60 cursor-pointer text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{m.business_name || m.owner_name || 'Merchant'}</p>
                          <p className="text-[11px] font-mono text-slate-500">{m.email} {m.phone_number ? `• ${m.phone_number}` : ''}</p>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {m.subscription_status || 'free'}
                        </span>
                      </div>
                    ))}
                    {filteredMerchantsDropdown.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">No merchants matching query.</div>
                    )}
                  </div>
                )}

                {/* Selected merchant indicator */}
                {customEmail && (
                  <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-blue-900 font-bold block">{recipientName || 'Selected Merchant'}</span>
                      <span className="text-blue-700 font-mono text-[11px]">{customEmail}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomEmail('');
                        setSelectedMerchantId('');
                        setRecipientName('');
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 font-bold p-1 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}

            {recipientMode === 'custom' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kunal Chauhan"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Recipient Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="merchant@example.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-mono font-medium"
                  />
                </div>
              </div>
            )}

            {recipientMode === 'broadcast' && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                <strong>Broadcast Notice:</strong> This message will be individually delivered via Brevo to all <strong>{eligibleMerchants.length}</strong> active registered merchants in your system.
              </div>
            )}

            {/* 2. Quick Template Selector */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Quick Template Preset
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {EMAIL_TEMPLATES.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSelectTemplate(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedTemplateId === t.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Subject Line */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Subject Line *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Action Required: Connect your UPI VPA for Direct 0% Settlements"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-bold text-slate-900"
              />
            </div>

            {/* 4. Message Body */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Message Body (HTML / Markdown Supported) *
                </label>
                <span className="text-[10px] text-slate-400">Supports paragraphs &amp; **bold**</span>
              </div>
              <textarea
                required
                rows={7}
                placeholder="Write your direct email message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 leading-relaxed font-sans text-slate-800"
              />
            </div>

            {/* 5. Call to Action Button Toggle */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={includeCta}
                  onChange={(e) => setIncludeCta(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Include Official Call-to-Action Button</span>
              </label>

              {includeCta && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Button Label</span>
                    <input
                      type="text"
                      placeholder="e.g. Open Merchant Portal"
                      value={ctaText}
                      onChange={(e) => setCtaText(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-0.5">Button Target URL</span>
                    <input
                      type="url"
                      placeholder="https://mymob.tech/dashboard"
                      value={ctaUrl}
                      onChange={(e) => setCtaUrl(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 6. Send Button */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                {recipientMode === 'broadcast' 
                  ? `Delivering to ${eligibleMerchants.length} merchants` 
                  : `Delivering to ${customEmail || 'recipient'}`}
              </span>

              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispatching via Brevo...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Direct Email Now</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Visual Email Preview (5 cols) */}
        <div className="lg:col-span-5 bg-slate-100/90 border border-slate-200/90 rounded-3xl p-5 shadow-xs space-y-3 sticky top-20">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800">Live Recipient Preview</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white text-slate-500 border border-slate-200">
              Desktop &bull; Mobile
            </span>
          </div>

          {/* Email Visual Card Mockup */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 max-h-[560px] overflow-y-auto">
            {/* Header with MyMobPay Mark */}
            <div className="text-center pb-3 border-b border-slate-100 flex items-center justify-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                M
              </div>
              <div className="text-left">
                <span className="font-extrabold text-sm text-[#0c2340] tracking-tight block leading-tight">MyMobPay</span>
                <span className="text-[8.5px] uppercase tracking-wider text-slate-400 font-bold block">Direct Bank UPI Rails</span>
              </div>
            </div>

            {/* Subject Badge */}
            <div className="space-y-1">
              <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-bold uppercase tracking-wider">
                Official Communication
              </span>
              <h4 className="font-bold text-slate-900 text-sm leading-snug">
                {subject || 'Subject line will appear here...'}
              </h4>
            </div>

            {/* Greeting */}
            <p className="text-xs font-bold text-slate-800">
              Hello {recipientName.trim() || 'Merchant Partner'},
            </p>

            {/* Message Body */}
            <div className="text-xs text-slate-600 leading-relaxed space-y-2 whitespace-pre-line">
              {message || 'Type your email message on the left to see the instant live preview here.'}
            </div>

            {/* Action Button Preview */}
            {includeCta && ctaText && (
              <div className="text-center py-2">
                <div className="inline-block px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs">
                  {ctaText} &rarr;
                </div>
              </div>
            )}

            {/* Security Pill */}
            <div className="p-2.5 rounded-xl bg-slate-50 border-l-4 border-blue-600 text-[10px] text-slate-500 leading-relaxed">
              <strong>Zero-Commission Rails:</strong> MyMobPay delivers customer UPI payments directly to your linked bank account with 0% transaction fees.
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center space-y-1">
              <p className="font-bold text-slate-700">MyMobPay Merchant Operations Team</p>
              <p>&copy; 2026 MyMobPay Payments Private Limited &bull; mymob.tech</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Section: Outbox History Log ─────────────────────────── */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Direct Email Dispatch Ledger (Outbox)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live audit record of all emails sent from the admin dashboard.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search outbox records..."
              value={outboxSearch}
              onChange={(e) => setOutboxSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3 text-left">Recipient</th>
                <th className="px-4 py-3 text-left">Subject &amp; Snippet</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Sent Time (IST)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {outboxLoading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2" />
                    Loading outbox records...
                  </td>
                </tr>
              ) : filteredOutbox.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No dispatched emails found in outbox history.
                  </td>
                </tr>
              ) : (
                filteredOutbox.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-900 block">{item.recipient_name || 'Recipient'}</span>
                      <span className="font-mono text-[11px] text-slate-500">{item.to}</span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <span className="font-bold text-slate-800 block truncate">{item.subject}</span>
                      <span className="text-[11px] text-slate-400 block truncate mt-0.5">{item.snippet || 'No snippet'}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {item.template_type || 'custom'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {item.sent_at ? new Date(item.sent_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Just now'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.status === 'delivered' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Delivered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSubject(item.subject);
                          setMessage(item.snippet || '');
                          setCustomEmail(item.to);
                          setRecipientName(item.recipient_name || '');
                          setRecipientMode('custom');
                          if (showToast) showToast('Loaded into composer', 'info');
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2 py-1 rounded hover:bg-blue-50 cursor-pointer"
                      >
                        Reuse Draft
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
