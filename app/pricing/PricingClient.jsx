'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Zap, Shield, Sparkles, CheckCircle2, Lock, Flame, Star, Award } from 'lucide-react';
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
    <div className="pricing-root relative min-h-screen theme-bg-secondary bg-arch-grid theme-text-secondary overflow-hidden transition-colors duration-250 font-sans">
      {/* ── Global Theme, Plus Jakarta Sans & Animation Styles ── */}
      <style jsx global>{`
        /* Match Homepage Root Typography: Plus Jakarta Sans for logo and text */
        .pricing-root,
        .pricing-root input,
        .pricing-root textarea,
        .pricing-root select,
        .pricing-root .font-sans,
        .pricing-root footer {
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif !important;
        }

        :root {
          --bg-primary: #FFFFFF;
          --bg-secondary: #F2F3FB;
          --bg-elevated: #FFFFFF;
          --bg-well: #F7F8FD;
          --bg-header: rgba(255, 255, 255, 0.92);
          --bg-pill-nav: rgba(255, 255, 255, 0.95);
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
          --bg-pill-nav: rgba(22, 29, 43, 0.95);
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

        /* Architectural Grid Pattern matching Homepage */
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
          top: 36%;
          border-radius: 9999px;
          border: 1.5px dashed rgba(15, 43, 255, 0.22);
          animation: spinOrbitSlow 28s linear infinite;
          pointer-events: none;
        }
        .orbit-ring-ccw {
          position: absolute;
          left: 50%;
          top: 36%;
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

        /* Homepage Matching Site Header & Floating Nav Pill */
        .site-header {
          background-color: var(--bg-header);
          border-bottom: 1px solid var(--border-color);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .header-nav-pill {
          background-color: var(--bg-pill-nav);
          border: 1px solid var(--border-color);
        }

        .nav-pill-item {
          font-size: 12.5px;
          font-weight: 600;
          color: var(--text-secondary);
          padding: 6px 12px;
          border-radius: 9999px;
          white-space: nowrap;
          transition: all 0.18s ease;
        }
        .nav-pill-item:hover {
          color: var(--accent-link);
          background-color: rgba(15, 43, 255, 0.07);
        }
        html.dark .nav-pill-item:hover {
          background-color: rgba(96, 165, 250, 0.12);
        }
        .nav-pill-item.active {
          color: var(--accent-link);
          background-color: rgba(15, 43, 255, 0.09);
        }
        html.dark .nav-pill-item.active {
          background-color: rgba(96, 165, 250, 0.16);
        }

        .btn-editorial {
          box-shadow: 0 4px 12px rgba(15, 43, 255, 0.22);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-editorial:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(15, 43, 255, 0.32);
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

      {/* ── Navigation Header (Exact 1:1 Match with Homepage Header) ── */}
      <header className="site-header sticky top-0 z-40 w-full transition-colors">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 h-16 sm:h-[72px] flex items-center justify-between gap-3">
          {/* Zone 1 (Left): Original Logo Mark + Wordmark */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 focus:outline-none group" aria-label="MyMobPay Home">
            <span className="w-8 h-8 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <MyMobPayLogoMark className="w-full h-full" id="master-header" />
            </span>
            <span className="font-sans font-extrabold text-[20px] tracking-tight theme-text-primary">
              MyMob<span className="text-[#0F2BFF]">Pay</span>
            </span>
          </Link>

          {/* Zone 2 (Center): Floating Navigation Pill */}
          <nav className="hidden lg:flex items-center header-nav-pill px-2 py-1 rounded-full shadow-2xs" aria-label="Primary Navigation">
            <Link href="/#own-your-money" className="nav-pill-item">Product</Link>
            <Link href="/#fees-drag" className="nav-pill-item">0% Model</Link>
            <Link href="/pricing" className="nav-pill-item active">Pricing</Link>
            <Link href="/docs" className="nav-pill-item">Developers</Link>
            <Link href="/blog" className="nav-pill-item">Blog</Link>
            <Link href="/#faq-section" className="nav-pill-item">FAQ</Link>
          </nav>

          {/* Zone 3 (Right): Animated Theme Switcher + Auth CTAs */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <ThemeToggleButton
              theme={theme}
              onToggle={toggleTheme}
            />

            <Link href="/login" className="text-[13px] font-bold theme-link hover:underline px-2 py-1">Log in</Link>

            <Link href="/login?mode=signup" className="btn-editorial bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-[12.5px] font-bold px-4 py-2 rounded-full">Get started</Link>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/login?mode=signup" className="bg-[#0F2BFF] text-white text-[11.5px] font-bold px-3 py-1.5 rounded-full">Start free</Link>
            <button
              type="button"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 rounded-lg theme-bg-elevated border theme-border theme-text-primary cursor-pointer"
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
          <div className="md:hidden theme-bg-elevated border-b theme-border px-4 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <Link href="/#own-your-money" onClick={() => setMobileNavOpen(false)} className="p-2.5 rounded-lg theme-bg-well border theme-border theme-text-primary">Product</Link>
              <Link href="/#fees-drag" onClick={() => setMobileNavOpen(false)} className="p-2.5 rounded-lg theme-bg-well border theme-border theme-text-primary">0% Fee Model</Link>
              <Link href="/pricing" onClick={() => setMobileNavOpen(false)} className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[#0F2BFF] font-bold">Pricing Plans</Link>
              <Link href="/docs" onClick={() => setMobileNavOpen(false)} className="p-2.5 rounded-lg theme-bg-well border theme-border theme-text-primary">Developers</Link>
              <Link href="/blog" onClick={() => setMobileNavOpen(false)} className="p-2.5 rounded-lg theme-bg-well border theme-border theme-text-primary">Blog</Link>
              <Link href="/#faq-section" onClick={() => setMobileNavOpen(false)} className="p-2.5 rounded-lg theme-bg-well border theme-border theme-text-primary">FAQ</Link>
            </div>

            <div className="flex items-center justify-between pt-2 border-t theme-border">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider theme-text-muted">Appearance</span>
              <ThemeToggleButton
                theme={theme}
                onToggle={toggleTheme}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link href="/login" onClick={() => setMobileNavOpen(false)} className="py-2.5 rounded-lg border border-[#0F2BFF] theme-link text-xs font-bold text-center block">Log in</Link>
              <Link href="/login?mode=signup" onClick={() => setMobileNavOpen(false)} className="py-2.5 rounded-lg bg-[#0F2BFF] text-white text-xs font-bold text-center block">Get started free</Link>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* ── Hero Section ── */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full theme-bg-elevated border theme-border shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] theme-text-primary">
              DIRECT-TO-BANK UPI &amp; IMPS • 0% COMMISSION
            </span>
          </div>

          <h1 className="headline-anton text-[42px] sm:text-[58px] lg:text-[70px] mt-4 tracking-tight">
            KEEP 100% OF YOUR REVENUE. <br />
            <span className="text-[#0F2BFF] dark:text-[#60A5FA]">PICK YOUR PLAN.</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm theme-text-muted leading-relaxed max-w-xl mx-auto">
            Stop paying 2% on every checkout. Switch to a flat, predictable monthly software subscription and eliminate gateway deductions on all customer collections.
          </p>
        </div>

        {/* ── Interactive Volume Savings Calculator ── */}
        <div className="mt-8 theme-bg-elevated border theme-border rounded-2xl p-5 sm:p-6 max-w-3xl mx-auto theme-card-shadow transition-colors">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b theme-border">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider theme-text-muted font-bold block">
                MONTHLY REVENUE VOLUME
              </span>
              <div className="text-2xl sm:text-3xl font-black theme-text-primary mt-0.5 font-mono">
                ₹{selectedVol.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="sm:text-right">
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                ANNUAL MERCHANT SAVINGS
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                ₹{annualSaved.toLocaleString('en-IN')} / yr
              </div>
            </div>
          </div>

          <div className="mt-3.5">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {VOLUME_TIERS.map((tier) => (
                <button
                  key={tier.volume}
                  type="button"
                  onClick={() => setSelectedVol(tier.volume)}
                  className={`py-1.5 px-1 text-xs font-bold rounded-lg border transition-all text-center cursor-pointer ${
                    selectedVol === tier.volume
                      ? 'bg-[#0F2BFF] border-[#0F2BFF] text-white shadow-xs'
                      : 'theme-bg-well theme-border theme-text-secondary hover:border-[#0F2BFF]'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            <div className="mt-3 p-3 rounded-xl theme-bg-well border theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
              <div className="theme-text-muted text-[11.5px]">
                At <strong className="theme-text-primary font-mono">₹{selectedVol.toLocaleString('en-IN')}/mo</strong>, 2% gateways deduct{' '}
                <span className="text-rose-600 dark:text-rose-400 font-bold font-mono">₹{monthlyTraditionalFee.toLocaleString('en-IN')}/mo</span>.
              </div>
              <div className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-[11.5px] shrink-0">
                MyMobPay: 0% Fee Kept 100%
              </div>
            </div>
          </div>
        </div>

        {/* ── THE 4 PRICING MODELS (FREE TO TOP TIER) ── */}
        <div className="mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {/* ── Model 1: Free Link Starter (₹0) ── */}
            <div className="theme-bg-elevated border theme-border rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-200 theme-card-shadow relative group">
              <span className="absolute -top-3 left-6 bg-emerald-600 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                FREE FOREVER
              </span>

              <div>
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span>TIER 0</span>
                  <span>&bull;</span>
                  <span>LINKS ONLY</span>
                </div>
                <h3 className="text-xl font-bold theme-text-primary mt-1">Free Link Starter</h3>
                <p className="text-xs theme-text-muted mt-1.5 leading-relaxed min-h-[32px]">
                  For creators, Instagram sellers &amp; zero-cost live trials.
                </p>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black theme-text-primary font-mono">₹0</span>
                  <span className="theme-text-muted text-xs font-semibold">/ forever</span>
                </div>
                <div className="font-mono text-[10.5px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                  Up to 100 link txns / month
                </div>

                <div className="mt-5 pt-4 border-t theme-border space-y-2 text-xs theme-text-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span><strong>0% Platform Commission</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Instant Direct Bank Settlement (T+0)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Universal UPI Intent &amp; Dynamic QR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Up to 10 Active Payment Links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Printable Standee Counter QR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Live Merchant Dashboard</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    <span className="w-3.5 h-3.5 text-center shrink-0 font-bold text-[11px]">✕</span>
                    <span>No Developer REST API</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login?mode=signup"
                className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center block transition-colors shadow-xs cursor-pointer"
              >
                Start Free (No Card Needed)
              </Link>
            </div>

            {/* ── Model 2: Starter Plan (₹99/mo) ── */}
            <div className="theme-bg-elevated border theme-border rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-200 theme-card-shadow relative group">
              <span className="absolute -top-3 left-6 bg-slate-700 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                LINK SCALE
              </span>

              <div>
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider theme-link flex items-center gap-1">
                  <span>TIER 1</span>
                  <span>&bull;</span>
                  <span>300 TXNS</span>
                </div>
                <h3 className="text-xl font-bold theme-text-primary mt-1">Starter Plan</h3>
                <p className="text-xs theme-text-muted mt-1.5 leading-relaxed min-h-[32px]">
                  Higher link quota, custom slugs &amp; statement downloads.
                </p>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black theme-text-primary font-mono">₹99</span>
                  <span className="theme-text-muted text-xs font-semibold">/ month</span>
                </div>
                <div className="font-mono text-[10.5px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                  Up to 300 link txns / month
                </div>

                <div className="mt-5 pt-4 border-t theme-border space-y-2 text-xs theme-text-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span><strong>Everything in Free</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Up to 300 Link Txns / month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Unlimited Payment Links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Custom Link Slugs &amp; Notes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>CSV Statement Exports</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Standard Email Support (48h)</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                    <span className="w-3.5 h-3.5 text-center shrink-0 font-bold text-[11px]">✕</span>
                    <span>No Developer REST API</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login?mode=signup"
                className="mt-6 w-full py-2.5 rounded-xl border theme-border hover:border-[#0F2BFF] theme-bg-well theme-text-primary text-xs font-bold text-center block transition-colors cursor-pointer"
              >
                Get Started for ₹99
              </Link>
            </div>

            {/* ── Model 3: Growth Plan (₹299/mo) — POPULAR FOR SAAS & DEV ── */}
            <div className="theme-bg-elevated border-2 border-sky-500 dark:border-sky-400 rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-200 relative theme-card-shadow group">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-sky-600 text-white font-mono text-[9px] font-bold uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
                ★ UNLOCKS REST API
              </span>

              <div>
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1">
                  <span>TIER 2</span>
                  <span>&bull;</span>
                  <span>1,000 TXNS</span>
                </div>
                <h3 className="text-xl font-bold theme-text-primary mt-1">Growth Plan</h3>
                <p className="text-xs theme-text-muted mt-1.5 leading-relaxed min-h-[32px]">
                  Full Developer REST API &amp; webhooks for apps &amp; checkouts.
                </p>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black theme-text-primary font-mono">₹299</span>
                  <span className="theme-text-muted text-xs font-semibold">/ month</span>
                </div>
                <div className="font-mono text-[10.5px] text-sky-600 dark:text-sky-400 font-bold mt-0.5">
                  Up to 1,000 txns / month (API + Links)
                </div>

                <div className="mt-5 pt-4 border-t theme-border space-y-2 text-xs theme-text-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span><strong>Full Developer REST API Access</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span><strong>5 Webhooks with Auto-Retry</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Automated UTR Bank Matching</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Up to 1,000 Verified Transactions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Unlimited Links &amp; Standee QR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Priority Email Support (24h)</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login?mode=signup"
                className="mt-6 w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <span>Choose Growth (₹299)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* ── Model 4: Pro Flagship (₹499/mo) — UNLIMITED CROWN TIER ── */}
            <div className="theme-bg-elevated border-2 border-[#0F2BFF] dark:border-[#3B82F6] rounded-2xl p-6 flex flex-col justify-between hover:-translate-y-1.5 transition-transform duration-200 relative shadow-xl group">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0F2BFF] text-white font-mono text-[9px] font-bold uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
                👑 MAX VALUE &bull; UNLIMITED
              </span>

              <div>
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-wider text-[#0F2BFF] dark:text-[#60A5FA] flex items-center gap-1">
                  <span>TIER 3</span>
                  <span>&bull;</span>
                  <span>UNLIMITED EVERYTHING</span>
                </div>
                <h3 className="text-xl font-bold theme-text-primary mt-1">Pro Flagship</h3>
                <p className="text-xs theme-text-muted mt-1.5 leading-relaxed min-h-[32px]">
                  Zero limits, 24/7 WhatsApp VIP hotline &amp; PDF bank statements.
                </p>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black theme-text-primary font-mono">₹499</span>
                  <span className="theme-text-muted text-xs font-semibold">/ month</span>
                </div>
                <div className="font-mono text-[10.5px] text-[#0F2BFF] dark:text-[#60A5FA] font-bold mt-0.5">
                  UNLIMITED Transactions &amp; Volume
                </div>

                <div className="mt-5 pt-4 border-t theme-border space-y-2 text-xs theme-text-secondary">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span><strong>UNLIMITED Transactions &amp; Volume</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span><strong>24/7 Dedicated WhatsApp Hotline (&lt;1h)</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span><strong>Automated Monthly PDF Bank Statements</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span>Full REST API &amp; High-Speed Webhooks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span>Real-Time Bank Polling (Zero Latency)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span>White-Label (Remove MyMobPay branding)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#0F2BFF] dark:text-[#60A5FA] shrink-0" />
                    <span>Multi-Staff Team Accounts (3 Seats)</span>
                  </div>
                </div>
              </div>

              <Link
                href="/login?mode=signup"
                className="mt-6 w-full py-2.5 rounded-xl bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-colors shadow-md cursor-pointer"
              >
                <span>Get Pro Flagship (₹499)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Trust & Security Micro-Banner ── */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs theme-text-muted font-medium py-4 px-6 rounded-2xl theme-bg-elevated border theme-border max-w-4xl mx-auto shadow-xs">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>0% MDR Direct Bank Settlement</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Zero Fund Custody / No Escrow</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Instant T+0 UPI Settlement</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#0F2BFF] dark:text-[#60A5FA]" />
            <span>Cancel or Upgrade Anytime</span>
          </div>
        </div>
      </main>

      {/* ── Footer matching Homepage ── */}
      <footer className="border-t theme-border theme-bg-primary/80 py-8 text-xs theme-text-muted transition-colors mt-12">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
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
