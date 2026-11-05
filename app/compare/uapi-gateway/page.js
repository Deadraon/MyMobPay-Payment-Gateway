import Link from "next/link";

export const metadata = {
  title: "Best UPI Payment Gateway for SaaS in 2026 — MyMobPay Review",
  description:
    "Looking for the best UPI payment gateway for your SaaS? MyMobPay offers 0% transaction fees, instant bank settlement, and developer-first API. Full comparison with alternatives.",
  alternates: {
    canonical: "https://www.mymobpay.tech/compare/uapi-gateway",
  },
  openGraph: {
    title: "Best UPI Payment Gateway for SaaS — 2026 Review",
    description: "MyMobPay: 0% transaction fees, instant settlement, built for developers.",
    url: "https://www.mymobpay.tech/compare/uapi-gateway",
    siteName: "MyMobPay",
    locale: "en_IN",
    type: "article",
    images: [{ url: "/og-banner.png", width: 1200, height: 630, alt: "Best UPI payment gateway India 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best UPI Payment Gateway for SaaS — 2026 Review",
    description: "MyMobPay: 0% fees, instant settlement, developer-first API.",
    images: ["/og-banner.png"],
  },
};

export default function BestUapiGatewayPage() {
  const alternatives = [
    {
      name: "MyMobPay",
      fees: "₹499/month flat",
      settlement: "T+0 instant",
      bestFor: "SaaS founders, developers, high-volume businesses",
      score: "★★★★★",
    },
    {
      name: "Razorpay",
      fees: "2% + 18% GST",
      settlement: "T+2 to T+7",
      bestFor: "Enterprises needing multi-currency and payouts",
      score: "★★★☆☆",
    },
    {
      name: "Cashfree",
      fees: "1.4% per transaction",
      settlement: "T+2",
      bestFor: "Marketplaces and subscription businesses",
      score: "★★★☆☆",
    },
    {
      name: "PhonePe Business",
      fees: "1% + GST (approx)",
      settlement: "T+1 to T+2",
      bestFor: "Merchants already on PhonePe ecosystem",
      score: "★★☆☆☆",
    },
    {
      name: "Paytm PostPayer",
      fees: "2% + GST",
      settlement: "T+3",
      bestFor: "Small retailers and offline merchants",
      score: "★★☆☆☆",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-white border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-[#533afd]">
            Buyer&apos;s Guide 2026
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            Best UPI Payment Gateway{" "}
            <span className="text-[#533afd]">for SaaS Founders in 2026</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Choosing the right UPI payment gateway can save your startup thousands in fees every month.
            Here&apos;s our honest comparison of the top options for Indian SaaS businesses.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Side-by-Side Comparison</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="grid grid-cols-5 gap-0 border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span className="col-span-1">Gateway</span>
              <span className="col-span-1">Fees</span>
              <span className="col-span-1">Settlement</span>
              <span className="col-span-1">Best For</span>
              <span className="col-span-1">Rating</span>
            </div>
            {alternatives.map((alt, i) => (
              <div key={alt.name} className={`grid grid-cols-5 gap-0 border-b border-slate-100 last:border-0 px-4 py-4 text-sm items-center ${alt.name === "MyMobPay" ? "bg-emerald-50/40" : i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                <span className={`font-semibold pr-2 ${alt.name === "MyMobPay" ? "text-emerald-700" : "text-slate-900"}`}>{alt.name}</span>
                <span className={alt.name === "MyMobPay" ? "text-emerald-700 font-semibold" : "text-red-600"}>{alt.fees}</span>
                <span className="text-slate-600">{alt.settlement}</span>
                <span className="text-slate-500 text-xs">{alt.bestFor}</span>
                <span className="text-yellow-500 text-sm">{alt.score}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Why Most SaaS Founders Overpay on Gateway Fees</h2>
            <p className="text-slate-600 leading-relaxed">
              Most payment gateways in India charge between 1.4% and 2% per transaction, plus 18% GST on those fees.
              On a monthly volume of ₹10 Lakhs, that&apos;s over ₹21,000 in gateway costs — money that could go toward product development or marketing.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">What to Look For in a UPI Payment Gateway</h2>
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                <span><strong className="text-slate-900">Zero or low transaction fees</strong> — Preferably a flat monthly fee rather than a percentage</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                <span><strong className="text-slate-900">Instant settlement (T+0)</strong> — Funds should reach your bank account immediately, not after 2-7 days</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                <span><strong className="text-slate-900">Automated verification</strong> — No manual reconciliation of payment emails</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                <span><strong className="text-slate-900">Developer-friendly API</strong> — Clean REST endpoints, typed SDKs, clear documentation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                <span><strong className="text-slate-900">No escrow or holds</strong> — Your money should go directly to your bank, not sit in an intermediary account</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">The Verdict</h2>
            <p className="text-slate-600 leading-relaxed">
              For SaaS founders, indie hackers, and developer-led businesses processing ₹5 Lakhs+ per month,
              <strong className="text-slate-900"> MyMobPay</strong> is the clear winner. Zero transaction fees, instant bank settlement,
              and a developer-first API that takes minutes to integrate. If you need multi-currency or international cards,
              Razorpay or Cashfree may still have a role — but for pure UPI collection in India, nothing beats the direct rail.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#0c2340]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Start collecting UPI payments today</h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Get set up in under 15 minutes. No KYC delays, no paperwork, no minimum volume requirements.
          </p>
          <Link href="/login?mode=signup" className="inline-block px-6 py-3 bg-[#533afd] hover:bg-[#4434d4] text-white font-semibold rounded-full transition-all shadow-sm text-sm">
            Create Free Account
          </Link>
        </div>
      </section>

      <nav className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-xs text-slate-400" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-slate-600">Home</Link></li>
          <li>/</li>
          <li><Link href="/compare" className="hover:text-slate-600">Comparisons</Link></li>
          <li>/</li>
          <li className="text-slate-700 font-medium">Best UPI Payment Gateway 2026</li>
        </ol>
      </nav>
    </div>
  );
}
