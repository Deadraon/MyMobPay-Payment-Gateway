'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, CheckCircle2, Zap, Calendar, Rocket, 
  Building2, Shield, Lock, Clock, Copy, Download, 
  HelpCircle, Languages, X, ExternalLink, RefreshCw, 
  LogOut, ArrowRight, Check, CheckCircle, ChevronRight
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';

export default function ConsoleActivationPaywall({
  profile,
  user,
  fetchProfile,
  fetchSubscriptionHistory,
  historyOrders = [],
  historyLoading = false,
  handleSignOut,
  onActivationComplete,
}) {
  // Check if merchant has already consumed their 1-time 3-day free trial
  const hasUsedTrial = Boolean(
    profile?.setup_progress?.trial_activated_at ||
    profile?.setup_progress?.plan_type === 'trial_3day' ||
    profile?.setup_progress?.plan_type === 'autopay_trial' ||
    profile?.setup_progress?.trial_expired ||
    historyOrders?.some(o => 
      (o.status === 'verified' || o.status === 'completed' || o.status === 'success') &&
      (o.note === 'Trial_Setup_3Day' || o.note === 'Autopay_Setup_3DayTrial' || (Number(o.amount) === 1 && !o.note?.includes('Subscription')))
    )
  );

  const [selectedPlan, setSelectedPlan] = useState(() => (hasUsedTrial ? '1m' : 'trial')); // 'trial' | '1m' | '3m' | 'custom'

  // If user has already used trial, switch default plan to 1m
  useEffect(() => {
    if (hasUsedTrial && selectedPlan === 'trial') {
      setSelectedPlan('1m');
    }
  }, [hasUsedTrial]);

  const [copiedVpa, setCopiedVpa] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [statusChecking, setStatusChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [language, setLanguage] = useState('en'); // 'en' | 'hi'
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [manualUtr, setManualUtr] = useState('');
  const [isVerifyingUtr, setIsVerifyingUtr] = useState(false);
  const [utrError, setUtrError] = useState('');

  // Payment Confirmation Success States
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Auto-detect active verified subscription status
  useEffect(() => {
    const isSubActive = profile?.subscription_status === 'active';
    const expiresAt = profile?.subscription_expires_at ? new Date(profile.subscription_expires_at) : null;
    const isNotExpired = expiresAt && expiresAt.getTime() > Date.now();

    if (isSubActive && isNotExpired) {
      setPaymentConfirmed(true);
    }
  }, [profile?.subscription_status, profile?.subscription_expires_at]);

  // Also check if historyOrders has verified subscription order
  useEffect(() => {
    if (historyOrders && historyOrders.length > 0) {
      const SUBSCRIPTION_NOTES = ['Trial_Setup_3Day', 'Subscription_1Month', 'Subscription_3Month', 'Custom_Enterprise'];
      const verifiedSubOrder = historyOrders.find(o => 
        (o.status === 'verified' || o.status === 'completed' || o.status === 'success') &&
        SUBSCRIPTION_NOTES.some(n => o.note?.includes(n))
      );
      if (verifiedSubOrder && profile?.subscription_status === 'active') {
        setPaymentConfirmed(true);
      }
    }
  }, [historyOrders, profile?.subscription_status]);

  // Countdown timer to automatically transition to console once payment is confirmed
  useEffect(() => {
    if (!paymentConfirmed) return;
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onActivationComplete) onActivationComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentConfirmed, onActivationComplete]);

  // Auto-poll every 2.5 seconds to detect payment confirmation automatically
  useEffect(() => {
    if (!user?.id) return;
    const pollInterval = setInterval(() => {
      if (fetchProfile) fetchProfile(user.id);
      if (fetchSubscriptionHistory) fetchSubscriptionHistory(user.id);
    }, 2500);
    return () => clearInterval(pollInterval);
  }, [user?.id, fetchProfile, fetchSubscriptionHistory]);

  // Countdown timer for QR
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 1 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const merchantVpa = CONFIG.upiId || '9410181307@okbizaxis';
  const callbackUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : 'https://www.mymob.tech/dashboard';
  const merchantId = profile?.id ? `MID-${profile.id.slice(0, 8).toUpperCase()}` : 'MID-884920';

  // Plans config
  const plans = {
    trial: {
      id: 'trial',
      title: language === 'hi' ? '3-दिन निःशुल्क ट्रायल' : '3-Day Free Trial',
      badge: hasUsedTrial ? (language === 'hi' ? 'समाप्त' : 'Expired') : (language === 'hi' ? 'अनुशंसित' : 'Recommended'),
      badgeColor: hasUsedTrial ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-emerald-100 text-emerald-800',
      priceText: '₹1.00',
      priceSub: hasUsedTrial ? (language === 'hi' ? 'ट्रायल समाप्त' : 'Trial Ended') : (language === 'hi' ? '₹1.00 सेटअप शुल्क' : '₹1.00 Setup Fee'),
      desc: hasUsedTrial ? (language === 'hi' ? '1-बार का ट्रायल समाप्त हो चुका है' : '1-time trial already used') : (language === 'hi' ? 'कोई ऑटो-डेबिट नहीं, रिफंडेबल चेक' : 'No auto-debits, refundable check'),
      amount: 1,
      note: 'Trial_Setup_3Day',
      icon: Zap,
      iconColor: hasUsedTrial ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-emerald-600',
    },
    '1m': {
      id: '1m',
      title: language === 'hi' ? '1 महीना स्टार्टर' : '1 Month Starter',
      badge: hasUsedTrial ? (language === 'hi' ? 'अनुशंसित' : 'Recommended') : '₹499',
      badgeColor: hasUsedTrial ? 'bg-emerald-100 text-emerald-800 font-extrabold' : 'bg-sky-100 text-sky-800',
      priceText: '₹499.00',
      priceSub: '₹499 / mo',
      desc: language === 'hi' ? 'पूर्ण डैशबोर्ड और लाइव वेबहुक एक्सेस' : 'Full dashboard & live webhook access',
      amount: 499,
      note: 'Subscription_1Month',
      icon: Calendar,
      iconColor: 'bg-sky-50 text-sky-600',
    },
    '3m': {
      id: '3m',
      title: language === 'hi' ? '3 महीने ग्रोथ' : '3 Months Growth',
      badge: language === 'hi' ? '5% छूट' : 'Save 5%',
      badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      priceText: '₹1,497.00',
      priceSub: '₹1,497 (₹499/mo)',
      desc: language === 'hi' ? '3 महीने का संपूर्ण फिनटेक सूट' : 'Complete 3-month fintech suite',
      amount: 1497,
      note: 'Subscription_3Month',
      icon: Rocket,
      iconColor: 'bg-slate-100 text-slate-700',
    },
    custom: {
      id: 'custom',
      title: language === 'hi' ? 'कस्टम एंटरप्राइज' : 'Custom Enterprise',
      badge: language === 'hi' ? 'संपर्क करें' : 'Contact',
      badgeColor: 'bg-slate-200 text-slate-800',
      priceText: 'Contact',
      priceSub: 'Custom SLA',
      desc: language === 'hi' ? 'वॉल्यूम मूल्य निर्धारण और समर्पित सहायता' : 'Volume pricing & dedicated SLA',
      amount: 0,
      note: 'Custom_Enterprise',
      icon: Building2,
      iconColor: 'bg-slate-100 text-slate-600',
    }
  };

  const currentPlan = plans[selectedPlan] || (hasUsedTrial ? plans['1m'] : plans.trial);
  const payUrl = currentPlan.amount > 0 
    ? `/pay?api_key=${CONFIG.platformApiKey}&amount=${currentPlan.amount}&ref=${profile?.id || ''}&note=${currentPlan.note}&callback=${encodeURIComponent(callbackUrl)}`
    : '#';

  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(merchantVpa)}&pn=${encodeURIComponent(CONFIG.businessName || 'MyMobPay')}&am=${currentPlan.amount > 0 ? currentPlan.amount.toFixed(2) : '1.00'}&cu=INR&tn=${encodeURIComponent(`${currentPlan.note}_${profile?.id ? profile.id.slice(0, 8) : 'SUB'}`)}`;

  const handleCopyVpa = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(merchantVpa);
      setCopiedVpa(true);
      setTimeout(() => setCopiedVpa(false), 2000);
    }
  };

  const handleRefreshStatus = async () => {
    setStatusChecking(true);
    setStatusMsg('Checking payment status & activation…');
    try {
      const merchantUid = user?.id || profile?.id;
      if (merchantUid) {
        // Re-fetch profile securely from database
        await fetchProfile(merchantUid);
        if (fetchSubscriptionHistory) {
          await fetchSubscriptionHistory(merchantUid);
        }

        // Check if there is an active valid subscription
        const { data: currentMerchant } = await supabase
          .from('merchants')
          .select('subscription_status, subscription_expires_at')
          .eq('id', merchantUid)
          .single();

        const isSubActive = currentMerchant?.subscription_status === 'active';
        const expiresAt = currentMerchant?.subscription_expires_at ? new Date(currentMerchant.subscription_expires_at) : null;
        const isNotExpired = expiresAt && expiresAt.getTime() > Date.now();

        if (isSubActive && isNotExpired) {
          setStatusMsg('✓ Subscription is active and verified! Console is unlocked.');
          setPaymentConfirmed(true);
          return;
        }

        // Check for any pending order created in the last 30 minutes
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: recentOrder } = await supabase
          .from('orders')
          .select('id, amount, status, created_at')
          .eq('external_ref', merchantUid)
          .gte('created_at', thirtyMinsAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (recentOrder && recentOrder.status === 'pending') {
          setStatusMsg(`Payment for Order ${recentOrder.id} is pending bank confirmation. Please wait for bank sync or enter UTR on checkout.`);
        } else if (hasUsedTrial) {
          setStatusMsg(`Your 3-day trial has ended. Please scan the QR code to complete payment of ₹${currentPlan.amount} for ${currentPlan.title} to unlock.`);
        } else {
          setStatusMsg('No recent payment detected. Please scan the QR code to complete activation.');
        }
      }
    } catch (err) {
      console.error('Status sync error:', err);
      setStatusMsg('Status check failed. Please check network connection.');
    } finally {
      setStatusChecking(false);
    }
  };

  // Auto-register pending order for this merchant so bank webhook matches seamlessly
  useEffect(() => {
    const merchantUid = profile?.id || user?.id;
    if (!merchantUid || !currentPlan.amount || currentPlan.amount <= 0) return;
    const createPendingOrder = async () => {
      try {
        await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: CONFIG.platformApiKey,
            amount: currentPlan.amount,
            note: currentPlan.note,
            external_ref: merchantUid,
            callback_url: callbackUrl,
          }),
        });
      } catch (e) {
        // Silent catch
      }
    };
    createPendingOrder();
  }, [profile?.id, user?.id, currentPlan.amount, currentPlan.note]);

  // Handle manual 12-digit UTR verification
  const handleVerifyManualUtr = async (e) => {
    if (e) e.preventDefault();
    const cleanUtr = manualUtr.trim();
    if (!cleanUtr || cleanUtr.length < 10) {
      setUtrError('Please enter a valid 12-digit bank UTR / Ref number.');
      return;
    }
    setUtrError('');
    setIsVerifyingUtr(true);
    setStatusMsg('Verifying UTR with bank records...');
    try {
      const merchantUid = user?.id || profile?.id;
      const res = await fetch('/api/merchant/subscription/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchantUid,
          planId: currentPlan.id,
          planName: currentPlan.title,
          amount: currentPlan.amount || 499,
          durationDays: currentPlan.id === '3m' ? 90 : 30,
          utr: cleanUtr,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to verify UTR');
      }
      if (fetchProfile && merchantUid) {
        await fetchProfile(merchantUid);
      }
      if (fetchSubscriptionHistory && merchantUid) {
        await fetchSubscriptionHistory(merchantUid);
      }
      setStatusMsg('✓ Subscription activated & verified! Unlocking console...');
      setPaymentConfirmed(true);
    } catch (err) {
      console.error('Manual UTR verification failed:', err);
      setUtrError(err.message || 'Could not verify UTR. Please ensure payment is completed.');
    } finally {
      setIsVerifyingUtr(false);
    }
  };

  // Only show past subscription if there's a verified/completed subscription order
  const SUBSCRIPTION_NOTES = ['Trial_Setup_3Day', 'Subscription_1Month', 'Subscription_3Month', 'Custom_Enterprise'];
  const latestPastOrder = historyOrders && historyOrders.length > 0
    ? historyOrders.find(o =>
        (o.status === 'verified' || o.status === 'completed' || o.status === 'success') &&
        SUBSCRIPTION_NOTES.some(n => o.note?.includes(n))
      ) || null
    : null;

  // ═════════════════════════════════════════════════════════════════════════════
  // PAYMENT SUCCESS CONFIRMATION SCREEN (WITH ANIMATED GREEN TICK & AUTO-REDIRECT)
  // ═════════════════════════════════════════════════════════════════════════════
  if (paymentConfirmed) {
    const activeOrder = historyOrders?.find(o => 
      (o.status === 'verified' || o.status === 'completed' || o.status === 'success')
    );
    const amountDisplay = activeOrder?.amount ? `₹${Number(activeOrder.amount).toFixed(2)}` : currentPlan.priceText;
    const expiryDateStr = profile?.subscription_expires_at 
      ? new Date(profile.subscription_expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : (selectedPlan === '1m' ? '30 Days Full Access' : selectedPlan === '3m' ? '90 Days Full Access' : '3 Days Free Trial');

    return (
      <div className="bg-slate-100 font-sans text-slate-800 antialiased min-h-screen flex flex-col justify-center items-center py-6 px-3 sm:px-6">
        
        {/* Floating Trust Pill on Top */}
        <div className="flex items-center space-x-2 bg-white shadow-sm rounded-full px-4 py-1.5 mb-4 border border-emerald-200">
          <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-700">
            Payment Verified • <strong>mymob.tech</strong>
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold">Active</span>
        </div>

        {/* Success Card Container */}
        <div className="w-full max-w-[620px] bg-white shadow-2xl rounded-3xl overflow-hidden flex flex-col border border-slate-200/80">
          
          {/* Header */}
          <div className="bg-[#0c2340] text-white p-5 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-md shrink-0 text-white font-black text-lg">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <span className="text-base font-bold text-white tracking-tight block">MyMobPay Technologies</span>
                <span className="text-xs text-slate-300">Console Activation Gateway</span>
              </div>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Payment Success
            </span>
          </div>

          {/* Success Body */}
          <div className="p-6 sm:p-8 flex flex-col items-center text-center">
            
            {/* Animated Green Tick Icon */}
            <div className="relative flex items-center justify-center my-4">
              {/* Outer pulsing ring */}
              <div className="absolute w-28 h-28 rounded-full bg-emerald-100 animate-ping opacity-75"></div>
              {/* Green circular base with white checkmark */}
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-500/30 border-4 border-white">
                <Check className="w-12 h-12 text-white stroke-[3.5]" />
              </div>
            </div>

            {/* Title & Message */}
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-3">
              {language === 'hi' ? 'भुगतान सफल रहा!' : 'Payment Successful!'}
            </h2>
            <p className="text-sm text-slate-600 font-medium max-w-md mx-auto mt-2 leading-relaxed">
              {language === 'hi' 
                ? 'आपका एक्टिवेशन भुगतान बैंक द्वारा सत्यापित कर दिया गया है। आपका मर्चेंट कंसोल अब सक्रिय हो चुका है।' 
                : 'Your activation payment has been verified by the bank. Your merchant console and API gateway are now fully unlocked.'}
            </p>

            {/* Green confirmation pill */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant Bank Confirmation Verified</span>
            </div>

            {/* Receipt Summary Card */}
            <div className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl p-5 mt-5 text-left space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {language === 'hi' ? 'सक्रिय प्लान' : 'Plan Activated'}
                </span>
                <span className="text-sm font-bold text-slate-900">{currentPlan.title}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {language === 'hi' ? 'भुगतान राशि' : 'Amount Paid'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-base font-black text-emerald-600">{amountDisplay}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 uppercase tracking-wide">
                    ✓ Paid
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Merchant ID</span>
                <span className="font-mono text-xs font-bold text-slate-700">{merchantId}</span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {language === 'hi' ? 'वैधता' : 'Subscription Validity'}
                </span>
                <span className="text-xs font-bold text-slate-800">{expiryDateStr}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {language === 'hi' ? 'कंसोल स्थिति' : 'Console Status'}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Unlocked & Active
                </span>
              </div>
            </div>

            {/* Unlocked Capabilities Pills */}
            <div className="w-full grid grid-cols-2 gap-2 mt-4 text-[11px] font-semibold text-slate-700">
              <div className="flex items-center gap-1.5 bg-emerald-50/60 border border-emerald-100 p-2 rounded-xl text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Live UPI QR Collections</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50/60 border border-emerald-100 p-2 rounded-xl text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Instant Webhooks Sync</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50/60 border border-emerald-100 p-2 rounded-xl text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>API Keys & Dev Portal</span>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50/60 border border-emerald-100 p-2 rounded-xl text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Real-Time Settlements</span>
              </div>
            </div>

            {/* Countdown Progress Bar */}
            <div className="w-full mt-6 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>
                  {language === 'hi' 
                    ? `${countdown} सेकंड में कंसोल खुल रहा है...` 
                    : `Entering console in ${countdown}s...`}
                </span>
                <span className="font-bold text-emerald-600">{Math.round(((5 - countdown) / 5) * 100)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${Math.min(100, Math.max(10, ((6 - countdown) / 5) * 100))}%` }}
                />
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              onClick={() => {
                if (onActivationComplete) onActivationComplete();
              }}
              className="w-full mt-5 py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>{language === 'hi' ? 'मर्चेंट डैशबोर्ड पर जाएं' : 'Continue to Merchant Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

          </div>

          {/* Footer */}
          <footer className="bg-slate-50 py-3 px-6 flex items-center justify-center text-slate-500 text-xs border-t border-slate-200">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Protected by <strong>mymob.tech</strong> 256-bit encryption • Instant Activation
            </span>
          </footer>

        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 font-sans text-slate-800 antialiased min-h-screen flex flex-col justify-center items-center py-6 px-3 sm:px-6">
      
      {/* Floating Trust Pill on Top */}
      <div className="flex items-center space-x-2 bg-white shadow-sm rounded-full px-4 py-1.5 mb-4 border border-slate-200/60">
        <ShieldCheck className="w-4.5 h-4.5 text-[#0284c7]" />
        <span className="text-xs font-semibold text-slate-700">
          Official 256-Bit Encrypted Gateway • <strong>mymob.tech</strong>
        </span>
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ba9d]"></span>
        <span className="text-[10px] text-[#00ba9d] uppercase tracking-wider font-bold">Live</span>
      </div>

      {/* Main Hosted Checkout Container */}
      <div className="w-full max-w-[840px] bg-white shadow-2xl rounded-2xl overflow-hidden flex flex-col border border-slate-200/80">
        
        {/* Checkout Header */}
        <div className="bg-[#0c2340] text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Merchant & Order Identity */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-[#0284c7] flex items-center justify-center shadow-md shrink-0 text-white font-black text-xl">
              <span>M</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-white tracking-tight">MyMobPay Technologies</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  Verified
                </span>
              </div>
              <div className="flex items-center space-x-2 text-slate-300 text-xs mt-0.5">
                <span>{merchantId}</span>
                <span>•</span>
                <span className={hasUsedTrial ? "text-amber-300 font-medium" : "text-sky-300 font-medium"}>
                  {hasUsedTrial ? 'Trial Expired • Upgrade Required' : 'Merchant Activation & Console Unlock'}
                </span>
              </div>
            </div>
          </div>

          {/* Total Price & Controls */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t border-slate-700/60 sm:border-0 pt-3 sm:pt-0 gap-2">
            <div className="flex items-center space-x-2 mb-1">
              {/* Language Switcher */}
              <button 
                onClick={() => setLanguage(l => l === 'en' ? 'hi' : 'en')}
                className="bg-slate-800/80 hover:bg-slate-700 text-sky-200 rounded-lg px-2.5 py-1 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer" 
                type="button"
              >
                <Languages className="w-3.5 h-3.5 text-sky-300" />
                <span>{language === 'en' ? 'English / हिन्दी' : 'हिन्दी / English'}</span>
              </button>
              
              {/* Sign Out Icon */}
              <button 
                onClick={handleSignOut}
                className="text-slate-400 hover:text-white transition-colors p-1 flex items-center justify-center cursor-pointer rounded" 
                title="Sign Out" 
                type="button"
              >
                <X className="w-5 h-5 leading-none" />
              </button>
            </div>
            
            <div className="flex items-baseline space-x-1.5">
              <span className="text-xs text-slate-300 font-medium">
                {language === 'hi' ? 'देय राशि:' : 'Amount Due:'}
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight" id="headerAmountDue">
                {currentPlan.priceText}
              </span>
            </div>
          </div>

        </div>

        {/* Trial Expired Alert Banner */}
        {hasUsedTrial && (
          <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Your 3-Day Free Trial has ended.</strong> Please select a standard subscription plan (1 Month Starter or 3 Months Growth) below to unlock full console access.
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0 border border-amber-300">
              Renewal Required
            </span>
          </div>
        )}

        {/* Main Body: Split Rail Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[560px]">
          
          {/* Left Vertical Plans Rail (5 cols) */}
          <aside className="md:col-span-5 bg-slate-50/70 p-3 sm:p-4 flex flex-col justify-between border-r border-slate-100">
            <div className="space-y-2">
              <p className="text-[11px] text-slate-500 uppercase tracking-wider px-3 py-1 font-bold">
                {language === 'hi' ? 'सक्रियण योजना चुनें' : 'Select Activation Plan'}
              </p>

              {/* Option 1: 3-Day Free Trial */}
              <div 
                onClick={() => {
                  if (hasUsedTrial) {
                    setStatusMsg('Your 3-day free trial has expired. Please select 1 Month Starter or 3 Months Growth.');
                    return;
                  }
                  setSelectedPlan('trial');
                }}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between ${
                  hasUsedTrial
                    ? 'bg-slate-100/80 border border-slate-200 opacity-60 cursor-not-allowed select-none'
                    : selectedPlan === 'trial' 
                      ? 'bg-white border-2 border-emerald-500 shadow-sm cursor-pointer' 
                      : 'bg-white hover:bg-slate-50 border border-slate-200 cursor-pointer'
                }`}
                id="plan-trial"
                title={hasUsedTrial ? "Free trial already used" : "3-Day Free Trial"}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    hasUsedTrial ? 'bg-slate-200 text-slate-500' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {hasUsedTrial ? (
                      <Lock className="w-5 h-5 text-slate-500" />
                    ) : (
                      <Zap className="w-6 h-6 fill-emerald-600 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-sm font-bold ${hasUsedTrial ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {plans.trial.title}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-extrabold ${
                        hasUsedTrial ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {plans.trial.badge}
                      </span>
                    </div>
                    <p className={`text-xs font-semibold mt-0.5 ${hasUsedTrial ? 'text-slate-400' : 'text-emerald-700'}`}>
                      {hasUsedTrial ? 'Trial completed' : plans.trial.priceSub}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {plans.trial.desc}
                    </p>
                  </div>
                </div>
                {hasUsedTrial ? (
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded">
                    Claimed
                  </span>
                ) : selectedPlan === 'trial' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 font-bold" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-300 font-bold" />
                )}
              </div>

              {/* Option 2: 1 Month Starter */}
              <div 
                onClick={() => setSelectedPlan('1m')}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                  selectedPlan === '1m' 
                    ? 'bg-white border-2 border-sky-500 shadow-sm' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200'
                }`}
                id="plan-1m"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600 shrink-0">
                    <Calendar className="w-6 h-6 text-sky-600" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-bold text-slate-900">{plans['1m'].title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold">
                        {plans['1m'].badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{plans['1m'].desc}</p>
                  </div>
                </div>
                {selectedPlan === '1m' ? (
                  <CheckCircle2 className="w-5 h-5 text-sky-600 font-bold" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-300 font-bold" />
                )}
              </div>

              {/* Option 3: 3 Months Growth */}
              <div 
                onClick={() => setSelectedPlan('3m')}
                className={`w-full text-left p-3.5 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                  selectedPlan === '3m' 
                    ? 'bg-white border-2 border-emerald-500 shadow-sm' 
                    : 'bg-white hover:bg-slate-50 border border-slate-200'
                }`}
                id="plan-3m"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                    <Rocket className="w-6 h-6 text-slate-700" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-bold text-slate-900">{plans['3m'].title}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                        {plans['3m'].badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-900 font-semibold mt-0.5">
                      ₹1,497 <span className="text-slate-400 font-normal text-[11px]">(₹499/mo)</span>
                    </p>
                  </div>
                </div>
                {selectedPlan === '3m' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 font-bold" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-300 font-bold" />
                )}
              </div>

              {/* Option 4: Custom Enterprise */}
              <div 
                onClick={() => { setSelectedPlan('custom'); setShowEnterpriseModal(true); }}
                className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                  selectedPlan === 'custom'
                    ? 'bg-white border-2 border-slate-700 shadow-sm'
                    : 'bg-white/60 hover:bg-white border border-dashed border-slate-300'
                }`}
                id="plan-custom"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <Building2 className="w-6 h-6 text-slate-600" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800">{plans.custom.title}</span>
                    <p className="text-[11px] text-slate-500">{plans.custom.desc}</p>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-sky-600 hover:underline">
                  {plans.custom.badge}
                </span>
              </div>
            </div>

            {/* Merchant Safeguard Footnote / Guarantee */}
            <div className="mt-4 p-3 rounded-xl bg-slate-100/80 text-slate-600 text-left">
              <div className="flex items-center space-x-2 text-slate-800">
                <Shield className="w-4 h-4 text-[#0284c7]" />
                <span className="text-xs font-bold">MyMobPay Guarantee</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Direct-to-bank settlement, live webhooks, zero intermediary retention, 100% money back guarantee.
              </p>
            </div>
          </aside>

          {/* Right Active Content Pane (7 cols) */}
          <section className="md:col-span-7 p-5 sm:p-7 flex flex-col justify-between bg-white">
            <div className="space-y-5 flex-1">
              
              {/* Subsection 1: Supported UPI Apps Grid */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Supported UPI Apps</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7] inline-block"></span>
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Accepted across all apps</span>
                </div>

                <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
                  {/* Google Pay */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center select-none hover:bg-white hover:shadow-xs transition-all">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-1.5 p-1">
                      <img src="/logos/gpay.svg" alt="Google Pay" className="h-5.5 w-auto object-contain" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 truncate w-full">Google Pay</span>
                  </div>

                  {/* PhonePe */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center select-none hover:bg-white hover:shadow-xs transition-all">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-1.5 p-1">
                      <img src="/logos/phonepe.svg" alt="PhonePe" className="h-5 w-auto object-contain" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 truncate w-full">PhonePe</span>
                  </div>

                  {/* Paytm */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center select-none hover:bg-white hover:shadow-xs transition-all">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-1.5 p-1">
                      <img src="/logos/paytm.svg" alt="Paytm" className="h-4 w-auto object-contain" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 truncate w-full">Paytm</span>
                  </div>

                  {/* CRED */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center select-none hover:bg-white hover:shadow-xs transition-all">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-1.5 p-1">
                      <img src="/logos/cred.svg" alt="CRED" className="h-4.5 w-auto object-contain" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 truncate w-full">CRED</span>
                  </div>

                  {/* BHIM UPI */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-center select-none hover:bg-white hover:shadow-xs transition-all">
                    <div className="w-10 h-10 rounded-lg bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-1.5 p-1">
                      <img src="/logos/bhim.svg" alt="BHIM UPI" className="h-4 w-auto object-contain" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 truncate w-full">BHIM UPI</span>
                  </div>
                </div>
              </div>

              {/* Subsection 2: Scan UPI QR Code Banner */}
              <div className="bg-slate-50 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 border border-slate-200/60">
                {/* Live Dynamic QR Container */}
                <div className="relative w-32 h-32 bg-white rounded-xl p-2 shadow-sm flex items-center justify-center shrink-0 border border-slate-200">
                  <QRCode
                    value={upiIntentUri}
                    size={110}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    viewBox={`0 0 110 110`}
                  />
                  <div className="absolute inset-0 m-auto w-7 h-7 rounded-xl bg-white shadow-md flex items-center justify-center p-0.5 border border-slate-100 pointer-events-none">
                    <svg width="18" height="16" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M 7 28.5 V 13.5 C 7 7.5 12 5.5 16 8.5 L 19 19" stroke="#0284C7" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M 19 19 L 22 8.5 C 26 5.5 31 7.5 31 13.5 V 28.5" stroke="#FF7800" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* QR Instructions and Live Ticker */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center space-x-1.5 bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>QR expires in {formatTime(timeLeft)}</span>
                  </div>
                  
                  <h4 className="text-sm font-bold text-slate-900">
                    Scan with any UPI app to pay {currentPlan.priceText}
                  </h4>
                  
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Open Google Pay, PhonePe, Paytm, CRED or BHIM on your phone and point camera to complete activation.
                  </p>

                  <div className="mt-3 flex items-center justify-center sm:justify-start">
                    <div className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Instant verification &amp; auto-unlock active</span>
                    </div>
                  </div>

                  {statusMsg && (
                    <div className={`mt-2 p-2.5 rounded-xl text-xs font-semibold ${
                      statusMsg.startsWith('✓') 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                        : 'bg-sky-50 text-sky-800 border border-sky-200'
                    }`}>
                      <span>{statusMsg}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Subsection 3: Enter UPI ID / VPA */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    Pay directly to Merchant VPA
                    <ShieldCheck className="w-4 h-4 text-[#0284c7]" />
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    Instant Verification
                  </span>
                </div>
                
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Merchant UPI ID / VPA
                    </span>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="font-bold text-slate-900 text-sm tracking-wide select-all">
                        {merchantVpa}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={handleCopyVpa}
                    className="h-9 px-3.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-sky-700 text-xs font-semibold flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0 gap-1.5" 
                    type="button"
                  >
                    {copiedVpa ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy UPI ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Subsection 4: Already Paid? Manual 12-Digit UTR Verification Card */}
              <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    Already Paid? Enter 12-Digit Bank UTR / Ref No.
                  </span>
                  <span className="text-[10px] text-sky-700 font-bold px-2 py-0.5 rounded-full bg-sky-100 border border-sky-300">
                    Instant Unlock
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-normal">
                  If you scanned the QR and paid from your phone or friend's UPI app, paste the 12-digit UPI Ref/UTR number from your payment receipt below:
                </p>
                <form onSubmit={handleVerifyManualUtr} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="e.g. 628013441782"
                    value={manualUtr}
                    onChange={(e) => {
                      setManualUtr(e.target.value.replace(/[^0-9A-Za-z]/g, ''));
                      setUtrError('');
                    }}
                    className="flex-1 px-3 py-2 text-xs font-mono font-semibold bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 placeholder:text-slate-400"
                    maxLength={22}
                  />
                  <button
                    type="submit"
                    disabled={isVerifyingUtr || !manualUtr.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isVerifyingUtr ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Verify &amp; Unlock</span>
                      </>
                    )}
                  </button>
                </form>
                {utrError && (
                  <p className="text-[11px] font-semibold text-rose-600">{utrError}</p>
                )}
              </div>

              {/* Past Payment Reference Note & Status Sync */}
              <div className="px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <span className="text-slate-500 text-[11px]">
                  {latestPastOrder ? (
                    <>
                      {latestPastOrder.amount === 1 || latestPastOrder.note?.includes('Trial') ? (
                        <>
                          Past Trial: <strong className="text-slate-700 font-semibold">₹1 verified</strong> (Ref: {latestPastOrder.id?.replace(/^[-#]+/, '')}) • <span className="text-amber-600 font-semibold">Trial Expired</span>
                        </>
                      ) : (
                        <>
                          Past Subscription: <strong className="text-slate-700 font-semibold">₹{latestPastOrder.amount} {latestPastOrder.status}</strong> (Ref: {latestPastOrder.id?.replace(/^[-#]+/, '')})
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      Account Status: <strong className="text-amber-600 font-semibold">Activation Required</strong>
                    </>
                  )}
                </span>
                
                <button
                  onClick={handleRefreshStatus}
                  disabled={statusChecking}
                  className="inline-flex items-center text-sky-600 hover:text-sky-800 font-semibold gap-1 text-[11px] cursor-pointer disabled:opacity-50"
                  type="button"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${statusChecking ? 'animate-spin' : ''}`} />
                  <span>{statusChecking ? 'Checking status...' : 'Check Payment & Unlock'}</span>
                </button>
              </div>

            </div>

            {/* Active Pane Security Reassurance Footnote */}
            <div className="pt-4 mt-4 flex items-center justify-between text-slate-500 border-t border-slate-100 text-xs">
              <div className="flex items-center space-x-1.5 text-slate-600">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium">100% Safe &amp; Secure Activation</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-500 text-xs">
                <span>Powered by</span>
                <span className="font-bold text-[#0284c7] tracking-tight">mymob.tech</span>
              </div>
            </div>

          </section>

        </div>

        {/* Trust Badges Bottom Banner */}
        <footer className="bg-slate-100 py-3 px-6 flex flex-wrap items-center justify-between gap-3 text-slate-600 text-xs border-t border-slate-200">
          <div className="flex items-center space-x-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#0284c7]" />
            <span>Protected by <strong>mymob.tech</strong> military-grade 256-bit encryption</span>
          </div>
          <div className="flex items-center space-x-3 text-slate-500">
            <span className="font-bold text-slate-800">UPI</span>
            <span>•</span>
            <span className="font-bold text-slate-800">IMPS / NEFT</span>
            <span>•</span>
            <span className="font-bold text-slate-800">Web3 USDT</span>
            <span>•</span>
            <span className="inline-flex items-center bg-white px-2 py-0.5 rounded shadow-xs font-semibold text-[11px] text-slate-800 border border-slate-200">
              Instant Bank Settlement
            </span>
          </div>
        </footer>

      </div>

      {/* Sub-modal Quick Help and Dismiss Controls */}
      <div className="w-full max-w-[840px] flex items-center justify-between mt-3 px-2 text-slate-500 text-xs">
        <button 
          onClick={() => setShowHelpModal(true)}
          className="hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer" 
          type="button"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Need help with activation?</span>
        </button>
        <span className="font-mono text-[12px]">Session ID: MMP_{profile?.id ? profile.id.slice(0, 8).toUpperCase() : 'M982_6301A'}</span>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sky-600" />
                Activation Assistance
              </h3>
              <button onClick={() => setShowHelpModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Once you pay the ₹1.00 setup fee or subscription fee using any UPI app (GPay, PhonePe, Paytm), your merchant console automatically activates within 5 seconds.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-700">
              <p><strong>Merchant Support:</strong> support@mymob.tech</p>
              <p><strong>WhatsApp Support:</strong> +91 9410181307</p>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Custom Enterprise Modal */}
      {showEnterpriseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#0284c7]" />
                Custom Enterprise Activation
              </h3>
              <button onClick={() => setShowEnterpriseModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Processing high volumes? Get custom negotiated flat-rate pricing, dedicated account managers, 99.99% SLA, and custom bank routing.
            </p>
            <div className="p-3.5 bg-sky-50/70 border border-sky-100 rounded-xl text-xs space-y-1.5 text-slate-800">
              <p><strong>Email:</strong> enterprise@mymob.tech</p>
              <p><strong>Direct Desk:</strong> +91 9410181307</p>
              <p className="text-[11px] text-sky-700">Response within 2 hours guaranteed.</p>
            </div>
            <div className="flex gap-2">
              <a
                href="mailto:enterprise@mymob.tech?subject=Enterprise%20Plan%20Inquiry"
                className="flex-1 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-center rounded-xl text-xs font-bold transition-all"
              >
                Send Email
              </a>
              <button
                onClick={() => setShowEnterpriseModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
