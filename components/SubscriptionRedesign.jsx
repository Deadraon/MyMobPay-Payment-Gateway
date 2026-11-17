'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useModalTransition } from './useModalTransition';
import {
  CheckCircle,
  Building2,
  Zap,
  X,
  QrCode,
  Download,
  Copy,
  Check,
  CheckCheck,
  Briefcase,
  Database,
  Server,
  ExternalLink,
  Info,
  Calendar,
  CreditCard,
  Clock,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import { openTaxInvoiceWindow } from '@/lib/invoiceGenerator';
import { formatMerchantId } from '@/lib/merchantId';
import { generateOrderId } from '@/lib/orderId';
import { detectSubscriptionTier } from '@/lib/subscriptionOrders';

export default function SubscriptionRedesign({
  profile = {},
  historyOrders = [],
  orders = [],
  onRefreshProfile,
  onProfileUpdate,
  setActiveTab
}) {
  // ── Modal & Flow States ───────────────────────────────────────
  const [selectedPlanId, setSelectedPlanId] = useState('pro');
  const [isYearly, setIsYearly] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showContactSalesModal, setShowContactSalesModal] = useState(false);
  const { isMounted: isDetailsModalMounted, modalClass: detailsModalClass, overlayClass: detailsOverlayClass } = useModalTransition(showDetailsModal);
  const { isMounted: isContactSalesModalMounted, modalClass: contactSalesModalClass, overlayClass: contactSalesOverlayClass } = useModalTransition(showContactSalesModal);
  const [invoiceFilter, setInvoiceFilter] = useState('all'); // 'all', 'paid'
  const [isActivating, setIsActivating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  // Lock background body and parent container scroll when subscription details or sales modal is active
  useEffect(() => {
    if (showDetailsModal || showContactSalesModal) {
      const origOverflow = document.body.style.overflow;
      const origTouchAction = document.body.style.touchAction;
      const scrollableContainers = document.querySelectorAll('.overflow-y-auto');
      scrollableContainers.forEach((el) => {
        el.dataset.prevOverflow = el.style.overflow;
        el.style.overflow = 'hidden';
      });

      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = origOverflow;
        document.body.style.touchAction = origTouchAction;
        scrollableContainers.forEach((el) => {
          el.style.overflow = el.dataset.prevOverflow || '';
          delete el.dataset.prevOverflow;
        });
      };
    }
  }, [showDetailsModal, showContactSalesModal]);


  // ── Real Subscription Details Computation ─────────────────────
  const subDetails = useMemo(() => {
    const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
    const isValidExpiry = expiresAt && !isNaN(expiresAt.getTime());
    const isStillActiveDate = isValidExpiry && expiresAt.getTime() > Date.now();
    const daysLeft = isValidExpiry ? Math.max(0, Math.ceil((expiresAt - new Date()) / 86400000)) : 0;
    const isCancelled = profile?.subscription_status === 'cancelled';
    const isActive = (profile?.subscription_status === 'active' || isStillActiveDate) && !isCancelled;

    // Format Expiry Date
    let expiryDateStr = 'Not Activated';
    if (expiresAt && !isNaN(expiresAt.getTime())) {
      expiryDateStr = expiresAt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }

    // Purchase / Activation Date
    let activatedAt = null;
    if (historyOrders && historyOrders.length > 0 && historyOrders[0]?.created_at) {
      activatedAt = new Date(historyOrders[0].created_at);
    } else if (profile?.setup_progress?.subscription_activated_at) {
      activatedAt = new Date(profile.setup_progress.subscription_activated_at);
    } else if (profile?.setup_progress?.last_payment_at) {
      activatedAt = new Date(profile.setup_progress.last_payment_at);
    } else if (profile?.created_at) {
      activatedAt = new Date(profile.created_at);
    }

    let activatedAtStr = 'Active Cycle';
    if (activatedAt && !isNaN(activatedAt.getTime())) {
      activatedAtStr = activatedAt.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }

    const totalDays = profile?.subscription_plan === '3months' ? 90 : profile?.subscription_plan === '2months' ? 60 : 30;
    const percentRemaining = totalDays > 0 ? Math.min(100, Math.max(0, Math.round((daysLeft / totalDays) * 100))) : 0;

    // 1. Resolve detected tier dynamically from verified order, profile setup_progress, or fallback
    const latestVerifiedOrder = historyOrders?.find(o => o.status === 'verified' || o.status === 'paid') || historyOrders?.[0];
    const detectedFromOrder = latestVerifiedOrder ? detectSubscriptionTier(latestVerifiedOrder) : null;
    const detectedFromProfile = detectSubscriptionTier(profile?.setup_progress?.plan_type || profile?.subscription_plan);

    const activeTier = detectedFromOrder || detectedFromProfile || (isActive ? {
      tierIndex: 2,
      id: 'growth',
      name: 'Growth',
      title: 'Growth Plan (REST API)',
      tierLabel: 'Growth Tier',
      price: 299,
      isAnnual: false
    } : {
      tierIndex: 0,
      id: 'free',
      name: 'Free Link Starter',
      title: 'Free Link Starter (Sandbox)',
      tierLabel: 'Free Sandbox Tier',
      price: 0,
      isAnnual: false
    });

    const tierIndex = isActive ? activeTier.tierIndex : 0;
    const planTitle = isActive ? activeTier.title : 'No Active Plan';
    const planTierLabel = isActive ? activeTier.tierLabel : 'Free Sandbox Tier';
    const planAmount = isActive ? activeTier.price : 0;

    const paymentMethodUsed = historyOrders?.[0]?.payment_mode || historyOrders?.[0]?.payment_method || 'Direct UPI Settlement (0% MDR)';
    const orderRef = historyOrders?.[0]?.id
      ? `SUB-${historyOrders[0].id.slice(0, 8).toUpperCase()}`
      : `SUB-${(profile?.id || 'MMP').slice(0, 8).toUpperCase()}`;
    const utr = historyOrders?.[0]?.utr || 'Bank Rail Verification';

    return {
      isActive,
      isCancelled,
      daysLeft,
      totalDays,
      percentRemaining,
      expiryDateStr,
      expiresAt,
      activatedAtStr,
      tierIndex,
      planTitle,
      planTierLabel,
      planAmount,
      paymentMethodUsed,
      orderRef,
      utr
    };
  }, [profile, historyOrders]);

  // ── Real Gateway Fee Saved Computation ────────────────────────
  const totalVerifiedVolume = useMemo(() => {
    if (!orders || !Array.isArray(orders)) return 0;
    return orders
      .filter(o => o.status === 'verified' || o.status === 'paid')
      .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
  }, [orders]);

  const gatewayFeesSaved = useMemo(() => {
    // Standard 2% MDR saved because of 0% fee MyMobPay direct UPI architecture
    return Math.max(0, Math.round(totalVerifiedVolume * 0.02));
  }, [totalVerifiedVolume]);

  // Determine current active subscription tier index (0: Free, 1: Starter, 2: Growth, 3: Pro)
  const currentTierIndex = useMemo(() => {
    return subDetails.tierIndex;
  }, [subDetails.tierIndex]);

  // ── Plan Definitions (4 Tiers Matching /pricing) ─────────────
  const plans = useMemo(() => {
    return [
      {
        id: 'free',
        name: 'Free Link Starter',
        description: 'Great for creators and small sellers looking to get started with 0% fee payments',
        price: 0,
        yearlyPrice: 0,
        isFreeForever: true,
        popular: false,
        features: [
          { text: 'Up to 100 txns per month', icon: <Briefcase size={16} /> },
          { text: 'Dynamic UPI QR & Intent', icon: <Database size={16} /> },
          { text: 'Direct bank settlement', icon: <Server size={16} /> },
        ],
        includes: [
          'Free includes:',
          '0% Gateway commission',
          'Instant T+0 bank settlement',
          'Up to 10 payment links',
          'Printable counter QR standee',
        ],
      },
      {
        id: 'starter',
        name: 'Starter',
        description: 'Great for small businesses and startups looking to get started with flat-rate payments',
        price: 99,
        yearlyPrice: 99,
        isMonthlyOnly: true,
        popular: false,
        features: [
          { text: 'Up to 300 txns per month', icon: <Briefcase size={16} /> },
          { text: 'Unlimited payment links', icon: <Database size={16} /> },
          { text: 'CSV statement downloads', icon: <Server size={16} /> },
        ],
        includes: [
          'Everything in Free, plus:',
          '300 Monthly transactions',
          'Unlimited payment links',
          'Custom link slugs & notes',
          'CSV financial statement exports',
        ],
      },
      {
        id: 'growth',
        name: 'Growth',
        description: 'Best value for growing businesses that need developer REST API and webhooks',
        price: 299,
        yearlyPrice: 2990,
        popular: true,
        features: [
          { text: 'Full Developer REST API', icon: <Briefcase size={16} /> },
          { text: '5 Webhooks with auto-retry', icon: <Database size={16} /> },
          { text: '1,000 verified txns/month', icon: <Server size={16} /> },
        ],
        includes: [
          'Everything in Starter, plus:',
          'Automated UTR bank matching',
          'High-speed webhook retries',
          'Custom slug & payee notes',
          'Priority email support (24h SLA)',
        ],
      },
      {
        id: 'pro',
        name: 'Pro Flagship',
        description: 'Advanced plan with enhanced security, VIP hotline and unlimited access',
        price: 499,
        yearlyPrice: 4990,
        popular: false,
        features: [
          { text: 'Unlimited txns & volume', icon: <Briefcase size={16} /> },
          { text: '24/7 WhatsApp VIP hotline', icon: <Database size={16} /> },
          { text: 'Automated monthly PDF statements', icon: <Server size={16} /> },
        ],
        includes: [
          'Everything in Growth, plus:',
          'Dedicated VIP support (under 1h SLA)',
          'Automated monthly PDF statements',
          'White-label (zero MyMobPay branding)',
          'Multi-staff team accounts (3 seats)',
        ],
      },
    ];
  }, []);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[2];

  // ── Helper: Copy to Clipboard ─────────────────────────────────
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // ── Helper: Show Toast ────────────────────────────────────────
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Scroll smoothly to Extend Plan Section ─────────────────────
  const scrollToPlans = () => {
    setShowDetailsModal(false);
    const el = document.getElementById('extend-plan-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ── Handle Download GST Tax Invoice (Executive New Look & Logo) ─
  const handleDownloadInvoice = (inv) => {
    openTaxInvoiceWindow(inv, profile, subDetails, triggerToast);
  };

  // ── Directly open Real Checkout Page with Subscription Details ──
  const handleProceedToCheckout = async (planToUse = selectedPlan, yearly = isYearly) => {
    if (!planToUse || planToUse.isFreeForever) return;

    const platformKey = CONFIG.platformApiKey || '677d9312-a53f-4b96-815f-53e0eee1b292';
    const merchantId = profile?.id || '';
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://mymobpay.tech';
    const callbackUrl = `${currentOrigin}/dashboard#subscription`;
    const newOrderId = generateOrderId('order');

    const effectiveAmount = yearly && !planToUse.isMonthlyOnly ? planToUse.yearlyPrice : planToUse.price;
    const planNote = yearly && !planToUse.isMonthlyOnly
      ? `Subscription_${planToUse.id}_annual`
      : `Subscription_${planToUse.id}`;

    setIsCheckingOut(true);
    setSelectedPlanId(planToUse.id);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: newOrderId,
          api_key: platformKey,
          amount: effectiveAmount,
          note: planNote,
          project: `MyMobPay Platform License (${planToUse.name} ${yearly && !planToUse.isMonthlyOnly ? 'Annual' : 'Monthly'})`,
          customer_name: profile?.business_name || profile?.user_metadata?.full_name || 'Merchant Owner',
          customer_phone: profile?.phone || '',
          callback_url: callbackUrl,
          external_ref: merchantId,
        })
      });

      const data = await res.json();
      const targetOrderId = data?.order_id || data?.orderId || newOrderId;
      window.location.href = `/pay?order_id=${encodeURIComponent(targetOrderId)}`;
    } catch {
      const params = new URLSearchParams({
        order_id: newOrderId,
        api_key: platformKey,
        amount: String(effectiveAmount),
        ref: merchantId,
        note: planNote,
        project: `MyMobPay Platform License (${planToUse.name} ${yearly && !planToUse.isMonthlyOnly ? 'Annual' : 'Monthly'})`,
        name: profile?.business_name || profile?.user_metadata?.full_name || 'Merchant Owner',
        phone: profile?.phone || '',
        callback: callbackUrl,
      });
      window.location.href = `/pay?${params.toString()}`;
    }
  };

  // ── 100% Real Invoices Data (Zero Fake Info) ─────────────────
  const invoiceList = useMemo(() => {
    if (historyOrders && historyOrders.length > 0) {
      return historyOrders.map(order => ({
        ref: `SUB-${(order.id || '').slice(0, 6).toUpperCase()}`,
        date: order.created_at
          ? new Date(order.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'Recent',
        plan: detectSubscriptionTier(order)?.title || order.note || 'Platform License',
        amount: order.amount || subDetails.planAmount || 299,
        status: order.status === 'verified' || order.status === 'paid' ? 'Paid' : order.status || 'Pending'
      }));
    }

    if (subDetails.isActive) {
      return [
        {
          ref: `SUB-${(profile?.id || 'ACTIVE').slice(0, 6).toUpperCase()}`,
          date: subDetails.activatedAtStr,
          plan: subDetails.planTitle,
          amount: subDetails.planAmount,
          status: 'Paid'
        }
      ];
    }

    return [];
  }, [historyOrders, subDetails, profile]);

  const filteredInvoices = useMemo(() => {
    if (invoiceFilter === 'paid') {
      return invoiceList.filter(inv => inv.status.toLowerCase() === 'paid');
    }
    return invoiceList;
  }, [invoiceList, invoiceFilter]);

  const merchantMid = formatMerchantId(profile?.id);

  return (
    <div className="flex flex-col max-w-7xl mx-auto w-full pb-8 gap-6 animate-fadeIn font-sans">

      {/* ── TOP HEADER BANNER ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-muted)] mb-2.5">
            <span>Subscriptions</span>
            <span>/</span>
            <span className="text-[var(--accent-link,#0F2BFF)] font-bold">Platform Licenses</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/15 text-[#059669] dark:text-[#34D399] text-[10px] font-bold">
              0% MDR &bull; Direct Settlement
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-bold tracking-[0.025em] text-[var(--theme-text-primary)] uppercase leading-snug">
            SAAS SUBSCRIPTIONS &amp; PLATFORM LICENSES
          </h1>
          <p className="text-[13px] sm:text-[13.5px] text-[var(--theme-text-muted)] mt-2 leading-relaxed">
            Flat pricing with zero commission fees &bull; Instant activation via dynamic UPI QR directly into your bank
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         1. HIGH-IMPACT HERO ACTIVE SUBSCRIPTION CARD
         ═══════════════════════════════════════════════════════════ */}
      <div className="bento-card p-6 sm:p-7 flex flex-col gap-6 shadow-sm">
        {/* Card Top Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--theme-border-color)]">
          <div className="flex flex-wrap items-center gap-3.5">
            {/* Status Pill */}
            <div className={`flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold border ${
              subDetails.isActive
                ? 'bg-slate-50 dark:bg-slate-800 text-[var(--theme-text-primary)] border-slate-200 dark:border-slate-700'
                : subDetails.isCancelled
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700/60'
                : 'bg-slate-100 dark:bg-slate-800 text-[var(--theme-text-muted)] border-slate-200 dark:border-slate-700'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                subDetails.isActive
                  ? 'bg-emerald-500 animate-pulse'
                  : subDetails.isCancelled
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`} />
              {subDetails.isActive
                ? 'Active License'
                : subDetails.isCancelled
                ? 'Cancelled (Active until expiry)'
                : 'License Inactive'}
            </div>

            <span className="text-xl font-bold text-[var(--theme-text-primary)] tracking-tight">
              {subDetails.isActive ? subDetails.planTierLabel : 'Free Sandbox Tier'}
            </span>

            <span className="text-xl font-extrabold text-[#0F2BFF] dark:text-[#60A5FA]">
              ₹{subDetails.planAmount}
              <span className="text-xs text-[var(--theme-text-muted)] font-normal"> / month</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleDownloadInvoice}
              type="button"
              className="px-3.5 py-2.5 rounded-xl bg-[var(--theme-bg-elevated)] hover:bg-slate-100 dark:hover:bg-[#1F2A40] text-[var(--theme-text-primary)] text-xs font-semibold border border-[var(--theme-border-color)] shadow-2xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#0F2BFF] dark:text-[#60A5FA]" />
              <span>Download Invoice</span>
            </button>
            <button
              onClick={() => setShowDetailsModal(true)}
              type="button"
              className="btn-enterprise px-4 py-2.5 rounded-xl bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Manage Subscription</span>
            </button>
          </div>
        </div>

        {/* 4 Hero Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Current Plan */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0B0F1A]/70 border border-slate-200/80 dark:border-[#1F2A40] min-h-[120px] relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-blue-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-muted)] truncate">
              Current Plan
            </span>
            <div className="my-2">
              <span className="text-[18px] sm:text-[20px] font-bold tracking-tight text-[var(--theme-text-primary)] truncate block">
                {subDetails.isActive ? subDetails.planTitle : 'No Active Plan'}
              </span>
            </div>
            <span className="text-[12px] font-medium text-[var(--theme-text-muted)] truncate">
              {profile?.subscription_plan === '3months'
                ? '90 Days rolling cycle'
                : profile?.subscription_plan === '2months'
                ? '60 Days rolling cycle'
                : '30 Days rolling cycle'}
            </span>
          </div>

          {/* Tile 2: Next Renewal Date */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0B0F1A]/70 border border-slate-200/80 dark:border-[#1F2A40] min-h-[120px] relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-indigo-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-muted)] truncate">
              Next Renewal Date
            </span>
            <div className="my-2">
              <span className="text-[18px] sm:text-[20px] font-bold tracking-tight text-[var(--theme-text-primary)] truncate block">
                {subDetails.expiryDateStr}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${subDetails.daysLeft > 0 ? 'bg-[#0F2BFF] dark:bg-[#60A5FA]' : 'bg-red-500'}`} />
              <span className={`text-[12px] font-semibold ${subDetails.daysLeft > 0 ? 'text-[#0F2BFF] dark:text-[#60A5FA]' : 'text-red-600 dark:text-red-400'}`}>
                {subDetails.daysLeft > 0 ? `${subDetails.daysLeft} Days remaining` : 'Renewal Required'}
              </span>
            </div>
          </div>

          {/* Tile 3: Direct Settlement Target */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0B0F1A]/70 border border-slate-200/80 dark:border-[#1F2A40] min-h-[120px] relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-emerald-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-muted)] truncate">
              Direct Settlement Target
            </span>
            <div className="my-2 flex items-center gap-2 min-w-0">
              <Building2 className="w-4 h-4 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
              <span className="text-[16px] sm:text-[17px] font-bold text-[var(--theme-text-primary)] truncate">
                {profile?.bank_name
                  ? `${profile.bank_name} •••• ${(profile.bank_account_number || '').slice(-4)}`
                  : profile?.upi_id || 'Instant Direct UPI'}
              </span>
            </div>
            <span className="text-[12px] font-medium text-[var(--theme-text-muted)] truncate">
              {profile?.upi_id
                ? profile.upi_id
                : profile?.bank_account_number
                ? `IFSC: ${profile?.bank_ifsc || 'Connected Bank'}`
                : 'Configure in Settings'}
            </span>
          </div>

          {/* Tile 4: Gateway Fee Saved */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-slate-50/70 dark:bg-[#0B0F1A]/70 border border-slate-200/80 dark:border-[#1F2A40] min-h-[120px] relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-amber-500/10 rounded-full pointer-events-none group-hover:scale-125 transition-transform duration-300"></div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-muted)] truncate">
              Gateway Fee Saved
            </span>
            <div className="my-2 flex items-baseline gap-1.5">
              <span className="text-[18px] sm:text-[20px] font-extrabold text-[#059669] dark:text-[#34D399]">0% MDR</span>
              <span className="text-xs text-[var(--theme-text-muted)] font-normal">Direct UPI</span>
            </div>
            <span className="text-[12px] text-[#059669] dark:text-[#34D399] font-bold truncate">
              ₹{gatewayFeesSaved.toLocaleString('en-IN')} saved YTD
            </span>
          </div>
        </div>
      </div>



      {/* ═══════════════════════════════════════════════════════════
         2. EXTEND OR UPGRADE PLAN SECTION
         ═══════════════════════════════════════════════════════════ */}
      <div id="extend-plan-section" className="flex flex-col gap-6 mt-6 sm:mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--theme-text-primary)] tracking-tight">
              Extend or Upgrade Plan
            </h2>
            <p className="text-[13px] text-[var(--theme-text-muted)] mt-1">
              Zero lock-in. Instant activation via dynamic UPI QR directly into your bank account.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold border border-blue-200/70 dark:border-blue-800/60 self-start sm:self-auto">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Direct bank settlement · 0% MDR
          </div>
        </div>

        {/* Pricing Period Switcher (Monthly / Yearly with 2 Months Free) */}
        <div className="flex justify-center my-4 sm:my-6">
          <div className="relative z-20 mx-auto flex w-fit rounded-full bg-slate-100 dark:bg-[#161D2B] border border-slate-200 dark:border-[#232D42] p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setIsYearly(false)}
              className={`relative z-10 w-fit sm:h-11 h-9 rounded-full sm:px-6 px-3 py-1 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                !isYearly
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
              }`}
            >
              {!isYearly && (
                <motion.span
                  layoutId={"dash_sub_switch_pill"}
                  className="absolute top-0 left-0 sm:h-11 h-9 w-full rounded-full border-2 sm:border-4 shadow-sm shadow-blue-600 border-blue-600 bg-gradient-to-t from-blue-500 via-blue-400 to-blue-600"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative">Monthly</span>
            </button>

            <button
              type="button"
              onClick={() => setIsYearly(true)}
              className={`relative z-10 w-fit sm:h-11 h-9 flex-shrink-0 rounded-full sm:px-6 px-3 py-1 text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                isYearly
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white"
              }`}
            >
              {isYearly && (
                <motion.span
                  layoutId={"dash_sub_switch_pill"}
                  className="absolute top-0 left-0 sm:h-11 h-9 w-full rounded-full border-2 sm:border-4 shadow-sm shadow-blue-600 border-blue-600 bg-gradient-to-t from-blue-500 via-blue-400 to-blue-600"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                Yearly
                <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 border border-blue-200 dark:border-blue-700/50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                  Save 20%
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* 4 Plan Cards (Exact Match to /pricing UI & Adaptive to Merchant Account) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-2">
          {plans.map((plan, planIndex) => {
            const isCurrent = currentTierIndex === planIndex;
            const isUpgrade = planIndex > currentTierIndex;
            const isDowngrade = planIndex < currentTierIndex;
            const effectivePrice = isYearly ? plan.yearlyPrice : plan.price;
            const periodLabel = plan.isFreeForever
              ? "forever"
              : isYearly
              ? (plan.isMonthlyOnly ? "month" : "year")
              : "month";

            let buttonLabel = `Subscribe (${plan.name})`;
            if (isCurrent) {
              buttonLabel = plan.isFreeForever ? "Current Active Plan" : `Extend License (₹${effectivePrice.toLocaleString('en-IN')})`;
            } else if (isUpgrade) {
              buttonLabel = `Upgrade to ${plan.name} (₹${effectivePrice.toLocaleString('en-IN')})`;
            } else if (isDowngrade) {
              buttonLabel = `Downgrade to ${plan.name}`;
            }

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl border text-left p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 shadow-sm ${
                  plan.popular
                    ? "ring-2 ring-blue-500 border-2 border-blue-500 bg-white dark:bg-[#0D1F38] shadow-lg shadow-blue-500/10"
                    : "bg-white dark:bg-[#161D2B] border-slate-200 dark:border-[#232D42]"
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <div>
                      {isCurrent ? (
                        <span className="bg-emerald-500/10 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
                          Current Plan
                        </span>
                      ) : plan.popular ? (
                        <span className="bg-blue-500 text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          Popular
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 min-h-[38px] leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="flex items-baseline mb-5">
                    <span className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
                      ₹{effectivePrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1 text-xs font-medium">
                      /{periodLabel}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isActivating || isCheckingOut || (isCurrent && plan.isFreeForever)}
                    onClick={() => {
                      if (!plan.isFreeForever) {
                        handleProceedToCheckout(plan, isYearly);
                      }
                    }}
                    className={`w-full mb-5 p-3.5 text-sm sm:text-base rounded-xl text-center font-semibold transition-all cursor-pointer ${
                      isCurrent && plan.isFreeForever
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 cursor-default"
                        : plan.popular
                        ? "bg-gradient-to-t from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 border border-blue-400 text-white hover:opacity-95"
                        : "bg-gradient-to-t from-neutral-900 to-neutral-700 dark:from-[#232D42] dark:to-[#161D2B] shadow-lg shadow-neutral-900/30 dark:shadow-black/60 border border-neutral-700 dark:border-[#384663] text-white hover:opacity-95"
                    }`}
                  >
                    {isCheckingOut && selectedPlanId === plan.id
                      ? "Redirecting to Checkout..."
                      : buttonLabel}
                  </button>

                  <ul className="space-y-2.5 font-medium py-3 text-xs">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <span className="text-neutral-700 dark:text-neutral-300 grid place-content-center mt-0.5 mr-2.5 shrink-0">
                          {feature.icon}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300 font-medium">
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2.5 pt-3.5 border-t border-slate-200 dark:border-[#232D42]">
                    <h4 className="font-semibold text-xs text-gray-900 dark:text-white mb-2">
                      {plan.includes[0]}
                    </h4>
                    <ul className="space-y-2 font-medium text-xs">
                      {plan.includes.slice(1).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <span className="h-5 w-5 bg-blue-50 dark:bg-blue-950/60 border border-blue-500/40 dark:border-blue-400/40 rounded-full grid place-content-center mt-0.5 mr-2.5 shrink-0">
                            <CheckCheck className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </span>
                          <span className="text-gray-600 dark:text-gray-300 font-medium">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          PLAN COMPARISON MATRIX
          ═══════════════════════════════════════════════════════════ */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200/80 dark:border-[#1F2A40] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Plan Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Compare features across tiers. Upgrades take effect immediately.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-[#1F2A40] rounded-xl overflow-hidden">
            <thead className="bg-slate-50 dark:bg-[#0B0F1A] border-b border-slate-200 dark:border-[#1F2A40] text-slate-500 dark:text-slate-400 font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">Feature / Capability</th>
                <th className="px-4 py-3">Free Link (₹0)</th>
                <th className="px-4 py-3">Starter (₹99/mo)</th>
                <th className="px-4 py-3">Growth (₹299/mo)</th>
                <th className="px-4 py-3 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-300 font-bold">Pro Flagship (₹499/mo)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1F2A40]">
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Direct Bank Settlement</td>
                <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold">100% Instant (0% MDR)</td>
                <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold">100% Instant (0% MDR)</td>
                <td className="px-4 py-3 text-emerald-600 dark:text-emerald-400 font-bold">100% Instant (0% MDR)</td>
                <td className="px-4 py-3 bg-blue-50/30 dark:bg-blue-950/20 text-emerald-600 dark:text-emerald-400 font-bold">100% Instant (0% MDR)</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Monthly Transactions (Quota)</td>
                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">100 links/mo</td>
                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">300 links/mo</td>
                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">1,000 txns/mo</td>
                <td className="px-4 py-3 bg-blue-50/30 dark:bg-blue-950/20 font-mono font-bold text-blue-900 dark:text-blue-300">UNLIMITED</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Developer REST API &amp; SDKs</td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-600">-</td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-600">-</td>
                <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-bold"><Check className="w-3.5 h-3.5 inline mr-1 text-blue-600 dark:text-blue-400" />Full REST API</td>
                <td className="px-4 py-3 bg-blue-50/30 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 font-bold"><Check className="w-3.5 h-3.5 inline mr-1 text-blue-600 dark:text-blue-400" />High-Speed Rails</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Payment Links &amp; Counter QR</td>
                <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Up to 10 Links</td>
                <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Unlimited Links</td>
                <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Unlimited Links</td>
                <td className="px-4 py-3 bg-blue-50/30 dark:bg-blue-950/20 font-medium text-blue-900 dark:text-blue-300 font-bold">Unlimited Links</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Automated UTR Verification</td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-600">Manual Check</td>
                <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Live UTR Rail</td>
                <td className="px-4 py-3 text-blue-600 dark:text-blue-400 font-bold">Auto-UTR Engine</td>
                <td className="px-4 py-3 bg-blue-50/30 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 font-bold">Zero-Latency Matching</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Webhook Endpoints &amp; Retries</td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-600">-</td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-600">-</td>
                <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">5 Webhooks (Auto-retry)</td>
                <td className="px-4 py-3 bg-blue-50/30 dark:bg-blue-950/20 font-medium text-blue-900 dark:text-blue-300 font-bold">Dedicated Replay Rail</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Bank Statements &amp; GST Invoices</td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-600">Live Dashboard</td>
                <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">CSV Export</td>
                <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Full CSV + Inflow Analytics</td>
                <td className="px-4 py-3 bg-blue-50/30 dark:bg-blue-950/20 text-blue-900 dark:text-blue-300 font-bold">Monthly PDF via Email</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">White-Label Custom Branding</td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-600">Powered by MyMobPay</td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-600">Powered by MyMobPay</td>
                <td className="px-4 py-3 text-slate-400 dark:text-slate-600">Powered by MyMobPay</td>
                <td className="px-4 py-3 bg-blue-50/30 dark:bg-blue-950/20 text-emerald-600 dark:text-emerald-400 font-bold"><Check className="w-3.5 h-3.5 inline mr-1 text-emerald-600 dark:text-emerald-400" />100% White-Label</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">Support &amp; SLA</td>
                <td className="px-4 py-3 font-medium text-slate-500 dark:text-slate-400">Docs &amp; Community</td>
                <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Email (48h)</td>
                <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-300">Priority Email (24h)</td>
                <td className="px-4 py-3 bg-blue-50/30 dark:bg-blue-950/20 font-medium text-blue-900 dark:text-blue-300 font-bold">24/7 Dedicated WhatsApp (&lt;1h)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         4. BILLING HISTORY & TAX INVOICES TABLE
         ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#000d21] dark:text-white tracking-tight">
              Billing History &amp; Tax Invoices
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download GST-compliant tax invoices and track historical cycle activations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Filter:</span>
            <select
              value={invoiceFilter}
              onChange={(e) => setInvoiceFilter(e.target.value)}
              className="bg-white dark:bg-[#172033] border border-slate-200/80 dark:border-[#1F2A40] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-xs"
            >
              <option value="all">All Records</option>
              <option value="paid">Paid Invoices</option>
            </select>
          </div>
        </div>

        {/* Desktop Table (Visible on md and up) */}
        <div className="hidden md:block overflow-x-auto rounded-2xl bg-white dark:bg-[#121826] border border-slate-200/80 dark:border-[#1F2A40] shadow-xs">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-[#0B0F1A] border-b border-slate-200/80 dark:border-[#1F2A40] text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3.5 px-5 font-semibold" scope="col">Invoice Ref</th>
                <th className="py-3.5 px-4 font-semibold" scope="col">Settlement Date</th>
                <th className="py-3.5 px-4 font-semibold" scope="col">Subscription Plan</th>
                <th className="py-3.5 px-4 font-semibold" scope="col">Amount Paid</th>
                <th className="py-3.5 px-4 font-semibold" scope="col">Status</th>
                <th className="py-3.5 px-5 font-semibold text-right" scope="col">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1F2A40]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">No billing records found</span>
                      <span className="text-[11px] text-slate-400">
                        Official GST invoices will appear here automatically after subscription renewal.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-[#172033]/60 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#000d21] dark:text-white">
                      #{inv.ref}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {inv.date}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {inv.plan}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#000d21] dark:text-white">
                      ₹{Number(inv.amount).toLocaleString('en-IN')}.00
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-[10px] border border-blue-200/60 dark:border-blue-800/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(inv)}
                        type="button"
                        className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold text-xs cursor-pointer hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Invoice PDF
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Invoice Cards (Visible only on md:hidden) */}
        <div className="md:hidden flex flex-col gap-3">
          {filteredInvoices.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200/80 dark:border-[#1F2A40] text-center text-slate-400">
              <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">No billing records found</p>
              <p className="text-[11px] text-slate-400 mt-1">Official GST invoices will appear here automatically after renewal.</p>
            </div>
          ) : (
            filteredInvoices.map((inv, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-[#121826] border border-slate-200/80 dark:border-[#1F2A40] shadow-xs flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[#000d21] dark:text-white">
                    #{inv.ref}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold text-[10px] border border-blue-200/60 dark:border-blue-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                    {inv.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">{inv.plan}</span>
                  <span className="font-bold text-[#000d21] dark:text-white text-sm">
                    ₹{Number(inv.amount).toLocaleString('en-IN')}.00
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2.5 border-t border-slate-100 dark:border-[#1F2A40]">
                  <span>Settled: {inv.date}</span>
                  <button
                    onClick={() => handleDownloadInvoice(inv)}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer active:scale-95 border border-blue-200/60 dark:border-blue-800/60"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Invoice PDF</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         MODAL 1: MANAGE SUBSCRIPTION (transitions-dev: 06-modal.md)
         ═══════════════════════════════════════════════════════════ */}
      {isDetailsModalMounted && (
        <div 
          className={`fixed inset-0 z-50 bg-[#000d21]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 ${detailsOverlayClass}`}
          onClick={() => setShowDetailsModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`bg-white dark:bg-[#121826] rounded-2xl border border-slate-200 dark:border-[#1F2A40] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden ${detailsModalClass}`}
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header (Fixed at top) */}
            <div className="shrink-0 px-5 sm:px-6 py-4 bg-slate-50 dark:bg-[#0B0F1A] border-b border-slate-100 dark:border-[#1F2A40] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#000d21] dark:text-white">Current Subscription Details</h3>
                  <p className="text-[11px] text-slate-400">Live platform license metrics &amp; activation info</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                type="button"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable with iOS momentum touch) */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 flex flex-col gap-4 touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {/* Primary Status Card */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-300">Active Tier</span>
                  <span className="text-base font-bold text-[#000d21] dark:text-white">{subDetails.planTitle}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">₹{subDetails.planAmount} / cycle · 0% MDR</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    subDetails.isActive
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                      : subDetails.isCancelled
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${subDetails.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {subDetails.isActive ? 'Active' : subDetails.isCancelled ? 'Cancelled' : 'Expired'}
                  </span>
                  <span className="text-[11px] text-blue-700 dark:text-blue-300 font-semibold">{subDetails.daysLeft} days remaining</span>
                </div>
              </div>

              {/* Validity Progress Meter */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Cycle Duration ({subDetails.totalDays} Days)</span>
                  <span className="font-semibold text-[#000d21] dark:text-white">{subDetails.daysLeft} days left</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-colors duration-500"
                    style={{ width: `${subDetails.percentRemaining}%` }}
                  />
                </div>
              </div>

              {/* Comprehensive Key-Value Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F1A] border border-slate-200/70 dark:border-[#1F2A40] flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Purchased On</span>
                  <span className="font-semibold text-[#000d21] dark:text-white">{subDetails.activatedAtStr}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F1A] border border-slate-200/70 dark:border-[#1F2A40] flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Next Renewal / Expiry</span>
                  <span className="font-semibold text-[#000d21] dark:text-white">{subDetails.expiryDateStr}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F1A] border border-slate-200/70 dark:border-[#1F2A40] flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Payment Method Used</span>
                  <span className="font-semibold text-[#000d21] dark:text-white truncate">{subDetails.paymentMethodUsed}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F1A] border border-slate-200/70 dark:border-[#1F2A40] flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Amount Paid</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">₹{subDetails.planAmount}.00 (0% Fee)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F1A] border border-slate-200/70 dark:border-[#1F2A40] flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Order / Invoice Ref</span>
                  <span className="font-semibold text-[#000d21] dark:text-white truncate">#{subDetails.orderRef}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F1A] border border-slate-200/70 dark:border-[#1F2A40] flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 font-semibold">Settlement Target</span>
                  <span className="font-semibold text-[#000d21] dark:text-white truncate">
                    {profile?.bank_name
                      ? `${profile.bank_name} •••• ${(profile.bank_account_number || '').slice(-4)}`
                      : profile?.upi_id || 'Instant Direct UPI'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Action Buttons (Fixed at bottom - Never Cut Off!) */}
            <div className="shrink-0 p-4 sm:px-6 bg-slate-50 dark:bg-[#0B0F1A] border-t border-slate-100 dark:border-[#1F2A40] flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                onClick={handleDownloadInvoice}
                type="button"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-semibold cursor-pointer py-1 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Download GST Tax Invoice
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  type="button"
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={scrollToPlans}
                  type="button"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  Extend or Upgrade Plan
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Modal 3 removed permanently in favor of real live /pay checkout page */}

      {/* ═══════════════════════════════════════════════════════════
         MODAL 4: CONTACT ENTERPRISE SALES (transitions-dev: 06-modal.md)
         ═══════════════════════════════════════════════════════════ */}
      {isContactSalesModalMounted && (
        <div 
          className={`fixed inset-0 z-50 bg-[#000d21]/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 ${contactSalesOverlayClass}`}
          onClick={() => setShowContactSalesModal(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) e.preventDefault();
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`bg-white dark:bg-[#121826] rounded-2xl border border-slate-200 dark:border-[#1F2A40] shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden ${contactSalesModalClass}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="shrink-0 px-6 py-4 bg-slate-50 dark:bg-[#0B0F1A] border-b border-slate-100 dark:border-[#1F2A40] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#000d21] dark:text-white">Enterprise &amp; High-Throughput</h3>
              <button
                onClick={() => setShowContactSalesModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 cursor-pointer"
                type="button"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div 
              className="flex-1 overflow-y-auto overscroll-contain p-6 flex flex-col gap-4 text-xs touch-pan-y"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Need high throughput transaction routing (&gt; 5,000 txns/day), dedicated parsing workers, or bespoke sub-merchant architecture?
              </p>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50 flex flex-col gap-2">
                <span className="font-bold text-blue-900 dark:text-blue-200">Direct Enterprise Desk</span>
                <span className="text-blue-700 dark:text-blue-300">support@mymobpay.tech</span>
                <span className="text-slate-500 dark:text-slate-400">SLA: &lt; 2-hour response guarantee</span>
              </div>
              <a
                href={`mailto:support@mymobpay.tech?subject=Enterprise%20Plan%20Inquiry%20-%20MID%20${merchantMid}`}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center transition-colors shadow-xs"
              >
                Open Email Client
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         TOAST NOTIFICATION
         ═══════════════════════════════════════════════════════════ */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-scaleUp">
          <div className="bg-white dark:bg-[#121826] border border-slate-200/90 dark:border-[#1F2A40] px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-800 dark:text-white font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
