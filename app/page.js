'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { CONFIG } from '@/lib/config';
import { 
  ArrowRight, CheckCircle2, ChevronRight, Menu, X, 
  ArrowUpRight, ShieldCheck, Zap, Layers, RefreshCw, 
  Key, Landmark, Code, Play, Star, Plus, Minus, Info, Lock, Sparkles, QrCode,
  Copy, Check, Smartphone, Building2, Bell, Terminal, Globe,
  Pause, RotateCcw, CheckCircle, ExternalLink, Activity,
  Volume2, Share2, FileText, CreditCard, Send
} from 'lucide-react';
import QRCode from 'react-qr-code';
import InteractiveBackground from '@/components/InteractiveBackground';

const MyMobPayLogo = ({ className = 'w-48 h-auto', textColor = 'var(--text-primary)' }) => (
  <svg viewBox="0 0 220 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${className} transition-transform duration-300 hover:scale-[1.02]`}>
    {/* Dual-Color M Mark (Blue Left, Orange Right) */}
    <g transform="translate(4, 3)">
      <path
        d="M 7 28.5 V 13.5 C 7 7.5 12 5.5 16 8.5 L 19 19"
        stroke="#0284C7"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 19 19 L 22 8.5 C 26 5.5 31 7.5 31 13.5 V 28.5"
        stroke="#FF7800"
        strokeWidth="5.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <text
      x="46"
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

export default function HomePage() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [monthlyVolume, setMonthlyVolume] = useState(500000); // 5 Lakhs default
  const [productCategory, setProductCategory] = useState('gateway');
  const [productSubFilter, setProductSubFilter] = useState('top');
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPaymentsMenu, setShowPaymentsMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [heroTab, setHeroTab] = useState('checkout'); // 'checkout' | 'console'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');

  // Dynamic animated rotating text lines in Hero section
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

  useEffect(() => {
    const handleType = () => {
      const current = heroLines[lineIndex];
      if (isDeletingLine) {
        setTypedLine(current.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
        setTypingSpeed(45);
      } else {
        setTypedLine(current.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
        setTypingSpeed(95);
      }

      if (!isDeletingLine && charIndex === current.length) {
        setTypingSpeed(2200); // Pause on completed line
        setIsDeletingLine(true);
      } else if (isDeletingLine && charIndex === 0) {
        setIsDeletingLine(false);
        setLineIndex(prev => (prev + 1) % heroLines.length);
        setTypingSpeed(320); // Pause before next line
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [charIndex, isDeletingLine, lineIndex, typingSpeed, heroLines]);

  // Senior Developer Product Suite Showcase states
  const [productDevLang, setProductDevLang] = useState('curl'); // 'curl' | 'node' | 'python'
  const [productGatewaySimulated, setProductGatewaySimulated] = useState(false);
  const [copiedVanNumber, setCopiedVanNumber] = useState(false);
  const [copiedDevSnippet, setCopiedDevSnippet] = useState(false);

  // How It Works interactive showcase states
  const [howStep, setHowStep] = useState(0); // 0, 1, 2
  const [isHowAutoPlay, setIsHowAutoPlay] = useState(true);
  const [simState, setSimState] = useState('idle'); // 'idle' | 'processing' | 'settled'
  const [simSelectedApp, setSimSelectedApp] = useState('gpay');
  const [copiedSimLink, setCopiedSimLink] = useState(false);
  const [copiedWebhookPayload, setCopiedWebhookPayload] = useState(false);
  const [copiedProductLink, setCopiedProductLink] = useState(false);
  const [soundboxPlaying, setSoundboxPlaying] = useState(false);

  // How it works auto-play timer
  useEffect(() => {
    if (!isHowAutoPlay || simState === 'processing') return;
    const timer = setInterval(() => {
      setHowStep((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, [isHowAutoPlay, simState]);

  const handleSimulatePayment = () => {
    setIsHowAutoPlay(false);
    setSimState('processing');
    setHowStep(1);
    setTimeout(() => {
      setHowStep(2);
      setSimState('settled');
    }, 1800);
  };

  const handleResetSimulation = () => {
    setSimState('idle');
    setHowStep(0);
    setIsHowAutoPlay(true);
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 12) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Interactive Live Invoice demo states
  const [demoAmount, setDemoAmount] = useState('500');
  const [demoNote, setDemoNote] = useState('Payment_Note');

  const subscriptionFee = CONFIG.subscriptionFee || 499;

  // Pricing Savings Calculator
  const savings = useMemo(() => {
    const traditionalGatewayFee = monthlyVolume * 0.02; // 2% typical fee
    const traditionalAnnual = traditionalGatewayFee * 12;
    const mymobpayAnnual = subscriptionFee * 12;
    const monthlySavings = Math.max(0, traditionalGatewayFee - subscriptionFee);
    const annualSavings = Math.max(0, traditionalAnnual - mymobpayAnnual);

    return {
      traditionalFee: traditionalGatewayFee,
      mymobpayFee: subscriptionFee,
      monthly: monthlySavings,
      annual: annualSavings
    };
  }, [monthlyVolume, subscriptionFee]);

  const copyPaymentLink = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden selection:bg-blue-500/10 selection:text-blue-600 relative">
      <InteractiveBackground />
      
      {/* ────────────────────────────────────────────────────────
         ORIGINAL FULL-WIDTH STATIC HEADER WITH MULTI-LAYERED SHADOWS
         ──────────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white border-b border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.02),0_6px_20px_rgba(0,0,0,0.04)] transition-all">
        {/* ── TOP ANNOUNCEMENT BANNER (High Visibility Pure White on Blue) ── */}
        <div className="w-full bg-[#1d4ed8] text-white text-[11px] sm:text-xs font-medium py-2.5 px-4 flex items-center justify-center gap-2.5 select-none shadow-xs border-b border-blue-800">
          <span className="inline-flex items-center gap-1.5 bg-white text-blue-700 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] tracking-wide uppercase shadow-xs flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <span className="text-white font-medium truncate">
            Direct bank transfer (IMPS / NEFT) with <strong className="text-white font-black underline underline-offset-2">0% gateway fees</strong>.
          </span>
          <a href="#pricing-section" className="inline-flex items-center gap-1 text-white hover:text-blue-100 font-bold text-[11px] sm:text-xs transition-colors group ml-1 shrink-0 underline underline-offset-2">
            <span>Compare savings</span>
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </a>
        </div>

        <div className="w-full px-6 md:px-10 h-20 flex items-center justify-between relative">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 select-none group">
            <MyMobPayLogo className="w-48 h-auto" />
          </Link>

          {/* Navigation Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link 
              href="#how-it-works"
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              How It Works
            </Link>
            <Link 
              href="#developer-section"
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Developers
            </Link>
            <Link 
              href="#pricing-section"
              className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Pricing
            </Link>
            <Link href="/terms" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
              Privacy
            </Link>
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100/60 border border-slate-200 transition-all shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
            >
              Login
            </Link>
            <Link 
              href="/login"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all shadow-[0_4px_14px_rgba(37,99,235,0.25),0_8px_24px_rgba(37,99,235,0.15)] active:scale-98"
            >
              Sign Up Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile hamburger button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 bottom-0 top-20 z-40 bg-white flex flex-col pt-8 px-6 pb-8 animate-fadeIn border-t border-slate-100 shadow-[0_12px_32px_rgba(0,0,0,0.08),0_24px_64px_rgba(0,0,0,0.12)]">
          <div className="flex flex-col space-y-4">
            <button onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
            }} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span>How It Works</span> <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
            }} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span>Subscription Pricing</span> <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <button onClick={() => {
              setIsMobileMenuOpen(false);
              document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
            }} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span>Platform Features</span> <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
            <Link href="/terms" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span>Terms of Service</span> <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
            <Link href="/privacy" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100 font-bold text-slate-800 text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]">
              <span>Privacy Policy</span> <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>

          <div className="flex-1"></div>

          <div className="flex flex-col gap-3 pt-6 border-t border-slate-100">
            <Link 
              href="/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3.5 border border-slate-200 text-center font-bold text-slate-700 hover:text-slate-900 rounded-2xl transition-all text-sm shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
            >
              Sign In to Console
            </Link>
            <Link 
              href="/login" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-center font-bold rounded-2xl transition-all text-sm shadow-[0_4px_14px_rgba(37,99,235,0.25)]"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────
         HERO SECTION WITH PREMIUM CUSTOM GRAPHICS
         ──────────────────────────────────────────────────────── */}
      {/* ────────────────────────────────────────────────────────
         FLAGSHIP HERO SECTION (Razorpay-Grade Clean Light Fintech)
         ──────────────────────────────────────────────────────── */}
      <section className="relative mt-20 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden bg-white">
        
        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,#000_70%,transparent_100%)] opacity-50 -z-20" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Authoritative Fintech Headline & Reassuring Copy */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            
            {/* Direct P2P Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200/90 rounded-full text-xs font-semibold text-slate-700 shadow-xs animate-fade-up">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Direct UPI & bank transfer rails active · 0% MDR</span>
            </div>

            {/* Authoritative Headline with separate animated lines */}
            <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-bold text-slate-900 tracking-tight leading-[1.15]">
              <span className="block animate-fade-up delay-100">
                Accept payments directly
              </span>
              <span className="block animate-fade-up delay-200 mt-1">
                to your bank.
              </span>
              <span className="block text-blue-600 animate-fade-up delay-300 mt-1 min-h-[1.2em]">
                <span className="relative inline-block">
                  {typedLine}
                  <span className="inline-block w-[3px] h-[0.85em] bg-blue-600 ml-1.5 align-middle animate-pulse" style={{ verticalAlign: 'baseline', marginTop: '-2px' }}>|</span>
                </span>
              </span>
            </h1>

            {/* Calm, Reassuring Subhead */}
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed animate-fade-up delay-150">
              Collect direct UPI and IMPS bank transfers with automated real-time reconciliation, signed HMAC webhooks, and 0% intermediary deductions.
            </p>

            {/* Razorpay-Grade Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-up delay-200">
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-98 text-center text-sm flex items-center justify-center gap-2 group"
              >
                <span>Sign up now</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a 
                href="#how-it-works"
                className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-center flex items-center justify-center gap-2 text-sm shadow-xs hover:border-slate-300"
              >
                <span>Explore live checkout</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* Proof Stats Row */}
            <div className="pt-4 grid grid-cols-3 gap-4 sm:gap-8 max-w-md mx-auto lg:mx-0 border-t border-slate-200/80 text-slate-500 font-medium text-xs animate-fade-up delay-300">
              <div>
                <p className="text-slate-900 text-3xl font-bold tracking-tight">0%</p>
                <p className="mt-1 text-xs text-slate-500 font-normal">Transaction fees</p>
              </div>
              <div>
                <p className="text-slate-900 text-3xl font-bold tracking-tight">T+0</p>
                <p className="mt-1 text-xs text-slate-500 font-normal">Instant bank credit</p>
              </div>
              <div>
                <p className="text-slate-900 text-3xl font-bold tracking-tight">99.98%</p>
                <p className="mt-1 text-xs text-slate-500 font-normal">Success rate</p>
              </div>
            </div>

          </div>

          {/* Right Column Custom Render Mockup Graphic (Old Style Phone Scanner) */}
          <div className="lg:col-span-5 relative flex items-center justify-center lg:justify-end animate-scale-up">
            
            {/* Premium Interactive Phone Glow Container */}
            <div className="phone-glow-container w-full max-w-[340px]">

              {/* Premium Phone Frame displaying Actual MyMobPay checkout screen */}
              <div className="relative w-full bg-slate-900 border-8 border-slate-800 rounded-[44px] premium-phone-shadow overflow-hidden aspect-[9/18.5] flex flex-col">
              
              {/* Speaker / Camera Notch (Dynamic Island) */}
              <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-30">
                <div className="bg-slate-800 w-28 h-4 rounded-b-2xl" />
              </div>

              {/* Internal Screen Content */}
              <div className="flex-1 bg-[#0B192C] pt-8 px-5 pb-5 flex flex-col justify-between font-sans select-none text-white">
                
                {/* Header Info */}
                <div className="space-y-4">
                  
                  {/* Status Bar */}
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1">
                    <span>10:42 AM</span>
                    <div className="flex items-center gap-1">
                      <span>LTE</span>
                      <div className="w-4 h-2 border border-slate-350 rounded-sm p-0.5 flex items-center">
                        <div className="bg-slate-400 w-full h-full rounded-xs" />
                      </div>
                    </div>
                  </div>

                  {/* Logo */}
                  <div className="flex flex-col items-center justify-center pt-2">
                    <MyMobPayLogo className="w-36 h-auto" textColor="#FFFFFF" />
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide mt-1">Direct bank checkout</p>
                  </div>

                  {/* Due amount card */}
                  <div className="bg-[#0F1E36] border border-[#1D2D44] rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                      <span>Total due</span>
                      <span className="text-[#3395FF] font-semibold bg-[#0B2447] px-2 py-0.5 rounded text-[9px]">Direct bank rail</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-sm font-bold text-slate-400 mr-0.5">₹</span>
                      <span className="text-3xl font-bold text-white tracking-tight leading-none">
                        {parseFloat(demoAmount || '500').toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#1D2D44] flex justify-between text-[10px] font-medium text-slate-400">
                      <span>Paying to:</span>
                      <span className="font-semibold text-slate-200">Merchant Store</span>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="bg-white-pure border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col items-center justify-center space-y-3 relative overflow-hidden group">
                    
                    {/* Futuristic Scanning Laser line with glowing beam */}
                    <div className="absolute inset-x-0 top-0 pointer-events-none z-10 animate-laser">
                      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#3395FF] to-transparent shadow-[0_0_12px_2px_rgba(51,149,255,0.85)]" />
                      <div className="h-4 w-full bg-gradient-to-b from-[#3395FF]/15 to-transparent" />
                    </div>

                    {/* Subtle Top Indicator line */}
                    <div className="absolute inset-x-0 h-0.5 bg-slate-300 top-0" />

                    {/* Highly stylized SVG vector QR Code */}
                    <svg viewBox="0 0 100 100" className="w-32 h-32 text-slate-800" fill="currentColor">
                      {/* Quiet Zone borders */}
                      <path d="M0,0 h28 v8 h-20 v20 h-8 z M72,0 h28 v28 h-8 v-20 h-20 z M0,72 h8 v20 h-20 v-28 h8 z M72,100 h28 v-28 h-8 v20 h-20 z" fill="#00529B" opacity="0.15" />
                      
                      {/* Dynamic Modules - Grid mock points */}
                      <rect x="10" y="10" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="14" y="14" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="17" y="17" width="6" height="6" fill="#3B82F6" />

                      <rect x="70" y="10" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="74" y="14" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="77" y="17" width="6" height="6" fill="#3B82F6" />

                      <rect x="10" y="70" width="20" height="20" fill="#0F172A" rx="2" />
                      <rect x="14" y="74" width="12" height="12" fill="#FFFFFF" rx="1.5" />
                      <rect x="17" y="77" width="6" height="6" fill="#3B82F6" />

                      {/* Random mock QR dots */}
                      <path d="M40,10 h6 v6 h-6 z M50,15 h8 v4 h-8 z M45,25 h10 v4 h-10 z M35,35 h8 v8 h-8 z M55,35 h12 v4 h-12 z M35,50 h12 v4 h-12 z M50,50 h6 v6 h-6 z M10,40 h8 v8 h-8 z M25,45 h10 v4 h-10 z M70,40 h8 v6 h-8 z M82,45 h8 v4 h-8 z M70,55 h12 v4 h-12 z M10,55 h6 v6 h-6 z M80,70 h10 v8 h-10 z M80,85 h8 v8 h-8 z M40,70 h6 v10 h-6 z M52,75 h8 v4 h-8 z M45,85 h12 v4 h-12 z" fill="#0F172A" />
                      
                      {/* Custom Center Logo */}
                      <rect x="40" y="40" width="20" height="20" fill="#3B82F6" rx="4" />
                      <text x="50" y="54" fontFamily="'Orbitron', sans-serif" fontWeight="950" fontSize="14" fill="#FFFFFF" textAnchor="middle">M</text>
                    </svg>

                    <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Auto-verify active
                    </span>

                  </div>

                </div>

                {/* Footer Section */}
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  
                  {/* Universal UPI Indicators */}
                  <div className="space-y-2">
                    <p className="text-[9px] text-slate-400 font-medium text-center">Scan with any UPI app</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      <span className="bg-[#0F1E36] border border-[#1D2D44] text-blue-400 text-[8px] font-semibold py-1 px-1 rounded-lg text-center">UPI QR</span>
                      <span className="bg-[#0F1E36] border border-[#1D2D44] text-emerald-400 text-[8px] font-semibold py-1 px-1 rounded-lg text-center">Direct pay</span>
                      <span className="bg-[#0F1E36] border border-[#1D2D44] text-indigo-400 text-[8px] font-semibold py-1 px-1 rounded-lg text-center">Instant rail</span>
                      <span className="bg-[#0F1E36] border border-[#1D2D44] text-sky-400 text-[8px] font-semibold py-1 px-1 rounded-lg text-center">Auto-match</span>
                    </div>
                  </div>

                  {/* Security copy */}
                  <div className="flex items-center justify-center gap-1.5 text-[9px] font-medium text-slate-400 text-center">
                    <Lock className="w-3 h-3 text-slate-400" /> Secure checkout by MyMobPay
                  </div>

                </div>

              </div>

            </div>

            </div> {/* closes phone-glow-container */}

            {/* Metric float chips */}
            <div className="absolute -left-6 top-1/4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl flex flex-col gap-1 -rotate-6 animate-float">
              <span className="text-[10px] font-semibold text-blue-600 leading-none">Platform average</span>
              <span className="text-[10px] font-medium text-slate-500 leading-none mt-0.5">Success rate</span>
              <span className="text-xl font-bold text-slate-900 leading-none mt-1">99.98%</span>
            </div>

            <div className="absolute -right-6 bottom-1/4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xl flex flex-col gap-1 rotate-6 animate-float delay-500">
              <span className="text-[10px] font-semibold text-blue-600 leading-none">Real-time routing</span>
              <span className="text-[10px] font-medium text-slate-500 leading-none mt-0.5">Settlement</span>
              <span className="text-xl font-bold text-emerald-600 leading-none mt-1">0 seconds</span>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         TRUSTED BY FOUNDERS & STARTUPS TICKER (Razorpay-Style)
         ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-10 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-5">
          <p className="text-xs font-semibold text-slate-500 tracking-wide">
            Powering 10,000+ modern founders, developers, and fast-growing businesses across India
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
            {/* Startup Brand 1: KwickBill */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base tracking-tight select-none">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black">K</div>
              <span>KwickBill</span>
            </div>
            {/* Startup Brand 2: ScaleLoop */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base tracking-tight select-none">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">S</div>
              <span>ScaleLoop</span>
            </div>
            {/* Startup Brand 3: DevStack */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base tracking-tight select-none">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">D</div>
              <span>DevStack</span>
            </div>
            {/* Startup Brand 4: NexaCart */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base tracking-tight select-none">
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center text-xs font-black">N</div>
              <span>NexaCart</span>
            </div>
            {/* Startup Brand 5: IndieFlow */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base tracking-tight select-none">
              <div className="w-7 h-7 rounded-lg bg-cyan-600 text-white flex items-center justify-center text-xs font-black">I</div>
              <span>IndieFlow</span>
            </div>
            {/* Startup Brand 6: ZetaPay */}
            <div className="flex items-center gap-2 text-slate-700 font-bold text-sm sm:text-base tracking-tight select-none">
              <div className="w-7 h-7 rounded-lg bg-violet-600 text-white flex items-center justify-center text-xs font-black">Z</div>
              <span>ZetaPay</span>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         CODED DASHBOARD SHOWCASE (Clean Light Theme)
         ──────────────────────────────────────────────────────── */}
      <section className="hidden lg:block relative z-10 py-24 bg-transparent border-y border-slate-200/60 overflow-hidden">

        <div className="max-w-7xl mx-auto px-6 space-y-14">
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full inline-block">
              Merchant console
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Full visibility into payments and settlements
            </h2>
            <p className="text-base text-slate-600 font-normal leading-relaxed max-w-lg mx-auto">
              Monitor real-time payments, webhook delivery logs, and bank reconciliations from a single console.
            </p>
          </div>

          {/* === CODED DASHBOARD MOCKUP (LIGHT THEME) === */}
          <div className="relative">

            {/* Browser frame */}
            <div className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-[0_24px_70px_rgba(15,23,42,0.08)]">

              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/90 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 mx-2">
                  <div className="bg-white border border-slate-200 rounded-md px-3 py-1 flex items-center gap-2 max-w-xs mx-auto shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[11px] text-slate-600 font-mono">dashboard.mymobpay.com</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-emerald-700 font-semibold">Live</span>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="flex min-h-[480px]">

                {/* Sidebar */}
                <div className="hidden md:flex w-[180px] bg-slate-50 border-r border-slate-200 flex-col py-6 px-3 gap-1 flex-shrink-0">
                  <div className="px-3 pb-4">
                    <MyMobPayLogo className="w-28 h-auto" textColor="#0F172A" />
                  </div>
                  {[
                    { label: 'Dashboard', active: true, dot: 'bg-blue-500' },
                    { label: 'Orders', active: false, dot: null },
                    { label: 'Analytics', active: false, dot: null },
                    { label: 'Settlements', active: false, dot: null },
                    { label: 'Webhooks', active: false, dot: 'bg-amber-400' },
                    { label: 'API Keys', active: false, dot: null },
                    { label: 'Sandbox', active: false, dot: null },
                  ].map(item => (
                    <div key={item.label} className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                      item.active
                        ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}>
                      <span>{item.label}</span>
                      {item.dot && <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />}
                    </div>
                  ))}
                </div>

                {/* Main panel */}
                <div className="flex-1 p-5 sm:p-6 space-y-5 bg-white overflow-hidden">

                  {/* Top stat cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { label: 'Total revenue', value: '₹4,82,500', change: '+12.4%', color: 'text-emerald-700', bg: 'bg-slate-50 border-slate-200' },
                      { label: 'Transactions', value: '1,842', change: '+8.1%', color: 'text-blue-700', bg: 'bg-slate-50 border-slate-200' },
                      { label: 'Success rate', value: '99.98%', change: '+0.02%', color: 'text-emerald-700', bg: 'bg-slate-50 border-slate-200' },
                      { label: 'Avg. settlement', value: '0.0s', change: 'Real-time', color: 'text-indigo-700', bg: 'bg-slate-50 border-slate-200' },
                    ].map(stat => (
                      <div key={stat.label} className={`${stat.bg} border rounded-xl p-3.5 space-y-1 shadow-xs hover:border-slate-300 transition-all`}>
                        <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
                        <p className="text-base sm:text-lg font-bold text-slate-900">{stat.value}</p>
                        <p className={`text-[10px] font-medium ${stat.color}`}>{stat.change}</p>
                      </div>
                    ))}
                  </div>

                  {/* Chart + Recent Transactions */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Chart */}
                    <div className="lg:col-span-2 bg-slate-50/60 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-900">Revenue (last 30 days)</p>
                        <span className="text-[9px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded font-semibold">Live</span>
                      </div>
                      {/* SVG Sparkline chart */}
                      <svg viewBox="0 0 400 80" className="w-full h-20" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Area fill */}
                        <path d="M0,65 C20,60 40,50 60,45 C80,40 100,55 120,48 C140,41 160,30 180,25 C200,20 220,35 240,28 C260,21 280,15 300,18 C320,21 340,10 360,8 C380,6 400,12 400,12 L400,80 L0,80 Z" fill="url(#chartGrad)" />
                        {/* Line */}
                        <path d="M0,65 C20,60 40,50 60,45 C80,40 100,55 120,48 C140,41 160,30 180,25 C200,20 220,35 240,28 C260,21 280,15 300,18 C320,21 340,10 360,8 C380,6 400,12 400,12" fill="none" stroke="#2563EB" strokeWidth="2.5" />
                        {/* Grid lines */}
                        {[20, 40, 60].map(y => (
                          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#E2E8F0" strokeWidth="0.75" strokeDasharray="4" />
                        ))}
                        {/* Dot on peak */}
                        <circle cx="360" cy="8" r="4" fill="#2563EB" />
                        <circle cx="360" cy="8" r="8" fill="#2563EB" opacity="0.25" />
                      </svg>
                      <div className="flex justify-between text-[8px] text-slate-400 font-medium">
                        {['Aug 1','Aug 7','Aug 14','Aug 21','Aug 26'].map(d => <span key={d}>{d}</span>)}
                      </div>
                    </div>

                    {/* Recent transactions */}
                    <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
                      <p className="text-xs font-semibold text-slate-900">Recent payments</p>
                      <div className="space-y-2">
                        {[
                          { id: '#MP0891', upi: 'raj@okaxis', amt: '₹4,500', status: 'Success' },
                          { id: '#MP0890', upi: 'sara@ybl', amt: '₹1,200', status: 'Success' },
                          { id: '#MP0889', upi: 'dev@paytm', amt: '₹800', status: 'Pending' },
                          { id: '#MP0888', upi: 'mia@upi', amt: '₹12,000', status: 'Success' },
                        ].map(tx => (
                          <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-slate-200/60 last:border-0">
                            <div>
                              <p className="text-[10px] font-semibold text-blue-600">{tx.id}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{tx.upi}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-semibold text-slate-900">{tx.amt}</p>
                              <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded ${
                                tx.status === 'Success'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>{tx.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Bottom metric chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Uptime SLA', value: '99.99%', icon: <ShieldCheck className="w-4 h-4" />, iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
              { label: 'Webhook latency', value: '<200ms', icon: <Zap className="w-4 h-4" />, iconBg: 'bg-blue-50 text-blue-600 border-blue-200' },
              { label: 'Avg. settlement', value: '0 sec', icon: <RefreshCw className="w-4 h-4" />, iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
            ].map(m => (
              <div key={m.label} className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-3.5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all">
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${m.iconBg}`}>
                  {m.icon}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-normal">{m.label}</p>
                  <p className="text-lg font-bold text-slate-900">{m.value}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         HOW IT WORKS — DIRECT SETTLEMENT ARCHITECTURE (MINIMAL)
         ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="hidden lg:block relative z-10 py-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 space-y-14 relative">
          
          {/* Section Header */}
          <div className="text-center space-y-3.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-900"></span>
              <span className="text-[11px] font-semibold text-slate-700 tracking-wide uppercase">
                Direct Settlement Pipeline
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              How direct bank payments work in three steps
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
              Eliminate middleman escrow pools and 2% deductions. Money moves directly across NPCI rails into your bank account with instantaneous webhook verification.
            </p>

            {/* Step Switcher Pills */}
            <div className="pt-2 flex items-center justify-center gap-2">
              <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200">
                {[
                  { step: 0, label: '1. Scan & Intent' },
                  { step: 1, label: '2. Direct Rail' },
                  { step: 2, label: '3. Instant Credit' },
                ].map((item) => (
                  <button
                    key={item.step}
                    onClick={() => {
                      setHowStep(item.step);
                      setIsHowAutoPlay(false);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-md transition-all ${
                      howStep === item.step
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 font-medium'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Dual-Pane Experience */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

            {/* Left Column: Interactive Stepper Cards (5 Cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3.5">

              {/* STEP 1 SELECTOR */}
              <div
                onClick={() => {
                  setHowStep(0);
                  setIsHowAutoPlay(false);
                }}
                className={`cursor-pointer rounded-xl p-5 sm:p-6 transition-all border text-left group ${
                  howStep === 0
                    ? 'bg-blue-50/20 border-2 border-blue-600 shadow-sm'
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg font-mono text-xs font-bold flex items-center justify-center transition-colors ${
                      howStep === 0
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      01
                    </span>
                    <div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                        howStep === 0 ? 'text-blue-600' : 'text-slate-500'
                      }`}>
                        Scan or Tap Intent
                      </span>
                      <h3 className="text-base font-semibold text-slate-900 leading-snug">
                        Customer scans dynamic QR or taps intent
                      </h3>
                    </div>
                  </div>
                  {howStep === 0 && (
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded flex-shrink-0">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                  Generates an order-locked dynamic UPI QR and direct deep-links compatible with GPay, PhonePe, Paytm, BHIM, and Cred. Also supports direct zero-fee virtual IMPS for large ticket B2B.
                </p>

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Settlement: <strong className="text-slate-800">Instant (0s)</strong></span>
                  <span className="text-slate-900 font-semibold flex items-center gap-1">
                    0% gateway commission <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  </span>
                </div>
              </div>

              {/* STEP 2 SELECTOR */}
              <div
                onClick={() => {
                  setHowStep(1);
                  setIsHowAutoPlay(false);
                }}
                className={`cursor-pointer rounded-xl p-5 sm:p-6 transition-all border text-left group ${
                  howStep === 1
                    ? 'bg-blue-50/20 border-2 border-blue-600 shadow-sm'
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg font-mono text-xs font-bold flex items-center justify-center transition-colors ${
                      howStep === 1
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      02
                    </span>
                    <div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                        howStep === 1 ? 'text-blue-600' : 'text-slate-500'
                      }`}>
                        Direct Rail Routing
                      </span>
                      <h3 className="text-base font-semibold text-slate-900 leading-snug">
                        Zero-intermediary account routing
                      </h3>
                    </div>
                  </div>
                  {howStep === 1 && (
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded flex-shrink-0">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                  Transactions execute directly through the NPCI UPI rail switch straight into your own merchant bank current account. Funds never enter a 3rd-party escrow holding pool.
                </p>

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Intermediaries: <strong className="text-blue-600 font-bold">Zero</strong></span>
                  <span className="text-slate-900 font-semibold flex items-center gap-1">
                    Direct bank ownership <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  </span>
                </div>
              </div>

              {/* STEP 3 SELECTOR */}
              <div
                onClick={() => {
                  setHowStep(2);
                  setIsHowAutoPlay(false);
                }}
                className={`cursor-pointer rounded-xl p-5 sm:p-6 transition-all border text-left group ${
                  howStep === 2
                    ? 'bg-blue-50/20 border-2 border-blue-600 shadow-sm'
                    : 'bg-white border border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg font-mono text-xs font-bold flex items-center justify-center transition-colors ${
                      howStep === 2
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      03
                    </span>
                    <div>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${
                        howStep === 2 ? 'text-blue-600' : 'text-slate-500'
                      }`}>
                        Reconcile &amp; Webhook
                      </span>
                      <h3 className="text-base font-semibold text-slate-900 leading-snug">
                        Instant credit &amp; automated webhook
                      </h3>
                    </div>
                  </div>
                  {howStep === 2 && (
                    <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded flex-shrink-0">
                      Active
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 mt-2.5 leading-relaxed">
                  Real-time bank statement &amp; SMS parsers match the unique 12-digit UPI UTR. Your server receives an HMAC-SHA256 signed webhook in under 200ms to fulfill the order.
                </p>

                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Escrow hold: <strong className="text-blue-600 font-bold">0 days</strong></span>
                  <span className="text-slate-900 font-semibold flex items-center gap-1">
                    Webhook in &lt;200ms <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  </span>
                </div>
              </div>

            </div>

            {/* Right Column: High-Fidelity Minimal Playground (7 Cols) */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 flex flex-col flex-1 overflow-hidden min-h-[560px]">

                {/* Window Chrome Header Bar with Real Mac Control Colors */}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-950 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-xs font-mono text-slate-300 pl-2 hidden sm:inline">
                      settlement-engine // v2.4
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-mono text-slate-200 uppercase tracking-wider font-semibold">
                      {howStep === 0 && 'Step 1: Intent & QR Checkout'}
                      {howStep === 1 && 'Step 2: Direct NPCI Rail'}
                      {howStep === 2 && 'Step 3: Webhook Verification'}
                    </span>
                  </div>
                </div>

                {/* Canvas Interior Container */}
                <div className="p-5 sm:p-7 flex-1 flex flex-col justify-center">

                  {/* ── STAGE 0: CHECKOUT & SCAN DEMO (CLEAN PROFESSIONAL BIG UPI QR) ── */}
                  {howStep === 0 && (
                    <div className="w-full">
                      <div className="max-w-[400px] sm:max-w-[420px] mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
                        
                        {/* Demo Checkout Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xs shadow-sm">
                              MP
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-white flex items-center gap-1">
                                Acme Retail Ltd <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">#INV-8492 · 0% Gateway Fee</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-medium">Amount Due</span>
                            <span className="text-lg font-bold text-white font-mono tracking-tight">₹2,499.00</span>
                          </div>
                        </div>

                        {/* Professional Big UPI QR Stand */}
                        <div className="bg-white rounded-2xl p-5 shadow-md border border-slate-200/80 flex flex-col items-center">
                          {/* QR Header Banner */}
                          <div className="w-full flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 text-[10px]">
                            <span className="font-extrabold tracking-wider text-slate-800 uppercase flex items-center gap-1.5 font-mono">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              BHARAT UPI QR
                            </span>
                            <span className="font-mono text-slate-500 font-semibold">acmestore@icici</span>
                          </div>

                          {/* Crisp Big QR Code with Center Dual-Color M Logo */}
                          <div className="relative p-2.5 bg-white rounded-xl">
                            <QRCode
                              value="upi://pay?pa=acmestore@icici&pn=AcmeRetail&am=2499.00&cu=INR&tn=INV8492"
                              size={195}
                              level="H"
                              fgColor="#090d16"
                              bgColor="#FFFFFF"
                            />
                            {/* Centered Branded Badge with Blue & Orange M Logo */}
                            <div className="absolute inset-0 m-auto w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center border border-slate-100 p-1 pointer-events-none">
                              <svg width="24" height="22" viewBox="0 0 38 34" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M 7 28.5 V 13.5 C 7 7.5 12 5.5 16 8.5 L 19 19" stroke="#0284C7" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M 19 19 L 22 8.5 C 26 5.5 31 7.5 31 13.5 V 28.5" stroke="#FF7800" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          </div>

                          {/* QR Footer Details */}
                          <div className="w-full mt-3 pt-2.5 border-t border-slate-100 flex flex-col items-center gap-1 text-center">
                            <p className="text-xs font-bold text-slate-900 tracking-tight">
                              Scan &amp; Pay ₹2,499.00 with Any UPI App
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              Instant settlement directly into your ICICI Current Account
                            </p>
                          </div>
                        </div>

                        {/* Trust & Settlement Summary */}
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                          <div className="flex items-center gap-2 text-slate-300">
                            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span className="text-[11px] font-medium">Direct Bank-to-Bank · No Escrow</span>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded">
                            0% Fee
                          </span>
                        </div>

                        {/* Interactive Simulate Button - Solid Brand Blue */}
                        <button
                          onClick={handleSimulatePayment}
                          disabled={simState === 'processing'}
                          className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          {simState === 'processing' ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-white" />
                              <span>Authorizing Direct Transfer...</span>
                            </>
                          ) : (
                            <>
                              <span>Simulate Customer Payment (₹2,499)</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ── STAGE 1: DIRECT NPCI RAIL ROUTING (HIGH CONTRAST & CRISP) ── */}
                  {howStep === 1 && (
                    <div className="space-y-4">
                      
                      {/* Rail Callout Banner */}
                      <div className="p-3 rounded-lg bg-slate-800/90 border border-slate-700 flex items-center justify-between text-xs font-mono text-slate-200">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-blue-400" />
                          <span className="text-blue-300 font-semibold">RAIL: NPCI UPI DIRECT SWITCH (0% TOLL)</span>
                        </div>
                        <span className="text-emerald-400 font-bold bg-emerald-950/90 border border-emerald-700/80 px-2 py-0.5 rounded text-[10px] tracking-wider">
                          ACTIVE
                        </span>
                      </div>

                      {/* 2-Node Architecture Pipeline */}
                      <div className="space-y-3">
                        
                        {/* Node 1: Customer Bank */}
                        <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                              <Smartphone className="w-4 h-4 text-blue-400" />
                            </div>
                            <div>
                              <p className="text-[11px] text-slate-400 font-medium">Customer Source Account</p>
                              <p className="text-xs font-semibold text-white">HDFC Bank UPI (rahul@okaxis)</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono text-rose-400 font-bold">-₹2,499.00</span>
                            <p className="text-[10px] text-slate-400">Debited instantly</p>
                          </div>
                        </div>

                        {/* Direct Transit Arrow */}
                        <div className="flex items-center justify-center gap-2 text-xs font-mono text-blue-400 uppercase tracking-wider py-1 font-semibold">
                          <span>↓ DIRECT RAIL TRANSIT · ₹0.00 DEDUCTION ↓</span>
                        </div>

                        {/* Node 2: Merchant Destination Account */}
                        <div className="p-3.5 rounded-xl bg-slate-800 border-2 border-emerald-500/60 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                              <Landmark className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-[11px] text-emerald-300 font-medium">Your Merchant Current Account</p>
                              <p className="text-xs font-semibold text-white">ICICI Bank Current A/c (...4092)</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-mono text-emerald-400 font-bold">+₹2,499.00</span>
                            <p className="text-[10px] text-emerald-300 font-medium">100% Retained (0% Commission)</p>
                          </div>
                        </div>

                      </div>

                      {/* Bypassed Gateway Escrow Strip */}
                      <div className="p-2.5 rounded-lg bg-slate-800/60 border border-rose-500/30 flex items-center justify-between text-xs text-slate-300">
                        <span className="line-through text-slate-400">Traditional Gateway Escrow Pool (T+2 Hold)</span>
                        <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded">
                          BYPASSED &amp; ELIMINATED
                        </span>
                      </div>

                      {/* Advance Button - Solid Brand Blue */}
                      <button
                        onClick={() => {
                          setHowStep(2);
                          setIsHowAutoPlay(false);
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <span>View Instant Webhook Dispatch &amp; Bank Settlement</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>

                    </div>
                  )}

                  {/* ── STAGE 2: INSTANT CREDIT & WEBHOOK TERMINAL (CRISP & CLEAR) ── */}
                  {howStep === 2 && (
                    <div className="space-y-3.5">
                      
                      {/* Top Simulated Bank Credit Push Alert */}
                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400">
                          <Landmark className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-400">ICICI Bank Direct Credit Alert</span>
                            <span className="text-[10px] font-mono text-slate-400">Just Now</span>
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed font-sans">
                            INR <strong className="text-emerald-400">2,499.00</strong> CREDITED to Current A/c ...4092 on 23-Sep-26 via UPI Ref <strong className="text-white font-mono">426819204910</strong>.
                          </p>
                        </div>
                      </div>

                      {/* Developer Webhook Event Terminal */}
                      <div className="bg-slate-950 rounded-xl border border-slate-800 p-3.5 font-mono text-xs space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <Terminal className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-blue-300 font-semibold text-[11px]">
                              POST /api/webhooks/mymobpay
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded">
                            200 OK • 142ms
                          </span>
                        </div>

                        {/* JSON Payload Display with Syntax Colors */}
                        <div className="text-[11px] leading-relaxed overflow-x-auto text-slate-300 space-y-0.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                          <p className="text-slate-500">{'// HMAC-SHA256 Signature Verified'}</p>
                          <p><span className="text-slate-400">&#123;</span></p>
                          <p className="pl-4"><span className="text-blue-400">&quot;event&quot;</span>: <span className="text-emerald-300">&quot;payment.settled&quot;</span>,</p>
                          <p className="pl-4"><span className="text-blue-400">&quot;order_id&quot;</span>: <span className="text-emerald-300">&quot;INV-8492&quot;</span>,</p>
                          <p className="pl-4"><span className="text-blue-400">&quot;amount&quot;</span>: <span className="text-amber-300 font-semibold">2499.00</span>,</p>
                          <p className="pl-4"><span className="text-blue-400">&quot;gateway_fee&quot;</span>: <span className="text-emerald-400 font-semibold">0.00</span>,</p>
                          <p className="pl-4"><span className="text-blue-400">&quot;utr&quot;</span>: <span className="text-emerald-300">&quot;426819204910&quot;</span>,</p>
                          <p className="pl-4"><span className="text-blue-400">&quot;settlement_type&quot;</span>: <span className="text-emerald-300">&quot;DIRECT_BANK_ACCOUNT&quot;</span></p>
                          <p><span className="text-slate-400">&#125;</span></p>
                        </div>

                        {/* Terminal Control Actions */}
                        <div className="flex items-center justify-between pt-1 text-[11px]">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify({
                                event: "payment.settled",
                                order_id: "INV-8492",
                                amount: 2499.00,
                                gateway_fee: 0.00,
                                utr: "426819204910",
                                settlement_type: "DIRECT_BANK_ACCOUNT"
                              }, null, 2));
                              setCopiedWebhookPayload(true);
                              setTimeout(() => setCopiedWebhookPayload(false), 2000);
                            }}
                            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                          >
                            {copiedWebhookPayload ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy payload</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleResetSimulation}
                            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restart demo</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )}

                </div>

              </div>
            </div>

          </div>

          {/* ── ARCHITECTURAL COMPARISON (MINIMAL, NO GRADIENTS) ── */}
          <div className="pt-4">
            <div className="text-center mb-8 space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Architectural Breakdown
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Why merchants are replacing traditional aggregators
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
              
              {/* Traditional Payment Aggregators - Styled with Red Accents */}
              <div className="bg-white border-2 border-rose-200/90 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-600">
                        Traditional Gateways
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900">Aggregator Escrow Rail</h4>
                    </div>
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
                      2.0% Fee · T+2 Hold
                    </span>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">✕</span>
                      <span><strong className="text-rose-950 font-bold">2% + 18% GST deducted</strong> on every single order (loss of ₹20,000 on ₹10L monthly volume).</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">✕</span>
                      <span><strong className="text-rose-950 font-bold">48-hour escrow delay (T+2)</strong> before funds are disbursed into your bank account.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">✕</span>
                      <span><strong className="text-rose-950 font-bold">Rolling reserve risk</strong> and sudden risk department account payout freezes.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">✕</span>
                      <span><strong className="text-rose-950 font-bold">Payout withdrawal fee</strong> charged each time you withdraw your own earned money.</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-rose-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Settlement timeline:</span>
                  <span className="text-rose-600 font-bold text-sm">2 to 3 Business Days</span>
                </div>
              </div>

              {/* MyMobPay Direct Settlement - With Blue Line Border */}
              <div className="bg-white border-2 border-blue-600 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
                        MyMobPay Direct Rail
                      </span>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900">Direct Account Settlement</h4>
                    </div>
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                      0% Commission · Instant 0s
                    </span>
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span><strong>0% Transaction Commission</strong> — You keep 100% of customer payments directly.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Instant 0-Second Settlement</strong> — Funds land directly in your merchant bank current account.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Zero Escrow Risk</strong> — No middleman holds your money; you maintain 100% custody.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span><strong>&lt;200ms Signed Webhooks</strong> — Automated statement parsing triggers instant fulfillment.</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600">Settlement timeline:</span>
                  <span className="text-blue-600 font-bold text-sm">0 Seconds (Instant Liquidity)</span>
                </div>
              </div>

            </div>

            {/* Bottom Savings Badge Ribbon */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center text-slate-800 flex-shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900">
                    Keep your profit margins where they belong.
                  </p>
                  <p className="text-xs text-slate-500">
                    Indian merchants save an average of ₹1,20,000 annually per ₹50L GMV using MyMobPay.
                  </p>
                </div>
              </div>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold whitespace-nowrap transition-colors"
              >
                Start Direct Settlement ➔
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         DISRUPTION & INNOVATION SHOWCASE (RAZORPAY STYLE)
         ──────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 bg-transparent border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 space-y-12">
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight max-w-3xl leading-[1.15]">
            Eliminate gateway intermediaries and retain your full revenue.
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Card: Wide 8 cols */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm">
              <div>
                <div className="flex items-center justify-between pb-6">
                  <span className="text-xs sm:text-sm font-semibold text-slate-600 tracking-tight">
                    Direct bank settlement rail
                  </span>
                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 bg-slate-50 shadow-xs">
                    <Globe className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 leading-snug tracking-tight my-4 sm:my-8">
                  <span className="text-blue-600">Route payments directly to your bank account,</span> saving on intermediary transaction fees with instant UPI and IMPS transfers.
                </h3>
              </div>
              <p className="text-xs sm:text-sm font-normal text-slate-500 pt-4 border-t border-slate-100 leading-relaxed">
                Receive direct account transfers with zero escrow delays via automated bank email reconciliation.
              </p>
            </div>

            {/* Right Card: 4 cols */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 flex flex-col justify-between hover:border-slate-300 transition-all shadow-sm">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-relaxed">
                  <span className="text-blue-600">Experience instant settlements</span> with 99.98% reliability, zero escrow holding periods, and no percentage-based gateway deductions.
                </h3>
                <div className="my-8 sm:my-12 flex justify-end">
                  <Link 
                    href="/login"
                    className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all shadow-md shadow-blue-500/20 group"
                  >
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-normal text-slate-500 pt-4 border-t border-slate-100 leading-relaxed">
                A dependable direct payment solution engineered for fast-moving Indian businesses.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         DEVELOPER SECTION (SENIOR DEV FINISH & BRAND BLUE THEME)
         ──────────────────────────────────────────────────────── */}
      <section id="developer-section" className="hidden lg:block relative z-10 bg-[#080E1C] text-white border-y border-slate-800/80 overflow-hidden">
        
        {/* FULL-WIDTH BRAND BLUE MARQUEE TICKER (ACTUAL SITE LANGUAGES) */}
        <div className="w-full bg-[#1D4ED8] py-3.5 sm:py-4 overflow-hidden border-b border-[#1E40AF] select-none shadow-inner">
          <div className="animate-marquee-left flex items-center whitespace-nowrap text-sm sm:text-base font-black text-white uppercase tracking-widest">
            {[
              'NEXT.JS', 'REACT', 'NODE.JS', 'TYPESCRIPT', 'REST API', 'PYTHON', 'PHP', 'FLUTTER', 'REACT NATIVE', 'JAVASCRIPT',
              'NEXT.JS', 'REACT', 'NODE.JS', 'TYPESCRIPT', 'REST API', 'PYTHON', 'PHP', 'FLUTTER', 'REACT NATIVE', 'JAVASCRIPT',
              'NEXT.JS', 'REACT', 'NODE.JS', 'TYPESCRIPT', 'REST API', 'PYTHON', 'PHP', 'FLUTTER', 'REACT NATIVE', 'JAVASCRIPT'
            ].map((item, index) => (
              <span key={index} className="flex items-center">
                <span className="mx-4 sm:mx-6 font-extrabold">{item}</span>
                <span className="text-blue-200 text-base font-black">•</span>
              </span>
            ))}
          </div>
        </div>

        {/* MAIN DEVELOPER HERO CONTENT */}
        <div className="max-w-6xl mx-auto px-6 py-20 sm:py-24 space-y-16">
          
          {/* Senior Developer Headline with Brand Blue Accents */}
          <div className="space-y-5 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-xs font-mono font-bold tracking-wide">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>DEVELOPER-FIRST ARCHITECTURE</span>
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight">
              MyMobPay is built<br />
              <span className="text-[#3B82F6] font-extrabold">&lt;for developers by developers&gt;</span>
            </h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal pt-1 max-w-2xl">
              Integrate direct-to-bank settlements in under 15 minutes. Eliminate the 2% aggregator cut with typed SDKs, deterministic REST endpoints, and signed HMAC webhooks.
            </p>
          </div>

          {/* 3 Core Architecture Cards: SDKs, REST APIs, Webhooks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Card 1: SDKs & Libraries */}
            <div className="p-6 rounded-2xl bg-[#0B1528] border border-blue-900/30 hover:border-blue-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <svg width="25" height="28" viewBox="0 0 25 28" fill="none" className="w-6 h-6 text-blue-400">
                  <path d="M8.13325 15.3333L10.0666 13.4C10.3333 13.1333 10.4613 12.8222 10.4506 12.4666C10.4399 12.1111 10.3119 11.8 10.0666 11.5333C9.79992 11.2666 9.48303 11.1275 9.11592 11.116C8.74881 11.1044 8.43236 11.2324 8.16659 11.5L5.26659 14.4C4.99992 14.6666 4.86659 14.9777 4.86659 15.3333C4.86659 15.6888 4.99992 16 5.26659 16.2666L8.16659 19.1666C8.43325 19.4333 8.75014 19.5613 9.11725 19.5506C9.48436 19.54 9.80081 19.4008 10.0666 19.1333C10.311 18.8666 10.439 18.5555 10.4506 18.2C10.4621 17.8444 10.3341 17.5333 10.0666 17.2666L8.13325 15.3333ZM16.5332 15.3333L14.5999 17.2666C14.3332 17.5333 14.2052 17.8444 14.2159 18.2C14.2266 18.5555 14.3546 18.8666 14.5999 19.1333C14.8666 19.4 15.1835 19.5386 15.5506 19.5493C15.9177 19.56 16.2341 19.4324 16.4999 19.1666L19.3999 16.2666C19.6666 16 19.7999 15.6888 19.7999 15.3333C19.7999 14.9777 19.6666 14.6666 19.3999 14.4L16.4999 11.5C16.2332 11.2333 15.9164 11.1053 15.5492 11.116C15.1821 11.1266 14.8657 11.2657 14.5999 11.5333C14.3555 11.8 14.2279 12.1111 14.2173 12.4666C14.2066 12.8222 14.3341 13.1333 14.5999 13.4L16.5332 15.3333ZM2.99992 27.3333C2.26659 27.3333 1.63859 27.072 1.11592 26.5493C0.593254 26.0266 0.332365 25.3991 0.333254 24.6666V5.99996C0.333254 5.26663 0.594588 4.63863 1.11725 4.11596C1.63992 3.59329 2.26748 3.3324 2.99992 3.33329H8.59992C8.88881 2.53329 9.37236 1.88885 10.0506 1.39996C10.7288 0.91107 11.4897 0.666626 12.3333 0.666626C13.1777 0.666626 13.939 0.91107 14.6173 1.39996C15.2955 1.88885 15.7786 2.53329 16.0666 3.33329H21.6666C22.3999 3.33329 23.0279 3.59463 23.5506 4.11729C24.0732 4.63996 24.3341 5.26751 24.3332 5.99996V24.6666C24.3332 25.4 24.0719 26.028 23.5492 26.5506C23.0266 27.0733 22.399 27.3342 21.6666 27.3333H2.99992ZM2.99992 24.6666H21.6666V5.99996H2.99992V24.6666ZM12.3333 4.99996C12.6221 4.99996 12.8608 4.90529 13.0492 4.71596C13.2377 4.52663 13.3324 4.28796 13.3333 3.99996C13.3333 3.71107 13.2386 3.4724 13.0492 3.28396C12.8599 3.09551 12.6213 3.00085 12.3333 2.99996C12.0444 2.99996 11.8057 3.09463 11.6173 3.28396C11.4288 3.47329 11.3341 3.71196 11.3333 3.99996C11.3333 4.28885 11.4279 4.52751 11.6173 4.71596C11.8066 4.9044 12.0453 4.99907 12.3333 4.99996Z" fill="currentColor" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">SDKs & Libraries</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-normal">
                Official typed libraries for Next.js, Node.js, Python, PHP, Flutter, and React Native with end-to-end type safety.
              </p>
              <Link 
                href="/login" 
                className="text-sm font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 pt-1 transition-colors"
              >
                <span>Explore SDKs</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Card 2: REST APIs */}
            <div className="p-6 rounded-2xl bg-[#0B1528] border border-blue-900/30 hover:border-blue-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <svg width="25" height="23" viewBox="0 0 25 23" fill="none" className="w-6 h-6 text-blue-400">
                  <path d="M 2.835 13.147 C 2.048 13.639 1.404 14.329 0.966 15.147 C 0.527 15.965 0.31 16.883 0.335 17.811 C 0.36 18.738 0.627 19.643 1.109 20.436 C 1.591 21.229 2.272 21.883 3.084 22.332 C 3.895 22.782 4.811 23.011 5.739 22.999 C 6.666 22.986 7.575 22.732 8.374 22.261 C 9.174 21.79 9.837 21.118 10.297 20.312 C 10.757 19.507 11 18.595 11 17.667 L 19 17.667 M 16.421 22.336 C 17.134 22.729 17.927 22.954 18.739 22.994 C 19.552 23.033 20.363 22.886 21.11 22.564 C 21.857 22.242 22.521 21.753 23.05 21.135 C 23.579 20.517 23.96 19.786 24.163 18.998 C 24.366 18.21 24.386 17.386 24.222 16.589 C 24.057 15.792 23.713 15.044 23.215 14.4 C 22.716 13.757 22.078 13.237 21.347 12.878 C 20.616 12.52 19.814 12.334 19 12.333 C 18.059 12.333 17.101 12.572 16.333 13 L 12.333 5.667 M 17.667 5.667 C 17.667 4.252 17.105 2.896 16.104 1.895 C 15.104 0.895 13.748 0.333 12.333 0.333 C 10.919 0.333 9.562 0.895 8.562 1.895 C 7.562 2.896 7 4.252 7 5.667 C 7 7.675 8.027 9.424 9.667 10.333 L 5.667 17.667" fill="transparent" strokeWidth="2.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">RESTful Endpoints</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-normal">
                Deterministic, idempotent HTTP APIs for order creation, dynamic QR generation, and real-time status verification.
              </p>
              <Link 
                href="/login" 
                className="text-sm font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 pt-1 transition-colors"
              >
                <span>API Reference</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Card 3: Webhooks */}
            <div className="p-6 rounded-2xl bg-[#0B1528] border border-blue-900/30 hover:border-blue-500/50 transition-all duration-300 space-y-4 group">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                <svg width="29" height="30" viewBox="-1 -1 29 30" fill="none" className="w-6 h-6 text-blue-400">
                  <path fillRule="evenodd" clipRule="evenodd" d="M26.2761 1.05715C26.7968 1.57785 26.7968 2.42207 26.2761 2.94277L23.7906 5.42832C24.74 6.87844 24.8996 8.46316 24.6933 9.8247C24.447 11.4504 23.665 12.8873 22.9428 13.6094L20.9428 15.6094C20.4221 16.1301 19.5779 16.1301 19.0572 15.6094L11.7239 8.2761C11.2032 7.7554 11.2032 6.91118 11.7239 6.39048L13.7239 4.39048C14.446 3.66833 15.8829 2.88633 17.5086 2.64001C18.8701 2.43371 20.4549 2.5933 21.905 3.5427L24.3905 1.05715C24.9112 0.536451 25.7554 0.536451 26.2761 1.05715ZM17.9081 5.27658C16.7838 5.44692 15.8873 5.99826 15.6095 6.2761L14.5523 7.33329L20 12.781L21.0572 11.7238C21.335 11.446 21.8864 10.5495 22.0567 9.42522C22.2165 8.37083 22.027 7.24592 21.0572 6.2761C20.0874 5.30628 18.9625 5.11682 17.9081 5.27658ZM11.6095 11.0572C12.1302 11.5778 12.1302 12.4221 11.6095 12.9428L9.88562 14.6666L12.6667 17.4477L14.3905 15.7238C14.9112 15.2031 15.7554 15.2031 16.2761 15.7238C16.7968 16.2445 16.7968 17.0887 16.2761 17.6094L14.5523 19.3333L14.9428 19.7238C15.4635 20.2445 15.4635 21.0887 14.9428 21.6094L12.9428 23.6094C12.2207 24.3316 10.7838 25.1136 9.15807 25.3599C7.79654 25.5662 6.21182 25.4066 4.7617 24.4572L2.27614 26.9428C1.75544 27.4635 0.911223 27.4635 0.390524 26.9428C-0.130175 26.4221 -0.130175 25.5779 0.390524 25.0571L2.87608 22.5716C1.92667 21.1215 1.76709 19.5368 1.97338 18.1752C2.2197 16.5495 3.0017 15.1126 3.72386 14.3905L5.72386 12.3905C6.24456 11.8698 7.08878 11.8698 7.60948 12.3905L8 12.781L9.72386 11.0572C10.2446 10.5365 11.0888 10.5365 11.6095 11.0572ZM6.66667 15.2189L5.60948 16.2761C5.33163 16.5539 4.7803 17.4504 4.60995 18.5747C4.4502 19.6291 4.63965 20.754 5.60948 21.7238C6.5793 22.6936 7.70421 22.8831 8.75859 22.7233C9.88286 22.553 10.7793 22.0017 11.0572 21.7238L12.1144 20.6666L6.66667 15.2189Z" fill="currentColor" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Real-time Webhooks</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-normal">
                Cryptographically signed HMAC-SHA256 event notifications dispatched straight to your server with automated retries.
              </p>
              <Link 
                href="/login" 
                className="text-sm font-bold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1.5 pt-1 transition-colors"
              >
                <span>Webhook Guide</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

          </div>

          {/* Interactive Developer Code Sandbox ("Try it out for yourself") */}
          <div className="space-y-4">
            
            {/* Header & Language Selectors */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Try it out for yourself</h3>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-400">
                  Live API
                </span>
              </div>

              {/* Language Switcher Tabs (Languages Actually Used & Supported) */}
              <div className="flex items-center gap-1 bg-[#060D1A] p-1 rounded-xl border border-blue-900/40 text-xs font-mono">
                {[
                  { id: 'curl', label: 'cURL' },
                  { id: 'node', label: 'Node.js' },
                  { id: 'nextjs', label: 'Next.js / React' },
                  { id: 'python', label: 'Python' },
                  { id: 'php', label: 'PHP' }
                ].map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setProductDevLang(lang.id)}
                    className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
                      productDevLang === lang.id 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Terminal Chassis */}
            <div className="bg-[#060D1A] rounded-2xl overflow-hidden border border-blue-900/40 shadow-2xl">
              
              {/* Terminal Top Bar */}
              <div className="bg-[#040812] px-5 py-3.5 flex items-center justify-between border-b border-blue-900/30">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="w-3 h-3 rounded-full bg-blue-500/80 inline-block"></span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 ml-2">
                    {productDevLang === 'curl' && 'request.sh'}
                    {productDevLang === 'node' && 'server.js'}
                    {productDevLang === 'nextjs' && 'app/api/checkout/route.ts'}
                    {productDevLang === 'python' && 'app.py'}
                    {productDevLang === 'php' && 'checkout.php'}
                  </span>
                </div>

                <button 
                  onClick={() => {
                    setCopiedDevSnippet(true);
                    setTimeout(() => setCopiedDevSnippet(false), 2000);
                  }}
                  className="flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white px-3 py-1 rounded-lg bg-blue-950/40 border border-blue-800/40 transition-colors"
                >
                  {copiedDevSnippet ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-blue-400 font-semibold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Syntax-Highlighted Code Body */}
              <div className="p-6 font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto bg-[#060D1A] text-slate-200 min-h-[230px]">
                {productDevLang === 'curl' && (
                  <pre className="text-slate-200">
                    <span className="text-blue-400 font-bold">curl</span> -X POST https://api.mymobpay.tech/v1/orders \<br />
                    {"  "}-H <span className="text-cyan-300">&quot;Authorization: Bearer sec_live_948a201...&quot;</span> \<br />
                    {"  "}-H <span className="text-cyan-300">&quot;Content-Type: application/json&quot;</span> \<br />
                    {"  "}-d <span className="text-slate-400">&#39;&#123;</span><br />
                    {"    "}<span className="text-sky-300">&quot;amount&quot;</span>: <span className="text-amber-300">149900</span>,<br />
                    {"    "}<span className="text-sky-300">&quot;currency&quot;</span>: <span className="text-cyan-300">&quot;INR&quot;</span>,<br />
                    {"    "}<span className="text-sky-300">&quot;orderId&quot;</span>: <span className="text-cyan-300">&quot;ORD_2026_9821&quot;</span>,<br />
                    {"    "}<span className="text-sky-300">&quot;customerVpa&quot;</span>: <span className="text-cyan-300">&quot;customer@okhdfcbank&quot;</span>,<br />
                    {"    "}<span className="text-sky-300">&quot;settlementRoute&quot;</span>: <span className="text-cyan-300">&quot;direct_bank&quot;</span><br />
                    {"  "}<span className="text-slate-400">&#125;&#39;</span>
                  </pre>
                )}

                {productDevLang === 'node' && (
                  <pre className="text-slate-200">
                    <span className="text-blue-400 font-bold">import</span> &#123; <span className="text-sky-300">MyMobPay</span> &#125; <span className="text-blue-400 font-bold">from</span> <span className="text-cyan-300">&#39;@mymobpay/node&#39;</span>;<br /><br />
                    <span className="text-blue-400 font-bold">const</span> client = <span className="text-blue-400 font-bold">new</span> <span className="text-sky-300">MyMobPay</span>(&#123; apiKey: process.env.<span className="text-amber-300">MYMOBPAY_SECRET_KEY</span> &#125;);<br /><br />
                    <span className="text-slate-500 italic">{"//"} Initialize 0% commission direct bank order</span><br />
                    <span className="text-blue-400 font-bold">const</span> order = <span className="text-blue-400 font-bold">await</span> client.orders.<span className="text-sky-300">create</span>(&#123;<br />
                    {"  "}amount: <span className="text-amber-300">149900</span>, <span className="text-slate-500 italic">{"//"} ₹1,499.00 in paise</span><br />
                    {"  "}orderId: <span className="text-cyan-300">&#39;ORD_2026_9821&#39;</span>,<br />
                    {"  "}customerVpa: <span className="text-cyan-300">&#39;customer@okhdfcbank&#39;</span>,<br />
                    {"  "}settlementRoute: <span className="text-cyan-300">&#39;direct_bank&#39;</span><br />
                    &#125;);
                  </pre>
                )}

                {productDevLang === 'nextjs' && (
                  <pre className="text-slate-200">
                    <span className="text-slate-500 italic">{"//"} Next.js App Router API Route (app/api/checkout/route.ts)</span><br />
                    <span className="text-blue-400 font-bold">import</span> &#123; <span className="text-sky-300">NextResponse</span> &#125; <span className="text-blue-400 font-bold">from</span> <span className="text-cyan-300">&#39;next/server&#39;</span>;<br />
                    <span className="text-blue-400 font-bold">import</span> &#123; <span className="text-sky-300">MyMobPay</span> &#125; <span className="text-blue-400 font-bold">from</span> <span className="text-cyan-300">&#39;@mymobpay/node&#39;</span>;<br /><br />
                    <span className="text-blue-400 font-bold">const</span> gateway = <span className="text-blue-400 font-bold">new</span> <span className="text-sky-300">MyMobPay</span>(&#123; apiKey: process.env.<span className="text-amber-300">MYMOBPAY_SECRET_KEY</span> &#125;);<br /><br />
                    <span className="text-blue-400 font-bold">export async function</span> <span className="text-sky-300">POST</span>(req: <span className="text-sky-300">Request</span>) &#123;<br />
                    {"  "}<span className="text-blue-400 font-bold">const</span> &#123; amount, orderId &#125; = <span className="text-blue-400 font-bold">await</span> req.<span className="text-sky-300">json</span>();<br />
                    {"  "}<span className="text-blue-400 font-bold">const</span> session = <span className="text-blue-400 font-bold">await</span> gateway.orders.<span className="text-sky-300">create</span>(&#123; amount, orderId &#125;);<br />
                    {"  "}<span className="text-blue-400 font-bold">return</span> <span className="text-sky-300">NextResponse</span>.<span className="text-sky-300">json</span>(&#123; qrString: session.qrString, intentUrl: session.intentUrl &#125;);<br />
                    &#125;
                  </pre>
                )}

                {productDevLang === 'python' && (
                  <pre className="text-slate-200">
                    <span className="text-blue-400 font-bold">import</span> os<br />
                    <span className="text-blue-400 font-bold">from</span> mymobpay <span className="text-blue-400 font-bold">import</span> <span className="text-sky-300">MyMobPay</span><br /><br />
                    client = <span className="text-sky-300">MyMobPay</span>(api_key=os.environ[<span className="text-cyan-300">&quot;MYMOBPAY_SECRET_KEY&quot;</span>])<br /><br />
                    <span className="text-slate-500 italic"># Create direct UPI intent order</span><br />
                    order = client.orders.<span className="text-sky-300">create</span>(<br />
                    {"  "}amount=<span className="text-amber-300">149900</span>,<br />
                    {"  "}order_id=<span className="text-cyan-300">&quot;ORD_2026_9821&quot;</span>,<br />
                    {"  "}customer_vpa=<span className="text-cyan-300">&quot;customer@okhdfcbank&quot;</span>,<br />
                    {"  "}settlement_route=<span className="text-cyan-300">&quot;direct_bank&quot;</span><br />
                    )
                  </pre>
                )}

                {productDevLang === 'php' && (
                  <pre className="text-slate-200">
                    <span className="text-blue-400 font-bold">&lt;?php</span><br />
                    <span className="text-blue-400 font-bold">use</span> MyMobPay\<span className="text-sky-300">Client</span>;<br /><br />
                    $client = <span className="text-blue-400 font-bold">new</span> <span className="text-sky-300">Client</span>([<span className="text-cyan-300">&#39;api_key&#39;</span> =&gt; getenv(<span className="text-cyan-300">&#39;MYMOBPAY_SECRET_KEY&#39;</span>)]);<br /><br />
                    <span className="text-slate-500 italic">{"//"} Create payment intent with zero fees</span><br />
                    $order = $client-&gt;orders-&gt;<span className="text-sky-300">create</span>([<br />
                    {"  "}<span className="text-cyan-300">&#39;amount&#39;</span> =&gt; <span className="text-amber-300">149900</span>,<br />
                    {"  "}<span className="text-cyan-300">&#39;order_id&#39;</span> =&gt; <span className="text-cyan-300">&#39;ORD_2026_9821&#39;</span>,<br />
                    {"  "}<span className="text-cyan-300">&#39;customer_vpa&#39;</span> =&gt; <span className="text-cyan-300">&#39;customer@okhdfcbank&#39;</span>,<br />
                    {"  "}<span className="text-cyan-300">&#39;settlement_route&#39;</span> =&gt; <span className="text-cyan-300">&#39;direct_bank&#39;</span><br />
                    ]);
                  </pre>
                )}
              </div>

              {/* Live Webhook Event Dispatch Panel */}
              <div className="bg-[#040812] p-4 sm:p-5 border-t border-blue-900/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-blue-400 flex items-center gap-2 font-bold">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    POST /api/webhooks/settlement • 200 OK
                  </span>
                  <span className="text-slate-400 font-medium">42ms latency</span>
                </div>
                <div className="text-xs font-mono text-slate-300 bg-[#07101E] p-3 rounded-xl border border-blue-900/30">
                  <div className="text-slate-400 text-[11px] pb-1.5 border-b border-blue-900/40 flex justify-between">
                    <span>Header: x-mymobpay-signature: <strong className="text-blue-300">sha256=9f8a4e81...</strong></span>
                    <span className="text-blue-400 font-semibold">HMAC Verified ✓</span>
                  </div>
                  <div className="text-slate-200 pt-2">
                    &#123; event: &quot;payment.settled&quot;, utr: &quot;329184029182&quot;, net: 1499.00, fee: 0.00, route: &quot;direct_bank&quot; &#125;
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         INTERACTIVE SAVINGS SLIDER CALCULATOR
         ──────────────────────────────────────────────────────── */}
      <section id="pricing-section" className="hidden lg:block relative z-10 py-24 bg-transparent border-b border-slate-200/60">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full inline-block">
              Cost comparison
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Stop losing 2% on transaction volumes
            </h2>
            <p className="text-base text-slate-600 font-normal leading-relaxed max-w-md mx-auto">
              Calculate how much your business saves each year with flat subscription pricing.
            </p>
          </div>

          {/* Interactive Calculator Slider Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
            
            {/* Slider Section */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">

              {/* Slider header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Monthly sales volume</p>
                  <h3 className="text-3xl font-bold text-slate-900 mt-1 flex items-baseline">
                    <span className="text-lg font-semibold text-slate-400 mr-0.5">₹</span>
                    {monthlyVolume.toLocaleString('en-IN')}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMonthlyVolume(prev => Math.max(10000, prev - 100000))}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                    title="Decrease volume"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMonthlyVolume(prev => Math.min(5000000, prev + 100000))}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-all"
                    title="Increase volume"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Range Slider */}
              <div className="space-y-2">
                <input
                  type="range"
                  min="10000"
                  max="5000000"
                  step="50000"
                  value={monthlyVolume}
                  onChange={e => setMonthlyVolume(parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-medium">
                  <span>₹10K</span>
                  <span>₹25L</span>
                  <span>₹50L</span>
                </div>
              </div>

            </div>

            {/* Split Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Traditional Gateway */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between h-[130px]">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Traditional gateways (2%)</p>
                  <h4 className="text-2xl font-bold text-red-600 mt-2">
                    ₹{savings.traditionalFee.toLocaleString('en-IN')} <span className="text-xs font-normal text-slate-400">/ mo</span>
                  </h4>
                </div>
                <p className="text-xs text-slate-500 font-normal">Losing ₹{(savings.traditionalFee * 12).toLocaleString('en-IN')} annually in transaction cuts.</p>
              </div>

              {/* MyMobPay */}
              <div className="bg-blue-50/40 border border-blue-200/80 rounded-2xl p-5 flex flex-col justify-between h-[130px]">
                <div>
                  <p className="text-xs font-semibold text-blue-600">MyMobPay subscription</p>
                  <h4 className="text-2xl font-bold text-blue-700 mt-2">
                    ₹{savings.mymobpayFee.toLocaleString('en-IN')} <span className="text-xs font-normal text-blue-400">/ mo</span>
                  </h4>
                </div>
                <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" /> Flat SaaS subscription with zero transaction cuts.
                </p>
              </div>

            </div>

            {/* Savings Callout Display */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <p className="text-xs font-semibold text-emerald-800">Guaranteed annual savings</p>
                <p className="text-xs text-emerald-600 font-normal">Keep 100% of your transaction revenue directly inside your bank.</p>
              </div>
              <div className="text-center sm:text-right">
                <h4 className="text-3xl font-bold text-emerald-600">
                  ₹{savings.annual.toLocaleString('en-IN')}
                </h4>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">Retained net profit per year</p>
              </div>
            </div>

            {/* Savings Formula Breakdown */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[10px] font-semibold text-blue-600">i</span>
                <span className="font-semibold text-slate-700">Formula breakdown:</span>
              </div>
              <div className="font-mono text-xs text-slate-600 bg-white border border-slate-200/60 px-3 py-1.5 rounded-xl text-center sm:text-left">
                (₹{monthlyVolume.toLocaleString('en-IN')} × 2% × 12) − (₹{subscriptionFee.toLocaleString('en-IN')} × 12) = <span className="font-bold text-emerald-600">₹{savings.annual.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Direct Settlement MDR Protection Banner */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Direct settlement 0% MDR guarantee
                  </h4>
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    0% MDR guaranteed
                  </span>
                </div>
                <p className="text-xs text-slate-600 font-normal leading-relaxed">
                  While traditional payment gateways take <strong>2% to 2.36%</strong> on every transaction, MyMobPay keeps your profits intact. 
                  All UPI payments under ₹2,000 remain at <strong>0% MDR</strong>, and higher order values route directly through automated <strong>Direct Bank Transfer (IMPS / NEFT)</strong> with zero transaction fees.
                </p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         SEE MYMOBPAY IN ACTION — HUMAN & MERCHANT SHOWCASE
         ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-transparent border-b border-slate-200/60 overflow-hidden relative">

        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          {/* Header */}
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full inline-block">
              Merchant stories
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
              See MyMobPay in action
            </h2>
            <p className="text-base text-slate-600 font-normal max-w-xl mx-auto leading-relaxed">
              Trusted by SaaS founders, indie developers, and growing businesses across India.
            </p>
          </div>

          {/* 3 Visual In-Action Showcase Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Card 1: Scanning MyMobPay QR */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                  <Image 
                    src="/images/using_mymobpay_scan.jpg" 
                    alt="Customer scanning MyMobPay QR code on tablet" 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-blue-400" />
                    <span>Instant QR checkout</span>
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">Seamless scan and pay</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    Customers scan dynamic QR codes using any UPI application with immediate payment confirmation.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Payment rail: UPI</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  Instant verification <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 2: Merchant using Dashboard */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                  <Image 
                    src="/images/using_mymobpay_merchant.jpg" 
                    alt="Founder using MyMobPay merchant dashboard on laptop" 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Merchant console</span>
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">Real-time revenue analytics</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    Track incoming transfers, inspect webhook dispatches, and audit reconciliations in real time.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Escrow hold: 0 days</span>
                <span className="text-blue-600 font-medium flex items-center gap-1">
                  Direct account route <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* Card 3: In-Person Customer Success */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col justify-between">
              <div>
                <div className="relative h-60 w-full overflow-hidden bg-slate-100">
                  <Image 
                    src="/images/merchant_customer.jpg" 
                    alt="Happy customer and business owner completing payment" 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Customer experience</span>
                  </div>
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">Frictionless checkout</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    Deliver high checkout conversion rates with direct bank-to-bank settlement reliability.
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Universal UPI support</span>
                <span className="text-emerald-600 font-medium flex items-center gap-1">
                  99.98% success rate <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         CORE TECHNICAL FEATURE GRID
         ──────────────────────────────────────────────────────── */}
      <section id="features-section" className="py-24 bg-transparent border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          <div className="text-center space-y-3">
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200/80 px-3 py-1 rounded-full inline-block">
              Platform features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
              Direct infrastructure and secure verifications
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-slate-300 transition-all hover:shadow-md duration-200 group">
              <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Direct bank routing</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Customer payments transfer directly to your designated bank account without escrow holding.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-slate-300 transition-all hover:shadow-md duration-200 group">
              <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">HMAC SHA-256 webhooks</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Every transaction event callback is cryptographically signed using standard HMAC SHA-256.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-slate-300 transition-all hover:shadow-md duration-200 group">
              <div className="w-10 h-10 rounded-xl bg-violet-500 text-white flex items-center justify-center shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Isolated developer sandbox</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Test checkout redirection flows and webhook dispatches in an isolated sandbox environment.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 hover:border-slate-300 transition-all hover:shadow-md duration-200 group">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-900 text-base">Instant settlements</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-normal">
                Maintain working capital liquidity with real-time settlement directly to your account.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         PRICING SUBSCRIPTION CALLOUT
         ──────────────────────────────────────────────────────── */}
      <section className="py-24 bg-transparent relative overflow-hidden">

        <div className="max-w-6xl mx-auto px-6 text-center space-y-12">
          
          <div className="space-y-3">
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full inline-block">
              Subscription plans
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
              Simple, flat pricing for any scale
            </h2>
            <p className="text-base text-slate-600 max-w-lg mx-auto leading-relaxed font-normal">
              Start integration testing for free, scale to live payments with our standard subscription, or inquire about custom high-volume deployments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch text-left">
            
            {/* Developer Sandbox Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-8 flex flex-col justify-between shadow-xs hover:border-slate-300 transition-all">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Sandbox environment</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">Developer free</h3>
                  <p className="text-xs text-slate-500 font-normal mt-1.5 leading-relaxed">Perfect for prototyping, testing API signatures, and staging your UI callback dispatches.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-semibold text-slate-400 mr-0.5">₹</span>
                  <span className="text-4xl font-bold text-slate-900">0</span>
                  <span className="text-xs font-normal text-slate-400 ml-1">/ month</span>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-3.5 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Isolated sandbox testing API key</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Interactive dynamic checkout screen</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Automated webhook event delivery stream</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Live order status verification logs</p>
                </div>
              </div>
              <Link 
                href="/login" 
                className="mt-8 block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all text-center text-xs"
              >
                Launch sandbox console
              </Link>
            </div>

            {/* Standard Plan (Highlighted) */}
            <div className="bg-white border-2 border-blue-600 rounded-3xl p-8 flex flex-col justify-between shadow-md relative hover:shadow-lg transition-all scale-[1.02]">
              <div className="absolute top-0 right-6 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-semibold tracking-wider px-3 py-1 rounded-full shadow-xs">
                Most popular
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">Standard plan</h3>
                  <p className="text-xs text-slate-500 font-normal mt-1.5 leading-relaxed">For active SaaS founders and builders who want to stop giving away 2% on transaction cuts.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-2xl font-semibold text-slate-400 mr-0.5">₹</span>
                  <span className="text-4xl font-bold text-slate-900">{subscriptionFee}</span>
                  <span className="text-xs font-normal text-slate-400 ml-1">/ month</span>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-3.5 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 100% direct-to-bank UPI transfers</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> 0% transaction gateway fees</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> HMAC SHA-256 signed webhooks</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Automated bank email reconciliation</p>
                </div>
              </div>
              <Link 
                href="/login" 
                className="mt-8 block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all shadow-sm shadow-blue-500/20 text-center text-xs"
              >
                Get started now
              </Link>
            </div>

            {/* Pro/Enterprise Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-300 transition-all shadow-xs">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-semibold text-slate-500">Enterprise scale</span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">Enterprise pro</h3>
                  <p className="text-xs text-slate-500 font-normal mt-1.5 leading-relaxed">For high-throughput organizations needing custom webhook routing architectures.</p>
                </div>
                <div className="flex items-baseline">
                  <span className="text-xl font-bold text-slate-900">Custom volume</span>
                </div>
                <div className="border-t border-slate-200/80 pt-6 space-y-3.5 text-xs text-slate-600 font-medium">
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" /> Dedicated secure matching worker instances</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" /> Customized retry webhook schedules</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" /> Sub-merchant console access controls</p>
                  <p className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" /> Dedicated SLA support with uptime assurances</p>
                </div>
              </div>
              <Link
                href="/login"
                className="mt-8 block w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all text-center text-xs"
              >
                Contact for enterprise
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────────────────
         PREMIUM SYSTEM FOOTER
         ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#0B192C] text-[#94A3B8] py-16 border-t border-[#1D2D44]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 pb-12 border-b border-[#1D2D44]">
          
          <div className="md:col-span-4 space-y-4">
            <MyMobPayLogo className="w-32 h-auto" textColor="#FFFFFF" />
            <p className="text-xs text-[#64748B] leading-relaxed font-normal max-w-xs">
              Direct UPI and IMPS payment gateway designed to eliminate intermediary transaction fees for modern businesses.
            </p>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-semibold text-[#F8FAFC]">Product</p>
            <ul className="space-y-2 text-xs font-normal text-[#94A3B8]">
              <li>
                <Link 
                  href="#how-it-works" 
                  className="hover:text-white transition-colors"
                >
                  How it works
                </Link>
              </li>
              <li>
                <Link 
                  href="#pricing-section" 
                  className="hover:text-white transition-colors"
                >
                  Pricing plans
                </Link>
              </li>
              <li>
                <Link 
                  href="#features-section" 
                  className="hover:text-white transition-colors"
                >
                  Platform features
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs font-semibold text-[#F8FAFC]">Resources</p>
            <ul className="space-y-2 text-xs font-normal text-[#94A3B8]">
              <li>
                <Link 
                  href="#how-it-works"
                  className="hover:text-white transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy policy</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4 bg-[#0F1E36] border border-[#1D2D44] rounded-2xl p-5 space-y-3 relative overflow-hidden">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <h4 className="text-xs font-semibold text-[#F8FAFC]">Direct bank settlement</h4>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed font-normal">
              Funds route instantly to your direct bank UPI account without escrows or lockups, safeguarded by secure HMAC SHA-256 signatures.
            </p>
            <div className="absolute -right-4 -bottom-4 opacity-[0.03] pointer-events-none">
              <ShieldCheck className="w-24 h-24 text-white" />
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-normal text-[#64748B]">
          <p>© 2026 MyMobPay. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
