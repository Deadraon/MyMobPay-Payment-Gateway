'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  QrCode,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Mail
} from 'lucide-react';
import { useParams } from 'next/navigation';

export default function TokenPayPage() {
  const params = useParams();
  const token = params?.token;

  const [loading, setLoading] = useState(true);
  const [pageState, setPageState] = useState('loading'); // 'loading' | 'active' | 'expired' | 'paid' | 'not_found' | 'error'
  const [linkData, setLinkData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmt, setCopiedAmt] = useState(false);

  // Payment execution state
  const [orderId, setOrderId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [utrInput, setUtrInput] = useState('');
  const [utrBusy, setUtrBusy] = useState(false);
  const [utrMsg, setUtrMsg] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // 1. Initial Load & Central Usability Check
  useEffect(() => {
    if (!token) {
      setPageState('not_found');
      setLoading(false);
      return;
    }

    async function loadLink() {
      try {
        setLoading(true);
        const res = await fetch(`/api/pay/${token}`);
        const data = await res.json();

        if (res.status === 404) {
          setPageState('not_found');
          setErrorMessage(data.error || 'Payment link not found.');
        } else if (res.status === 410) {
          setPageState('expired');
          setLinkData(data);
          setErrorMessage(data.error || 'This payment link has expired.');
        } else if (data.code === 'PAID' || data.status === 'paid') {
          setPageState('paid');
          setLinkData(data);
        } else if (res.ok && data.status === 'active') {
          setPageState('active');
          setLinkData(data);
          setTimeLeft(data.remaining_seconds || 0);

          // Automatically start checkout session / transition to processing
          startPaymentSession(token);
        } else {
          setPageState('error');
          setErrorMessage(data.error || 'Unable to load payment link.');
        }
      } catch (err) {
        setPageState('error');
        setErrorMessage('Failed to connect to gateway server.');
      } finally {
        setLoading(false);
      }
    }

    loadLink();
  }, [token]);

  // 2. Start payment session (atomic transition to 'processing')
  async function startPaymentSession(linkToken) {
    try {
      setIsProcessing(true);
      const res = await fetch(`/api/pay/${linkToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.order_id) {
        setOrderId(data.order_id);
      }
    } catch (e) {
      console.warn('Session init warning:', e);
    } finally {
      setIsProcessing(false);
    }
  }

  // 3. Live Countdown Timer
  useEffect(() => {
    if (pageState !== 'active' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPageState('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pageState, timeLeft]);

  // 4. Status Poller (Check if order got verified in background)
  useEffect(() => {
    if (!orderId || pageState !== 'active' || isVerified) return;

    const poller = setInterval(async () => {
      try {
        const res = await fetch('/api/orders/check-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId })
        });
        const data = await res.json();
        if (data.verified || data.status === 'verified' || data.status === 'paid') {
          setIsVerified(true);
          setPageState('paid');
          clearInterval(poller);
        }
      } catch (e) {}
    }, 4000);

    return () => clearInterval(poller);
  }, [orderId, pageState, isVerified]);

  // Format time remaining
  const formatTime = (secs) => {
    if (secs <= 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    if (m >= 60) {
      const h = Math.floor(m / 60);
      const remM = m % 60;
      return `${h}h ${remM}m ${s < 10 ? '0' : ''}${s}s`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Build UPI URI
  const upiId = linkData?.merchant?.upi_id || '9410181307@okbizaxis';
  const payeeName = linkData?.merchant?.business_name || 'MyMobPay Merchant';
  const amountStr = linkData?.amount_in_rupees || '0.00';
  const tnStr = orderId || linkData?.title || 'Payment';
  const rawUpiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(tnStr)}`;

  const handleCopy = (text, type) => {
    navigator.clipboard?.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAmt(true);
      setTimeout(() => setCopiedAmt(false), 2000);
    }
  };

  // Submit UTR
  const handleSubmitUtr = async (e) => {
    e.preventDefault();
    if (!utrInput || utrInput.trim().length < 8) {
      setUtrMsg('Please enter a valid 12-digit UTR or Reference Number.');
      return;
    }
    setUtrBusy(true);
    setUtrMsg('');

    try {
      const res = await fetch('/api/orders/verify-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          utr: utrInput.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.verified) {
        setIsVerified(true);
        setPageState('paid');
      } else {
        setUtrMsg(data.error || 'Payment under verification. Please wait a moment.');
      }
    } catch (err) {
      setUtrMsg('Network error verifying UTR. Please try again.');
    } finally {
      setUtrBusy(false);
    }
  };

  // ── VIEW 1: LOADING ──
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium text-sm">Verifying secure payment link...</p>
      </div>
    );
  }

  // ── VIEW 2: 404 NOT FOUND (Zero Information Leak) ──
  if (pageState === 'not_found') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Payment Link Not Found</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            The payment link you are attempting to open does not exist, has closed, or the token is invalid.
          </p>
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-500 mb-6 text-left">
            If you received this link via message or email, please contact the sender directly to request a valid link.
          </div>
          <a
            href="/"
            className="inline-flex items-center justify-center w-full px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
          >
            Return to Homepage
          </a>
        </div>
      </div>
    );
  }

  // ── VIEW 3: 410 EXPIRED ──
  if (pageState === 'expired') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-5">
            <Clock className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold mb-3">
            HTTP 410 • Link Expired
          </span>
          <h1 className="text-2xl font-bold text-white mb-2">This payment link has expired</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            For security reasons, this payment request had a set expiry time and can no longer accept transactions.
          </p>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-left mb-6 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Merchant:</span>
              <span className="font-medium text-slate-200">{linkData?.merchant_name || 'MyMobPay Merchant'}</span>
            </div>
            {linkData?.expires_at && (
              <div className="flex justify-between text-slate-400">
                <span>Expired At:</span>
                <span className="text-slate-300">{new Date(linkData.expires_at).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <a
              href={`mailto:support@mymob.tech?subject=Requesting%20New%20Payment%20Link&body=Hello,%20my%20payment%20link%20expired.`}
              className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition shadow-lg shadow-blue-600/20"
            >
              <Mail className="w-4 h-4" />
              Contact Merchant For New Link
            </a>
            <p className="text-xs text-slate-500 mt-2">
              If money was debited from your bank, our gateway honors bank credits and will notify the merchant.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW 4: ALREADY PAID ──
  if (pageState === 'paid') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-semibold mb-3">
            Payment Completed
          </span>
          <h1 className="text-2xl font-bold text-white mb-2">Already Paid</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            This payment link has already been settled and processed successfully.
          </p>

          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-left mb-6 space-y-3 text-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-slate-400">Amount Paid:</span>
              <span className="text-xl font-bold text-emerald-400">
                ₹{linkData?.amount_in_rupees || amountStr}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Merchant:</span>
              <span className="font-medium text-slate-200">{linkData?.merchant_name || payeeName}</span>
            </div>
            {linkData?.paid_at && (
              <div className="flex justify-between text-slate-400">
                <span>Paid Date:</span>
                <span className="text-slate-300">{new Date(linkData.paid_at).toLocaleString('en-IN')}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Verified via NPCI UPI Rails • MyMobPay
          </div>
        </div>
      </div>
    );
  }

  // ── VIEW 5: ACTIVE CHECKOUT VIEW ──
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 antialiased">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Top Header & Branding */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-800/80 mb-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">Verified Checkout</span>
            <h2 className="text-lg font-bold text-white truncate">{payeeName}</h2>
          </div>
          {/* Expiry Countdown Chip */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition ${
            timeLeft < 180 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse' : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
          }`}>
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {/* Amount Box */}
        <div className="text-center py-4 bg-slate-950/70 border border-slate-800/90 rounded-2xl mb-6">
          <span className="text-xs text-slate-400 font-medium">Total Payable</span>
          <div className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-0.5">
            ₹{amountStr}
          </div>
          {linkData?.title && (
            <p className="text-xs text-slate-400 mt-1 truncate px-4">{linkData.title}</p>
          )}
        </div>

        {/* UPI QR Code */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="p-4 bg-white rounded-2xl shadow-lg border-2 border-slate-200">
            <QRCode value={rawUpiUri} size={190} level="M" />
          </div>
          <span className="text-[11px] text-slate-400 mt-2.5 flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-blue-400" />
            Scan using any UPI app (GPay, PhonePe, Paytm, BHIM)
          </span>
        </div>

        {/* 1-Click UPI Deep Links on Mobile */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <a
            href={`gpay://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(tnStr)}`}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-200 transition"
          >
            Google Pay
          </a>
          <a
            href={`phonepe://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(tnStr)}`}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-200 transition"
          >
            PhonePe
          </a>
          <a
            href={`paytmmp://upi/pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountStr}&cu=INR&tn=${encodeURIComponent(tnStr)}`}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-200 transition"
          >
            Paytm
          </a>
          <a
            href={rawUpiUri}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-600 hover:bg-blue-500 border border-blue-500 rounded-xl text-xs font-semibold text-white transition"
          >
            Open UPI App
          </a>
        </div>

        {/* Copy VPA Option */}
        <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 mb-6 flex items-center justify-between text-xs">
          <div className="truncate mr-2">
            <span className="text-slate-500 block text-[10px] uppercase font-bold">UPI ID (VPA)</span>
            <span className="text-slate-300 font-mono font-medium truncate">{upiId}</span>
          </div>
          <button
            onClick={() => handleCopy(upiId, 'upi')}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition"
          >
            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* UTR Form */}
        <form onSubmit={handleSubmitUtr} className="pt-4 border-t border-slate-800/80">
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Paid? Enter 12-Digit Bank UTR / Reference:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. 428190284918"
              value={utrInput}
              onChange={(e) => setUtrInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={utrBusy}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center"
            >
              {utrBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Confirm'}
            </button>
          </div>
          {utrMsg && (
            <p className="text-xs text-amber-400 mt-2 font-medium">{utrMsg}</p>
          )}
        </form>

        {/* Footer Security Badges */}
        <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>256-Bit Encrypted</span>
          </div>
          <span>MyMobPay UPI Gateway</span>
        </div>
      </div>
    </div>
  );
}
