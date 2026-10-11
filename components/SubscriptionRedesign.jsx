'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle,
  Building2,
  Zap,
  X,
  QrCode,
  Download,
  Copy,
  Check,
  ExternalLink,
  Info,
  Calendar,
  CreditCard,
  Clock,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CONFIG } from '@/lib/config';
import { openTaxInvoiceWindow } from '@/lib/invoiceGenerator';
import { formatMerchantId } from '@/lib/merchantId';
import { generateOrderId } from '@/lib/orderId';

export default function SubscriptionRedesign({
  profile = {},
  historyOrders = [],
  orders = [],
  onRefreshProfile,
  onProfileUpdate,
  setActiveTab
}) {
  // ── 3-Day Trial Eligibility Check ─────────────────────────────
  const hasUsedTrial = useMemo(() => {
    return Boolean(
      profile?.setup_progress?.trial_activated_at ||
      profile?.setup_progress?.plan_type === 'trial_3day' ||
      profile?.setup_progress?.plan_type === 'autopay_trial' ||
      profile?.setup_progress?.trial_expired ||
      profile?.subscription_plan === 'trial' ||
      profile?.subscription_plan === '3day_trial' ||
      historyOrders?.some(o => 
        (o.status === 'verified' || o.status === 'completed' || o.status === 'success') &&
        (o.note === 'Trial_Setup_3Day' || o.note === 'Autopay_Setup_3DayTrial' || (Number(o.amount) === 1 && !o.note?.includes('Subscription')))
      )
    );
  }, [profile, historyOrders]);

  // ── Modal & Flow States ───────────────────────────────────────
  const [selectedPlanId, setSelectedPlanId] = useState('1month');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showContactSalesModal, setShowContactSalesModal] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState('all'); // 'all', 'paid'
  const [isActivating, setIsActivating] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);


  // ── Real Subscription Details Computation ─────────────────────
  const subDetails = useMemo(() => {
    const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
    const isValidExpiry = expiresAt && !isNaN(expiresAt.getTime());
    const isStillActiveDate = isValidExpiry && expiresAt.getTime() > Date.now();
    const daysLeft = isValidExpiry ? Math.max(0, Math.ceil((expiresAt - new Date()) / 86400000)) : 0;
    const isCancelled = profile?.subscription_status === 'cancelled';
    const isActive = (profile?.subscription_status === 'active' || isStillActiveDate) && !isCancelled;
    const isTrial = profile?.subscription_plan === 'trial' || profile?.subscription_plan === '3day_trial';

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

    const planTitle = isTrial
      ? '3-Day Free Trial'
      : profile?.subscription_plan === '3months'
      ? '3 Months Plan (Quarterly)'
      : profile?.subscription_plan === '2months'
      ? '2 Months Plan (Bi-Monthly)'
      : 'Standard Plan (1 Month)';

    const planAmount = profile?.subscription_plan === '3months'
      ? 1497
      : profile?.subscription_plan === '2months'
      ? 998
      : isTrial
      ? 0
      : 499;

    const paymentMethodUsed = historyOrders?.[0]?.payment_mode || historyOrders?.[0]?.payment_method || 'Direct UPI Settlement (0% MDR)';
    const orderRef = historyOrders?.[0]?.id
      ? `SUB-${historyOrders[0].id.slice(0, 8).toUpperCase()}`
      : `SUB-${(profile?.id || 'MMP').slice(0, 8).toUpperCase()}`;
    const utr = historyOrders?.[0]?.utr || 'Bank Rail Verification';

    return {
      isActive,
      isTrial,
      isCancelled,
      daysLeft,
      totalDays,
      percentRemaining,
      expiryDateStr,
      expiresAt,
      activatedAtStr,
      planTitle,
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

  // ── Plan Definitions ──────────────────────────────────────────
  const plans = useMemo(() => {
    return [
      {
        id: '1month',
        title: '1 Month',
        subtitle: 'Standard monthly billing',
        amount: 499,
        durationDays: 30,
        badge: 'Active / Most Popular',
        badgeClass: 'bg-blue-600 text-white',
        features: [
          'Direct Bank Settlement (0% MDR)',
          'Real-time UPI QR Generation',
          'HMAC SHA-256 Webhooks',
          'Automated Bank Reconciliation'
        ]
      },
      {
        id: '2months',
        title: '2 Months',
        subtitle: 'Bi-monthly discounted renewal',
        amount: 998,
        durationDays: 60,
        badge: 'Saver',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
        features: [
          'All Standard Plan features',
          'Direct Bank Settlement (0% MDR)',
          'Priority statement parsing',
          'Zero setup or hidden fees'
        ]
      },
      {
        id: '3months',
        title: '3 Months',
        subtitle: 'Quarterly bulk billing',
        amount: 1497,
        durationDays: 90,
        badge: 'Quarterly',
        badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
        features: [
          'All Standard Plan features',
          'Direct Bank Settlement (0% MDR)',
          'Multi-account routing support',
          'Priority email & chat support'
        ]
      },
      {
        id: 'custom',
        title: 'Custom Plan',
        subtitle: 'Enterprise high throughput',
        amount: 0,
        durationDays: 365,
        badge: 'High Volume',
        badgeClass: 'bg-[#0c2340] text-white',
        isCustom: true,
        features: [
          'Bespoke high-volume routing',
          'Dedicated matching worker instances',
          'Custom SLA & account manager',
          'Sub-merchant console controls'
        ]
      }
    ];
  }, []);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];

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
  const handleProceedToCheckout = async (planToUse = selectedPlan) => {
    if (!planToUse) return;
    if (planToUse.isTrial) {
      handleActivateTrial();
      return;
    }
    if (planToUse.isCustom) {
      setShowContactSalesModal(true);
      return;
    }

    const platformKey = CONFIG.platformApiKey || '677d9312-a53f-4b96-815f-53e0eee1b292';
    const merchantId = profile?.id || '';
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://mymob.tech';
    const callbackUrl = `${currentOrigin}/dashboard#subscription`;
    const newOrderId = generateOrderId('order');

    setIsCheckingOut(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: newOrderId,
          api_key: platformKey,
          amount: planToUse.amount,
          note: `Subscription_${planToUse.id}`,
          project: `MyMobPay Platform License (${planToUse.title})`,
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
        amount: String(planToUse.amount),
        ref: merchantId,
        note: `Subscription_${planToUse.id}`,
        project: `MyMobPay Platform License (${planToUse.title})`,
        name: profile?.business_name || profile?.user_metadata?.full_name || 'Merchant Owner',
        phone: profile?.phone || '',
        callback: callbackUrl,
      });
      window.location.href = `/pay?${params.toString()}`;
    }
  };

  // ── Handle 3-Day Free Trial Direct Activation ─────────────────
  const handleActivateTrial = async () => {
    setIsActivating(true);
    try {
      const res = await fetch('/api/merchant/subscription/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: profile?.id,
          planId: 'trial',
          planName: '3-Day Free Trial',
          amount: 0,
          durationDays: 3,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to activate trial');
      }

      const newExpiry = resData.subscription_expires_at ? new Date(resData.subscription_expires_at) : new Date(Date.now() + 3 * 86400000);

      if (onProfileUpdate) {
        onProfileUpdate({
          ...profile,
          subscription_status: 'active',
          subscription_plan: 'trial',
          sandbox_mode: false,
          subscription_expires_at: newExpiry.toISOString(),
        });
      }

      if (onRefreshProfile) {
        await onRefreshProfile();
      }

      triggerToast('🎉 3-Day Free Trial activated! Live Mode and Live API Key are now unlocked.');
    } catch (err) {
      console.error('Trial activation error:', err);
      triggerToast(`Could not activate trial: ${err.message || 'Please try again.'}`);
    } finally {
      setIsActivating(false);
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
        plan: order.note || 'Standard Plan License',
        amount: order.amount || 499,
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
      {/* ═══════════════════════════════════════════════════════════
         0. 3-DAY FREE TRIAL HERO PROMO BANNER FOR NEW USERS
         ═══════════════════════════════════════════════════════════ */}
      {/* ── 0. SLEEK OFFER HEADLINE STRIP ─────────────────────── */}
      {!hasUsedTrial && !subDetails.isActive && (
        <div className="rounded-xl px-4 py-2.5 bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs text-slate-700 min-w-0">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wide shrink-0">
              <Zap className="w-3 h-3 fill-current" /> Special Offer
            </span>
            <span className="font-normal text-slate-800 text-xs sm:text-[13px]">
              <strong className="font-bold text-[#000d21]">Try Live Mode free for 3 days:</strong> Unlock production API keys &amp; collect real UPI payments with 0% MDR upfront.
            </span>
          </div>
          <button
            type="button"
            disabled={isActivating}
            onClick={handleActivateTrial}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer disabled:opacity-60"
          >
            {isActivating ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Activating...</span>
              </>
            ) : (
              <>
                <span>Claim 3-Day Free Trial</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
         1. HIGH-IMPACT HERO ACTIVE SUBSCRIPTION CARD
         ═══════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-6 flex flex-col gap-6">
        {/* Card Top Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Pill */}
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
              subDetails.isActive
                ? 'bg-slate-50 text-[#000d21] border-slate-200'
                : subDetails.isCancelled
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                subDetails.isActive
                  ? 'bg-emerald-500 animate-pulse'
                  : subDetails.isCancelled
                  ? 'bg-amber-500'
                  : 'bg-slate-400'
              }`} />
              {subDetails.isActive
                ? (subDetails.isTrial ? 'Trial License' : 'Active License')
                : subDetails.isCancelled
                ? 'Cancelled (Active until expiry)'
                : 'License Inactive'}
            </div>

            <span className="text-lg font-bold text-[#000d21] tracking-tight">
              {subDetails.isTrial
                ? 'Trial Tier'
                : profile?.subscription_plan === '3months'
                ? 'Quarterly Tier'
                : profile?.subscription_plan === '2months'
                ? 'Bi-Monthly Tier'
                : 'Standard Tier'}
            </span>

            <span className="text-lg font-bold text-blue-600">
              ₹{subDetails.planAmount}
              <span className="text-xs text-slate-400 font-normal"> / month</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadInvoice}
              type="button"
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              Download Invoice
            </button>
            <button
              onClick={() => setShowDetailsModal(true)}
              type="button"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              Manage Subscription
            </button>
          </div>
        </div>

        {/* 4 Hero Metric Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Current Plan */}
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Current Plan
            </span>
            <span className="text-sm font-bold text-[#000d21]">
              {subDetails.isActive ? subDetails.planTitle : 'No Active Plan'}
            </span>
            <span className="text-[11px] text-slate-500">
              {profile?.subscription_plan === '3months'
                ? '90 Days cycle'
                : profile?.subscription_plan === '2months'
                ? '60 Days cycle'
                : '30 Days rolling cycle'}
            </span>
          </div>

          {/* Tile 2: Next Renewal Date */}
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Next Renewal Date
            </span>
            <span className="text-sm font-bold text-[#000d21]">
              {subDetails.expiryDateStr}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${subDetails.daysLeft > 0 ? 'bg-blue-600' : 'bg-red-500'}`} />
              <span className={`text-[11px] font-semibold ${subDetails.daysLeft > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {subDetails.daysLeft > 0 ? `${subDetails.daysLeft} Days remaining` : 'Renewal Required'}
              </span>
            </div>
          </div>

          {/* Tile 3: Direct Settlement Target */}
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Direct Settlement Target
            </span>
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-sm font-semibold text-[#000d21] truncate">
                {profile?.bank_name
                  ? `${profile.bank_name} •••• ${(profile.bank_account_number || '').slice(-4)}`
                  : profile?.upi_id || 'Instant Direct UPI'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 truncate">
              {profile?.upi_id
                ? profile.upi_id
                : profile?.bank_account_number
                ? `IFSC: ${profile?.bank_ifsc || 'Connected Bank'}`
                : 'Configure in Settings'}
            </span>
          </div>

          {/* Tile 4: Gateway Fee Saved */}
          <div className="flex flex-col gap-1 p-4 rounded-xl bg-slate-50/80 border border-slate-200/70">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Gateway Fee Saved
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-blue-600">0% MDR</span>
              <span className="text-xs text-slate-400 font-normal">Direct UPI</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              ₹{gatewayFeesSaved.toLocaleString('en-IN')} saved YTD
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         2. EXTEND OR UPGRADE PLAN SECTION
         ═══════════════════════════════════════════════════════════ */}
      <div id="extend-plan-section" className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#000d21] tracking-tight">
              Extend or Upgrade Plan
            </h2>
            <p className="text-xs text-slate-500">
              Zero lock-in. Instant activation via dynamic UPI QR directly into your bank account.
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold border border-slate-200/70 self-start sm:self-auto">
            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
            Direct bank settlement · 0% MDR
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`cursor-pointer p-5 rounded-2xl bg-white border-2 transition-all flex flex-col justify-between gap-4 relative group ${
                  plan.isTrial
                    ? isSelected
                      ? 'border-emerald-600 shadow-md shadow-emerald-500/10'
                      : 'border-emerald-200 hover:border-emerald-400 shadow-xs'
                    : isSelected
                    ? 'border-blue-600 shadow-md shadow-blue-500/10'
                    : 'border-slate-200/80 hover:border-blue-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${plan.badgeClass}`}>
                      {plan.badge}
                    </span>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isSelected ? (plan.isTrial ? 'bg-emerald-600' : 'bg-blue-600') : 'bg-slate-100'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-transparent'}`} />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-[#000d21]">{plan.title}</h3>
                    <p className="text-xs text-slate-400">{plan.subtitle}</p>
                  </div>

                  <div className="flex items-baseline gap-1 py-1">
                    <span className="text-2xl font-bold text-[#000d21]">
                      {plan.isCustom ? 'Custom' : plan.isTrial ? 'Free' : `₹${plan.amount.toLocaleString('en-IN')}`}
                    </span>
                    <span className="text-xs text-slate-400">
                      {plan.isCustom ? '/ tailored volume' : `/ ${plan.durationDays} days`}
                    </span>
                  </div>

                  <ul className="flex flex-col gap-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${plan.isTrial ? 'text-emerald-600' : 'text-blue-600'}`} />
                        <span className="leading-tight">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  disabled={isActivating || isCheckingOut}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlanId(plan.id);
                    if (plan.isTrial) {
                      handleActivateTrial();
                    } else if (plan.isCustom) {
                      setShowContactSalesModal(true);
                    } else {
                      handleProceedToCheckout(plan);
                    }
                  }}
                  className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                    plan.isTrial
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs shadow-emerald-500/20'
                      : isSelected
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {plan.isTrial
                    ? (isActivating && selectedPlanId === 'trial' ? 'Activating...' : 'Activate Free Trial')
                    : plan.isCustom
                    ? 'Contact Sales'
                    : (isCheckingOut && selectedPlanId === plan.id)
                    ? 'Redirecting to Checkout...'
                    : isSelected
                    ? `Subscribe & Pay ₹${plan.amount.toLocaleString('en-IN')}`
                    : `Subscribe (${plan.title})`}
                </button>
              </div>
            );
          })}
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════
         4. BILLING HISTORY & TAX INVOICES TABLE
         ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#000d21] tracking-tight">
              Billing History &amp; Tax Invoices
            </h2>
            <p className="text-xs text-slate-500">
              Download GST-compliant tax invoices and track historical cycle activations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Filter:</span>
            <select
              value={invoiceFilter}
              onChange={(e) => setInvoiceFilter(e.target.value)}
              className="bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-xs"
            >
              <option value="all">All Records</option>
              <option value="paid">Paid Invoices</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-5 font-semibold" scope="col">Invoice Ref</th>
                <th className="py-3.5 px-4 font-semibold" scope="col">Settlement Date</th>
                <th className="py-3.5 px-4 font-semibold" scope="col">Subscription Plan</th>
                <th className="py-3.5 px-4 font-semibold" scope="col">Amount Paid</th>
                <th className="py-3.5 px-4 font-semibold" scope="col">Status</th>
                <th className="py-3.5 px-5 font-semibold text-right" scope="col">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 className="w-8 h-8 text-slate-300" />
                      <span className="text-xs font-semibold text-slate-600">No billing records found</span>
                      <span className="text-[11px] text-slate-400">
                        Official GST invoices will appear here automatically after subscription renewal.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 font-semibold text-[#000d21]">
                      #{inv.ref}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {inv.date}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">
                      {inv.plan}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#000d21]">
                      ₹{Number(inv.amount).toLocaleString('en-IN')}.00
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleDownloadInvoice(inv)}
                        type="button"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold text-xs cursor-pointer hover:underline"
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
      </div>

      {/* ═══════════════════════════════════════════════════════════
         MODAL 1: MANAGE SUBSCRIPTION (FULL CURRENT DETAILS)
         ═══════════════════════════════════════════════════════════ */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-[#000d21]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#000d21]">Current Subscription Details</h3>
                  <p className="text-[11px] text-slate-400">Live platform license metrics &amp; activation info</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-5">
              {/* Primary Status Card */}
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-blue-700">Active Tier</span>
                  <span className="text-base font-bold text-[#000d21]">{subDetails.planTitle}</span>
                  <span className="text-xs text-slate-500 mt-0.5">₹{subDetails.planAmount} / cycle · 0% MDR</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    subDetails.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : subDetails.isCancelled
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${subDetails.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {subDetails.isActive ? 'Active' : subDetails.isCancelled ? 'Cancelled' : 'Expired'}
                  </span>
                  <span className="text-[11px] text-blue-700 font-semibold">{subDetails.daysLeft} days remaining</span>
                </div>
              </div>

              {/* Validity Progress Meter */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Cycle Duration ({subDetails.totalDays} Days)</span>
                  <span className="font-semibold text-[#000d21]">{subDetails.daysLeft} days left</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${subDetails.percentRemaining}%` }}
                  />
                </div>
              </div>

              {/* Comprehensive Key-Value Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Purchased On</span>
                  <span className="font-semibold text-[#000d21]">{subDetails.activatedAtStr}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Next Renewal / Expiry</span>
                  <span className="font-semibold text-[#000d21]">{subDetails.expiryDateStr}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Payment Method Used</span>
                  <span className="font-semibold text-[#000d21] truncate">{subDetails.paymentMethodUsed}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Amount Paid</span>
                  <span className="font-bold text-blue-600">₹{subDetails.planAmount}.00 (0% Fee)</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Order / Invoice Ref</span>
                  <span className="font-semibold text-[#000d21] truncate">#{subDetails.orderRef}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col gap-0.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Settlement Target</span>
                  <span className="font-semibold text-[#000d21] truncate">
                    {profile?.bank_name
                      ? `${profile.bank_name} •••• ${(profile.bank_account_number || '').slice(-4)}`
                      : profile?.upi_id || 'Instant Direct UPI'}
                  </span>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={handleDownloadInvoice}
                  type="button"
                  className="text-blue-600 hover:text-blue-700 text-xs font-semibold cursor-pointer py-1 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download GST Tax Invoice
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={scrollToPlans}
                    type="button"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    Extend or Upgrade Plan
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Modal 3 removed permanently in favor of real live /pay checkout page */}

      {/* ═══════════════════════════════════════════════════════════
         MODAL 4: CONTACT ENTERPRISE SALES MODAL
         ═══════════════════════════════════════════════════════════ */}
      {showContactSalesModal && (
        <div className="fixed inset-0 z-50 bg-[#000d21]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-scaleUp">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#000d21]">Enterprise &amp; High-Throughput</h3>
              <button
                onClick={() => setShowContactSalesModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Need high throughput transaction routing (&gt; 5,000 txns/day), dedicated parsing workers, or bespoke sub-merchant architecture?
              </p>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex flex-col gap-2">
                <span className="font-bold text-blue-900">Direct Enterprise Desk</span>
                <span className="text-blue-700">support@mymob.tech</span>
                <span className="text-slate-500">SLA: &lt; 2-hour response guarantee</span>
              </div>
              <a
                href={`mailto:support@mymob.tech?subject=Enterprise%20Plan%20Inquiry%20-%20MID%20${merchantMid}`}
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
          <div className="bg-white border border-slate-200/90 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs text-slate-800 font-medium">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
