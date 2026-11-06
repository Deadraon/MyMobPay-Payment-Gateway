'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CONFIG } from '@/lib/config';
import {
  ArrowRight, CheckCircle2, ChevronRight, Menu, X,
  ShieldCheck, Zap, Layers, RefreshCw, Landmark, Code,
  Sparkles, QrCode, Copy, Check, Terminal, CreditCard,
  FileText, ArrowUpRight, Lock
} from 'lucide-react';
import QRCode from 'react-qr-code';

const MyMobPayLogo = ({ className = '', textColor = '#0B192C', markSize = 28, textSize = 'text-lg sm:text-xl' }) => {
  return (
    <div className={`inline-flex items-center gap-2 select-none shrink-0 ${className}`}>
      <Image
        src="/logos/mymobpay_mark.png"
        alt="MyMobPay"
        width={markSize}
        height={markSize}
        className="object-contain shrink-0"
        style={{ width: `${markSize}px`, height: `${markSize}px` }}
      />
      <span
        className={`font-semibold tracking-tight leading-none whitespace-nowrap ${textSize}`}
        style={{
          fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: textColor,
          letterSpacing: '-0.3px'
        }}
      >
        MyMobPay
      </span>
    </div>
  );
};

const InstagramIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function HomePage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [monthlyVolume, setMonthlyVolume] = useState(500000); // 5 Lakhs
  const [productDevLang, setProductDevLang] = useState('curl');
  const [copiedDevSnippet, setCopiedDevSnippet] = useState(false);

  // Google OAuth Callback Forwarder
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasAuthCallback = window.location.hash.includes('access_token') || window.location.search.includes('code=');
    if (hasAuthCallback) {
      router.replace(`/login?googleAuth=true${window.location.hash || window.location.search}`);
    }
  }, [router]);

  // Mobile menu lock
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const subscriptionFee = CONFIG.subscriptionFee || 499;

  // Real fee calculations
  const savings = useMemo(() => {
    const traditionalMdr = monthlyVolume * 0.02; // 2% typical fee
    const traditionalGst = traditionalMdr * 0.18; // 18% GST
    const traditionalTotal = traditionalMdr + traditionalGst;
    const netSaved = Math.max(0, traditionalTotal - subscriptionFee);
    const pctSaved = traditionalTotal > 0 ? Math.round((netSaved / traditionalTotal) * 100) : 0;
    return {
      traditionalTotal,
      netSaved,
      pctSaved,
    };
  }, [monthlyVolume, subscriptionFee]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-sky-500/10 selection:text-[#0284C7]">

      {/* ── TOP ANNOUNCEMENT BANNER ── */}
      <div className="w-full bg-slate-900 text-white text-xs py-2 px-4 flex items-center justify-between sm:justify-center gap-3 select-none border-b border-slate-800">
        <div className="flex items-center gap-2 truncate">
          <span className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-400 font-medium px-2 py-0.5 rounded text-[11px] shrink-0 border border-sky-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Direct UPI 2.0
          </span>
          <span className="text-slate-300 text-xs truncate hidden sm:inline">
            Direct bank settlement via IMPS/UPI with 0% gateway fees.
          </span>
          <span className="text-slate-300 text-xs truncate sm:hidden">
            0% Gateway Fees · Direct Bank Settlement
          </span>
        </div>
        <a
          href="#pricing-section"
          className="text-xs text-sky-400 hover:text-sky-300 font-medium inline-flex items-center gap-1 shrink-0"
        >
          <span>Calculate savings</span>
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>

      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center select-none" aria-label="MyMobPay Home">
              <MyMobPayLogo />
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-600 font-medium">
              <Link href="#developer-section" className="hover:text-slate-900 transition-colors">Developers</Link>
              <Link href="#pricing-section" className="hover:text-slate-900 transition-colors">Pricing</Link>
              <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            </nav>
          </div>

          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=signup"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[96px] bottom-0 z-40 bg-white p-6 border-t border-slate-200 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <Link
              href="#developer-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-900 py-2 border-b border-slate-100"
            >
              Developers &amp; API
            </Link>
            <Link
              href="#pricing-section"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-900 py-2 border-b border-slate-100"
            >
              Pricing Calculator
            </Link>
            <Link
              href="/terms"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-900 py-2 border-b border-slate-100"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-base font-medium text-slate-900 py-2"
            >
              Privacy Policy
            </Link>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-200">
            <Link
              href="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full py-2.5 text-center text-sm font-medium text-slate-700 border border-slate-200 rounded-lg"
            >
              Sign In
            </Link>
            <Link
              href="/login?mode=signup"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full py-2.5 text-center text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
         HERO SECTION: ASYMMETRIC SPLIT WITH REAL CHECKOUT RECEIPT
         ──────────────────────────────────────────────────────── */}
      <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left: Clear, Specific Headline & Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Direct UPI 2.0 Rails</span>
                <span className="text-slate-300">·</span>
                <span className="text-[#0284C7] font-semibold">0% Gateway Fee</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-semibold text-slate-900 tracking-tight leading-[1.12]">
                Direct UPI payments straight to your bank account.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl font-normal">
                Collect UPI and IMPS transfers without the 2% aggregator deduction. Real-time automated verification, signed HMAC webhooks, and zero escrow holds.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/login?mode=signup"
                  className="px-6 py-3 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-medium rounded-lg text-center text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Start free sandbox</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#developer-section"
                  className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-lg text-center text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <span>Read documentation</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Verified Metrics Row */}
              <div className="pt-6 grid grid-cols-3 gap-6 border-t border-slate-100 max-w-md">
                <div>
                  <p className="text-2xl sm:text-3xl font-semibold text-slate-900 tabular-nums">0%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Per-transaction fee</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-semibold text-slate-900 tabular-nums">T+0</p>
                  <p className="text-xs text-slate-500 mt-0.5">Instant settlement</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-semibold text-slate-900 tabular-nums">99.98%</p>
                  <p className="text-xs text-slate-500 mt-0.5">Verified success rate</p>
                </div>
              </div>
            </div>

            {/* Right: Real Checkout Moment (Clean card, exact QR, no fake phone chassis) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="w-full max-w-[380px] bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">

                {/* Header with live status */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-semibold text-slate-900">Direct Bank Settlement</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">ORD_9821</span>
                </div>

                {/* Amount display */}
                <div className="text-center py-2 space-y-1">
                  <span className="text-xs text-slate-500 font-medium">Amount to pay</span>
                  <div className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight font-mono tabular-nums">
                    ₹1,499.00
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">0% fee deducted · 100% credited</p>
                </div>

                {/* Authentic QR Code with clear quiet zone */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-center space-y-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <QRCode
                      value="upi://pay?pa=9410181307@okbizaxis&pn=MyMobPay&am=1499.00&cu=INR&tn=ORD_9821"
                      size={168}
                      bgColor="#FFFFFF"
                      fgColor="#0B192C"
                      level="M"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Auto-verified via UTR reference</span>
                  </div>
                </div>

                {/* UPI app tags */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Pay with any UPI app</span>
                    <span className="font-mono text-[11px] text-slate-400">IMPS Rail</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium text-slate-700">
                    <span className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md">Google Pay</span>
                    <span className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md">PhonePe</span>
                    <span className="py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-md">Paytm</span>
                  </div>
                </div>

                {/* Webhook trigger indicator */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                    HMAC-SHA256 active
                  </span>
                  <span>Instant T+0</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── LOGO RAIL: WORKS WITH ALL UPI APPS ── */}
      <section className="py-10 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Works natively with every UPI application
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-semibold text-slate-700">
            <span>Google Pay</span>
            <span>PhonePe</span>
            <span>Paytm</span>
            <span>BHIM UPI</span>
            <span>Amazon Pay</span>
            <span>WhatsApp Pay</span>
            <span>Cred UPI</span>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         CONSOLE WALKTHROUGH: CLEAN DASHBOARD PREVIEW
         ──────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 space-y-12">

          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-semibold text-[#0284C7] bg-sky-50 border border-sky-200 px-3 py-1 rounded-full inline-block">
              Merchant Console
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900 tracking-tight">
              Real-time settlement visibility
            </h2>
            <p className="text-base text-slate-600 font-normal leading-relaxed">
              Monitor incoming transactions, inspect webhook delivery status, and review reconciliations from one quiet interface.
            </p>
          </div>

          {/* Browser frame preview */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">

            {/* Window chrome */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span className="font-mono text-slate-500 text-[11px] ml-2">console.mymobpay.tech</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700 font-medium text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Production active</span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="p-6 space-y-6">

              {/* Metric row */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <p className="text-xs text-slate-500">Gross volume (30d)</p>
                  <p className="text-xl sm:text-2xl font-semibold text-slate-900 font-mono tabular-nums">₹4,82,500</p>
                  <p className="text-xs text-emerald-600 font-medium">+12.4% vs last month</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <p className="text-xs text-slate-500">Transactions</p>
                  <p className="text-xl sm:text-2xl font-semibold text-slate-900 font-mono tabular-nums">1,842</p>
                  <p className="text-xs text-slate-500 font-medium">100% settled</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <p className="text-xs text-slate-500">Aggregator fee avoided</p>
                  <p className="text-xl sm:text-2xl font-semibold text-emerald-600 font-mono tabular-nums">₹11,387</p>
                  <p className="text-xs text-slate-500 font-medium">At 2% + 18% GST</p>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                  <p className="text-xs text-slate-500">Avg. settlement time</p>
                  <p className="text-xl sm:text-2xl font-semibold text-slate-900 font-mono tabular-nums">0.0s</p>
                  <p className="text-xs text-[#0284C7] font-medium">Direct IMPS credit</p>
                </div>
              </div>

              {/* Transactions table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Recent settled payments</span>
                  <span className="font-mono text-slate-500 font-normal text-[11px]">Real-time stream</span>
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {[
                    { id: 'ORD_9821', vpa: 'rajesh@okaxis', amount: '₹1,499.00', utr: '329184029182', time: '1 min ago' },
                    { id: 'ORD_9820', vpa: 'priya@okhdfcbank', amount: '₹499.00', utr: '329184028910', time: '4 mins ago' },
                    { id: 'ORD_9819', vpa: 'sneha@ybl', amount: '₹3,200.00', utr: '329184027415', time: '11 mins ago' },
                    { id: 'ORD_9818', vpa: 'arun@paytm', amount: '₹750.00', utr: '329184026842', time: '18 mins ago' },
                  ].map((tx) => (
                    <div key={tx.id} className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-slate-900 font-medium">{tx.id}</span>
                        <span className="text-slate-500 font-mono">{tx.vpa}</span>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <span className="font-mono text-slate-400 text-[11px]">UTR {tx.utr}</span>
                        <span className="font-semibold text-slate-900 font-mono tabular-nums">{tx.amount}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          Settled
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         DEVELOPER SECTION: RESTFUL API, SDKS, HMAC WEBHOOKS
         ──────────────────────────────────────────────────────── */}
      <section id="developer-section" className="py-20 sm:py-24 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 space-y-12">

          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-sky-400 text-xs font-mono font-medium">
              <Terminal className="w-3.5 h-3.5" />
              <span>Developer-first API</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
              Integrate in under 15 minutes.
            </h2>
            <p className="text-base text-slate-300 leading-relaxed font-normal">
              Direct-to-bank settlement with typed client SDKs, standard REST endpoints, and HMAC-SHA256 signed event callbacks.
            </p>
          </div>

          {/* 3 Developer Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Code className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Typed SDKs</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Official libraries for Next.js, Node.js, Python, PHP, Flutter, and React Native with complete type definitions.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">Standard REST APIs</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Deterministic HTTP endpoints for order creation, dynamic UPI QR generation, and real-time status lookups.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-white">HMAC-SHA256 Webhooks</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cryptographically signed event payloads sent directly to your backend with automatic exponential backoff retries.
              </p>
            </div>
          </div>

          {/* Code sandbox */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">

            {/* Language tabs & copy button */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-1">
                {[
                  { id: 'curl', label: 'cURL' },
                  { id: 'node', label: 'Node.js' },
                  { id: 'nextjs', label: 'Next.js' },
                  { id: 'python', label: 'Python' }
                ].map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setProductDevLang(lang.id)}
                    className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                      productDevLang === lang.id
                        ? 'bg-slate-800 text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setCopiedDevSnippet(true);
                  setTimeout(() => setCopiedDevSnippet(false), 2000);
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-mono px-2 py-1 rounded hover:bg-slate-800 transition-colors"
              >
                {copiedDevSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDevSnippet ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Code editor body */}
            <div className="p-5 font-mono text-xs sm:text-sm text-slate-200 overflow-x-auto leading-relaxed">
              {productDevLang === 'curl' && (
                <pre>
{`curl -X POST https://api.mymobpay.tech/v1/orders \\
  -H "Authorization: Bearer sec_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 149900,
    "currency": "INR",
    "orderId": "ORD_2026_9821",
    "customerVpa": "customer@okhdfcbank",
    "settlementRoute": "direct_bank"
  }'`}
                </pre>
              )}

              {productDevLang === 'node' && (
                <pre>
{`import { MyMobPay } from '@mymobpay/node';

const client = new MyMobPay({ apiKey: process.env.MYMOBPAY_SECRET_KEY });

// Create 0% fee direct bank payment order
const order = await client.orders.create({
  amount: 149900, // ₹1,499.00 in paise
  orderId: 'ORD_2026_9821',
  customerVpa: 'customer@okhdfcbank',
  settlementRoute: 'direct_bank'
});`}
                </pre>
              )}

              {productDevLang === 'nextjs' && (
                <pre>
{`// app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { MyMobPay } from '@mymobpay/node';

const gateway = new MyMobPay({ apiKey: process.env.MYMOBPAY_SECRET_KEY });

export async function POST(req: Request) {
  const { amount, orderId } = await req.json();
  const session = await gateway.orders.create({ amount, orderId });
  return NextResponse.json({ qrString: session.qrString, intentUrl: session.intentUrl });
}`}
                </pre>
              )}

              {productDevLang === 'python' && (
                <pre>
{`import os
from mymobpay import MyMobPay

client = MyMobPay(api_key=os.environ["MYMOBPAY_SECRET_KEY"])

order = client.orders.create(
    amount=149900,
    order_id="ORD_2026_9821",
    customer_vpa="customer@okhdfcbank",
    settlement_route="direct_bank"
)`}
                </pre>
              )}
            </div>

            {/* Webhook preview footer */}
            <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <span className="text-slate-300">
                Webhook Event: <strong className="text-emerald-400">payment.settled</strong>
              </span>
              <span className="text-slate-500 text-[11px]">HMAC verified (42ms)</span>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         INTERACTIVE SAVINGS CALCULATOR: CALM INK TONE
         ──────────────────────────────────────────────────────── */}
      <section id="pricing-section" className="py-20 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-semibold text-[#0284C7] uppercase tracking-wider">
                  Fee Comparison Calculator
                </span>
                <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                  Calculate how much you save every month.
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed font-normal">
                  Standard gateways deduct 2% plus 18% GST on every transaction. With MyMobPay&apos;s flat ₹499 monthly license, 100% of payment revenue arrives directly in your bank account.
                </p>

                {/* Range Slider */}
                <div className="space-y-3 pt-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Monthly UPI collection:</span>
                    <strong className="text-lg font-mono tabular-nums text-slate-900">
                      ₹{(monthlyVolume / 100000).toFixed(1)} Lakhs
                    </strong>
                  </div>
                  <input
                    type="range"
                    min="100000"
                    max="5000000"
                    step="50000"
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0EA5E9]"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>₹1 Lakh</span>
                    <span>₹25 Lakhs</span>
                    <span>₹50 Lakhs+</span>
                  </div>
                </div>
              </div>

              {/* Comparison Result Card */}
              <div className="lg:col-span-6">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-5">
                  <div className="space-y-3 pb-4 border-b border-slate-200 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Traditional gateway cost (2% + GST)</span>
                      <span className="font-mono text-rose-600 font-semibold tabular-nums">
                        -₹{savings.traditionalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">MyMobPay flat license</span>
                      <span className="font-mono text-emerald-700 font-semibold tabular-nums">
                        ₹{subscriptionFee}/mo (Fixed)
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-medium text-slate-500">Net monthly savings retained</span>
                    <div className="text-3xl sm:text-4xl font-semibold text-emerald-600 font-mono tabular-nums mt-1">
                      ₹{savings.netSaved.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      You retain <strong className="text-slate-900">{savings.pctSaved}%</strong> of the revenue otherwise lost to payment intermediary fees.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         PRICING CARDS
         ──────────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 text-center space-y-12">

          <div className="space-y-3 max-w-xl mx-auto">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-block">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900">
              Simple flat plans for any volume
            </h2>
            <p className="text-base text-slate-600 leading-relaxed font-normal">
              Zero percentage cuts. Choose the plan that fits your current operational scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">

            {/* Free Sandbox */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Developer Sandbox</h3>
                  <p className="text-xs text-slate-500 mt-1">Prototype and test webhook integration free.</p>
                </div>
                <div className="text-3xl font-semibold text-slate-900 font-mono">
                  ₹0 <span className="text-xs font-normal text-slate-500">/ month</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Isolated sandbox API keys</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Dynamic test checkout QR</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Webhook event delivery logger</li>
                </ul>
              </div>
              <Link
                href="/login"
                className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs text-center transition-colors"
              >
                Launch Sandbox
              </Link>
            </div>

            {/* Standard Pro */}
            <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col justify-between space-y-6 shadow-md relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Standard License</h3>
                  <span className="text-[11px] font-medium bg-sky-500/20 text-sky-400 border border-sky-500/30 px-2 py-0.5 rounded">
                    0% Gateway Fee
                  </span>
                </div>
                <p className="text-xs text-slate-300">For SaaS founders and live merchants.</p>
                <div className="text-3xl font-semibold text-white font-mono tabular-nums">
                  ₹{subscriptionFee} <span className="text-xs font-normal text-slate-400">/ month</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Direct bank account settlement</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> 0% transaction deduction</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> HMAC-SHA256 signed webhooks</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Automated bank email reconciliation</li>
                </ul>
              </div>
              <Link
                href="/login"
                className="w-full py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-medium rounded-lg text-xs text-center transition-colors"
              >
                Activate Standard License
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Custom High-Volume</h3>
                  <p className="text-xs text-slate-500 mt-1">For high-throughput payment architectures.</p>
                </div>
                <div className="text-2xl font-semibold text-slate-900">
                  Custom
                </div>
                <ul className="space-y-2 text-xs text-slate-600">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-400" /> Dedicated worker instances</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-400" /> Custom webhook retry schedules</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-slate-400" /> Multi-account bank routing</li>
                </ul>
              </div>
              <Link
                href="/login"
                className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium rounded-lg text-xs text-center transition-colors"
              >
                Contact Team
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         FOOTER
         ──────────────────────────────────────────────────────── */}
      <footer className="bg-white text-slate-500 py-16 border-t border-slate-200 text-xs">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-12 border-b border-slate-200">

          <div className="md:col-span-4 space-y-3">
            <Link href="/" className="flex items-center select-none">
              <MyMobPayLogo />
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed font-normal max-w-xs">
              Direct-to-bank UPI payment gateway infrastructure built to eliminate intermediary cuts for developers and SaaS founders.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-semibold text-slate-900">Product</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link href="#pricing-section" className="hover:text-slate-900 transition-colors">Pricing plans</Link></li>
              <li><Link href="#developer-section" className="hover:text-slate-900 transition-colors">Developers &amp; API</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-semibold text-slate-900">Comparisons &amp; Guides</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link href="/compare/razorpay" className="hover:text-slate-900 transition-colors">MyMobPay vs Razorpay</Link></li>
              <li><Link href="/compare/cashfree" className="hover:text-slate-900 transition-colors">MyMobPay vs Cashfree</Link></li>
              <li><Link href="/compare/uapi-gateway" className="hover:text-slate-900 transition-colors">Best UPI Gateway 2026</Link></li>
              <li><Link href="/blog/direct-bank-settlement-vs-aggregator" className="hover:text-slate-900 transition-colors">Direct Settlement Guide</Link></li>
              <li><Link href="/blog/uapi-integration-guide" className="hover:text-slate-900 transition-colors">Next.js Integration Guide</Link></li>
              <li><Link href="/blog/payment-gateway-for-saas" className="hover:text-slate-900 transition-colors">Payment Gateway for SaaS</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-semibold text-slate-900">Legal &amp; Social</p>
            <ul className="space-y-2 text-xs text-slate-600">
              <li><Link href="/terms" className="hover:text-slate-900 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy Policy</Link></li>
              <li>
                <a
                  href="https://instagram.com/mymobpay"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-900 transition-colors flex items-center gap-1.5"
                >
                  <InstagramIcon className="w-3.5 h-3.5 text-slate-400" />
                  Instagram (@mymobpay)
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} MyMobPay Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              NPCI UPI 2.0 Rails Active
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
