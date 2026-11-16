'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, Zap, Shield, HelpCircle, Sparkles } from 'lucide-react';
import { MyMobPayLogoMark } from '@/components/MyMobPayLogo';

const VOLUME_TIERS = [
  { volume: 50000, label: '₹50K/mo', saved: 12000 },
  { volume: 100000, label: '₹1L/mo', saved: 24000 },
  { volume: 500000, label: '₹5L/mo', saved: 120000 },
  { volume: 1500000, label: '₹15L/mo', saved: 360000 },
  { volume: 2500000, label: '₹25L/mo', saved: 600000 },
  { volume: 5000000, label: '₹50L/mo', saved: 1200000 },
];

export default function PricingClient() {
  const [selectedVol, setSelectedVol] = useState(500000);
  const [openFaq, setOpenFaq] = useState(null);

  const currentTier = VOLUME_TIERS.find((t) => t.volume === selectedVol) || VOLUME_TIERS[2];
  const monthlyTraditionalFee = Math.round(selectedVol * 0.02);
  const annualSaved = monthlyTraditionalFee * 12;

  const faqs = [
    {
      q: 'How does MyMobPay offer 0% transaction commission?',
      a: 'Traditional payment gateways deduct 2% + 18% GST from every checkout. MyMobPay operates on a flat monthly subscription model (software-as-a-service), allowing your UPI and IMPS collections to settle directly into your merchant bank account with 0% platform deductions.',
    },
    {
      q: 'Are there any hidden fees or per-transaction setup costs?',
      a: 'None. You only pay your flat monthly subscription plan (e.g. ₹499/mo on Starter). Every single rupee your customers pay goes 100% straight to your attached bank account.',
    },
    {
      q: 'Can I test the integration before purchasing a plan?',
      a: 'Yes! Every new merchant gets access to our full Sandbox Environment for free. You can generate test payment sessions, simulate UPI intent checkouts, and verify signed webhooks before going live.',
    },
    {
      q: 'How do settlements work?',
      a: 'Payments settle via direct bank rails (UPI / IMPS) in real-time (T+0). Because MyMobPay does not hold nodal escrow custody of your funds, you don’t have to wait T+2 or T+3 days for aggregator payouts.',
    },
    {
      q: 'Can I cancel or upgrade my plan anytime?',
      a: 'Yes, subscriptions can be upgraded or cancelled at any time from your Merchant Dashboard with zero cancellation penalties.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090E] text-white">
      {/* Navigation Header */}
      <header className="border-b border-white/10 bg-[#0B0E17]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 flex items-center justify-center shrink-0">
              <MyMobPayLogoMark className="w-full h-full" id="pricing-nav-logo" />
            </span>
            <span className="font-sans font-extrabold text-xl tracking-tight text-white">
              MyMob<span className="text-[#0F2BFF]">Pay</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/pricing" className="text-white font-bold">Pricing</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Developers</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs sm:text-sm font-bold text-slate-200 hover:text-white px-3 py-1.5">
              Log in
            </Link>
            <Link href="/login?mode=signup" className="bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full transition-colors">
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/15 text-[#34D399] font-mono text-xs font-bold uppercase tracking-wider">
            0% TRANSACTION COMMISSION
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            KEEP 100% OF YOUR REVENUE. <br />
            <span className="text-[#0F2BFF]">PICK YOUR PLAN.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Stop paying 2% on every checkout. Switch to a flat, predictable monthly software subscription and eliminate gateway tax on your UPI & IMPS collections.
          </p>
        </div>

        {/* Interactive Volume Savings Calculator */}
        <div className="mt-12 bg-[#0E131F] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                SELECT MONTHLY REVENUE VOLUME
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white mt-1">
                ₹{selectedVol.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="sm:text-right">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#34D399] font-bold">
                ESTIMATED ANNUAL SAVINGS
              </span>
              <div className="text-2xl sm:text-3xl font-black text-[#34D399] mt-1">
                ₹{annualSaved.toLocaleString('en-IN')} / yr
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {VOLUME_TIERS.map((tier) => (
                <button
                  key={tier.volume}
                  type="button"
                  onClick={() => setSelectedVol(tier.volume)}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all text-center ${
                    selectedVol === tier.volume
                      ? 'bg-[#0F2BFF] border-[#0F2BFF] text-white shadow-md'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs sm:text-sm">
              <div className="text-slate-400">
                At <strong>₹{selectedVol.toLocaleString('en-IN')}/mo</strong>, traditional 2% gateways deduct{' '}
                <span className="text-rose-400 font-bold font-mono">₹{monthlyTraditionalFee.toLocaleString('en-IN')}/mo</span>.
              </div>
              <div className="text-[#34D399] font-bold font-mono shrink-0 ml-2">
                MyMobPay: ₹0 Fee
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Starter */}
          <div className="rounded-2xl bg-[#0E131F] border border-white/10 p-7 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl">
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#0F2BFF]">
                STARTER SUBSCRIPTION
              </div>
              <h3 className="text-xl font-bold text-white mt-1">Direct UPI & IMPS</h3>
              <p className="text-xs text-slate-400 mt-2">
                Ideal for indie hackers, micro-SaaS, and developers starting their payment collections.
              </p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-white">₹499</span>
                <span className="text-slate-400 text-xs font-semibold">/ month</span>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span><strong>0% Commission</strong> on all UPI & IMPS</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Direct Bank Settlement (T+0, No Escrow)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Automated UTR Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Real-Time HMAC Signed Webhooks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Dynamic QR & Universal UPI Intent</span>
                </div>
              </div>
            </div>

            <Link
              href="/login?mode=signup"
              className="mt-8 w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold text-center block transition-colors"
            >
              Get Started with Starter
            </Link>
          </div>

          {/* Card 2: Growth (Recommended) */}
          <div className="rounded-2xl bg-gradient-to-b from-[#131B33] to-[#0E131F] border-2 border-[#0F2BFF] p-7 flex flex-col justify-between relative shadow-2xl">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#0F2BFF] text-white font-mono text-[10px] font-bold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md">
              MOST POPULAR
            </span>

            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#60A5FA]">
                GROWTH TIER
              </div>
              <h3 className="text-xl font-bold text-white mt-1">High-Volume SaaS</h3>
              <p className="text-xs text-slate-300 mt-2">
                Built for established digital businesses and apps collecting consistent monthly volume.
              </p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-white">₹999</span>
                <span className="text-slate-400 text-xs font-semibold">/ month</span>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span><strong>Everything in Starter</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Higher Webhook Concurrency & Burst Limits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Advanced Analytics & GST Accounting Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Multi-Account Staff Access</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Priority Support Response</span>
                </div>
              </div>
            </div>

            <Link
              href="/login?mode=signup"
              className="mt-8 w-full py-3 rounded-xl bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-xs font-bold text-center block transition-colors shadow-lg"
            >
              Start Free Trial (0% Fees)
            </Link>
          </div>

          {/* Card 3: Scale */}
          <div className="rounded-2xl bg-[#0E131F] border border-white/10 p-7 flex flex-col justify-between hover:border-white/20 transition-all shadow-xl">
            <div>
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#A855F7]">
                SCALE & ENTERPRISE
              </div>
              <h3 className="text-xl font-bold text-white mt-1">Custom Infrastructure</h3>
              <p className="text-xs text-slate-400 mt-2">
                For platforms with heavy transaction throughput, dedicated IP proxies, and custom SLAs.
              </p>

              <div className="mt-6 flex items-baseline gap-1.5">
                <span className="text-3xl font-black text-white">Custom</span>
                <span className="text-slate-400 text-xs font-semibold">flat pricing</span>
              </div>

              <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span><strong>Everything in Growth</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Dedicated Bank Routing Node</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Custom Webhook Retry Schedules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#34D399] shrink-0" />
                  <span>Direct WhatsApp & Telegram Ops Hotline</span>
                </div>
              </div>
            </div>

            <Link
              href="/login?mode=signup"
              className="mt-8 w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold text-center block transition-colors"
            >
              Contact Sales / Support
            </Link>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="mt-20">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              MyMobPay vs. Traditional 2% Aggregators
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              Clear breakdown of costs, custody, and settlement architecture.
            </p>
          </div>

          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border border-white/10 rounded-xl overflow-hidden">
              <thead className="bg-[#141B2D] border-b border-white/10 text-slate-300 font-mono text-[11px] uppercase">
                <tr>
                  <th className="p-4">Feature / Metric</th>
                  <th className="p-4 text-[#34D399] font-bold">MyMobPay</th>
                  <th className="p-4 text-slate-400">Traditional Gateway (Razorpay/Cashfree)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-[#0B0E17]">
                <tr>
                  <td className="p-4 font-semibold text-white">Transaction Fee</td>
                  <td className="p-4 text-[#34D399] font-bold font-mono">0% (Zero)</td>
                  <td className="p-4 text-rose-400 font-mono">2.0% + 18% GST</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Billing Model</td>
                  <td className="p-4 text-white">Flat Monthly Subscription</td>
                  <td className="p-4 text-slate-400">Percentage tax on all gross revenue</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Settlement Speed</td>
                  <td className="p-4 text-[#34D399] font-bold font-mono">T+0 Instant Direct-to-Bank</td>
                  <td className="p-4 text-slate-400">T+2 or T+3 Business Days</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Fund Custody (Escrow)</td>
                  <td className="p-4 text-white">None (Direct P2P/Bank settlement)</td>
                  <td className="p-4 text-slate-400">Funds held in aggregator nodal escrow</td>
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-white">Automated Webhooks</td>
                  <td className="p-4 text-white">HMAC-SHA256 Signed</td>
                  <td className="p-4 text-slate-400">Standard Webhooks</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Frequently Asked Questions</h2>
            <p className="mt-2 text-sm text-slate-400">Everything you need to know about our flat subscription model.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-xl bg-[#0E131F] border border-white/10 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-white"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 font-mono text-lg shrink-0">
                    {openFaq === index ? '−' : '+'}
                  </span>
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-20 rounded-2xl bg-gradient-to-r from-[#0F2BFF] to-[#2563EB] p-8 sm:p-12 text-center text-white shadow-2xl">
          <h2 className="text-2xl sm:text-3xl font-black">Ready to Keep 100% of Every Transaction?</h2>
          <p className="mt-2 text-sm sm:text-base text-white/90 max-w-xl mx-auto">
            Create your merchant account in 2 minutes. Start in Sandbox mode and upgrade to live 0% commission whenever you are ready.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login?mode=signup"
              className="bg-white text-[#0F2BFF] hover:bg-slate-100 font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-md"
            >
              Get Started Free
            </Link>
            <Link
              href="/docs"
              className="bg-white/15 hover:bg-white/20 border border-white/20 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              View Developer Docs
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#07090E] py-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MyMobPayLogoMark className="w-5 h-5" id="pricing-footer-logo" />
            <span className="font-bold text-slate-300">MyMobPay</span>
            <span>&bull; Direct-to-Bank UPI & IMPS Payment Infrastructure</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/" className="hover:text-white">Home</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/docs" className="hover:text-white">Docs</Link>
            <Link href="/blog" className="hover:text-white">Blog</Link>
            <Link href="/login" className="hover:text-white">Login</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
