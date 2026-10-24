'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Zap,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Building2,
  Smartphone,
  Mail,
  AlertCircle,
  RefreshCw,
  Sparkles,
  X,
  ChevronRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useModalTransition } from './useModalTransition';

const COMMON_UPI_HANDLES = [
  '@okaxis',
  '@okhdfcbank',
  '@okicici',
  '@oksbi',
  '@paytm',
  '@ybl',
  '@ibl',
  '@axl'
];

export default function MerchantOnboardingWizard({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
  initialStep = 1
}) {
  const effectiveOpen = isOpen !== undefined ? isOpen : true;
  const { isMounted, modalClass, overlayClass } = useModalTransition(effectiveOpen);
  const [currentStep, setCurrentStep] = useState(initialStep);

  // Step 1: UPI ID state
  const [upiId, setUpiId] = useState(
    profile?.upi_id && profile.upi_id !== 'pending@upi' ? profile.upi_id : ''
  );
  const [upiSaving, setUpiSaving] = useState(false);
  const [upiError, setUpiError] = useState('');
  const [upiSaved, setUpiSaved] = useState(false);

  // Step 2: Email Routing state
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [gmailCode, setGmailCode] = useState(profile?.gmail_verification_code || '');
  const [pollingGmail, setPollingGmail] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Step 3: Bank Account state (Optional)
  const [bankName, setBankName] = useState(profile?.bank_name || '');
  const [bankAccName, setBankAccName] = useState(profile?.bank_account_name || profile?.business_name || '');
  const [bankAccNum, setBankAccNum] = useState(profile?.bank_account_number || '');
  const [bankAccNumConfirm, setBankAccNumConfirm] = useState(profile?.bank_account_number || '');
  const [bankIfsc, setBankIfsc] = useState(profile?.bank_ifsc || '');
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState('');

  // Step 4: Finalizing
  const [completing, setCompleting] = useState(false);

  // Sync profile when opened
  useEffect(() => {
    if (profile) {
      if (profile.upi_id && profile.upi_id !== 'pending@upi') {
        setUpiId(profile.upi_id);
      }
      if (profile.gmail_verification_code) {
        setGmailCode(profile.gmail_verification_code);
      }
      if (profile.bank_name) setBankName(profile.bank_name);
      if (profile.bank_account_name) setBankAccName(profile.bank_account_name);
      if (profile.bank_account_number) {
        setBankAccNum(profile.bank_account_number);
        setBankAccNumConfirm(profile.bank_account_number);
      }
      if (profile.bank_ifsc) setBankIfsc(profile.bank_ifsc);
    }
  }, [profile]);

  // Step 2: Poll Supabase for intercepted Gmail verification code/link
  useEffect(() => {
    if (currentStep !== 2 || !profile?.id) return;

    let isMounted = true;
    setPollingGmail(true);

    const checkGmailCode = async () => {
      try {
        const { data } = await supabase
          .from('merchants')
          .select('gmail_verification_code')
          .eq('id', profile.id)
          .single();

        if (isMounted && data?.gmail_verification_code) {
          setGmailCode(data.gmail_verification_code);
        }
      } catch {}
    };

    checkGmailCode();
    const interval = setInterval(checkGmailCode, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      setPollingGmail(false);
    };
  }, [currentStep, profile?.id]);

  if (!isOpen) return null;

  const forwardingEmail = `${profile?.api_key || 'your-key'}@mymob.tech`;

  const copyToClipboard = (text, setDone) => {
    try {
      navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {}
  };

  const isUpiValid =
    upiId.includes('@') &&
    !upiId.startsWith('@') &&
    !upiId.endsWith('@') &&
    upiId.length >= 5;

  // ── Save Step 1: UPI ID ───────────────────────────────────────
  const handleSaveUpi = async (e) => {
    if (e) e.preventDefault();
    setUpiError('');

    const cleanUpi = upiId.trim();
    if (!cleanUpi) {
      setUpiError('Please enter your receiving UPI ID.');
      return;
    }
    if (!cleanUpi.includes('@') || cleanUpi.startsWith('@') || cleanUpi.endsWith('@')) {
      setUpiError('Invalid format. Must include handle (e.g. yourname@okhdfcbank or 9876543210@paytm).');
      return;
    }

    setUpiSaving(true);
    try {
      const { data, error } = await supabase
        .from('merchants')
        .update({ upi_id: cleanUpi })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;

      setUpiSaved(true);
      if (onProfileUpdated && data) {
        onProfileUpdated(data);
      }

      setTimeout(() => {
        setUpiSaved(false);
        setCurrentStep(2);
      }, 350);
    } catch (err) {
      setUpiError(err.message || 'Failed to save UPI ID. Please try again.');
    } finally {
      setUpiSaving(false);
    }
  };

  const handleAppendHandle = (handle) => {
    const raw = upiId.split('@')[0].trim();
    if (raw) {
      setUpiId(raw + handle);
    } else {
      setUpiId('merchant' + handle);
    }
    setUpiError('');
  };

  // ── Save Step 2: Email Routing ────────────────────────────────
  const handleCompleteEmailStep = async () => {
    try {
      const currentSetup = profile?.setup_progress || {};
      const { data, error } = await supabase
        .from('merchants')
        .update({
          setup_progress: {
            ...currentSetup,
            email_forwarding: true
          }
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (!error && data && onProfileUpdated) {
        onProfileUpdated(data);
      }
    } catch {}

    setCurrentStep(3);
  };

  // ── Save Step 3: Bank Details (Optional) ──────────────────────
  const handleSaveBank = async (e) => {
    if (e) e.preventDefault();
    setBankError('');

    const cleanAcc = bankAccNum.trim();
    const cleanConfirm = bankAccNumConfirm.trim();
    const cleanIfsc = bankIfsc.trim().toUpperCase();
    const cleanName = bankAccName.trim();
    const cleanBank = bankName.trim();

    if (cleanAcc || cleanConfirm || cleanIfsc || cleanName || cleanBank) {
      if (!cleanBank) return setBankError('Please enter the bank name.');
      if (!cleanName) return setBankError('Please enter account holder name.');
      if (!cleanAcc) return setBankError('Please enter account number.');
      if (cleanAcc !== cleanConfirm) return setBankError('Account numbers do not match.');
      if (!cleanIfsc) return setBankError('Please enter IFSC code.');
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc)) {
        return setBankError('Invalid IFSC code format (e.g. HDFC0001234, SBIN0004567).');
      }

      setBankSaving(true);
      try {
        const { data, error } = await supabase
          .from('merchants')
          .update({
            bank_name: cleanBank,
            bank_account_name: cleanName,
            bank_account_number: cleanAcc,
            bank_ifsc: cleanIfsc,
            enable_bank_transfer: true
          })
          .eq('id', profile.id)
          .select()
          .single();

        if (error) throw error;
        if (onProfileUpdated && data) onProfileUpdated(data);
        setCurrentStep(4);
      } catch (err) {
        setBankError(err.message || 'Failed to save bank details.');
      } finally {
        setBankSaving(false);
      }
    } else {
      setCurrentStep(4);
    }
  };

  const handleSkipBank = () => {
    setCurrentStep(4);
  };

  // ── Save Step 4: Finish Wizard ────────────────────────────────
  const handleFinishWizard = async () => {
    setCompleting(true);
    try {
      const currentSetup = profile?.setup_progress || {};
      const { data, error } = await supabase
        .from('merchants')
        .update({
          setup_progress: {
            ...currentSetup,
            onboarding_completed: true,
            email_forwarding: true
          }
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (!error && data && onProfileUpdated) {
        onProfileUpdated(data);
      }
    } catch {} finally {
      setCompleting(false);
      onClose();
    }
  };

  const isLinkOrCode = (val) => {
    if (!val) return null;
    if (val.startsWith('http://') || val.startsWith('https://')) return { type: 'link', url: val };
    if (val.startsWith('CODE:')) return { type: 'code', code: val.replace('CODE:', '') };
    if (/^\d{6,12}$/.test(val)) return { type: 'code', code: val };
    return { type: 'link', url: val };
  };

  const gmailIntercept = isLinkOrCode(gmailCode);

  const TIMELINE_STEPS = [
    {
      num: 1,
      title: 'Receiving UPI',
      sub: 'Direct routing settlement endpoint'
    },
    {
      num: 2,
      title: 'Auto-Verify',
      sub: 'Instant webhook sync'
    },
    {
      num: 3,
      title: 'Bank Details',
      sub: 'Direct modal linkage'
    },
    {
      num: 4,
      title: 'Ready',
      sub: 'Live transaction test'
    }
  ];

  if (!isMounted) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md ${overlayClass}`}>
      {/* ─── TWO-COLUMN OBSIDIAN & GOLD MODAL CONTAINER (transitions-dev: 06-modal.md) ─── */}
      <div 
        className={`relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl shadow-black/40 border border-slate-800/20 overflow-hidden flex flex-col md:flex-row max-h-[92vh] ${modalClass}`}
        role="dialog"
        aria-modal="true"
      >
        
        {/* ══════════════════════════════════════════════════════════
            LEFT PANEL: VERTICAL TIMELINE RAIL (MIDNIGHT OBSIDIAN & GOLD)
        ══════════════════════════════════════════════════════════ */}
        <div className="w-full md:w-72 lg:w-80 shrink-0 bg-[#0c0d11] p-6 sm:p-7 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 relative overflow-hidden select-none">
          {/* Subtle gold ambient glow behind active step */}
          <div className="absolute top-10 left-4 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand / Header */}
          <div className="space-y-6 relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 font-mono">
                ONBOARDING RAIL
              </span>
              <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                Setup Command
              </h3>
            </div>

            {/* Vertical Stepper Timeline with Connected Fade Lines */}
            <div className="space-y-0 relative">
              {TIMELINE_STEPS.map((step, idx) => {
                const isActive = currentStep === step.num;
                const isCompleted = currentStep > step.num;
                const isLast = idx === TIMELINE_STEPS.length - 1;

                // Connecting line styles between this step and the next
                let lineBarClass = 'bg-white/10';
                let lineGlowClass = null;

                if (isCompleted) {
                  if (currentStep === step.num + 1) {
                    // Completed step transitioning into currently active step
                    lineBarClass = 'bg-gradient-to-b from-emerald-500 via-emerald-400 to-amber-400';
                    lineGlowClass = 'bg-gradient-to-b from-emerald-500/40 via-emerald-400/30 to-amber-400/30';
                  } else {
                    // Completed step to completed step
                    lineBarClass = 'bg-gradient-to-b from-emerald-400 to-emerald-500';
                    lineGlowClass = 'bg-emerald-500/30';
                  }
                } else if (isActive) {
                  // Active step trailing down to next step with smooth golden fade
                  lineBarClass = 'bg-gradient-to-b from-amber-400 via-amber-400/40 to-white/5';
                  lineGlowClass = 'bg-gradient-to-b from-amber-400/60 via-amber-400/20 to-transparent';
                }

                return (
                  <div key={step.num} className="relative flex items-start gap-3.5 pb-6 last:pb-0">
                    {/* Connecting vertical luminous fade line */}
                    {!isLast && (
                      <>
                        {lineGlowClass && (
                          <div
                            className={`absolute left-[14px] top-8 bottom-0 w-1 ${lineGlowClass} blur-[2px] pointer-events-none transition-all duration-300`}
                          />
                        )}
                        <div
                          className={`absolute left-[15px] top-8 bottom-0 w-[2px] ${lineBarClass} transition-all duration-300`}
                        />
                      </>
                    )}

                    {/* Step indicator squircle / badge */}
                    <div className="relative z-10 shrink-0">
                      {isCompleted ? (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-md shadow-emerald-500/30">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : isActive ? (
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-lg shadow-amber-400/40 ring-4 ring-amber-400/20">
                          {step.num}
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-slate-400 flex items-center justify-center font-bold text-xs">
                          {step.num}
                        </div>
                      )}
                    </div>

                    {/* Step details */}
                    <div className="pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-bold tracking-tight ${
                            isActive
                              ? 'text-white'
                              : isCompleted
                              ? 'text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.title}
                        </span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>
                      <p
                        className={`text-[10px] leading-tight mt-0.5 ${
                          isActive
                            ? 'text-amber-200/70 font-medium'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.sub}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Left Footer Telemetry Badges */}
          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-[11px] relative z-10 mt-6">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Zero Escrow
            </span>
            <span className="font-mono font-bold text-amber-400 tracking-wider">
              T+0 Rail
            </span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT PANEL: CLEAN CONTENT FORM & CONTROLS
        ══════════════════════════════════════════════════════════ */}
        <div className="flex-1 bg-white p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          
          <div>
            {/* Top Header Row with Step Badge & Close Button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Merchant Setup Wizard
                </h3>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                  STEP {currentStep} OF 4
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-xl hover:bg-slate-100 transition-colors"
                title="Close wizard"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ══════════════════════════════════════════════════════════
                STEP 1: RECEIVING UPI ID (MANDATORY)
            ══════════════════════════════════════════════════════════ */}
            {currentStep === 1 && (
              <div className="space-y-4 pt-3 animate-in fade-in duration-200">
                {/* Status Subtitle Row */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Mandatory Setup
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline font-medium">
                    Configure direct settlements and auto-verification rails
                  </span>
                </div>

                {/* Primary Heading & Description */}
                <div className="space-y-1">
                  <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Where should customer payments go?
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Enter your business or personal UPI ID. <strong className="text-slate-800 font-bold">100% of customer payments</strong> will settle directly and instantly into this account on T+0 rails with <span className="text-emerald-600 font-bold">0% gateway deductions</span>.
                  </p>
                </div>

                <form onSubmit={handleSaveUpi} className="space-y-4 pt-1">
                  <div>
                    {/* Label Row with Verification Pill */}
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider">
                        YOUR PRIMARY UPI ID / VPA <span className="text-rose-500">*</span>
                      </label>
                      {isUpiValid && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full animate-in fade-in">
                          <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                          Format Verified
                        </span>
                      )}
                    </div>

                    {/* ─── TERMINAL STYLE CODE ENCLOSURE INPUT ─── */}
                    <div className="rounded-2xl bg-[#0f1013] border border-slate-800 p-3.5 sm:p-4 shadow-xl space-y-2.5">
                      {/* Terminal window top header with Mac 3 traffic dots */}
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] font-mono text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 shadow-xs" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 shadow-xs" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]/50 shadow-xs" />
                          <span className="ml-2 text-slate-400 font-mono">terminal://settlement-vpa</span>
                        </div>
                        <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          NPCI / UPI Direct
                        </span>
                      </div>

                      {/* Terminal input row */}
                      <div className="flex items-center gap-2.5 pt-0.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                          @
                        </div>
                        <input
                          type="text"
                          value={upiId}
                          onChange={(e) => {
                            setUpiId(e.target.value.toLowerCase().trim());
                            setUpiError('');
                          }}
                          placeholder="e.g. 9410181307@okbizaxis"
                          className="bg-transparent font-mono text-sm sm:text-base font-bold text-white placeholder:text-slate-500 focus:outline-none w-full tracking-wide"
                          autoFocus
                        />
                        {isUpiValid ? (
                          <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {upiError && (
                      <p className="mt-2 text-xs text-rose-600 font-semibold flex items-center gap-1.5 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {upiError}
                      </p>
                    )}
                  </div>

                  {/* Quick Bank Handle Shortcuts */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-600">
                        Quick Bank Handle Shortcuts:
                      </span>
                      <span className="text-slate-400">Click to append</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_UPI_HANDLES.map((handle) => {
                        const isSelected = upiId.endsWith(handle);
                        return (
                          <button
                            key={handle}
                            type="button"
                            onClick={() => handleAppendHandle(handle)}
                            className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold shadow-xs ring-1 ring-amber-400/30'
                                : 'bg-slate-50 hover:bg-amber-50/50 border-slate-200 hover:border-amber-200 text-slate-700'
                            }`}
                          >
                            {handle}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Direct Passthrough Rail Card */}
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-700 flex items-start gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        Direct Passthrough Rail <span className="text-emerald-500">●</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-600 font-medium">
                        MyMobPay never holds customer funds in escrow. All QR scans and UPI transfers move straight to this account instantly. You can update this anytime from Settings.
                      </p>
                    </div>
                  </div>

                  {/* Bottom Action Footer */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      Skip for now (Demo Mode)
                    </button>

                    <button
                      type="submit"
                      disabled={upiSaving || !upiId.trim()}
                      className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <span>{upiSaving ? 'Saving…' : 'Save & Continue'}</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                STEP 2: EMAIL ROUTING / AUTO-VERIFICATION (MANDATORY)
            ══════════════════════════════════════════════════════════ */}
            {currentStep === 2 && (
              <div className="space-y-4 pt-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    Instant Cloud Forwarding
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline font-medium">
                    100% Automated • Zero Hardware Required
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Connect Bank Email for Auto-Verification
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Whenever a customer pays, your bank emails you a credit notification. By forwarding this alert to your dedicated MyMobPay cloud address, our parser automatically matches the UTR and confirms the transaction in real-time.
                  </p>
                </div>

                {/* Terminal Address Box with Mac 3 traffic dots */}
                <div className="rounded-2xl bg-[#0f1013] border border-slate-800 p-3.5 sm:p-4 shadow-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] font-mono text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] border border-[#e0443e]/50 shadow-xs" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] border border-[#dea123]/50 shadow-xs" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] border border-[#1aab29]/50 shadow-xs" />
                      <span className="ml-2 text-slate-400 font-mono">terminal://cloud-email-pipeline</span>
                    </div>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Cloudflare Serverless
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="flex-1 h-11 px-3.5 rounded-xl bg-white/5 border border-white/10 font-mono text-xs sm:text-sm font-bold text-amber-300 flex items-center select-all truncate">
                      {forwardingEmail}
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(forwardingEmail, setCopiedEmail)}
                      className="h-11 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0"
                      aria-label="Copy forwarding email address"
                    >
                      <span className="t-icon-swap" data-state={copiedEmail ? 'b' : 'a'}>
                        <span className="t-icon" data-icon="a" aria-hidden={copiedEmail}>
                          <Copy className="w-4 h-4" />
                        </span>
                        <span className="t-icon" data-icon="b" aria-hidden={!copiedEmail}>
                          <Check className="w-4 h-4 stroke-[3]" />
                        </span>
                      </span>
                      <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* 3 Step Guide */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-bold text-slate-900 text-xs">Open Gmail Forwarding Settings</p>
                      <a
                        href="https://mail.google.com/mail/u/0/#settings/fwdandpop"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold text-[11px]"
                      >
                        <span>Open Gmail Settings Tab</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="w-5 h-5 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">
                      2
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">Add Forwarding Address</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Click <strong className="text-slate-800">&quot;Add a forwarding address&quot;</strong> and paste your dedicated pipeline address shown above.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Intercepted Gmail Verification Card */}
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      {pollingGmail && <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />}
                      Google Verification Listener:
                    </span>
                    {gmailIntercept ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Intercepted
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium italic">
                        Listening for confirmation email…
                      </span>
                    )}
                  </div>

                  {gmailIntercept ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in zoom-in-95">
                      <p className="text-xs text-emerald-900 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-600" /> Verification email successfully captured!
                      </p>
                      {gmailIntercept.type === 'link' ? (
                        <a
                          href={gmailIntercept.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                        >
                          <span>Confirm Forwarding in Google (1-Click)</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-extrabold bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-900">
                            {gmailIntercept.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(gmailIntercept.code, setCopiedCode)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 transition-colors"
                          >
                            {copiedCode ? 'Copied ✓' : 'Copy Code'}
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 font-medium">
                      Once you submit the address in Gmail, Google will send the confirmation email here within 30–60 seconds.
                    </div>
                  )}
                </div>

                {/* Navigation Action Buttons */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteEmailStep}
                    className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                  >
                    <span>Continue to Bank Details</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                STEP 3: BANK DETAILS (OPTIONAL / ADD LATER)
            ══════════════════════════════════════════════════════════ */}
            {currentStep === 3 && (
              <div className="space-y-4 pt-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-bold">
                    <Building2 className="w-3.5 h-3.5 text-slate-600" />
                    Optional Payout Channel
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:inline font-medium">
                    Can be configured anytime from Settings
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Add Bank Account for Net Banking (Optional)
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Allow your customers to pay via direct IMPS / NEFT Net Banking in addition to UPI QR. You can fill this now, or skip and add it anytime from Settings.
                  </p>
                </div>

                <form onSubmit={handleSaveBank} className="space-y-3.5 pt-1">
                  {bankError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-1.5 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {bankError}
                    </div>
                  )}

                  {/* ── Prominent, high-contrast, clearly visible input fields ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank, ICICI Bank, SBI"
                        className="w-full h-11 sm:h-12 px-4 rounded-xl border-2 border-slate-300 hover:border-slate-400 bg-slate-50/90 text-slate-900 font-bold text-xs sm:text-sm placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15 shadow-xs transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Account Holder Name
                      </label>
                      <input
                        type="text"
                        value={bankAccName}
                        onChange={(e) => setBankAccName(e.target.value)}
                        placeholder="e.g. Rahul Sharma or Store Pvt Ltd"
                        className="w-full h-11 sm:h-12 px-4 rounded-xl border-2 border-slate-300 hover:border-slate-400 bg-slate-50/90 text-slate-900 font-bold text-xs sm:text-sm placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15 shadow-xs transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={bankAccNum}
                        onChange={(e) => setBankAccNum(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter bank account number"
                        className="w-full h-11 sm:h-12 px-4 rounded-xl border-2 border-slate-300 hover:border-slate-400 bg-slate-50/90 text-slate-900 font-mono font-bold text-xs sm:text-sm tracking-wider placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15 shadow-xs transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                        Confirm Account Number
                      </label>
                      <input
                        type="text"
                        value={bankAccNumConfirm}
                        onChange={(e) => setBankAccNumConfirm(e.target.value.replace(/\D/g, ''))}
                        placeholder="Re-enter bank account number"
                        className="w-full h-11 sm:h-12 px-4 rounded-xl border-2 border-slate-300 hover:border-slate-400 bg-slate-50/90 text-slate-900 font-mono font-bold text-xs sm:text-sm tracking-wider placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15 shadow-xs transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase().trim())}
                      placeholder="e.g. HDFC0001234"
                      className="w-full h-11 sm:h-12 px-4 rounded-xl border-2 border-slate-300 hover:border-slate-400 bg-slate-50/90 text-slate-900 font-mono font-bold text-xs sm:text-sm uppercase tracking-widest placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15 shadow-xs transition-all"
                    />
                  </div>

                  {/* Navigation and Skip Options */}
                  <div className="pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSkipBank}
                        className="px-4 py-2.5 rounded-xl border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-bold text-xs transition-all cursor-pointer"
                      >
                        Skip & Add Later
                      </button>

                      <button
                        type="submit"
                        disabled={bankSaving}
                        className="inline-flex items-center gap-2 px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                      >
                        <span>{bankSaving ? 'Saving…' : 'Save & Continue'}</span>
                        <ArrowRight className="w-4 h-4 stroke-[3]" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* ══════════════════════════════════════════════════════════
                STEP 4: SETUP COMPLETE & LIVE INTEGRATION TEST
            ══════════════════════════════════════════════════════════ */}
            {currentStep === 4 && (
              <div className="space-y-4 pt-3 animate-in fade-in duration-200 text-center py-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center border-2 border-amber-200 shadow-sm">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Your Account Is Live!
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                    Your gateway is fully configured for automated cloud verification with direct T+0 settlements.
                  </p>
                </div>

                {/* Status Summary Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2.5 text-xs shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="text-slate-500 font-semibold">Receiving UPI ID</span>
                    <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {upiId || profile?.upi_id || 'Configured'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="text-slate-500 font-semibold">Cloud Verification Forwarding</span>
                    <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {forwardingEmail}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                    <span className="text-slate-500 font-semibold">Net Banking Settlement</span>
                    <span className="font-bold text-slate-700">
                      {profile?.bank_account_number || bankAccNum ? 'Configured ✓' : 'Optional (Add anytime)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-500 font-semibold">Active API Key</span>
                    <span className="font-mono text-[11px] text-slate-800 font-bold bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                      {profile?.api_key || 'active'}
                    </span>
                  </div>
                </div>

                {/* Live Test Payment Link Box */}
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-left flex items-center justify-between gap-3 shadow-xs">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Test your payment page right now:
                    </p>
                    <p className="text-[11px] text-amber-900/80 font-medium">
                      Open a live ₹1.00 checkout session to see direct UPI settlement in action.
                    </p>
                  </div>
                  <a
                    href={`/pay?key=${profile?.api_key || ''}&amount=1.00&project=${encodeURIComponent(profile?.business_name || 'MyMobPay Merchant')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shrink-0 flex items-center gap-1.5 shadow-sm shadow-amber-500/20 transition-all cursor-pointer"
                  >
                    <span>Test ₹1</span>
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  </a>
                </div>

                {/* Complete Setup Action */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={completing}
                    onClick={handleFinishWizard}
                    className="w-full py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{completing ? 'Completing setup…' : 'Enter Merchant Dashboard'}</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
