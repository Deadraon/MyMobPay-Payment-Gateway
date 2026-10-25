'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MyMobPayLogo } from '@/components/MyMobPayLogo';
import { validateStrongPassword, getPasswordCriteria } from '@/lib/passwordValidation';
import {
  Lock,
  Eye,
  EyeOff,
  Building2,
  Globe,
  QrCode,
  ArrowRight,
  ChevronLeft,
  Check,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  AlertCircle,
  Loader2,
  LogOut,
  MessageSquare,
  Landmark,
  Smartphone,
  Info,
  CheckCheck
} from 'lucide-react';

/* ── Indian Flag SVG component ── */
const IndianFlag = ({ className = 'w-4 h-3' }) => (
  <svg className={`${className} rounded-[2px] shadow-2xs shrink-0`} viewBox="0 0 640 480" aria-label="India flag">
    <path fill="#f93" d="M0 0h640v160H0z" />
    <path fill="#fff" d="M0 160h640v160H0z" />
    <path fill="#128807" d="M0 320h640v160H0z" />
    <g transform="matrix(3.2 0 0 3.2 320 240)">
      <circle r="20" fill="none" stroke="#008" strokeWidth="2" />
      <circle r="3" fill="#008" />
      {Array.from({ length: 24 }).map((_, i) => (
        <line key={i} x1="0" y1="0" x2="0" y2="-20" stroke="#008" strokeWidth="0.8" transform={`rotate(${i * 15})`} />
      ))}
    </g>
  </svg>
);

/* ── Smart Bank Identification Engine for Indian UPI VPAs ── */
const detectBankFromUpi = (upiString) => {
  if (!upiString || !upiString.includes('@')) return null;
  const parts = upiString.toLowerCase().split('@');
  const handle = parts[1] || '';
  if (!handle) return null;

  if (handle.includes('hdfc')) return { name: 'HDFC Bank', code: 'HDFC', badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  if (handle.includes('sbi')) return { name: 'State Bank of India', code: 'SBI', badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
  if (handle.includes('icici')) return { name: 'ICICI Bank', code: 'ICICI', badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
  if (handle.includes('axis')) return { name: 'Axis Bank', code: 'AXIS', badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/20' };
  if (handle.includes('paytm')) return { name: 'Paytm Payments Bank', code: 'PAYTM', badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
  if (handle.includes('ybl') || handle.includes('ibl')) return { name: 'PhonePe (YES/ICICI)', code: 'PHONEPE', badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
  if (handle.includes('kotak')) return { name: 'Kotak Mahindra Bank', code: 'KOTAK', badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20' };
  if (handle.includes('baroda')) return { name: 'Bank of Baroda', code: 'BOB', badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  if (handle.includes('indus')) return { name: 'IndusInd Bank', code: 'INDUS', badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20' };
  if (handle.includes('pnb')) return { name: 'Punjab National Bank', code: 'PNB', badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
  if (handle.includes('jupiter')) return { name: 'Jupiter (Federal Bank)', code: 'JUPITER', badgeColor: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
  if (handle.includes('fi')) return { name: 'Fi Money (Federal Bank)', code: 'FI', badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/20' };
  if (handle.includes('postbank')) return { name: 'India Post Payments Bank', code: 'IPPB', badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20' };
  
  return { name: `@${handle.toUpperCase()} UPI Gateway`, code: 'UPI', badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
};

export default function OnboardingPage() {
  const router = useRouter();

  // Session & User State
  const [sessionUser, setSessionUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Flow State: 1: Password | 2: Business | 3: Website | 4: UPI | 5: Phone | 6: Review | 7: Success
  const [step, setStep] = useState(1);
  const [stepDirection, setStepDirection] = useState('forward');
  const [shakeError, setShakeError] = useState(false);

  // Form Fields
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [noWebsite, setNoWebsite] = useState(false);
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState('');

  // UI Status
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successCelebration, setSuccessCelebration] = useState(false);

  // Input refs for autofocus
  const pwdInputRef = useRef(null);
  const businessInputRef = useRef(null);
  const websiteInputRef = useRef(null);
  const upiInputRef = useRef(null);
  const phoneInputRef = useRef(null);

  // Compute password criteria
  const passwordCriteria = useMemo(() => getPasswordCriteria(password), [password]);
  const detectedBank = useMemo(() => detectBankFromUpi(upiId), [upiId]);

  // Clean formatted phone
  const cleanPhone = useMemo(() => (phone || '').replace(/\D/g, ''), [phone]);

  /* ────────────────────────────────────────────────────────
     AUTH INITIALIZATION & SESSION GUARD
     ──────────────────────────────────────────────────────── */
  useEffect(() => {
    let isSubscribed = true;

    const verifyAuth = async () => {
      try {
        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          if (searchParams.get('preview') === 'true' || searchParams.get('demo') === 'true') {
            setSessionUser({
              id: 'demo-google-user',
              email: searchParams.get('email') || 'founder@mymob.tech',
              user_metadata: { full_name: 'Alex Rivera' },
            });
            setBusinessName('Rivera Tech Studio');
            setCheckingAuth(false);
            return;
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          // If no immediate session, give Supabase a brief moment to parse OAuth hash
          setTimeout(async () => {
            const { data: { session: delayedSession } } = await supabase.auth.getSession();
            if (!delayedSession?.user) {
              if (isSubscribed) {
                setCheckingAuth(false);
                router.replace('/login');
              }
              return;
            }
            handleLoadedSession(delayedSession.user);
          }, 400);
          return;
        }

        handleLoadedSession(session.user);
      } catch (err) {
        console.error('[ONBOARDING] Auth check error:', err);
        if (isSubscribed) setCheckingAuth(false);
      }
    };

    const handleLoadedSession = async (user) => {
      if (!isSubscribed) return;
      setSessionUser(user);

      // Verify if account is already complete
      try {
        const res = await fetch('/api/auth/verify-registration-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, email: user.email }),
        });
        const data = await res.json();

        if (data?.allowed && data?.registered && data?.isComplete) {
          // Already complete merchant, redirect to console
          router.replace('/dashboard');
          return;
        }

        // Prefill existing data if any
        if (data?.businessName) setBusinessName(data.businessName);
        if (data?.upiId && data.upiId !== 'pending@upi') setUpiId(data.upiId);
        if (data?.phoneNumber) setPhone(data.phoneNumber);
        if (data?.websiteUrl) setWebsiteUrl(data.websiteUrl);

        // Or derive business name fallback from Google full name
        const userMetadata = user.user_metadata || {};
        if (!data?.businessName && userMetadata.full_name) {
          setBusinessName(`${userMetadata.full_name}'s Business`);
        }

        setCheckingAuth(false);
      } catch (e) {
        console.warn('[ONBOARDING] Status verify exception:', e);
        setCheckingAuth(false);
      }
    };

    verifyAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && isSubscribed) {
        setSessionUser(session.user);
      }
    });

    return () => {
      isSubscribed = false;
      subscription?.unsubscribe();
    };
  }, [router]);

  /* ────────────────────────────────────────────────────────
     STEP NAVIGATION & VALIDATION
     ──────────────────────────────────────────────────────── */
  const triggerShake = (msg) => {
    setErrorMsg(msg);
    setShakeError(true);
    setTimeout(() => setShakeError(false), 500);
  };

  const handleNextStep = () => {
    setErrorMsg('');

    // Step 1: Password validation
    if (step === 1) {
      const pwdRes = validateStrongPassword(password);
      if (!pwdRes.valid) {
        triggerShake(pwdRes.error || 'Please enter a strong password meeting all criteria.');
        pwdInputRef.current?.focus();
        return;
      }
    }

    // Step 2: Business name validation
    if (step === 2) {
      if (!businessName.trim() || businessName.trim().length < 2) {
        triggerShake('Please enter your business or brand name (at least 2 characters).');
        businessInputRef.current?.focus();
        return;
      }
    }

    // Step 3: Website validation (optional)
    if (step === 3) {
      if (!noWebsite && websiteUrl.trim()) {
        const urlToTest = websiteUrl.trim().startsWith('http') ? websiteUrl.trim() : `https://${websiteUrl.trim()}`;
        try {
          new URL(urlToTest);
        } catch {
          triggerShake('Please enter a valid website address (e.g. yourstore.com) or click Skip.');
          websiteInputRef.current?.focus();
          return;
        }
      }
    }

    // Step 4: UPI ID validation
    if (step === 4) {
      const cleanUpi = upiId.trim().toLowerCase();
      if (!cleanUpi || !cleanUpi.includes('@') || cleanUpi.length < 5) {
        triggerShake('Please enter a valid Settlement UPI ID (e.g. merchant@okhdfcbank, store@paytm).');
        upiInputRef.current?.focus();
        return;
      }
    }

    // Step 5: Mobile number validation
    if (step === 5) {
      if (cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone) || /^(\d)\1{9}$/.test(cleanPhone)) {
        triggerShake('Please enter a valid 10-digit Indian WhatsApp mobile number (starting with 6, 7, 8, or 9).');
        phoneInputRef.current?.focus();
        return;
      }
    }

    // Advance
    if (step < 6) {
      setStepDirection('forward');
      setStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setErrorMsg('');
    if (step > 1) {
      setStepDirection('backward');
      setStep(prev => prev - 1);
    }
  };

  const handleSkipWebsite = () => {
    setNoWebsite(true);
    setWebsiteUrl('');
    setErrorMsg('');
    setStepDirection('forward');
    setStep(4);
  };

  // Keyboard shortcut listener: Enter advances
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !submitting && !checkingAuth && step <= 5) {
        e.preventDefault();
        handleNextStep();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, password, businessName, websiteUrl, noWebsite, upiId, cleanPhone, submitting, checkingAuth]);

  /* ────────────────────────────────────────────────────────
     SUBMIT ONBOARDING TO BACKEND
     ──────────────────────────────────────────────────────── */
  const handleFinalSubmit = async () => {
    setErrorMsg('');
    setSubmitting(true);

    try {
      if (!sessionUser?.email) {
        throw new Error('User session expired. Please sign in again.');
      }

      const payload = {
        email: sessionUser.email,
        password: password,
        businessName: businessName.trim(),
        upiId: upiId.trim().toLowerCase(),
        phone: cleanPhone,
        websiteUrl: noWebsite ? '' : websiteUrl.trim(),
        userId: sessionUser.id,
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to complete merchant onboarding. Please verify details.');
      }

      // Success! Step to celebratory screen
      setStep(7);
      setSuccessCelebration(true);

      // Smooth redirection to dashboard
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1600);

    } catch (err) {
      console.error('[ONBOARDING] Final submit error:', err);
      triggerShake(err.message || 'Something went wrong. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOutToSwitch = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  /* ────────────────────────────────────────────────────────
     LOADING STATE
     ──────────────────────────────────────────────────────── */
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center text-white px-4">
        <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5 animate-pulse">
          <MyMobPayLogo markSize={32} textColor="#FFFFFF" textSize="text-xl" />
        </div>
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-[#533afd]" />
          <span>Verifying Google merchant authentication...</span>
        </div>
      </div>
    );
  }

  const userEmail = sessionUser?.email || 'merchant@gmail.com';

  return (
    <div className="min-h-screen bg-[#070913] text-white flex flex-col font-sans relative overflow-x-hidden selection:bg-[#533afd] selection:text-white">
      {/* ── Ambient Background Depth Gradients ── */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-[#533afd]/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-[#3b82f6]/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#533afd]/5 rounded-full blur-[160px] pointer-events-none" />

      {/* ── Subtle Tech Grid Lines ── */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* ────────────────────────────────────────────────────────
         TOP NAVIGATION BAR
         ──────────────────────────────────────────────────────── */}
      <header className="relative z-20 border-b border-white/[0.07] bg-[#070913]/70 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="inline-block transition-transform hover:scale-[1.02]">
          <MyMobPayLogo markSize={28} textColor="#FFFFFF" textSize="text-lg sm:text-xl" />
        </Link>

        {/* Connected Google Account Pill */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs text-slate-300 shadow-2xs">
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span className="font-medium truncate max-w-[150px] md:max-w-[200px] text-white">{userEmail}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
              <Check className="w-2.5 h-2.5" />
              Verified
            </span>
          </div>

          <button
            type="button"
            onClick={handleSignOutToSwitch}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-white/[0.05]"
            title="Switch Google Account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Switch</span>
          </button>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────
         MAIN ONBOARDING CARD CONTAINER
         ──────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 max-w-3xl mx-auto w-full">
        
        {/* Step Progress Header */}
        {step <= 6 && (
          <div className="w-full max-w-xl mb-6 sm:mb-8 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-[#533afd]/20 border border-[#533afd]/30 text-[#a594fd] font-bold text-[11px] tracking-wider uppercase">
                  Step {step} of 5
                </span>
                <span className="text-slate-400 font-medium hidden sm:inline">
                  {step === 1 && '• Secure Password'}
                  {step === 2 && '• Brand Identity'}
                  {step === 3 && '• Web Presence'}
                  {step === 4 && '• Payout Routing'}
                  {step === 5 && '• WhatsApp Alerts'}
                  {step === 6 && '• Profile Review'}
                </span>
              </div>
              <span className="text-slate-400 font-mono text-[11px] font-medium">
                {Math.round(((step) / 6) * 100)}% Complete
              </span>
            </div>

            {/* Glowing Progress Track */}
            <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-[#533afd] via-[#3b82f6] to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(83,58,253,0.5)]"
                style={{ width: `${((step) / 6) * 100}%` }}
              />
            </div>

            {/* Step navigation dots */}
            <div className="flex items-center justify-between pt-1 px-1">
              {[
                { s: 1, label: 'Password' },
                { s: 2, label: 'Brand' },
                { s: 3, label: 'Website' },
                { s: 4, label: 'UPI' },
                { s: 5, label: 'Mobile' },
                { s: 6, label: 'Review' },
              ].map(item => (
                <button
                  key={item.s}
                  type="button"
                  onClick={() => {
                    if (item.s < step) {
                      setStepDirection('backward');
                      setStep(item.s);
                    }
                  }}
                  disabled={item.s >= step}
                  className={`text-[10px] tracking-tight font-medium transition-colors ${
                    item.s === step
                      ? 'text-white font-bold'
                      : item.s < step
                      ? 'text-emerald-400 hover:text-emerald-300 cursor-pointer'
                      : 'text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="hidden sm:inline">{item.label}</span>
                  <span className="sm:hidden">{item.s}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Active Screen Card ── */}
        <div className={`w-full max-w-xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-9 shadow-2xl relative transition-all duration-200 ${shakeError ? 't-error-shake border-red-500/50 shadow-red-500/10' : ''}`}>
          
          {/* Global error toast banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-start gap-3 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
             SCREEN 1: PASSWORD SETUP
             ──────────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className={`t-step-slide ${stepDirection === 'forward' ? 't-step-forward' : 't-step-backward'} space-y-6`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#533afd]/15 border border-[#533afd]/30 flex items-center justify-center text-[#9b88fd] shadow-inner">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Create a secure password</h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    For direct login with <span className="text-white font-semibold">{userEmail}</span> on any device.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Merchant Login Password</span>
                  <span className="text-[11px] text-slate-400 font-normal">8+ characters required</span>
                </label>

                <div className="relative flex items-center rounded-2xl bg-white/[0.06] border border-white/10 focus-within:border-[#533afd] focus-within:ring-2 focus-within:ring-[#533afd]/20 transition-all px-4 shadow-inner">
                  <input
                    ref={pwdInputRef}
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="e.g. MyMobPay@2026"
                    className="w-full bg-transparent py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none font-medium tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Criteria Checklist */}
                <div className="mt-3 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Security Requirements</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`flex items-center gap-1.5 transition-colors ${passwordCriteria.hasMinLength ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordCriteria.hasMinLength ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-white/10 text-slate-500'}`}>
                        {passwordCriteria.hasMinLength ? '✓' : '·'}
                      </span>
                      8+ Characters
                    </div>

                    <div className={`flex items-center gap-1.5 transition-colors ${passwordCriteria.hasUppercase ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordCriteria.hasUppercase ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-white/10 text-slate-500'}`}>
                        {passwordCriteria.hasUppercase ? '✓' : '·'}
                      </span>
                      1 Uppercase (A-Z)
                    </div>

                    <div className={`flex items-center gap-1.5 transition-colors ${passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-white/10 text-slate-500'}`}>
                        {passwordCriteria.hasNumber && passwordCriteria.hasSpecial ? '✓' : '·'}
                      </span>
                      Number &amp; Symbol
                    </div>

                    <div className={`flex items-center gap-1.5 transition-colors ${passwordCriteria.noSequenceOrRepeat ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordCriteria.noSequenceOrRepeat ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'bg-white/10 text-slate-500'}`}>
                        {passwordCriteria.noSequenceOrRepeat ? '✓' : '·'}
                      </span>
                      No 123 / 111 patterns
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[10px] font-mono">↵ Enter</kbd> to continue
                </span>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!passwordCriteria.allMet}
                  className="w-full sm:w-auto ml-auto px-7 py-3.5 bg-gradient-to-r from-[#533afd] to-[#3b82f6] hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#533afd]/25 transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
             SCREEN 2: BUSINESS NAME
             ──────────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className={`t-step-slide ${stepDirection === 'forward' ? 't-step-forward' : 't-step-backward'} space-y-6`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">What is your business name?</h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    This will appear on customer checkout screens and UPI payment receipts.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Business / Brand Name <span className="text-red-400">*</span>
                </label>

                <div className="relative flex items-center rounded-2xl bg-white/[0.06] border border-white/10 focus-within:border-[#533afd] focus-within:ring-2 focus-within:ring-[#533afd]/20 transition-all px-4 shadow-inner">
                  <Building2 className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    ref={businessInputRef}
                    type="text"
                    autoFocus
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Acme Tech Studio, Bharat Stores"
                    className="w-full bg-transparent py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  You can update your business display name anytime in settings.
                </p>
              </div>

              {/* Live Interactive Checkout Preview Simulation */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Live Checkout Preview
                  </span>
                  <span className="text-emerald-400 font-bold">0% Gateway MDR</span>
                </div>

                <div className="p-3 rounded-xl bg-[#0d1222] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#533afd] to-[#3b82f6] flex items-center justify-center text-xs font-bold text-white shadow-xs">
                      {(businessName.trim() || 'M')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white truncate max-w-[200px]">
                        {businessName.trim() || 'Your Business Name'}
                      </div>
                      <div className="text-[10px] text-slate-400">Direct Verified Merchant</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-400">₹500.00</div>
                    <div className="text-[10px] text-slate-400">Instant Settlement</div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/[0.05] text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={businessName.trim().length < 2}
                  className="px-7 py-3.5 bg-gradient-to-r from-[#533afd] to-[#3b82f6] hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#533afd]/25 transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
             SCREEN 3: WEBSITE URL (NEW OPTION AS REQUESTED)
             ──────────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className={`t-step-slide ${stepDirection === 'forward' ? 't-step-forward' : 't-step-backward'} space-y-6`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Do you have a website?</h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    Connect your store or app for 1-click webhook integrations and checkout buttons.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Store / Business Website URL</span>
                  <span className="text-[11px] text-cyan-400 font-medium bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                    Optional
                  </span>
                </label>

                <div className={`relative flex items-center rounded-2xl bg-white/[0.06] border transition-all px-3 shadow-inner ${noWebsite ? 'opacity-40 border-white/5 pointer-events-none' : 'border-white/10 focus-within:border-[#533afd] focus-within:ring-2 focus-within:ring-[#533afd]/20'}`}>
                  <span className="text-xs font-mono font-bold text-slate-400 pr-2 border-r border-white/10 select-none">
                    https://
                  </span>
                  <input
                    ref={websiteInputRef}
                    type="text"
                    autoFocus={!noWebsite}
                    disabled={noWebsite}
                    value={websiteUrl.replace(/^https?:\/\//i, '')}
                    onChange={(e) => {
                      setWebsiteUrl(e.target.value);
                      if (noWebsite) setNoWebsite(false);
                    }}
                    placeholder="yourstore.com or app.mybrand.in"
                    className="w-full bg-transparent py-3.5 pl-3 text-sm text-white placeholder-slate-500 focus:outline-none font-mono font-medium"
                  />
                </div>

                {/* Option to toggle "No Website Yet" */}
                <div
                  onClick={() => {
                    setNoWebsite(prev => !prev);
                    if (!noWebsite) setWebsiteUrl('');
                  }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    noWebsite
                      ? 'bg-[#533afd]/15 border-[#533afd]/40 text-white'
                      : 'bg-white/[0.02] border-white/[0.07] text-slate-400 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-colors ${noWebsite ? 'bg-[#533afd] border-[#533afd] text-white' : 'border-slate-500 bg-transparent'}`}>
                      {noWebsite && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-xs font-medium">I don&apos;t have a website yet (I will use direct links &amp; QR)</span>
                  </div>
                </div>

                {/* Helpful note */}
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-2.5 text-slate-400 text-xs">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    You can still accept UPI payments via WhatsApp, Instagram DM, and dynamic QR posters even without a website.
                  </p>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/[0.05] text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  {!noWebsite && !websiteUrl.trim() && (
                    <button
                      type="button"
                      onClick={handleSkipWebsite}
                      className="px-4 py-3 rounded-2xl hover:bg-white/[0.05] text-slate-400 hover:text-white font-medium text-xs transition-colors cursor-pointer"
                    >
                      Skip for now
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-7 py-3.5 bg-gradient-to-r from-[#533afd] to-[#3b82f6] hover:opacity-95 active:scale-95 text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#533afd]/25 transition-all cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
             SCREEN 4: SETTLEMENT UPI ID
             ──────────────────────────────────────────────────────── */}
          {step === 4 && (
            <div className={`t-step-slide ${stepDirection === 'forward' ? 't-step-forward' : 't-step-backward'} space-y-6`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Where should money settle?</h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    Enter your settlement UPI ID. All customer payments transfer 100% directly to your bank account.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Settlement UPI ID (VPA) <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                    Direct Bank Settlement
                  </span>
                </div>

                <div className="relative flex items-center rounded-2xl bg-white/[0.06] border border-white/10 focus-within:border-[#533afd] focus-within:ring-2 focus-within:ring-[#533afd]/20 transition-all px-4 shadow-inner">
                  <QrCode className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    ref={upiInputRef}
                    type="text"
                    autoFocus
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    placeholder="e.g. merchant@okhdfcbank, store@paytm"
                    className="w-full bg-transparent py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none font-mono font-medium"
                  />
                </div>

                {/* Intelligent Bank Detection Badge */}
                {detectedBank ? (
                  <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-300">
                        Routing to: <strong className="text-white">{detectedBank.name}</strong>
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      0% Commission
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Supports any bank UPI: @okhdfcbank, @oksbi, @okicici, @paytm, @ybl, @axisbank, etc.
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/[0.05] text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!upiId.trim().includes('@') || upiId.trim().length < 5}
                  className="px-7 py-3.5 bg-gradient-to-r from-[#533afd] to-[#3b82f6] hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#533afd]/25 transition-all cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
             SCREEN 5: MOBILE NUMBER (WHATSAPP)
             ──────────────────────────────────────────────────────── */}
          {step === 5 && (
            <div className={`t-step-slide ${stepDirection === 'forward' ? 't-step-forward' : 't-step-backward'} space-y-6`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Your WhatsApp mobile number</h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    For real-time WhatsApp payment drop alerts and security verifications.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    Mobile Number <span className="text-red-400">*</span>
                  </label>
                </div>

                <div className="relative flex items-center rounded-2xl bg-white/[0.06] border border-white/10 focus-within:border-[#533afd] focus-within:ring-2 focus-within:ring-[#533afd]/20 transition-all px-3 shadow-inner">
                  <div className="flex items-center gap-2 pr-3 py-3 border-r border-white/10 text-white font-bold text-xs select-none">
                    <IndianFlag className="w-4 h-3" />
                    <span>+91</span>
                  </div>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    autoFocus
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit Indian mobile number"
                    className="w-full bg-transparent py-3.5 pl-3 text-sm text-white placeholder-slate-500 focus:outline-none font-medium tracking-wider"
                  />
                </div>

                {/* WhatsApp Notification Simulator */}
                <div className="p-3.5 rounded-2xl bg-[#0b141a] border border-[#202c33] space-y-2 shadow-inner">
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Instant WhatsApp Drop Notification Preview</span>
                  </div>
                  <div className="bg-[#1f2c34] p-3 rounded-xl border border-white/[0.04] text-xs text-slate-200 space-y-1">
                    <div className="font-semibold text-white">✅ Payment Received: ₹1,500.00</div>
                    <div className="text-[11px] text-slate-400">
                      Settled directly to <span className="text-emerald-400 font-mono">{upiId || 'yourbank@upi'}</span> (UTR: 329048102941). Zero gateway fees deducted.
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/[0.05] text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={cleanPhone.length !== 10 || !/^[6-9]\d{9}$/.test(cleanPhone)}
                  className="px-7 py-3.5 bg-gradient-to-r from-[#533afd] to-[#3b82f6] hover:opacity-95 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-[#533afd]/25 transition-all cursor-pointer"
                >
                  <span>Review &amp; Confirm</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
             SCREEN 6: REVIEW SUMMARY & LAUNCH
             ──────────────────────────────────────────────────────── */}
          {step === 6 && (
            <div className={`t-step-slide ${stepDirection === 'forward' ? 't-step-forward' : 't-step-backward'} space-y-6`}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#533afd] to-[#3b82f6] flex items-center justify-center text-white shadow-lg shadow-[#533afd]/30">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Review merchant profile</h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    Confirm your setup. You can adjust any parameter anytime in your dashboard.
                  </p>
                </div>
              </div>

              {/* Bento Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Google Account */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Google Account</span>
                  <div className="font-semibold text-white truncate">{userEmail}</div>
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified Authenticated
                  </div>
                </div>

                {/* Password */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Password</span>
                    <div className="font-mono text-white text-sm">••••••••••••</div>
                    <div className="text-[11px] text-emerald-400">High Strength 256-bit</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[11px] font-bold text-[#9b88fd] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {/* Business Name */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Business / Brand</span>
                    <div className="font-semibold text-white truncate">{businessName}</div>
                    <div className="text-[11px] text-slate-400">Public Display Name</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-[11px] font-bold text-[#9b88fd] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {/* Website URL */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Website Presence</span>
                    <div className="font-mono text-white text-xs truncate">
                      {noWebsite || !websiteUrl.trim() ? 'Direct Links & QR' : websiteUrl.trim()}
                    </div>
                    <div className="text-[11px] text-cyan-400">
                      {noWebsite || !websiteUrl.trim() ? 'No website configured' : 'Webhook Ready'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="text-[11px] font-bold text-[#9b88fd] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {/* Settlement UPI ID */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1 sm:col-span-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Settlement UPI ID</span>
                    <div className="font-mono font-bold text-white text-sm truncate">{upiId}</div>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5" />
                      {detectedBank ? detectedBank.name : 'Direct P2P Settlement'} • 0% Platform Fee
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="text-[11px] font-bold text-[#9b88fd] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>

                {/* WhatsApp Phone */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1 sm:col-span-2 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">WhatsApp Alert Mobile</span>
                    <div className="font-bold text-white text-sm">+91 {cleanPhone}</div>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Instant Drop Notifications Active
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="text-[11px] font-bold text-[#9b88fd] hover:underline cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={submitting}
                  className="px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/[0.05] text-slate-300 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="flex-1 sm:flex-initial sm:min-w-[260px] py-4 px-8 bg-gradient-to-r from-[#533afd] via-[#3b82f6] to-[#2563eb] hover:opacity-95 active:scale-95 disabled:opacity-60 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-xl shadow-[#533afd]/30 transition-all cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Merchant Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Launch Merchant Console</span>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
             SCREEN 7: SUCCESS CELEBRATION (transitions-dev 10-success-check.md)
             ──────────────────────────────────────────────────────── */}
          {step === 7 && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-6 animate-fadeIn">
              {/* transitions-dev .t-success-check */}
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse" />
                <span className={`t-success-check ${successCelebration ? 'is-in' : ''}`} data-state={successCelebration ? 'in' : 'out'}>
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/20">
                    <svg className="w-10 h-10 text-emerald-400" viewBox="0 0 48 48" fill="none">
                      <path
                        d="M12 24L20 32L36 16"
                        stroke="currentColor"
                        strokeWidth="4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </span>
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Merchant Account Active!
                </h1>
                <p className="text-sm text-slate-300 max-w-sm mx-auto">
                  Welcome to MyMobPay, <strong className="text-white">{businessName}</strong>. 0% direct UPI settlement gateway is now fully activated.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Launching your Merchant Dashboard...</span>
              </div>
            </div>
          )}

        </div>

        {/* ── Security Trust Footer ── */}
        <div className="mt-8 text-center text-xs text-slate-500 space-y-1">
          <div className="flex items-center justify-center gap-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              256-bit Bank Grade Security
            </span>
            <span>•</span>
            <span className="text-slate-400">0% Gateway Commission</span>
            <span>•</span>
            <span>Instant Direct UPI Settlement</span>
          </div>
          <p className="text-[11px] text-slate-600">
            &copy; {new Date().getFullYear()} MyMobPay Technologies. All rights reserved.
          </p>
        </div>

      </main>
    </div>
  );
}
