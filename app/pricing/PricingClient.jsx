'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Zap, Shield, HelpCircle, Sparkles, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { MyMobPayLogoMark } from '@/components/MyMobPayLogo';
import ThemeToggleButton from '@/components/ThemeToggleButton';

const VOLUME_TIERS = [
  { volume: 25000, label: '₹25K/mo', saved: 6000 },
  { volume: 100000, label: '₹1L/mo', saved: 24000 },
  { volume: 300000, label: '₹3L/mo', saved: 72000 },
  { volume: 500000, label: '₹5L/mo', saved: 120000 },
  { volume: 1500000, label: '₹15L/mo', saved: 360000 },
  { volume: 5000000, label: '₹50L/mo', saved: 1200000 },
];

export default function PricingClient() {
  const [selectedVol, setSelectedVol] = useState(100000);
  const [openFaq, setOpenFaq] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Initialize theme from storage or DOM
  useEffect(() => {
    try {
      const saved = localStorage.getItem('mymobpay_theme') || localStorage.getItem('theme');
      if (saved) {
        setTheme(saved);
        if (saved === 'dark') {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light-theme');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light-theme');
        }
      } else if (document.documentElement.classList.contains('dark')) {
        setTheme('dark');
      } else {
        setTheme('light');
      }
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light-theme');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light-theme');
    }
    try {
      localStorage.setItem('mymobpay_theme', next);
      localStorage.setItem('theme', next);
    } catch (e) {}
  };

  const monthlyTraditionalFee = Math.round(selectedVol * 0.02);
  const annualSaved = monthlyTraditionalFee * 12;

  const faqs = [
    {
      q: 'How does MyMobPay offer 0% transaction commission?',
      a: 'Traditional payment gateways deduct 2% + 18% GST from every checkout. MyMobPay operates on a flat software subscription model, allowing customer UPI and IMPS collections to settle directly into your merchant bank account with 0% platform deductions.',
    },
    {
      q: 'How does the Free Link Plan work?',
      a: 'The Free Link Plan lets you create live Payment Links and counter QR codes with zero monthly fees. You can process up to 100 transactions each month at 0% commission. It has no time limits and requires no credit card.',
    },
    {
      q: 'Which plan unlocks the Developer REST API and webhooks?',
      a: 'The Growth Plan (₹299/mo) and Pro Flagship (₹499/mo) unlock full Developer REST API keys, test sandboxes, and HMAC-SHA256 signed webhooks for integrating custom web checkouts, SaaS apps, and mobile stores.',
    },
    {
      q: 'What happens when I reach the monthly transaction limit?',
      a: 'If you exceed your quota (e.g. 100 txns on Free, 300 on Starter, or 1,000 on Growth), your account does not lock up; you can easily upgrade to the next tier or choose Pro Flagship (₹499) for UNLIMITED volume.',
    },
    {
      q: 'How do settlements work?',
      a: 'Payments settle via direct bank rails (UPI / IMPS) in real-time (T+0). Because MyMobPay does not hold nodal escrow custody of your funds, you get instant access to your money without waiting T+2 or T+3 business days.',
    },
    {
      q: 'Can I cancel or change my plan anytime?',
      a: 'Yes, subscriptions can be upgraded, switched, or cancelled at any time from your Merchant Dashboard with zero cancellation penalties or lock-ins.',
    },
  ];

  return (
    <div className="min-h-screen theme-bg-primary theme-text-secondary transition-colors duration-200">
      {/* ── Theme Custom Properties Sync ── */}
      <style jsx global>{`
        :root {
          --bg-primary: #FFFFFF;
          --bg-secondary: #F2F3FB;
          --bg-elevated: #FFFFFF;
          --bg-well: #F7F8FD;
          --bg-header: rgba(255, 255, 255, 0.92);
          --text-primary: #090A10;
          --text-secondary: #222533;
          --text-muted: #5A607A;
          --accent-link: #0F2BFF;
          --border-color: #E2E5F4;
          --card-shadow: 0 10px 30px -10px rgba(20, 24, 80, 0.07);
        }

        html.dark {
          --bg-primary: #0B0E14;
          --bg-secondary: #101520;
          --bg-elevated: #161D2B;
          --bg-well: #0E131D;
          --bg-header: rgba(11, 14, 20, 0.90);
          --text-primary: #F8FAFC;
          --text-secondary: #CBD5E1;
          --text-muted: #94A3B8;
          --accent-link: #60A5FA;
          --border-color: #232D42;
          --card-shadow: 0 16px 38px -10px rgba(0, 0, 0, 0.55);
        }

        .theme-bg-primary { background-color: var(--bg-primary); }
        .theme-bg-secondary { background-color: var(--bg-secondary); }
        .theme-bg-elevated { background-color: var(--bg-elevated); }
        .theme-bg-well { background-color: var(--bg-well); }
        .theme-text-primary { color: var(--text-primary); }
        .theme-text-secondary { color: var(--text-secondary); }
        .theme-text-muted { color: var(--text-muted); }
        .theme-link { color: var(--accent-link); }
        .theme-border { border-color: var(--border-color); }
        .theme-card-shadow { box-shadow: var(--card-shadow); }

        .headline-anton {
          font-family: 'Anton', 'Barlow Condensed', Impact, sans-serif;
          font-weight: 400;
          text-transform: uppercase;
          line-height: 0.96;
          letter-spacing: 0.01em;
          color: var(--text-primary);
        }
      `}</style>

      {/* ── Navigation Header ── */}
      <header className="border-b theme-border sticky top-0 z-40 backdrop-blur-md transition-colors" style={{ backgroundColor: 'var(--bg-header)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 flex items-center justify-center shrink-0">
              <MyMobPayLogoMark className="w-full h-full" id="pricing-nav-logo" />
            </span>
            <span className="font-sans font-extrabold text-xl tracking-tight theme-text-primary">
              MyMob<span className="text-[#0F2BFF]">Pay</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold theme-text-secondary">
            <Link href="/" className="hover:text-[#0F2BFF] transition-colors">Home</Link>
            <Link href="/pricing" className="text-[#0F2BFF] font-bold">Pricing</Link>
            <Link href="/docs" className="hover:text-[#0F2BFF] transition-colors">Developers</Link>
            <Link href="/blog" className="hover:text-[#0F2BFF] transition-colors">Blog</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
            <Link href="/login" className="text-xs sm:text-sm font-bold theme-text-secondary hover:text-[#0F2BFF] px-3 py-1.5 transition-colors">
              Log in
            </Link>
            <Link href="/login?mode=signup" className="bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full transition-colors shadow-sm">
              Get started
            </Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggleButton theme={theme} onToggle={toggleTheme} showLabel={false} />
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 rounded-xl theme-bg-elevated border theme-border theme-text-primary"
              aria-label="Toggle Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden theme-bg-elevated border-b theme-border px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <Link href="/" onClick={() => setMobileNavOpen(false)} className="p-2.5 rounded-xl theme-bg-well border theme-border theme-text-primary">Home</Link>
              <Link href="/pricing" onClick={() => setMobileNavOpen(false)} className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[#0F2BFF] font-bold">Pricing</Link>
              <Link href="/docs" onClick={() => setMobileNavOpen(false)} className="p-2.5 rounded-xl theme-bg-well border theme-border theme-text-primary">Developers</Link>
              <Link href="/blog" onClick={() => setMobileNavOpen(false)} className="p-2.5 rounded-xl theme-bg-well border theme-border theme-text-primary">Blog</Link>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t theme-border">
              <Link href="/login" onClick={() => setMobileNavOpen(false)} className="py-2.5 rounded-xl border theme-border theme-text-primary text-xs font-bold text-center block">Log in</Link>
              <Link href="/login?mode=signup" onClick={() => setMobileNavOpen(false)} className="py-2.5 rounded-xl bg-[#0F2BFF] text-white text-xs font-bold text-center block">Get started</Link>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        {/* ── Hero Section ── */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            0% TRANSACTION COMMISSION • DIRECT UPI &amp; IMPS
          </span>
          <h1 className="headline-anton text-[40px] sm:text-[56px] lg:text-[66px] mt-4">
            KEEP 100% OF YOUR REVENUE. <br />
            <span className="text-[#0F2BFF] dark:text-[#60A5FA]">PICK YOUR PLAN.</span>
          </h1>
          <p className="mt-3.5 text-sm sm:text-base theme-text-muted leading-relaxed max-w-2xl mx-auto">
            Stop paying 2% on every checkout. Switch to a flat, predictable monthly software subscription and eliminate gateway fees on all your customer collections.
          </p>
        </div>

        {/* ── Interactive Volume Savings Calculator ── */}
        <div className="mt-10 theme-bg-elevated border theme-border rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto theme-card-shadow transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b theme-border">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider theme-text-muted font-bold block">
                SELECT MONTHLY REVENUE VOLUME
              </span>
              <div className="text-3xl sm:text-4xl font-black theme-text-primary mt-1 font-mono">
                ₹{selectedVol.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="sm:text-right">
              <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                ESTIMATED ANNUAL SAVINGS
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                ₹{annualSaved.toLocaleString('en-IN')} / yr
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {VOLUME_TIERS.map((tier) => (
                <button
                  key={tier.volume}
                  type="button"
                  onClick={() => setSelectedVol(tier.volume)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                    selectedVol === tier.volume
                      ? 'bg-[#0F2BFF] border-[#0F2BFF] text-white shadow-sm'
                      : 'theme-bg-well theme-border theme-text-secondary hover:border-[#0F2BFF]'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            <div className="mt-5 p-4 rounded-xl theme-bg-well border theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="theme-text-muted">
                At <strong className="theme-text-primary font-mono">₹{selectedVol.toLocaleString('en-IN')}/mo</strong>, traditional 2% aggregators deduct{' '}
                <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">₹{monthlyTraditionalFee.toLocaleString('en-IN')}/mo</span>.
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold font-mono shrink-0">
                MyMobPay: ₹0.00 Commission
              </div>
            </div>
          </div>
        </div>

        {/* ── 4 TIERS: FREE TO TOP TIER GRID ── */}
        <div className="mt-14">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="headline-anton text-[28px] sm:text-[36px]">
              TRANSPARENT SUBSCRIPTION TIERS
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm theme-text-muted">
              Start with the Free Link Plan or pick a plan with Developer API and VIP rails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* ── Card 1: Free Link Starter (₹0) ── */}
            <div className="theme-bg-elevated border theme-border rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-emerald-500 transition-all theme-card-shadow relative">
              <span className="absolute -top-3 left-6 bg-emerald-600 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                FREE FOREVER
              </span>

              <div>
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  TIER 0 &bull; LINKS ONLY
                </div>
                <h3 className="text-xl font-bold theme-text-primary mt-1">Free Link Starter</h3>
                <p className="text-xs theme-text-muted mt-2 leading-relaxed">
                  For creators, Instagram shops, and freelancers accepting direct UPI links.
                </p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black theme-text-primary font-mono">₹0</span>
                  <span className="theme-text-muted text-xs font-semibold">/ forever</span>
                </div>
                <div className="font-mono text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                  Up to 100 link txns / month
                </div>

                <div className="mt-6 pt-5 border-t theme-border space-y-2.5 text-xs theme-text-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span><strong>0% Commission</strong> (Zero MDR)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Instant Direct-to-Bank (T+0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Universal UPI Intent &amp; Dynamic QR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Up to 10 Active Payment Links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Printable Counter Standee QR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Real-Time Merchant Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-4 h-4 text-center shrink-0 font-bold">✕</span>
                    <span>No Developer REST API</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login?mode=signup"
                className="mt-8 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center block transition-colors shadow-sm cursor-pointer"
              >
                Start Free (No Card Needed)
              </Link>
            </div>

            {/* ── Card 2: Starter (₹99/mo) ── */}
            <div className="theme-bg-elevated border theme-border rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-blue-400 transition-all theme-card-shadow relative">
              <span className="absolute -top-3 left-6 bg-slate-700 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                LINK SCALE
              </span>

              <div>
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider theme-link">
                  TIER 1 &bull; 300 TXNS
                </div>
                <h3 className="text-xl font-bold theme-text-primary mt-1">Starter Plan</h3>
                <p className="text-xs theme-text-muted mt-2 leading-relaxed">
                  Higher link volume, custom slugs, and CSV financial downloads.
                </p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black theme-text-primary font-mono">₹99</span>
                  <span className="theme-text-muted text-xs font-semibold">/ month</span>
                </div>
                <div className="font-mono text-[10.5px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                  Up to 300 link txns / month
                </div>

                <div className="mt-6 pt-5 border-t theme-border space-y-2.5 text-xs theme-text-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span><strong>Everything in Free</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Up to 300 Link Txns / month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Unlimited Payment Links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Custom Link Slugs &amp; Notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>CSV Statement Exports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Standard Email Support (48h)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-4 h-4 text-center shrink-0 font-bold">✕</span>
                    <span>No Developer REST API</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login?mode=signup"
                className="mt-8 w-full py-3 rounded-xl border theme-border hover:border-[#0F2BFF] theme-bg-well theme-text-primary text-xs font-bold text-center block transition-colors cursor-pointer"
              >
                Get Started for ₹99
              </Link>
            </div>

            {/* ── Card 3: Growth (₹299/mo) ── */}
            <div className="theme-bg-elevated border-2 border-sky-500 rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative theme-card-shadow">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-sky-600 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md whitespace-nowrap">
                UNLOCKS REST API
              </span>

              <div>
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  TIER 2 &bull; 1,000 TXNS
                </div>
                <h3 className="text-xl font-bold theme-text-primary mt-1">Growth Plan</h3>
                <p className="text-xs theme-text-muted mt-2 leading-relaxed">
                  For SaaS founders and web apps needing automated REST checkouts.
                </p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black theme-text-primary font-mono">₹299</span>
                  <span className="theme-text-muted text-xs font-semibold">/ month</span>
                </div>
                <div className="font-mono text-[10.5px] text-sky-600 dark:text-sky-400 font-bold mt-1">
                  Up to 1,000 txns / month (API + Links)
                </div>

                <div className="mt-6 pt-5 border-t theme-border space-y-2.5 text-xs theme-text-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span><strong>Full Developer REST API Access</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span><strong>5 Webhooks with Auto-Retry</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Automated UTR Bank Matching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Up to 1,000 Verified Transactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Unlimited Links &amp; Counter Standee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Priority Email Support (24h)</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login?mode=signup"
                className="mt-8 w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold text-center block transition-colors shadow-sm cursor-pointer"
              >
                Choose Growth (₹299)
              </Link>
            </div>

            {/* ── Card 4: Pro Flagship (₹499/mo) ── */}
            <div className="theme-bg-elevated border-2 border-[#0F2BFF] rounded-2xl p-6 sm:p-7 flex flex-col justify-between relative shadow-xl">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0F2BFF] text-white font-mono text-[9px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                MAX VALUE &bull; UNLIMITED
              </span>

              <div>
                <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#0F2BFF] dark:text-[#60A5FA]">
                  TIER 3 &bull; UNLIMITED EVERYTHING
                </div>
                <h3 className="text-xl font-bold theme-text-primary mt-1">Pro Flagship</h3>
                <p className="text-xs theme-text-muted mt-2 leading-relaxed">
                  Zero volume caps, 24/7 WhatsApp VIP hotline, and monthly statements.
                </p>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black theme-text-primary font-mono">₹499</span>
                  <span className="theme-text-muted text-xs font-semibold">/ month</span>
                </div>
                <div className="font-mono text-[10.5px] text-[#0F2BFF] dark:text-[#60A5FA] font-bold mt-1">
                  UNLIMITED Transactions &amp; Volume
                </div>

                <div className="mt-6 pt-5 border-t theme-border space-y-2.5 text-xs theme-text-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span><strong>UNLIMITED Transactions &amp; Volume</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span><strong>24/7 Dedicated WhatsApp Hotline (&lt;1h)</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span><strong>Automated Monthly PDF Bank Statements</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span>Full REST API &amp; High-Speed Webhooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span>Real-Time Bank Polling (Zero Latency)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span>White-Label (Remove MyMobPay branding)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span>Multi-Staff Team Accounts (3 Seats)</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login?mode=signup"
                className="mt-8 w-full py-3 rounded-xl bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-xs font-bold text-center block transition-colors shadow-md cursor-pointer"
              >
                Get Pro Flagship (₹499)
              </Link>
            </div>
          </div>
        </div>

        {/* ── Feature Comparison Matrix Table ── */}
        <div className="mt-20">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="headline-anton text-[28px] sm:text-[36px]">
              MYMOBPAY VS. 2% GATEWAYS
            </h2>
            <p className="mt-1 text-xs sm:text-sm theme-text-muted">
              Why thousands of INR in commissions disappear under traditional aggregators.
            </p>
          </div>

          <div className="overflow-x-auto theme-card-shadow rounded-2xl border theme-border">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="theme-bg-secondary border-b theme-border font-mono text-[11px] uppercase theme-text-muted">
                <tr>
                  <th className="p-4 sm:p-5">Feature / Rail</th>
                  <th className="p-4 sm:p-5 text-emerald-600 dark:text-emerald-400 font-bold">MyMobPay Direct</th>
                  <th className="p-4 sm:p-5 text-slate-500">Traditional Gateway (Razorpay/Cashfree)</th>
                </tr>
              </thead>
              <tbody className="divide-y theme-border theme-bg-elevated theme-text-secondary">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold theme-text-primary">Transaction Fee</td>
                  <td className="p-4 sm:p-5 text-emerald-600 dark:text-emerald-400 font-bold font-mono">0% (Zero MDR)</td>
                  <td className="p-4 sm:p-5 text-rose-500 font-mono">2.0% + 18% GST</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold theme-text-primary">Billing Architecture</td>
                  <td className="p-4 sm:p-5 theme-text-primary">Flat Monthly Subscription (Free / ₹99 / ₹299 / ₹499)</td>
                  <td className="p-4 sm:p-5 text-slate-500">Percentage tax on all gross merchant revenue</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold theme-text-primary">Settlement Speed</td>
                  <td className="p-4 sm:p-5 text-emerald-600 dark:text-emerald-400 font-bold font-mono">T+0 Instant Direct Bank Credit</td>
                  <td className="p-4 sm:p-5 text-slate-500">T+2 or T+3 Business Days Delayed</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold theme-text-primary">Fund Custody (Escrow)</td>
                  <td className="p-4 sm:p-5 theme-text-primary">Zero Escrow (Direct P2P/Bank settlement)</td>
                  <td className="p-4 sm:p-5 text-slate-500">Funds held in aggregator nodal escrow accounts</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold theme-text-primary">Developer REST API &amp; Webhooks</td>
                  <td className="p-4 sm:p-5 theme-text-primary">Standard REST API &amp; HMAC-SHA256 Signed Webhooks</td>
                  <td className="p-4 sm:p-5 text-slate-500">Standard Webhooks with aggregator lock-in</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold theme-text-primary">Bank Statements</td>
                  <td className="p-4 sm:p-5 theme-text-primary">Automated PDF statements emailed on the 1st</td>
                  <td className="p-4 sm:p-5 text-slate-500">Manual CSV dashboard export</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FAQ Section ── */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="headline-anton text-[28px] sm:text-[36px]">FREQUENTLY ASKED QUESTIONS</h2>
            <p className="mt-1 text-xs sm:text-sm theme-text-muted">Everything you need to know about our flat subscription pricing.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl theme-bg-elevated border theme-border overflow-hidden theme-card-shadow transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm theme-text-primary cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="theme-text-muted font-mono text-lg shrink-0">
                    {openFaq === index ? '−' : '+'}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs sm:text-sm theme-text-muted leading-relaxed border-t theme-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA Banner ── */}
        <div className="mt-20 rounded-3xl bg-gradient-to-r from-[#0F2BFF] to-[#2563EB] p-8 sm:p-12 text-center text-white shadow-xl">
          <h2 className="headline-anton text-[32px] sm:text-[44px]">READY TO KEEP 100% OF EVERY TRANSACTION?</h2>
          <p className="mt-2 text-sm sm:text-base text-white/90 max-w-xl mx-auto">
            Create your merchant account in 2 minutes. Start on our Free tier and scale as your transaction volume grows.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login?mode=signup"
              className="bg-white text-[#0F2BFF] hover:bg-slate-100 font-bold px-7 py-3 rounded-full text-xs sm:text-sm transition-colors shadow-md"
            >
              Start Free (100 Txns) &rarr;
            </Link>
            <Link
              href="/docs"
              className="bg-white/15 hover:bg-white/20 border border-white/25 text-white font-bold px-7 py-3 rounded-full text-xs sm:text-sm transition-colors"
            >
              View Developer Docs
            </Link>
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t theme-border theme-bg-secondary py-12 text-xs theme-text-muted transition-colors">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MyMobPayLogoMark className="w-5 h-5" id="pricing-footer-logo" />
            <span className="font-bold theme-text-primary">MyMobPay</span>
            <span>&bull; Direct-to-Bank UPI &amp; IMPS Payment Gateway Software</span>
          </div>
          <div className="flex items-center gap-4 theme-text-secondary">
            <Link href="/" className="hover:text-[#0F2BFF] transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-[#0F2BFF] transition-colors">Pricing</Link>
            <Link href="/docs" className="hover:text-[#0F2BFF] transition-colors">Docs</Link>
            <Link href="/blog" className="hover:text-[#0F2BFF] transition-colors">Blog</Link>
            <Link href="/login" className="hover:text-[#0F2BFF] transition-colors">Login</Link>
            <Link href="/terms" className="hover:text-[#0F2BFF] transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-[#0F2BFF] transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
