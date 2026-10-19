'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowRight, Check, Copy, ExternalLink, ShieldCheck, Zap, 
  Terminal, Smartphone, Sparkles, Building2, ChevronRight, Layers,
  CreditCard, Landmark, Code, Activity, RefreshCw, QrCode
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { MyMobPayLogo } from '@/components/MyMobPayLogo';

export default function StripeDesignDemoPage() {
  const [monthlyVolume, setMonthlyVolume] = useState(500000); // ₹5 Lakhs
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [apiTab, setApiTab] = useState('curl');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedSuccess, setSimulatedSuccess] = useState(false);
  const [showTokensDrawer, setShowTokensDrawer] = useState(false);
  const [logoVariant, setLogoVariant] = useState('split'); // 'split' | 'solid' | 'svg'

  // Fee calculation (Traditional 2% + 18% GST vs MyMobPay flat ₹499)
  const savings = useMemo(() => {
    const traditionalMdr = monthlyVolume * 0.02;
    const traditionalGst = traditionalMdr * 0.18;
    const traditionalTotal = traditionalMdr + traditionalGst;
    const myMobPayCost = 499;
    const netSaved = Math.max(0, traditionalTotal - myMobPayCost);
    return {
      traditionalTotal,
      myMobPayCost,
      netSaved,
      pctSaved: Math.round((netSaved / (traditionalTotal || 1)) * 100)
    };
  }, [monthlyVolume]);

  const handleSimulatePayment = () => {
    setIsSimulating(true);
    setSimulatedSuccess(false);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulatedSuccess(true);
      setTimeout(() => setSimulatedSuccess(false), 4000);
    }, 1200);
  };

  const copyApiSnippet = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const curlCode = `curl -X POST https://mymob.tech/api/orders \\
  -H "x-api-key: mmp_live_9482019" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 1499.00,
    "purpose": "Pro SaaS Annual License",
    "customer": { "phone": "9876543210" }
  }'`;

  const nodeCode = `import { MyMobPay } from '@mymobpay/sdk';

const client = new MyMobPay({ apiKey: process.env.MYMOBPAY_API_KEY });

const order = await client.orders.create({
  amount: 1499.00,
  purpose: "Pro SaaS Annual License",
  customer: { phone: "9876543210" }
});

console.log('Instant UPI Intent URL:', order.payment_url);`;

  return (
    <div className="min-h-screen bg-white text-[#0d253d] font-sohne selection:bg-[#533afd]/20 selection:text-[#0d253d]">
      
      {/* ── Demo Switcher Header Banner ─────────────────────────────────── */}
      <div className="bg-[#1c1e54] text-white text-xs py-2.5 px-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/logos/mymobpay_mark.png" alt="MyMobPay Mark" className="w-4 h-4 object-contain" />
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider bg-[#533afd] text-white uppercase">
              Design Preview
            </span>
            <span className="text-slate-200">
              Live interpretation of <strong className="text-white">DESIGN-stripe.md</strong> (Atmospheric Gradient Mesh, Sohne 300, Indigo CTAs)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTokensDrawer(!showTokensDrawer)}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#b9b9f9]" />
              <span>{showTokensDrawer ? 'Hide Tokens Spec' : 'Inspect Tokens & Styles'}</span>
            </button>
            <span className="text-slate-500">|</span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all"
            >
              ← Back to Current Site
            </Link>
          </div>
        </div>
      </div>

      {/* ── Optional Design Tokens Spec Drawer ─────────────────────────── */}
      {showTokensDrawer && (
        <div className="bg-[#0c2340] text-slate-200 border-b border-white/10 py-6 px-6 text-xs transition-all animate-fadeIn">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-white font-semibold mb-2 uppercase tracking-wider text-[11px] text-[#b9b9f9]">Primary Palette</div>
              <div className="space-y-1 font-mono">
                <div className="flex justify-between"><span>primary:</span><span className="text-[#665efd]">#533afd (Indigo)</span></div>
                <div className="flex justify-between"><span>ink:</span><span>#0d253d (Navy body)</span></div>
                <div className="flex justify-between"><span>brand-dark-900:</span><span>#1c1e54</span></div>
                <div className="flex justify-between"><span>canvas-cream:</span><span className="text-[#f5e9d4]">#f5e9d4</span></div>
              </div>
            </div>
            <div>
              <div className="text-white font-semibold mb-2 uppercase tracking-wider text-[11px] text-[#b9b9f9]">Typography System</div>
              <div className="space-y-1">
                <div>Display XXL: 56px @ weight 300, -1.4px tracking</div>
                <div>Display LG: 32px @ weight 300, -0.64px tracking</div>
                <div>Body: 15px @ weight 300, font-feature: ss01</div>
                <div>Numerics: 14px @ weight 300, font-feature: tnum</div>
              </div>
            </div>
            <div>
              <div className="text-white font-semibold mb-2 uppercase tracking-wider text-[11px] text-[#b9b9f9]">Button Geometry</div>
              <div className="space-y-1">
                <div>Shape: Pill (rounded: 9999px)</div>
                <div>Padding: 8px 16px (tight transactional)</div>
                <div>Rule: Exactly 1 filled indigo pill CTA per band</div>
              </div>
            </div>
            <div>
              <div className="text-white font-semibold mb-2 uppercase tracking-wider text-[11px] text-[#b9b9f9]">Elevation &amp; Mesh</div>
              <div className="space-y-1">
                <div>Upper third: Organic pastel gradient mesh</div>
                <div>Level 1: 0 1px 3px rgba(0,55,112,0.08)</div>
                <div>Level 2: 0 16px 40px rgba(0,55,112,0.08)</div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="text-white font-semibold mb-1.5 uppercase tracking-wider text-[10px] text-[#b9b9f9]">Logo Style Switcher</div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setLogoVariant('split')}
                    className={`px-2 py-0.5 rounded text-[11px] transition-all ${logoVariant === 'split' ? 'bg-[#533afd] text-white' : 'bg-white/10 text-slate-300'}`}
                  >
                    Dual-Tone
                  </button>
                  <button
                    onClick={() => setLogoVariant('solid')}
                    className={`px-2 py-0.5 rounded text-[11px] transition-all ${logoVariant === 'solid' ? 'bg-[#533afd] text-white' : 'bg-white/10 text-slate-300'}`}
                  >
                    Solid Navy
                  </button>
                  <button
                    onClick={() => setLogoVariant('svg')}
                    className={`px-2 py-0.5 rounded text-[11px] transition-all ${logoVariant === 'svg' ? 'bg-[#533afd] text-white' : 'bg-white/10 text-slate-300'}`}
                  >
                    Vector SVG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Nav: nav-bar-on-mesh ────────────────────────────────────── */}
      <header className="relative z-40 border-b border-[#e3e8ee] bg-white">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          
          {/* Left Cluster: Brand Logo + Primary Navigation */}
          <div className="flex items-center gap-8 lg:gap-12">
            
            {/* Real Original Brand Logo & Wordmark */}
            <Link href="/stripe-demo" className="flex items-center select-none group py-1">
              <MyMobPayLogo className="w-42 sm:w-44 h-auto" textColor="#0d253d" />
            </Link>

            {/* Desktop Nav Links (Clustered with Brand on Left) */}
            <nav className="hidden md:flex items-center gap-7 text-[15px] text-[#273951] font-normal">
              <a href="#features" className="hover:text-[#533afd] transition-colors py-1">Products</a>
              <a href="#calculator" className="hover:text-[#533afd] transition-colors py-1">Calculator</a>
              <a href="#developers" className="hover:text-[#533afd] transition-colors py-1">Developers</a>
              <a href="#pricing" className="hover:text-[#533afd] transition-colors py-1">Pricing</a>
            </nav>
          </div>

          {/* Right Cluster: Sign in + Single Indigo Pill CTA */}
          <div className="flex items-center gap-5">
            <Link 
              href="/login" 
              className="hidden sm:inline-block text-[15px] text-[#0d253d] hover:text-[#533afd] transition-colors font-normal"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[14px] font-normal tracking-wide transition-all shadow-sm group"
            >
              <span>Start now</span>
              <span className="ml-1.5 opacity-80 transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </Link>
          </div>

        </div>
      </header>

      {/* ── Hero Section with Signature Atmospheric Gradient Mesh ─────── */}
      <section className="relative overflow-hidden pt-16 pb-28 stripe-gradient-mesh">
        
        {/* Ambient Decorative Shapes */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none opacity-80 blur-2xl -z-10" />

        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mb-14">
            
            {/* Pill Eyebrow Tag with Real Mark */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#f0f0ff] border border-[#e0e0fc] text-[#4434d4] text-[12px] font-medium tracking-wide mb-6 shadow-xs">
              <img src="/logos/mymobpay_mark.png" alt="MyMobPay" className="w-4 h-auto object-contain" />
              <span className="font-semibold text-[#0d253d]">MyMobPay</span>
              <span className="text-slate-300">•</span>
              <span>Direct-to-bank UPI 2.0 Infrastructure</span>
              <span className="text-slate-300">•</span>
              <span className="font-medium text-[#533afd]">0% Gateway Fees</span>
            </div>

            {/* Display XXL: 56px @ weight 300, -1.4px tracking */}
            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-light text-[#0d253d] leading-[1.05] tracking-[-1.4px] mb-6">
              Financial infrastructure for direct UPI payments.
            </h1>

            {/* Body Lead: 17px @ weight 300 */}
            <p className="text-lg sm:text-[19px] font-light text-[#273951] leading-relaxed mb-8 max-w-2xl">
              Accept unified UPI payments directly into your bank account with <strong className="font-normal text-[#0d253d]">MyMobPay</strong> instant T+0 settlement, automated UTR verification, and zero intermediary escrow holds. Built specifically for SaaS founders and digital businesses.
            </p>

            {/* Single Indigo Pill CTA + Text Link */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-[15px] font-normal transition-all shadow-sm group"
              >
                <span>Start now with WhatsApp OTP</span>
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a
                href="#developers"
                className="inline-flex items-center text-[15px] text-[#533afd] hover:text-[#4434d4] transition-colors font-normal py-2 px-2"
              >
                Explore API &amp; Webhooks <span className="ml-1">&rarr;</span>
              </a>
            </div>

          </div>

          {/* ── Composited Product UI Mockup (card-dashboard-mockup) ───── */}
          <div className="relative rounded-2xl bg-white border border-[#e3e8ee] p-4 sm:p-8 stripe-elevated-shadow max-w-6xl mx-auto">
            
            {/* Mockup Header Toolbar */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#e3e8ee]">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ea2261]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]/80" />
                  <div className="w-3 h-3 rounded-full bg-[#10b981]/80" />
                </div>
                <span className="text-xs text-[#64748d] font-mono tracking-wide ml-2">
                  https://api.mymob.tech/v1/orders
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#ecfdf5] text-[#059669]">
                  ● NPCI Passthrough Active
                </span>
              </div>
            </div>

            {/* 3-Column Composite Track */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Column 1: API Intent Creator (Left 4 cols) */}
              <div className="lg:col-span-4 rounded-xl bg-[#f6f9fc] border border-[#e3e8ee] p-5 flex flex-col justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-[#64748d] mb-3">
                    1. Create Payment Intent
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-[#273951] font-light">Order Amount</label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-2.5 text-sm text-[#64748d]">₹</span>
                        <input
                          type="text"
                          readOnly
                          value="1,499.00"
                          className="w-full pl-7 pr-3 py-2 rounded-md bg-white border border-[#a8c3de] text-sm text-[#0d253d] tabular-nums font-mono focus:border-[#533afd] outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-[#273951] font-light">Settlement VPA</label>
                      <input
                        type="text"
                        readOnly
                        value="chauhan@okaxis"
                        className="w-full px-3 py-2 mt-1 rounded-md bg-white border border-[#a8c3de] text-sm text-[#0d253d] font-mono outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#273951] font-light">Gateway Fee</label>
                      <div className="mt-1 px-3 py-2 rounded-md bg-[#ecfdf5] border border-[#a7f3d0] text-xs text-[#047857] font-medium flex justify-between">
                        <span>Platform MDR</span>
                        <strong className="tabular-nums">0.00% (₹0.00)</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#e3e8ee]">
                  <button
                    onClick={handleSimulatePayment}
                    disabled={isSimulating}
                    className="w-full py-2.5 px-4 rounded-full bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-xs font-normal transition-all flex items-center justify-center gap-2"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying UTR on NPCI...</span>
                      </>
                    ) : simulatedSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Payment Verified ✓</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-3.5 h-3.5" />
                        <span>Simulate Live Payment</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Column 2: Live Dynamic UPI QR & App Selector (Center 4 cols) */}
              <div className="lg:col-span-4 rounded-xl bg-white border border-[#e3e8ee] p-5 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="text-xs uppercase tracking-wider font-semibold text-[#64748d] mb-3">
                  2. Dynamic UPI QR Intent
                </div>
                
                {/* QR Container */}
                <div className="p-3 bg-white rounded-xl border border-[#e3e8ee] shadow-sm mb-4 relative">
                  <QRCode
                    value="upi://pay?pa=chauhan@okaxis&pn=MyMobPay&am=1499.00&cu=INR"
                    size={140}
                    style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
                  />
                  {/* Real Original Center QR Badge */}
                  <div className="absolute inset-0 m-auto w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center border border-slate-100 pointer-events-none p-1">
                    <img src="/logos/mymobpay_mark.png" alt="MyMobPay" className="w-5 h-5 object-contain" />
                  </div>
                  {simulatedSuccess && (
                    <div className="absolute inset-0 bg-white/95 rounded-xl flex flex-col items-center justify-center p-3 animate-fadeIn">
                      <div className="w-10 h-10 rounded-full bg-[#ecfdf5] text-[#059669] flex items-center justify-center mb-1">
                        <Check className="w-6 h-6 stroke-[3]" />
                      </div>
                      <span className="text-xs font-bold text-[#059669]">₹1,499 Settled</span>
                      <span className="text-[10px] text-[#64748d] font-mono mt-0.5">UTR: 948201849102</span>
                    </div>
                  )}
                </div>

                {/* App Selector Pills with Real Vector SVGs */}
                <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
                  {[
                    { id: 'phonepe', name: 'PhonePe', icon: '/logos/phonepe.svg' },
                    { id: 'gpay', name: 'GPay', icon: '/logos/gpay.svg' },
                    { id: 'paytm', name: 'Paytm', icon: '/logos/paytm.svg' },
                    { id: 'bhim', name: 'BHIM', icon: '/logos/bhim.svg' },
                  ].map((app) => (
                    <button
                      key={app.id}
                      onClick={() => setSelectedUpiApp(app.id)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border flex items-center justify-center gap-1 transition-all ${
                        selectedUpiApp === app.id
                          ? 'bg-white text-[#0d253d] border-[#533afd] shadow-xs ring-1 ring-[#533afd]'
                          : 'bg-[#f6f9fc] text-[#64748d] border-[#e3e8ee] hover:text-[#0d253d] hover:bg-white'
                      }`}
                    >
                      <img src={app.icon} alt={app.name} className="h-3.5 w-auto object-contain" />
                      <span className="hidden sm:inline">{app.name}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-[#64748d] font-light mt-3">
                  Scannable by all 150+ RBI-authorized UPI apps
                </p>
              </div>

              {/* Column 3: Tabular Transaction Ledger (Right 4 cols) */}
              <div className="lg:col-span-4 rounded-xl bg-[#0c2340] text-white p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[#b9b9f9]">
                      3. Instant T+0 Ledger
                    </span>
                    <span className="text-[10px] text-[#10b981] font-mono">LIVE FEED</span>
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-slate-300 font-sans text-[11px]">SaaS Pro Tier #819</div>
                        <div className="text-[10px] text-slate-500">UTR: 948201849102</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#10b981] font-semibold tabular-nums">+₹1,499.00</div>
                        <div className="text-[10px] text-slate-400">0% fee • Settled</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between opacity-80">
                      <div>
                        <div className="text-slate-300 font-sans text-[11px]">Monthly License #818</div>
                        <div className="text-[10px] text-slate-500">UTR: 948201849101</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#10b981] font-semibold tabular-nums">+₹499.00</div>
                        <div className="text-[10px] text-slate-400">0% fee • Settled</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between opacity-60">
                      <div>
                        <div className="text-slate-300 font-sans text-[11px]">Custom Checkout #817</div>
                        <div className="text-[10px] text-slate-500">UTR: 948201849100</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[#10b981] font-semibold tabular-nums">+₹2,999.00</div>
                        <div className="text-[10px] text-slate-400">0% fee • Settled</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-sans">
                  <span>Intermediary Escrow:</span>
                  <strong className="text-white">₹0.00 (Direct P2P)</strong>
                </div>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ── Feature Band 1: Core Values (canvas-soft) ───────────────────── */}
      <section id="features" className="py-24 bg-[#f6f9fc] border-t border-b border-[#e3e8ee]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-2xl mb-16">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#533afd] mb-3 block">
              Architectural Advantages
            </span>
            {/* Display LG: 32px @ weight 300 */}
            <h2 className="text-3xl sm:text-[36px] font-light text-[#0d253d] tracking-[-0.64px] leading-tight mb-4">
              A direct financial rail built for modern Indian builders.
            </h2>
            <p className="text-[#273951] font-light leading-relaxed">
              Eliminate third-party payout delays, arbitrary account freezes, and compounding transaction fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Feature Card 1 */}
            <div className="p-8 rounded-xl bg-white border border-[#e3e8ee] stripe-card-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#e0e0fc] text-[#533afd] flex items-center justify-center mb-6">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-light text-[#0d253d] tracking-[-0.2px] mb-3">
                  0% Transaction Commission
                </h3>
                <p className="text-sm font-light text-[#64748d] leading-relaxed">
                  Traditional payment gateways take 2% to 3% plus 18% GST on every single order. MyMobPay operates on a transparent, flat SaaS license with zero cut from your revenue.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#e3e8ee]">
                <span className="text-xs font-medium text-[#533afd] inline-flex items-center gap-1">
                  Compare savings below <span className="text-sm">&darr;</span>
                </span>
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="p-8 rounded-xl bg-white border border-[#e3e8ee] stripe-card-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#ecfdf5] text-[#059669] flex items-center justify-center mb-6">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-light text-[#0d253d] tracking-[-0.2px] mb-3">
                  Real-time Direct Bank Credit
                </h3>
                <p className="text-sm font-light text-[#64748d] leading-relaxed">
                  Customer payments flow via peer-to-merchant NPCI UPI rails directly into your primary bank account (VPA). No T+2 settlement waiting periods and no locked merchant reserves.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#e3e8ee]">
                <span className="text-xs font-medium text-[#059669] inline-flex items-center gap-1">
                  Instant Liquidity
                </span>
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="p-8 rounded-xl bg-white border border-[#e3e8ee] stripe-card-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#fae8ff] text-[#9333ea] flex items-center justify-center mb-6">
                  <Code className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-light text-[#0d253d] tracking-[-0.2px] mb-3">
                  Developer First Architecture
                </h3>
                <p className="text-sm font-light text-[#64748d] leading-relaxed">
                  Clean REST APIs, HMAC-SHA256 signed webhooks, dynamic payment links, and instant WhatsApp OTP verification designed to plug into any Next.js, Node, Python, or PHP stack in minutes.
                </p>
              </div>
              <div className="mt-8 pt-4 border-t border-[#e3e8ee]">
                <span className="text-xs font-medium text-[#9333ea] inline-flex items-center gap-1">
                  Plug-and-play APIs
                </span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Feature Band 2: Warm Cream Interlude Band (card-cream-band) ── */}
      <section id="calculator" className="py-24 bg-[#f5e9d4]/60 border-b border-[#e3e8ee]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="rounded-2xl bg-[#f5e9d4] border border-[#ebd8bc] p-8 sm:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Heading & Slider */}
              <div className="lg:col-span-6">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#9b6829] mb-3 block">
                  Interactive Fee Calculator
                </span>
                <h2 className="text-3xl sm:text-[38px] font-light text-[#0d253d] tracking-[-0.64px] leading-tight mb-4">
                  See how much revenue you retain every month.
                </h2>
                <p className="text-sm font-light text-[#273951] leading-relaxed mb-8">
                  Adjust your monthly transaction volume to see the compounding difference between standard 2% + GST gateway deductions versus MyMobPay direct passthrough.
                </p>

                {/* Range Slider */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#64748d] font-light">Monthly Collection Volume:</span>
                    <strong className="text-lg font-mono tabular-nums text-[#0d253d]">
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
                    className="w-full h-2 bg-[#ebd8bc] rounded-lg appearance-none cursor-pointer accent-[#533afd]"
                  />
                  <div className="flex justify-between text-[11px] text-[#64748d] font-mono">
                    <span>₹1 Lakh</span>
                    <span>₹25 Lakhs</span>
                    <span>₹50 Lakhs+</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Comparison Card */}
              <div className="lg:col-span-6">
                <div className="bg-white rounded-xl border border-[#ebd8bc] p-6 sm:p-8 shadow-sm">
                  
                  <div className="space-y-4 pb-6 border-b border-[#e3e8ee]">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#64748d]">Traditional Gateways (2% + 18% GST)</span>
                      <span className="text-sm font-mono text-[#ea2261] tabular-nums font-semibold">
                        -₹{savings.traditionalTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#64748d]">MyMobPay Flat License</span>
                      <span className="text-sm font-mono text-[#059669] tabular-nums font-semibold">
                        ₹499.00/mo (Fixed)
                      </span>
                    </div>
                  </div>

                  <div className="pt-6">
                    <div className="text-xs uppercase tracking-wider font-semibold text-[#64748d] mb-1">
                      Net Monthly Savings
                    </div>
                    <div className="text-4xl font-light text-[#059669] tracking-[-1px] font-mono tabular-nums">
                      ₹{savings.netSaved.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      <span className="text-sm font-sans text-[#273951] font-light ml-2">retained</span>
                    </div>
                    <p className="text-xs text-[#64748d] mt-2">
                      That is <strong className="text-[#0d253d]">{savings.pctSaved}% savings</strong> directly redirected to your product development and growth.
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── Developer Integration Console ──────────────────────────────── */}
      <section id="developers" className="py-24 bg-white border-b border-[#e3e8ee]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#533afd] mb-3 block">
                Engineering Velocity
              </span>
              <h2 className="text-3xl sm:text-[38px] font-light text-[#0d253d] tracking-[-0.64px] leading-tight mb-4">
                Designed for engineers who value simplicity.
              </h2>
              <p className="text-[#273951] font-light leading-relaxed mb-6">
                Integrate real-time UPI checkouts, generate dynamic QR codes, and subscribe to cryptographic webhooks with just a few lines of clean code.
              </p>
              
              <ul className="space-y-3 text-sm text-[#273951] font-light mb-8">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#533afd]" />
                  <span>Stateless JSON request/response format</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#533afd]" />
                  <span>HMAC-SHA256 signature verification on every webhook</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#533afd]" />
                  <span>Zero client-side SDK bloat required</span>
                </li>
              </ul>

              <Link
                href="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#1c1e54] hover:bg-[#0d253d] text-white text-[14px] font-normal transition-all"
              >
                Get API Credentials &rarr;
              </Link>
            </div>

            {/* Dark Faux IDE Terminal */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-[#0c2340] border border-white/10 text-white p-6 shadow-xl font-mono text-xs overflow-hidden">
                
                {/* Tabs */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 font-sans">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setApiTab('curl')}
                      className={`px-3 py-1 rounded-md text-xs transition-colors ${
                        apiTab === 'curl' ? 'bg-[#533afd] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      onClick={() => setApiTab('node')}
                      className={`px-3 py-1 rounded-md text-xs transition-colors ${
                        apiTab === 'node' ? 'bg-[#533afd] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Node.js
                    </button>
                  </div>
                  <button
                    onClick={() => copyApiSnippet(apiTab === 'curl' ? curlCode : nodeCode)}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-xs"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Code Body */}
                <pre className="overflow-x-auto text-slate-200 leading-relaxed font-mono">
                  {apiTab === 'curl' ? curlCode : nodeCode}
                </pre>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── Pricing Section: card-pricing & card-pricing-featured ─────── */}
      <section id="pricing" className="py-24 bg-[#f6f9fc] border-b border-[#e3e8ee]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-wider font-semibold text-[#533afd] mb-3 block">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-[44px] font-light text-[#0d253d] tracking-[-0.96px] leading-tight mb-4">
              Predictable costs. Zero commission.
            </h2>
            <p className="text-[#64748d] font-light">
              No hidden fees, no percentage cuts, and no locked settlement balance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            
            {/* Standard Sandbox Tier: card-pricing */}
            <div className="p-8 sm:p-10 rounded-xl bg-white border border-[#e3e8ee] stripe-card-shadow flex flex-col justify-between">
              <div>
                <div className="text-sm font-medium text-[#64748d] uppercase tracking-wider mb-2">
                  Sandbox Developer
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-light text-[#0d253d] tracking-[-1px]">₹0</span>
                  <span className="text-sm text-[#64748d]">/ forever free</span>
                </div>
                <p className="text-sm font-light text-[#64748d] mb-6">
                  Complete test environment to build, simulate, and verify your checkout flow before launching.
                </p>

                <ul className="space-y-3 text-sm text-[#273951] font-light mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#533afd]" />
                    <span>Unlimited test UPI intent simulations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#533afd]" />
                    <span>Mock webhook test triggers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#533afd]" />
                    <span>Full API Documentation access</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-full border border-[#e3e8ee] text-[#0d253d] hover:border-[#533afd] hover:text-[#533afd] text-center text-sm font-normal transition-all"
              >
                Create Sandbox Account
              </Link>
            </div>

            {/* Inverted Featured Tier: card-pricing-featured (bg-[#1c1e54]) */}
            <div className="p-8 sm:p-10 rounded-xl bg-[#1c1e54] text-white stripe-elevated-shadow flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[10px] font-semibold bg-[#533afd] text-white uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-[#b9b9f9] uppercase tracking-wider">
                    Pro Merchant License
                  </div>
                  
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-light text-white tracking-[-1px]">₹499</span>
                  <span className="text-sm text-slate-300">/ 30-day license</span>
                </div>
                <p className="text-sm font-light text-slate-300 mb-6">
                  Production gateway pass. 100% direct-to-bank UPI settlement with 0% gateway commission.
                </p>

                <ul className="space-y-3 text-sm text-slate-200 font-light mb-8">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>0.00% Gateway MDR on all orders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>Instant Direct Bank P2P Settlement</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>Automated UTR Verification &amp; Webhooks</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>WhatsApp OTP merchant login (under 2 min)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#10b981]" />
                    <span>Multi-rail Email System (Invoices &amp; Statements)</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/login"
                className="w-full py-2.5 px-4 rounded-full bg-[#533afd] hover:bg-[#4434d4] active:bg-[#2e2b8c] text-white text-center text-sm font-normal transition-all shadow-md"
              >
                Activate Pro License &rarr;
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* ── Footer: footer-light ───────────────────────────────────────── */}
      <footer className="py-16 bg-white text-[#64748d] text-xs font-light">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 border-b border-[#e3e8ee]">
            <div className="flex items-center gap-4">
              <Link href="/stripe-demo" className="select-none">
                <img
                  src="/logos/logo_horizontal.png"
                  alt="MyMobPay"
                  className="h-8 w-auto object-contain transition-transform hover:scale-[1.02]"
                />
              </Link>
              <div className="h-4 w-px bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                <span className="text-[#0d253d] font-medium">All Systems Operational</span>
                <span className="text-slate-400 hidden md:inline">• NPCI UPI 2.0 Passthrough</span>
              </div>
            </div>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-[#533afd]">Terms</Link>
              <Link href="/privacy" className="hover:text-[#533afd]">Privacy</Link>
              <Link href="/login" className="hover:text-[#533afd]">Merchant Login</Link>
              <Link href="/" className="hover:text-[#533afd] font-medium text-[#533afd]">Current Website &rarr;</Link>
            </div>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400 text-[11px]">
            <p>&copy; {new Date().getFullYear()} MyMobPay Technologies. Stripe Design System Demo.</p>
            <p>Built strictly following <code className="text-slate-600">DESIGN-stripe.md</code> tokens &amp; guidelines.</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
