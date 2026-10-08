'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'react-qr-code';
import { CONFIG } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import DesktopCheckoutView from '@/components/DesktopCheckoutView';

/* ── Original MyMobPay Website Logo (Dual-color Blue/Orange M mark + MyMobPay) ── */
const MyMobPayLogo = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, lineHeight: 1, userSelect: 'none' }}>
    <svg width="28" height="25" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      {/* Left Blue Stroke */}
      <path
        d="M 7 28.5 V 13.5 C 7 7.5 12 5.5 16 8.5 L 19 19"
        stroke="#0284C7"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right Orange Stroke */}
      <path
        d="M 19 19 L 22 8.5 C 26 5.5 31 7.5 31 13.5 V 28.5"
        stroke="#FF7800"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    <span style={{
      fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontWeight: 800,
      fontSize: 24,
      color: 'var(--head)',
      letterSpacing: '-0.02em',
    }}>MyMobPay</span>
  </div>
);

/* ── Robust UPI VPA Resolver (Safeguard against 'pending@upi' or empty VPA) ── */
function getValidUpiId(merchant) {
  const vpa = merchant?.upi_id?.trim();
  if (vpa && vpa !== 'pending@upi' && vpa.includes('@') && !vpa.startsWith('pending@')) {
    return vpa;
  }
  return CONFIG.upiId || '9410181307@okbizaxis';
}

/* ── UPI deep-link builder ──────────────────────────────────── */
function buildUpiLink(appId, amount, orderId, merchant, isMandate) {
  const pa    = getValidUpiId(merchant);
  const rawPn = merchant?.business_name && merchant.business_name !== 'Demo Store'
    ? merchant.business_name
    : (CONFIG.businessName && CONFIG.businessName !== 'Demo Store' ? CONFIG.businessName : 'MyMobPay');
  const pn    = encodeURIComponent(rawPn);
  const upath = isMandate ? 'mandate' : 'pay';
  let qs = `pa=${pa}&pn=${pn}&am=${amount}&cu=INR&tn=${orderId}`;
  if (isMandate) {
    const d = new Date(); d.setDate(d.getDate() + 3);
    const ds = String(d.getDate()).padStart(2,'0') + String(d.getMonth()+1).padStart(2,'0') + d.getFullYear();
    qs += `&validitystart=${ds}&recur=MONTHLY&amrule=EXACT&share=Y`;
  }
  const amap = { gpay:'com.google.android.apps.nbu.paisa.user', phonepe:'com.phonepe.app', paytm:'net.one97.paytm', bhim:'in.org.npci.upiapp' };
  const imap = { gpay:`gpay://upi/${upath}?${qs}`, phonepe:`phonepe://${upath}?${qs}`, paytm:`paytmmp://upi/${upath}?${qs}`, bhim:`upi://${upath}?${qs}` };
  if (typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)) {
    const pkg = amap[appId];
    return pkg ? `intent://upi/${upath}?${qs}#Intent;scheme=upi;package=${pkg};end;` : `intent://upi/${upath}?${qs}#Intent;scheme=upi;end;`;
  }
  return imap[appId] || `upi://${upath}?${qs}`;
}

/* ── UPI QR string — always upi:// (NOT device deep-link) ─── */
function buildUpiQrValue(amount, orderId, merchant, isMandate) {
  const pa    = getValidUpiId(merchant);
  const rawPn = merchant?.business_name && merchant.business_name !== 'Demo Store'
    ? merchant.business_name
    : (CONFIG.businessName && CONFIG.businessName !== 'Demo Store' ? CONFIG.businessName : 'MyMobPay');
  const pn    = encodeURIComponent(rawPn);
  const upath = isMandate ? 'mandate' : 'pay';
  let qs = `pa=${pa}&pn=${pn}&am=${amount}&cu=INR&tn=${orderId}`;
  if (isMandate) {
    const d = new Date(); d.setDate(d.getDate() + 3);
    const ds = String(d.getDate()).padStart(2,'0') + String(d.getMonth()+1).padStart(2,'0') + d.getFullYear();
    qs += `&validitystart=${ds}&recur=MONTHLY&amrule=EXACT&share=Y`;
  }
  return `upi://${upath}?${qs}`;
}

const UPI_CHIPS = [
  { id: 'phonepe', label: 'PhonePe',    logo: '/logos/phonepe.svg', color: '#5f259f', h: 18 },
  { id: 'gpay',    label: 'Google Pay', logo: '/logos/gpay.svg',    color: '#1a73e8', h: 17 },
  { id: 'paytm',   label: 'Paytm',      logo: '/logos/paytm.svg',   color: '#00b9f1', h: 13 },
  { id: 'bhim',    label: 'BHIM',       logo: '/logos/bhim.svg',    color: '#0b5cab', h: 14 },
];

/* ──────────────────────────────────────────────────────────────
   Main checkout component:
   - Desktop (>= 768px): Exact Receipt design v2 (ticket-punch receipt + accordions + original logo)
   - Mobile (< 768px): Mobile checkout (circular timer ring + bottom fixed bar + mobile card)
────────────────────────────────────────────────────────────── */
function PayPageContent() {
  const searchParams  = useSearchParams();
  const router        = useRouter();

  const paramApiKey   = searchParams.get('api_key') || searchParams.get('key') || '';
  const paramAmount   = searchParams.get('amount')   || '';
  const paramProject  = searchParams.get('project')  || searchParams.get('merchant') || searchParams.get('biz') || searchParams.get('business_name') || searchParams.get('store') || '';
  const paramCallback = searchParams.get('callback') || searchParams.get('callback_url') || searchParams.get('redirect_url') || searchParams.get('return_url') || searchParams.get('redirect') || '';
  const paramName     = searchParams.get('name')     || '';
  const paramPhone    = searchParams.get('phone')    || '';
  const paramRef      = searchParams.get('ref')      || '';
  const paramNote     = searchParams.get('note')     || '';
  const paramLid      = searchParams.get('lid')      || '';
  const paramOrderId  = searchParams.get('order_id') || searchParams.get('id') || '';
  const cleanParamOrderId = (paramOrderId || '').trim().replace(/^[-#]+/, '');
  const paramMethod   = searchParams.get('method')   || searchParams.get('payment_method') || '';
  const cleanParamMethod = ['upi', 'card', 'bank', 'crypto', 'cod'].includes((paramMethod || '').toLowerCase()) ? (paramMethod || '').toLowerCase() : null;

  /* Core state */
  const [merchant,     setMerchant]     = useState(null);
  const [orderId,      setOrderId]      = useState(cleanParamOrderId || null);
  const [orderAmount,  setOrderAmount]  = useState(paramAmount ? parseFloat(paramAmount) : null);
  const [orderMode,    setOrderMode]    = useState('live');
  const [orderNote,    setOrderNote]    = useState(paramNote);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [confirmed,    setConfirmed]    = useState(false);

  /* Entry form state (when visiting without pre-set amount) */
  const [amount,       setAmount]       = useState(paramAmount);
  const [custName,     setCustName]     = useState(paramName);
  const [custPhone,    setCustPhone]    = useState(paramPhone);

  /* Desktop method selection: null (choose first) | 'upi' | 'card' | 'bank' | 'crypto' | 'cod' */
  const [activeOpt,    setActiveOpt]    = useState(cleanParamMethod);

  /* Mobile method selection: null (choose first) | 'upi' | 'card' | 'bank' | 'crypto' | 'cod' */
  const [selectedMethod, setSelectedMethod] = useState(cleanParamMethod);

  /* Mobile accordion selection */
  const [activeAcc,    setActiveAcc]    = useState('');

  /* Card payment state */
  const [cardBrand,    setCardBrand]    = useState('visa');
  const [cardNumber,   setCardNumber]   = useState('');
  const [cardExpiry,   setCardExpiry]   = useState('');
  const [cardCvv,      setCardCvv]      = useState('');
  const [cardHolder,   setCardHolder]   = useState(paramName || '');
  const [cardOtp,      setCardOtp]      = useState('');
  const [cardBusy,     setCardBusy]     = useState(false);
  const [cardMsg,      setCardMsg]      = useState('');

  /* COD state */
  const [codName,      setCodName]      = useState(paramName || '');
  const [codPhone,     setCodPhone]     = useState(paramPhone || '');
  const [codAddress,   setCodAddress]   = useState('');
  const [codPincode,   setCodPincode]   = useState('');
  const [codCity,      setCodCity]      = useState('');
  const [codBusy,      setCodBusy]      = useState(false);
  const [codMsg,       setCodMsg]       = useState('');

  /* View navigation: 'vChecking' | 'vPaidExpired' | 'vPay' | 'vOk' | 'vExp' */
  const [curView,      setCurView]      = useState(cleanParamOrderId ? 'vChecking' : 'vPay');
  const [paidOrderData, setPaidOrderData] = useState(null);
  const [checkMsg,     setCheckMsg]     = useState('');
  const [isChecking,   setIsChecking]   = useState(false);

  /* Session Countdown Timer — persisted via sessionStorage once a payment method is chosen */
  const SESSION_SECS = 327;
  const TIMER_KEY = `mmp_timer_${cleanParamOrderId || 'sess'}`;
  const [timeLeft, setTimeLeft] = useState(() => {
    if (typeof window === 'undefined') return SESSION_SECS;
    try {
      const stored = sessionStorage.getItem(TIMER_KEY);
      if (stored) {
        const { startedAt } = JSON.parse(stored);
        const elapsed = Math.floor((Date.now() - startedAt) / 1000);
        const remaining = SESSION_SECS - elapsed;
        if (remaining > 0) return remaining;
      }
    } catch {}
    return SESSION_SECS;
  });

  /* Copy feedback state */
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [copyUsdtDone, setCopyUsdtDone] = useState(false);
  const [copiedAcc,    setCopiedAcc]    = useState(false);
  const [copiedIfsc,   setCopiedIfsc]   = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  /* Mobile UPI assistance states (delay + check counts) */
  const [mobUpiDelayed,    setMobUpiDelayed]    = useState(false);
  const [mobUpiCheckCount, setMobUpiCheckCount] = useState(0);

  /* UTR state */
  const [showUtr,      setShowUtr]      = useState(false);
  const [utr,          setUtr]          = useState('');
  const [utrBusy,      setUtrBusy]      = useState(false);
  const [utrMsg,       setUtrMsg]       = useState('');

  /* Promo code state */
  const [showPromo,    setShowPromo]    = useState(false);
  const [promoCode,    setPromoCode]    = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg,     setPromoMsg]     = useState('');

  /* Crypto USDT state */
  const [txHash,       setTxHash]       = useState('');
  const [txBusy,       setTxBusy]       = useState(false);
  const [txMsg,        setTxMsg]        = useState('');

  /* Dynamic order timestamp */
  const [orderDate,    setOrderDate]    = useState('');
  const [okTime,       setOkTime]       = useState('');

  const autoCreated = useRef(false);
  const [tempId, setTempId] = useState('A7F2-9C41');

  useEffect(() => {
    setTempId(Math.random().toString(36).substring(2, 6).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase());
    try {
      const d = new Intl.DateTimeFormat('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(new Date());
      setOrderDate(d);
    } catch {
      setOrderDate('24 Sep 2026, 3:59 PM');
    }
  }, []);

  /* Derived values */
  const isMandate     = orderNote === 'Trial_Setup_3Day' || orderNote === 'Autopay_Setup_3DayTrial';
  const displayAmt    = orderAmount ?? (amount ? parseFloat(amount) : null);
  const activeId      = (orderId || cleanParamOrderId || tempId).replace(/^[-#]+/, '');
  const isPlatformKey = (paramApiKey || '').replace(/^(test_|live_)/, '') === CONFIG.platformApiKey;
  const isSetupOrSubscription = isMandate || (orderNote && (orderNote.includes('Trial_Setup') || orderNote.includes('Autopay') || orderNote.includes('Subscription')));

  const upiId         = getValidUpiId(merchant);
  const rawBizName    = (merchant?.business_name && merchant.business_name !== 'Demo Store')
    ? merchant.business_name
    : (paramProject || (isPlatformKey || isSetupOrSubscription ? 'MyMobPay' : (CONFIG.businessName && CONFIG.businessName !== 'Demo Store' ? CONFIG.businessName : 'Merchant')));
  const bizName       = rawBizName === 'Demo Store' ? (isPlatformKey || isSetupOrSubscription ? 'MyMobPay' : 'Merchant') : rawBizName;
  const bizInitial    = (bizName || 'M').charAt(0).toUpperCase();
  const bankAcc       = merchant?.bank_account_number || CONFIG.bankAccountNumber || '919410181307';
  const bankIfsc      = merchant?.bank_ifsc || CONFIG.bankIfsc || 'PYTM0123456';
  const bankName      = merchant?.bank_account_name || bizName;
  const bankBranch    = merchant?.bank_name || '';
  const cryptoWallet  = merchant?.crypto_wallet_address || CONFIG.defaultCryptoWallet;
  const cryptoNetwork = merchant?.crypto_network || CONFIG.defaultCryptoNetwork;
  const usdtAmt       = displayAmt ? (displayAmt / (CONFIG.usdtInrRate || 90)).toFixed(4) : '0.0000';
  const upiQrValue    = displayAmt ? buildUpiQrValue(displayAmt, activeId, merchant, isMandate) : '';

  /* Format currency matching template: ₹2,499.00 */
  const fmtInr = (n) => {
    if (n == null) return '—';
    const parts = parseFloat(n).toFixed(2).split('.');
    return '\u20b9' + parseInt(parts[0]).toLocaleString('en-IN') + '.' + parts[1];
  };

  const amtWhole = displayAmt ? Math.floor(displayAmt).toLocaleString('en-IN') : '0';
  const amtFrac  = displayAmt ? ('.' + parseFloat(displayAmt).toFixed(2).split('.')[1]) : '.00';

  /* ── Load merchant branding ── */
  useEffect(() => {
    const key = (paramApiKey || CONFIG.platformApiKey || '').replace(/^(test_|live_)/, '');
    if (!key) return;

    fetch(`/api/merchant?key=${encodeURIComponent(key)}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.business_name) {
          if (data.business_name === 'Demo Store') {
            data.business_name = (key === CONFIG.platformApiKey) ? 'MyMobPay' : 'Merchant';
          }
          setMerchant(prev => ({ ...prev, ...data }));
        } else {
          supabase.from('merchants')
            .select('id, business_name, upi_id, theme_color, sandbox_mode, bank_account_number, bank_ifsc, bank_account_name, bank_name, enable_bank_transfer, crypto_wallet_address, crypto_network')
            .eq('api_key', key).single()
            .then(({ data: sbData }) => {
              if (sbData) {
                if (sbData.business_name === 'Demo Store') {
                  sbData.business_name = (key === CONFIG.platformApiKey) ? 'MyMobPay' : 'Merchant';
                }
                setMerchant(sbData);
              }
            });
        }
      })
      .catch(() => {
        supabase.from('merchants')
          .select('id, business_name, upi_id, theme_color, sandbox_mode, bank_account_number, bank_ifsc, bank_account_name, bank_name, enable_bank_transfer, crypto_wallet_address, crypto_network')
          .eq('api_key', key).single()
          .then(({ data: sbData }) => {
            if (sbData) {
              if (sbData.business_name === 'Demo Store') {
                sbData.business_name = (key === CONFIG.platformApiKey) ? 'MyMobPay' : 'Merchant';
              }
              setMerchant(sbData);
            }
          });
      });
  }, [paramApiKey]);

  /* ── Return / Navigation Handler (Direct to final status screen or merchant callback) ── */
  const handleReturn = (explicitId, explicitCallback) => {
    const targetId = explicitId || orderId || activeId;
    const cleanId = (targetId || '').trim().replace(/^[-#]+/, '');
    let cb = explicitCallback || (typeof window !== 'undefined' ? (localStorage.getItem(`callback_${cleanId}`) || localStorage.getItem(`callback_${targetId}`) || paramCallback) : '');

    // Persist callback URL for the status receipt screen so the Done button can return the user
    if (cb && cleanId && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`callback_${cleanId}`, cb);
      } catch {}
    }

    // If order is paid/confirmed, ALWAYS navigate to the payment success details screen
    if (confirmed || curView === 'vOk' || explicitId) {
      if (cleanId) {
        router.replace(`/status/${cleanId}`);
        return;
      }
    }

    // If user clicked close/cancel before paying:
    if (cb) {
      let resolved = cb.trim();
      if (!/^https?:\/\//i.test(resolved) && !resolved.startsWith('/')) {
        resolved = `https://${resolved}`;
      }
      try {
        const url = new URL(resolved, window.location.origin);
        url.searchParams.set('status', 'cancelled');
        window.location.href = url.toString();
        return;
      } catch {
        window.location.href = cb;
        return;
      }
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return;
    }

    if (cleanId) {
      router.replace(`/status/${cleanId}`);
    } else {
      router.replace('/');
    }
  };

  /* ── Success Handler (Directly transitions to Screen 2 status page) ── */
  function handleSuccess(verifiedId, verifiedCallback) {
    setConfirmed(true);
    setOkTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
    const targetId = verifiedId || orderId || activeId;
    const cleanId = (targetId || '').trim().replace(/^[-#]+/, '');
    const cb = verifiedCallback || (typeof window !== 'undefined' ? (localStorage.getItem(`callback_${cleanId}`) || localStorage.getItem(`callback_${targetId}`) || paramCallback) : '');
    if (cb && cleanId && typeof window !== 'undefined') {
      try { localStorage.setItem(`callback_${cleanId}`, cb); } catch {}
    }
    try { navigator.vibrate?.(40); } catch {}
    if (cleanId) {
      router.replace(`/status/${cleanId}`);
    } else {
      handleReturn(cleanId, verifiedCallback);
    }
  }

  /* ── Auto-create / Hydrate order ── */
  useEffect(() => {
    if (autoCreated.current) return;

    if (cleanParamOrderId) {
      autoCreated.current = true;
      setOrderId(cleanParamOrderId);
      if (paramAmount) setOrderAmount(parseFloat(paramAmount));
      if (paramCallback) localStorage.setItem(`callback_${cleanParamOrderId}`, paramCallback);
      return;
    }

    if (paramAmount && parseFloat(paramAmount) > 0) {
      autoCreated.current = true;
      createOrder(
        parseFloat(paramAmount),
        paramName,
        paramPhone,
        paramRef,
        paramNote,
        paramCallback,
        paramProject,
        paramLid
      );
    }
  }, [cleanParamOrderId, paramAmount]);

  /* ── Immediate Status Check for Existing Order (Prevent showing checkout for already-paid links) ── */
  useEffect(() => {
    if (!cleanParamOrderId) return;

    let isMounted = true;
    fetch(`/api/orders?id=${encodeURIComponent(cleanParamOrderId)}&_t=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (!isMounted) return;
        if (data) {
          if (data.status === 'verified' || data.status === 'completed' || data.status === 'paid') {
            if (data.isPostPaymentExpired) {
              setPaidOrderData(data);
              setCurView('vPaidExpired');
              return;
            }
            // Already paid! Immediately go to the status screen (Screen 2)
            handleReturn(data.orderId || cleanParamOrderId, data.callback_url);
            return;
          }
          if (data.status === 'expired') {
            setCurView('vExp');
            return;
          }
          if (data.amount != null) setOrderAmount(parseFloat(data.amount));
          if (data.note) setOrderNote(data.note);
          if (data.mode) setOrderMode(data.mode);
          if (data.merchant) setMerchant(prev => ({ ...prev, ...data.merchant }));
        }
        setCurView('vPay');
      })
      .catch(() => {
        if (isMounted) setCurView('vPay');
      });

    return () => { isMounted = false; };
  }, [cleanParamOrderId]);

  /* ── Real-time order verification polling + Supabase Realtime (Instant push & zero cache) ── */
  useEffect(() => {
    const activeTarget = orderId || cleanParamOrderId;
    if (!activeTarget || confirmed) return;

    let isMounted = true;

    const checkOrderStatus = async () => {
      try {
        const res = await fetch(`/api/orders?id=${encodeURIComponent(activeTarget)}&_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data && (data.status === 'verified' || data.status === 'completed' || data.status === 'paid')) {
          handleSuccess(data.orderId || activeTarget, data.callback_url);
        }
      } catch {}
    };

    // Fast polling: check every 1000ms for minimum verification latency
    const interval = setInterval(checkOrderStatus, 1000);

    // Instant wake-up check when returning to mobile browser from UPI app or Gmail
    const onVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        checkOrderStatus();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    // Supabase Realtime channel subscription for instant WebSocket push notification
    let channel = null;
    try {
      channel = supabase
        .channel(`order-status-${activeTarget}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${activeTarget}` },
          (payload) => {
            const newRow = payload?.new;
            if (isMounted && newRow && (newRow.status === 'verified' || newRow.status === 'completed' || newRow.status === 'paid')) {
              handleSuccess(newRow.id || activeTarget, newRow.callback_url);
            }
          }
        )
        .subscribe();
    } catch {}

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [orderId, cleanParamOrderId, confirmed]);

  /* ── Countdown timer — timestamp-based so refresh doesn't reset it ── */
  useEffect(() => {
    if (curView === 'vOk') return;
    // Do not start or run countdown timer until a payment method is selected
    if (!selectedMethod && !activeOpt) return;

    // Ensure sessionStorage has a start timestamp (handles hydration edge case)
    try {
      const stored = sessionStorage.getItem(TIMER_KEY);
      if (!stored) {
        sessionStorage.setItem(TIMER_KEY, JSON.stringify({ startedAt: Date.now() - (SESSION_SECS - timeLeft) * 1000 }));
      }
    } catch {}

    const tick = () => {
      try {
        const stored = sessionStorage.getItem(TIMER_KEY);
        if (stored) {
          const { startedAt } = JSON.parse(stored);
          const elapsed = Math.floor((Date.now() - startedAt) / 1000);
          const remaining = Math.max(SESSION_SECS - elapsed, 0);
          setTimeLeft(remaining);
          if (remaining <= 0) {
            clearInterval(interval);
            setCurView('vExp');
          }
          return;
        }
      } catch {}
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); setCurView('vExp'); return 0; }
        return prev - 1;
      });
    };

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [curView, selectedMethod, activeOpt]);

  // Mark Mobile UPI as delayed if on UPI screen for >45s without completing
  useEffect(() => {
    if (selectedMethod !== 'upi') return;
    const t = setTimeout(() => {
      setMobUpiDelayed(true);
    }, 45000);
    return () => clearTimeout(t);
  }, [selectedMethod]);

  /* ── Check Status CTA Handler ── */
  async function triggerChecking() {
    if (isChecking) return;
    setMobUpiCheckCount(prev => prev + 1);
    setIsChecking(true);
    setCheckMsg('Checking transaction status…');

    const targetId = orderId || activeId;
    if (!targetId) {
      setIsChecking(false);
      setCheckMsg('Payment session initializing. Please wait a moment.');
      return;
    }

    try {
      const res = await fetch('/api/orders/check-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: targetId })
      });

      const data = await res.json();
      if (res.ok && data?.verified) {
        setCheckMsg('✓ Payment verified! Redirecting…');
        handleSuccess();
        return;
      }

      setCheckMsg(data?.message || 'Payment pending bank confirmation. If already paid via UPI, enter your 12-digit UTR below.');
      setShowUtr(true);
    } catch (err) {
      console.error('Status check error:', err);
      try {
        const fallbackRes = await fetch(`/api/orders?id=${targetId}&_t=${Date.now()}`, { cache: 'no-store' });
        const fallbackData = await fallbackRes.json();
        if (fallbackData?.status === 'verified') {
          setCheckMsg('✓ Payment verified! Redirecting…');
          handleSuccess();
          return;
        }
      } catch {}
      setCheckMsg('Payment pending bank confirmation. If already paid via UPI, enter your 12-digit UTR below.');
      setShowUtr(true);
    } finally {
      setIsChecking(false);
    }
  }

  /* ── Order creation API call ── */
  async function createOrder(amt, name, phone, ref, note, callback, project, lid) {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: paramApiKey || CONFIG.platformApiKey,
          amount: amt,
          customer_name: name,
          customer_phone: phone,
          external_ref: ref,
          note,
          callback_url: callback,
          project,
          lid,
          is_mandate: note === 'Trial_Setup_3Day' || note === 'Autopay_Setup_3DayTrial'
        })
      });
      const data = await res.json();
      if (res.ok && data) {
        const id = data.order_id || data.orderId;
        const am = data.amount ?? data.orderAmount;
        if (id) {
          setOrderId(id);
          try {
            if (typeof window !== 'undefined' && window.history?.replaceState) {
              const u = new URL(window.location.href);
              u.searchParams.set('order_id', id);
              window.history.replaceState(null, '', u.toString());
            }
          } catch {}
        }
        if (am != null) setOrderAmount(am);
        setOrderMode(data.mode || 'live');
        if (data.note) setOrderNote(data.note);
        if (callback && id) localStorage.setItem(`callback_${id}`, callback);
      } else {
        setOrderAmount(amt);
      }
    } catch {
      setOrderAmount(amt);
    } finally {
      setLoading(false);
    }
  }

  /* Copy UPI ID */
  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(upiId);
    try { navigator.vibrate?.(25); } catch {}
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1600);
  };

  /* Copy Bank Details */
  const handleCopyAcc = () => {
    navigator.clipboard?.writeText(bankAcc);
    try { navigator.vibrate?.(15); } catch {}
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 1500);
  };

  const handleCopyIfsc = () => {
    navigator.clipboard?.writeText(bankIfsc);
    try { navigator.vibrate?.(15); } catch {}
    setCopiedIfsc(true);
    setTimeout(() => setCopiedIfsc(false), 1500);
  };

  /* Copy USDT */
  const handleCopyUsdt = () => {
    navigator.clipboard?.writeText(cryptoWallet);
    try { navigator.vibrate?.(25); } catch {}
    setCopyUsdtDone(true);
    setTimeout(() => setCopyUsdtDone(false), 1600);
  };

  /* Copy Order Reference */
  const handleCopyOrderId = () => {
    if (!activeId) return;
    navigator.clipboard?.writeText(activeId);
    try { navigator.vibrate?.(15); } catch {}
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 1500);
  };

  /* Submit UTR */
  const submitUtr = async (e) => {
    if (e) e.preventDefault();
    if (!utr.trim()) return;
    setUtrBusy(true); setUtrMsg('');
    try {
      const r = await fetch('/api/orders/verify-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: activeId, utr: utr.trim() })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      if (d.verified) {
        setUtrMsg('✓ Payment verified! Redirecting…');
        handleSuccess();
      } else {
        setUtrMsg(d.message || 'UTR recorded. Checking in background…');
      }
    } catch (err) {
      setUtrMsg(err.message);
    } finally {
      setUtrBusy(false);
    }
  };

  /* Submit Promo */
  const submitPromo = async (e) => {
    if (e) e.preventDefault();
    if (!promoCode.trim()) return;
    setPromoLoading(true); setPromoMsg('');
    try {
      const r = await fetch('/api/coupons/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: activeId, code: promoCode.trim().toUpperCase() })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Invalid code');
      setPromoApplied(d.coupon);
      setOrderAmount(d.new_amount);
      setPromoMsg(`✓ Saved ₹${d.discount}!`);
    } catch (err) {
      setPromoMsg(err.message);
    } finally {
      setPromoLoading(false);
    }
  };

  /* Submit Crypto */
  const submitTx = async (e) => {
    if (e) e.preventDefault();
    if (!txHash.trim()) return;
    setTxBusy(true); setTxMsg('');
    try {
      const r = await fetch('/api/orders/verify-crypto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: activeId, tx_hash: txHash.trim() })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      setTxMsg('✓ Transaction submitted! Redirecting…');
      handleSuccess();
    } catch (err) {
      setTxMsg(err.message);
    } finally {
      setTxBusy(false);
    }
  };

  /* Submit Card Payment */
  const submitCardPayment = async (e) => {
    if (e) e.preventDefault();
    if (orderMode !== 'test') {
      setCardMsg('Direct card gateway is reserved for test mode. For live payments, please switch to UPI or Net Banking.');
      return;
    }
    const cleanNum = cardNumber.replace(/\s+/g, '');
    if (cleanNum.length < 15) {
      setCardMsg('Please enter a valid 16-digit card number.');
      return;
    }
    setCardBusy(true);
    setCardMsg('');
    try {
      const res = await fetch('/api/orders/process-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: activeId,
          card_brand: cardBrand,
          card_last4: cleanNum.slice(-4),
          cardholder_name: cardHolder.trim() || 'Valued Customer',
          otp: cardOtp.trim() || '123456'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Card processing failed');
      setCardMsg('✓ Card payment verified! Redirecting…');
      handleSuccess();
    } catch (err) {
      setCardMsg(err.message);
    } finally {
      setCardBusy(false);
    }
  };

  /* Submit COD Order */
  const submitCodOrder = async (e) => {
    if (e) e.preventDefault();
    if (!codName.trim() || !codPhone.trim() || !codAddress.trim() || !codPincode.trim()) {
      setCodMsg('Please fill in Name, Phone, Address, and Pincode.');
      return;
    }
    setCodBusy(true);
    setCodMsg('');
    try {
      const res = await fetch('/api/orders/confirm-cod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: activeId,
          customer_name: codName.trim(),
          customer_phone: codPhone.trim(),
          delivery_address: codAddress.trim(),
          pincode: codPincode.trim(),
          city: codCity.trim() || 'N/A'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to confirm COD');
      setCodMsg('✓ Cash on Delivery order confirmed! Redirecting…');
      handleSuccess();
    } catch (err) {
      setCodMsg(err.message);
    } finally {
      setCodBusy(false);
    }
  };

  /* ───────────────────────────────────────────────────────────
     CHECKING SESSION VIEW (Fast loader while verifying if already paid)
  ─────────────────────────────────────────────────────────── */
  if (curView === 'vChecking') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f4f6fa', fontFamily: "'Outfit', -apple-system, sans-serif", padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 24, padding: '36px 28px', maxWidth: 400, width: '100%', textAlign: 'center', boxShadow: '0 10px 30px -4px rgba(16, 24, 40, 0.08)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <MyMobPayLogo />
          </div>
          <div style={{ position: 'relative', width: 48, height: 48, margin: '0 auto 16px' }}>
            <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: 'spin 0.8s linear infinite' }}>
              <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="4" fill="none" />
              <circle cx="24" cy="24" r="20" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" fill="none" strokeDasharray="32 94" />
            </svg>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>Verifying payment session…</h3>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Checking order status and security credentials</p>
        </div>
      </div>
    );
  }

  /* ───────────────────────────────────────────────────────────
     PAID EXPIRED VIEW (Link expired 24h after settlement)
  ─────────────────────────────────────────────────────────── */
  if (curView === 'vPaidExpired') {
    const paidAmt = paidOrderData?.amount ? parseFloat(paidOrderData.amount).toFixed(2) : displayAmt;
    const paidDt = paidOrderData?.verified_at || paidOrderData?.created_at;
    const formattedPaidTime = paidDt
      ? new Date(paidDt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
      : 'Within 24 hours';
    const activeOrderId = paidOrderData?.orderId || cleanParamOrderId;

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b1329', fontFamily: "'Outfit', -apple-system, sans-serif", padding: '24px 16px' }}>
        <div style={{ background: '#ffffff', borderRadius: 28, padding: '36px 28px', maxWidth: 440, width: '100%', textAlign: 'center', boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.35)', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <MyMobPayLogo />
          </div>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#d97706' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: '#fef3c7', color: '#b45309', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }} />
            Link Expired
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Payment Link Expired</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px', lineHeight: 1.5 }}>
            This payment link expired 24 hours after completion. The payment was already settled.
          </p>

          <div style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: '16px 18px', textAlign: 'left', marginBottom: 24, fontSize: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 10, borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Order ID</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>{activeOrderId}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Amount Settled</span>
              <span style={{ fontWeight: 800, color: '#059669', fontSize: 13 }}>₹{paidAmt}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed #e2e8f0' }}>
              <span style={{ color: '#64748b', fontWeight: 600 }}>Settled On</span>
              <span style={{ color: '#334155', fontWeight: 600 }}>{formattedPaidTime}</span>
            </div>
            {paidOrderData?.utr && (
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10 }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>UTR / Bank Ref</span>
                <span style={{ fontFamily: 'monospace', color: '#0f172a', fontWeight: 700 }}>{paidOrderData.utr}</span>
              </div>
            )}
          </div>

          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 20px', lineHeight: 1.4 }}>
            🔒 For security and compliance, completed payment sessions cannot be reopened or re-paid after 24 hours.
          </p>

          <button
            type="button"
            onClick={() => {
              const cb = paidOrderData?.callback_url || paramCallback;
              if (cb) {
                window.location.href = cb;
                return;
              }
              if (typeof window !== 'undefined' && window.history.length > 1) {
                window.history.back();
                return;
              }
              if (typeof window !== 'undefined') window.close();
            }}
            style={{
              width: '100%',
              padding: '13px 20px',
              borderRadius: 14,
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {paidOrderData?.callback_url ? 'Return to Merchant' : 'Done'}
          </button>
        </div>
      </div>
    );
  }

  /* ───────────────────────────────────────────────────────────
     ENTRY FORM (when loaded with no amount / order ID)
  ─────────────────────────────────────────────────────────── */
  if (!orderId && !displayAmt) {
    return (
      <div className="shell" style={{ maxWidth: 580, margin: '40px auto' }}>
        <header>
          <div className="logo">
            <Link href="/" style={{ textDecoration: 'none' }}>
              <MyMobPayLogo />
            </Link>
          </div>
          <div className="secure">
            <i></i><span>Secure checkout, powered by MyMobPay</span>
          </div>
        </header>

        <div className="rc" style={{ filter: 'none', WebkitMask: 'none', mask: 'none', borderRadius: 20, border: '1px solid var(--line)' }}>
          <h1 style={{ font: '800 22px/1.2 "DM Sans",sans-serif', color: 'var(--head)', margin: '0 0 6px' }}>Enter payment amount</h1>
          <p style={{ font: '500 14px "DM Sans",sans-serif', color: 'var(--mut)', margin: '0 0 20px' }}>Generate a direct UPI checkout session.</p>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (!amount || parseFloat(amount) <= 0) {
              setError('Please enter a valid amount.');
              return;
            }
            createOrder(parseFloat(amount), custName, custPhone, paramRef, paramNote, paramCallback, paramProject, paramLid);
          }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontFamily: '"DM Sans",sans-serif' }}>Amount (INR)</label>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', font: '600 20px "IBM Plex Mono",monospace', color: 'var(--mut)' }}>₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                autoFocus
                value={amount}
                placeholder="999"
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                style={{ width: '100%', minHeight: 52, border: '1px solid var(--line)', borderRadius: 12, padding: '0 14px 0 36px', font: '700 22px "IBM Plex Mono",monospace', color: 'var(--ink)', background: 'var(--soft)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
              {[500, 1000, 2000, 5000].map(q => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  style={{ padding: '8px 0', font: '700 13px "DM Sans",sans-serif', border: '1px solid var(--line)', borderRadius: 10, background: '#fff', color: 'var(--mut)', cursor: 'pointer' }}
                >
                  ₹{q}
                </button>
              ))}
            </div>

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontFamily: '"DM Sans",sans-serif' }}>Your name <span style={{ fontWeight: 400, color: '#98a2b3' }}>(optional)</span></label>
            <input
              type="text"
              placeholder="Rahul Sharma"
              value={custName}
              onChange={(e) => setCustName(e.target.value)}
              style={{ width: '100%', minHeight: 46, border: '1px solid var(--line)', borderRadius: 12, padding: '0 14px', font: '500 14px "DM Sans",sans-serif', color: 'var(--ink)', background: 'var(--soft)', outline: 'none', marginBottom: 14 }}
            />

            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontFamily: '"DM Sans",sans-serif' }}>Phone <span style={{ fontWeight: 400, color: '#98a2b3' }}>(optional)</span></label>
            <input
              type="tel"
              placeholder="9876543210"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
              style={{ width: '100%', minHeight: 46, border: '1px solid var(--line)', borderRadius: 12, padding: '0 14px', font: '500 14px "DM Sans",sans-serif', color: 'var(--ink)', background: 'var(--soft)', outline: 'none', marginBottom: 18 }}
            />

            {error && <p style={{ color: '#c0392b', fontSize: 13, fontWeight: 600, margin: '0 0 12px', fontFamily: '"DM Sans",sans-serif' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="cta"
            >
              <span>{loading ? 'Creating session…' : 'Generate Payment QR'}</span>
            </button>
          </form>

          <div className="foot" style={{ marginTop: 18 }}>
            0% transaction fee. Funds go straight to merchant.
          </div>
        </div>
      </div>
    );
  }

  /* Timing calculations */
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const timerPct = ((timeLeft / SESSION_SECS) * 100).toFixed(1);
  const strokeOffset = (100 - (timeLeft / SESSION_SECS) * 100).toFixed(1);
  const isTimerLow = timeLeft <= 60;

  return (
    <>
      {/* ═════════════════════════════════════════════════════════
          DESKTOP WINDOW ONLY (>= 768px):
          Exact Receipt design v2 with original website logo
      ═════════════════════════════════════════════════════════ */}
      {/* ═════════════════════════════════════════════════════════
          DESKTOP WINDOW ONLY (>= 768px):
          Custom Hosted Checkout Panel (from MyMobPay Checkout.html)
      ═════════════════════════════════════════════════════════ */}
      <div className="desktop-checkout-view">
        <DesktopCheckoutView
          merchant={merchant}
          orderId={orderId}
          paramRef={paramRef}
          paramCallback={paramCallback}
          activeId={activeId}
          displayAmt={displayAmt}
          amtWhole={amtWhole}
          amtFrac={amtFrac}
          bizName={bizName}
          bizInitial={bizInitial}
          upiId={upiId}
          upiQrValue={upiQrValue}
          orderDate={orderDate}
          timeLeft={timeLeft}
          mm={mm}
          ss={ss}
          activeOpt={activeOpt}
          setActiveOpt={setActiveOpt}
          copyFeedback={copyFeedback}
          handleCopyUpi={handleCopyUpi}
          isChecking={isChecking}
          triggerChecking={triggerChecking}
          checkMsg={checkMsg}
          handleReturn={handleReturn}
          bankName={bankName}
          bankAcc={bankAcc}
          bankIfsc={bankIfsc}
          bankBranch={bankBranch}
          copiedAcc={copiedAcc}
          copiedIfsc={copiedIfsc}
          handleCopyAcc={handleCopyAcc}
          handleCopyIfsc={handleCopyIfsc}
          cryptoWallet={cryptoWallet}
          usdtAmt={usdtAmt}
          txHash={txHash}
          setTxHash={setTxHash}
          submitTx={submitTx}
          txBusy={txBusy}
          txMsg={txMsg}
          copyUsdtDone={copyUsdtDone}
          handleCopyUsdt={handleCopyUsdt}
          showUtr={showUtr}
          setShowUtr={setShowUtr}
          utr={utr}
          setUtr={setUtr}
          submitUtr={submitUtr}
          utrBusy={utrBusy}
          utrMsg={utrMsg}
          showPromo={showPromo}
          setShowPromo={setShowPromo}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          submitPromo={submitPromo}
          promoLoading={promoLoading}
          promoMsg={promoMsg}
          promoApplied={promoApplied}
          curView={curView}
          setCurView={setCurView}
          okTime={okTime}
          orderMode={orderMode}
          fmtInr={fmtInr}
          buildUpiLink={buildUpiLink}
          cardBrand={cardBrand}
          setCardBrand={setCardBrand}
          cardNumber={cardNumber}
          setCardNumber={setCardNumber}
          cardExpiry={cardExpiry}
          setCardExpiry={setCardExpiry}
          cardCvv={cardCvv}
          setCardCvv={setCardCvv}
          cardHolder={cardHolder}
          setCardHolder={setCardHolder}
          cardOtp={cardOtp}
          setCardOtp={setCardOtp}
          cardBusy={cardBusy}
          cardMsg={cardMsg}
          submitCardPayment={submitCardPayment}
          codName={codName}
          setCodName={setCodName}
          codPhone={codPhone}
          setCodPhone={setCodPhone}
          codAddress={codAddress}
          setCodAddress={setCodAddress}
          codPincode={codPincode}
          setCodPincode={setCodPincode}
          codCity={codCity}
          setCodCity={setCodCity}
          codBusy={codBusy}
          codMsg={codMsg}
          submitCodOrder={submitCodOrder}
        />
      </div>

      {/* ═════════════════════════════════════════════════════════
          MOBILE WINDOW ONLY (< 768px):
          Mobile checkout with circular timer ring & bottom bar
      ═════════════════════════════════════════════════════════ */}
      <div className="mobile-checkout-view app">
        {/* ── HEADER (Shown only on non-vPay views to keep vPay clean like mockup) ── */}
        {curView !== 'vPay' && (
          <>
            <div className="hd">
              <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <MyMobPayLogo />
              </Link>
              <div className="sec">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="11" width="14" height="10" rx="2"/>
                  <path d="M8 11V8a4 4 0 018 0v3"/>
                </svg>
                Secure checkout
              </div>
            </div>

            {/* ── PROGRESS BAR ── */}
            <div className={`prog ${isTimerLow ? 'low' : ''}`}>
              <div style={{ width: `${timerPct}%` }} />
            </div>
          </>
        )}

        {/* ── SCROLLABLE BODY ── */}
        <div className="scr">
          {/* Test mode banner */}
          {orderMode === 'test' && (
            <div style={{ marginBottom: 14, background: '#fff8e7', border: '1px solid #f0c040', borderRadius: 12, padding: '8px 14px', fontSize: 12.5, fontWeight: 700, color: '#856404', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
              Test mode &mdash; simulated sandbox transaction
            </div>
          )}

          {/* VIEW 1: PAY — Choice of Payment Methods First, then Selected Method */}
          {curView === 'vPay' && (
            <div id="vPay">
              {/* Subtle top camera dot (mockup aesthetic) */}
              <div className="mob-phone-dot" aria-hidden="true" />

              {/* ─────────────────────────────────────────────────────────────
                  STATE A: NO PAYMENT METHOD SELECTED YET (DEFAULT FIRST VIEW)
                  Shows clean, professional payment method choices first
              ───────────────────────────────────────────────────────────── */}
              {!selectedMethod ? (
                <div className="mob-select-methods-wrap">
                  {/* Brand Header */}
                  <div className="mob-brand-header">
                    <svg width="32" height="28" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M 6.5 28.5 V 13 C 6.5 7.2 11.5 5 15.5 8.2 L 19 18.5"
                        stroke="#0284C7"
                        strokeWidth="5.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M 19 18.5 L 22.5 8.2 C 26.5 5 31.5 7.2 31.5 13 V 28.5"
                        stroke="#FF7800"
                        strokeWidth="5.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="mob-brand-title">MyMobPay</span>
                  </div>

                  {/* Executive Order Summary Card */}
                  <div className="mob-order-hero-card">
                    {/* Top Row: Merchant Info & Total Payable */}
                    <div className="mob-order-hero-top">
                      <div className="mob-merchant-info-row">
                        <div className="mob-biz-avatar">
                          {bizInitial || bizName?.charAt(0)?.toUpperCase() || 'M'}
                        </div>
                        <div className="mob-biz-details">
                          <div className="mob-biz-name-row">
                            <span className="mob-biz-title">{bizName}</span>
                            <span className="mob-verified-check" title="Verified Merchant">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5z"/>
                                <path d="M9 12l2 2 4-4"/>
                              </svg>
                            </span>
                          </div>
                          <span className="mob-biz-sub">
                            {orderMode === 'test' ? 'Sandbox Order' : 'Verified Merchant Settlement'}
                          </span>
                        </div>
                      </div>

                      <div className="mob-order-amt-block">
                        <span className="mob-order-hero-lbl">Total Payable</span>
                        <div className="mob-order-hero-amt">{fmtInr(displayAmt)}</div>
                      </div>
                    </div>

                    {/* Specification Itemized Rows */}
                    <div className="mob-order-hero-specs">
                      {activeId && (
                        <div className="mob-spec-row">
                          <span className="mob-spec-k">Order ID</span>
                          <div className="mob-spec-v-wrap">
                            <code className="mob-spec-code">{activeId}</code>
                            <button
                              type="button"
                              onClick={handleCopyOrderId}
                              className="mob-copy-ref-btn"
                              aria-label="Copy Order ID"
                              title="Copy Order ID"
                            >
                              {copiedOrderId ? (
                                <span className="mob-copy-done">✓ Copied</span>
                              ) : (
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="mob-spec-row">
                        <span className="mob-spec-k">Order Date</span>
                        <span className="mob-spec-v">{orderDate || 'Today'}</span>
                      </div>

                      <div className="mob-spec-row">
                        <span className="mob-spec-k">Convenience Fee</span>
                        <span className="mob-spec-v mob-fee-waived">₹0.00 (0% MDR Waived)</span>
                      </div>

                      <div className="mob-spec-row">
                        <span className="mob-spec-k">Settlement Route</span>
                        <span className="mob-spec-v mob-secure-route">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                          Direct Real-Time Bank Settled
                        </span>
                      </div>

                      <div className="mob-spec-row">
                        <span className="mob-spec-k">Session Timer</span>
                        <span className="mob-spec-v" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#b45309', background: '#fef3c7', padding: '1px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          {(selectedMethod || activeOpt) ? `${mm}:${ss}` : '05:00 (Starts on select)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Section Title */}
                  <div className="mob-choose-hdr">
                    <h3>Choose Payment Method</h3>
                    <p>Select your preferred option to complete payment</p>
                  </div>

                  {/* 5 Payment Methods Stack */}
                  <div className="mob-methods-stack">
                    {/* 1. UPI / QR */}
                    <button
                      type="button"
                      className="mob-method-opt-btn"
                      onClick={() => { setSelectedMethod('upi'); setActiveOpt('upi'); }}
                    >
                      <div className="mob-opt-icon mob-opt-upi">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2 7V3a1 1 0 011-1h4v2H4v3H2zm0 10v4a1 1 0 001 1h4v-2H4v-3H2zm18 0v3h-3v2h4a1 1 0 001-1v-4h-2zm-3-15v2h3v3h2V3a1 1 0 00-1-1h-4zM7 7h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z"/>
                        </svg>
                      </div>
                      <div className="mob-opt-body">
                        <div className="mob-opt-title-row">
                          <span className="mob-opt-title">UPI / QR Code</span>
                          <span className="mob-opt-tag-green">Instant • 0% Fee</span>
                        </div>
                        <span className="mob-opt-sub">Pay via Google Pay, PhonePe, Paytm, or any UPI app</span>
                      </div>
                      <span className="mob-opt-chevron">›</span>
                    </button>



                    {/* 3. Net Banking */}
                    <button
                      type="button"
                      className="mob-method-opt-btn"
                      onClick={() => { setSelectedMethod('bank'); setActiveOpt('bank'); }}
                    >
                      <div className="mob-opt-icon mob-opt-bank">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm9.5-20.5L2 6v2h19V6l-9.5-4.5z"/>
                        </svg>
                      </div>
                      <div className="mob-opt-body">
                        <div className="mob-opt-title-row">
                          <span className="mob-opt-title">Direct Net Banking</span>
                          <span className="mob-opt-tag-gray">IMPS / NEFT</span>
                        </div>
                        <span className="mob-opt-sub">Direct transfer to merchant bank account</span>
                      </div>
                      <span className="mob-opt-chevron">›</span>
                    </button>

                    {/* 4. Crypto */}
                    <button
                      type="button"
                      className="mob-method-opt-btn"
                      onClick={() => { setSelectedMethod('crypto'); setActiveOpt('crypto'); }}
                    >
                      <div className="mob-opt-icon mob-opt-crypto">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="9"/>
                          <path d="M9 8h5a2 2 0 010 4H9m0 0h5.5a2 2 0 010 4H9M9 7v10" stroke="#fff" strokeWidth="1.8" fill="none"/>
                        </svg>
                      </div>
                      <div className="mob-opt-body">
                        <div className="mob-opt-title-row">
                          <span className="mob-opt-title">Crypto Currency</span>
                          <span className="mob-opt-tag-amber">USDT • TRC20</span>
                        </div>
                        <span className="mob-opt-sub">Pay {usdtAmt} USDT with on-chain verification</span>
                      </div>
                      <span className="mob-opt-chevron">›</span>
                    </button>


                  </div>

                  {/* Promo code link */}
                  <div style={{ textAlign: 'center', marginTop: 14 }}>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => setShowPromo(!showPromo)}
                      style={{ fontSize: 13 }}
                    >
                      {promoApplied ? `Promo applied: ${promoApplied.code} ✓` : 'Have a coupon code?'}
                    </button>
                  </div>
                  {showPromo && (
                    <form onSubmit={submitPromo} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <input
                        placeholder="Promo code"
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        style={{ flex: 1, minHeight: 44, border: '1px solid #d0d5dd', borderRadius: 10, padding: '0 12px', fontSize: 13, textTransform: 'uppercase' }}
                      />
                      <button
                        type="submit"
                        disabled={promoLoading || !promoCode.trim()}
                        style={{ minHeight: 44, padding: '0 16px', border: 0, borderRadius: 10, background: 'var(--brand)', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                      >
                        {promoLoading ? '…' : 'Apply'}
                      </button>
                    </form>
                  )}
                  {promoMsg && (
                    <p style={{ textAlign: 'center', margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: promoMsg.startsWith('✓') ? 'var(--ok)' : '#c0392b' }}>
                      {promoMsg}
                    </p>
                  )}

                  {/* Trust footer */}
                  <div className="mob-overview-trust">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5z"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                    <span>100% Secure Checkout &bull; 0% Platform MDR</span>
                  </div>
                </div>
              ) : (
                /* ─────────────────────────────────────────────────────────────
                    STATE B: A SPECIFIC PAYMENT METHOD IS SELECTED
                    Displays the chosen method with a prominent Change Method back button
                ───────────────────────────────────────────────────────────── */
                <div className="mob-active-method-view">
                  {/* Top Change Method Navigation Bar */}
                  <div className="mob-back-methods-bar">
                    <button
                      type="button"
                      className="mob-back-btn"
                      onClick={() => { setSelectedMethod(null); setActiveOpt(null); }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                      </svg>
                      <span>Change payment method</span>
                    </button>
                    <div className={`mob-timer-pill ${isTimerLow ? 'low' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: isTimerLow ? '#fef2f2' : '#f0fdf4', color: isTimerLow ? '#dc2626' : '#15803d', border: `1px solid ${isTimerLow ? '#fecaca' : '#bbf7d0'}` }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{mm}:{ss}</span>
                    </div>
                  </div>

                  {/* ── B.1: UPI / QR METHOD VIEW ── */}
                  {selectedMethod === 'upi' && (
                    <div className="mob-checkout-card">
                      {/* 1. Centered Brand Header */}
                      <div className="mob-brand-header">
                        <svg width="32" height="28" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M 6.5 28.5 V 13 C 6.5 7.2 11.5 5 15.5 8.2 L 19 18.5"
                            stroke="#0284C7"
                            strokeWidth="5.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M 19 18.5 L 22.5 8.2 C 26.5 5 31.5 7.2 31.5 13 V 28.5"
                            stroke="#FF7800"
                            strokeWidth="5.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="mob-brand-title">MyMobPay</span>
                      </div>

                      {/* 2. Total Amount Display */}
                      <div className="mob-total-display">
                        TOTAL: {fmtInr(displayAmt)}
                      </div>

                      {/* 3. Timer Pill */}
                      <div className="mob-timer-pill-wrap">
                        <div className={`mob-timer-pill ${isTimerLow ? 'low' : ''}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span className="mob-timer-label">Expires in:</span>
                          <span className="mob-timer-digits">{mm}:{ss}</span>
                        </div>
                      </div>

                      {/* 4. Themed QR Frame */}
                      <div className="mob-qr-container">
                        <div className="mob-qr-frame">
                          <span className="mob-corner mob-corner-tl" />
                          <span className="mob-corner mob-corner-tr" />
                          <span className="mob-corner mob-corner-bl" />
                          <span className="mob-corner mob-corner-br" />

                          <div className="mob-qr-inner">
                            {upiQrValue ? (
                              <>
                                <QRCode
                                  value={upiQrValue}
                                  size={196}
                                  level="Q"
                                  fgColor="#0f172a"
                                  bgColor="#ffffff"
                                  style={{ display: 'block', width: '100%', height: 'auto' }}
                                />
                                <div className="mob-qr-center-pill">
                                  <svg width="24" height="22" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                      d="M 6.5 28.5 V 13 C 6.5 7.2 11.5 5 15.5 8.2 L 19 18.5"
                                      stroke="#0284C7"
                                      strokeWidth="5.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M 19 18.5 L 22.5 8.2 C 26.5 5 31.5 7.2 31.5 13 V 28.5"
                                      stroke="#FF7800"
                                      strokeWidth="5.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                              </>
                            ) : (
                              <div style={{ width: 196, height: 196, display: 'grid', placeItems: 'center', color: '#64748b', fontSize: 13 }}>
                                Generating QR…
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 5. Verified Merchant Pill */}
                      <div className="mob-merchant-badge">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V5z"/>
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                        <span>Verified Merchant &bull; {bizName}</span>
                      </div>

                      {/* 5b. Payment Verification Advisory Line */}
                      <div className="mob-verify-notice">
                        <div className="mob-verify-icon-box">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                          <span className="mob-verify-ping" />
                          <span className="mob-verify-dot" />
                        </div>
                        <div className="mob-verify-text">
                          <strong className="mob-verify-title">Auto-verifying bank credit...</strong>{' '}
                          <span className="mob-verify-desc">Bank notifications take 30–90 seconds. Please keep this screen open while we verify your transaction.</span>
                        </div>
                      </div>

                      {/* 6. Direct UPI App Launcher Chips */}
                      <div className="mob-upi-apps-row">
                        <p className="mob-action-hint">Tap to pay with any UPI app</p>
                        <div className="mob-chips-grid">
                          {UPI_CHIPS.map(app => (
                            <button
                              key={app.id}
                              type="button"
                              onClick={() => {
                                if (!displayAmt) return;
                                window.location.href = buildUpiLink(app.id, displayAmt, activeId, merchant, isMandate);
                              }}
                              className="mob-app-chip"
                              title={`Pay with ${app.label}`}
                            >
                              <img src={app.logo} alt={app.label} style={{ maxHeight: app.h, maxWidth: '85%', width: 'auto', height: 'auto', display: 'block', objectFit: 'contain' }} />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 7. Copyable UPI ID Bar */}
                      <div className="mob-upi-id-bar">
                        <div className="mob-upi-id-left">
                          <span className="mob-upi-id-label">UPI ID</span>
                          <span className="mob-upi-id-val">{upiId}</span>
                        </div>
                        <button
                          type="button"
                          className={`mob-copy-btn ${copyFeedback ? 'done' : ''}`}
                          onClick={handleCopyUpi}
                        >
                          {copyFeedback ? 'Copied ✓' : 'Copy'}
                        </button>
                      </div>

                      {/* 8. Live Real-Time Verification Status & UTR Drawer (Hidden by default; appears if payment takes >45s or user checks status) */}
                      {(isChecking || mobUpiDelayed || mobUpiCheckCount >= 1 || showUtr) && (
                        <div style={{
                          marginTop: 12,
                          background: checkMsg?.startsWith('✓') ? '#ecfdf5' : '#f8fafc',
                          border: `1.5px solid ${checkMsg?.startsWith('✓') ? '#a7f3d0' : '#e2e8f0'}`,
                          borderRadius: 14,
                          padding: '12px 14px',
                          textAlign: 'left'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {isChecking ? (
                              <svg width="20" height="20" viewBox="0 0 48 48" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
                                <circle cx="24" cy="24" r="20" stroke="#cbd5e1" strokeWidth="5" fill="none" />
                                <circle cx="24" cy="24" stroke="#0284C7" strokeWidth="5" strokeLinecap="round" fill="none" strokeDasharray="32 94" />
                              </svg>
                            ) : (
                              <span style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: checkMsg?.startsWith('✓') ? '#10b981' : '#f59e0b',
                                display: 'inline-block',
                                flexShrink: 0
                              }} />
                            )}
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: checkMsg?.startsWith('✓') ? '#065f46' : '#0f172a' }}>
                                {isChecking ? 'Checking transaction status…' : (checkMsg?.startsWith('✓') ? 'Payment Verified!' : 'Payment Pending Confirmation')}
                              </p>
                              <p style={{ margin: '2px 0 0', fontSize: 11.5, color: checkMsg?.startsWith('✓') ? '#047857' : '#64748b', lineHeight: 1.4 }}>
                                {checkMsg || 'Connecting to bank network to confirm your UPI transfer… Payment verification may take up to 60 seconds.'}
                              </p>
                            </div>
                          </div>

                          {(showUtr || mobUpiDelayed || mobUpiCheckCount >= 1) && !checkMsg?.startsWith('✓') && (
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
                              <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                                Already paid? Verify 12-digit UTR now:
                              </label>
                              <div style={{ display: 'flex', gap: 6 }}>
                                <input
                                  inputMode="numeric"
                                  maxLength={16}
                                  placeholder="12-digit UTR reference"
                                  value={utr}
                                  onChange={e => { setUtr(e.target.value.replace(/\D/g, '').slice(0, 16)); setUtrMsg(''); }}
                                  style={{
                                    flex: 1,
                                    minHeight: 40,
                                    border: '1px solid #cbd5e1',
                                    borderRadius: 10,
                                    padding: '0 10px',
                                    fontSize: 13,
                                    fontFamily: "'IBM Plex Mono', monospace",
                                    background: '#fff',
                                    outline: 'none',
                                    color: '#0f172a'
                                  }}
                                />
                                <button
                                  type="button"
                                  disabled={utr.length < 8 || utrBusy}
                                  onClick={submitUtr}
                                  style={{
                                    minHeight: 40,
                                    padding: '0 14px',
                                    border: 0,
                                    borderRadius: 10,
                                    background: '#0284C7',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: 12,
                                    cursor: utr.length >= 8 && !utrBusy ? 'pointer' : 'not-allowed',
                                    opacity: utr.length >= 8 && !utrBusy ? 1 : 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6
                                  }}
                                >
                                  {utrBusy ? '…' : 'Verify'}
                                </button>
                              </div>
                              {utrMsg && (
                                <p style={{ margin: '6px 0 0', fontSize: 11.5, fontWeight: 600, color: utrMsg.startsWith('✓') ? '#059669' : '#dc2626' }}>
                                  {utrMsg}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── B.2: CARDS METHOD VIEW ── */}
                  {selectedMethod === 'card' && (
                    <div className="mob-checkout-card" style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Credit / Debit Card</h4>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0284C7' }}>{fmtInr(displayAmt)}</span>
                      </div>

                      {/* Card Brands Badges */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                        {['visa', 'mastercard', 'rupay'].map(b => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setCardBrand(b)}
                            style={{
                              flex: 1,
                              padding: '8px 4px',
                              borderRadius: 10,
                              border: cardBrand === b ? '2px solid #0284C7' : '1px solid #e2e8f0',
                              background: cardBrand === b ? '#f0f9ff' : '#ffffff',
                              color: cardBrand === b ? '#0284C7' : '#64748b',
                              fontSize: 11.5,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              cursor: 'pointer'
                            }}
                          >
                            {b}
                          </button>
                        ))}
                      </div>

                      {/* Card Number */}
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
                        Card Number
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={19}
                        placeholder="4532 •••• •••• 8892"
                        value={cardNumber}
                        onChange={e => {
                          const v = e.target.value.replace(/\D/g, '').slice(0, 16);
                          const formatted = v.match(/.{1,4}/g)?.join(' ') || v;
                          setCardNumber(formatted);
                          if (v.startsWith('4')) setCardBrand('visa');
                          else if (v.startsWith('5')) setCardBrand('mastercard');
                          else if (v.startsWith('6')) setCardBrand('rupay');
                        }}
                        style={{
                          width: '100%',
                          minHeight: 46,
                          border: '1px solid #cbd5e1',
                          borderRadius: 12,
                          padding: '0 12px',
                          fontSize: 14,
                          fontFamily: "'IBM Plex Mono', monospace",
                          marginBottom: 12,
                          boxSizing: 'border-box'
                        }}
                      />

                      {/* Expiry & CVV */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={5}
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={e => {
                              let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                              if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                              setCardExpiry(v);
                            }}
                            style={{
                              width: '100%',
                              minHeight: 46,
                              border: '1px solid #cbd5e1',
                              borderRadius: 12,
                              padding: '0 12px',
                              fontSize: 14,
                              fontFamily: "'IBM Plex Mono', monospace",
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
                            CVV
                          </label>
                          <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="•••"
                            value={cardCvv}
                            onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            style={{
                              width: '100%',
                              minHeight: 46,
                              border: '1px solid #cbd5e1',
                              borderRadius: 12,
                              padding: '0 12px',
                              fontSize: 14,
                              fontFamily: "'IBM Plex Mono', monospace",
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>

                      {/* Cardholder Name */}
                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        placeholder="Name as on card"
                        value={cardHolder}
                        onChange={e => setCardHolder(e.target.value)}
                        style={{
                          width: '100%',
                          minHeight: 46,
                          border: '1px solid #cbd5e1',
                          borderRadius: 12,
                          padding: '0 12px',
                          fontSize: 14,
                          marginBottom: 14,
                          boxSizing: 'border-box'
                        }}
                      />

                      {/* Test Sandbox or Live Advisory */}
                      {orderMode === 'test' ? (
                        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#92400e' }}>
                          <span style={{ fontWeight: 700 }}>Sandbox Mode:</span> Simulated payment test. Default OTP is <code>123456</code>.
                          <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 700 }}>OTP:</span>
                            <input
                              type="text"
                              value={cardOtp}
                              placeholder="123456"
                              onChange={e => setCardOtp(e.target.value)}
                              style={{ width: 90, minHeight: 32, padding: '0 8px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12 }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: '10px 12px', marginBottom: 14, fontSize: 12, color: '#1e40af', lineHeight: 1.4 }}>
                          Direct card processing rail: UPI or Net Banking is recommended for 0% MDR instant settlement.
                        </div>
                      )}

                      {/* Card Submit Button */}
                      <button
                        type="button"
                        disabled={cardBusy}
                        onClick={submitCardPayment}
                        style={{
                          width: '100%',
                          minHeight: 48,
                          border: 0,
                          borderRadius: 12,
                          background: '#0284C7',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: cardBusy ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8
                        }}
                      >
                        {cardBusy ? 'Processing Card…' : `Pay ${fmtInr(displayAmt)} by Card`}
                      </button>

                      {cardMsg && (
                        <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 600, color: cardMsg.startsWith('✓') ? '#059669' : '#dc2626' }}>
                          {cardMsg}
                        </p>
                      )}
                    </div>
                  )}

                  {/* ── B.3: NET BANKING METHOD VIEW ── */}
                  {selectedMethod === 'bank' && (
                    <div className="mob-checkout-card" style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Direct Net Banking</h4>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#0284C7' }}>{fmtInr(displayAmt)}</span>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
                          <span style={{ color: '#64748b', fontWeight: 600 }}>Account Name</span>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>{bankName}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontSize: 13, background: '#f1f5f9' }}>
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account Number</span>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{bankAcc}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyAcc}
                            style={{ border: 0, background: copiedAcc ? '#dcf5e8' : '#eaf2fe', color: copiedAcc ? '#0d7a47' : '#0284C7', fontWeight: 700, fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}
                          >
                            {copiedAcc ? 'Copied ✓' : 'Copy'}
                          </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: bankBranch ? '1px solid #e2e8f0' : 'none', fontSize: 13, background: '#f1f5f9' }}>
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 600, display: 'block', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>IFSC Code</span>
                            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{bankIfsc}</span>
                          </div>
                          <button
                            type="button"
                            onClick={handleCopyIfsc}
                            style={{ border: 0, background: copiedIfsc ? '#dcf5e8' : '#eaf2fe', color: copiedIfsc ? '#0d7a47' : '#0284C7', fontWeight: 700, fontSize: 12, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}
                          >
                            {copiedIfsc ? 'Copied ✓' : 'Copy'}
                          </button>
                        </div>

                        {bankBranch && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
                            <span style={{ color: '#64748b', fontWeight: 600 }}>Bank Branch</span>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{bankBranch}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', fontSize: 13, background: '#f0f9ff' }}>
                          <span style={{ color: '#0369a1', fontWeight: 600 }}>Amount to Transfer</span>
                          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 800, fontSize: 15, color: '#0284C7' }}>{fmtInr(displayAmt)}</span>
                        </div>
                      </div>

                      {/* Immediate UTR Verification Form */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '12px 14px' }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                          Transferred funds? Enter 12-digit UTR:
                        </label>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            inputMode="numeric"
                            maxLength={12}
                            placeholder="12-digit UTR reference"
                            value={utr}
                            onChange={e => { setUtr(e.target.value.replace(/\D/g, '').slice(0, 12)); setUtrMsg(''); }}
                            style={{
                              flex: 1,
                              minHeight: 42,
                              border: '1px solid #cbd5e1',
                              borderRadius: 10,
                              padding: '0 10px',
                              fontSize: 13,
                              fontFamily: "'IBM Plex Mono', monospace",
                              background: '#fff',
                              color: '#0f172a'
                            }}
                          />
                          <button
                            type="button"
                            disabled={utr.length !== 12 || utrBusy}
                            onClick={submitUtr}
                            style={{
                              minHeight: 42,
                              padding: '0 16px',
                              border: 0,
                              borderRadius: 10,
                              background: '#0284C7',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 12.5,
                              cursor: utr.length === 12 && !utrBusy ? 'pointer' : 'not-allowed',
                              opacity: utr.length === 12 && !utrBusy ? 1 : 0.5
                            }}
                          >
                            {utrBusy ? '…' : 'Verify'}
                          </button>
                        </div>
                        {utrMsg && (
                          <p style={{ margin: '6px 0 0', fontSize: 11.5, fontWeight: 600, color: utrMsg.startsWith('✓') ? '#059669' : '#dc2626' }}>
                            {utrMsg}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── B.4: CRYPTO METHOD VIEW ── */}
                  {selectedMethod === 'crypto' && (
                    <div className="mob-checkout-card" style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Crypto (USDT)</h4>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#f59e0b' }}>{usdtAmt} USDT</span>
                      </div>

                      <div style={{ textAlign: 'center', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, marginBottom: 14 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Deposit Address (TRC20 Network)</span>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, fontWeight: 700, color: '#0f172a', wordBreak: 'break-all', marginBottom: 10 }}>
                          {cryptoWallet}
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyUsdt}
                          style={{
                            border: 0,
                            background: copyUsdtDone ? '#dcfce7' : '#eaf2fe',
                            color: copyUsdtDone ? '#15803d' : '#0284C7',
                            fontWeight: 700,
                            fontSize: 12,
                            padding: '8px 18px',
                            borderRadius: 10,
                            cursor: 'pointer'
                          }}
                        >
                          {copyUsdtDone ? 'Address Copied ✓' : 'Copy Wallet Address'}
                        </button>
                      </div>

                      <form onSubmit={submitTx}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                          Enter TxID (Transaction Hash)
                        </label>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <input
                            type="text"
                            placeholder="64-char transaction hash"
                            value={txHash}
                            onChange={e => setTxHash(e.target.value)}
                            style={{
                              flex: 1,
                              minHeight: 42,
                              border: '1px solid #cbd5e1',
                              borderRadius: 10,
                              padding: '0 10px',
                              fontSize: 12.5,
                              fontFamily: "'IBM Plex Mono', monospace"
                            }}
                          />
                          <button
                            type="submit"
                            disabled={txBusy || !txHash.trim()}
                            style={{
                              minHeight: 42,
                              padding: '0 16px',
                              border: 0,
                              borderRadius: 10,
                              background: '#f59e0b',
                              color: '#fff',
                              fontWeight: 700,
                              fontSize: 12.5,
                              cursor: txBusy || !txHash.trim() ? 'not-allowed' : 'pointer'
                            }}
                          >
                            {txBusy ? '…' : 'Verify'}
                          </button>
                        </div>
                        {txMsg && (
                          <p style={{ margin: '6px 0 0', fontSize: 11.5, fontWeight: 600, color: txMsg.startsWith('✓') ? '#059669' : '#dc2626' }}>
                            {txMsg}
                          </p>
                        )}
                      </form>
                    </div>
                  )}

                  {/* ── B.5: COD METHOD VIEW ── */}
                  {selectedMethod === 'cod' && (
                    <div className="mob-checkout-card" style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h4 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Cash on Delivery</h4>
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>{fmtInr(displayAmt)}</span>
                      </div>

                      <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#64748b', lineHeight: 1.4 }}>
                        Fill your delivery address below. You can pay ₹{displayAmt} in cash or UPI when your shipment arrives.
                      </p>

                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Receiver Name"
                        value={codName}
                        onChange={e => setCodName(e.target.value)}
                        style={{ width: '100%', minHeight: 44, border: '1px solid #cbd5e1', borderRadius: 10, padding: '0 12px', fontSize: 13.5, marginBottom: 10, boxSizing: 'border-box' }}
                      />

                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="10-digit mobile number"
                        value={codPhone}
                        onChange={e => setCodPhone(e.target.value)}
                        style={{ width: '100%', minHeight: 44, border: '1px solid #cbd5e1', borderRadius: 10, padding: '0 12px', fontSize: 13.5, marginBottom: 10, boxSizing: 'border-box' }}
                      />

                      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
                        Delivery Address
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Flat, House No., Building, Street"
                        value={codAddress}
                        onChange={e => setCodAddress(e.target.value)}
                        style={{ width: '100%', border: '1px solid #cbd5e1', borderRadius: 10, padding: '8px 12px', fontSize: 13.5, marginBottom: 10, boxSizing: 'border-box', resize: 'none' }}
                      />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
                            Pincode
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            placeholder="6-digit PIN"
                            value={codPincode}
                            onChange={e => setCodPincode(e.target.value)}
                            style={{ width: '100%', minHeight: 44, border: '1px solid #cbd5e1', borderRadius: 10, padding: '0 12px', fontSize: 13.5, boxSizing: 'border-box' }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 5 }}>
                            City / Area
                          </label>
                          <input
                            type="text"
                            placeholder="City"
                            value={codCity}
                            onChange={e => setCodCity(e.target.value)}
                            style={{ width: '100%', minHeight: 44, border: '1px solid #cbd5e1', borderRadius: 10, padding: '0 12px', fontSize: 13.5, boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={codBusy}
                        onClick={submitCodOrder}
                        style={{
                          width: '100%',
                          minHeight: 48,
                          border: 0,
                          borderRadius: 12,
                          background: '#059669',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: codBusy ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {codBusy ? 'Confirming Order…' : 'Confirm Cash on Delivery Order'}
                      </button>

                      {codMsg && (
                        <p style={{ margin: '8px 0 0', fontSize: 12, fontWeight: 600, color: codMsg.startsWith('✓') ? '#059669' : '#dc2626' }}>
                          {codMsg}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Trust badge */}
                  <div className="trust">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                    <span>0% transaction fee. Your payment goes straight to the merchant.</span>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* VIEW 3: SUCCESS */}
          {curView === 'vOk' && (
            <div id="vOk" style={{ padding: '24px 16px' }}>
              <div className="panel" style={{ padding: '32px 20px', textAlign: 'center', borderRadius: 24, boxShadow: '0 20px 40px -15px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', background: '#ffffff' }}>
                
                {/* Floating Trust Pill */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ecfdf5', color: '#065f46', borderRadius: 9999, padding: '6px 14px', marginBottom: 16, border: '1px solid #a7f3d0', fontSize: 11, fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                  <span>Payment Verified • mymob.tech</span>
                </div>

                {/* Animated Green Tick Icon */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <div style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', background: '#d1fae5', opacity: 0.75, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
                  <div style={{ position: 'relative', width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)', border: '4px solid #ffffff' }}>
                    <svg style={{ width: 40, height: 40, color: '#ffffff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                </div>

                <h2 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
                  Payment Successful!
                </h2>
                <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px', fontWeight: 500 }}>
                  {fmtInr(displayAmt)} paid to <strong>{bizName}</strong>
                </p>

                <div className="rcp" style={{ textAlign: 'left', margin: '16px 0', background: '#f8fafc', padding: '16px', borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <div><span>Order Reference</span><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{activeId || 'DEMO'}</span></div>
                  <div><span>Amount Paid</span><span style={{ color: '#059669', fontWeight: 800 }}>{fmtInr(displayAmt)}</span></div>
                  <div><span>Payment Method</span><span>{selectedMethod === 'card' ? 'Credit / Debit Card' : selectedMethod === 'bank' ? 'Direct Bank Transfer' : selectedMethod === 'crypto' ? 'Crypto USDT (TRC20)' : selectedMethod === 'cod' ? 'Cash on Delivery (COD)' : 'UPI Instant Settlement'}</span></div>
                  <div><span>Transaction Status</span><span style={{ color: '#059669', fontWeight: 700 }}>✓ Verified & Paid</span></div>
                  <div><span>Settlement Time</span><span>{okTime || new Date().toLocaleTimeString([], { hour:'numeric', minute:'2-digit' })}</span></div>
                </div>

                <button
                  type="button"
                  className="pri wide"
                  style={{ background: 'linear-gradient(135deg, #059669, #0d9488)', border: 'none', padding: '14px', borderRadius: 14, fontWeight: 700, fontSize: 15, color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  onClick={handleReturn}
                >
                  <span>Return to {bizName}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 4: EXPIRED */}
          {curView === 'vExp' && (
            <div id="vExp">
              <div className="panel">
                <div className="xic"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg></div>
                <h2>Session expired</h2>
                <p>This payment session has ended. Start again to get a fresh code.</p>
                <button type="button" className="pri wide" style={{ marginTop: 22 }} onClick={() => { setTimeLeft(SESSION_SECS); setCurView('vPay'); }}>Start again</button>
              </div>
            </div>
          )}
        </div>

        {/* ── BOTTOM FIXED BAR (Only shown on mobile vPay when UPI method is selected) ── */}
        {curView === 'vPay' && selectedMethod === 'upi' && (
          <div className="bar" id="bar">
            <div className="t">
              <small>Total</small>
              <b>{fmtInr(displayAmt)}</b>
            </div>
            <button
              type="button"
              className="pri"
              id="paid"
              disabled={isChecking}
              onClick={triggerChecking}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
                opacity: isChecking ? 0.85 : 1
              }}
            >
              {isChecking ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 48 48" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.3)" strokeWidth="5" fill="none" />
                    <circle cx="24" cy="24" r="20" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" strokeDasharray="32 94" />
                  </svg>
                  <span>Checking…</span>
                </>
              ) : (
                <>I&apos;ve paid</>
              )}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────
   Page Wrapper with Combined Responsive Styles:
   - >= 768px: Exact Receipt design v2 (Desktop)
   - < 768px: Mobile checkout screen (Mobile)
────────────────────────────────────────────────────────────── */
export default function PayPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=IBM+Plex+Mono:wght@400;500;700&family=Orbitron:wght@800;900&family=Outfit:wght@700;800&display=swap');

        :root {
          --page: #e8eef6;
          --card: #fff;
          --ink: #0f1b2d;
          --mut: #5b6b80;
          --line: #d6dfea;
          --brand: #2f86f6;
          --brand-d: #1c6ee0;
          --tint: #eaf2fe;
          --ok: #12995d;
          --warn: #b76e00;
          --soft: #f3f7fc;
          --head: #0f1b2d;
          --hmut: #5b6b80;
          box-sizing: border-box;
          padding-top: env(safe-area-inset-top, 0px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }

        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) {
            --page: #0b111d;
            --head: #f2f6fb;
            --hmut: #9fb0c6;
          }
        }
        :root[data-theme="dark"] {
          --page: #0b111d;
          --head: #f2f6fb;
          --hmut: #9fb0c6;
        }

        html {
          scroll-padding-top: env(safe-area-inset-top, 0px);
          -webkit-text-size-adjust: 100%;
        }

        *, *::before, *::after {
          box-sizing: inherit;
        }

        body {
          margin: 0;
          background: var(--page);
          font: 16px/1.5 "DM Sans", system-ui, sans-serif;
          color: var(--ink);
          -webkit-tap-highlight-color: transparent;
        }

        button, input {
          font-family: inherit;
        }

        .hide {
          display: none !important;
        }

        /* ══════════════════════════════════════════════════════════
           DESKTOP VIEWPORT STYLES (>= 768px): Custom Hosted Checkout
        ══════════════════════════════════════════════════════════ */
        @media (min-width: 768px) {
          .mobile-checkout-view {
            display: none !important;
          }

          .desktop-checkout-view {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            width: 100%;
            min-height: 100vh;
            background: #f2f3ff;
          }
        }

        /* ══════════════════════════════════════════════════════════
           MOBILE VIEWPORT STYLES (< 768px):
           Exact Mobile checkout (circular timer ring + bottom bar)
        ══════════════════════════════════════════════════════════ */
        @media (max-width: 767px) {
          .desktop-checkout-view {
            display: none !important;
          }

          .mobile-checkout-view {
            display: flex !important;
          }

          .app {
            max-width: 440px;
            margin: 0 auto;
            min-height: 100vh;
            min-height: 100dvh;
            display: flex;
            flex-direction: column;
            background: #f4f6fa;
          }

          .hd {
            background: #fff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 18px;
            border-bottom: 1px solid var(--line);
          }

          .sec {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12.5px;
            font-weight: 600;
            color: var(--mut);
          }

          .sec svg {
            color: var(--ok);
          }

          .prog {
            height: 3px;
            background: var(--tint);
          }

          .prog div {
            height: 100%;
            width: 100%;
            background: var(--brand);
            transition: width 1s linear, background 0.3s;
          }

          .prog.low div {
            background: #e8a317;
          }

          .scr {
            flex: 1;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            padding: 12px 16px 90px;
          }

          /* ── Mockup Phone Punch Hole / Camera Dot ── */
          .mob-phone-dot {
            width: 8px;
            height: 8px;
            background: #94a3b8;
            border-radius: 50%;
            margin: 4px auto 14px;
            opacity: 0.85;
          }

          /* ── Mobile Payment Method Overview Selection Styles ── */
          .mob-select-methods-wrap {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .mob-order-hero-card {
            background: linear-gradient(145deg, #ffffff 0%, #f8faff 100%);
            border: 1.5px solid #e2e8f0;
            border-radius: 24px;
            padding: 16px 18px;
            box-shadow: 0 4px 16px -2px rgba(15, 23, 42, 0.05);
          }

          .mob-order-hero-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid #edf2f7;
            margin-bottom: 10px;
          }

          .mob-merchant-info-row {
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 0;
          }

          .mob-biz-avatar {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            background: #0284c7;
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            font-weight: 800;
            flex-shrink: 0;
            box-shadow: 0 2px 6px rgba(2, 132, 199, 0.2);
          }

          .mob-biz-details {
            min-width: 0;
            text-align: left;
          }

          .mob-biz-name-row {
            display: flex;
            align-items: center;
            gap: 5px;
          }

          .mob-biz-title {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 135px;
          }

          .mob-verified-check {
            display: inline-flex;
            align-items: center;
            flex-shrink: 0;
          }

          .mob-biz-sub {
            display: block;
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
            margin-top: 1px;
          }

          .mob-order-amt-block {
            text-align: right;
            flex-shrink: 0;
          }

          .mob-order-hero-lbl {
            font-size: 10px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            display: block;
            margin-bottom: 2px;
          }

          .mob-order-hero-amt {
            font-size: 22px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.03em;
            line-height: 1.1;
            font-variant-numeric: tabular-nums;
          }

          .mob-order-hero-specs {
            display: flex;
            flex-direction: column;
            gap: 7px;
            font-size: 11.5px;
          }

          .mob-spec-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 3px 0;
            border-bottom: 1px dashed #f1f5f9;
          }

          .mob-spec-row:last-child {
            border-bottom: none;
            padding-bottom: 0;
          }

          .mob-spec-k {
            color: #64748b;
            font-weight: 600;
            font-size: 11px;
          }

          .mob-spec-v {
            color: #0f172a;
            font-weight: 700;
            font-size: 11.5px;
          }

          .mob-spec-v-wrap {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .mob-spec-code {
            font-family: 'IBM Plex Mono', monospace;
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            color: #0f172a;
          }

          .mob-copy-ref-btn {
            background: none;
            border: none;
            padding: 2px 4px;
            cursor: pointer;
            color: #0284c7;
            display: flex;
            align-items: center;
            font-size: 11px;
          }

          .mob-copy-done {
            color: #059669;
            font-weight: 700;
            font-size: 10.5px;
          }

          .mob-fee-waived {
            color: #059669;
            font-weight: 700;
          }

          .mob-secure-route {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: #0284c7;
            font-weight: 700;
            font-size: 11px;
          }

          .mob-choose-hdr {
            margin: 4px 2px 0;
            text-align: left;
          }

          .mob-choose-hdr h3 {
            margin: 0;
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.01em;
          }

          .mob-choose-hdr p {
            margin: 2px 0 0;
            font-size: 12px;
            color: #64748b;
            font-weight: 500;
          }

          .mob-methods-stack {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }

          .mob-method-opt-btn {
            all: unset;
            display: flex;
            align-items: center;
            gap: 14px;
            background: #ffffff;
            border: 1.5px solid #edf2f7;
            border-radius: 18px;
            padding: 14px 16px;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
            transition: all 0.15s ease;
            box-sizing: border-box;
            width: 100%;
            text-align: left;
          }

          .mob-method-opt-btn:active {
            transform: scale(0.985);
            border-color: #0284C7;
            background: #f8fafc;
          }

          .mob-opt-icon {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            display: grid;
            place-items: center;
            flex-shrink: 0;
          }

          .mob-opt-upi {
            background: #e0f2fe;
            color: #0284C7;
          }

          .mob-opt-card {
            background: #f1f5f9;
            color: #2563eb;
          }

          .mob-opt-bank {
            background: #f1f5f9;
            color: #475569;
          }

          .mob-opt-crypto {
            background: #fef3c7;
            color: #d97706;
          }

          .mob-opt-cod {
            background: #ecfdf5;
            color: #059669;
          }

          .mob-opt-body {
            flex: 1;
            min-width: 0;
          }

          .mob-opt-title-row {
            display: flex;
            align-items: center;
            gap: 6px;
            flex-wrap: wrap;
            margin-bottom: 2px;
          }

          .mob-opt-title {
            font-size: 14.5px;
            font-weight: 800;
            color: #0f172a;
            line-height: 1.2;
          }

          .mob-opt-tag-green {
            background: #ecfdf5;
            color: #059669;
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 6px;
            line-height: 1.2;
          }

          .mob-opt-tag-blue {
            background: #eff6ff;
            color: #1d4ed8;
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 6px;
            line-height: 1.2;
          }

          .mob-opt-tag-gray {
            background: #f1f5f9;
            color: #475569;
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 6px;
            line-height: 1.2;
          }

          .mob-opt-tag-amber {
            background: #fef3c7;
            color: #b45309;
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 6px;
            line-height: 1.2;
          }

          .mob-opt-tag-emerald {
            background: #ecfdf5;
            color: #047857;
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 6px;
            line-height: 1.2;
          }

          .mob-opt-sub {
            font-size: 11.5px;
            color: #64748b;
            font-weight: 500;
            line-height: 1.3;
            display: block;
          }

          .mob-opt-chevron {
            color: #94a3b8;
            font-size: 20px;
            font-weight: 400;
            flex-shrink: 0;
          }

          .mob-overview-trust {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-top: 4px;
            font-size: 12px;
            font-weight: 600;
            color: #059669;
          }

          /* ── Mobile Back / Change Method Bar ── */
          .mob-active-method-view {
            display: flex;
            flex-direction: column;
          }

          .mob-back-methods-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 4px 2px;
          }

          .mob-back-btn {
            all: unset;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 12.5px;
            font-weight: 700;
            color: #0284C7;
            cursor: pointer;
            padding: 6px 12px;
            border-radius: 10px;
            background: #eff6ff;
            transition: all 0.15s ease;
          }

          .mob-back-btn:active {
            transform: scale(0.97);
            background: #dbeafe;
          }

          .mob-active-method-tag {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            background: #f1f5f9;
            padding: 4px 10px;
            border-radius: 9999px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          /* ── Mobile Checkout Pure Solid White Card ── */
          .mob-checkout-card {
            background: #ffffff;
            border-radius: 28px;
            border: 1.5px solid #edf2f7;
            box-shadow: 0 10px 30px -4px rgba(16, 24, 40, 0.08), 0 4px 12px -2px rgba(16, 24, 40, 0.04);
            padding: 26px 18px 22px;
            text-align: center;
            margin-bottom: 16px;
          }

          /* ── Brand Header (M Mark + MyMobPay) ── */
          .mob-brand-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-bottom: 16px;
            user-select: none;
          }

          .mob-brand-title {
            font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-weight: 800;
            font-size: 26px;
            color: #1e293b;
            letter-spacing: -0.02em;
            line-height: 1;
          }

          /* ── TOTAL: ₹1,250.00 ── */
          .mob-total-display {
            font-size: 23px;
            font-weight: 800;
            color: #1e293b;
            letter-spacing: 0.03em;
            margin-bottom: 12px;
            line-height: 1.2;
            text-transform: uppercase;
          }

          /* ── Pill: Expires in: mm:ss ── */
          .mob-timer-pill-wrap {
            display: flex;
            justify-content: center;
            margin-bottom: 22px;
          }

          .mob-timer-pill {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            padding: 5px 16px;
            border-radius: 9999px;
            font-size: 13px;
            box-shadow: 0 1px 2px rgba(16, 24, 40, 0.03);
          }

          .mob-timer-pill.low {
            background: #fef3c7;
            border-color: #fde68a;
          }

          .mob-timer-label {
            color: #64748b;
            font-weight: 500;
            font-size: 12.5px;
          }

          .mob-timer-digits {
            color: #0f172a;
            font-weight: 700;
            font-family: 'IBM Plex Mono', monospace;
            font-size: 13px;
            letter-spacing: 0.03em;
          }

          .mob-timer-pill.low .mob-timer-label,
          .mob-timer-pill.low .mob-timer-digits {
            color: #b45309;
          }

          /* ── Themed QR Stand with Orange Corners ── */
          .mob-qr-container {
            display: flex;
            justify-content: center;
            margin-bottom: 18px;
          }

          .mob-qr-frame {
            position: relative;
            padding: 14px;
            background: #ffffff;
            display: inline-block;
          }

          .mob-corner {
            position: absolute;
            width: 30px;
            height: 30px;
            border: 3.5px solid #e07a27;
            pointer-events: none;
          }

          .mob-corner-tl {
            top: 0;
            left: 0;
            border-right: none;
            border-bottom: none;
            border-top-left-radius: 12px;
          }

          .mob-corner-tr {
            top: 0;
            right: 0;
            border-left: none;
            border-bottom: none;
            border-top-right-radius: 12px;
          }

          .mob-corner-bl {
            bottom: 0;
            left: 0;
            border-right: none;
            border-top: none;
            border-bottom-left-radius: 12px;
          }

          .mob-corner-br {
            bottom: 0;
            right: 0;
            border-left: none;
            border-top: none;
            border-bottom-right-radius: 12px;
          }

          .mob-qr-inner {
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            background: #ffffff;
          }

          .mob-qr-center-pill {
            position: absolute;
            inset: 0;
            margin: auto;
            width: 44px;
            height: 44px;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid #f1f5f9;
            pointer-events: none;
          }

          /* ── Verified Merchant Badge ── */
          .mob-merchant-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: #ecfdf5;
            border: 1px solid #d1fae5;
            color: #065f46;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 12px;
            border-radius: 9999px;
            margin-bottom: 4px;
          }

          /* ── Payment Verification Advisory Line ── */
          .mob-verify-notice {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #fffbeb;
            border: 1px solid #fef08a;
            border-radius: 14px;
            padding: 8px 12px;
            margin: 10px 0 4px;
            text-align: left;
            box-shadow: 0 1px 3px rgba(245, 158, 11, 0.06);
          }

          .mob-verify-icon-box {
            position: relative;
            width: 28px;
            height: 28px;
            border-radius: 8px;
            background: #fef3c7;
            border: 1px solid #fde68a;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: #b45309;
          }

          .mob-verify-ping {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #f59e0b;
            animation: mob-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          }

          .mob-verify-dot {
            position: absolute;
            top: -2px;
            right: -2px;
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #d97706;
          }

          @keyframes mob-ping {
            75%, 100% {
              transform: scale(2.2);
              opacity: 0;
            }
          }

          .mob-verify-text {
            flex: 1;
            font-size: 11.5px;
            line-height: 1.4;
            color: #78350f;
          }

          .mob-verify-title {
            font-weight: 700;
            color: #92400e;
            display: inline;
          }

          .mob-verify-desc {
            font-weight: 500;
            color: #b45309;
            display: inline;
          }

          /* ── Direct UPI App Launcher Row ── */
          .mob-upi-apps-row {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px dashed #e2e8f0;
          }

          .mob-action-hint {
            margin: 0 0 10px;
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            text-align: center;
          }

          .mob-chips-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }

          .mob-app-chip {
            all: unset;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 44px;
            padding: 6px 8px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
            transition: transform 0.15s, border-color 0.15s;
          }

          .mob-app-chip:active {
            transform: scale(0.96);
          }

          /* ── UPI ID Copy Bar ── */
          .mob-upi-id-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 8px 8px 8px 14px;
            margin-top: 14px;
            text-align: left;
          }

          .mob-upi-id-left {
            min-width: 0;
            display: flex;
            flex-direction: column;
          }

          .mob-upi-id-label {
            font-size: 10.5px;
            font-weight: 700;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }

          .mob-upi-id-val {
            font-family: 'IBM Plex Mono', monospace;
            font-size: 13.5px;
            font-weight: 600;
            color: #0f172a;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .mob-copy-btn {
            border: 0;
            background: #eaf2fe;
            color: #1c6ee0;
            font-weight: 700;
            font-size: 13px;
            padding: 0 16px;
            min-height: 38px;
            border-radius: 10px;
            cursor: pointer;
            flex: none;
            transition: all 0.15s;
          }

          .mob-copy-btn.done {
            background: #dcfce7;
            color: #15803d;
          }

          .sum {
            background: #fff;
            border-radius: 22px;
            padding: 18px 18px 16px;
            box-shadow: 0 1px 2px rgba(16,24,40,.06), 0 14px 28px -18px rgba(16,24,40,.22);
          }

          .top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }

          .mer {
            display: flex;
            align-items: center;
            gap: 12px;
            min-width: 0;
          }

          .av {
            width: 44px;
            height: 44px;
            border-radius: 14px;
            background: var(--tint);
            color: var(--brand-d);
            display: grid;
            place-items: center;
            font-weight: 800;
            font-size: 18px;
            flex: none;
          }

          .mer b {
            display: block;
            font-size: 17px;
            line-height: 1.2;
          }

          .mer small {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 12.5px;
            color: var(--ok);
            font-weight: 600;
            margin-top: 2px;
          }

          .ringw {
            position: relative;
            width: 60px;
            height: 60px;
            flex: none;
            text-align: center;
          }

          .ringw svg {
            display: block;
            width: 100%;
            height: 100%;
          }

          .ringw .tm {
            position: absolute;
            inset: 0;
            display: grid;
            place-items: center;
            font-size: 12.5px;
            font-weight: 700;
            color: var(--ink);
          }

          .rg-bg {
            stroke: var(--tint);
          }

          .rg-fg {
            stroke: var(--brand);
            transition: stroke-dashoffset 1s linear, stroke 0.3s;
          }

          .ringw.low .rg-fg {
            stroke: #e8a317;
          }

          .ringw.low .tm {
            color: #8a5a00;
          }

          .lab {
            margin: 20px 0 0;
            font-size: 13.5px;
            font-weight: 600;
            color: var(--mut);
          }

          .amt {
            font-size: 46px;
            font-weight: 800;
            letter-spacing: -0.035em;
            line-height: 1.1;
            margin: 2px 0 16px;
            font-variant-numeric: tabular-nums;
          }

          .amt s {
            text-decoration: none;
            font-size: 26px;
            color: #98a2b3;
            font-weight: 700;
          }

          .meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }

          .meta div {
            background: var(--soft);
            border-radius: 14px;
            padding: 10px 12px;
          }

          .meta small {
            display: block;
            font-size: 12px;
            color: var(--mut);
            line-height: 1.2;
          }

          .meta b {
            font-size: 14.5px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 6px;
            margin-top: 3px;
            font-variant-numeric: tabular-nums;
          }

          .meta .free {
            background: #dcf5e8;
            color: #0d7a47;
            font-size: 11px;
            border-radius: 999px;
            padding: 1px 7px;
          }

          .gh {
            margin: 22px 4px 8px;
            font-size: 13.5px;
            font-weight: 700;
            color: var(--mut);
          }

          .card {
            background: var(--card);
            border-radius: 18px;
            box-shadow: 0 1px 2px rgba(16,24,40,.06), 0 10px 24px -16px rgba(16,24,40,.18);
            overflow: hidden;
          }

          .row {
            all: unset;
            box-sizing: border-box;
            width: 100%;
            min-height: 62px;
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 10px 16px;
            border-bottom: 1px solid var(--line);
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            color: var(--ink);
            text-decoration: none;
          }

          .row .ch {
            margin-left: auto;
            color: #98a2b3;
            font-size: 20px;
            transition: transform 0.2s;
          }

          .row[aria-expanded="true"] .ch {
            transform: rotate(90deg);
          }

          .row small {
            display: block;
            font-weight: 500;
            color: var(--mut);
            font-size: 13px;
            line-height: 1.3;
            margin-top: 1px;
          }

          .ic {
            width: 42px;
            height: 42px;
            border-radius: 13px;
            background: var(--tint);
            color: var(--brand-d);
            display: grid;
            place-items: center;
            flex: none;
          }

          .ic svg {
            width: 20px;
            height: 20px;
            stroke: currentColor;
            fill: none;
            stroke-width: 1.8;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .badge {
            background: #dcf5e8;
            color: #0d7a47;
            font-size: 11.5px;
            border-radius: 999px;
            padding: 2px 8px;
            font-weight: 700;
            margin-left: 6px;
          }

          .pn {
            display: none;
            padding: 6px 16px 18px;
            border-bottom: 1px solid var(--line);
            background: var(--soft);
          }

          .pn.show {
            display: block;
          }

          .qrf {
            position: relative;
            width: 190px;
            margin: 10px auto 16px;
            padding: 12px;
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 16px;
          }

          .qrf i {
            position: absolute;
            width: 18px;
            height: 18px;
            border: 3.5px solid #ff7800;
            border-radius: 6px;
          }

          .qrf i:nth-child(1) { top: -2px; left: -2px; border-right: 0; border-bottom: 0; }
          .qrf i:nth-child(2) { top: -2px; right: -2px; border-left: 0; border-bottom: 0; }
          .qrf i:nth-child(3) { bottom: -2px; left: -2px; border-right: 0; border-top: 0; }
          .qrf i:nth-child(4) { bottom: -2px; right: -2px; border-left: 0; border-top: 0; }

          .qrbox svg {
            display: block;
            width: 100%;
            height: auto;
          }

          .id {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
            background: #fff;
            border: 1px solid var(--line);
            border-radius: 12px;
            padding: 6px 6px 6px 12px;
            font: 500 13px "IBM Plex Mono", monospace;
            min-height: 48px;
          }

          .id span {
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-all;
          }

          .cp {
            border: 0;
            background: var(--tint);
            color: var(--brand-d);
            font-weight: 700;
            font-size: 13px;
            padding: 0 14px;
            min-height: 36px;
            border-radius: 9px;
            cursor: pointer;
            min-width: 64px;
            flex: none;
            transition: background 0.15s, color 0.15s;
          }

          .cp.done {
            background: #dcf5e8;
            color: #0d7a47;
          }

          .tip {
            font-size: 13px;
            color: var(--mut);
            margin: 10px 0 0;
          }

          .utrc {
            margin-top: 14px;
            background: var(--card);
            border-radius: 16px;
            padding: 4px 16px;
            box-shadow: 0 1px 2px rgba(16,24,40,.06);
          }

          .utrc > button.t {
            all: unset;
            width: 100%;
            min-height: 52px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 700;
            font-size: 14.5px;
            color: var(--brand-d);
            cursor: pointer;
          }

          .utr {
            display: flex;
            gap: 8px;
            padding-bottom: 14px;
          }

          .utr input {
            flex: 1;
            min-width: 0;
            min-height: 50px;
            border: 1px solid #d0d5dd;
            border-radius: 12px;
            padding: 0 14px;
            font: 500 16px "IBM Plex Mono", monospace;
            background: #fff;
            color: var(--ink);
            letter-spacing: 0.04em;
          }

          .utr button {
            min-height: 50px;
            padding: 0 18px;
            border: 0;
            border-radius: 12px;
            background: var(--brand);
            color: #fff;
            font-weight: 700;
            font-size: 15px;
            cursor: pointer;
          }

          .utr button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .trust {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 7px;
            margin: 18px 8px 0;
            font-size: 12.5px;
            color: var(--mut);
            text-align: center;
          }

          .trust svg {
            flex: none;
            color: var(--ok);
          }

          .pc {
            padding: 18px 16px 18px;
          }

          .pc .qrf {
            margin: 0 auto 12px;
          }

          .pc .cap {
            text-align: center;
            font-weight: 700;
            font-size: 14px;
            margin: 0 0 14px;
          }

          .how {
            list-style: none;
            margin: 16px 0 0;
            padding: 0;
            counter-reset: h;
          }

          .how li {
            counter-increment: h;
            display: flex;
            gap: 10px;
            align-items: center;
            font-size: 13.5px;
            color: var(--mut);
            padding: 5px 0;
          }

          .how li::before {
            content: counter(h);
            flex: none;
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: var(--tint);
            color: var(--brand-d);
            font-weight: 700;
            font-size: 12px;
            display: grid;
            place-items: center;
          }

          /* ── Fixed Bottom bar on mobile ── */
          .bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 50;
            max-width: 440px;
            margin: 0 auto;
            background: #fff;
            border-top: 1px solid var(--line);
            padding: 12px 18px calc(14px + env(safe-area-inset-bottom, 0px));
            display: flex;
            align-items: center;
            gap: 16px;
          }

          .bar .t small {
            display: block;
            color: var(--mut);
            font-size: 12px;
            line-height: 1.2;
          }

          .bar .t b {
            font-size: 19px;
            letter-spacing: -0.02em;
            font-variant-numeric: tabular-nums;
          }

          .pri {
            border: 0;
            background: var(--brand);
            color: #fff;
            border-radius: 14px;
            min-height: 52px;
            padding: 0 22px;
            font-weight: 700;
            font-size: 16px;
            cursor: pointer;
            box-shadow: 0 12px 22px -14px var(--brand);
            transition: background 0.15s, transform 0.1s;
          }

          .pri:active {
            background: var(--brand-d);
            transform: scale(0.99);
          }

          .bar .pri {
            flex: 1;
          }

          .wide {
            width: 100%;
          }

          .ghost {
            border: 0;
            background: none;
            color: var(--brand-d);
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            min-height: 44px;
            padding: 0 4px;
          }

          .panel {
            background: var(--card);
            border-radius: 22px;
            padding: 34px 20px 22px;
            box-shadow: 0 1px 2px rgba(16,24,40,.06), 0 10px 24px -16px rgba(16,24,40,.18);
            text-align: center;
          }

          .panel h2 {
            margin: 18px 0 6px;
            font-size: 22px;
            letter-spacing: -0.02em;
          }

          .panel p {
            margin: 0 auto;
            color: var(--mut);
            font-size: 14.5px;
            max-width: 30ch;
          }

          .sp-spinner {
            width: 48px;
            height: 48px;
            margin: 0 auto;
            display: block;
            animation: spin 0.85s linear infinite !important;
            transform-origin: 50% 50%;
          }

          .okc {
            width: 84px;
            height: 84px;
            margin: 0 auto;
            display: block;
          }

          .okc circle {
            fill: #e6f7ee;
            stroke: var(--ok);
            stroke-width: 3;
            stroke-dasharray: 252;
            stroke-dashoffset: 252;
            animation: dr 0.6s ease-out forwards;
          }

          .okc path {
            fill: none;
            stroke: var(--ok);
            stroke-width: 5;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
            animation: dr 0.4s 0.5s ease-out forwards;
          }

          @keyframes dr {
            to { stroke-dashoffset: 0; }
          }

          .rcp {
            margin: 24px 0 18px;
            background: var(--soft);
            border-radius: 16px;
            padding: 4px 16px;
            text-align: left;
          }

          .rcp div {
            display: flex;
            justify-content: space-between;
            padding: 11px 0;
            font-size: 14px;
            color: var(--mut);
            border-bottom: 1px dashed #d8dde6;
          }

          .rcp div:last-child {
            border-bottom: 0;
          }

          .rcp div span:last-child {
            color: var(--ink);
            font-weight: 600;
          }

          .xic {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            background: #fff1d6;
            color: var(--warn);
            display: grid;
            place-items: center;
            margin: 0 auto;
          }

          .xic svg {
            width: 30px;
            height: 30px;
            stroke: currentColor;
            fill: none;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .track div, .prog div, .rg-fg { transition: none; }
          .sp, .sp-spinner { animation-duration: 2s; }
          .secure i { animation: none; }
          .okc circle, .okc path { animation-duration: 0.01s; animation-delay: 0s; }
        }
      `}</style>
      <Suspense fallback={
        <div style={{ minHeight: '100vh', background: '#e8eef6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, fontFamily: '"DM Sans",sans-serif', color: '#5b6b80', fontSize: 14, fontWeight: 600 }}>
          <div style={{ width: 36, height: 36, border: '3px solid #d6dfea', borderTopColor: '#2f86f6', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
          Loading checkout…
        </div>
      }>
        <PayPageContent />
      </Suspense>
    </>
  );
}
