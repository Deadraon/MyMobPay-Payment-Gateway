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
  Building2,
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
  Shield,
  Sliders,
  Smartphone,
  Monitor,
  ChevronDown,
  ChevronUp,
  X,
  Bold,
  Italic,
  List,
  Code2,
  AtSign,
  ArrowUpRight,
  FileText,
  SlidersHorizontal,
  Filter,
  CheckCheck,
  Terminal,
  CornerDownLeft,
  ArrowRight,
  Info,
  CheckCircle,
  HardDrive
} from 'lucide-react';

const SENDER_FORMAT_OPTIONS = [
  {
    id: 'auto',
    name: 'Auto Contextual',
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
    name: 'Smart Multi-Rail',
    shortName: 'Smart Auto',
    dailyLimit: 1500,
    badge: 'Failover Enabled',
    desc: 'Dynamic circuit breaker failover across all 6 active email rails',
    host: 'Multi-Rail Failover',
    protocol: 'Dynamic Engine',
    port: 'Auto'
  },
  {
    id: 'emaillabs',
    name: 'EmailLabs SMTP',
    shortName: 'EmailLabs',
    dailyLimit: 300,
    badge: '300 / day',
    desc: 'Dedicated SMTP relay via smtp-relay.emaillabs.net.pl (apex domain verified)',
    host: 'smtp-relay.emaillabs.net.pl',
    protocol: 'SMTP Relay',
    port: '587'
  },
  {
    id: 'unitpost',
    name: 'Unitpost API / SMTP',
    shortName: 'Unitpost',
    dailyLimit: 200,
    badge: '200 / day',
    desc: 'Direct REST API & SMTP delivery on apex domain @mymobpay.tech',
    host: 'smtp.unitpost.com',
    protocol: 'REST API + SMTP',
    port: '587'
  },
  {
    id: 'maileroo',
    name: 'Maileroo SMTP',
    shortName: 'Maileroo',
    dailyLimit: 100,
    badge: '100 / day',
    desc: 'Reliable transactional tier (~3,000/mo buffer) on smtp.maileroo.com',
    host: 'smtp.maileroo.com',
    protocol: 'SMTP Relay',
    port: '587'
  },
  {
    id: 'sendpulse',
    name: 'SendPulse SMTP',
    shortName: 'SendPulse',
    dailyLimit: 500,
    badge: '500 / day',
    desc: 'High-volume statement & invoice relay via smtp-pulse.com',
    host: 'smtp-pulse.com',
    protocol: 'SMTP SSL',
    port: '465'
  },
  {
    id: 'brevo',
    name: 'Brevo SMTP',
    shortName: 'Brevo',
    dailyLimit: 300,
    badge: '300 / day',
    desc: 'Direct relay via smtp-relay.brevo.com',
    host: 'smtp-relay.brevo.com',
    protocol: 'SMTP Relay',
    port: '587'
  },
  {
    id: 'resend',
    name: 'Resend API / SMTP',
    shortName: 'Resend',
    dailyLimit: 100,
    badge: '100 / day',
    desc: 'Developer API delivery on smtp.resend.com',
    host: 'smtp.resend.com',
    protocol: 'REST API',
    port: '465'
  }
];

const EMAIL_TEMPLATES = [
  {
    id: 'custom',
    name: 'Blank Custom Draft',
    category: 'General',
    badge: 'Custom',
    subject: '',
    message: '',
    ctaText: 'Open Merchant Portal',
    ctaUrl: 'https://mymobpay.tech/dashboard'
  },
  {
    id: 'onboarding_phone',
    name: 'Onboarding: Request Contact Number',
    category: 'Onboarding',
    badge: 'Setup',
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
    category: 'Banking',
    badge: 'Rails',
    subject: 'Action Required: Connect your UPI VPA for Direct 0% Settlements',
    message: `Your MyMobPay merchant account is active and ready to accept payments!

To ensure customer payments land directly in your bank account in real-time with ZERO intermediary escrow or rolling reserves, please connect your primary business UPI VPA.

Steps to complete setup:
1. Log in to your merchant console at mymobpay.tech/dashboard.
2. Navigate to Settings > Banking & Settlement VPA.
3. Enter your verified bank UPI ID (e.g. yourname@okaxis or store@okhdfcbank).

Customer payments will credit directly to your account immediately with zero commission.`,
    ctaText: 'Configure Settlement VPA',
    ctaUrl: 'https://mymobpay.tech/dashboard#settings'
  },
  {
    id: 'payment_verification',
    name: 'Support: Transaction Verification',
    category: 'Operations',
    badge: 'Audit',
    subject: 'Payment Inquiry & Transaction Verification Update',
    message: `We are writing to provide an operational update regarding a customer payment inquiry for your store.

Our operations desk has cross-verified the customer UTR bank confirmation against the direct UPI rail. If you have any questions or require an updated settlement statement, please review your real-time ledger on your merchant dashboard.

Remember: MyMobPay never holds, pools, or delays merchant funds. All successful customer checkouts settle directly to your registered bank account.`,
    ctaText: 'View Transaction Ledger',
    ctaUrl: 'https://mymobpay.tech/dashboard#transactions'
  },
  {
    id: 'platform_update',
    name: 'Announcement: Platform Upgrade',
    category: 'Notices',
    badge: 'Product',
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
    name: 'Subscription: Welcome & Active Plan',
    category: 'Billing',
    badge: 'Active',
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
  // Navigation View: 'studio' | 'outbox' | 'rails'
  const [activeView, setActiveView] = useState('studio');

  // Recipient Target Mode: 'merchant' | 'custom' | 'broadcast'
  const [recipientMode, setRecipientMode] = useState('merchant');
  const [selectedMerchantId, setSelectedMerchantId] = useState('');
  const [merchantSearch, setMerchantSearch] = useState('');
  const { isMounted: isSearchDropdownMounted, dropdownClass: searchDropdownClass } = useDropdownTransition(Boolean(merchantSearch.trim()));
  const [customEmail, setCustomEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');

  // Email Content & Styling
  const [selectedTemplateId, setSelectedTemplateId] = useState('custom');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [includeCta, setIncludeCta] = useState(true);
  const [ctaText, setCtaText] = useState('Open Merchant Portal');
  const [ctaUrl, setCtaUrl] = useState('https://mymobpay.tech/dashboard');

  // Delivery & Routing Configuration
  const [selectedProvider, setSelectedProvider] = useState('auto');
  const [selectedSenderFormat, setSelectedSenderFormat] = useState('auto');
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Preview Mode
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [previewTab, setPreviewTab] = useState('preview'); // 'preview' | 'headers'
  const [interpolateTokens, setInterpolateTokens] = useState(true);

  // Loading & Data States
  const [sending, setSending] = useState(false);
  const [outbox, setOutbox] = useState([]);
  const [outboxLoading, setOutboxLoading] = useState(false);
  const [outboxSearch, setOutboxSearch] = useState('');
  const [outboxStatusFilter, setOutboxStatusFilter] = useState('all');
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

  // Pick merchant from dropdown
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
        return { name: 'MyMobPay Security', email: 'auth@mymobpay.tech', label: 'Security & Auth', desc: 'Protected 2FA & Auth Channel' };
      case 'trx':
        return { name: 'MyMobPay Billing', email: 'trx@mymobpay.tech', label: 'Billing & Invoices', desc: 'Financial Statements & Ledgers' };
      case 'noreply':
        return { name: 'MyMobPay Support', email: 'noreply@mymobpay.tech', label: 'Platform Notices', desc: 'System Updates & Broadcasts' };
      case 'auto':
      default:
        return { name: 'MyMobPay Operations', email: 'noreply@mymobpay.tech', label: 'Contextual Dispatch', desc: 'Smart Routing by Intent' };
    }
  }, [selectedSenderFormat]);

  // Insert helper token into message body
  const insertToken = (token) => {
    setMessage(prev => (prev ? `${prev} ${token}` : token));
  };

  // Interpolated message for realistic live email preview
  const interpolatedMessage = useMemo(() => {
    if (!message) return '';
    if (!interpolateTokens) return message;

    const targetName = recipientName.trim() || 'Merchant Partner';
    const targetVpa = (selectedMerchantId && merchants.find(m => m.id === selectedMerchantId)?.upi_id) || 'merchant@okaxis';

    return message
      .replace(/\{\{merchant_name\}\}/g, targetName)
      .replace(/\{\{vpa\}\}/g, targetVpa);
  }, [message, interpolateTokens, recipientName, selectedMerchantId, merchants]);

  // Keyboard shortcut (Cmd+Enter or Ctrl+Enter to send)
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendEmail(e);
    }
  };

  // Filtered Outbox
  const filteredOutbox = useMemo(() => {
    let list = outbox;
    if (outboxStatusFilter !== 'all') {
      list = list.filter(item => item.status === outboxStatusFilter);
    }
    if (!outboxSearch.trim()) return list;
    const q = outboxSearch.toLowerCase();
    return list.filter(item =>
      (item.to && item.to.toLowerCase().includes(q)) ||
      (item.subject && item.subject.toLowerCase().includes(q)) ||
      (item.recipient_name && item.recipient_name.toLowerCase().includes(q)) ||
      (item.provider && item.provider.toLowerCase().includes(q)) ||
      (item.sender_format && item.sender_format.toLowerCase().includes(q))
    );
  }, [outbox, outboxSearch, outboxStatusFilter]);

  // Send Direct Email Handler
  const handleSendEmail = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

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
    <div className="space-y-5 animate-fadeIn font-sans">
      {/* ── Studio Top Navigation Bar (Linear / Resend Style) ─────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-2.5 sm:p-3 shadow-xs">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 rounded-xl p-1 border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveView('studio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'studio'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>Studio Composer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('outbox')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'outbox'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>Dispatch Ledger</span>
            {outbox.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
                {outbox.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView('rails')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeView === 'rails'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rails Telemetry</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Info
            </span>
          </button>
        </div>

        {/* Right: Live Telemetry Capsule & Quick Controls */}
        <div className="flex items-center gap-2.5 justify-between lg:justify-end">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono font-bold text-slate-900 text-sm">
              {(combinedQuota.totalRemaining ?? 1500).toLocaleString()}
            </span>
            <span className="text-slate-600 text-xs font-semibold">left today</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs font-mono font-bold text-emerald-700">
              {combinedQuota.activeProvidersCount || 6} Rails Ready
            </span>
          </div>

          <button
            type="button"
            onClick={handleSetSendToMe}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            title="Populate your own admin email for a quick test preview"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Test to Admin</span>
          </button>

          <button
            type="button"
            onClick={fetchHistory}
            disabled={outboxLoading}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            title="Sync live quotas & logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${outboxLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── View 1: Studio Composer (Primary Workspace) ────────────────── */}
      {activeView === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Email Studio Canvas (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden flex flex-col">
            {/* Top Toolbar / Configuration Strip */}
            <div className="p-3 sm:p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
              {/* Audience Mode Switcher (Clean Segmented Control) */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setRecipientMode('merchant')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    recipientMode === 'merchant'
                      ? 'bg-white text-blue-600 font-bold shadow-2xs border border-slate-200/70'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Merchant</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientMode('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    recipientMode === 'custom'
                      ? 'bg-white text-blue-600 font-bold shadow-2xs border border-slate-200/70'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <AtSign className="w-3.5 h-3.5" />
                  <span>Direct Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecipientMode('broadcast')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    recipientMode === 'broadcast'
                      ? 'bg-rose-50 text-rose-700 font-bold shadow-2xs border border-rose-200'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Broadcast ({eligibleMerchants.length})</span>
                </button>
              </div>

              {/* Template & Delivery Drawer Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Template Selector Dropdown */}
                <div className="relative">
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleSelectTemplate(e.target.value)}
                    className="text-xs bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-2xs transition-colors"
                  >
                    {EMAIL_TEMPLATES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Routing Drawer Toggle */}
                <button
                  type="button"
                  onClick={() => setShowConfigDrawer(!showConfigDrawer)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                    showConfigDrawer
                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Transmission Routing</span>
                  {showConfigDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Clean Light Transmission Routing Drawer */}
            {showConfigDrawer && (
              <div className="p-4 bg-slate-50/80 border-b border-slate-200/80 animate-fadeIn space-y-3.5">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-200/70">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <Server className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-bold text-slate-800 text-xs">
                      Delivery Rail Engine &amp; Sender Persona
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Failover Active Across 6 Rails
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Provider Rail Override
                    </label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 cursor-pointer shadow-2xs"
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
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      Default: Smart Auto dynamically fails over to next relay if daily quota or circuit trips.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Sender Persona &amp; Identity
                    </label>
                    <select
                      value={selectedSenderFormat}
                      onChange={(e) => setSelectedSenderFormat(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 cursor-pointer shadow-2xs"
                    >
                      {SENDER_FORMAT_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.email} ({f.displayName})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                      DKIM &amp; SPF aligned apex domain address displayed in customer and merchant inboxes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recipient Input Row (Clean High-Contrast Typography) */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider w-10 shrink-0">To:</span>

                {recipientMode === 'merchant' && (
                  <div className="flex-1 min-w-0">
                    {customEmail ? (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/80 border border-blue-200/80 text-xs shadow-2xs">
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                          {(recipientName || 'M').charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900 truncate">{recipientName}</span>
                        <span className="text-blue-700 font-mono text-[11px] font-medium">&lt;{customEmail}&gt;</span>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomEmail('');
                            setSelectedMerchantId('');
                            setRecipientName('');
                          }}
                          className="text-slate-400 hover:text-rose-600 transition-colors ml-1 cursor-pointer p-0.5 rounded"
                          title="Remove recipient"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search registered store name, owner, or email..."
                          value={merchantSearch}
                          onChange={(e) => setMerchantSearch(e.target.value)}
                          className="w-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium bg-transparent"
                        />

                        {/* Search Dropdown */}
                        {isSearchDropdownMounted && (
                          <div
                            className={`absolute left-0 right-0 top-full mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl divide-y divide-slate-100 z-30 ${searchDropdownClass}`}
                            data-origin="top-center"
                          >
                            {filteredMerchantsDropdown.map(m => (
                              <div
                                key={m.id}
                                onClick={() => handleSelectMerchant(m)}
                                className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs flex items-center justify-between transition-colors"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0">
                                    {(m.business_name || m.owner_name || 'M').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 truncate">{m.business_name || m.owner_name || 'Merchant'}</p>
                                    <p className="text-[11px] font-mono text-slate-500 truncate">{m.email}</p>
                                  </div>
                                </div>
                                <span className="text-[9px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0 ml-2 border border-slate-200">
                                  {m.subscription_status || 'free'}
                                </span>
                              </div>
                            ))}
                            {filteredMerchantsDropdown.length === 0 && (
                              <div className="p-4 text-center text-xs text-slate-400 font-medium">No matching merchants found.</div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {recipientMode === 'custom' && (
                  <div className="flex-1 flex flex-col sm:flex-row items-center gap-2.5">
                    <input
                      type="text"
                      placeholder="Recipient Name (optional)"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full sm:w-1/3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium bg-transparent"
                    />
                    <span className="hidden sm:inline text-slate-300 font-bold">•</span>
                    <input
                      type="email"
                      required
                      placeholder="Email address (e.g. merchant@example.com) *"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full sm:w-2/3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none font-mono font-medium bg-transparent"
                    />
                  </div>
                )}

                {recipientMode === 'broadcast' && (
                  <div className="flex-1 text-xs text-rose-700 font-semibold flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-rose-600" />
                    <span>Broadcasting to all {eligibleMerchants.length} registered merchant accounts</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subject Line */}
            <div className="px-5 py-3.5 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Subject Line *
              </span>
              <input
                type="text"
                required
                placeholder="Write a clear, descriptive subject line..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-base sm:text-lg font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none bg-transparent tracking-tight"
              />
            </div>

            {/* Editorial Formatting Bar */}
            <div className="px-5 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Insert Token:</span>
                <button
                  type="button"
                  onClick={() => insertToken('{{merchant_name}}')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-650 text-[11px] font-mono font-medium hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer shadow-2xs"
                  title="Insert recipient name token"
                >
                  &#123;&#123;merchant_name&#125;&#125;
                </button>
                <button
                  type="button"
                  onClick={() => insertToken('{{vpa}}')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-650 text-[11px] font-mono font-medium hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer shadow-2xs"
                  title="Insert settlement VPA token"
                >
                  &#123;&#123;vpa&#125;&#125;
                </button>
                <button
                  type="button"
                  onClick={() => insertToken('https://mymobpay.tech/dashboard')}
                  className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-650 text-[11px] font-mono font-medium hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer shadow-2xs"
                  title="Insert portal URL"
                >
                  portal_url
                </button>
              </div>

              {/* Action Button Toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIncludeCta(!includeCta)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    includeCta
                      ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>Call to Action Button</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${includeCta ? 'bg-blue-600' : 'bg-slate-300'}`} />
                </button>
              </div>
            </div>

            {/* Email Message Canvas */}
            <div className="p-5 flex-1 flex flex-col">
              <textarea
                required
                rows={9}
                placeholder="Write your email notification here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 border-0 focus:outline-none resize-none leading-relaxed font-sans bg-transparent min-h-[220px]"
              />

              {/* Inline Action Button Editor Block */}
              {includeCta && (
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 animate-fadeIn space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      <span>Action Button Configuration</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIncludeCta(false)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-700 block mb-1">Button Label</span>
                      <input
                        type="text"
                        placeholder="e.g. Open Merchant Portal"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs font-semibold text-slate-900"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-700 block mb-1">Target URL</span>
                      <input
                        type="url"
                        placeholder="https://mymobpay.tech/dashboard"
                        value={ctaUrl}
                        onChange={(e) => setCtaUrl(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 text-xs font-mono font-medium text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Studio Bottom Command Bar */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-900">
                  {selectedProvider === 'auto' ? 'Auto Failover' : PROVIDER_OPTIONS.find(p => p.id === selectedProvider)?.shortName}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-xs font-medium text-slate-600">{currentSenderPreview.email}</span>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
                  Ctrl + Enter to send
                </span>

                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={sending}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Dispatching...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Live Email Inspector (5 cols) */}
          <div className="lg:col-span-5 bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3 sticky top-20">
            {/* Inspector Header & Controls */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setPreviewTab('preview')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    previewTab === 'preview'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Live Preview
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('headers')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    previewTab === 'headers'
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Terminal className="w-3 h-3" />
                  <span>Headers</span>
                </button>
              </div>

              {/* Viewport Switcher & Token Interpolation Switch */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInterpolateTokens(!interpolateTokens)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold font-mono transition-colors border ${
                    interpolateTokens
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Toggle simulated token interpolation in preview"
                >
                  {interpolateTokens ? 'Tags: On' : 'Tags: Raw'}
                </button>

                <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                      previewDevice === 'desktop'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Desktop View"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-md text-[10px] font-semibold transition-all cursor-pointer ${
                      previewDevice === 'mobile'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Mobile View"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Email Canvas Window */}
            {previewTab === 'preview' ? (
              <div className={`transition-all duration-300 ${previewDevice === 'mobile' ? 'max-w-[320px] mx-auto' : 'w-full'}`}>
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  {/* Email Window Chrome */}
                  <div className="bg-slate-50/90 px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-300/80" />
                      <span className="w-2 h-2 rounded-full bg-slate-300/80" />
                      <span className="w-2 h-2 rounded-full bg-slate-300/80" />
                    </div>
                    <span className="text-[11px] font-mono font-medium text-slate-600">
                      {currentSenderPreview.email}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md font-mono border border-slate-200/80">
                      {selectedProvider === 'auto' ? 'Auto' : PROVIDER_OPTIONS.find(p => p.id === selectedProvider)?.shortName}
                    </span>
                  </div>

                  {/* Email Content Frame */}
                  <div className="p-4 space-y-3.5 max-h-[520px] overflow-y-auto text-xs">
                    {/* Header Logo */}
                    <div className="text-center pb-2.5 border-b border-slate-100 flex items-center justify-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                        M
                      </div>
                      <div className="text-left">
                        <span className="font-extrabold text-xs text-slate-900 tracking-tight block leading-tight">MyMobPay</span>
                        <span className="text-[8px] text-slate-500 font-bold block">Direct Bank UPI Rails</span>
                      </div>
                    </div>

                    {/* Meta headers (High Contrast) */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-[11px]">
                      <div className="flex items-baseline gap-2">
                        <span className="text-slate-600 font-extrabold text-[10px] w-10 shrink-0">From:</span>
                        <span className="font-bold text-slate-900 truncate">
                          {currentSenderPreview.name} &lt;{currentSenderPreview.email}&gt;
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-slate-600 font-extrabold text-[10px] w-10 shrink-0">To:</span>
                        <span className="font-mono font-bold text-slate-800 truncate">
                          {customEmail || 'merchant@example.com'}
                        </span>
                      </div>
                    </div>

                    {/* Subject */}
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                        {subject || 'Subject line will appear here...'}
                      </h4>
                    </div>

                    {/* Greeting */}
                    <p className="font-bold text-slate-900">
                      Hello {recipientName.trim() || 'Merchant Partner'},
                    </p>

                    {/* Message Body */}
                    <div className="text-slate-800 leading-relaxed space-y-2 whitespace-pre-line text-xs font-normal">
                      {interpolatedMessage || 'Type your email message on the left to see the instant live preview here.'}
                    </div>

                    {/* CTA Button Preview */}
                    {includeCta && ctaText && (
                      <div className="text-center py-2">
                        <div className="inline-block px-4 py-2 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-2xs cursor-default">
                          {ctaText} &rarr;
                        </div>
                      </div>
                    )}

                    {/* Security Notice */}
                    <div className="p-2.5 rounded-lg bg-slate-50 border-l-2 border-blue-600 text-[10px] text-slate-700 leading-relaxed font-medium">
                      <strong className="text-slate-900 font-bold">Zero-Commission Rails:</strong> Customer UPI checkouts settle directly into your verified bank account with 0% MDR.
                    </div>

                    {/* Footer */}
                    <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 text-center space-y-0.5">
                      <p className="font-bold text-slate-700">MyMobPay Merchant Operations</p>
                      <p>&copy; 2026 MyMobPay Payments Private Limited</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Raw Headers / MIME Telemetry Inspector */
              <div className="bg-slate-950 rounded-xl p-4 text-slate-200 font-mono text-[11px] space-y-2 max-h-[520px] overflow-y-auto border border-slate-800 shadow-inner">
                <div className="text-emerald-400 font-bold border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span>MIME ENVELOPE INSPECTION</span>
                  <span className="text-[10px] text-slate-400">RFC 5322</span>
                </div>
                <div className="space-y-1.5 text-slate-300">
                  <p><span className="text-blue-400 font-bold">From:</span> {currentSenderPreview.name} &lt;{currentSenderPreview.email}&gt;</p>
                  <p><span className="text-blue-400 font-bold">To:</span> {customEmail || 'merchant@example.com'}</p>
                  <p><span className="text-blue-400 font-bold">Subject:</span> {subject || '(no subject)'}</p>
                  <p><span className="text-blue-400 font-bold">Date:</span> {new Date().toUTCString()}</p>
                  <p><span className="text-blue-400 font-bold">X-Mailer-Rail:</span> {selectedProvider === 'auto' ? 'smart-router-failover' : selectedProvider}</p>
                  <p><span className="text-blue-400 font-bold">X-Sender-Format:</span> {selectedSenderFormat}</p>
                  <p><span className="text-emerald-400 font-bold">Authentication-Results:</span> spf=pass; dkim=pass header.i=@mymobpay.tech</p>
                  <p><span className="text-blue-400 font-bold">Content-Type:</span> multipart/alternative; boundary=&quot;mmp_mime_part&quot;</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── View 2: Dispatch Ledger (Outbox History) ──────────────────── */}
      {activeView === 'outbox' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Transmission Ledger &amp; Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete delivery history with provider rail and sender persona tracking.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Filter */}
              <select
                value={outboxStatusFilter}
                onChange={(e) => setOutboxStatusFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
              >
                <option value="all">All Status</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
              </select>

              {/* Search */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search outbox..."
                  value={outboxSearch}
                  onChange={(e) => setOutboxSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium text-slate-900 placeholder:text-slate-400 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Recipient</th>
                  <th className="px-4 py-3 text-left">Subject &amp; Body</th>
                  <th className="px-4 py-3 text-left">Rail</th>
                  <th className="px-4 py-3 text-left">Persona</th>
                  <th className="px-4 py-3 text-left">Time (IST)</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {outboxLoading ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-slate-500 font-medium">
                      <RefreshCw className="w-4 h-4 animate-spin inline-block mr-2 text-blue-600" />
                      Loading outbox records...
                    </td>
                  </tr>
                ) : filteredOutbox.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500 font-medium">
                      No dispatched emails found in outbox history.
                    </td>
                  </tr>
                ) : (
                  filteredOutbox.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">{item.recipient_name || 'Recipient'}</span>
                        <span className="font-mono text-[11px] text-slate-600">{item.to}</span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <span className="font-bold text-slate-800 block truncate">{item.subject}</span>
                        <span className="text-[11px] text-slate-500 block truncate">{item.snippet || 'No message content'}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold capitalize">
                          {item.provider || 'smart-router'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold">
                          {item.sender_format ? `${item.sender_format}@` : 'auto@'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {item.sent_at ? new Date(item.sent_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Just now'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.status === 'delivered' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Delivered
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
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
                            setActiveView('studio');
                            if (showToast) showToast('Loaded into studio composer', 'info');
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2.5 py-1 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          Load Draft
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── View 3: Rails & Infrastructure Telemetry (Informational Dashboard Only) ───────────────────── */}
      {activeView === 'rails' && (
        <div className="space-y-4">
          {/* Header Status & Live Telemetry Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white rounded-2xl border border-blue-100/80 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-2xs">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Live Multi-Rail Telemetry Matrix</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    Read-Only Monitoring
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Real-time transmission counters and circuit breaker status. Select active rails in the Studio Composer.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-500">Timezone:</span>
              <span className="text-slate-800 font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">Asia/Kolkata (IST)</span>
              <span className="text-slate-400 ml-1">Reset:</span>
              <span className="text-emerald-700 font-bold">00:00 IST</span>
            </div>
          </div>

          {/* Capacity Hero Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold font-mono tracking-wider uppercase text-blue-800 bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md">
                  Aggregated Daily Transmission Capacity
                </span>
                <div className="flex items-baseline gap-3 mt-2 flex-wrap">
                  <h3 className="text-4xl font-extrabold font-mono text-slate-900 tracking-tight">
                    {(combinedQuota.totalRemaining ?? 1500).toLocaleString()}
                  </h3>
                  <span className="text-xs font-bold text-slate-700">
                    emails remaining today out of {(combinedQuota.totalLimit ?? 1500).toLocaleString()} daily ceiling
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Dynamic multi-rail dispatcher auto-routes transactional traffic with sub-second failover and DKIM/SPF alignment.
                </p>
              </div>

              <div className="sm:w-72 space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>Daily Utilization</span>
                  <span className="font-mono text-blue-600">{combinedQuota.totalSentToday || 0} sent today</span>
                </div>
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(3, Math.round(((combinedQuota.totalRemaining ?? 1500) / (combinedQuota.totalLimit || 1500)) * 100)))}%`
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono font-semibold">
                  <span>0% MDR Rail</span>
                  <span>100% In-House Capacity</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6 Informational Telemetry Cards (Purely Info, Not Clickable) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROVIDER_OPTIONS.filter(p => p.id !== 'auto').map((p) => {
              const tele = quotaMap[p.id] || {};
              const limit = tele.dailyLimit || p.dailyLimit;
              const sent = tele.sentToday || 0;
              const remaining = tele.remaining != null ? tele.remaining : Math.max(0, limit - sent);
              const isConfigured = tele.isConfigured !== false;
              const isCircuitLimited = tele.circuit ? tele.circuit.isLimited : false;
              const percentLeft = limit > 0 ? Math.round((remaining / limit) * 100) : 0;

              return (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs space-y-3"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-blue-600" />
                        <span>{p.name}</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">{p.protocol} • Port {p.port}</span>
                    </div>

                    {/* Operational Badge */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border">
                      {isCircuitLimited ? (
                        <span className="bg-amber-50 text-amber-800 border-amber-200 flex items-center gap-1 px-1.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Cooldown
                        </span>
                      ) : !isConfigured ? (
                        <span className="bg-slate-50 text-slate-600 border-slate-200 flex items-center gap-1 px-1.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Unconfigured
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-1 px-1.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Operational
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Relay Endpoint */}
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] font-mono text-slate-700 truncate">
                    <span className="text-slate-400 mr-1">Host:</span>
                    <span className="font-semibold">{p.host}</span>
                  </div>

                  {/* Quota Numbers */}
                  <div className="flex items-baseline justify-between text-xs font-mono">
                    <span className="text-lg font-black text-slate-900 tracking-tight">{remaining} left</span>
                    <span className="text-slate-600 font-bold">{sent} / {limit} sent</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percentLeft < 20 ? 'bg-rose-500' : percentLeft < 50 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, percentLeft))}%` }}
                    />
                  </div>

                  {/* Footer Meta */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>SPF &amp; DKIM: Aligned</span>
                    <span className="font-mono text-slate-600">Daily: {limit} cap</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
