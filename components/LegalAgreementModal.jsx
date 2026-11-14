'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  X,
  Scale,
  Landmark,
  Ban,
  UserCheck,
  ShieldCheck,
  Check,
  ExternalLink,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

// ── Authentic Indian Tricolour Flag SVG ──
const IndianFlag = ({ className = 'w-3.5 h-2.5' }) => (
  <svg
    className={`${className} rounded-[1.5px] overflow-hidden shrink-0 inline-block`}
    viewBox="0 0 24 18"
    aria-label="India Flag"
  >
    <rect width="24" height="6" fill="#FF9933" />
    <rect y="6" width="24" height="6" fill="#FFFFFF" />
    <rect y="12" width="24" height="6" fill="#138808" />
    <circle cx="12" cy="9" r="2.2" fill="none" stroke="#000080" strokeWidth="0.8" />
  </svg>
);

function normalizeTab(t) {
  if (t === 'overview' || t === 'direct') return 'direct';
  if (t === 'prohibited') return 'prohibited';
  if (t === 'rules' || t === 'guidelines') return 'guidelines';
  if (t === 'security' || t === 'antifraud') return 'antifraud';
  return 'direct';
}

export default function LegalAgreementModal({
  isOpen,
  onClose,
  onAccept,
  initialTab = 'direct'
}) {
  const [activeTab, setActiveTab] = useState(() => normalizeTab(initialTab));
  const [feedbackToast, setFeedbackToast] = useState('');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(normalizeTab(initialTab));
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
      setFeedbackToast('');
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAccept = () => {
    setFeedbackToast('Merchant Operating Rules & Legal Terms accepted (v2.5).');
    if (onAccept) onAccept();
    setTimeout(() => {
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto selection:bg-[#0F2BFF] selection:text-white">
      {/* ── Soft Atmospheric Scrim ── */}
      <div
        className="fixed inset-0 bg-[#090A10]/70 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* ── Modal Dialog Card ── */}
      <section
        id="merchant-legal-terms-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="relative z-10 theme-bg-elevated border theme-border rounded-[28px] max-w-[660px] w-full overflow-hidden theme-modal-shadow transition-colors flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* 1. MODAL HEADER + 4-TAB NAVIGATION BAR */}
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b theme-border shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {/* Scales of Justice Icon Container */}
              <div className="w-11 h-11 rounded-2xl theme-bg-secondary border theme-border flex items-center justify-center text-[#0F2BFF] dark:text-[#60A5FA] shrink-0">
                <Scale className="w-5 h-5 stroke-[2]" />
              </div>

              <div>
                {/* Top Badge Strip: Indian Flag + RBI PSS Act 2007 Guidelines + v2.5 */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full theme-bg-secondary border theme-border text-[11px] font-bold theme-text-primary">
                    <IndianFlag className="w-3.5 h-2.5" />
                    <span>RBI PSS Act 2007 Guidelines</span>
                  </span>

                  <span className="font-mono text-[11px] font-bold theme-text-muted">
                    v2.5
                  </span>
                </div>

                {/* Modal Main Heading */}
                <h2 id="legal-modal-title" className="headline-anton text-[22px] sm:text-[28px] mt-1.5 leading-none">
                  MERCHANT OPERATING RULES &amp; LEGAL TERMS
                </h2>
              </div>
            </div>

            {/* Top-Right Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full theme-bg-secondary border theme-border flex items-center justify-center theme-text-muted hover:theme-text-primary transition-colors shrink-0 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 stroke-[2.3]" />
            </button>
          </div>

          {/* 4 Interactive Category Tabs */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-2xl theme-bg-secondary border theme-border">
            <button
              type="button"
              id="tab-btn-direct"
              onClick={() => setActiveTab('direct')}
              className={`py-2 px-2.5 rounded-xl text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'direct'
                  ? 'bg-white dark:bg-[#161F30] text-[#0F2BFF] dark:text-[#60A5FA] shadow-2xs'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 shrink-0 stroke-[2.1]" />
              <span className="truncate">Direct Settlement</span>
            </button>

            <button
              type="button"
              id="tab-btn-prohibited"
              onClick={() => setActiveTab('prohibited')}
              className={`py-2 px-2.5 rounded-xl text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'prohibited'
                  ? 'bg-white dark:bg-[#161F30] text-[#0F2BFF] dark:text-[#60A5FA] shadow-2xs'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              <Ban className="w-3.5 h-3.5 shrink-0 stroke-[2.1]" />
              <span className="truncate">Prohibited Goods</span>
            </button>

            <button
              type="button"
              id="tab-btn-guidelines"
              onClick={() => setActiveTab('guidelines')}
              className={`py-2 px-2.5 rounded-xl text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'guidelines'
                  ? 'bg-white dark:bg-[#161F30] text-[#0F2BFF] dark:text-[#60A5FA] shadow-2xs'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0 stroke-[2.1]" />
              <span className="truncate">Merchant Guidelines</span>
            </button>

            <button
              type="button"
              id="tab-btn-antifraud"
              onClick={() => setActiveTab('antifraud')}
              className={`py-2 px-2.5 rounded-xl text-[11.5px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'antifraud'
                  ? 'bg-white dark:bg-[#161F30] text-[#0F2BFF] dark:text-[#60A5FA] shadow-2xs'
                  : 'theme-text-muted hover:theme-text-primary'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0 stroke-[2.1]" />
              <span className="truncate">Anti-Fraud &amp; Law</span>
            </button>
          </div>
        </div>

        {/* 2. MODAL BODY (4 TAB PANELS) */}
        <div className="px-6 sm:px-8 py-5 space-y-4 text-left overflow-y-auto flex-1">

          {/* Feedback Toast */}
          {feedbackToast && (
            <div
              id="modal-feedback-toast"
              className="rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 border border-[#A7F3D0] dark:border-[#10B981]/40 px-4 py-2.5 flex items-center justify-between gap-2 text-xs font-semibold text-[#065F46] dark:text-[#6EE7B7] tab-animate"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#10B981] text-white flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>{feedbackToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackToast('')}
                className="hover:opacity-75 font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {/* ================================================================= */}
          {/* PANEL 1: DIRECT SETTLEMENT                                        */}
          {/* ================================================================= */}
          {activeTab === 'direct' && (
            <div id="tab-panel-direct" className="space-y-4 tab-animate">
              {/* Statutory Notice Card */}
              <div className="rounded-2xl p-5 theme-bg-well border theme-border">
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] theme-text-primary mb-2">
                  STATUTORY NOTICE &bull; NON-CUSTODIAL ARCHITECTURE
                </div>
                <p className="text-[13.5px] leading-[1.65] theme-text-secondary">
                  MyMobPay operates strictly as a <strong className="font-bold theme-text-primary">technical software routing provider</strong> under Section 18 of the Payment and Settlement Systems Act, 2007. We are not a payment aggregator, digital wallet, or escrow repository. We never hold, pool, or manage merchant or customer funds.
                </p>
              </div>

              {/* 2 Side-by-Side Feature Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 0% Transaction Commission */}
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-full bg-[#10B981]/15 text-[#10B981] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[2.6]" />
                    </span>
                    <span className="text-[13px] font-extrabold theme-text-primary">
                      0% Transaction Commission
                    </span>
                  </div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    You keep 100% of your customer volume. Payments settle directly into your bank account with zero middleman fee deductions.
                  </p>
                </div>

                {/* Instant NPCI UPI Settlement */}
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-5 h-5 rounded-md bg-[#0F2BFF]/12 text-[#0F2BFF] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
                      <CreditCard className="w-3.5 h-3.5 stroke-[2.2]" />
                    </span>
                    <span className="text-[13px] font-extrabold theme-text-primary">
                      Instant NPCI UPI Settlement
                    </span>
                  </div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    Buyers transfer directly to your bank UPI address in 0 seconds. Money routes directly on banking rails.
                  </p>
                </div>
              </div>

              {/* Amber Callout Box: Merchant Sole Refund Responsibility */}
              <div className="rounded-2xl p-4 sm:p-5 bg-[#FFFBEB] dark:bg-[#451A03]/35 border border-[#FDE68A] dark:border-[#F59E0B]/40">
                <div className="flex items-center gap-2 text-[13px] font-extrabold text-[#92400E] dark:text-[#FCD34D] mb-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#D97706] dark:text-[#FBBF24] stroke-[2.3]" />
                  <span>Merchant Sole Refund Responsibility</span>
                </div>
                <p className="text-[12.5px] leading-[1.6] text-[#92400E]/90 dark:text-[#FDE68A]/90">
                  Because MyMobPay maintains zero custodial balances, <strong className="font-bold text-[#78350F] dark:text-white">all customer refunds, order cancellations, and chargebacks must be issued directly by you</strong> using your bank UPI or net-banking application.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* PANEL 2: PROHIBITED GOODS                                         */}
          {/* ================================================================= */}
          {activeTab === 'prohibited' && (
            <div id="tab-panel-prohibited" className="space-y-4 tab-animate">
              <div className="rounded-2xl p-5 theme-bg-well border theme-border">
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#E11D48] mb-2">
                  ACCEPTABLE USE POLICY &bull; RESTRICTED MERCHANT CATEGORIES
                </div>
                <p className="text-[13.5px] leading-[1.65] theme-text-secondary">
                  Merchants are strictly prohibited from using MyMobPay software routing to generate UPI QR codes or payment links for goods or services banned under Indian law, NPCI operating circulars, or the Information Technology Act, 2000.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border">
                  <div className="text-[13px] font-extrabold theme-text-primary mb-1.5">Unlicensed Gaming &amp; Betting</div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    Real-money gambling, offshore betting portals, unauthorized lottery schemes, and unlicensed fantasy gaming pools.
                  </p>
                </div>
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border">
                  <div className="text-[13px] font-extrabold theme-text-primary mb-1.5">Illicit &amp; Regulated Goods</div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    Narcotics, controlled substances, counterfeit merchandise, adult content, and unlicensed financial investment schemes.
                  </p>
                </div>
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border">
                  <div className="text-[13px] font-extrabold theme-text-primary mb-1.5">Multi-Level Marketing &amp; Schemes</div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    Pyramid models, referral-gated matrix schemes, unauthorized chit funds, and unregistered cryptocurrency token pre-sales.
                  </p>
                </div>
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border">
                  <div className="text-[13px] font-extrabold theme-text-primary mb-1.5">Weapons &amp; Hazardous Goods</div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    Firearms, tactical weapons, fireworks, uncertified explosives, and hazardous materials without statutory permits.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* PANEL 3: MERCHANT GUIDELINES                                      */}
          {/* ================================================================= */}
          {activeTab === 'guidelines' && (
            <div id="tab-panel-guidelines" className="space-y-4 tab-animate">
              <div className="rounded-2xl p-5 theme-bg-well border theme-border">
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] theme-link mb-2">
                  OPERATIONAL COMPLIANCE &bull; VPA &amp; CHECKOUT STANDARDS
                </div>
                <p className="text-[13.5px] leading-[1.65] theme-text-secondary">
                  Merchants must configure a valid, KYC-verified bank UPI address belonging to the business or proprietor and provide clear customer support channels on their checkout pages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border">
                  <div className="text-[13px] font-extrabold theme-text-primary mb-1.5">Direct Bank VPA Ownership</div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    Your settlement UPI ID must belong directly to your verified business or proprietor bank account for uninterrupted T+0 settlement.
                  </p>
                </div>
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border">
                  <div className="text-[13px] font-extrabold theme-text-primary mb-1.5">Automated UTR Fulfillment</div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    Verify HMAC-SHA256 webhook signatures on your server before marking orders fulfilled against 12-digit NPCI UTR numbers.
                  </p>
                </div>
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border">
                  <div className="text-[13px] font-extrabold theme-text-primary mb-1.5">Transparent Customer Pricing</div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    All payment requests must reflect genuine order amounts. Adding hidden convenience fees or surcharging buyers for choosing UPI is strictly prohibited under NPCI guidelines.
                  </p>
                </div>
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border">
                  <div className="text-[13px] font-extrabold theme-text-primary mb-1.5">Visible Support &amp; Refund Terms</div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    Maintain reachable customer support channels (email/phone) and an explicit refund policy visible to buyers prior to checkout with 48h response times.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* PANEL 4: ANTI-FRAUD & LAW                                         */}
          {/* ================================================================= */}
          {activeTab === 'antifraud' && (
            <div id="tab-panel-antifraud" className="space-y-4 tab-animate">
              <div className="rounded-2xl p-5 theme-bg-well border theme-border">
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.1em] text-[#10B981] mb-2">
                  STATUTORY ENFORCEMENT &bull; IT ACT 2000 &amp; CERT-IN DIRECTIVES
                </div>
                <p className="text-[13.5px] leading-[1.65] theme-text-secondary">
                  MyMobPay actively monitors API routing for deceptive checkout impersonation, phishing links, and fraudulent collection requests. Any workspace flagged by banks or cybercrime cells is terminated immediately.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border">
                  <div className="text-[13px] font-extrabold theme-text-primary mb-1.5">Law Enforcement &amp; Nodal Disclosure</div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    In accordance with Indian cybercrime laws and RBI PSS Act 2007 guidelines, merchant registration records and API logs may be furnished to authorized law enforcement agencies upon lawful notice.
                  </p>
                </div>
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border">
                  <div className="text-[13px] font-extrabold theme-text-primary mb-1.5">Synthetic UTR Tampering Prohibited</div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    Submitting fabricated 12-digit transaction references or spoofing bank SMS webhooks constitutes a criminal offense under Section 66D of the IT Act, 2000.
                  </p>
                </div>
                <div className="rounded-2xl p-4 sm:p-5 theme-bg-well border theme-border sm:col-span-2">
                  <div className="text-[13px] font-extrabold theme-text-primary mb-1.5">PMLA 2002 5-Year Record Retention</div>
                  <p className="text-[12.5px] leading-[1.6] theme-text-secondary">
                    Under the Prevention of Money Laundering Act, merchants must preserve commercial order logs, buyer invoices, and fulfillment proofs for a statutory minimum of 5 years.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 3. MODAL FOOTER BAR */}
        <div className="px-6 sm:px-8 py-4 theme-bg-secondary border-t theme-border flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <Link
            href="/terms"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-[12.5px] font-bold theme-text-secondary hover:theme-link transition-colors group"
          >
            <span>Read Complete Terms of Service</span>
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full theme-bg-elevated border theme-border text-[12.5px] font-bold theme-text-secondary hover:theme-text-primary transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleAccept}
              className="btn-editorial px-6 py-2.5 rounded-full bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-[12.5px] font-bold inline-flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.8]" />
              <span>I Understand &amp; Accept Rules</span>
            </button>
          </div>
        </div>

      </section>
    </div>
  );
}
