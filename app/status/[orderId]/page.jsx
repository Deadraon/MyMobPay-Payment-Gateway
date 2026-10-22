'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatRefId } from '@/lib/orderId';
import {
  CheckCircle, XCircle, Loader2, IndianRupee,
  Key, Calendar, ShieldCheck, RefreshCw,
  AlertCircle, ArrowRight, ExternalLink, Check, Clock,
} from 'lucide-react';
import PaymentSuccessTick from '@/components/PaymentSuccessTick';

/* ── Animated success check ────────────────────────────────── */
const AnimatedCheck = () => (
  <svg viewBox="0 0 52 52" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
    <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2" opacity="0.2" />
    <circle cx="26" cy="26" r="25" fill="none" stroke="#10B981" strokeWidth="2.5"
      strokeDasharray="157" strokeDashoffset="157"
      style={{ animation: 'dash 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards' }}
      strokeLinecap="round" />
    <path d="M14 27 L22 35 L38 18" fill="none" stroke="#10B981" strokeWidth="3"
      strokeDasharray="33" strokeDashoffset="33"
      style={{ animation: 'dash 0.4s 0.5s cubic-bezier(0.65, 0, 0.45, 1) forwards' }}
      strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ── Receipt row ───────────────────────────────────────────── */
const Row = ({ label, value, displayValue, mono = false, green = false, badge = false, title }) => (
  <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-0">
    <span className="text-[11px] text-slate-400 font-semibold tracking-wide">{label}</span>
    {badge ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> {displayValue || value}
      </span>
    ) : (
      <span
        title={title || (typeof value === 'string' ? value : undefined)}
        className={`text-xs font-semibold text-right max-w-[60%] break-all ${mono ? 'font-mono text-[11px] tracking-wide' : ''} ${green ? 'text-emerald-600 font-bold' : 'text-slate-800'}`}
      >
        {displayValue || value}
      </span>
    )}
  </div>
);

const MyMobPayLogo = ({ className = 'w-48 h-auto', textColor = 'var(--text-primary)' }) => (
  <svg viewBox="0 0 220 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} transition-transform duration-300 hover:scale-[1.02]`}>
        {/* 3D Ribbon M Mark */}
    <image
      href="/logos/mymobpay_mark.png"
      x="2"
      y="2"
      width="38"
      height="36"
      preserveAspectRatio="xMidYMid meet"
    />
    <text
      x="44"
      y="27"
      fontFamily="'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      fontWeight="800"
      fontSize="26"
      fill={textColor}
      letterSpacing="-0.5"
    >
      MyMobPay
    </text>
  </svg>
);

/* ── Logo header ───────────────────────────────────────────── */
const Header = ({ badge }) => (
  <header className="w-full border-b border-slate-200 bg-[#0D0D12] px-5 py-3.5 flex items-center justify-between">
    <div className="flex items-center">
      <MyMobPayLogo className="h-6 w-auto object-contain" textColor="#FFFFFF" />
    </div>
    {badge}
  </header>
);

export default function StatusPage() {
  const params = useParams();
  const router = useRouter();
  const rawOrderId = params.orderId;
  const orderId = (rawOrderId || '').trim().replace(/^[-#]+/, '');

  const [order, setOrder]                 = useState(null);
  const [merchant, setMerchant]           = useState(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [mounted, setMounted]             = useState(false);

  const [utrInput, setUtrInput]           = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [utrError, setUtrError]           = useState('');
  const [utrSuccess, setUtrSuccess]       = useState('');
  const [redirecting, setRedirecting]     = useState(false);
  const [completedNotice, setCompletedNotice] = useState(false);
  const redirectTriggeredRef             = useRef(false);

  useEffect(() => { 
    setMounted(true); 
  }, [orderId]);

  useEffect(() => {
    if (!orderId && !rawOrderId) return;
    const fetchOrder = async () => {
      try {
        let data = null;
        let dbErr = null;
        const res1 = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
        if (res1.data) {
          data = res1.data;
        } else {
          const res2 = await supabase.from('orders').select('*').ilike('id', orderId).maybeSingle();
          if (res2.data) {
            data = res2.data;
          } else if (rawOrderId && rawOrderId !== orderId) {
            const res3 = await supabase.from('orders').select('*').ilike('id', rawOrderId).maybeSingle();
            data = res3.data;
            dbErr = res3.error;
          } else {
            dbErr = res1.error;
          }
        }

        if (!data) throw dbErr || new Error('Not found');
        setOrder(data);
        setError('');

        if (data?.merchant_id) {
          supabase
            .from('merchants')
            .select('business_name, webhook_url')
            .eq('id', data.merchant_id)
            .single()
            .then(({ data: mData }) => {
              if (mData) setMerchant(mData);
            });
        }
      } catch {
        setError('Could not locate this transaction.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
    const interval = setInterval(fetchOrder, 2000);
    return () => clearInterval(interval);
  }, [orderId, rawOrderId]);

  /* Resolve the original app return URL from order or platform subscriptions */
  const resolveRedirectUrl = () => {
    // 1. Direct explicit callback from order or localStorage (only if explicit and not a webhook)
    let target = (typeof window !== 'undefined' && localStorage.getItem(`callback_${orderId}`)) || order?.callback_url;

    // Safety check: NEVER redirect to any webhook URL or API endpoint
    if (target && (target.includes('/webhook') || target.includes('/api/'))) {
      target = null;
    }

    // 2. Automatic fallback for Trial and Subscription payments (Platform self-service dashboard)
    if (!target && (order?.note === 'Trial_Setup_3Day' || order?.note === 'Autopay_Setup_3DayTrial' || order?.note?.startsWith('Subscription_'))) {
      target = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '/dashboard';
    }

    return target || null;
  };

  const executeRedirect = (targetCallback) => {
    const cb = targetCallback || resolveRedirectUrl();
    if (!cb) return false;

    const externalRef = (typeof window !== 'undefined' && localStorage.getItem(`ref_${orderId}`)) || order?.external_ref;
    try {
      let resolvedUrl = cb.trim();
      if (!/^https?:\/\//i.test(resolvedUrl) && !resolvedUrl.startsWith('/')) {
        resolvedUrl = `https://${resolvedUrl}`;
      }
      const url = new URL(resolvedUrl, typeof window !== 'undefined' ? window.location.origin : 'https://mymob.tech');
      url.searchParams.set('status', 'verified');
      url.searchParams.set('order_id', orderId);
      url.searchParams.set('gateway_id', orderId);
      url.searchParams.set('orderId', orderId);
      if (order?.utr) url.searchParams.set('utr', order.utr);
      if (externalRef) url.searchParams.set('ref', externalRef);
      window.location.href = url.toString();
      return true;
    } catch (e) {
      console.error('Redirect URL parsing failed:', e);
      window.location.href = cb;
      return true;
    }
  };

  /* Done button handler — returns to explicit callback or closes/confirms */
  const handleDone = () => {
    const target = resolveRedirectUrl();
    if (target) {
      setRedirecting(true);
      executeRedirect(target);
      return;
    }

    // If opened in popup / webview with opener, close window to return to parent app
    if (typeof window !== 'undefined' && window.opener && !window.opener.closed) {
      window.close();
      return;
    }

    // Try closing window directly (works in mobile webviews / in-app browsers)
    if (typeof window !== 'undefined') {
      window.close();
    }

    // If browser blocks closing, show clear reassurance that payment is complete
    setCompletedNotice(true);
  };

  const handleUtrSubmit = async (e) => {
    e.preventDefault();
    setUtrError(''); setUtrSuccess('');
    const cleanUtr = utrInput.trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
      setUtrError('Please enter a valid 12-digit UTR number.');
      return;
    }
    setSubmittingUtr(true);
    try {
      const res = await fetch('/api/payments/utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, utr: cleanUtr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit UTR.');
      setOrder(data.order);
      setUtrSuccess('UTR submitted! Verification in progress.');
    } catch (err) {
      setUtrError(err.message);
    } finally {
      setSubmittingUtr(false);
    }
  };

  const fmt = (dt) => dt
    ? new Date(dt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  /* Loading */
  if (!mounted || loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <MyMobPayLogo className="w-40 h-auto mb-1" textColor="#0c2340" />
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <p className="text-sm text-slate-500 font-medium">Loading transaction...</p>
      </div>
    </div>
  );

  /* Error */
  if (error || !order) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-8 text-center space-y-4 animate-scale-up">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
          <p className="text-xs text-slate-500 mt-1">We couldn&apos;t find a transaction matching this ID.</p>
        </div>
        <button onClick={() => typeof window !== 'undefined' && window.history.length > 1 ? window.history.back() : (window.close && window.close())}
          className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold text-sm transition-all cursor-pointer">
          Return to App
        </button>
      </div>
    </div>
  );

  const isUtrSubmitted = order.utr && /^\d{12}$/.test(order.utr.trim());
  let callback = (typeof window !== 'undefined' && localStorage.getItem(`callback_${orderId}`)) || order.callback_url;
  if (callback && (callback.includes('/webhook') || callback.includes('/api/'))) {
    callback = null;
  }
  if (!callback && (order?.note === 'Trial_Setup_3Day' || order?.note === 'Autopay_Setup_3DayTrial' || order?.note?.startsWith('Subscription_'))) {
    callback = typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : '/dashboard';
  }
  const isTrialOrSub = order?.note === 'Trial_Setup_3Day' || order?.note === 'Autopay_Setup_3DayTrial' || order?.note?.startsWith('Subscription_');

  /* ═══════════════════════════════════════════════════════════
     VERIFIED (CHECK FOR 24-HOUR EXPIRATION)
  ═══════════════════════════════════════════════════════════ */
  if (order.status === 'verified') {
    const paidTime = new Date(order.verified_at || order.created_at).getTime();
    const isPostPaymentExpired = !isNaN(paidTime) && (Date.now() - paidTime) > (24 * 60 * 60 * 1000);

    if (isPostPaymentExpired) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 font-sans">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-8 text-center space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Link Not Found or Expired</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                This transaction link has expired and is no longer available.
              </p>
            </div>
            <button
              onClick={() => typeof window !== 'undefined' && window.history.length > 1 ? window.history.back() : (window.location.href = '/')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all cursor-pointer shadow-sm"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header badge={
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full inline-block bg-emerald-500" />
            Verified
          </span>
        } />
        <main className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm animate-scale-up">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
              <div className="h-1 w-full bg-emerald-500" />
              <div className="p-6 text-center space-y-3">
                <div className="flex justify-center -my-1">
                  <PaymentSuccessTick size="lg" sound={true} />
                </div>
                <div className="animate-cascade-2">
                  <h2 className="text-2xl font-black text-slate-900">
                    Payment Confirmed!
                  </h2>
                  <p className="text-sm font-semibold mt-1 text-emerald-600">
                    ₹{parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} received successfully
                  </p>
                </div>
              </div>
              <div className="mx-5 mb-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-1 animate-cascade-3">
                <Row label="Order ID" value={orderId} displayValue={formatRefId(orderId)} mono />
                <Row label="Amount" value={`₹${parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} green />
                <Row label="Method" value={order.method || (order?.utr?.length > 30 ? 'Crypto' : 'UPI')} />
                <Row label="Status" value="Verified" badge />
                <Row label="UTR / Ref No." value={order.utr || 'Auto-verified'} mono />
                <Row label="Placed On" value={fmt(order.created_at)} />
                <Row label="Confirmed At" value={fmt(order.verified_at)} />
                {order.note && <Row label="Details" value={order.note} />}
                {order.customer_name && <Row label="Customer" value={order.customer_name} />}
              </div>
              <div className="px-5 pb-6 space-y-2.5 animate-cascade-4">
                <button 
                  type="button"
                  onClick={handleDone} 
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                >
                  {redirecting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>{isTrialOrSub ? 'Returning to Dashboard...' : 'Returning to Store...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                      <span>{isTrialOrSub ? 'Done • Return to Dashboard' : callback ? 'Done • Return to Store' : 'Done • Payment Complete'}</span>
                    </>
                  )}
                </button>
                {redirecting && (
                  <p className="text-[11px] text-center text-slate-400 font-medium">
                    Returning to your store. If stuck, <button type="button" onClick={handleDone} className="text-blue-600 hover:underline font-bold cursor-pointer">click here</button>.
                  </p>
                )}
                {completedNotice && !redirecting && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60 text-center animate-fade-in">
                    <p className="text-xs text-emerald-800 font-bold">✓ Payment Complete</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      You can safely close this browser window or tab.
                    </p>
                  </div>
                )}
              </div>
          </div>
        </div>
      </main>
      <footer className="py-4 text-center">
        <p className="text-[10px] text-slate-400">© 2026 MyMobPay · Secure Payments</p>
      </footer>
    </div>
  );
  }

  /* ═══════════════════════════════════════════════════════════
     REJECTED
  ═══════════════════════════════════════════════════════════ */
  if (order.status === 'rejected') return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />Declined
        </span>
      } />
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm animate-scale-up">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="h-1 bg-red-500 w-full" />
            <div className="p-6 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                <XCircle className="w-7 h-7 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Payment Declined</h2>
                <p className="text-xs text-slate-500 mt-1">We could not verify this transaction.</p>
              </div>
            </div>
            <div className="mx-5 mb-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-1">
              <Row label="Order ID" value={orderId} displayValue={formatRefId(orderId)} mono />
              <Row label="Amount" value={`₹${parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`} />
            </div>
            <div className="px-5 pb-6">
              <p className="text-xs text-slate-500 text-center mb-3">
                If you were debited, contact support with your order reference.
              </p>
              {callback ? (
                <button onClick={() => {
                  try {
                    let resolvedUrl = callback.trim();
                    if (!/^https?:\/\//i.test(resolvedUrl) && !resolvedUrl.startsWith('/')) {
                      resolvedUrl = `https://${resolvedUrl}`;
                    }
                    const url = new URL(resolvedUrl, typeof window !== 'undefined' ? window.location.origin : 'https://mymob.tech');
                    url.searchParams.set('status', 'failed');
                    url.searchParams.set('gateway_id', orderId);
                    url.searchParams.set('orderId', orderId);
                    window.location.replace(url.toString());
                  } catch (e) {
                    window.location.replace(callback);
                  }
                }} className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm flex items-center justify-center gap-2 transition-all">
                  <ExternalLink className="w-4 h-4" /> Return to {order.project || 'App'}
                </button>
              ) : (
                <button onClick={() => typeof window !== 'undefined' && window.history.length > 1 ? window.history.back() : (window.close && window.close())}
                  className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer">
                  Return to App
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );

  /* ═══════════════════════════════════════════════════════════
     PENDING
  ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-slate-200">
        <div className="progress-bar bg-blue-600 h-full" />
      </div>

      <Header badge={
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />Under Review
        </span>
      } />

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-sm animate-scale-up">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="h-1 bg-blue-600 w-full" />

            {/* Header */}
            <div className="p-6 text-center space-y-3 border-b border-slate-100">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-blue-500/30 bg-blue-500/10 flex items-center justify-center mx-auto animate-pulse-ring">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Verifying Payment</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Your payment is being processed. You can{' '}
                  <strong className="text-blue-600">safely close</strong> this page.
                </p>
              </div>
            </div>

            {/* Order summary */}
            <div className="mx-5 mt-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-1">
              <div className="flex justify-center items-baseline gap-0.5 py-2.5 border-b border-slate-200 mb-1">
                <span className="text-2xl font-black text-slate-400">₹</span>
                <span className="text-3xl font-black text-slate-900 tabular-nums">
                  {parseFloat(order.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Row label="Order ID" value={orderId} displayValue={formatRefId(orderId)} mono />
              <Row label="Method" value={order.method || 'UPI'} />
              {order.project && <Row label="Project" value={order.project} />}
            </div>

            {/* UTR input */}
            <div className="px-5 py-4 border-t border-slate-100 mt-3">
              {isUtrSubmitted ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-center space-y-1">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold">
                    <CheckCircle className="w-3.5 h-3.5" /> UTR Submitted
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Ref: <strong className="font-mono text-slate-700">{order.utr}</strong>
                  </p>
                </div>
              ) : (
                <form onSubmit={handleUtrSubmit} className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Speed Up Verification
                    </label>
                    <p className="text-[9px] text-slate-400 leading-relaxed">
                      Enter the 12-digit UTR / IMPS Ref from your bank&apos;s confirmation.
                    </p>
                  </div>
                  {utrError && (
                    <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-400">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" /> {utrError}
                    </div>
                  )}
                  {utrSuccess && (
                    <div className="flex items-center gap-1.5 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/60 text-[10px] text-emerald-700 font-semibold">
                      <CheckCircle className="w-3 h-3 flex-shrink-0" /> {utrSuccess}
                    </div>
                  )}
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={12}
                      placeholder="Enter 12-digit UTR"
                      value={utrInput}
                      onChange={e => { setUtrInput(e.target.value.replace(/\D/g, '')); setUtrError(''); }}
                      className="w-full bg-white border border-slate-300 rounded-xl text-xs font-mono tracking-wider text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 py-2.5 pl-9 pr-3 transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingUtr || utrInput.length !== 12}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white-pure font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submittingUtr
                      ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Submitting...</>
                      : <><span>Submit UTR</span><ArrowRight className="w-3.5 h-3.5" /></>}
                  </button>
                </form>
              )}
            </div>

            {/* Live indicator */}
            <div className="px-5 pb-5 pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-500">
              <RefreshCw className="w-3 h-3 animate-spin text-blue-500" style={{ animationDuration: '3s' }} />
              Checking payment status in real-time...
            </div>
          </div>
        </div>
      </main>
      <footer className="py-4 text-center">
        <p className="text-[10px] text-slate-400">© 2026 MyMobPay · Secure Payments</p>
      </footer>
    </div>
  );
}
