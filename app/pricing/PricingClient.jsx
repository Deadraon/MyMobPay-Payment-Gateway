'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Zap, Shield, Sparkles } from 'lucide-react';
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

  return (
    <div className="relative min-h-screen theme-bg-secondary bg-arch-grid theme-text-secondary overflow-hidden transition-colors duration-250">
      {/* ── Global Theme & Animation Styles ── */}
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
          --card-shadow: 0 12px 32px -10px rgba(20, 24, 80, 0.08);
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
          --card-shadow: 0 16px 40px -10px rgba(0, 0, 0, 0.60);
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

        /* Architectural Grid Pattern */
        .bg-arch-grid {
          background-size: 48px 48px;
          background-image:
            linear-gradient(to right, rgba(15, 43, 255, 0.055) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 43, 255, 0.055) 1px, transparent 1px);
        }
        html.dark .bg-arch-grid {
          background-image:
            linear-gradient(to right, rgba(96, 165, 250, 0.075) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(96, 165, 250, 0.075) 1px, transparent 1px);
        }

        /* Animated Vertical Grid Light Beams */
        @keyframes gridBeamTravel {
          0%   { transform: translateY(-100%); opacity: 0; }
          30%  { opacity: 0.85; }
          70%  { opacity: 0.85; }
          100% { transform: translateY(500%); opacity: 0; }
        }
        .grid-beam-v {
          animation: gridBeamTravel 5.5s linear infinite;
        }

        /* Orbital Ambient Rings */
        @keyframes spinOrbitSlow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes spinOrbitReverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to   { transform: translate(-50%, -50%) rotate(0deg); }
        }
        .orbit-ring-cw {
          position: absolute;
          left: 50%;
          top: 38%;
          border-radius: 9999px;
          border: 1.5px dashed rgba(15, 43, 255, 0.22);
          animation: spinOrbitSlow 28s linear infinite;
          pointer-events: none;
        }
        .orbit-ring-ccw {
          position: absolute;
          left: 50%;
          top: 38%;
          border-radius: 9999px;
          border: 1px solid rgba(255, 110, 0, 0.22);
          animation: spinOrbitReverse 20s linear infinite;
          pointer-events: none;
        }
        html.dark .orbit-ring-cw {
          border-color: rgba(96, 165, 250, 0.26);
        }
        html.dark .orbit-ring-ccw {
          border-color: rgba(255, 158, 27, 0.26);
        }

        .headline-anton {
          font-family: 'Anton', 'Barlow Condensed', Impact, sans-serif;
          font-weight: 400;
          text-transform: uppercase;
          line-height: 0.96;
          letter-spacing: 0.01em;
          color: var(--text-primary);
        }
      `}</style>

      {/* ── Background Animations: Vertical Beams & Orbital Rings ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="grid-beam-v absolute left-[15%] top-0 w-[1.5px] h-32 bg-[#0F2BFF]/35"></div>
        <div className="grid-beam-v absolute left-[85%] top-0 w-[1.5px] h-32 bg-[#0F2BFF]/30" style={{ animationDelay: '2.5s' }}></div>
        <div className="grid-beam-v absolute left-[50%] top-0 w-[1.5px] h-28 bg-[#60A5FA]/25" style={{ animationDelay: '4.2s' }}></div>
        <div className="orbit-ring-cw w-[680px] h-[680px] -z-10 opacity-30 dark:opacity-20"></div>
        <div className="orbit-ring-ccw w-[920px] h-[920px] -z-10 opacity-20 dark:opacity-15"></div>
      </div>

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
              className="p-2 rounded-xl theme-bg-elevated border theme-border theme-text-primary cursor-pointer"
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

      <main className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        {/* ── Hero Section ── */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full theme-bg-elevated border theme-border shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] theme-text-primary">
              DIRECT-TO-BANK UPI &amp; IMPS • 0% COMMISSION
            </span>
          </div>

          <h1 className="headline-anton text-[40px] sm:text-[56px] lg:text-[66px] mt-4">
            KEEP 100% OF YOUR REVENUE. <br />
            <span className="text-[#0F2BFF] dark:text-[#60A5FA]">PICK YOUR PLAN.</span>
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm theme-text-muted leading-relaxed max-w-2xl mx-auto">
            Stop paying 2% on every checkout. Switch to a flat, predictable monthly subscription and eliminate gateway deductions on all customer collections.
          </p>
        </div>

        {/* ── Interactive Volume Savings Calculator ── */}
        <div className="mt-8 theme-bg-elevated border theme-border rounded-2xl p-5 sm:p-7 max-w-4xl mx-auto theme-card-shadow transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b theme-border">
            <div>
              <span className="font-mono text-[10.5px] uppercase tracking-wider theme-text-muted font-bold block">
                SELECT MONTHLY REVENUE VOLUME
              </span>
              <div className="text-3xl sm:text-4xl font-black theme-text-primary mt-0.5 font-mono">
                ₹{selectedVol.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="sm:text-right">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                ESTIMATED ANNUAL SAVINGS
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                ₹{annualSaved.toLocaleString('en-IN')} / yr
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {VOLUME_TIERS.map((tier) => (
                <button
                  key={tier.volume}
                  type="button"
                  onClick={() => setSelectedVol(tier.volume)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                    selectedVol === tier.volume
                      ? 'bg-[#0F2BFF] border-[#0F2BFF] text-white shadow-xs'
                      : 'theme-bg-well theme-border theme-text-secondary hover:border-[#0F2BFF]'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            <div className="mt-4 p-3.5 rounded-xl theme-bg-well border theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="theme-text-muted">
                At <strong className="theme-text-primary font-mono">₹{selectedVol.toLocaleString('en-IN')}/mo</strong>, traditional 2% gateways take{' '}
                <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">₹{monthlyTraditionalFee.toLocaleString('en-IN')}/mo</span>.
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold font-mono shrink-0">
                MyMobPay: ₹0.00 Commission
              </div>
            </div>
          </div>
        </div>

        {/* ── THE 4 PRICING MODELS (FREE TO TOP TIER ONLY) ── */}
        <div className="mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* ── Model 1: Free Link Starter (₹0) ── */}
            <div className="theme-bg-elevated border theme-border rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-200 theme-card-shadow relative">
              <span className="absolute -top-3 left-6 bg-emerald-600 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                FREE FOREVER
              </span>

              <div>
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  TIER 0 &bull; LINKS ONLY
                </div>
                <h3 className="text-xl font-bold theme-text-primary mt-1">Free Link Starter</h3>
                <p className="text-xs theme-text-muted mt-2 leading-relaxed">
                  For creators, Instagram sellers, and freelancers accepting direct UPI links.
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
                    <span>Live Merchant Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="w-4 h-4 text-center shrink-0 font-bold">✕</span>
                    <span>No Developer REST API</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login?mode=signup"
                className="mt-8 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center block transition-colors shadow-xs cursor-pointer"
              >
                Start Free (No Card Needed)
              </Link>
            </div>

            {/* ── Model 2: Starter Plan (₹99/mo) ── */}
            <div className="theme-bg-elevated border theme-border rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-200 theme-card-shadow relative">
              <span className="absolute -top-3 left-6 bg-slate-700 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                LINK SCALE
              </span>

              <div>
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider theme-link">
                  TIER 1 &bull; 300 TXNS
                </div>
                <h3 className="text-xl font-bold theme-text-primary mt-1">Starter Plan</h3>
                <p className="text-xs theme-text-muted mt-2 leading-relaxed">
                  Higher link volume, custom slugs, and CSV financial exports.
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

            {/* ── Model 3: Growth Plan (₹299/mo) ── */}
            <div className="theme-bg-elevated border-2 border-sky-500 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-200 relative theme-card-shadow">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-sky-600 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md whitespace-nowrap">
                UNLOCKS REST API
              </span>

              <div>
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  TIER 2 &bull; 1,000 TXNS
                </div>
                <h3 className="text-xl font-bold theme-text-primary mt-1">Growth Plan</h3>
                <p className="text-xs theme-text-muted mt-2 leading-relaxed">
                  For SaaS founders, web checkouts, and mobile apps needing full REST APIs.
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
                    <span>Unlimited Links &amp; Standee QR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Priority Email Support (24h)</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login?mode=signup"
                className="mt-8 w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold text-center block transition-colors shadow-xs cursor-pointer"
              >
                Choose Growth (₹299)
              </Link>
            </div>

            {/* ── Model 4: Pro Flagship (₹499/mo) ── */}
            <div className="theme-bg-elevated border-2 border-[#0F2BFF] rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-200 relative shadow-xl">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0F2BFF] text-white font-mono text-[9px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-md whitespace-nowrap">
                MAX VALUE &bull; UNLIMITED
              </span>

              <div>
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#0F2BFF] dark:text-[#60A5FA]">
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
      </main>

      {/* ── Footer ── */}
      <footer className="border-t theme-border theme-bg-primary/80 py-8 text-xs theme-text-muted transition-colors mt-12">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MyMobPayLogoMark className="w-5 h-5" id="pricing-footer-logo" />
            <span className="font-bold theme-text-primary">MyMobPay</span>
            <span>&bull; Direct-to-Bank UPI &amp; IMPS 0% Commission Software</span>
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
