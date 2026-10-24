'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Lock, 
  Smartphone, 
  QrCode, 
  Building2, 
  Percent, 
  ChevronRight, 
  Menu, 
  X, 
  Check, 
  Sparkles,
  CreditCard,
  RotateCcw,
  Play,
  Volume2,
  CheckCircle,
  ExternalLink,
  Activity,
  Copy,
  Code2,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { MyMobPayLogo } from '@/components/MyMobPayLogo';
import { useDropdownTransition } from './useDropdownTransition';

export default function HomeHeroRedesign({ showFooterCTA = false } = {}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isMounted: isMobileMenuMounted, dropdownClass: mobileMenuDropdownClass } = useDropdownTransition(isMobileMenuOpen);
  const [sliderVolume, setSliderVolume] = useState(250000); // Default ₹2.5 Lakhs/mo
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay'); // 'gpay' | 'phonepe' | 'paytm' | 'bhim'
  
  // Interactive Live Payment Simulator state
  const [simState, setSimState] = useState('idle'); // 'idle' | 'authorizing' | 'success'
  const [simProgress, setSimProgress] = useState(0);

  // Transitions.dev: Toast State (22-toast.md)
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastData, setToastData] = useState({ title: '', desc: '', utr: '' });

  // Transitions.dev: Toggle & Digit Pop-in State (27-toggle.md & 02-number-pop-in.md)
  const [isAnnual, setIsAnnual] = useState(false);
  const [toggleInit, setToggleInit] = useState(false);
  const [isDigitAnimating, setIsDigitAnimating] = useState(false);

  // Transitions.dev: Accordion FAQ State (21-accordion.md)
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Transitions.dev: Copy Text Morph State (33-text-morph.md)
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('html'); // 'html' | 'react' | 'webhook'

  // Transitions.dev: Card Hover Tilt State (19-card-tilt.md)
  const phoneContainerRef = React.useRef(null);
  const [tiltProps, setTiltProps] = useState({});
  const [isTilting, setIsTilting] = useState(false);
  const [isHoveringPhone, setIsHoveringPhone] = useState(false);

  // Pointer tracking for physical 3D tilt + specular glare (19-card-tilt.md)
  const handlePhoneMouseMove = (e) => {
    if (!phoneContainerRef.current) return;
    const rect = phoneContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = (x - cx) / cx;
    const dy = (y - cy) / cy;
    const rx = -dy * 8; // gentle 8deg max tilt
    const ry = dx * 8;
    const gx = Math.round((x / rect.width) * 100);
    const gy = Math.round((y / rect.height) * 100);

    setTiltProps({
      '--tilt-rx': `${rx.toFixed(2)}deg`,
      '--tilt-ry': `${ry.toFixed(2)}deg`,
      '--tilt-gx': `${gx}%`,
      '--tilt-gy': `${gy}%`,
    });
    setIsTilting(true);
  };

  const handlePhoneMouseEnter = () => {
    setIsHoveringPhone(true);
  };

  const handlePhoneMouseLeave = () => {
    setIsTilting(false);
    setIsHoveringPhone(false);
    setTiltProps({
      '--tilt-rx': '0deg',
      '--tilt-ry': '0deg',
      '--tilt-gx': '50%',
      '--tilt-gy': '50%',
    });
  };

  // Dynamic Typewriter Headline rotation - clean solid phrasing
  const heroLines = useMemo(() => [
    '0% transaction fees.',
    'Zero gateway commission.',
    'Instant T+0 bank credit.',
    'Direct UPI to your account.',
    'No held funds or escrow.'
  ], []);

  const [typedLine, setTypedLine] = useState(heroLines[0]);
  const [lineIndex, setLineIndex] = useState(0);
  const [isDeletingLine, setIsDeletingLine] = useState(false);
  const [charIndex, setCharIndex] = useState(heroLines[0].length);
  const [typingSpeed, setTypingSpeed] = useState(90);

  useEffect(() => {
    const handleType = () => {
      const current = heroLines[lineIndex];
      if (isDeletingLine) {
        setTypedLine(current.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
        setTypingSpeed(40);
      } else {
        setTypedLine(current.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
        setTypingSpeed(85);
      }

      if (!isDeletingLine && charIndex === current.length) {
        setTypingSpeed(2200); // Pause on completed sentence
        setIsDeletingLine(true);
      } else if (isDeletingLine && charIndex === 0) {
        setIsDeletingLine(false);
        setLineIndex(prev => (prev + 1) % heroLines.length);
        setTypingSpeed(300); // Pause before typing next
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [charIndex, isDeletingLine, lineIndex, typingSpeed, heroLines]);

  // Payment Simulation Trigger with Transitions.dev Toast Announcement
  const triggerSimulation = () => {
    if (simState !== 'idle') return;
    setSimState('authorizing');
    setSimProgress(25);

    setTimeout(() => setSimProgress(70), 500);
    setTimeout(() => {
      setSimProgress(100);
      setSimState('success');
      setToastData({
        title: '₹1,499.00 Credited via UPI',
        desc: 'Direct settlement to HDFC Bank A/c ••4102. Zero fee deducted.',
        utr: '3291840291'
      });
      setIsToastOpen(true);
    }, 1100);
  };

  const resetSimulation = () => {
    setSimState('idle');
    setSimProgress(0);
    setIsToastOpen(false);
  };

  // Slider change trigger with digit animation (02-number-pop-in.md)
  const handleSliderChange = (newVal) => {
    setSliderVolume(newVal);
    setIsDigitAnimating(true);
    setTimeout(() => setIsDigitAnimating(false), 450);
  };

  // Live savings comparison calculations (incorporating annual discount toggle)
  const comparison = useMemo(() => {
    const traditionalFeeRate = 0.02; // 2%
    const traditionalGstRate = 0.18; // 18% GST on fee
    const traditionalFee = sliderVolume * traditionalFeeRate;
    const traditionalTotalCost = traditionalFee * (1 + traditionalGstRate); // 2.36% total
    const myMobPayCost = isAnnual ? 399 : 499; // Flat ₹399/mo (annual) vs ₹499/mo (monthly)
    const monthlySavings = Math.max(0, traditionalTotalCost - myMobPayCost);
    const annualSavings = monthlySavings * 12;

    return {
      traditionalTotalCost: Math.round(traditionalTotalCost),
      myMobPayCost,
      monthlySavings: Math.round(monthlySavings),
      annualSavings: Math.round(annualSavings),
      percentRetained: Math.round(((sliderVolume - myMobPayCost) / sliderVolume) * 100)
    };
  }, [sliderVolume, isAnnual]);

  const copyEmbedCode = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const codeSnippets = {
    html: `<!-- 1. Drop into your HTML <head> or <body> -->
<script src="https://mymob.tech/sdk/checkout.js" async></script>

<!-- 2. Trigger instant zero-fee UPI modal -->
<button onclick="MyMobPay.open({
  merchantVpa: 'craftstudio@okhdfcbank',
  amount: 1499.00,
  orderId: 'ORD_94829',
  onSuccess: (data) => console.log('Paid! UTR:', data.utr)
})">
  Pay ₹1,499 with UPI (0% Fee)
</button>`,
    react: `import { useMyMobPay } from '@mymobpay/react';

export function CheckoutButton({ amount, orderId }) {
  const { openCheckout } = useMyMobPay();

  return (
    <button 
      onClick={() => openCheckout({
        merchantVpa: 'craftstudio@okhdfcbank',
        amount,
        orderId,
        onSuccess: (res) => alert('Payment direct to bank! UTR: ' + res.utr)
      })}
      className="btn-pay"
    >
      Pay via UPI (Instant Bank Settlement)
    </button>
  );
}`,
    webhook: `// Node.js Express Webhook Handler
const crypto = require('crypto');

app.post('/api/mymobpay/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-mymobpay-signature'];
  const expectedSig = crypto
    .createHmac('sha256', process.env.MYMOBPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSig) return res.status(401).send('Invalid signature');

  const { event, data } = JSON.parse(req.body);
  if (event === 'payment.succeeded') {
    // 100% credited directly to your bank account!
    console.log(\`Received ₹\${data.amount} for Order \${data.orderId}, UTR: \${data.utr}\`);
    fulfillOrder(data.orderId);
  }

  res.json({ received: true });
});`
  };

  const faqs = [
    {
      q: "How do payments reach my bank if MyMobPay doesn't hold escrow?",
      a: "MyMobPay uses direct UPI 2.0 dynamic routing directly to your bank VPA (e.g. store@okhdfcbank). When your buyer approves the UPI intent in Google Pay, PhonePe, or Paytm, NPCI settles the money directly from their bank into your bank account in under 3 seconds. MyMobPay never touches or pools your funds."
    },
    {
      q: "Are there really zero transaction fees? Any hidden setup charges?",
      a: "Zero per-transaction fees. Whether you collect ₹10,000 or ₹25,00,000 every month, we deduct ₹0.00. You simply pay our flat subscription license (₹499/mo or ₹399/mo annual). There are no setup fees, no maintenance fees, and no per-transaction cuts."
    },
    {
      q: "Can I connect my existing Current or Savings bank account?",
      a: "Yes. Any Indian bank account that supports UPI (HDFC, ICICI, SBI, Axis, Kotak, IndusInd, PNB, etc.) can be linked in less than 2 minutes. Simply enter your existing UPI ID. No lengthy documentation or branch visits required."
    },
    {
      q: "How do I automate order confirmations and digital delivery?",
      a: "Every successful payment fires an HMAC-SHA256 signed webhook directly to your backend with the customer's payment reference (UTR) and order ID. We also provide ready-made webhooks and drop-in plugins for instant automated order fulfillment."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* ─────────────────────────────────────────────────────────────
          1. STICKY TOP NAVIGATION BAR (Clean High-Contrast Fintech)
          ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs transition-all">
        
        {/* Top Announcement Bar: High-contrast Dark Navy + Crisp White Copy */}
        <div className="w-full bg-[#0B1528] text-white text-[11px] sm:text-xs py-2 px-4 flex items-center justify-between sm:justify-center gap-2 sm:gap-3 border-b border-slate-800 select-none">
          <div className="flex items-center gap-2 truncate">
            <span className="inline-flex items-center gap-1.5 bg-blue-600 text-white font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wide shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Direct UPI 2.0
            </span>
            <span className="text-slate-200 font-normal truncate hidden sm:inline">
              Zero per-transaction fees. Direct-to-bank settlement. We never hold merchant funds.
            </span>
            <span className="text-slate-200 font-normal truncate sm:hidden">
              0% Gateway Fees • Direct Bank Settlement
            </span>
          </div>
          <a
            href="#fee-comparison"
            className="inline-flex items-center gap-1 text-white hover:text-blue-300 font-semibold underline underline-offset-2 transition-colors shrink-0 text-[11px]"
          >
            <span>Calculate savings</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>

        {/* Main Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          {/* Brand Logo with exact colors */}
          <Link href="/" className="flex items-center gap-2 group select-none" aria-label="MyMobPay Home">
            <MyMobPayLogo markSize={32} textSize="text-xl sm:text-2xl" textColor="#0D253D" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-medium text-slate-600">
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors py-1">How it works</a>
            <a href="#fee-comparison" className="hover:text-blue-600 transition-colors py-1">Pricing &amp; Savings</a>
            <a href="#trust-pillars" className="hover:text-blue-600 transition-colors py-1">Security</a>
            <a href="#developer-section" className="hover:text-blue-600 transition-colors py-1 flex items-center gap-1.5">
              <span>Developers</span>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-200/80">API</span>
            </a>
          </nav>

          {/* Desktop Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors rounded-xl hover:bg-slate-100"
            >
              Sign In
            </Link>
            <Link 
              href="/login?mode=signup" 
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 group btn-shimmer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Mobile hamburger button with transitions-dev icon swap (09-icon-swap.md) */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200 flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            <span className="t-icon-swap" data-state={isMobileMenuOpen ? 'b' : 'a'}>
              <span className="t-icon" data-icon="a" aria-hidden={isMobileMenuOpen}>
                <Menu className="w-5 h-5" />
              </span>
              <span className="t-icon" data-icon="b" aria-hidden={!isMobileMenuOpen}>
                <X className="w-5 h-5" />
              </span>
            </span>
          </button>
        </div>

        {/* Mobile Navigation Drawer (transitions-dev: 05-menu-dropdown.md) */}
        {isMobileMenuMounted && (
          <div 
            className={`md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl ${mobileMenuDropdownClass}`}
            data-origin="top-center"
          >
            <nav className="flex flex-col space-y-1">
              <a 
                href="#how-it-works" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                How it works
              </a>
              <a 
                href="#fee-comparison" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                Pricing &amp; Savings Calculator
              </a>
              <a 
                href="#trust-pillars" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                Security &amp; Zero-Holding Guarantee
              </a>
              <a 
                href="#developer-section" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm"
              >
                Developers &amp; API
              </a>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link 
                href="/login" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/login?mode=signup" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. FLAGSHIP HERO: CRISP TECHNICAL CANVAS + SLEEK LIGHT PHONE
          ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32 overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-white to-white">
        
        {/* Crisp Architectural Technical Blueprint Dot Grid (No Muddy Pastels) */}
        <div className="absolute inset-0 bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_25%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />

        {/* Subtle, Pure Blue Technical Radial Glow (Zero muddy yellow/pink) */}
        <div className="absolute top-12 left-1/3 -translate-x-1/2 w-[550px] h-[450px] bg-blue-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-28 right-10 w-[450px] h-[400px] bg-indigo-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Authoritative Copy & Dynamic Solid Headline */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-center lg:text-left">
              
              {/* Trust Status Badge Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200/90 text-slate-800 text-xs font-semibold shadow-xs animate-fade-up">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-slate-900 font-bold">Direct UPI 2.0 Rails</span>
                <span className="text-slate-300">•</span>
                <span className="text-blue-600 font-bold">0% Transaction Fee</span>
              </div>

              {/* Authoritative Solid Headline: Bold Slate + Punchy Blue (NO AI gradient text) */}
              <h1 className="text-4xl sm:text-5xl lg:text-[58px] font-extrabold text-[#0D253D] tracking-[-1.5px] leading-[1.08]">
                <span className="block animate-fade-up delay-100">
                  Accept UPI payments with
                </span>
                <span className="block text-blue-600 animate-fade-up delay-200 mt-1.5 min-h-[1.25em]">
                  <span className="relative inline-block font-black text-blue-600">
                    {typedLine}
                  </span>
                  <span className="inline-block w-[3.5px] h-[0.82em] bg-blue-600 ml-1.5 align-middle animate-pulse" style={{ verticalAlign: 'baseline', marginTop: '-3px' }} />
                </span>
              </h1>

              {/* Subheadline targeted at small business pain points */}
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed animate-fade-up delay-150">
                Why lose 2% on every customer transaction? MyMobPay routes funds directly from your customer&apos;s UPI app to your bank account for one flat fee. <strong className="text-slate-900 font-semibold">Zero commission. Zero escrow delay. We never hold your funds.</strong>
              </p>

              {/* Dual Action CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-2 animate-fade-up delay-200">
                <Link 
                  href="/login?mode=signup" 
                  className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group btn-shimmer"
                >
                  <span>Get Started in 5 Minutes</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <a 
                  href="#fee-comparison"
                  className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-base font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 hover:border-slate-300"
                >
                  <span>Compare Your Savings</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Micro-Reassurance Items */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-slate-500 font-medium pt-1 animate-fade-up delay-250">
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span>Works with any Indian bank</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                  <span>T+0 instant settlement</span>
                </div>
              </div>

              {/* Proof Stats Row */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 max-w-lg mx-auto lg:mx-0 text-left animate-fade-up delay-300">
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#0D253D] tracking-tight">₹0</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Gateway commission</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#0D253D] tracking-tight">0s</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Settlement wait time</p>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-[#0D253D] tracking-tight">100%</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Direct to bank account</p>
                </div>
              </div>

            </div>

            {/* Right Column: Premium Flagship Mobile Apparatus with Transitions.dev Motion */}
            <div className="lg:col-span-5 relative flex flex-col items-center justify-center animate-scale-up">
              
              {/* Satellite Metric Chip 1: Safely positioned at top-left without overlapping device */}
              <div className="self-start mb-3 hidden sm:inline-flex items-center gap-2.5 bg-white/95 backdrop-blur-md border border-slate-200/90 px-4 py-2 rounded-2xl shadow-sm animate-float z-20">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div className="text-left leading-tight">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">UPI Network SLA</p>
                  <p className="text-xs font-extrabold text-[#0D253D]">99.98% Success Rate</p>
                </div>
              </div>

              {/* Transitions.dev: Card Hover Tilt (19-card-tilt.md) Flat Hit Area */}
              <div
                ref={phoneContainerRef}
                onMouseMove={handlePhoneMouseMove}
                onMouseEnter={handlePhoneMouseEnter}
                onMouseLeave={handlePhoneMouseLeave}
                className={`t-tilt ${isHoveringPhone ? 'is-hover' : ''} w-full max-w-[365px]`}
              >
                {/* 3D Tilting Phone Chassis with Cursor-Tracked Glare */}
                <div 
                  className={`t-tilt-card ${isTilting ? 'is-tilting' : ''} relative w-full bg-[#0E1526] p-2.5 rounded-[50px] shadow-[0_25px_70px_-15px_rgba(15,23,42,0.30)] ring-1 ring-slate-800 transition-shadow duration-300 hover:shadow-[0_30px_80px_-15px_rgba(15,23,42,0.40)]`}
                  style={tiltProps}
                >
                  {/* Cursor-Tracked Specular Glare (19-card-tilt.md) */}
                  <div className="t-tilt-glare" />

                  {/* Physical Hardware Buttons on Outer Edge */}
                  <div className="absolute -left-[4px] top-24 w-[3px] h-6 bg-slate-700 rounded-l-xs pointer-events-none" />
                  <div className="absolute -left-[4px] top-34 w-[3px] h-10 bg-slate-700 rounded-l-xs pointer-events-none" />
                  <div className="absolute -left-[4px] top-48 w-[3px] h-10 bg-slate-700 rounded-l-xs pointer-events-none" />
                  <div className="absolute -right-[4px] top-32 w-[3px] h-14 bg-slate-700 rounded-r-xs pointer-events-none" />

                  {/* Internal Operating Screen (Pure Crisp White OLED Canvas) */}
                  <div className="relative bg-white rounded-[40px] overflow-hidden flex flex-col justify-between font-sans select-none min-h-[595px] border border-slate-100 shadow-xs">
                    
                    {/* Dynamic Island Pill with Camera & Sensor */}
                    <div className="pt-2 px-6 flex justify-between items-center text-[11px] font-bold text-slate-800 z-30">
                      <span className="tracking-tight">9:41</span>
                      
                      {/* Dynamic Island */}
                      <div className="w-24 h-5 bg-[#0E1526] rounded-full flex items-center justify-between px-2.5 shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700/60 flex items-center justify-center">
                          <span className="w-0.5 h-0.5 rounded-full bg-blue-500/80" />
                        </div>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>

                      {/* Cellular, 5G & Battery Indicators */}
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <span className="text-[9px] font-black tracking-tight text-blue-700 bg-blue-50 px-1 rounded">5G</span>
                        <div className="w-4 h-2.5 border border-slate-500 rounded-xs p-0.5 flex items-center">
                          <div className="bg-emerald-600 w-full h-full rounded-xs" />
                        </div>
                      </div>
                    </div>

                    <div className="px-4 pt-2.5 pb-4 space-y-3">
                      
                      {/* Live Simulation Controller Strip */}
                      <div className="bg-slate-50 border border-slate-200/90 px-3 py-1.5 rounded-xl flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-1.5 truncate mr-2">
                          <span className={`w-2 h-2 rounded-full shrink-0 ${simState === 'success' ? 'bg-emerald-500 animate-ping' : 'bg-blue-600 animate-pulse'}`} />
                          <span className="text-[11px] font-semibold text-slate-700 truncate">
                            {simState === 'idle' && 'Awaiting UPI scan'}
                            {simState === 'authorizing' && 'Connecting to NPCI...'}
                            {simState === 'success' && 'Settled to Bank (T+0)'}
                          </span>
                        </div>

                        {/* Interactive "Simulate Pay" Button with transitions-dev icon swap (09-icon-swap.md) */}
                        <button
                          onClick={simState === 'idle' ? triggerSimulation : resetSimulation}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all shadow-xs cursor-pointer active:scale-95 shrink-0 ${
                            simState === 'idle'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          <span className="t-icon-swap" data-state={simState === 'idle' ? 'a' : 'b'}>
                            <span className="t-icon" data-icon="a" aria-hidden={simState !== 'idle'}>
                              <Play className="w-3 h-3 fill-current" />
                            </span>
                            <span className="t-icon" data-icon="b" aria-hidden={simState === 'idle'}>
                              <RotateCcw className="w-3 h-3 text-slate-500" />
                            </span>
                          </span>
                          <span>{simState === 'idle' ? 'Simulate Pay' : 'Reset'}</span>
                        </button>
                      </div>

                      {/* Verified Merchant & Due Bill Header */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                              CS
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900 flex items-center gap-1 leading-tight">
                                <span>CraftStudio Online</span>
                                <span className="w-3.5 h-3.5 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[8px] font-black">✓</span>
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5">craftstudio@okhdfcbank</p>
                            </div>
                          </div>

                          <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] shrink-0">
                            Direct UPI 2.0
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                          <span className="text-[11px] text-slate-500 font-medium">Total Due</span>
                          <div className="flex items-baseline font-sans">
                            <span className="text-sm font-semibold text-slate-500 mr-0.5">₹</span>
                            <span className="text-2xl font-black text-[#0D253D] tracking-tight font-sans">
                              1,499.00
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Stage: Scanning QR vs Transitions.dev Success Check */}
                      {simState !== 'success' ? (
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col items-center justify-center space-y-3 relative overflow-hidden group">
                          
                          {/* High-Gloss Cyan/Blue Laser Scanning Beam */}
                          <div className="absolute inset-x-0 top-0 pointer-events-none z-10 animate-laser">
                            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_12px_2px_rgba(37,99,235,0.8)]" />
                            <div className="h-3 w-full bg-gradient-to-b from-blue-500/15 to-transparent" />
                          </div>

                          {/* Progress indicator during simulation */}
                          {simState === 'authorizing' && (
                            <div className="absolute inset-x-0 top-0 h-1 bg-slate-100 z-20">
                              <div 
                                className="h-full bg-blue-600 transition-all duration-300" 
                                style={{ width: `${simProgress}%` }}
                              />
                            </div>
                          )}

                          {/* Clean High-Contrast Vector QR Code */}
                          <div className="relative p-1 bg-white">
                            <svg viewBox="0 0 100 100" className="w-28 h-28 text-slate-900" fill="currentColor">
                              <rect x="5" y="5" width="24" height="24" rx="3" fill="#0F172A" />
                              <rect x="9" y="9" width="16" height="16" rx="2" fill="#FFFFFF" />
                              <rect x="13" y="13" width="8" height="8" rx="1" fill="#2563EB" />

                              <rect x="71" y="5" width="24" height="24" rx="3" fill="#0F172A" />
                              <rect x="75" y="9" width="16" height="16" rx="2" fill="#FFFFFF" />
                              <rect x="79" y="13" width="8" height="8" rx="1" fill="#2563EB" />

                              <rect x="5" y="71" width="24" height="24" rx="3" fill="#0F172A" />
                              <rect x="9" y="75" width="16" height="16" rx="2" fill="#FFFFFF" />
                              <rect x="13" y="79" width="8" height="8" rx="1" fill="#2563EB" />

                              <rect x="35" y="8" width="6" height="6" fill="#0F172A" />
                              <rect x="45" y="14" width="6" height="6" fill="#0F172A" />
                              <rect x="55" y="8" width="8" height="6" fill="#0F172A" />
                              <rect x="35" y="24" width="10" height="6" fill="#0F172A" />
                              <rect x="50" y="24" width="6" height="6" fill="#0F172A" />
                              <rect x="10" y="35" width="8" height="8" fill="#0F172A" />
                              <rect x="24" y="42" width="6" height="8" fill="#0F172A" />
                              <rect x="70" y="35" width="10" height="6" fill="#0F172A" />
                              <rect x="85" y="42" width="6" height="8" fill="#0F172A" />
                              <rect x="35" y="70" width="8" height="6" fill="#0F172A" />
                              <rect x="48" y="76" width="10" height="6" fill="#0F172A" />
                              <rect x="65" y="70" width="6" height="12" fill="#0F172A" />
                              <rect x="75" y="76" width="8" height="8" fill="#0F172A" />
                              <rect x="85" y="85" width="8" height="8" fill="#0F172A" />

                              <rect x="38" y="38" width="24" height="24" rx="6" fill="#2563EB" />
                              <text x="50" y="55" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold" fontFamily="sans-serif">₹</text>
                            </svg>
                          </div>

                          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                            <span>Direct peer-to-merchant encryption</span>
                          </span>

                        </div>
                      ) : (
                        /* Clean Light-Themed Instant Settlement State with Transitions.dev Check */
                        <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center text-center space-y-2.5 animate-scale-up">
                          
                          {/* Transitions.dev Success Check Animation */}
                          <div className="t-success-check" data-state="in" aria-label="Payment successful">
                            <svg className="w-12 h-12 text-emerald-500" viewBox="0 0 48 48" fill="none">
                              <circle cx="24" cy="24" r="22" className="text-emerald-100 fill-emerald-50" stroke="#10B981" strokeWidth="2.5" />
                              <path d="M14 24L21 31L34 17" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              Instant Credit (T+0)
                            </span>
                            <p className="text-2xl font-black text-[#0D253D] tracking-tight font-sans">₹1,499.00</p>
                            <p className="text-[11px] text-slate-600 font-medium">Credited to HDFC Bank A/c ending ••4102</p>
                          </div>

                          {/* Paytm / PhonePe Style Soundbox Voice Chime */}
                          <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center gap-2.5 text-left">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                              <Volume2 className="w-3.5 h-3.5 animate-pulse" />
                            </div>
                            <div className="text-[11px] leading-tight text-slate-700">
                              <p className="font-bold text-slate-900">Soundbox Alert</p>
                              <p className="text-blue-700 font-semibold">&quot;₹1,499 received on UPI&quot;</p>
                            </div>
                          </div>

                          <div className="w-full pt-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-600 font-mono">
                            <span>Gateway Fee: <strong className="text-emerald-700 font-bold">₹0.00</strong></span>
                            <span>UTR: <strong className="text-slate-900">3291840291</strong></span>
                          </div>

                        </div>
                      )}

                      {/* Transitions.dev: Sliding Tabs (16-tabs-sliding.md) for UPI Apps */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <p className="text-[10px] text-slate-500 font-semibold text-center uppercase tracking-wider">Pay with any UPI app</p>
                        
                        <div className="t-tabs w-full relative p-1 bg-slate-100/90 rounded-xl flex items-center" role="tablist">
                          {/* Sliding Active Pill */}
                          <span 
                            className="t-tabs-pill"
                            style={{
                              width: 'calc(25% - 4px)',
                              transform: `translateX(${
                                selectedUpiApp === 'gpay' ? '2px' : 
                                selectedUpiApp === 'phonepe' ? 'calc(100% + 4px)' : 
                                selectedUpiApp === 'paytm' ? 'calc(200% + 6px)' : 
                                'calc(300% + 8px)'
                              })`
                            }}
                          />
                          
                          <button
                            onClick={() => setSelectedUpiApp('gpay')}
                            role="tab"
                            aria-selected={selectedUpiApp === 'gpay'}
                            className="t-tab w-1/4 text-center text-[11px] font-bold"
                          >
                            GPay
                          </button>
                          <button
                            onClick={() => setSelectedUpiApp('phonepe')}
                            role="tab"
                            aria-selected={selectedUpiApp === 'phonepe'}
                            className="t-tab w-1/4 text-center text-[11px] font-bold"
                          >
                            PhonePe
                          </button>
                          <button
                            onClick={() => setSelectedUpiApp('paytm')}
                            role="tab"
                            aria-selected={selectedUpiApp === 'paytm'}
                            className="t-tab w-1/4 text-center text-[11px] font-bold"
                          >
                            Paytm
                          </button>
                          <button
                            onClick={() => setSelectedUpiApp('bhim')}
                            role="tab"
                            aria-selected={selectedUpiApp === 'bhim'}
                            className="t-tab w-1/4 text-center text-[11px] font-bold"
                          >
                            BHIM
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* iOS Home Indicator Bar */}
                    <div className="pb-2">
                      <div className="w-28 h-1 bg-slate-300 rounded-full mx-auto" />
                    </div>

                  </div>

                </div>
              </div>

              {/* Satellite Metric Chip 2: Safely positioned at bottom-right without overlapping device */}
              <div className="self-end mt-3 hidden sm:inline-flex items-center gap-2.5 bg-white/95 backdrop-blur-md border border-slate-200/90 px-4 py-2 rounded-2xl shadow-sm animate-float delay-500 z-20">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <div className="text-left leading-tight">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Settlement Delay</p>
                  <p className="text-xs font-extrabold text-emerald-700">0.0s Direct Bank Credit</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. TRUST STRIP & SECURITY PILLARS (Clean Fintech Cards)
          ───────────────────────────────────────────────────────────── */}
      <section id="trust-pillars" className="py-14 bg-slate-50/60 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80">
              Institutional Grade Rails
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0D253D] tracking-tight">
              Why Indian merchants refuse 2% aggregator cuts
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 space-y-3 group">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-100">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">We never hold your funds</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Payments route straight from your customer&apos;s bank to your bank. No intermediary escrow pool, no sudden account freezes.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 space-y-3 group">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-100">
                <Percent className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">0% transaction commission</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Whether you collect ₹50,000 or ₹50,00,000, your payment fee stays completely flat. Keep 100% of your customer revenue.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 space-y-3 group">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform border border-indigo-100">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">T+0 instant settlement</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stop waiting 2 to 3 business days for aggregators to release your earnings. Funds credit directly into your bank within seconds.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 space-y-3 group">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform border border-amber-100">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Bank-grade security</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                End-to-end 256-bit encryption with cryptographically signed HMAC-SHA256 instant webhook reconciliation for your servers.
              </p>
            </div>

          </div>

          {/* Social Proof Metric Ticker */}
          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-wrap items-center justify-around gap-6 text-center text-xs font-medium text-slate-500">
            <div className="hover:scale-105 transition-transform">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#0D253D]">99.98%</span>
              <span className="text-slate-500">UPI Success Rate</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <div className="hover:scale-105 transition-transform">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#0D253D]">₹0</span>
              <span className="text-slate-500">Setup / Onboarding Fee</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <div className="hover:scale-105 transition-transform">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#0D253D]">&lt; 5 mins</span>
              <span className="text-slate-500">Account Setup Time</span>
            </div>
            <div className="hidden sm:block w-px h-8 bg-slate-200" />
            <div className="hover:scale-105 transition-transform">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#0D253D]">NPCI 2.0</span>
              <span className="text-slate-500">Direct Bank Rail</span>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. 3-STEP "HOW IT WORKS" ROW
          ───────────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80">
              Simple 3-Step Setup
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D253D] tracking-tight">
              Start collecting payments in 3 easy steps
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              No mountains of paperwork, no waiting 10 days for merchant approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-slate-50/60 rounded-2xl border border-slate-200 p-7 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 space-y-4 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-extrabold text-lg mb-6 group-hover:scale-110 transition-transform">
                  01
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Connect Your Bank UPI</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Sign up and link your existing UPI ID (VPA) from any bank (SBI, HDFC, ICICI, Axis, Kotak, etc.). No separate bank account required.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200/80 flex items-center gap-2 text-xs font-semibold text-blue-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Instant verification in 2 minutes</span>
              </div>
            </div>

            <div className="bg-slate-50/60 rounded-2xl border border-slate-200 p-7 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 space-y-4 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-extrabold text-lg mb-6 group-hover:scale-110 transition-transform">
                  02
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Create Links or Embed Checkout</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Generate instant payment links to share on WhatsApp or Instagram, or embed our 3-line JavaScript checkout onto your website or app.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200/80 flex items-center gap-2 text-xs font-semibold text-blue-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Works on WhatsApp, Web, and Mobile</span>
              </div>
            </div>

            <div className="bg-slate-50/60 rounded-2xl border border-slate-200 p-7 shadow-xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 space-y-4 flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700 flex items-center justify-center font-extrabold text-lg mb-6 group-hover:scale-110 transition-transform">
                  03
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Receive 100% Direct Credit</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  When a customer scans and pays, 100% of the funds land directly in your bank account immediately. Zero commission is ever deducted.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-200/80 flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>T+0 instant credit • ₹0 fee deducted</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. FEE COMPARISON & SAVINGS CALCULATOR (Wise-Style)
          ───────────────────────────────────────────────────────────── */}
      <section id="fee-comparison" className="py-20 sm:py-28 bg-slate-50/70 border-y border-slate-200 relative">
        <div id="pricing-section" className="absolute -top-24 left-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Interactive Cost Breakdown
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D253D] tracking-tight">
              See how much you save vs. Razorpay &amp; Cashfree
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Aggregators charge 2% + 18% GST on every sale. Slide your monthly volume to see your net savings.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm">
            <div className="space-y-8">
              
              {/* Billing Interval Toggle with double-bounce transitions (27-toggle.md) */}
              <div className="flex items-center justify-center gap-3 pt-1 pb-4">
                <button
                  type="button"
                  onClick={() => { setToggleInit(true); setIsAnnual(false); }}
                  className={`text-xs font-semibold cursor-pointer transition-colors ${!isAnnual ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Monthly (₹499/mo)
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isAnnual}
                  aria-label="Toggle annual billing discount"
                  onClick={() => {
                    setToggleInit(true);
                    setIsAnnual(prev => !prev);
                    setIsDigitAnimating(true);
                    setTimeout(() => setIsDigitAnimating(false), 450);
                  }}
                  className={`t-toggle ${toggleInit ? 'is-init' : ''} ${isAnnual ? 'is-checked' : ''}`}
                >
                  <span className="t-toggle-thumb" />
                </button>
                <button
                  type="button"
                  onClick={() => { setToggleInit(true); setIsAnnual(true); }}
                  className={`text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${isAnnual ? 'text-slate-900 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <span>Annual (₹399/mo)</span>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Save 20%
                  </span>
                </button>
              </div>

              {/* Slider Control with Transitions.dev Digit Pop-in (02-number-pop-in.md) */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                  <label htmlFor="volume-slider" className="text-sm font-semibold text-slate-700">
                    Your Estimated Monthly Collection:
                  </label>
                  <span className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-sans tracking-tight">
                    <span className={`t-digit-group ${isDigitAnimating ? 'is-animating' : ''}`}>
                      <span className="t-digit-pop">₹{(sliderVolume).toLocaleString('en-IN')}</span>
                    </span>
                    <span className="text-xs text-slate-500 font-normal ml-1.5">/ month</span>
                  </span>
                </div>

                <input 
                  id="volume-slider"
                  type="range"
                  min="50000"
                  max="2000000"
                  step="25000"
                  value={sliderVolume}
                  onChange={(e) => handleSliderChange(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  aria-label="Monthly collection volume slider"
                />

                <div className="flex justify-between text-xs text-slate-400 font-medium">
                  <span>₹50,000/mo</span>
                  <span>₹10,00,000/mo</span>
                  <span>₹20,00,000+/mo</span>
                </div>
              </div>

              {/* Side-by-Side Comparison Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                
                {/* Traditional Gateways Box */}
                <div className="bg-slate-50/60 border border-rose-200 rounded-2xl p-6 space-y-4 relative shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Traditional Aggregators</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">Razorpay / Cashfree / Stripe</p>
                    </div>
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-md border border-rose-200">
                      2.36% Total Cut
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                    <div className="flex justify-between">
                      <span>Per-Transaction Fee (2%):</span>
                      <span className="font-semibold text-slate-900 font-sans">₹{(sliderVolume * 0.02).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>18% GST on Fee:</span>
                      <span className="font-semibold text-slate-900 font-sans">₹{(sliderVolume * 0.02 * 0.18).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Settlement Delay:</span>
                      <span>T+2 / T+3 Days</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-rose-100 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-800">You Lose:</span>
                    <span className="text-xl font-extrabold text-rose-600 font-sans tracking-tight">
                      <span className={`t-digit-group ${isDigitAnimating ? 'is-animating' : ''}`}>
                        <span className="t-digit-pop">-₹{comparison.traditionalTotalCost.toLocaleString('en-IN')}</span>
                      </span>
                      <span className="text-xs text-slate-500 font-normal">/mo</span>
                    </span>
                  </div>
                </div>

                {/* MyMobPay Flat Fee Box */}
                <div className="bg-white border-2 border-emerald-500 rounded-2xl p-6 space-y-4 relative shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">MyMobPay Direct UPI</p>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">Flat Monthly License</p>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-200">
                      0% Commission
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span>Per-Transaction Fee:</span>
                      <span className="font-bold text-emerald-700 font-sans">₹0.00 (0%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Flat License Fee:</span>
                      <span className="font-semibold text-slate-900 font-sans">
                        ₹{comparison.myMobPayCost}.00 / month {isAnnual && <span className="text-[10px] text-emerald-600 font-bold">(Annual)</span>}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Settlement Delay:</span>
                      <span className="text-emerald-700 font-semibold">T+0 Instant</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-emerald-100 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-800">Fixed Cost:</span>
                    <span className="text-xl font-extrabold text-emerald-700 font-sans tracking-tight">
                      <span className={`t-digit-group ${isDigitAnimating ? 'is-animating' : ''}`}>
                        <span className="t-digit-pop">₹{comparison.myMobPayCost}</span>
                      </span>
                      <span className="text-xs text-slate-500 font-normal">/mo</span>
                    </span>
                  </div>
                </div>

              </div>

              {/* Net Annual Savings Callout */}
              <div className="bg-emerald-600 text-white rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1 text-center sm:text-left">
                  <p className="text-xs uppercase font-bold tracking-wider text-emerald-100">Your Net Annual Revenue Retained</p>
                  <p className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
                    <span className={`t-digit-group ${isDigitAnimating ? 'is-animating' : ''}`}>
                      <span className="t-digit-pop">+₹{comparison.annualSavings.toLocaleString('en-IN')}</span>
                    </span>
                    <span className="text-lg font-semibold text-emerald-100 ml-1">/ year</span>
                  </p>
                  <p className="text-xs text-emerald-100 font-normal">
                    Money staying directly in your bank account instead of paying gateway commissions.
                  </p>
                </div>
                <Link
                  href="/login?mode=signup"
                  className="px-6 py-3 bg-white hover:bg-emerald-50 text-emerald-800 text-sm font-bold rounded-xl shadow-xs transition-all shrink-0 hover:scale-105"
                >
                  Start Saving Now
                </Link>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. INTERACTIVE DEVELOPER SECTION (3-Line Embed Checkout)
          ───────────────────────────────────────────────────────────── */}
      <section id="developer-section" className="py-20 sm:py-28 bg-[#0B1528] text-white relative overflow-hidden">
        
        {/* Architectural Grid Background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
              Developer-First Simplicity
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Embed zero-fee UPI in under 3 lines of code
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Zero backend friction. Works smoothly in vanilla HTML, React, Next.js, or any backend webhook.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Terminal Header & Transitions.dev Sliding Tabs (16-tabs-sliding.md) */}
            <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2 hidden sm:inline">mymobpay-integration</span>
              </div>

              {/* Code Snippet Tabs */}
              <div className="t-tabs relative p-1 bg-slate-800/80 rounded-xl flex items-center" role="tablist">
                <span 
                  className="t-tabs-pill"
                  style={{
                    width: 'calc(33.33% - 4px)',
                    transform: `translateX(${
                      activeCodeTab === 'html' ? '2px' : 
                      activeCodeTab === 'react' ? 'calc(100% + 4px)' : 
                      'calc(200% + 6px)'
                    })`
                  }}
                />
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('html')}
                  className={`t-tab px-3 py-1 text-xs font-semibold ${activeCodeTab === 'html' ? 'text-slate-900' : 'text-slate-300'}`}
                >
                  HTML Script
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('react')}
                  className={`t-tab px-3 py-1 text-xs font-semibold ${activeCodeTab === 'react' ? 'text-slate-900' : 'text-slate-300'}`}
                >
                  React Hook
                </button>
                <button
                  type="button"
                  onClick={() => setActiveCodeTab('webhook')}
                  className={`t-tab px-3 py-1 text-xs font-semibold ${activeCodeTab === 'webhook' ? 'text-slate-900' : 'text-slate-300'}`}
                >
                  Node.js Webhook
                </button>
              </div>

              {/* Text Morph Copy Button with transitions-dev icon swap (09-icon-swap.md) */}
              <button
                type="button"
                onClick={() => copyEmbedCode(codeSnippets[activeCodeTab])}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-all cursor-pointer active:scale-95"
                title={copiedCode ? "Copied" : "Copy snippet"}
                aria-label={copiedCode ? "Code snippet copied" : "Copy code snippet"}
              >
                <span className="t-icon-swap" data-state={copiedCode ? 'b' : 'a'}>
                  <span className="t-icon" data-icon="a" aria-hidden={copiedCode}>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                  </span>
                  <span className="t-icon" data-icon="b" aria-hidden={!copiedCode}>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  </span>
                </span>
                <span className={copiedCode ? 'text-emerald-400 font-semibold' : ''}>
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </span>
              </button>
            </div>

            {/* Code Display Area */}
            <div className="p-6 overflow-x-auto font-mono text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#0F172A]">
              <pre className="selection:bg-blue-600/40">
                <code>{codeSnippets[activeCodeTab]}</code>
              </pre>
            </div>

            {/* Developer Trust Highlights */}
            <div className="bg-slate-950/60 px-6 py-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero client secrets exposed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>HMAC-SHA256 signature verification</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Sub-4KB lightweight bundle</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. MERCHANT FAQ SECTION (Transitions.dev Accordion - 21-accordion.md)
          ───────────────────────────────────────────────────────────── */}
      <section id="faq-section" className="py-20 sm:py-28 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200/80">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D253D] tracking-tight">
              Got questions? We have clear answers.
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Everything you need to know about 0% fees, direct bank settlement, and setup.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="t-acc bg-slate-50/60 border border-slate-200 rounded-2xl overflow-hidden transition-colors hover:border-slate-300"
                  data-open={isOpen ? 'true' : 'false'}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left font-bold text-slate-900 text-sm sm:text-base cursor-pointer select-none"
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <span className="t-acc-chevron shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </button>
                  
                  <div className="t-acc-panel">
                    <div className="t-acc-panel-inner">
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Learn More Support Link with Transitions.dev Hover (24-learn-more-hover.md) */}
          <div className="mt-10 text-center">
            <Link
              href="/contact"
              className="t-learn text-sm font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1.5"
            >
              <span>Have a custom question or high-volume inquiry? Talk with our engineering team</span>
              <span className="t-learn-chevron">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path className="t-learn-arm t-learn-arm-top" d="M6 4L10 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  <path className="t-learn-arm t-learn-arm-bot" d="M6 12L10 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
            </Link>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          8. FLOATING TOAST NOTIFICATION (Transitions.dev 22-toast.md)
          ───────────────────────────────────────────────────────────── */}
      <div
        role="alert"
        aria-live="polite"
        className={`t-toast fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] bg-white border border-emerald-300 rounded-2xl p-4 shadow-xl flex items-start gap-3.5 ${
          isToastOpen ? 'is-open' : ''
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">{toastData.title || 'Payment Verified'}</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">T+0</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{toastData.desc}</p>
          {toastData.utr && (
            <p className="text-[10px] font-mono text-slate-500 mt-1">UTR: {toastData.utr}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsToastOpen(false)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Optional Pre-Footer CTA */}
      {showFooterCTA && <HomeFooterCTA />}

    </div>
  );
}

export function HomeFooterCTA() {
  return (
    <section className="py-16 sm:py-24 bg-[#0B1528] text-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 sm:space-y-8 relative z-10">
        
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-400/30">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Join 5,000+ Indian Businesses</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Stop losing 2% on every customer payment.
        </h2>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Get instant UPI payments directly into your bank account with zero commission and instant onboarding.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link 
            href="/login?mode=signup" 
            className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group btn-shimmer"
          >
            <span>Get Started Free</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a 
            href="#fee-comparison"
            className="w-full sm:w-auto px-7 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-base font-semibold rounded-xl transition-all flex items-center justify-center"
          >
            <span>Compare Pricing</span>
          </a>
        </div>

        <p className="text-xs text-slate-400 pt-2">
          Instant 5-minute setup • Works with any Indian bank • Cancel anytime
        </p>

      </div>
    </section>
  );
}
