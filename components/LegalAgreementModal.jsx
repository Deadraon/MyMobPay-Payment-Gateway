'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Scale,
  Ban,
  CreditCard,
  CheckCircle2,
  ExternalLink,
  Check,
  Lock,
  AlertTriangle,
  Landmark,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

// ── Authentic Indian Tricolour Flag SVG ──
const IndianFlag = ({ className = 'w-4 h-3' }) => (
  <svg
    className={`${className} rounded-[1.5px] overflow-hidden shrink-0 inline-block`}
    viewBox="0 0 640 480"
    aria-label="India Flag"
  >
    <path fill="#FF9933" d="M0 0h640v160H0z" />
    <path fill="#FFFFFF" d="M0 160h640v160H0z" />
    <path fill="#138808" d="M0 320h640v160H0z" />
    <circle cx="320" cy="240" r="40" fill="none" stroke="#000080" strokeWidth="6" />
    <circle cx="320" cy="240" r="8" fill="#000080" />
    <g stroke="#000080" strokeWidth="2.5">
      {Array.from({ length: 24 }).map((_, i) => (
        <line
          key={i}
          x1="320"
          y1="240"
          x2={320 + 38 * Math.cos((i * 15 * Math.PI) / 180)}
          y2={240 + 38 * Math.sin((i * 15 * Math.PI) / 180)}
        />
      ))}
    </g>
  </svg>
);

export default function LegalAgreementModal({
  isOpen,
  onClose,
  onAccept,
  initialTab = 'overview'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* ── Soft Atmospheric Scrim ── */}
      <div
        className="fixed inset-0 bg-[#0d253d]/45 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
      />

      {/* ── Modal Dialog (Clean Slate Theme • Seamless & Borderless) ── */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="relative w-full max-w-2xl bg-white text-slate-800 rounded-3xl shadow-[0_20px_70px_-15px_rgba(13,37,61,0.22)] flex flex-col max-h-[88vh] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* ── Header ── */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 bg-white flex items-start justify-between shrink-0">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 mt-0.5">
              <Scale className="w-5 h-5 text-slate-700" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
                  <IndianFlag className="w-3.5 h-2.5" />
                  <span>RBI PSS Act 2007 Guidelines</span>
                </span>
                <span className="text-[10px] text-slate-600 font-mono hidden sm:inline-block">v2.5</span>
              </div>
              <h2 id="legal-modal-title" className="text-sm sm:text-base font-semibold text-[#0d253d] tracking-tight leading-snug">
                Merchant Operating Rules &amp; Legal Terms
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-3"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Seamless Capsule Segmented Tab Bar (Smooth Horizontal Scroll, No Awkward Wrap) ── */}
        <div className="px-4 sm:px-6 pb-2.5 bg-white shrink-0 overflow-x-auto scrollbar-none">
          <div className="bg-slate-100/80 p-1 rounded-2xl inline-flex items-center gap-1 min-w-full sm:min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'bg-white text-[#0d253d] font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Direct Settlement</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('prohibited')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'prohibited'
                  ? 'bg-white text-[#0d253d] font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Prohibited Goods</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'bg-white text-[#0d253d] font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Merchant Guidelines</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`px-3 py-1.5 rounded-xl text-xs transition-all duration-150 cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                activeTab === 'security'
                  ? 'bg-white text-[#0d253d] font-semibold shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Anti-Fraud &amp; Law</span>
            </button>
          </div>
        </div>

        {/* ── Scrollable Body Content (Border-Free Soft Surfaces) ── */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">

          {/* TAB 1: OVERVIEW & DIRECT SETTLEMENT */}
          {activeTab === 'overview' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 text-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                  Statutory Notice • Non-Custodial Architecture
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  MyMobPay operates strictly as a <strong className="text-slate-900 font-semibold">technical software routing provider</strong> under Section 18 of the Payment and Settlement Systems Act, 2007. We are not a payment aggregator, digital wallet, or escrow repository. We never hold, pool, or manage merchant or customer funds.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>0% Transaction Commission</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">
                    You keep 100% of your customer volume. Payments settle directly into your bank account with zero middleman fee deductions.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 space-y-1">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-xs">
                    <CreditCard className="w-4 h-4 text-slate-700 shrink-0" />
                    <span>Instant NPCI UPI Settlement</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-normal">
                    Buyers transfer directly to your bank UPI address in 0 seconds. Money routes directly on banking rails.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 space-y-1 sm:col-span-2">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Merchant Sole Refund Responsibility</span>
                  </div>
                  <p className="text-xs text-amber-900/80 leading-normal">
                    Because MyMobPay maintains zero custodial balances, <strong className="text-amber-950 font-medium">all customer refunds, order cancellations, and chargebacks must be issued directly by you</strong> using your bank UPI or net-banking application.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROHIBITED BUSINESSES */}
          {activeTab === 'prohibited' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-slate-50 text-slate-700 text-xs flex items-start gap-2.5">
                <Ban className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong className="text-slate-900 font-semibold">Prohibited Categories:</strong> Accounts routing payments for the following goods or services are subject to immediate termination in compliance with Indian cyber laws.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors text-xs space-y-1">
                  <span className="font-semibold text-slate-900 block">Illegal Gambling &amp; Betting</span>
                  <p className="text-slate-500 leading-normal">Sports betting, casino wagering, lotteries, or chance games prohibited under the Public Gambling Act, 1867.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors text-xs space-y-1">
                  <span className="font-semibold text-slate-900 block">Unlicensed Financial Schemes</span>
                  <p className="text-slate-500 leading-normal">Multi-level marketing (MLM), pyramid schemes, unauthorized forex, or unregistered crypto pre-sales.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors text-xs space-y-1">
                  <span className="font-semibold text-slate-900 block">Controlled Substances &amp; Drugs</span>
                  <p className="text-slate-500 leading-normal">Narcotics, illegal chemicals, or prescription pharmaceuticals sold without state pharmacy licenses.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors text-xs space-y-1">
                  <span className="font-semibold text-slate-900 block">Adult Content &amp; Media</span>
                  <p className="text-slate-500 leading-normal">Pornography, sexually explicit media, escort directories, or non-consensual material.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors text-xs space-y-1">
                  <span className="font-semibold text-slate-900 block">Weapons &amp; Hazardous Goods</span>
                  <p className="text-slate-500 leading-normal">Firearms, ammunition, tactical knives, explosive items, or fireworks without statutory permits.</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors text-xs space-y-1">
                  <span className="font-semibold text-slate-900 block">Scams, Phishing &amp; Malware</span>
                  <p className="text-slate-500 leading-normal">Phished credentials, social media bot followers, hacking scripts, or deceptive brand impersonation.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MERCHANT OPERATING RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="space-y-2 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">01</span>
                    <span className="font-semibold text-slate-900">Transparent Pricing &amp; No Surcharging</span>
                  </div>
                  <p className="text-slate-500 pl-7.5 leading-relaxed">
                    All payment requests must reflect genuine order amounts. Adding hidden convenience fees or surcharging buyers for choosing UPI is strictly prohibited under NPCI guidelines.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">02</span>
                    <span className="font-semibold text-slate-900">Authentic Business Identity &amp; Support Channels</span>
                  </div>
                  <p className="text-slate-500 pl-7.5 leading-relaxed">
                    You must display an authentic business name, reachable customer support email, and contact phone number on your website, app, or checkout links.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">03</span>
                    <span className="font-semibold text-slate-900">Prompt Delivery &amp; Support Responsiveness</span>
                  </div>
                  <p className="text-slate-500 pl-7.5 leading-relaxed">
                    Fulfill digital and physical orders within the promised timeframe. Respond to customer inquiries or payment concerns within 48 business hours.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">04</span>
                    <span className="font-semibold text-slate-900">Clear Refund &amp; Cancellation Terms</span>
                  </div>
                  <p className="text-slate-500 pl-7.5 leading-relaxed">
                    Maintain a visible refund policy. If goods cannot be fulfilled or delivery fails, you must issue a direct refund to the customer&apos;s UPI address.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANTI-FRAUD & STATUTORY LAW */}
          {activeTab === 'security' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-slate-50 text-slate-800 text-xs space-y-2">
                <span className="font-semibold block text-sm flex items-center gap-2 text-slate-900">
                  <Lock className="w-4 h-4 text-slate-700 shrink-0" />
                  <span>UTR Integrity &amp; Information Technology Act 2000</span>
                </span>
                <p className="text-slate-600 leading-relaxed">
                  Submitting synthetic or forged Unique Transaction Reference (UTR) numbers, tampering with notification forwarder apps, or spoofing bank SMS alerts violates <strong className="text-slate-900 font-semibold">Sections 43, 66, and 66D of the Information Technology Act, 2000</strong>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 text-xs space-y-2 text-slate-600">
                <p className="leading-relaxed">
                  <strong className="text-slate-900 font-semibold">PMLA 2002 Record Retention:</strong> In compliance with the Prevention of Money Laundering Act (PMLA), 2002, merchants are required to retain commercial transaction records and fulfillment proof for at least five (5) years.
                </p>
                <p className="leading-relaxed text-slate-500">
                  <strong className="text-slate-800 font-semibold">Law Enforcement Cooperation:</strong> MyMobPay cooperates fully with Indian law enforcement agencies (LEAs), CERT-In, and the National Cyber Crime Reporting Portal upon receipt of lawful notices.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ── Footer Bar ── */}
        <div className="p-4 sm:p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <Link
            href="/terms"
            target="_blank"
            className="text-xs text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1.5 font-medium group"
          >
            <span>Read Complete Terms of Service</span>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                if (onAccept) onAccept();
                onClose();
              }}
              className="px-5 py-2.5 rounded-full bg-[#0d253d] hover:bg-[#1a385c] active:bg-[#071524] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>I Understand &amp; Accept Rules</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
