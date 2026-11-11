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
  Smartphone,
  Landmark,
  FileText,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

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
      {/* Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-150 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Merchant Legal Agreement &amp; Operating Rules</span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Mandatory terms for all new merchants • RBI PSS Act 2007 non-custodial software
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-150 text-slate-500 hover:text-slate-800 flex items-center justify-center border border-slate-200 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Tab Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-150 bg-white flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" />
            <span>Overview &amp; Settlement</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prohibited')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'prohibited'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'text-rose-700 bg-rose-50/70 border border-rose-200/80 hover:bg-rose-100'
            }`}
          >
            <Ban className="w-3.5 h-3.5 text-rose-500" />
            <span>Prohibited Businesses</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Merchant Guidelines</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Anti-Fraud &amp; Law</span>
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">

          {/* TAB 1: OVERVIEW & DIRECT SETTLEMENT */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 text-blue-950 space-y-1.5">
                <span className="font-bold text-xs uppercase tracking-wider text-blue-700 block">
                  Statutory Notice • RBI PSS Act 2007 Non-Custodial Architecture
                </span>
                <p className="text-xs sm:text-sm text-blue-900/90 leading-relaxed">
                  MyMobPay operates strictly as a <strong>software technology routing provider</strong> and is NOT a payment aggregator, digital wallet, or escrow agent. We never hold, pool, or manage merchant or customer funds.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>0% Per-Transaction Commission</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    You keep 100% of your sales volume. Every payment settles directly into your bank account with zero middleman deductions.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold text-xs">
                    <CreditCard className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Real-Time Direct Bank Settlement</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    Customers pay directly via NPCI UPI rails into your verified bank account in 0 seconds. MyMobPay never sits in the fund flow.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1 sm:col-span-2">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Merchant Sole Refund &amp; Dispute Responsibility</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-normal">
                    Because MyMobPay holds zero merchant funds, <strong>all customer refunds, order cancellations, and chargebacks must be issued directly by you (the merchant)</strong> to your buyer using your bank UPI or net-banking application.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROHIBITED BUSINESSES */}
          {activeTab === 'prohibited' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-start gap-2">
                <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  Strictly Prohibited Goods &amp; Services: Accounts violating these rules will be terminated immediately and reported to cybercrime authorities.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">Illegal Gambling &amp; Betting</span>
                  <p className="text-slate-650">Sports betting, casino wagering, lottery apps, or games of chance prohibited under Indian law.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">Unlicensed Financial Schemes</span>
                  <p className="text-slate-650">MLM / pyramid schemes, unauthorized forex, HYIP, or unregistered crypto pre-sales.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">Controlled Substances &amp; Drugs</span>
                  <p className="text-slate-650">Narcotics, illegal chemicals, or prescription medicine sales without valid state pharmacy licenses.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">Adult Content &amp; Media</span>
                  <p className="text-slate-650">Pornography, sexually explicit media, escort directories, or non-consensual content.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">Weapons &amp; Dangerous Items</span>
                  <p className="text-slate-650">Firearms, ammunition, tactical knives, explosive items, or fireworks without statutory permits.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="font-bold text-slate-900 block">Scams, Phishing &amp; Malware</span>
                  <p className="text-slate-650">Phished credentials, social media bot followers, hacking scripts, or deceptive brand impersonation.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MERCHANT OPERATING RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">1. Accurate Product Details &amp; Transparent Pricing</span>
                  <p className="text-slate-650">
                    All payment requests must correspond to genuine orders. Surcharging buyers for choosing UPI or adding undisclosed hidden convenience fees is strictly prohibited.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">2. Visible Merchant Identity &amp; Contact Details</span>
                  <p className="text-slate-650">
                    You must display an authentic business name, customer support email, and contact phone number on your website or app.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">3. Prompt Delivery &amp; Support Responsiveness</span>
                  <p className="text-slate-650">
                    Fulfill digital and physical orders within the promised timeframe. Respond to customer inquiries or payment concerns within 48 business hours.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-900 block">4. Fair Refund &amp; Cancellation Policy</span>
                  <p className="text-slate-650">
                    Maintain a clear refund policy on your checkout page. If goods cannot be delivered, you must issue a direct refund to the customer&apos;s UPI address.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANTI-FRAUD & STATUTORY LAW */}
          {activeTab === 'security' && (
            <div className="space-y-3.5 animate-in fade-in duration-150">
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs space-y-2">
                <span className="font-bold block text-sm flex items-center gap-1.5 text-amber-900">
                  <Lock className="w-4 h-4 text-amber-700" />
                  <span>UTR Integrity &amp; Cyber-Fraud Law Enforcement</span>
                </span>
                <p className="leading-relaxed">
                  Submitting synthetic or forged Unique Transaction Reference (UTR) numbers, tampering with notification forwarder apps, or spoofing bank SMS alerts violates <strong>Sections 43, 66, and 66D of the Information Technology Act, 2000</strong>.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-650">
                <p>
                  <strong>PMLA Compliance:</strong> Merchants must retain commercial transaction records for at least five (5) years in compliance with Prevention of Money Laundering Act (PMLA), 2002 guidelines.
                </p>
                <p>
                  <strong>Law Enforcement Cooperation:</strong> MyMobPay cooperates fully with Indian law enforcement agencies (LEAs), CERT-In, and the National Cyber Crime Reporting Portal upon receipt of lawful notices.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-150 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <Link
            href="/terms"
            target="_blank"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1.5"
          >
            <span>Read Complete Terms of Service</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                if (onAccept) onAccept();
                onClose();
              }}
              className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
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
