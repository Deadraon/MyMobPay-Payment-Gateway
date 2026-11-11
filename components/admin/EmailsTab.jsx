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
  Users,
  Server,
  Layers,
  Gauge,
  Activity,
  Shield
} from 'lucide-react';

const SENDER_FORMAT_OPTIONS = [
  {
    id: 'auto',
    name: 'Auto (Contextual)',
    email: 'Dynamic Auto-Detection',
    displayName: 'Contextual Dispatch',
    badge: 'Recommended',
    description: 'Selects auth@, trx@, or noreply@ automatically based on message intent'
  },
  {
    id: 'auth',
    name: 'Security & Auth',
    email: 'auth@mymobpay.tech',
    displayName: 'MyMobPay Security',
    badge: 'OTP & Security',
    description: 'High-reputation channel for OTPs, 2FA codes, password resets & verification'
  },
  {
    id: 'trx',
    name: 'Billing & Invoices',
    email: 'trx@mymobpay.tech',
    displayName: 'MyMobPay Billing',
    badge: 'Statements & Tax',
    description: 'Dedicated financial sender for invoices, tax receipts & settlement ledgers'
  },
  {
    id: 'noreply',
    name: 'Platform Announcements',
    email: 'noreply@mymobpay.tech',
    displayName: 'MyMobPay Support',
    badge: 'Broadcast & Notices',
    description: 'General system sender for onboarding guides, updates & maintenance alerts'
  }
];

const PROVIDER_OPTIONS = [
  {
    id: 'auto',
    name: 'Auto (Smart Multi-Rail)',
    shortName: 'Smart Auto',
    dailyLimit: 1500,
    badge: 'Recommended',
    desc: 'Dynamic circuit breaker failover across all 6 active email rails'
  },
  {
    id: 'emaillabs',
    name: 'EmailLabs SMTP',
    shortName: 'EmailLabs',
    dailyLimit: 300,
    badge: '300/day',
    desc: 'Dedicated SMTP relay via smtp-relay.emaillabs.net.pl (apex domain verified)'
  },
  {
    id: 'unitpost',
    name: 'Unitpost API / SMTP',
    shortName: 'Unitpost',
    dailyLimit: 200,
    badge: '200/day',
    desc: 'Direct REST API & SMTP delivery on apex domain @mymobpay.tech'
  },
  {
    id: 'maileroo',
    name: 'Maileroo SMTP',
    shortName: 'Maileroo',
    dailyLimit: 100,
    badge: '100/day',
    desc: 'Reliable transactional tier (~3,000/mo buffer) on smtp.maileroo.com'
  },
  {
    id: 'sendpulse',
    name: 'SendPulse SMTP',
    shortName: 'SendPulse',
    dailyLimit: 500,
    badge: '500/day',
    desc: 'High-volume statement & invoice relay via smtp-pulse.com'
  },
  {
    id: 'brevo',
    name: 'Brevo SMTP',
    shortName: 'Brevo',
    dailyLimit: 300,
    badge: '300/day',
    desc: 'Direct relay via smtp-relay.brevo.com'
  },
  {
    id: 'resend',
    name: 'Resend API / SMTP',
    shortName: 'Resend',
    dailyLimit: 100,
    badge: '100/day',
    desc: 'Developer API delivery on smtp.resend.com'
  }
];

const EMAIL_TEMPLATES = [
  {
    id: 'custom',
    name: 'Blank Custom Email',
    badge: 'Custom',
    subject: '',
    message: '',
    ctaText: 'Open Merchant Portal',
    ctaUrl: 'https://mymobpay.tech/dashboard'
  },
  {
    id: 'onboarding_phone',
    name: 'Onboarding: Request Contact Number',
    badge: 'Onboarding',
    subject: 'Complete your MyMobPay merchant registration - Contact details required',
    message: `Thank you for signing up on MyMobPay (mymobpay.tech)!

We noticed you recently registered your account with us. To help you finalize your onboarding and activate 0% fee direct bank & UPI settlements on your account, our onboarding team would like to assist you directly.

Please reply to this email with:
1. Your active Mobile / WhatsApp Contact Number
2. A preferred time for a quick call or message

Once we have your contact details, our team will get in touch to verify your UPI VPA, guide you through testing dynamic QR and intent checkouts, and ensure your merchant portal is active.`,
    ctaText: 'Reply via Portal',
    ctaUrl: 'https://mymobpay.tech/dashboard'
  },
  {
    id: 'vpa_setup',
    name: 'Settlement: Connect UPI VPA',
    badge: 'Rails Setup',
    subject: 'Action Required: Connect your UPI VPA for Direct 0% Settlements',
    message: `Your MyMobPay merchant account is active and ready to accept payments!

To ensure customer payments land directly in your bank account in real-time with ZERO intermediary escrow or rolling reserves, please connect your primary business UPI VPA.

Steps to complete setup:
1. Log in to your merchant console at mymobpay.tech/dashboard.
2. Navigate to Settings &gt; Banking &amp; Settlement VPA.
3. Enter your verified bank UPI ID (e.g. yourname@okaxis or store@okhdfcbank).

Customer payments will credit directly to your account immediately with zero commission.`,
    ctaText: 'Configure Settlement VPA',
    ctaUrl: 'https://mymobpay.tech/dashboard#settings'
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
    ctaUrl: 'https://mymobpay.tech/dashboard#transactions'
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
    ctaUrl: 'https://mymobpay.tech/dashboard'
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
    ctaUrl: 'https://mymobpay.tech/dashboard'
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
  const [ctaUrl, setCtaUrl] = useState('https://mymobpay.tech/dashboard');

  // Loading & States
  const [sending, setSending] = useState(false);
  const [outbox, setOutbox] = useState([]);
  const [outboxLoading, setOutboxLoading] = useState(false);
  const [providerInfo, setProviderInfo] = useState({ primary: 'Brevo SMTP (Active)', brevo: true });
  const [viewingEmailModal, setViewingEmailModal] = useState(null);
  const [outboxSearch, setOutboxSearch] = useState('');

  // Provider & Sender Format Administration
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [selectedSenderFormat, setSelectedSenderFormat] = useState('auto');
  const [providerQuotas, setProviderQuotas] = useState([]);
  const [combinedQuota, setCombinedQuota] = useState({
    totalLimit: 1500,
    totalSentToday: 0,
    totalRemaining: 1500,
    activeProvidersCount: 6
  });
  const [telemetryDate, setTelemetryDate] = useState('');

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
        if (data.providers) setProviderQuotas(data.providers);
        if (data.combined) setCombinedQuota(data.combined);
        if (data.date) setTelemetryDate(data.date);
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
      (item.recipient_name && item.recipient_name.toLowerCase().includes(q)) ||
      (item.provider && item.provider.toLowerCase().includes(q)) ||
      (item.sender_format && item.sender_format.toLowerCase().includes(q))
    );
  }, [outbox, outboxSearch]);

  const quotaMap = useMemo(() => {
    const map = {};
    for (const p of providerQuotas) {
      map[p.id] = p;
    }
    return map;
  }, [providerQuotas]);

  const currentSenderPreview = useMemo(() => {
    switch (selectedSenderFormat) {
      case 'auth':
        return { name: 'MyMobPay Security', email: 'auth@mymobpay.tech', badge: 'Security & 2FA' };
      case 'trx':
        return { name: 'MyMobPay Billing', email: 'trx@mymobpay.tech', badge: 'Statements & Tax' };
      case 'noreply':
        return { name: 'MyMobPay Support', email: 'noreply@mymobpay.tech', badge: 'Announcements' };
      case 'auto':
      default:
        return { name: 'MyMobPay Operations', email: 'noreply@mymobpay.tech', badge: 'Smart Contextual' };
    }
  }, [selectedSenderFormat]);

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
        merchantId: selectedMerchantId || null,
        provider: selectedProvider,
        senderFormat: selectedSenderFormat
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
      {/* ── Top Header & Actions ───────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Direct Email Communications &amp; Broadcast</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-800">
                  Smart Failover (6 Providers)
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
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Populate your own admin email for a quick test preview"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Send Test to Me</span>
          </button>

          <button
            onClick={fetchHistory}
            disabled={outboxLoading}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh outbox logs & quota telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${outboxLoading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Sync Quotas &amp; Outbox</span>
          </button>
        </div>
      </div>

      {/* ── 1. Combined Left Emails & Delivery Capacity Banner ─────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs bg-gradient-to-br from-slate-50/80 via-white to-blue-50/30">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold font-mono tracking-wider uppercase bg-blue-100 text-blue-700 border border-blue-200/80 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Daily Telemetry &bull; IST
              </span>
              <span className="text-[11px] text-slate-500 font-mono font-medium">
                {telemetryDate || new Date().toISOString().slice(0, 10)}
              </span>
            </div>

            <div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <h3 className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-slate-900">
                  {(combinedQuota.totalRemaining ?? 1500).toLocaleString()}
                </h3>
                <span className="text-sm font-bold text-slate-700">
                  emails left today
                </span>
                <span className="text-xs font-mono font-semibold text-slate-400">
                  / {(combinedQuota.totalLimit ?? 1500).toLocaleString()} daily capacity
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1.5 max-w-xl leading-relaxed">
                Aggregated 24-hour transmission allowance across {combinedQuota.activeProvidersCount || 6} active delivery rails. Resets automatically at 00:00 IST.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-80 bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-semibold">Daily Utilization</span>
              <span className="font-mono font-bold text-slate-900">
                {combinedQuota.totalSentToday || 0} sent today
              </span>
            </div>

            {/* Capacity Progress Bar */}
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300/50">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (combinedQuota.totalRemaining ?? 1500) < 200
                    ? 'bg-rose-500'
                    : (combinedQuota.totalRemaining ?? 1500) < 600
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{
                  width: `${Math.min(100, Math.max(3, Math.round(((combinedQuota.totalRemaining ?? 1500) / (combinedQuota.totalLimit || 1500)) * 100)))}%`
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-medium">
              <span className="text-slate-600 font-semibold">
                {Math.round(((combinedQuota.totalRemaining ?? 1500) / (combinedQuota.totalLimit || 1500)) * 100)}% Available
              </span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {combinedQuota.activeProvidersCount || 6} Rails Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Per-Provider Daily Quota Cards (6 Active Rails) ─────────── */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Individual Rail Daily Limits &amp; Health
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Click any rail to lock as manual provider
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {PROVIDER_OPTIONS.filter(p => p.id !== 'auto').map((p) => {
            const tele = quotaMap[p.id] || {};
            const limit = tele.dailyLimit || p.dailyLimit;
            const sent = tele.sentToday || 0;
            const remaining = tele.remaining != null ? tele.remaining : Math.max(0, limit - sent);
            const isSelected = selectedProvider === p.id;
            const isConfigured = tele.isConfigured !== false;
            const isCircuitLimited = tele.circuit ? tele.circuit.isLimited : false;
            const percentLeft = limit > 0 ? Math.round((remaining / limit) * 100) : 0;

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProvider(isSelected ? 'auto' : p.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-blue-50/90 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-slate-800 truncate" title={p.name}>
                    {p.shortName}
                  </span>
                  <div className="flex items-center gap-1">
                    {!isConfigured && (
                      <span className="text-[9px] font-semibold text-slate-400 bg-slate-100 px-1 py-0.5 rounded">
                        Not Set
                      </span>
                    )}
                    <span
                      className={`w-2 h-2 rounded-full ${
                        !isConfigured
                          ? 'bg-slate-300'
                          : isCircuitLimited
                          ? 'bg-amber-500 animate-pulse'
                          : 'bg-emerald-500'
                      }`}
                      title={!isConfigured ? 'Provider credentials not configured' : isCircuitLimited ? 'In cooldown' : 'Operational'}
                    />
                  </div>
                </div>

                <div className="text-lg font-extrabold font-mono text-slate-900 leading-tight">
                  {remaining}
                  <span className="text-[11px] font-medium text-slate-500 ml-1">left</span>
                </div>

                <div className="text-[11px] font-mono text-slate-600 mt-1 flex items-center justify-between font-medium">
                  <span>{sent} sent</span>
                  <span className="text-slate-400">/{limit}</span>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2 border border-slate-200/50">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      !isConfigured
                        ? 'bg-slate-300'
                        : percentLeft < 20
                        ? 'bg-rose-500'
                        : percentLeft < 50
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, percentLeft))}%` }}
                  />
                </div>

                {isSelected && (
                  <span className="mt-2 block text-center text-[9px] font-bold text-blue-700 bg-blue-100/90 rounded-md py-0.5 uppercase tracking-wider">
                    Selected
                  </span>
                )}
              </div>
            );
          })}
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
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
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
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
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
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
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
                <strong>Broadcast Notice:</strong> This message will be individually delivered via <strong>{selectedProvider === 'auto' ? 'Smart Multi-Rail (Auto Failover)' : PROVIDER_OPTIONS.find(p => p.id === selectedProvider)?.name || selectedProvider}</strong> to all <strong>{eligibleMerchants.length}</strong> active registered merchants in your system.
              </div>
            )}

            {/* ── Email Provider & Sender Persona Controls ────────────── */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Provider Rail Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-blue-600" />
                      <span>Email Provider Rail</span>
                    </label>
                    {selectedProvider === 'auto' ? (
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded">
                        Auto (Smart)
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelectedProvider('auto')}
                        className="text-[10px] font-bold text-slate-500 hover:text-blue-600 cursor-pointer"
                      >
                        Reset to Auto
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                  >
                    {PROVIDER_OPTIONS.map((p) => {
                      const tele = quotaMap[p.id];
                      const leftStr = tele ? ` (${tele.remaining} left)` : ` (${p.badge})`;
                      return (
                        <option key={p.id} value={p.id}>
                          {p.name} {p.id !== 'auto' ? leftStr : ''}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">
                    {PROVIDER_OPTIONS.find(p => p.id === selectedProvider)?.desc}
                  </p>
                </div>

                {/* Sender Identity / Format Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Sender Persona &amp; Format</span>
                    </label>
                    <span className="text-[10px] font-mono text-slate-400">@mymobpay.tech</span>
                  </div>
                  <select
                    value={selectedSenderFormat}
                    onChange={(e) => setSelectedSenderFormat(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                  >
                    {SENDER_FORMAT_OPTIONS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} &bull; {f.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">
                    {SENDER_FORMAT_OPTIONS.find(f => f.id === selectedSenderFormat)?.description}
                  </p>
                </div>
              </div>
            </div>

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
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 cursor-pointer ${
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
                      placeholder="https://mymobpay.tech/dashboard"
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
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      {selectedProvider === 'auto'
                        ? 'Dispatching via Smart Multi-Rail...'
                        : `Dispatching via ${PROVIDER_OPTIONS.find(p => p.id === selectedProvider)?.shortName || selectedProvider}...`}
                    </span>
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
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-semibold flex items-center justify-center text-xs">
                M
              </div>
              <div className="text-left">
                <span className="font-semibold text-sm text-[#0c2340] tracking-tight block leading-tight">MyMobPay</span>
                <span className="text-[8.5px] text-slate-400 font-bold block">Direct Bank UPI Rails</span>
              </div>
            </div>

            {/* Sender & Delivery Metadata Header */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400 font-medium shrink-0">From:</span>
                <span className="font-semibold text-slate-800 truncate text-right">
                  &quot;{currentSenderPreview.name}&quot; &lt;{currentSenderPreview.email}&gt;
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-[10px]">
                <span className="text-slate-400 font-medium shrink-0">Delivery Rail:</span>
                <span className="font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md truncate">
                  {PROVIDER_OPTIONS.find(p => p.id === selectedProvider)?.name || 'Smart Multi-Rail'}
                </span>
              </div>
            </div>

            {/* Subject Badge */}
            <div className="space-y-1">
              <span className="inline-block px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[9px] font-bold">
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
              <p>&copy; 2026 MyMobPay Payments Private Limited &bull; mymobpay.tech</p>
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
              Live audit record of all emails sent from the admin dashboard with provider rail tracking.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search outbox, provider, or persona..."
              value={outboxSearch}
              onChange={(e) => setOutboxSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3 text-left">Recipient</th>
                <th className="px-4 py-3 text-left">Subject &amp; Snippet</th>
                <th className="px-4 py-3 text-left">Provider Rail</th>
                <th className="px-4 py-3 text-left">Sender Identity</th>
                <th className="px-4 py-3 text-left">Sent Time (IST)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {outboxLoading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2" />
                    Loading outbox records...
                  </td>
                </tr>
              ) : filteredOutbox.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
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
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold capitalize">
                        {item.provider || 'smart-router'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {item.sender_format ? `${item.sender_format}@` : 'auto@'}
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
                          if (item.provider && item.provider !== 'smart-router') {
                            setSelectedProvider(item.provider);
                          }
                          if (item.sender_format) {
                            setSelectedSenderFormat(item.sender_format);
                          }
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
