'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CONFIG } from '@/lib/config';
import { Sun, Moon, Check, Copy, Menu, X } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [pageTheme, setPageTheme] = useState('light'); // 'light' | 'dark'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [monthlyVolume, setMonthlyVolume] = useState(500000); // 5 Lakhs default
  const [activeLangTab, setActiveLangTab] = useState('curl'); // 'curl' | 'node' | 'next' | 'python' | 'php'
  const [copiedCode, setCopiedCode] = useState(false);

  // Settlement simulation states
  const [simStep, setSimStep] = useState(1); // 1: intent, 2: switch, 3: settled
  const [isSimulating, setIsSimulating] = useState(false);

  // Dynamic rotating hero headlines
  const heroLines = useMemo(() => [
    'Zero gateway fees.',
    'Instant bank credit.',
    '0% transaction charges.',
    'Real-time T+0 settlement.',
    'Direct UPI to your account.'
  ], []);

  const [typedLine, setTypedLine] = useState(heroLines[0]);
  const [lineIndex, setLineIndex] = useState(0);
  const [isDeletingLine, setIsDeletingLine] = useState(false);
  const [charIndex, setCharIndex] = useState(heroLines[0].length);
  const [typingSpeed, setTypingSpeed] = useState(100);

  // Typing animation effect
  useEffect(() => {
    const handleType = () => {
      const current = heroLines[lineIndex];
      if (isDeletingLine) {
        setTypedLine(current.substring(0, charIndex - 1));
        setCharIndex((prev) => prev - 1);
        setTypingSpeed(45);
      } else {
        setTypedLine(current.substring(0, charIndex + 1));
        setCharIndex((prev) => prev + 1);
        setTypingSpeed(95);
      }

      if (!isDeletingLine && charIndex === current.length) {
        setTypingSpeed(2400); // pause on full text
        setIsDeletingLine(true);
      } else if (isDeletingLine && charIndex === 0) {
        setIsDeletingLine(false);
        setLineIndex((prev) => (prev + 1) % heroLines.length);
        setTypingSpeed(300);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [charIndex, isDeletingLine, lineIndex, typingSpeed, heroLines]);

  // Read theme from localStorage or system preference on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('pageTheme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setPageTheme(savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setPageTheme('dark');
      }
    } catch (e) {}
  }, []);

  const isDark = pageTheme === 'dark';

  // Toggle page theme and sync class on root document
  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setPageTheme(nextTheme);
    try {
      localStorage.setItem('pageTheme', nextTheme);
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Currency formatter
  const formatINR = (val) => {
    return '₹' + Math.round(val).toLocaleString('en-IN');
  };

  // Savings calculations
  const subscriptionFee = CONFIG.subscriptionFee || 499;
  const monthlyCut = monthlyVolume * 0.02;
  const annualCut = monthlyCut * 12;
  const annualSub = subscriptionFee * 12;
  const netSavings = Math.max(0, annualCut - annualSub);

  // Simulation handler
  const handleSimulatePayment = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(2); // routing via switch
    setTimeout(() => {
      setSimStep(3); // settled & webhook dispatched
      setIsSimulating(false);
    }, 1800);
  };

  const handleResetSimulation = () => {
    setSimStep(1);
    setIsSimulating(false);
  };

  // Code snippets by language tab
  const codeSnippets = {
    curl: `curl -X POST https://api.mymobpay.tech/v1/orders \\
  -H "Authorization: Bearer sec_live_948a201..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 149900,
    "currency": "INR",
    "orderId": "ORD_2026_9821",
    "customerVpa": "customer@okhdfcbank",
    "settlementRoute": "direct_bank"
  }'`,
    node: `import { MyMobPay } from '@mymobpay/node';

const client = new MyMobPay({ apiKey: process.env.MYMOBPAY_SECRET_KEY });

const order = await client.orders.create({
  amount: 1499.00,
  orderId: 'ORD_2026_9821',
  customerVpa: 'customer@okhdfcbank',
  settlementRoute: 'direct_bank'
});
console.log('Payment Link:', order.paymentLink);
console.log('Dynamic UPI QR:', order.dynamicQr);`,
    next: `import { createOrder } from '@/lib/mymobpay';

export async function POST(req: Request) {
  const { amount, orderId, customerVpa } = await req.json();

  const session = await createOrder({
    amount,
    orderId,
    customerVpa,
    currency: 'INR',
    settlementRoute: 'direct_bank'
  });

  return Response.json({
    orderId: session.id,
    qrString: session.qrString,
    status: 'ACTIVE'
  });
}`,
    python: `import mymobpay

client = mymobpay.Client(api_key="sec_live_948a201...")

order = client.orders.create(
    amount=1499.00,
    currency="INR",
    order_id="ORD_2026_9821",
    customer_vpa="customer@okhdfcbank",
    settlement_route="direct_bank"
)

print("Dynamic QR:", order.qr_data)
print("Instant Direct Deep Link:", order.payment_url)`,
    php: `<?php
require_once('vendor/autoload.php');

$mymobpay = new \\MyMobPay\\Client('sec_live_948a201...');

$order = $mymobpay->orders->create([
    'amount' => 1499.00,
    'currency' => 'INR',
    'orderId' => 'ORD_2026_9821',
    'customerVpa' => 'customer@okhdfcbank',
    'settlementRoute' => 'direct_bank'
]);

echo "Order URL: " . $order->payment_url;
?>`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeLangTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div
      data-page-theme={pageTheme}
      className={`min-h-screen relative font-body-md transition-colors duration-300 ${
        isDark
          ? 'bg-[#020617] text-on-surface antialiased selection:bg-brand-accent-cyan selection:text-black overflow-x-hidden'
          : 'bg-[#fcfdfd] text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-fixed overflow-x-hidden'
      }`}
    >
      {/* Dark Theme Ambient Matrix Grid & Laser Glow Orbs */}
      {isDark && (
        <>
          <div className="fixed inset-0 pointer-events-none matrix-grid z-0 opacity-40"></div>
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary-container/20 rounded-full blur-[140px] pointer-events-none"></div>
          <div className="fixed bottom-1/4 right-10 w-[30rem] h-[30rem] bg-brand-accent-cyan/10 rounded-full blur-[160px] pointer-events-none"></div>
        </>
      )}

      {/* ────────────────────────────────────────────────────────
         HEADER
         ──────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-200 ${
          isDark
            ? 'bg-[#020617]/85 backdrop-blur-2xl border-b border-border-subtle/80 shadow-[0_4px_30px_rgba(0,0,0,0.6)]'
            : 'bg-[#fcfdfd]/90 backdrop-blur-xl border-b border-border-subtle shadow-[0_1px_8px_rgba(0,0,0,0.03)]'
        }`}
      >
        {/* Top Telemetry Strip (Desktop) */}
        <div
          className={`border-b hidden lg:block ${
            isDark
              ? 'bg-surface-container-lowest/80 border-border-subtle/50 text-body-sm'
              : 'bg-surface-container-low/70 border-border-subtle/60 text-body-sm'
          }`}
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-12 h-9 flex items-center justify-between">
            <div className="flex items-center gap-space-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent-emerald opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent-emerald"></span>
              </span>
              <span
                className={`font-label-mono-sm text-caption-caps uppercase font-semibold tracking-wider ${
                  isDark ? 'text-brand-accent-emerald' : 'text-tertiary'
                }`}
              >
                Network Telemetry
              </span>
              <span className="text-on-surface-variant font-body-sm">
                Live: Direct bank transfer (IMPS / NEFT) with 0% gateway fees.
              </span>
              <a
                href="#calculator"
                className={`font-body-sm font-semibold inline-flex items-center gap-0.5 ml-1 transition-colors ${
                  isDark ? 'text-brand-accent-cyan hover:text-white' : 'text-primary hover:text-primary-container'
                }`}
              >
                Compare savings →
              </a>
            </div>
            <div className="flex items-center gap-space-md text-on-surface-variant font-label-mono-sm text-label-mono-sm">
              <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : ''}`}>
                <span className="material-symbols-outlined text-[14px] text-brand-accent-emerald">verified</span>{' '}
                NPCI Compliant
              </span>
              <span className="text-outline-variant">|</span>
              <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : ''}`}>
                <span
                  className={`material-symbols-outlined text-[14px] ${
                    isDark ? 'text-brand-accent-cyan' : 'text-primary'
                  }`}
                >
                  lock
                </span>{' '}
                256-bit Direct Routing
              </span>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-lg">
            <Link href="/" className="flex items-center gap-2.5 group transition-transform active:scale-95">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isDark
                    ? 'bg-gradient-to-tr from-brand-accent-cyan via-primary-container to-brand-accent-emerald shadow-lg shadow-brand-accent-cyan/20 ring-1 ring-brand-accent-cyan/40'
                    : 'bg-gradient-to-tr from-primary via-primary-container to-brand-accent-cyan shadow-md shadow-primary/20'
                }`}
              >
                <span className="font-headline-sm text-headline-sm font-black text-white tracking-tight">M</span>
              </div>
              <span
                className={`font-headline-sm text-headline-sm font-extrabold tracking-tight transition-colors ${
                  isDark
                    ? 'text-white group-hover:text-brand-accent-cyan'
                    : 'text-on-surface group-hover:text-primary'
                }`}
              >
                MyMobPay
              </span>
            </Link>

            <nav className="hidden xl:flex items-center gap-6">
              <a
                href="#pipeline"
                className={`text-body-sm font-body-sm text-on-surface-variant transition-colors py-1 ${
                  isDark ? 'hover:text-brand-accent-cyan' : 'hover:text-on-surface'
                }`}
              >
                How It Works
              </a>
              <a
                href="#features"
                className={`text-body-sm font-body-sm text-on-surface-variant transition-colors py-1 ${
                  isDark ? 'hover:text-brand-accent-cyan' : 'hover:text-on-surface'
                }`}
              >
                Features
              </a>
              <a
                href="#developers"
                className={`text-body-sm font-body-sm text-on-surface-variant transition-colors py-1 ${
                  isDark ? 'hover:text-brand-accent-cyan' : 'hover:text-on-surface'
                }`}
              >
                Developers
              </a>
              <a
                href="#calculator"
                className={`text-body-sm font-body-sm text-on-surface-variant transition-colors py-1 ${
                  isDark ? 'hover:text-brand-accent-cyan' : 'hover:text-on-surface'
                }`}
              >
                Pricing
              </a>
              <Link
                href="/docs"
                className={`text-body-sm font-body-sm text-on-surface-variant transition-colors py-1 ${
                  isDark ? 'hover:text-brand-accent-cyan' : 'hover:text-on-surface'
                }`}
              >
                Docs
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-space-md">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Light/Dark Theme"
              className={`p-2 rounded-xl transition-all border flex items-center justify-center ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-brand-accent-cyan hover:bg-slate-800'
                  : 'bg-surface-container-low border-border-subtle text-primary hover:bg-surface-container'
              }`}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {isDark ? <Sun className="w-4 h-4 text-brand-accent-cyan" /> : <Moon className="w-4 h-4 text-primary" />}
            </button>

            <Link
              href="/login"
              className={`hidden sm:inline-flex text-body-sm font-body-sm font-semibold px-space-sm py-2 transition-colors ${
                isDark ? 'text-on-surface-variant hover:text-white' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Login
            </Link>

            <Link
              href="/signup"
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-body-sm font-semibold transition-all active:scale-95 ${
                isDark
                  ? 'bg-primary-container hover:bg-blue-500 text-white shadow-md shadow-primary-container/40 hover:shadow-brand-accent-cyan/40 border border-brand-accent-cyan/30'
                  : 'bg-primary-container hover:bg-primary text-on-primary shadow-sm hover:shadow-md'
              }`}
            >
              Launch Console <span className="text-xs">→</span>
            </Link>

            {/* Profile Avatar / Quick Link */}
            <Link
              href="/login"
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-105 ${
                isDark
                  ? 'bg-slate-800 border border-brand-accent-cyan/30 text-brand-accent-cyan'
                  : 'bg-primary text-on-primary ring-2 ring-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
            </Link>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-lg text-on-surface hover:bg-surface-container"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div
            className={`xl:hidden px-6 py-4 border-b space-y-3 ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-border-subtle text-slate-800'
            }`}
          >
            <a
              href="#pipeline"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-body-sm font-medium hover:text-primary"
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-body-sm font-medium hover:text-primary"
            >
              Features
            </a>
            <a
              href="#developers"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-body-sm font-medium hover:text-primary"
            >
              Developers
            </a>
            <a
              href="#calculator"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-body-sm font-medium hover:text-primary"
            >
              Pricing
            </a>
            <Link
              href="/docs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block py-2 text-body-sm font-medium hover:text-primary"
            >
              Documentation
            </Link>
            <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
              <Link href="/login" className="text-body-sm font-semibold">
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 rounded-full bg-primary-container text-white text-xs font-semibold"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ────────────────────────────────────────────────────────
         MAIN CONTENT AREA
         ──────────────────────────────────────────────────────── */}
      <main className="w-full pt-16 relative z-10">
        <div className="flex flex-col w-full">
          {/* Top Live Announcement Banner */}
          <section
            className={`w-full py-2.5 px-4 text-center border-b ${
              isDark
                ? 'bg-[#030712] border-border-subtle/80'
                : 'bg-surface-container-low/70 border-border-subtle/40'
            }`}
          >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-mono-sm text-caption-caps ${
                  isDark
                    ? 'bg-brand-accent-cyan/10 border border-brand-accent-cyan/30 text-brand-accent-cyan'
                    : 'bg-surface-container text-primary shadow-sm'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent-emerald animate-pulse"></span>
                Live Rail
              </span>
              <span
                className={`font-body-sm text-body-sm font-medium ${
                  isDark ? 'text-slate-300' : 'text-on-surface-variant'
                }`}
              >
                Direct UPI &amp; bank transfer rails active · 0% MDR
              </span>
              <a
                href="#calculator"
                className={`font-body-sm text-body-sm font-semibold inline-flex items-center gap-1 ml-1 transition-colors ${
                  isDark ? 'text-brand-accent-cyan hover:text-white' : 'text-primary hover:text-primary-container'
                }`}
              >
                Calculate savings <span className="text-xs">→</span>
              </a>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────
             HERO SECTION
             ──────────────────────────────────────────────────────── */}
          <section className="w-full py-14 lg:py-24 px-6 lg:px-12 relative overflow-hidden">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
              {/* Left Column: Copy & CTAs */}
              <div className="lg:col-span-7 space-y-8">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-label-mono-sm text-caption-caps shadow-sm ${
                    isDark
                      ? 'bg-slate-900/90 border border-brand-accent-cyan/40 text-brand-accent-cyan shadow-inner'
                      : 'bg-surface-container text-primary border border-primary/10'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm text-brand-accent-emerald">verified_user</span>
                  Zero Escrow · Direct NPCI Switch Routing
                </div>

                <h1
                  className={`font-headline-xl text-headline-xl lg:text-display-hero lg:font-display-hero tracking-tight ${
                    isDark ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  Accept payments directly to your bank.
                  <span
                    className={`block mt-2 ${
                      isDark
                        ? 'text-transparent bg-clip-text bg-gradient-to-r from-brand-accent-cyan via-blue-400 to-brand-accent-emerald'
                        : 'text-primary'
                    }`}
                  >
                    {typedLine}
                    <span className="animate-pulse">|</span>
                  </span>
                </h1>

                <p
                  className={`font-body-lg text-body-lg max-w-2xl leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-on-surface-variant'
                  }`}
                >
                  Collect direct UPI and IMPS bank transfers with automated real-time reconciliation, signed HMAC
                  webhooks, and 0% intermediary deductions.
                </p>

                {/* Live Merchant Presence Pill with Live Scanner Image (Dark Mode Highlight) */}
                {isDark && (
                  <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 flex items-center gap-4 max-w-xl backdrop-blur-xl">
                    <div className="relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border border-brand-accent-cyan/30">
                      <Image
                        alt="Real merchant live scanner"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida/AEtjO1XPOYt__pf1vTOVu5c3sjYQbGiSPRQNw_Q2hNOcKAD0kLWfQ6t5heci-4ykRmsQ4CH8p-PxcigL0Tds41p9QAw28GTyxcgJrUYfSV2FkQXJUlQAptODPTMnJ-gB06PrX7qs5OmZpt8epQiFDwe7VicowB-Bve8ulNpjjEdoixeDSmcJbe-N5IbzNU9R-ynQgGIPdeN1EBFTcvCeo_hStin-tlG32JpaOu2raWQ32bfCYw"
                        width={64}
                        height={48}
                        unoptimized
                      />
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-accent-emerald animate-ping"></span>
                    </div>
                    <div className="text-xs space-y-0.5">
                      <p className="font-label-mono-sm text-brand-accent-cyan font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">cell_tower</span> Physical &amp; Digital Nodes Active
                      </p>
                      <p className="text-slate-400">Deployed across POS tablets, mobile intent deep links, and cloud checkout webhooks.</p>
                    </div>
                  </div>
                )}

                {/* CTA cluster */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                  <Link
                    href="/signup"
                    className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full font-headline-sm text-body-md font-semibold transition-all hover:scale-[1.02] active:scale-95 ${
                      isDark
                        ? 'bg-primary-container hover:bg-blue-600 text-white shadow-lg shadow-primary-container/30 border border-brand-accent-cyan/40'
                        : 'bg-primary-container hover:bg-primary text-on-primary shadow-lg shadow-primary-container/20'
                    }`}
                  >
                    Sign up now
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>

                  <a
                    href="#pipeline"
                    className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full font-body-md font-medium transition-colors ${
                      isDark
                        ? 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface border border-border-subtle/80'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-sm ${
                        isDark ? 'text-brand-accent-cyan' : 'text-primary'
                      }`}
                    >
                      play_circle
                    </span>
                    Explore live checkout
                  </a>
                </div>

                {/* Metric Badges Row */}
                <div className="pt-6 grid grid-cols-3 gap-4 max-w-xl">
                  <div
                    className={`p-4 rounded-xl shadow-sm border transition-all ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800/90 hover:border-brand-accent-cyan/50'
                        : 'bg-surface-container-lowest border-border-subtle/60 hover:border-primary/20'
                    }`}
                  >
                    <p
                      className={`font-headline-lg text-headline-lg font-extrabold tracking-tight ${
                        isDark ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      0%
                    </p>
                    <p
                      className={`font-body-sm text-caption-caps uppercase mt-1 ${
                        isDark ? 'text-slate-400' : 'text-on-surface-variant'
                      }`}
                    >
                      Transaction fees
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-xl shadow-sm border transition-all ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800/90 hover:border-brand-accent-cyan/50'
                        : 'bg-surface-container-lowest border-border-subtle/60 hover:border-primary/20'
                    }`}
                  >
                    <p
                      className={`font-headline-lg text-headline-lg font-extrabold tracking-tight ${
                        isDark ? 'text-brand-accent-cyan' : 'text-primary'
                      }`}
                    >
                      T+0
                    </p>
                    <p
                      className={`font-body-sm text-caption-caps uppercase mt-1 ${
                        isDark ? 'text-slate-400' : 'text-on-surface-variant'
                      }`}
                    >
                      Instant bank credit
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-xl shadow-sm border transition-all ${
                      isDark
                        ? 'bg-slate-900/90 border-slate-800/90 hover:border-brand-accent-emerald/50'
                        : 'bg-surface-container-lowest border-border-subtle/60 hover:border-primary/20'
                    }`}
                  >
                    <p
                      className={`font-headline-lg text-headline-lg font-extrabold tracking-tight ${
                        isDark ? 'text-brand-accent-emerald' : 'text-tertiary'
                      }`}
                    >
                      99.98%
                    </p>
                    <p
                      className={`font-body-sm text-caption-caps uppercase mt-1 ${
                        isDark ? 'text-slate-400' : 'text-on-surface-variant'
                      }`}
                    >
                      Success rate
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Simulated Live QR Device */}
              <div className="lg:col-span-5 relative flex justify-center">
                {/* Floating Telemetry Pills */}
                <div
                  className={`absolute -top-4 -left-4 z-20 hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-full backdrop-blur-md shadow-lg border ${
                    isDark
                      ? 'bg-slate-900/95 border-brand-accent-emerald/40'
                      : 'bg-surface-container-lowest/90 border-border-subtle'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-brand-accent-emerald animate-ping"></span>
                  <div className="font-label-mono-sm text-caption-caps">
                    <span className="text-on-surface-variant block">Platform average</span>
                    <span
                      className={`font-bold ${isDark ? 'text-brand-accent-emerald' : 'text-tertiary'}`}
                    >
                      99.98% Success
                    </span>
                  </div>
                </div>

                <div
                  className={`absolute -bottom-4 -right-4 z-20 hidden sm:flex items-center gap-2.5 px-4 py-2.5 rounded-full backdrop-blur-md shadow-lg border ${
                    isDark
                      ? 'bg-slate-900/95 border-brand-accent-cyan/40'
                      : 'bg-surface-container-lowest/90 border-border-subtle'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] ${
                      isDark ? 'text-brand-accent-cyan' : 'text-primary'
                    }`}
                  >
                    bolt
                  </span>
                  <div className="font-label-mono-sm text-caption-caps">
                    <span className="text-on-surface-variant block">Settlement Rail</span>
                    <span
                      className={`font-bold ${isDark ? 'text-brand-accent-cyan' : 'text-primary'}`}
                    >
                      0 Seconds Direct
                    </span>
                  </div>
                </div>

                {/* Phone / Checkout Card Shell */}
                <div
                  className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl relative border ${
                    isDark
                      ? 'bg-gradient-to-b from-slate-900 to-black text-slate-100 border-slate-800 cyber-glow-cyan'
                      : 'bg-code-surface text-inverse-on-surface border-slate-800'
                  }`}
                >
                  {/* Status Header Bar */}
                  <div
                    className={`flex items-center justify-between text-caption-caps font-label-mono-sm mb-6 ${
                      isDark ? 'text-slate-400 border-b border-slate-800/80 pb-3' : 'text-outline-variant'
                    }`}
                  >
                    <span className={isDark ? 'text-brand-accent-cyan font-semibold' : ''}>10:42 AM</span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xs">signal_cellular_alt</span>
                      <span className="material-symbols-outlined text-xs">wifi</span>
                      <span
                        className={`font-bold text-[10px] ${
                          isDark ? 'text-brand-accent-emerald' : ''
                        }`}
                      >
                        LTE
                      </span>
                    </div>
                  </div>

                  {/* Checkout Card Top */}
                  <div
                    className={`rounded-2xl p-5 mb-5 space-y-3 border ${
                      isDark
                        ? 'bg-slate-950/90 border-slate-800 shadow-inner'
                        : 'bg-inverse-surface border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-on-primary font-bold text-xs ${
                            isDark
                              ? 'bg-gradient-to-tr from-brand-accent-cyan to-primary-container shadow-sm'
                              : 'bg-primary-container'
                          }`}
                        >
                          M
                        </div>
                        <span className="font-headline-sm text-sm font-semibold text-inverse-on-surface">
                          MyMobPay
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-tertiary/20 text-brand-accent-emerald font-label-mono-sm text-caption-caps">
                        Direct bank rail
                      </span>
                    </div>
                    <div className="pt-2 flex justify-between items-baseline">
                      <div>
                        <span className="text-outline-variant font-caption-caps text-caption-caps uppercase block">
                          Total due
                        </span>
                        <span className="font-headline-xl text-headline-lg font-bold text-inverse-on-surface">
                          ₹500.00
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-outline-variant font-caption-caps text-caption-caps block">
                          Paying to:
                        </span>
                        <span className="font-body-sm text-body-sm font-medium text-inverse-on-surface">
                          Merchant Store
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* QR Module Container */}
                  <div className="bg-surface-container-lowest rounded-2xl p-6 text-on-surface text-center flex flex-col items-center border border-border-subtle/50">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-primary font-label-mono-sm text-caption-caps mb-4">
                      <span className="w-2 h-2 rounded-full bg-brand-accent-emerald animate-pulse"></span>
                      Auto-verify active
                    </div>

                    {/* Stylized Crisp High-Contrast Dynamic QR SVG */}
                    <div className="p-4 bg-surface-container-lowest rounded-xl shadow-inner mb-4 border border-border-subtle/40">
                      <svg className="w-44 h-44 text-code-surface" fill="currentColor" viewBox="0 0 100 100">
                        {/* Top-Left Target */}
                        <rect fill="none" height="28" rx="4" stroke="currentColor" strokeWidth="4" width="28" x="5" y="5"></rect>
                        <rect fill="currentColor" height="12" rx="2" width="12" x="13" y="13"></rect>
                        {/* Top-Right Target */}
                        <rect fill="none" height="28" rx="4" stroke="currentColor" strokeWidth="4" width="28" x="67" y="5"></rect>
                        <rect fill="currentColor" height="12" rx="2" width="12" x="75" y="13"></rect>
                        {/* Bottom-Left Target */}
                        <rect fill="none" height="28" rx="4" stroke="currentColor" strokeWidth="4" width="28" x="5" y="67"></rect>
                        <rect fill="currentColor" height="12" rx="2" width="12" x="13" y="75"></rect>
                        {/* QR Data Matrix Dots */}
                        <rect height="6" rx="1" width="6" x="38" y="8"></rect>
                        <rect height="6" rx="1" width="6" x="48" y="14"></rect>
                        <rect height="6" rx="1" width="6" x="56" y="8"></rect>
                        <rect height="6" rx="1" width="6" x="38" y="24"></rect>
                        <rect height="6" rx="1" width="6" x="48" y="24"></rect>
                        <rect height="6" rx="1" width="6" x="8" y="38"></rect>
                        <rect height="6" rx="1" width="6" x="18" y="44"></rect>
                        <rect height="6" rx="1" width="6" x="28" y="38"></rect>
                        <rect className="text-primary" fill="currentColor" height="10" rx="2" width="10" x="38" y="38"></rect>
                        <rect height="8" rx="1.5" width="8" x="52" y="38"></rect>
                        <rect height="6" rx="1" width="6" x="66" y="42"></rect>
                        <rect height="6" rx="1" width="6" x="76" y="38"></rect>
                        <rect height="6" rx="1" width="6" x="86" y="44"></rect>
                        <rect height="8" rx="1.5" width="8" x="38" y="52"></rect>
                        <rect className="text-primary" fill="currentColor" height="12" rx="2" width="12" x="50" y="50"></rect>
                        <rect height="6" rx="1" width="6" x="68" y="54"></rect>
                        <rect height="8" rx="1" width="8" x="78" y="52"></rect>
                        <rect height="6" rx="1" width="6" x="38" y="68"></rect>
                        <rect height="8" rx="1" width="8" x="48" y="72"></rect>
                        <rect height="6" rx="1" width="6" x="60" y="68"></rect>
                        <rect height="8" rx="1" width="8" x="38" y="82"></rect>
                        <rect height="8" rx="1" width="8" x="52" y="84"></rect>
                        <rect className="text-brand-accent-emerald" fill="currentColor" height="10" rx="2" width="10" x="64" y="80"></rect>
                        <rect height="6" rx="1" width="6" x="80" y="76"></rect>
                        <rect height="6" rx="1" width="6" x="88" y="84"></rect>
                      </svg>
                    </div>
                    <p className="font-caption-caps text-caption-caps uppercase text-on-surface-variant font-bold tracking-wider mb-2">
                      Scan with any UPI app
                    </p>
                    <div className="flex items-center justify-center gap-2 font-label-mono-sm text-caption-caps text-on-surface-variant">
                      <span className="px-2 py-0.5 rounded bg-surface-container">GPay</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container">PhonePe</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container">Paytm</span>
                      <span className="px-2 py-0.5 rounded bg-surface-container">BHIM</span>
                    </div>
                  </div>
                  <p className="font-label-mono-sm text-caption-caps text-outline-variant text-center mt-5">
                    Secure checkout by MyMobPay
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────
             SOCIAL PROOF / TRUSTED BY BAR
             ──────────────────────────────────────────────────────── */}
          <section
            className={`w-full py-10 md:py-12 px-6 border-y ${
              isDark
                ? 'bg-[#030712]/90 border-border-subtle/80'
                : 'bg-[#f8fafc] border-border-subtle/60'
            }`}
          >
            <div className="max-w-7xl mx-auto space-y-6 text-center">
              <p
                className={`font-body-sm text-body-sm font-medium ${
                  isDark ? 'text-slate-400' : 'text-on-surface-variant'
                }`}
              >
                Powering 10,000+ modern founders, developers, and fast-growing businesses across India
              </p>
              <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-80">
                {['KwickBill', 'ScaleLoop', 'DevStack', 'NexaCart', 'IndieFlow', 'ZetaPay'].map((brand, i) => (
                  <div
                    key={brand}
                    className="flex items-center gap-2 group cursor-pointer hover:opacity-100 transition-opacity"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isDark ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-surface-container text-on-surface'
                      }`}
                    >
                      {brand[0]}
                    </div>
                    <span
                      className={`font-headline-sm text-body-md font-bold tracking-tight ${
                        isDark ? 'text-slate-200 group-hover:text-brand-accent-cyan' : 'text-on-surface group-hover:text-primary'
                      }`}
                    >
                      {brand}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────
             MERCHANT CONSOLE & LIVE DASHBOARD SECTION
             ──────────────────────────────────────────────────────── */}
          <section className="w-full py-20 px-6 lg:px-12 relative">
            <div className="max-w-7xl mx-auto space-y-12">
              {/* Section Header */}
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span
                  className={`inline-flex px-3 py-1 rounded-full font-label-mono-sm text-caption-caps uppercase ${
                    isDark
                      ? 'bg-slate-900 border border-brand-accent-cyan/40 text-brand-accent-cyan'
                      : 'bg-surface-container text-primary border border-primary/10'
                  }`}
                >
                  Merchant console
                </span>
                <h2
                  className={`font-headline-xl text-headline-xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  Full visibility into payments and settlements
                </h2>
                <p
                  className={`font-body-lg text-body-lg ${
                    isDark ? 'text-slate-300' : 'text-on-surface-variant'
                  }`}
                >
                  Monitor real-time payments, webhook delivery logs, and bank reconciliations from a single console.
                </p>
              </div>

              {/* Dashboard Console Shell */}
              <div
                className={`w-full rounded-3xl shadow-xl overflow-hidden border ${
                  isDark
                    ? 'bg-slate-950/90 border-slate-800 cyber-glow-blue backdrop-blur-xl'
                    : 'bg-surface-container-lowest border-border-subtle/80'
                }`}
              >
                {/* Console Address Bar */}
                <div
                  className={`px-6 py-3 flex items-center justify-between border-b ${
                    isDark ? 'bg-slate-900 border-slate-800' : 'bg-surface-container-low border-border-subtle/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>
                    <span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span>
                    <span className="w-3 h-3 rounded-full bg-[#10b981]"></span>
                    <span
                      className={`ml-4 font-label-mono-sm text-caption-caps px-3 py-1 rounded-md border ${
                        isDark
                          ? 'text-slate-300 bg-slate-950 border-slate-800'
                          : 'text-on-surface-variant bg-surface-container border-border-subtle/40'
                      }`}
                    >
                      dashboard.mymobpay.com
                    </span>
                  </div>
                  <div className="flex items-center gap-2 font-label-mono-sm text-caption-caps text-brand-accent-emerald font-semibold">
                    <span className="w-2 h-2 rounded-full bg-brand-accent-emerald animate-pulse"></span>
                    Live Telemetry
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[460px]">
                  {/* Sidebar Navigation */}
                  <div
                    className={`lg:col-span-3 p-6 space-y-6 border-r ${
                      isDark
                        ? 'bg-slate-900/40 border-slate-800/80'
                        : 'bg-surface-container-low/40 border-border-subtle/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs ${
                          isDark ? 'bg-gradient-to-tr from-brand-accent-cyan to-primary' : 'bg-primary-container'
                        }`}
                      >
                        M
                      </div>
                      <span className="font-headline-sm text-body-md font-bold text-on-surface">
                        MyMobPay Console
                      </span>
                    </div>

                    <nav className="space-y-1 font-body-sm text-body-sm">
                      <Link
                        href="/dashboard"
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg font-semibold transition-colors ${
                          isDark
                            ? 'bg-slate-800/80 border border-brand-accent-cyan/30 text-brand-accent-cyan'
                            : 'bg-surface-container text-primary shadow-xs'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">dashboard</span> Dashboard
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">receipt_long</span> Orders
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">monitoring</span> Analytics
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">account_balance</span> Settlements
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">webhook</span> Webhooks
                      </Link>
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">key</span> API Keys
                      </Link>
                      <Link
                        href="/sandbox"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">terminal</span> Sandbox
                      </Link>
                    </nav>

                    {/* Founder Card in Dark Mode */}
                    {isDark && (
                      <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center gap-3">
                        <Image
                          alt="Merchant Dashboard User"
                          className="w-10 h-10 rounded-lg object-cover border border-brand-accent-emerald/40"
                          src="https://lh3.googleusercontent.com/aida/AEtjO1VcOOG1ea68nKMYMjcKPMJbKmvgYJ9HQjML3k9_VcP7k99DpkXiPSsLNZk2Dt2h34rWugFzxY_fkWpvn4jKzYq3i2xVHtk3NTC1cremASRrl1ZWF39m3vVMHgqzUV8NYAiPaNoo4J8IJ3x-wpA5zW_qvMoQ2R29KhDjLzuyzt7kpgTeTNMx7eaRD-PQy7pqWz6WWrHlxjebyNH3oQe7NXV3gh-QRRgT1O9TFxjIbOVyAg"
                          width={40}
                          height={40}
                          unoptimized
                        />
                        <div className="text-[11px] leading-tight">
                          <span className="text-white font-semibold block">Rohan S.</span>
                          <span className="text-slate-400">Verified Console Admin</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Main Console Body */}
                  <div className="lg:col-span-9 p-6 lg:p-8 space-y-6">
                    {/* 4 Metrics Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div
                        className={`p-4 rounded-xl border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-surface-container-low border-border-subtle/50'
                        }`}
                      >
                        <p className="font-caption-caps text-caption-caps uppercase text-on-surface-variant">
                          Total revenue
                        </p>
                        <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                          ₹4,82,500
                        </p>
                        <span className="font-label-mono-sm text-caption-caps text-brand-accent-emerald font-semibold">
                          +12.4% vs last mo
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-xl border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-surface-container-low border-border-subtle/50'
                        }`}
                      >
                        <p className="font-caption-caps text-caption-caps uppercase text-on-surface-variant">
                          Transactions
                        </p>
                        <p className="font-headline-md text-headline-md font-bold text-on-surface mt-1">
                          1,842
                        </p>
                        <span className="font-label-mono-sm text-caption-caps text-brand-accent-emerald font-semibold">
                          +8.1% volume
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-xl border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-surface-container-low border-border-subtle/50'
                        }`}
                      >
                        <p className="font-caption-caps text-caption-caps uppercase text-on-surface-variant">
                          Success rate
                        </p>
                        <p className="font-headline-md text-headline-md font-bold text-brand-accent-emerald mt-1">
                          99.98%
                        </p>
                        <span className="font-label-mono-sm text-caption-caps text-brand-accent-emerald font-semibold">
                          +0.02% optimal
                        </span>
                      </div>

                      <div
                        className={`p-4 rounded-xl border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-surface-container-low border-border-subtle/50'
                        }`}
                      >
                        <p className="font-caption-caps text-caption-caps uppercase text-on-surface-variant">
                          Avg. settlement
                        </p>
                        <p
                          className={`font-headline-md text-headline-md font-bold mt-1 ${
                            isDark ? 'text-brand-accent-cyan' : 'text-primary'
                          }`}
                        >
                          0.0s
                        </p>
                        <span
                          className={`font-label-mono-sm text-caption-caps font-semibold ${
                            isDark ? 'text-brand-accent-cyan' : 'text-primary'
                          }`}
                        >
                          Real-time NPCI
                        </span>
                      </div>
                    </div>

                    {/* Chart & Feed Split */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* Revenue Trend SVG Chart */}
                      <div
                        className={`md:col-span-7 p-5 rounded-2xl space-y-4 border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-surface-container-low border-border-subtle/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-headline-sm text-body-md font-bold text-on-surface">
                            Revenue (last 30 days)
                          </span>
                          <span
                            className={`font-label-mono-sm text-caption-caps px-2 py-0.5 rounded ${
                              isDark
                                ? 'text-brand-accent-emerald bg-brand-accent-emerald/10 border border-brand-accent-emerald/30'
                                : 'text-tertiary bg-surface-container'
                            }`}
                          >
                            Live
                          </span>
                        </div>
                        <div className="h-44 w-full flex items-end">
                          <svg
                            className={`w-full h-full ${isDark ? 'text-brand-accent-cyan' : 'text-primary'}`}
                            preserveAspectRatio="none"
                            viewBox="0 0 300 120"
                          >
                            <defs>
                              <linearGradient id="gradRevenueMMP" x1="0%" x2="0%" y1="0%" y2="100%">
                                <stop
                                  offset="0%"
                                  stopColor={isDark ? '#06B6D4' : '#2563EB'}
                                  stopOpacity={isDark ? '0.4' : '0.25'}
                                ></stop>
                                <stop
                                  offset="100%"
                                  stopColor={isDark ? '#06B6D4' : '#2563EB'}
                                  stopOpacity="0.0"
                                ></stop>
                              </linearGradient>
                            </defs>
                            <path
                              d="M 0 95 Q 40 85 75 70 T 150 45 T 225 30 T 300 15 L 300 120 L 0 120 Z"
                              fill="url(#gradRevenueMMP)"
                            ></path>
                            <path
                              d="M 0 95 Q 40 85 75 70 T 150 45 T 225 30 T 300 15"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeWidth="3"
                            ></path>
                            <circle cx="300" cy="15" fill={isDark ? '#38bdf8' : 'currentColor'} r="4"></circle>
                          </svg>
                        </div>
                        <div className="flex justify-between font-label-mono-sm text-[10px] text-on-surface-variant">
                          <span>Aug 1</span>
                          <span>Aug 7</span>
                          <span>Aug 14</span>
                          <span>Aug 21</span>
                          <span>Aug 26</span>
                        </div>
                      </div>

                      {/* Live Streaming Feed Table */}
                      <div
                        className={`md:col-span-5 p-5 rounded-2xl space-y-3 border ${
                          isDark
                            ? 'bg-slate-900/90 border-slate-800'
                            : 'bg-surface-container-low border-border-subtle/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-headline-sm text-body-md font-bold text-on-surface">
                            Recent payments
                          </span>
                          <span className="w-2 h-2 rounded-full bg-brand-accent-emerald animate-ping"></span>
                        </div>
                        <div className="space-y-2.5">
                          {[
                            { id: '#MP0891', vpa: 'raj@okaxis', amount: '₹4,500', status: 'Success', state: 'success' },
                            { id: '#MP0890', vpa: 'sara@ybl', amount: '₹1,200', status: 'Success', state: 'success' },
                            { id: '#MP0889', vpa: 'dev@paytm', amount: '₹800', status: 'Pending', state: 'pending' },
                            { id: '#MP0888', vpa: 'mia@upi', amount: '₹12,000', status: 'Success', state: 'success' },
                          ].map((item) => (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-2.5 rounded-lg text-body-sm font-label-mono-sm border ${
                                isDark
                                  ? 'bg-slate-950 border-slate-800/80'
                                  : 'bg-surface-container-lowest border-border-subtle/30'
                              }`}
                            >
                              <div>
                                <span className="font-semibold text-on-surface block">{item.id}</span>
                                <span className="text-on-surface-variant text-caption-caps">{item.vpa}</span>
                              </div>
                              <div className="text-right">
                                <span className="font-bold text-on-surface block">{item.amount}</span>
                                <span
                                  className={`text-caption-caps font-semibold ${
                                    item.state === 'success' ? 'text-brand-accent-emerald' : 'text-brand-accent-amber'
                                  }`}
                                >
                                  {item.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Mini telemetry bar */}
                    <div className="pt-4 grid grid-cols-3 gap-4 font-label-mono-sm text-caption-caps text-on-surface-variant border-t border-border-subtle/50">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-brand-accent-emerald">cloud_done</span>
                        Uptime SLA 99.99%
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`material-symbols-outlined text-sm ${
                            isDark ? 'text-brand-accent-cyan' : 'text-primary'
                          }`}
                        >
                          speed
                        </span>
                        Webhook latency &lt;200ms
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-brand-accent-emerald">check_circle</span>
                        Avg. settlement 0 sec
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────
             DIRECT SETTLEMENT PIPELINE (3-STEP BENTO & SIMULATOR)
             ──────────────────────────────────────────────────────── */}
          <section
            className={`w-full py-20 px-6 lg:px-12 border-y ${
              isDark ? 'bg-[#030712] border-border-subtle/80' : 'bg-[#f8fafc] border-border-subtle/50'
            }`}
            id="pipeline"
          >
            <div className="max-w-7xl mx-auto space-y-16">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span
                  className={`inline-flex px-3 py-1 rounded-full font-label-mono-sm text-caption-caps uppercase ${
                    isDark
                      ? 'bg-slate-900 border border-brand-accent-cyan/40 text-brand-accent-cyan'
                      : 'bg-surface-container text-primary border border-primary/10'
                  }`}
                >
                  Direct Settlement Pipeline
                </span>
                <h2
                  className={`font-headline-xl text-headline-xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  How direct bank payments work in three steps
                </h2>
                <p
                  className={`font-body-lg text-body-lg ${
                    isDark ? 'text-slate-300' : 'text-on-surface-variant'
                  }`}
                >
                  Eliminate middleman escrow pools and 2% deductions. Money moves directly across NPCI rails into your bank account with instantaneous webhook verification.
                </p>
              </div>

              {/* Bento Grid (3 Steps + Interactive Preview) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                {/* 3 Step Cards Stack */}
                <div className="lg:col-span-7 space-y-6 flex flex-col justify-between">
                  {/* Step 1 */}
                  <div
                    onClick={() => setSimStep(1)}
                    className={`p-6 rounded-2xl shadow-sm space-y-3 transition-all cursor-pointer hover:-translate-y-1 border ${
                      simStep === 1
                        ? isDark
                          ? 'bg-slate-900 border-brand-accent-cyan shadow-lg shadow-brand-accent-cyan/10'
                          : 'bg-surface-container-lowest border-primary/50 shadow-md ring-1 ring-primary/20'
                        : isDark
                        ? 'bg-slate-900/90 border-slate-800'
                        : 'bg-surface-container-lowest border-border-subtle/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full font-headline-sm text-sm font-bold flex items-center justify-center ${
                            isDark
                              ? 'bg-brand-accent-cyan text-black'
                              : 'bg-primary-container text-on-primary'
                          }`}
                        >
                          01
                        </span>
                        <span
                          className={`font-caption-caps text-caption-caps uppercase font-bold ${
                            isDark ? 'text-brand-accent-cyan' : 'text-primary'
                          }`}
                        >
                          Scan or Tap Intent
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-accent-emerald/10 border border-brand-accent-emerald/30 text-brand-accent-emerald font-label-mono-sm text-[10px] font-semibold">
                        {simStep === 1 ? 'Current Step' : 'Active'}
                      </span>
                    </div>
                    <h3
                      className={`font-headline-sm text-headline-sm font-bold ${
                        isDark ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      Customer scans dynamic QR or taps intent
                    </h3>
                    <p
                      className={`font-body-md text-body-md leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-on-surface-variant'
                      }`}
                    >
                      Generates an order-locked dynamic UPI QR and direct deep-links compatible with GPay, PhonePe, Paytm, BHIM, and Cred. Also supports direct zero-fee virtual IMPS for large ticket B2B.
                    </p>
                    <div className="pt-2 flex items-center gap-4 font-label-mono-sm text-caption-caps text-on-surface-variant">
                      <span>
                        Settlement: <strong className="text-brand-accent-emerald">Instant (0s)</strong>
                      </span>
                      <span>•</span>
                      <span>0% gateway commission</span>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div
                    onClick={() => setSimStep(2)}
                    className={`p-6 rounded-2xl shadow-sm space-y-3 transition-all cursor-pointer hover:-translate-y-1 border ${
                      simStep === 2
                        ? isDark
                          ? 'bg-slate-900 border-brand-accent-cyan shadow-lg shadow-brand-accent-cyan/10'
                          : 'bg-surface-container-lowest border-primary/50 shadow-md ring-1 ring-primary/20'
                        : isDark
                        ? 'bg-slate-900/90 border-slate-800'
                        : 'bg-surface-container-lowest border-border-subtle/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full font-headline-sm text-sm font-bold flex items-center justify-center ${
                            isDark
                              ? 'bg-slate-800 text-brand-accent-cyan border border-brand-accent-cyan/40'
                              : 'bg-surface-container text-primary'
                          }`}
                        >
                          02
                        </span>
                        <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant font-bold">
                          Direct Rail Routing
                        </span>
                      </div>
                      <span className="font-label-mono-sm text-caption-caps text-outline">
                        NPCI Direct Switch
                      </span>
                    </div>
                    <h3
                      className={`font-headline-sm text-headline-sm font-bold ${
                        isDark ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      Zero-intermediary account routing
                    </h3>
                    <p
                      className={`font-body-md text-body-md leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-on-surface-variant'
                      }`}
                    >
                      Transactions execute directly through the NPCI UPI rail switch straight into your own merchant bank current account. Funds never enter a 3rd-party escrow holding pool.
                    </p>
                    <div className="pt-2 flex items-center gap-4 font-label-mono-sm text-caption-caps text-on-surface-variant">
                      <span>
                        Intermediaries: <strong className="text-on-surface">Zero</strong>
                      </span>
                      <span>•</span>
                      <span>Direct bank ownership</span>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div
                    onClick={() => setSimStep(3)}
                    className={`p-6 rounded-2xl shadow-sm space-y-3 transition-all cursor-pointer hover:-translate-y-1 border ${
                      simStep === 3
                        ? isDark
                          ? 'bg-slate-900 border-brand-accent-cyan shadow-lg shadow-brand-accent-cyan/10'
                          : 'bg-surface-container-lowest border-primary/50 shadow-md ring-1 ring-primary/20'
                        : isDark
                        ? 'bg-slate-900/90 border-slate-800'
                        : 'bg-surface-container-lowest border-border-subtle/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full font-headline-sm text-sm font-bold flex items-center justify-center ${
                            isDark
                              ? 'bg-slate-800 text-brand-accent-emerald border border-brand-accent-emerald/40'
                              : 'bg-surface-container text-primary'
                          }`}
                        >
                          03
                        </span>
                        <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant font-bold">
                          Reconcile &amp; Webhook
                        </span>
                      </div>
                      <span className="font-label-mono-sm text-caption-caps text-brand-accent-emerald bg-brand-accent-emerald/10 px-2 py-0.5 rounded">
                        &lt;200ms latency
                      </span>
                    </div>
                    <h3
                      className={`font-headline-sm text-headline-sm font-bold ${
                        isDark ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      Instant credit &amp; automated webhook
                    </h3>
                    <p
                      className={`font-body-md text-body-md leading-relaxed ${
                        isDark ? 'text-slate-300' : 'text-on-surface-variant'
                      }`}
                    >
                      Real-time bank statement &amp; SMS parsers match the unique 12-digit UPI UTR. Your server receives an HMAC-SHA256 signed webhook in under 200ms to fulfill the order.
                    </p>
                    <div className="pt-2 flex items-center gap-4 font-label-mono-sm text-caption-caps text-on-surface-variant">
                      <span>
                        Escrow hold: <strong className="text-brand-accent-emerald">0 days</strong>
                      </span>
                      <span>•</span>
                      <span>Webhook in &lt;200ms</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Interactive Step Simulation Display */}
                <div
                  className={`lg:col-span-5 rounded-3xl p-7 flex flex-col justify-between shadow-2xl relative border ${
                    isDark
                      ? 'bg-gradient-to-b from-slate-900 to-black text-slate-100 border-slate-800'
                      : 'bg-code-surface text-inverse-on-surface border-slate-800'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-caption-caps font-label-mono-sm text-outline-variant">
                      <span>settlement-engine // v2.4</span>
                      <span className="text-brand-accent-emerald flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-brand-accent-emerald animate-pulse"></span>
                        {simStep === 1 && 'Step 1: Intent & QR Checkout'}
                        {simStep === 2 && 'Step 2: NPCI Direct Routing'}
                        {simStep === 3 && 'Step 3: Settled & Dispatched ✓'}
                      </span>
                    </div>

                    {/* Merchant payment preview card */}
                    <div
                      className={`rounded-2xl p-5 space-y-4 border ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-inverse-surface border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                              isDark
                                ? 'bg-gradient-to-tr from-brand-accent-cyan to-primary text-white'
                                : 'bg-primary-container text-on-primary'
                            }`}
                          >
                            MP
                          </div>
                          <div>
                            <p className="font-headline-sm text-body-md font-bold text-inverse-on-surface">
                              Acme Retail Ltd
                            </p>
                            <p className="font-label-mono-sm text-caption-caps text-outline-variant">
                              #INV-8492 · 0% Gateway Fee
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-outline-variant font-label-mono-sm text-caption-caps block">
                            Amount Due
                          </span>
                          <span className="font-headline-lg text-headline-md font-extrabold text-inverse-on-surface">
                            ₹2,499.00
                          </span>
                        </div>
                      </div>

                      {/* Big Visual QR Module / Live Simulator Card */}
                      <div className="bg-surface-container-lowest p-6 rounded-xl flex flex-col items-center text-center">
                        <p className="font-label-mono-sm text-[10px] text-on-surface-variant font-semibold mb-2 uppercase tracking-wider">
                          BHARAT UPI QR · acmestore@icici
                        </p>
                        <div className="w-44 h-44 bg-surface-container-low rounded-lg p-3 flex items-center justify-center mb-3">
                          {simStep === 3 ? (
                            <div className="flex flex-col items-center justify-center text-brand-accent-emerald animate-scale-up">
                              <span className="material-symbols-outlined text-[64px]">verified</span>
                              <span className="font-headline-sm text-sm font-bold mt-2">Paid ₹2,499.00</span>
                              <span className="font-label-mono-sm text-[10px] text-slate-500">UTR: 329184029182</span>
                            </div>
                          ) : (
                            <svg className="w-full h-full text-code-surface" fill="currentColor" viewBox="0 0 100 100">
                              <rect fill="none" height="26" rx="4" stroke="currentColor" strokeWidth="4" width="26" x="6" y="6"></rect>
                              <rect fill="currentColor" height="10" width="10" x="14" y="14"></rect>
                              <rect fill="none" height="26" rx="4" stroke="currentColor" strokeWidth="4" width="26" x="68" y="6"></rect>
                              <rect fill="currentColor" height="10" width="10" x="76" y="14"></rect>
                              <rect fill="none" height="26" rx="4" stroke="currentColor" strokeWidth="4" width="26" x="6" y="68"></rect>
                              <rect fill="currentColor" height="10" width="10" x="14" y="76"></rect>
                              <rect height="8" rx="1" width="8" x="38" y="10"></rect>
                              <rect height="8" rx="1" width="8" x="52" y="14"></rect>
                              <rect height="8" rx="1" width="8" x="38" y="24"></rect>
                              <rect className="text-primary" height="10" rx="2" width="10" x="50" y="26"></rect>
                              <rect height="8" rx="1" width="8" x="10" y="40"></rect>
                              <rect height="8" rx="1" width="8" x="24" y="44"></rect>
                              <rect className="text-primary" height="12" rx="2" width="12" x="38" y="40"></rect>
                              <rect height="8" rx="1" width="8" x="56" y="42"></rect>
                              <rect height="8" rx="1" width="8" x="70" y="40"></rect>
                              <rect height="8" rx="1" width="8" x="84" y="46"></rect>
                              <rect height="8" rx="1" width="8" x="40" y="58"></rect>
                              <rect className="text-brand-accent-emerald" height="12" rx="2" width="12" x="54" y="58"></rect>
                              <rect height="8" rx="1" width="8" x="72" y="56"></rect>
                              <rect height="8" rx="1" width="8" x="84" y="60"></rect>
                              <rect height="8" rx="1" width="8" x="38" y="76"></rect>
                              <rect height="8" rx="1" width="8" x="52" y="78"></rect>
                              <rect height="10" rx="2" width="10" x="66" y="74"></rect>
                              <rect height="8" rx="1" width="8" x="82" y="78"></rect>
                            </svg>
                          )}
                        </div>
                        <p className="font-headline-sm text-sm font-semibold text-on-surface">
                          {simStep === 3 ? 'Payment Settled to Bank!' : 'Scan & Pay ₹2,499.00 with Any UPI App'}
                        </p>
                        <p className="font-body-sm text-caption-caps text-on-surface-variant mt-1">
                          {simStep === 3
                            ? 'HMAC webhook event dispatched in 42ms'
                            : 'Instant settlement directly into your ICICI Current Account'}
                        </p>
                      </div>

                      {/* Settlement Guarantee Strip */}
                      <div className="flex items-center justify-between text-caption-caps font-label-mono-sm px-2 pt-1">
                        <span className="text-brand-accent-emerald flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm">lock</span> Direct Bank-to-Bank · No Escrow
                        </span>
                        <span className="text-outline-variant font-bold">0% Fee</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    {simStep === 3 ? (
                      <button
                        onClick={handleResetSimulation}
                        className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-body-md font-semibold transition-all flex items-center justify-center gap-2 border border-slate-600"
                      >
                        <span className="material-symbols-outlined text-sm">restart_alt</span>
                        Reset Simulation
                      </button>
                    ) : (
                      <button
                        onClick={handleSimulatePayment}
                        disabled={isSimulating}
                        className={`w-full py-3 px-4 rounded-xl font-body-md font-semibold transition-all flex items-center justify-center gap-2 shadow-md ${
                          isDark
                            ? 'bg-primary-container hover:bg-blue-600 text-white border border-brand-accent-cyan/30'
                            : 'bg-primary-container hover:bg-primary text-on-primary'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {isSimulating ? 'sync' : 'qr_code_scanner'}
                        </span>
                        {isSimulating ? 'Processing Bank Routing...' : 'Simulate Customer Payment (₹2,499)'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────
             ARCHITECTURAL COMPARISON (GATEWAYS VS MYMOBPAY DIRECT RAIL)
             ──────────────────────────────────────────────────────── */}
          <section className="w-full py-20 px-6 lg:px-12 relative">
            <div className="max-w-7xl mx-auto space-y-12">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span
                  className={`inline-flex px-3 py-1 rounded-full font-label-mono-sm text-caption-caps uppercase ${
                    isDark
                      ? 'bg-slate-900 border border-brand-accent-cyan/40 text-brand-accent-cyan'
                      : 'bg-surface-container text-primary border border-primary/10'
                  }`}
                >
                  Architectural Breakdown
                </span>
                <h2
                  className={`font-headline-xl text-headline-xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  Why merchants are replacing traditional aggregators
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* Left: Traditional Aggregators */}
                <div
                  className={`rounded-3xl p-8 space-y-6 flex flex-col justify-between border ${
                    isDark
                      ? 'bg-slate-950/80 border-red-950/80'
                      : 'bg-surface-container-low/70 border-border-subtle/80'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant font-bold">
                        Traditional Gateways
                      </span>
                      <span className="px-3 py-1 rounded-full bg-error/10 text-error font-label-mono-sm text-caption-caps font-semibold">
                        2.0% Fee · T+2 Hold
                      </span>
                    </div>
                    <h3
                      className={`font-headline-lg text-headline-lg font-bold ${
                        isDark ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      Aggregator Escrow Rail
                    </h3>
                    <ul
                      className={`space-y-4 font-body-md text-body-md pt-4 ${
                        isDark ? 'text-slate-300' : 'text-on-surface-variant'
                      }`}
                    >
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">close</span>
                        <span>
                          <strong className={isDark ? 'text-white' : 'text-on-surface'}>2% + 18% GST deducted</strong> on every single order (loss of ₹20,000 on ₹10L monthly volume).
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">close</span>
                        <span>
                          <strong className={isDark ? 'text-white' : 'text-on-surface'}>48-hour escrow delay (T+2)</strong> before funds are disbursed into your bank account.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">close</span>
                        <span>
                          <strong className={isDark ? 'text-white' : 'text-on-surface'}>Rolling reserve risk</strong> and sudden risk department account payout freezes.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-error text-[20px] shrink-0 mt-0.5">close</span>
                        <span>
                          <strong className={isDark ? 'text-white' : 'text-on-surface'}>Payout withdrawal fee</strong> charged each time you withdraw your own earned money.
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-6 border-t border-border-subtle/70 flex items-center justify-between text-body-sm font-label-mono-sm">
                    <span className="text-on-surface-variant">Settlement timeline:</span>
                    <span className="text-error font-bold">2 to 3 Business Days</span>
                  </div>
                </div>

                {/* Right: MyMobPay Direct Rail */}
                <div
                  className={`rounded-3xl p-8 space-y-6 flex flex-col justify-between shadow-xl relative border-2 ${
                    isDark
                      ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-brand-accent-emerald/40 cyber-glow-emerald'
                      : 'bg-surface-container-lowest border-primary/20'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-caption-caps text-caption-caps uppercase font-bold ${
                          isDark ? 'text-brand-accent-cyan' : 'text-primary'
                        }`}
                      >
                        MyMobPay Direct Rail
                      </span>
                      <span className="px-3 py-1 rounded-full bg-tertiary/10 text-brand-accent-emerald font-label-mono-sm text-caption-caps font-semibold">
                        0% Commission · Instant 0s
                      </span>
                    </div>
                    <h3
                      className={`font-headline-lg text-headline-lg font-bold ${
                        isDark ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      Direct Account Settlement
                    </h3>
                    <ul className="space-y-4 font-body-md text-body-md text-on-surface pt-4">
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-[20px] shrink-0 mt-0.5">check_circle</span>
                        <span>
                          <strong className="text-brand-accent-emerald">0% Transaction Commission</strong> — You keep 100% of customer payments directly.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-[20px] shrink-0 mt-0.5">check_circle</span>
                        <span>
                          <strong className="text-brand-accent-emerald">Instant 0-Second Settlement</strong> — Funds land directly in your merchant bank current account.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-[20px] shrink-0 mt-0.5">check_circle</span>
                        <span>
                          <strong className="text-brand-accent-emerald">Zero Escrow Risk</strong> — No middleman holds your money; you maintain 100% custody.
                        </span>
                      </li>
                      <li className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-[20px] shrink-0 mt-0.5">check_circle</span>
                        <span>
                          <strong className="text-brand-accent-emerald">&lt; 200ms Signed Webhooks</strong> — Automated statement parsing triggers instant fulfillment.
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div className="pt-6 border-t border-border-subtle flex items-center justify-between text-body-sm font-label-mono-sm">
                    <span className="text-on-surface-variant">Settlement timeline:</span>
                    <span className="text-brand-accent-emerald font-bold">0 Seconds (Instant Liquidity)</span>
                  </div>
                </div>
              </div>

              {/* Bottom Savings Callout Strip */}
              <div
                className={`rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border ${
                  isDark
                    ? 'bg-slate-900 border-slate-800'
                    : 'bg-surface-container border-primary/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`material-symbols-outlined text-[24px] ${
                      isDark ? 'text-brand-accent-cyan' : 'text-primary'
                    }`}
                  >
                    savings
                  </span>
                  <p className="font-body-md text-body-md text-on-surface">
                    <strong>Keep your profit margins where they belong.</strong> Indian merchants save an average of ₹1,20,000 annually per ₹50L GMV using MyMobPay.
                  </p>
                </div>
                <a
                  href="#calculator"
                  className={`shrink-0 px-5 py-2.5 rounded-full font-body-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm ${
                    isDark
                      ? 'bg-primary-container text-white hover:bg-blue-600 border border-brand-accent-cyan/30'
                      : 'bg-primary-container text-on-primary hover:bg-primary'
                  }`}
                >
                  Start Direct Settlement <span className="text-xs">→</span>
                </a>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────
             SPLIT BANNER SECTION: ELIMINATE GATEWAY INTERMEDIARIES
             ──────────────────────────────────────────────────────── */}
          <section
            className={`w-full py-16 px-6 lg:px-12 border-y ${
              isDark ? 'bg-[#030712] border-border-subtle/80' : 'bg-[#f8fafc] border-border-subtle/50'
            }`}
          >
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              <div
                className={`p-8 rounded-3xl shadow-sm flex flex-col justify-between space-y-6 border ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-surface-container-lowest border-border-subtle/60'
                }`}
              >
                <div className="space-y-3">
                  <span
                    className={`font-label-mono-sm text-caption-caps uppercase font-semibold ${
                      isDark ? 'text-brand-accent-cyan' : 'text-primary'
                    }`}
                  >
                    Direct bank settlement rail
                  </span>
                  <h3
                    className={`font-headline-lg text-headline-lg font-bold leading-snug ${
                      isDark ? 'text-white' : 'text-on-surface'
                    }`}
                  >
                    Route payments directly to your bank account, saving on intermediary transaction fees with instant UPI and IMPS transfers.
                  </h3>
                </div>
                <p
                  className={`font-body-md text-body-md ${
                    isDark ? 'text-slate-300' : 'text-on-surface-variant'
                  }`}
                >
                  Receive direct account transfers with zero escrow delays via automated bank email reconciliation.
                </p>
              </div>

              <div
                className={`p-8 rounded-3xl shadow-sm flex flex-col justify-between space-y-6 border ${
                  isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-surface-container-lowest border-border-subtle/60'
                }`}
              >
                <div className="space-y-3">
                  <span className="font-label-mono-sm text-caption-caps uppercase text-brand-accent-emerald font-semibold">
                    Institutional Grade SLA
                  </span>
                  <h3
                    className={`font-headline-lg text-headline-lg font-bold leading-snug ${
                      isDark ? 'text-white' : 'text-on-surface'
                    }`}
                  >
                    Experience instant settlements with 99.98% reliability, zero escrow holding periods, and no percentage-based gateway deductions.
                  </h3>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p
                    className={`font-body-md text-body-md ${
                      isDark ? 'text-slate-300' : 'text-on-surface-variant'
                    }`}
                  >
                    A dependable direct payment solution engineered for fast-moving Indian businesses.
                  </p>
                  <a
                    href="#pricing"
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm ${
                      isDark
                        ? 'bg-primary-container text-white hover:bg-blue-600 border border-brand-accent-cyan/40'
                        : 'bg-primary-container text-on-primary hover:bg-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────
             MARQUEE TECH STACK TICKER
             ──────────────────────────────────────────────────────── */}
          <div
            className={`w-full py-3.5 px-4 overflow-hidden whitespace-nowrap border-y ${
              isDark
                ? 'bg-black text-brand-accent-cyan border-border-subtle/80'
                : 'bg-code-surface text-on-primary-container border-slate-800'
            }`}
          >
            <div className="inline-flex items-center gap-8 font-label-mono-sm text-caption-caps uppercase tracking-widest text-outline-variant">
              <span>NEXT.JS</span><span>•</span>
              <span>REACT</span><span>•</span>
              <span>NODE.JS</span><span>•</span>
              <span>TYPESCRIPT</span><span>•</span>
              <span>REST API</span><span>•</span>
              <span>PYTHON</span><span>•</span>
              <span>PHP</span><span>•</span>
              <span>FLUTTER</span><span>•</span>
              <span>REACT NATIVE</span><span>•</span>
              <span>JAVASCRIPT</span><span>•</span>
              <span>NEXT.JS</span><span>•</span>
              <span>REACT</span><span>•</span>
              <span>NODE.JS</span><span>•</span>
              <span>TYPESCRIPT</span><span>•</span>
              <span>REST API</span><span>•</span>
              <span>PYTHON</span><span>•</span>
              <span>PHP</span><span>•</span>
              <span>FLUTTER</span><span>•</span>
              <span>REACT NATIVE</span>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────
             DEVELOPER-FIRST ARCHITECTURE & LIVE CODE TERMINAL
             ──────────────────────────────────────────────────────── */}
          <section
            className={`w-full py-20 px-6 lg:px-12 relative overflow-hidden ${
              isDark ? 'bg-[#020617] text-white' : 'bg-code-surface text-inverse-on-surface'
            }`}
            id="developers"
          >
            <div className="max-w-7xl mx-auto space-y-16">
              {/* Section Header */}
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span className="inline-flex px-3 py-1 rounded-full bg-inverse-surface text-brand-accent-cyan font-label-mono-sm text-caption-caps uppercase border border-cyan-500/20">
                  DEVELOPER-FIRST ARCHITECTURE
                </span>
                <h2 className="font-headline-xl text-headline-xl lg:text-display-hero lg:font-display-hero font-bold tracking-tight text-inverse-on-surface">
                  MyMobPay is built <br className="hidden sm:block" />
                  <span className="text-brand-accent-cyan">&lt;for developers by developers&gt;</span>
                </h2>
                <p className="font-body-lg text-body-lg text-outline-variant">
                  Integrate direct-to-bank settlements in under 15 minutes. Eliminate the 2% aggregator cut with typed SDKs, deterministic REST endpoints, and signed HMAC webhooks.
                </p>
              </div>

              {/* 3 Developer Highlights Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-inverse-surface/60 p-6 rounded-2xl space-y-4 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-brand-accent-cyan flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">terminal</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-inverse-on-surface">SDKs &amp; Libraries</h3>
                  <p className="font-body-md text-body-md text-outline-variant">
                    Official typed libraries for Next.js, Node.js, Python, PHP, Flutter, and React Native with end-to-end type safety.
                  </p>
                  <Link href="/docs" className="inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-brand-accent-cyan hover:underline">
                    Explore SDKs →
                  </Link>
                </div>

                <div className="bg-inverse-surface/60 p-6 rounded-2xl space-y-4 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-brand-accent-cyan flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">api</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-inverse-on-surface">RESTful Endpoints</h3>
                  <p className="font-body-md text-body-md text-outline-variant">
                    Deterministic, idempotent HTTP APIs for order creation, dynamic QR generation, and real-time status verification.
                  </p>
                  <Link href="/docs" className="inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-brand-accent-cyan hover:underline">
                    API Reference →
                  </Link>
                </div>

                <div className="bg-inverse-surface/60 p-6 rounded-2xl space-y-4 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary-container/20 text-brand-accent-emerald flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">security</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm font-bold text-inverse-on-surface">Real-Time Webhooks</h3>
                  <p className="font-body-md text-body-md text-outline-variant">
                    Cryptographically signed HMAC-SHA256 event notifications dispatched straight to your server with automated retries.
                  </p>
                  <Link href="/docs" className="inline-flex items-center gap-1 font-body-sm text-body-sm font-semibold text-brand-accent-emerald hover:underline">
                    Webhook Guide →
                  </Link>
                </div>
              </div>

              {/* Live Interactive Code Terminal Mockup */}
              <div
                className={`w-full rounded-3xl shadow-2xl overflow-hidden border ${
                  isDark
                    ? 'bg-[#02040a] border-slate-800 cyber-glow-cyan'
                    : 'bg-[#030712] border-slate-800'
                }`}
              >
                {/* Terminal Header & Tabs */}
                <div className="bg-inverse-surface px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-[#ef4444]"></span>
                      <span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span>
                      <span className="w-3 h-3 rounded-full bg-[#10b981]"></span>
                    </div>
                    <span className="font-label-mono-sm text-caption-caps text-outline-variant ml-3">
                      Try it out for yourself
                    </span>
                    <span className="px-2 py-0.5 rounded bg-tertiary/20 text-brand-accent-emerald font-label-mono-sm text-[10px] font-semibold">
                      Live API
                    </span>
                  </div>

                  {/* Language Selector Tabs */}
                  <div className="flex items-center gap-1 bg-[#030712] p-1 rounded-xl font-label-mono-sm text-caption-caps border border-slate-800">
                    {[
                      { id: 'curl', label: 'cURL' },
                      { id: 'node', label: 'Node.js' },
                      { id: 'next', label: 'Next.js / React' },
                      { id: 'python', label: 'Python' },
                      { id: 'php', label: 'PHP' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveLangTab(tab.id)}
                        className={`px-3 py-1 rounded-lg transition-colors ${
                          activeLangTab === tab.id
                            ? 'bg-inverse-surface text-brand-accent-cyan font-semibold'
                            : 'text-outline-variant hover:text-inverse-on-surface'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Terminal Body */}
                <div className="p-6 lg:p-8 space-y-6">
                  <div className="flex items-center justify-between font-label-mono-sm text-caption-caps text-outline-variant">
                    <span>
                      {activeLangTab === 'curl' && 'request.sh'}
                      {activeLangTab === 'node' && 'server.js'}
                      {activeLangTab === 'next' && 'api/route.ts'}
                      {activeLangTab === 'python' && 'app.py'}
                      {activeLangTab === 'php' && 'checkout.php'}
                    </span>
                    <button
                      onClick={handleCopyCode}
                      className="flex items-center gap-1 cursor-pointer hover:text-inverse-on-surface transition-colors"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-brand-accent-emerald" />
                          <span className="text-brand-accent-emerald">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code Block Snippet */}
                  <pre className="font-label-mono-lg text-label-mono-sm sm:text-label-mono-lg text-inverse-on-surface overflow-x-auto leading-relaxed">
                    {codeSnippets[activeLangTab]}
                  </pre>

                  {/* Verified Webhook Response Preview Strip */}
                  <div className="pt-6 border-t border-inverse-surface/80 space-y-3 font-label-mono-sm">
                    <div className="flex flex-wrap items-center justify-between text-caption-caps gap-2">
                      <span className="text-brand-accent-emerald flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-accent-emerald animate-pulse"></span>
                        POST /api/webhooks/settlement • 200 OK
                      </span>
                      <span className="text-outline-variant">42ms latency</span>
                    </div>
                    <div className="p-4 rounded-xl bg-inverse-surface/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-caption-caps border border-slate-800">
                      <div className="flex items-center gap-2 text-outline-variant">
                        <span>
                          Header: <code className="text-brand-accent-amber">x-mymobpay-signature:</code>
                        </span>
                        <code className="text-brand-accent-cyan">sha256=9f8a4e81...</code>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-tertiary/20 text-brand-accent-emerald font-semibold self-start md:self-auto">
                        HMAC Verified ✓
                      </span>
                    </div>
                    <pre className="text-[12px] text-outline-variant overflow-x-auto">
                      <code>{`{ "event": "payment.settled", "utr": "329184029182", "net": 1499.00, "fee": 0.00, "route": "direct_bank" }`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────
             COST COMPARISON & INTERACTIVE SAVINGS CALCULATOR
             ──────────────────────────────────────────────────────── */}
          <section className="w-full py-20 px-6 lg:px-12" id="calculator">
            <div className="max-w-5xl mx-auto space-y-12">
              {/* Section Header */}
              <div className="text-center space-y-3">
                <span
                  className={`inline-flex px-3 py-1 rounded-full font-label-mono-sm text-caption-caps uppercase ${
                    isDark
                      ? 'bg-slate-900 border border-brand-accent-cyan/40 text-brand-accent-cyan'
                      : 'bg-surface-container text-primary border border-primary/10'
                  }`}
                >
                  Cost comparison
                </span>
                <h2
                  className={`font-headline-xl text-headline-xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  Stop losing 2% on transaction volumes
                </h2>
                <p
                  className={`font-body-lg text-body-lg max-w-2xl mx-auto ${
                    isDark ? 'text-slate-300' : 'text-on-surface-variant'
                  }`}
                >
                  Calculate how much your business saves each year with flat subscription pricing.
                </p>
              </div>

              {/* Calculator Card Module */}
              <div
                className={`p-8 lg:p-12 rounded-3xl shadow-xl space-y-10 border ${
                  isDark
                    ? 'bg-slate-950/90 border-slate-800 cyber-glow-blue'
                    : 'bg-surface-container-lowest border-border-subtle/80'
                }`}
              >
                {/* Monthly Sales Volume Slider Area */}
                <div className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant font-bold">
                      Monthly sales volume
                    </span>
                    <span
                      className={`font-headline-xl text-headline-lg font-bold ${
                        isDark ? 'text-brand-accent-cyan' : 'text-primary'
                      }`}
                    >
                      {formatINR(monthlyVolume)}
                    </span>
                  </div>
                  <input
                    className={`w-full h-3 rounded-lg appearance-none cursor-pointer ${
                      isDark
                        ? 'bg-slate-800 accent-brand-accent-cyan'
                        : 'bg-surface-container accent-primary'
                    }`}
                    id="volumeSlider"
                    max="5000000"
                    min="10000"
                    step="10000"
                    type="range"
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(parseFloat(e.target.value) || 10000)}
                  />
                  <div className="flex justify-between font-label-mono-sm text-caption-caps text-on-surface-variant">
                    <span>₹10K</span>
                    <span>₹25L</span>
                    <span>₹50L</span>
                  </div>
                </div>

                {/* 2 Comparison Breakdown Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div
                    className={`p-6 rounded-2xl space-y-2 border ${
                      isDark
                        ? 'bg-slate-900 border-red-950'
                        : 'bg-surface-container-low border-border-subtle/40'
                    }`}
                  >
                    <span className="font-caption-caps text-caption-caps uppercase text-error font-bold block">
                      Traditional gateways (2%)
                    </span>
                    <p
                      className={`font-headline-lg text-headline-lg font-bold ${
                        isDark ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      {formatINR(monthlyCut)} / mo
                    </p>
                    <p
                      className={`font-body-sm text-body-sm ${
                        isDark ? 'text-slate-400' : 'text-on-surface-variant'
                      }`}
                    >
                      Losing {formatINR(annualCut)} annually in transaction cuts.
                    </p>
                  </div>

                  <div
                    className={`p-6 rounded-2xl space-y-2 border ${
                      isDark
                        ? 'bg-slate-900 border-brand-accent-cyan/40'
                        : 'bg-surface-container border-primary/15'
                    }`}
                  >
                    <span
                      className={`font-caption-caps text-caption-caps uppercase font-bold block ${
                        isDark ? 'text-brand-accent-cyan' : 'text-primary'
                      }`}
                    >
                      MyMobPay subscription
                    </span>
                    <p
                      className={`font-headline-lg text-headline-lg font-bold ${
                        isDark ? 'text-brand-accent-cyan' : 'text-primary'
                      }`}
                    >
                      ₹{subscriptionFee} / mo
                    </p>
                    <p
                      className={`font-body-sm text-body-sm ${
                        isDark ? 'text-slate-300' : 'text-on-surface-variant'
                      }`}
                    >
                      Flat SaaS subscription with zero transaction cuts.
                    </p>
                  </div>
                </div>

                {/* Big Highlighted Guaranteed Annual Savings Card */}
                <div
                  className={`p-8 rounded-2xl text-center space-y-4 border ${
                    isDark
                      ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-brand-accent-emerald/40 shadow-xl'
                      : 'bg-surface-container-low border-border-subtle/60'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="font-caption-caps text-caption-caps uppercase text-brand-accent-emerald font-bold tracking-wider">
                      Guaranteed annual savings
                    </span>
                    <p
                      className={`font-body-md text-body-md ${
                        isDark ? 'text-slate-300' : 'text-on-surface-variant'
                      }`}
                    >
                      Keep 100% of your transaction revenue directly inside your bank.
                    </p>
                  </div>
                  <div
                    className={`font-headline-xl text-display-hero font-extrabold tracking-tight ${
                      isDark ? 'text-brand-accent-emerald' : 'text-tertiary'
                    }`}
                  >
                    {formatINR(netSavings)}
                  </div>
                  <span className="font-body-sm text-caption-caps uppercase text-on-surface-variant font-bold tracking-wider block">
                    Retained net profit per year
                  </span>
                  <div
                    className={`pt-4 font-label-mono-sm text-caption-caps text-on-surface-variant inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-300 shadow-inner'
                        : 'bg-surface-container-lowest border-border-subtle/40'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-sm ${
                        isDark ? 'text-brand-accent-cyan' : 'text-primary'
                      }`}
                    >
                      info
                    </span>
                    <span>
                      Formula breakdown: ({formatINR(monthlyVolume)} × 2% × 12) − (₹{subscriptionFee} × 12) = {formatINR(netSavings)}
                    </span>
                  </div>
                </div>

                {/* 0% MDR Guarantee Policy Card */}
                <div
                  className={`p-6 rounded-2xl space-y-3 border ${
                    isDark
                      ? 'bg-slate-900 border-slate-800'
                      : 'bg-surface-container-low border-border-subtle/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-headline-sm text-body-md font-bold ${
                        isDark ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      Direct settlement 0% MDR guarantee
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-tertiary/20 text-brand-accent-emerald font-label-mono-sm text-caption-caps font-semibold">
                      0% MDR guaranteed
                    </span>
                  </div>
                  <p
                    className={`font-body-md text-body-md leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-on-surface-variant'
                    }`}
                  >
                    While traditional payment gateways take <strong>2% to 2.36%</strong> on every transaction, MyMobPay keeps your profits intact. All UPI payments under ₹2,000 remain at <strong>0% MDR</strong>, and higher order values route directly through automated <strong>Direct Bank Transfer (IMPS / NEFT)</strong> with zero transaction fees.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────
             MERCHANT STORIES / REAL WORLD CASE STUDIES WITH PHOTOS
             ──────────────────────────────────────────────────────── */}
          <section
            className={`w-full py-20 px-6 lg:px-12 border-y ${
              isDark ? 'bg-[#020617] border-border-subtle/80' : 'bg-[#f8fafc] border-border-subtle/50'
            }`}
          >
            <div className="max-w-7xl mx-auto space-y-16">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span
                  className={`inline-flex px-3 py-1 rounded-full font-label-mono-sm text-caption-caps uppercase ${
                    isDark
                      ? 'bg-slate-900 border border-brand-accent-cyan/40 text-brand-accent-cyan'
                      : 'bg-surface-container text-primary border border-primary/10'
                  }`}
                >
                  Merchant stories
                </span>
                <h2
                  className={`font-headline-xl text-headline-xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  See MyMobPay in action
                </h2>
                <p
                  className={`font-body-lg text-body-lg ${
                    isDark ? 'text-slate-300' : 'text-on-surface-variant'
                  }`}
                >
                  Trusted by SaaS founders, indie developers, and growing businesses across India.
                </p>
              </div>

              {/* 3 Case Study Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Card 1 */}
                <div
                  className={`rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-lg hover:-translate-y-1 transition-all border ${
                    isDark
                      ? 'bg-slate-950/90 border-slate-800 hover:border-brand-accent-cyan/50'
                      : 'bg-surface-container-lowest border-border-subtle/60'
                  }`}
                >
                  <div>
                    <div className="w-full h-56 overflow-hidden relative">
                      <Image
                        alt="Customer scanning dynamic UPI QR code on smartphone screen for instantaneous direct checkout"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src="https://lh3.googleusercontent.com/aida/AEtjO1XPOYt__pf1vTOVu5c3sjYQbGiSPRQNw_Q2hNOcKAD0kLWfQ6t5heci-4ykRmsQ4CH8p-PxcigL0Tds41p9QAw28GTyxcgJrUYfSV2FkQXJUlQAptODPTMnJ-gB06PrX7qs5OmZpt8epQiFDwe7VicowB-Bve8ulNpjjEdoixeDSmcJbe-N5IbzNU9R-ynQgGIPdeN1EBFTcvCeo_hStin-tlG32JpaOu2raWQ32bfCYw"
                        width={400}
                        height={224}
                        unoptimized
                      />
                      <div className="absolute top-3 right-3 bg-surface-container-lowest/85 backdrop-blur-md px-2.5 py-1 rounded-full font-label-mono-sm text-[10px] text-brand-accent-emerald font-bold shadow-xs border border-border-subtle/40">
                        Verified
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      <span
                        className={`font-label-mono-sm text-caption-caps uppercase font-semibold ${
                          isDark ? 'text-brand-accent-cyan' : 'text-primary'
                        }`}
                      >
                        Instant QR checkout
                      </span>
                      <h3
                        className={`font-headline-sm text-headline-sm font-bold ${
                          isDark ? 'text-white' : 'text-on-surface'
                        }`}
                      >
                        Seamless scan and pay
                      </h3>
                      <p
                        className={`font-body-md text-body-md leading-relaxed ${
                          isDark ? 'text-slate-300' : 'text-on-surface-variant'
                        }`}
                      >
                        Customers scan dynamic QR codes using any UPI application with immediate payment confirmation.
                      </p>
                    </div>
                  </div>
                  <div className="p-6 pt-0 border-t border-border-subtle/50 flex items-center justify-between font-label-mono-sm text-caption-caps text-on-surface-variant">
                    <span>
                      Payment rail: <strong className="text-on-surface">UPI</strong>
                    </span>
                    <span className="text-brand-accent-emerald font-semibold">Instant verification</span>
                  </div>
                </div>

                {/* Card 2 */}
                <div
                  className={`rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-lg hover:-translate-y-1 transition-all border ${
                    isDark
                      ? 'bg-slate-950/90 border-slate-800 hover:border-brand-accent-cyan/50'
                      : 'bg-surface-container-lowest border-border-subtle/60'
                  }`}
                >
                  <div>
                    <div className="w-full h-56 overflow-hidden relative">
                      <Image
                        alt="SaaS merchant founder reviewing real-time revenue analytics and webhook dispatches on laptop in office"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src="https://lh3.googleusercontent.com/aida/AEtjO1VcOOG1ea68nKMYMjcKPMJbKmvgYJ9HQjML3k9_VcP7k99DpkXiPSsLNZk2Dt2h34rWugFzxY_fkWpvn4jKzYq3i2xVHtk3NTC1cremASRrl1ZWF39m3vVMHgqzUV8NYAiPaNoo4J8IJ3x-wpA5zW_qvMoQ2R29KhDjLzuyzt7kpgTeTNMx7eaRD-PQy7pqWz6WWrHlxjebyNH3oQe7NXV3gh-QRRgT1O9TFxjIbOVyAg"
                        width={400}
                        height={224}
                        unoptimized
                      />
                      <div
                        className={`absolute top-3 right-3 bg-surface-container-lowest/85 backdrop-blur-md px-2.5 py-1 rounded-full font-label-mono-sm text-[10px] font-bold shadow-xs border border-border-subtle/40 ${
                          isDark ? 'text-brand-accent-cyan' : 'text-primary'
                        }`}
                      >
                        Live Logs
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      <span
                        className={`font-label-mono-sm text-caption-caps uppercase font-semibold ${
                          isDark ? 'text-brand-accent-cyan' : 'text-primary'
                        }`}
                      >
                        Merchant console
                      </span>
                      <h3
                        className={`font-headline-sm text-headline-sm font-bold ${
                          isDark ? 'text-white' : 'text-on-surface'
                        }`}
                      >
                        Real-time revenue analytics
                      </h3>
                      <p
                        className={`font-body-md text-body-md leading-relaxed ${
                          isDark ? 'text-slate-300' : 'text-on-surface-variant'
                        }`}
                      >
                        Track incoming transfers, inspect webhook dispatches, and audit reconciliations in real time.
                      </p>
                    </div>
                  </div>
                  <div className="p-6 pt-0 border-t border-border-subtle/50 flex items-center justify-between font-label-mono-sm text-caption-caps text-on-surface-variant">
                    <span>
                      Escrow hold: <strong className="text-brand-accent-emerald">0 days</strong>
                    </span>
                    <span
                      className={`font-semibold ${isDark ? 'text-brand-accent-cyan' : 'text-primary'}`}
                    >
                      Direct account route
                    </span>
                  </div>
                </div>

                {/* Card 3 */}
                <div
                  className={`rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between group hover:shadow-lg hover:-translate-y-1 transition-all border ${
                    isDark
                      ? 'bg-slate-950/90 border-slate-800 hover:border-brand-accent-cyan/50'
                      : 'bg-surface-container-lowest border-border-subtle/60'
                  }`}
                >
                  <div>
                    <div className="w-full h-56 overflow-hidden relative">
                      <Image
                        alt="Retail customers experiencing fast frictionless mobile point of sale checkout in a modern urban store"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        src="https://lh3.googleusercontent.com/aida/AEtjO1XbLRQXOwV9CvrOFvT-7NKWa13uISYv7bxqiUymcW_QhR2k2MGcXk1Wp6iPQQF6IhxYETx470qWKSTi-sAISERL3Xc5fYKMhYifs_JICMSqjEidsvysI-GTMw8AKKs67_KHKTgmMjw3yUn0SGhyZgrlwdLDjYKjH2Kc9YalvmlxTNjm64ph8GXxV30z51fgUFQRD64z-HpR3hsiz_KfbD285_F6J1mJMED4LyWCrAQ0Pw"
                        width={400}
                        height={224}
                        unoptimized
                      />
                      <div className="absolute top-3 right-3 bg-surface-container-lowest/85 backdrop-blur-md px-2.5 py-1 rounded-full font-label-mono-sm text-[10px] text-brand-accent-emerald font-bold shadow-xs border border-border-subtle/40">
                        99.98% SLA
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      <span
                        className={`font-label-mono-sm text-caption-caps uppercase font-semibold ${
                          isDark ? 'text-brand-accent-cyan' : 'text-primary'
                        }`}
                      >
                        Customer experience
                      </span>
                      <h3
                        className={`font-headline-sm text-headline-sm font-bold ${
                          isDark ? 'text-white' : 'text-on-surface'
                        }`}
                      >
                        Frictionless checkout
                      </h3>
                      <p
                        className={`font-body-md text-body-md leading-relaxed ${
                          isDark ? 'text-slate-300' : 'text-on-surface-variant'
                        }`}
                      >
                        Deliver high checkout conversion rates with direct bank-to-bank settlement reliability.
                      </p>
                    </div>
                  </div>
                  <div className="p-6 pt-0 border-t border-border-subtle/50 flex items-center justify-between font-label-mono-sm text-caption-caps text-on-surface-variant">
                    <span>Universal UPI support</span>
                    <span className="text-brand-accent-emerald font-semibold">99.98% success rate</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────
             PLATFORM FEATURES GRID
             ──────────────────────────────────────────────────────── */}
          <section className="w-full py-20 px-6 lg:px-12" id="features">
            <div className="max-w-7xl mx-auto space-y-16">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span
                  className={`inline-flex px-3 py-1 rounded-full font-label-mono-sm text-caption-caps uppercase ${
                    isDark
                      ? 'bg-slate-900 border border-brand-accent-cyan/40 text-brand-accent-cyan'
                      : 'bg-surface-container text-primary border border-primary/10'
                  }`}
                >
                  Platform features
                </span>
                <h2
                  className={`font-headline-xl text-headline-xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  Direct infrastructure and secure verifications
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Feature 1 */}
                <div
                  className={`p-6 rounded-2xl space-y-3 transition-colors border ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 hover:border-brand-accent-cyan/50'
                      : 'bg-surface-container-low border-border-subtle/40 hover:bg-surface-container'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                      isDark
                        ? 'bg-brand-accent-cyan/10 border border-brand-accent-cyan/40 text-brand-accent-cyan'
                        : 'bg-primary-container text-on-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">account_balance</span>
                  </div>
                  <h3
                    className={`font-headline-sm text-headline-sm font-bold ${
                      isDark ? 'text-white' : 'text-on-surface'
                    }`}
                  >
                    Direct bank routing
                  </h3>
                  <p
                    className={`font-body-md text-body-md leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-on-surface-variant'
                    }`}
                  >
                    Customer payments transfer directly to your designated bank account without escrow holding.
                  </p>
                </div>

                {/* Feature 2 */}
                <div
                  className={`p-6 rounded-2xl space-y-3 transition-colors border ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 hover:border-brand-accent-cyan/50'
                      : 'bg-surface-container-low border-border-subtle/40 hover:bg-surface-container'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                      isDark
                        ? 'bg-brand-accent-emerald/10 border border-brand-accent-emerald/40 text-brand-accent-emerald'
                        : 'bg-primary-container text-on-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">verified</span>
                  </div>
                  <h3
                    className={`font-headline-sm text-headline-sm font-bold ${
                      isDark ? 'text-white' : 'text-on-surface'
                    }`}
                  >
                    HMAC SHA-256 webhooks
                  </h3>
                  <p
                    className={`font-body-md text-body-md leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-on-surface-variant'
                    }`}
                  >
                    Every transaction event callback is cryptographically signed using standard HMAC SHA-256.
                  </p>
                </div>

                {/* Feature 3 */}
                <div
                  className={`p-6 rounded-2xl space-y-3 transition-colors border ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 hover:border-brand-accent-cyan/50'
                      : 'bg-surface-container-low border-border-subtle/40 hover:bg-surface-container'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                      isDark
                        ? 'bg-primary-container/20 border border-primary-container/40 text-brand-accent-cyan'
                        : 'bg-primary-container text-on-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">code</span>
                  </div>
                  <h3
                    className={`font-headline-sm text-headline-sm font-bold ${
                      isDark ? 'text-white' : 'text-on-surface'
                    }`}
                  >
                    Isolated developer sandbox
                  </h3>
                  <p
                    className={`font-body-md text-body-md leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-on-surface-variant'
                    }`}
                  >
                    Test checkout redirection flows and webhook dispatches in an isolated sandbox environment.
                  </p>
                </div>

                {/* Feature 4 */}
                <div
                  className={`p-6 rounded-2xl space-y-3 transition-colors border ${
                    isDark
                      ? 'bg-slate-900/90 border-slate-800 hover:border-brand-accent-cyan/50'
                      : 'bg-surface-container-low border-border-subtle/40 hover:bg-surface-container'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
                      isDark
                        ? 'bg-amber-500/10 border border-amber-500/40 text-brand-accent-amber'
                        : 'bg-primary-container text-on-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                  </div>
                  <h3
                    className={`font-headline-sm text-headline-sm font-bold ${
                      isDark ? 'text-white' : 'text-on-surface'
                    }`}
                  >
                    Instant settlements
                  </h3>
                  <p
                    className={`font-body-md text-body-md leading-relaxed ${
                      isDark ? 'text-slate-300' : 'text-on-surface-variant'
                    }`}
                  >
                    Maintain working capital liquidity with real-time settlement directly to your account.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ────────────────────────────────────────────────────────
             SUBSCRIPTION PLANS (PRICING TABLE)
             ──────────────────────────────────────────────────────── */}
          <section
            className={`w-full py-20 px-6 lg:px-12 border-t ${
              isDark ? 'bg-[#030712] border-border-subtle/80' : 'bg-[#f8fafc] border-border-subtle/50'
            }`}
            id="pricing"
          >
            <div className="max-w-7xl mx-auto space-y-16">
              <div className="text-center max-w-3xl mx-auto space-y-3">
                <span
                  className={`inline-flex px-3 py-1 rounded-full font-label-mono-sm text-caption-caps uppercase ${
                    isDark
                      ? 'bg-slate-900 border border-brand-accent-cyan/40 text-brand-accent-cyan'
                      : 'bg-surface-container text-primary border border-primary/10'
                  }`}
                >
                  Subscription plans
                </span>
                <h2
                  className={`font-headline-xl text-headline-xl font-bold tracking-tight ${
                    isDark ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  Simple, flat pricing for any scale
                </h2>
                <p
                  className={`font-body-lg text-body-lg ${
                    isDark ? 'text-slate-300' : 'text-on-surface-variant'
                  }`}
                >
                  Start integration testing for free, scale to live payments with our standard subscription, or inquire about custom high-volume deployments.
                </p>
              </div>

              {/* 3 Tier Pricing Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {/* Tier 1: Developer Free */}
                <div
                  className={`rounded-3xl p-8 space-y-6 flex flex-col justify-between shadow-sm border ${
                    isDark
                      ? 'bg-slate-950/90 border-slate-800'
                      : 'bg-surface-container-lowest border-border-subtle/70'
                  }`}
                >
                  <div className="space-y-4">
                    <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant font-bold">
                      Sandbox environment
                    </span>
                    <h3
                      className={`font-headline-lg text-headline-lg font-bold ${
                        isDark ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      Developer free
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Perfect for prototyping, testing API signatures, and staging your UI callback dispatches.
                    </p>
                    <div className="pt-4">
                      <span
                        className={`font-headline-xl text-headline-xl font-extrabold ${
                          isDark ? 'text-white' : 'text-on-surface'
                        }`}
                      >
                        ₹0
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant"> / month</span>
                    </div>
                    <ul className="space-y-3 font-body-sm text-body-sm text-on-surface pt-4">
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-sm">check</span>
                        Isolated sandbox testing API key
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-sm">check</span>
                        Interactive dynamic checkout screen
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-sm">check</span>
                        Automated webhook event delivery stream
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-sm">check</span>
                        Live order status verification logs
                      </li>
                    </ul>
                  </div>
                  <Link
                    href="/sandbox"
                    className={`w-full py-3 px-4 rounded-xl font-body-sm font-semibold transition-colors text-center block ${
                      isDark
                        ? 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                    }`}
                  >
                    Launch sandbox console
                  </Link>
                </div>

                {/* Tier 2: Standard Plan (Highlighted / Most Popular) */}
                <div
                  className={`rounded-3xl p-8 space-y-6 flex flex-col justify-between shadow-xl relative -mt-0 lg:-mt-4 border-2 ${
                    isDark
                      ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-brand-accent-cyan cyber-glow-cyan'
                      : 'bg-surface-container-lowest border-primary/30'
                  }`}
                >
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-label-mono-sm text-caption-caps font-bold uppercase tracking-wider shadow-sm ${
                      isDark ? 'bg-brand-accent-cyan text-black' : 'bg-primary-container text-on-primary'
                    }`}
                  >
                    Most popular
                  </div>
                  <div className="space-y-4">
                    <span
                      className={`font-caption-caps text-caption-caps uppercase font-bold ${
                        isDark ? 'text-brand-accent-cyan' : 'text-primary'
                      }`}
                    >
                      Active Growth
                    </span>
                    <h3
                      className={`font-headline-lg text-headline-lg font-bold ${
                        isDark ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      Standard plan
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      For active SaaS founders and builders who want to stop giving away 2% on transaction cuts.
                    </p>
                    <div className="pt-4">
                      <span
                        className={`font-headline-xl text-headline-xl font-extrabold ${
                          isDark ? 'text-brand-accent-cyan' : 'text-primary'
                        }`}
                      >
                        ₹{subscriptionFee}
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant"> / month</span>
                    </div>
                    <ul className="space-y-3 font-body-sm text-body-sm text-on-surface pt-4">
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-sm font-bold">check</span>
                        100% direct-to-bank UPI transfers
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-sm font-bold">check</span>
                        0% transaction gateway fees
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-sm font-bold">check</span>
                        HMAC SHA-256 signed webhooks
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-sm font-bold">check</span>
                        Automated bank email reconciliation
                      </li>
                    </ul>
                  </div>
                  <Link
                    href="/signup"
                    className={`w-full py-3.5 px-4 rounded-xl font-body-sm font-semibold transition-colors text-center block shadow-md hover:shadow-lg ${
                      isDark
                        ? 'bg-primary-container hover:bg-blue-600 text-white shadow-primary-container/40 border border-brand-accent-cyan/30'
                        : 'bg-primary-container hover:bg-primary text-on-primary'
                    }`}
                  >
                    Get started now
                  </Link>
                </div>

                {/* Tier 3: Enterprise Pro */}
                <div
                  className={`rounded-3xl p-8 space-y-6 flex flex-col justify-between shadow-sm border ${
                    isDark
                      ? 'bg-slate-950/90 border-slate-800'
                      : 'bg-surface-container-lowest border-border-subtle/70'
                  }`}
                >
                  <div className="space-y-4">
                    <span className="font-caption-caps text-caption-caps uppercase text-on-surface-variant font-bold">
                      Enterprise scale
                    </span>
                    <h3
                      className={`font-headline-lg text-headline-lg font-bold ${
                        isDark ? 'text-white' : 'text-on-surface'
                      }`}
                    >
                      Enterprise pro
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      For high-throughput organizations needing custom webhook routing architectures.
                    </p>
                    <div className="pt-4">
                      <span
                        className={`font-headline-lg text-headline-lg font-extrabold ${
                          isDark ? 'text-white' : 'text-on-surface'
                        }`}
                      >
                        Custom volume
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant block mt-1">
                        High concurrency instances
                      </span>
                    </div>
                    <ul className="space-y-3 font-body-sm text-body-sm text-on-surface pt-4">
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-sm">check</span>
                        Dedicated secure matching worker instances
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-sm">check</span>
                        Customized retry webhook schedules
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-sm">check</span>
                        Sub-merchant console access controls
                      </li>
                      <li className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-brand-accent-emerald text-sm">check</span>
                        Dedicated SLA support with uptime assurances
                      </li>
                    </ul>
                  </div>
                  <Link
                    href="/contact"
                    className={`w-full py-3 px-4 rounded-xl font-body-sm font-semibold transition-colors text-center block ${
                      isDark
                        ? 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-700'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface'
                    }`}
                  >
                    Contact for enterprise
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ────────────────────────────────────────────────────────
         FOOTER
         ──────────────────────────────────────────────────────── */}
      <footer
        className={`w-full border-t mt-space-xl relative z-10 ${
          isDark
            ? 'bg-[#010309] border-border-subtle/80'
            : 'bg-surface-container-lowest border-border-subtle'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4 space-y-space-md">
              <Link href="/" className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark
                      ? 'bg-gradient-to-tr from-brand-accent-cyan via-primary-container to-brand-accent-emerald border border-brand-accent-cyan/40 shadow-md shadow-brand-accent-cyan/20'
                      : 'bg-gradient-to-tr from-primary via-primary-container to-brand-accent-cyan'
                  }`}
                >
                  <span className="font-headline-sm text-headline-sm font-bold text-on-primary leading-none">
                    M
                  </span>
                </div>
                <span
                  className={`font-headline-sm text-headline-sm font-extrabold tracking-tight ${
                    isDark ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  MyMobPay
                </span>
              </Link>
              <p
                className={`font-body-sm text-body-sm leading-relaxed max-w-sm ${
                  isDark ? 'text-slate-400' : 'text-on-surface-variant'
                }`}
              >
                Direct UPI &amp; IMPS payment gateway engineered to eliminate intermediary transaction fees for modern businesses across India.
              </p>
              <div
                className={`p-space-md rounded-xl border space-y-2 ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-surface-container-low border-border-subtle'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-brand-accent-emerald text-[18px]">security</span>
                  <span
                    className={`font-label-mono-sm text-caption-caps uppercase font-semibold ${
                      isDark ? 'text-white' : 'text-on-surface'
                    }`}
                  >
                    Institutional Security
                  </span>
                </div>
                <p
                  className={`font-body-sm text-caption-caps leading-normal ${
                    isDark ? 'text-slate-400' : 'text-on-surface-variant'
                  }`}
                >
                  Direct bank settlement with HMAC SHA-256 signatures and instant zero-escrow settlement.
                </p>
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="space-y-space-md">
                <h4
                  className={`font-caption-caps text-caption-caps uppercase font-bold tracking-wider ${
                    isDark ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  Product
                </h4>
                <ul className="space-y-2.5 font-body-sm text-body-sm">
                  <li>
                    <a
                      href="#pipeline"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      How It Works
                    </a>
                  </li>
                  <li>
                    <a
                      href="#pricing"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Pricing Plans
                    </a>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Platform Features
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/docs"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      SDKs &amp; APIs
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#pipeline"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Settlement Engine
                    </a>
                  </li>
                </ul>
              </div>

              <div className="space-y-space-md">
                <h4
                  className={`font-caption-caps text-caption-caps uppercase font-bold tracking-wider ${
                    isDark ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  Developers
                </h4>
                <ul className="space-y-2.5 font-body-sm text-body-sm">
                  <li>
                    <Link
                      href="/docs"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      API Reference
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/docs"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Webhook Guide
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/sandbox"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Code Sandbox
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#features"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      System Status
                    </a>
                  </li>
                </ul>
              </div>

              <div className="space-y-space-md">
                <h4
                  className={`font-caption-caps text-caption-caps uppercase font-bold tracking-wider ${
                    isDark ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  Company &amp; Trust
                </h4>
                <ul className="space-y-2.5 font-body-sm text-body-sm">
                  <li>
                    <Link
                      href="/about"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/security"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Security &amp; NPCI Compliance
                    </Link>
                  </li>
                  <li>
                    <a
                      href="#calculator"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      0% MDR Guarantee
                    </a>
                  </li>
                  <li>
                    <Link
                      href="/terms-of-service"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/privacy-policy"
                      className={`transition-colors ${
                        isDark ? 'text-slate-400 hover:text-brand-accent-cyan' : 'text-on-surface-variant hover:text-primary'
                      }`}
                    >
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div
            className={`mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 font-body-sm text-body-sm ${
              isDark ? 'border-slate-800 text-slate-400' : 'border-border-subtle text-on-surface-variant'
            }`}
          >
            <p>© 2026 MyMobPay Technologies India Pvt. Ltd. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 font-label-mono-sm text-label-mono-sm text-brand-accent-emerald font-semibold">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-accent-emerald animate-pulse"></span> All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
