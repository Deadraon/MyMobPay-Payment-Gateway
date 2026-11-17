'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  CheckCheck,
  ArrowRight,
  Briefcase,
  Database,
  Zap,
  Shield,
  ShieldCheck,
  Sparkles,
  Lock,
  ChevronDown,
  QrCode,
  Code2,
  Server,
  FileText,
  Headphones
} from 'lucide-react';
import { MyMobPayLogoMark } from '@/components/MyMobPayLogo';
import ThemeToggleButton from '@/components/ThemeToggleButton';

const FAQ_ITEMS = [
  {
    q: 'How does the annual plan with 2 months free work?',
    a: 'Annual billing is available for our Growth and Pro Flagship plans. When you choose annual billing, you pay for 10 months and receive 12 full months of service, giving you 2 months completely free (Growth at ₹2,990/year instead of ₹3,588, and Pro Flagship at ₹4,990/year instead of ₹5,988). The Starter plan is offered exclusively on a flexible monthly subscription at ₹99/month.',
  },
  {
    q: 'Why does MyMobPay charge a flat software subscription instead of 2%?',
    a: 'Traditional payment gateways deduct 2% on every single rupee you collect, eating away at your profit margins. MyMobPay operates as independent payment infrastructure software: you pay a flat predictable subscription, and 100% of customer collections land directly in your own merchant bank account via UPI and IMPS with zero gateway deductions.',
  },
  {
    q: 'Does MyMobPay hold our merchant funds in escrow or nodal accounts?',
    a: 'Never. Unlike traditional aggregators that hold funds in intermediary nodal accounts for T+2 days, MyMobPay uses direct peer-to-peer UPI intent, dynamic QR codes, and bank rails. Money flows directly from your customer into your designated bank account (T+0 settlement).',
  },
  {
    q: 'What happens if I exceed my monthly plan quota?',
    a: 'You can upgrade your plan at any time directly inside your merchant dashboard. We notify you before reaching your limit so your payment links and API checkouts run smoothly without interruption.',
  },
  {
    q: 'Can I switch or cancel my plan at any time?',
    a: 'Yes. There are no lock-in contracts or cancellation penalties. You can switch between monthly and annual billing, upgrade, or cancel your subscription at the end of any billing cycle from your settings.',
  },
  {
    q: 'What payment rails are supported across all plans?',
    a: 'All plans include direct-to-bank UPI (Google Pay, PhonePe, Paytm, BHIM, Cred, and all bank UPI apps) plus IMPS bank rails with real-time automated UTR verification.',
  },
];

const plans = [
  {
    name: "Free Link Starter",
    description:
      "Great for creators and small sellers looking to get started with 0% fee payments",
    price: 0,
    yearlyPrice: 0,
    isFreeForever: true,
    buttonText: "Get started",
    buttonVariant: "outline",
    popular: false,
    features: [
      { text: "Up to 100 txns per month", icon: <Briefcase size={20} /> },
      { text: "Dynamic UPI QR & Intent", icon: <Database size={20} /> },
      { text: "Direct bank settlement", icon: <Server size={20} /> },
    ],
    includes: [
      "Free includes:",
      "0% Gateway commission",
      "Instant T+0 bank settlement",
      "Up to 10 payment links",
      "Printable counter QR standee",
    ],
  },
  {
    name: "Starter",
    description:
      "Great for small businesses and startups looking to get started with flat-rate payments",
    price: 99,
    yearlyPrice: 99,
    isMonthlyOnly: true,
    buttonText: "Get started",
    buttonVariant: "outline",
    popular: false,
    features: [
      { text: "Up to 300 txns per month", icon: <Briefcase size={20} /> },
      { text: "Unlimited payment links", icon: <Database size={20} /> },
      { text: "CSV statement downloads", icon: <Server size={20} /> },
    ],
    includes: [
      "Everything in Free, plus:",
      "300 Monthly transactions",
      "Unlimited payment links",
      "Custom link slugs & notes",
      "CSV financial statement exports",
    ],
  },
  {
    name: "Growth",
    description:
      "Best value for growing businesses that need developer REST API and webhooks",
    price: 299,
    yearlyPrice: 2990,
    buttonText: "Get started",
    buttonVariant: "default",
    popular: true,
    features: [
      { text: "Full Developer REST API", icon: <Briefcase size={20} /> },
      { text: "5 Webhooks with auto-retry", icon: <Database size={20} /> },
      { text: "1,000 verified txns/month", icon: <Server size={20} /> },
    ],
    includes: [
      "Everything in Starter, plus:",
      "Automated UTR bank matching",
      "High-speed webhook retries",
      "Custom slug & payee notes",
      "Priority email support (24h SLA)",
    ],
  },
  {
    name: "Pro Flagship",
    description:
      "Advanced plan with enhanced security, VIP hotline and unlimited access",
    price: 499,
    yearlyPrice: 4990,
    buttonText: "Get started",
    buttonVariant: "outline",
    popular: false,
    features: [
      { text: "Unlimited txns & volume", icon: <Briefcase size={20} /> },
      { text: "24/7 WhatsApp VIP hotline", icon: <Database size={20} /> },
      { text: "Automated monthly PDF statements", icon: <Server size={20} /> },
    ],
    includes: [
      "Everything in Growth, plus:",
      "Dedicated VIP support (under 1h SLA)",
      "Automated monthly PDF statements",
      "White-label (zero MyMobPay branding)",
      "Multi-staff team accounts (3 seats)",
    ],
  },
];

const PricingSwitch = ({ onSwitch }) => {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className="flex justify-center">
      <div className="relative z-50 mx-auto flex w-fit rounded-full theme-bg-elevated border theme-border p-1 shadow-xs">
        <button
          type="button"
          onClick={() => handleSwitch("0")}
          className={`relative z-10 w-fit sm:h-12 h-10 rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors cursor-pointer ${
            selected === "0"
              ? "text-white"
              : "theme-text-muted hover:theme-text-primary"
          }`}
        >
          {selected === "0" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0 sm:h-12 h-10 w-full rounded-full border-4 shadow-sm shadow-blue-600 border-blue-600 bg-gradient-to-t from-blue-500 via-blue-400 to-blue-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">Monthly</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitch("1")}
          className={`relative z-10 w-fit sm:h-12 h-10 flex-shrink-0 rounded-full sm:px-6 px-3 sm:py-2 py-1 font-medium transition-colors cursor-pointer ${
            selected === "1"
              ? "text-white"
              : "theme-text-muted hover:theme-text-primary"
          }`}
        >
          {selected === "1" && (
            <motion.span
              layoutId={"switch"}
              className="absolute top-0 left-0 sm:h-12 h-10 w-full rounded-full border-4 shadow-sm shadow-blue-600 border-blue-600 bg-gradient-to-t from-blue-500 via-blue-400 to-blue-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            Yearly
            <span className="rounded-full bg-blue-100 dark:bg-blue-900/60 border border-blue-200 dark:border-blue-700/50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
              Save 20%
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default function PricingClient() {
  const [theme, setTheme] = useState('dark');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const pricingRef = React.useRef(null);

  const togglePricingPeriod = (val) => {
    setIsYearly(Number.parseInt(val) === 1);
  };

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

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const isAnnual = isYearly;

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
          --bg-card: #FFFFFF;
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
          --bg-card: #161D2B;
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
          line-height: 0.98;
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

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-8 pb-16 sm:pt-14 sm:pb-24" ref={pricingRef}>
        <div className="text-center mb-6 max-w-3xl mx-auto relative z-10">
          <h2 className="md:text-6xl sm:text-4xl text-3xl font-medium theme-text-primary mb-4">
            Plans that works best for your{" "}
            <span className="border border-dashed border-blue-500 px-3 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 capitalize inline-block font-semibold">
              business
            </span>
          </h2>
          <p className="sm:text-base text-sm theme-text-muted sm:w-[70%] w-[80%] mx-auto">
            Trusted by millions, We help teams all around the world, Explore which option is right for you.
          </p>
        </div>

        <div className="relative z-10 mb-8">
          <PricingSwitch onSwitch={togglePricingPeriod} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl gap-4 py-6 mx-auto relative z-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl border text-left p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 shadow-sm ${
                plan.popular
                  ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50/70 dark:bg-[#0D1F38]"
                  : "theme-bg-elevated theme-border"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-2xl sm:text-3xl font-semibold theme-text-primary">
                    {plan.name}
                  </h3>
                  {plan.popular && (
                    <div>
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Popular
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-sm theme-text-muted mb-4 min-h-[40px] leading-relaxed">
                  {plan.description}
                </p>
                <div className="flex items-baseline mb-6">
                  <span className="text-4xl font-semibold theme-text-primary">
                    ₹{isYearly ? plan.yearlyPrice : plan.price}
                  </span>
                  <span className="theme-text-muted ml-1 text-sm font-medium">
                    /{plan.isFreeForever ? "forever" : isYearly ? (plan.isMonthlyOnly ? "month" : "year") : "month"}
                  </span>
                </div>

                <Link
                  href="/login?mode=signup"
                  className={`w-full mb-6 p-4 text-xl rounded-xl text-center block font-medium transition-all ${
                    plan.popular
                      ? "bg-gradient-to-t from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 border border-blue-400 text-white hover:opacity-95"
                      : "bg-gradient-to-t from-neutral-900 to-neutral-700 dark:from-[#232D42] dark:to-[#161D2B] shadow-lg shadow-neutral-900/30 dark:shadow-black/60 border border-neutral-700 dark:border-[#384663] text-white hover:opacity-95"
                  }`}
                >
                  {plan.buttonText}
                </Link>

                <ul className="space-y-2 font-semibold py-5">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <span className="theme-text-secondary grid place-content-center mt-0.5 mr-3 shrink-0">
                        {feature.icon}
                      </span>
                      <span className="text-sm theme-text-secondary">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3 pt-4 border-t theme-border">
                  <h4 className="font-semibold text-base theme-text-primary mb-3">
                    {plan.includes[0]}
                  </h4>
                  <ul className="space-y-2 font-semibold">
                    {plan.includes.slice(1).map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <span className="h-6 w-6 bg-blue-50 dark:bg-blue-950/60 border border-blue-500/40 dark:border-blue-400/40 rounded-full grid place-content-center mt-0.5 mr-3 shrink-0">
                          <CheckCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        </span>
                        <span className="text-sm theme-text-secondary">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Trust & Settlement Guarantees Banner (Borderless, Elevated) ── */}
        <div className="mt-16 p-7 sm:p-8 rounded-3xl theme-bg-elevated border theme-border shadow-sm max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold theme-text-primary">0% Commission</h4>
                <p className="text-xs theme-text-muted mt-0.5 leading-snug">
                  100% of revenue goes directly into your bank. Zero gateway tax.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold theme-text-primary">Zero Fund Escrow</h4>
                <p className="text-xs theme-text-muted mt-0.5 leading-snug">
                  Money never touches our accounts. Direct P2P bank settlement.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold theme-text-primary">T+0 Instant Rails</h4>
                <p className="text-xs theme-text-muted mt-0.5 leading-snug">
                  Instant credit into your merchant account via high-speed UPI.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-[#0F2BFF] dark:text-[#60A5FA] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold theme-text-primary">No Lock-in Contracts</h4>
                <p className="text-xs theme-text-muted mt-0.5 leading-snug">
                  Simple predictable software billing. Upgrade or cancel anytime.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Feature Comparison Matrix Table (Borderless Container) ── */}
        <section className="mt-20 max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] theme-link">
              COMPREHENSIVE SPEC SHEET
            </span>
            <h2 className="headline-anton text-2xl sm:text-3xl mt-1.5">
              COMPARE EVERY FEATURE
            </h2>
            <p className="text-xs sm:text-sm theme-text-muted mt-1 max-w-md mx-auto">
              Everything you need to know about our flat subscription plans with zero transaction commissions.
            </p>
          </div>

          <div className="theme-bg-elevated border theme-border rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b theme-border theme-bg-well">
                    <th className="py-4 px-4 sm:px-6 font-bold theme-text-primary w-2/5">Feature</th>
                    <th className="py-4 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">Free (₹0)</th>
                    <th className="py-4 px-3 text-center font-bold theme-text-secondary">Starter (₹99)</th>
                    <th className="py-4 px-3 text-center font-bold text-sky-600 dark:text-sky-400 bg-sky-500/5">Growth (₹299)</th>
                    <th className="py-4 px-3 text-center font-bold text-[#0F2BFF] dark:text-[#60A5FA] bg-[#0F2BFF]/5">Pro Flagship (₹499)</th>
                  </tr>
                </thead>
                <tbody className="divide-y theme-border">
                  {/* Category: Pricing & Limits */}
                  <tr className="theme-bg-well/60">
                    <td colSpan={5} className="py-2.5 px-4 sm:px-6 font-mono font-bold text-[10px] uppercase tracking-wider theme-text-muted">
                      PRICING &amp; VOLUME
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Monthly Subscription</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-emerald-600 dark:text-emerald-400">₹0</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold theme-text-primary">₹99/mo</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/5">₹299/mo</td>
                    <td className="py-3.5 px-3 text-center font-mono font-black text-[#0F2BFF] dark:text-[#60A5FA] bg-[#0F2BFF]/5">₹499/mo</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Annual Billing (2 Months Free)</td>
                    <td className="py-3.5 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400">Free</td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-400">Monthly Only</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/5">₹2,990/yr</td>
                    <td className="py-3.5 px-3 text-center font-mono font-black text-[#0F2BFF] dark:text-[#60A5FA] bg-[#0F2BFF]/5">₹4,990/yr</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Gateway Commission</td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">0%</td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">0%</td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-sky-500/5">0%</td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-[#0F2BFF]/5">0%</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Monthly Transaction Cap</td>
                    <td className="py-3.5 px-3 text-center font-mono theme-text-secondary">100 txns</td>
                    <td className="py-3.5 px-3 text-center font-mono theme-text-secondary">300 txns</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/5">1,000 txns</td>
                    <td className="py-3.5 px-3 text-center font-mono font-black text-[#0F2BFF] dark:text-[#60A5FA] bg-[#0F2BFF]/5">UNLIMITED</td>
                  </tr>

                  {/* Category: Collection Rails */}
                  <tr className="theme-bg-well/60">
                    <td colSpan={5} className="py-2.5 px-4 sm:px-6 font-mono font-bold text-[10px] uppercase tracking-wider theme-text-muted">
                      COLLECTION RAILS &amp; LINKS
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Direct Bank Settlement (T+0)</td>
                    <td className="py-3.5 px-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                    <td className="py-3.5 px-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                    <td className="py-3.5 px-3 text-center bg-sky-500/5"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                    <td className="py-3.5 px-3 text-center bg-[#0F2BFF]/5"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Dynamic UPI QR &amp; Intent</td>
                    <td className="py-3.5 px-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                    <td className="py-3.5 px-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                    <td className="py-3.5 px-3 text-center bg-sky-500/5"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                    <td className="py-3.5 px-3 text-center bg-[#0F2BFF]/5"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Payment Links Limit</td>
                    <td className="py-3.5 px-3 text-center theme-text-secondary">Up to 10</td>
                    <td className="py-3.5 px-3 text-center font-bold text-blue-600 dark:text-blue-400">Unlimited</td>
                    <td className="py-3.5 px-3 text-center font-bold text-sky-600 dark:text-sky-400 bg-sky-500/5">Unlimited</td>
                    <td className="py-3.5 px-3 text-center font-bold text-[#0F2BFF] dark:text-[#60A5FA] bg-[#0F2BFF]/5">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Custom Slugs &amp; Payee Notes</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                    <td className="py-3.5 px-3 text-center bg-sky-500/5"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                    <td className="py-3.5 px-3 text-center bg-[#0F2BFF]/5"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">CSV Statement Exports</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                    <td className="py-3.5 px-3 text-center bg-sky-500/5"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                    <td className="py-3.5 px-3 text-center bg-[#0F2BFF]/5"><Check className="w-4 h-4 text-emerald-500 mx-auto stroke-[2.5]" /></td>
                  </tr>

                  {/* Category: Developer & Integration */}
                  <tr className="theme-bg-well/60">
                    <td colSpan={5} className="py-2.5 px-4 sm:px-6 font-mono font-bold text-[10px] uppercase tracking-wider theme-text-muted">
                      DEVELOPER API &amp; AUTOMATION
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Developer REST API Access</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center font-bold text-sky-600 dark:text-sky-400 bg-sky-500/5">Full Access</td>
                    <td className="py-3.5 px-3 text-center font-bold text-[#0F2BFF] dark:text-[#60A5FA] bg-[#0F2BFF]/5">Full Access</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Signed Webhooks with Auto-Retry</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/5">5 Endpoints</td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-[#0F2BFF] dark:text-[#60A5FA] bg-[#0F2BFF]/5">Unlimited</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Automated UTR Bank Matching</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center bg-sky-500/5">
                      <span className="inline-flex items-center gap-1 justify-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" /> Standard
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center bg-[#0F2BFF]/5">
                      <span className="inline-flex items-center gap-1 justify-center text-[#0F2BFF] dark:text-[#60A5FA] font-bold">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Priority SLA
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">White-Label (Remove Badge)</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center text-slate-400 bg-sky-500/5">-</td>
                    <td className="py-3.5 px-3 text-center bg-[#0F2BFF]/5">
                      <span className="inline-flex items-center gap-1 justify-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" /> Included
                      </span>
                    </td>
                  </tr>

                  {/* Category: Support & SLA */}
                  <tr className="theme-bg-well/60">
                    <td colSpan={5} className="py-2.5 px-4 sm:px-6 font-mono font-bold text-[10px] uppercase tracking-wider theme-text-muted">
                      SUPPORT &amp; SERVICE LEVEL
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Support Response SLA</td>
                    <td className="py-3.5 px-3 text-center theme-text-muted">Community</td>
                    <td className="py-3.5 px-3 text-center theme-text-secondary">48h Email</td>
                    <td className="py-3.5 px-3 text-center font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/5">24h Priority Email</td>
                    <td className="py-3.5 px-3 text-center font-bold text-[#0F2BFF] dark:text-[#60A5FA] bg-[#0F2BFF]/5">&lt;1h Priority SLA</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">24/7 Dedicated WhatsApp Hotline</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center text-slate-400 bg-sky-500/5">-</td>
                    <td className="py-3.5 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-[#0F2BFF]/5">
                      <span className="inline-flex items-center gap-1 justify-center">
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" /> 24/7 VIP Access
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Automated PDF Bank Statements</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center text-slate-400">-</td>
                    <td className="py-3.5 px-3 text-center text-slate-400 bg-sky-500/5">-</td>
                    <td className="py-3.5 px-3 text-center bg-[#0F2BFF]/5">
                      <span className="inline-flex items-center gap-1 justify-center text-emerald-600 dark:text-emerald-400 font-semibold">
                        <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" /> Monthly Automated
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium theme-text-primary">Staff Team Accounts</td>
                    <td className="py-3.5 px-3 text-center theme-text-secondary">1 Seat</td>
                    <td className="py-3.5 px-3 text-center theme-text-secondary">1 Seat</td>
                    <td className="py-3.5 px-3 text-center theme-text-secondary bg-sky-500/5">1 Seat</td>
                    <td className="py-3.5 px-3 text-center font-bold text-[#0F2BFF] dark:text-[#60A5FA] bg-[#0F2BFF]/5">3 Seats</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Frequently Asked Questions (FAQ) Section (Borderless Accordions) ── */}
        <section className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] theme-link">
              GOT QUESTIONS?
            </span>
            <h2 className="headline-anton text-2xl sm:text-3xl mt-1.5">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <p className="text-xs sm:text-sm theme-text-muted mt-1">
              Clear, transparent answers about our 0% fee model, annual billing, and subscription plans.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="theme-bg-elevated border theme-border rounded-2xl shadow-xs overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(index)}
                    className="w-full py-4 px-6 flex items-center justify-between text-left gap-4 cursor-pointer"
                    aria-expanded={isOpen}
                  >
                    <span className="text-xs sm:text-sm font-bold theme-text-primary">
                      {item.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 theme-text-muted transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#0F2BFF] dark:text-[#60A5FA]' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 pt-1 text-xs theme-text-secondary leading-relaxed border-t theme-border">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── High-Converting Bottom CTA Card (Borderless, Rounded-3xl) ── */}
        <div className="mt-20 max-w-4xl mx-auto rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden bg-gradient-to-br from-[#0F2BFF] to-[#0A1A8F] text-white shadow-2xl">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-cyan-400/20 blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
              START IN UNDER 2 MINUTES
            </span>
            <h2 className="headline-anton text-3xl sm:text-4xl lg:text-5xl mt-4 text-white">
              STOP PAYING 2% GATEWAY TAX TODAY.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-white/85 max-w-xl mx-auto leading-relaxed">
              Start with our Free Link Starter plan (no credit card required) or choose Growth / Pro Flagship for full developer REST APIs and webhooks.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/login?mode=signup"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-[#0F2BFF] hover:bg-neutral-100 text-xs sm:text-sm font-bold shadow-lg transition-transform hover:scale-[1.02] flex items-center justify-center gap-2"
                style={{ backgroundColor: '#ffffff', color: '#0F2BFF' }}
              >
                <span>Create Free Merchant Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/docs"
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold border border-white/20 transition-colors"
              >
                Read API Documentation
              </Link>
            </div>
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
