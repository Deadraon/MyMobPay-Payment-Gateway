import Link from "next/link";

export const metadata = {
  title: "MyMobPay vs Razorpay — 2026 Comparison (Save 100% on Gateway Fees)",
  description:
    "MyMobPay vs Razorpay: see how a flat ₹499/month subscription beats Razorpay's 2% + GST per-transaction fees. Direct bank settlement, zero intermediary cuts, built for developers.",
  alternates: {
    canonical: "https://www.mymobpay.tech/compare/razorpay",
  },
  openGraph: {
    title: "MyMobPay vs Razorpay — Full Comparison 2026",
    description:
      "Switch from Razorpay to MyMobPay and save thousands every month. Flat ₹499/month vs Razorpay's 2% + GST per transaction.",
    url: "https://www.mymobpay.tech/compare/razorpay",
    siteName: "MyMobPay",
    locale: "en_IN",
    type: "article",
    images: [
      {
        url: "/og-banner.png",
        width: 1200,
        height: 630,
        alt: "MyMobPay vs Razorpay comparison 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyMobPay vs Razorpay — Full Comparison 2026",
    description:
      "Flat ₹499/month vs 2% + GST. See how much you save with MyMobPay.",
    images: ["/og-banner.png"],
  },
};

export default function RazorpayComparePage() {
  const savingsTable = [
    {
      volume: "₹1 Lakh/mo",
      razorpay: "₹2,180/mo",
      mymobpay: "₹499/mo",
      saved: "₹1,681/mo",
    },
    {
      volume: "₹5 Lakhs/mo",
      razorpay: "₹10,900/mo",
      mymobpay: "₹499/mo",
      saved: "₹10,401/mo",
    },
    {
      volume: "₹10 Lakhs/mo",
      razorpay: "₹21,780/mo",
      mymobpay: "₹499/mo",
      saved: "₹21,281/mo",
    },
    {
      volume: "₹25 Lakhs/mo",
      razorpay: "₹54,450/mo",
      mymobpay: "₹499/mo",
      saved: "₹53,951/mo",
    },
    {
      volume: "₹50 Lakhs/mo",
      razorpay: "₹1,09,100/mo",
      mymobpay: "₹499/mo",
      saved: "₹1,08,601/mo",
    },
  ];

  const features = [
    {
      feature: "Transaction Fees",
      razorpay: "2% + 18% GST per transaction",
      mymobpay: "0% — flat ₹499/month",
      win: "mymobpay",
    },
    {
      feature: "Settlement Speed",
      razorpay: "T+2 to T+7 business days",
      mymobpay: "T+0 instant (direct bank credit)",
      win: "mymobpay",
    },
    {
      feature: "Escrow / Holds",
      razorpay: "May hold funds for 7–30 days",
      mymobpay: "No holds — direct P2P rail",
      win: "mymobpay",
    },
    {
      feature: "Auto-Verification",
      razorpay: "Manual reconciliation or SDK",
      mymobpay: "Automatic via bank email parsing",
      win: "mymobpay",
    },
    {
      feature: "Webhook Signing",
      razorpay: "HMAC signature supported",
      mymobpay: "HMAC-SHA256 with retry logic",
      win: "tie",
    },
    {
      feature: "Supported UPI Apps",
      razorpay: "All standard UPI apps",
      mymobpay: "All standard UPI apps + any QR",
      win: "tie",
    },
    {
      feature: "Developer SDKs",
      razorpay: "Node, Python, PHP, Go, .NET",
      mymobpay: "Node, Python, PHP, Flutter, React Native, Next.js",
      win: "tie",
    },
    {
      feature: "Sandbox / Testing",
      razorpay: "Test mode available",
      mymobpay: "Free sandbox with live checkout simulation",
      win: "tie",
    },
    {
      feature: "Payouts to Customers",
      razorpay: "Via XPressPay / payouts product",
      mymobpay: "Not yet — focus on collections",
      win: "razorpay",
    },
    {
      feature: "Multi-Currency",
      razorpay: "Yes (INR, USD, EUR, etc.)",
      mymobpay: "INR only (India-focused)",
      win: "razorpay",
    },
    {
      feature: "Enterprise Support",
      razorpay: "Dedicated account manager for large volumes",
      mymobpay: "Direct WhatsApp + email support",
      win: "tie",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-white border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-[#533afd]">
            Comparison — MyMobPay vs Razorpay
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            MyMobPay vs Razorpay:{" "}
            <span className="text-[#533afd]">Why founders are switching in 2026</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Razorpay charges 2% + 18% GST on every transaction. MyMobPay charges
            a flat ₹499/month with zero per-transaction fees. See the full
            comparison below and calculate your savings.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login?mode=signup"
              className="px-6 py-3 bg-[#533afd] hover:bg-[#4434d4] text-white font-semibold rounded-full transition-all shadow-sm text-sm"
            >
              Start Free with MyMobPay
            </Link>
            <a
              href="#savings"
              className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-full transition-all text-sm"
            >
              View Savings Table
            </a>
          </div>
        </div>
      </section>

      {/* Savings Table */}
      <section id="savings" className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How Much You Save Per Month
            </h2>
            <p className="text-slate-500 text-sm">
              Based on Razorpay&apos;s standard 2% + 18% GST model vs MyMobPay&apos;s flat ₹499/month
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="grid grid-cols-4 gap-0 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Monthly Volume</span>
              <span className="text-red-600">Razorpay Cost</span>
              <span className="text-emerald-600">MyMobPay Cost</span>
              <span className="text-blue-600">You Save</span>
            </div>
            {savingsTable.map((row, i) => (
              <div
                key={row.volume}
                className={`grid grid-cols-4 gap-0 border-b border-slate-100 last:border-0 px-5 py-4 text-sm items-center ${
                  i % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                }`}
              >
                <span className="font-semibold text-slate-900">{row.volume}</span>
                <span className="text-red-600 font-semibold">{row.razorpay}</span>
                <span className="text-emerald-600 font-semibold">{row.mymobpay}</span>
                <span className="text-blue-600 font-bold">{row.saved}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400 mt-4 text-center">
            * Estimates based on 2% MDR + 18% GST. Actual Razorpay pricing may vary by plan. MyMobPay is always ₹499/month regardless of volume.
          </p>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Feature-by-Feature Comparison
            </h2>
            <p className="text-slate-500 text-sm">
              Every feature side by side — no hidden advantages
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {/* Header */}
            <div className="grid grid-cols-3 gap-0 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Feature</span>
              <span>Razorpay</span>
              <span>MyMobPay</span>
            </div>

            {features.map((f, i) => (
              <div
                key={f.feature}
                className={`grid grid-cols-3 gap-0 border-b border-slate-100 last:border-0 px-5 py-4 text-sm items-start ${
                  f.win === "mymobpay"
                    ? "bg-emerald-50/30"
                    : i % 2 === 0
                    ? "bg-white"
                    : "bg-slate-50/50"
                }`}
              >
                <span className="font-semibold text-slate-900 pr-4">{f.feature}</span>
                <span
                  className={`${
                    f.win === "razorpay" ? "text-red-600 font-medium" : "text-slate-600"
                  }`}
                >
                  {f.razorpay}
                  {f.win === "razorpay" && (
                    <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">
                      wins
                    </span>
                  )}
                </span>
                <span
                  className={`${
                    f.win === "mymobpay" ? "text-emerald-700 font-semibold" : f.win === "tie" ? "text-slate-500" : "text-slate-600"
                  }`}
                >
                  {f.mymobpay}
                  {f.win === "mymobpay" && (
                    <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                      wins
                    </span>
                  )}
                  {f.win === "tie" && (
                    <span className="ml-1 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                      equal
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* When to choose which */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">
            Which One Should You Choose?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MyMobPay card */}
            <div className="bg-white rounded-2xl border-2 border-emerald-200 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Recommended For</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">MyMobPay</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 shrink-0">✓</span>
                  SaaS founders &amp; indie hackers who process ₹5L+ monthly
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 shrink-0">✓</span>
                  Developers who want simple API integration
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 shrink-0">✓</span>
                  Businesses that need instant bank settlement (T+0)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 shrink-0">✓</span>
                  Teams that want zero gateway overhead
                </li>
              </ul>
              <Link
                href="/login?mode=signup"
                className="block w-full text-center px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all text-sm"
              >
                Try MyMobPay Free
              </Link>
            </div>

            {/* Razorpay card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Consider Razorpay If</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Razorpay</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 shrink-0">○</span>
                  You need multi-currency (USD, EUR, etc.)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 shrink-0">○</span>
                  You need payout capabilities (XPressPay)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 shrink-0">○</span>
                  Your monthly volume is under ₹1 Lakh (fees are small)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 shrink-0">○</span>
                  You need enterprise-grade SLA &amp; account manager
                </li>
              </ul>
              <a
                href="https://razorpay.com"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
              >
                Visit Razorpay →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Is MyMobPay a UPI payment aggregator like Razorpay?",
                a: "No. MyMobPay does not act as an intermediary. Payments go directly from the customer&apos;s UPI app to your bank account via the IMPS/UPI rail. There is no escrow, no holding period, and no per-transaction cut.",
              },
              {
                q: "How does MyMobPay verify payments automatically?",
                a: "MyMobPay uses your bank&apos;s transaction notification emails. A Cloudflare Worker parses these emails in real-time and triggers automated webhook events to your server, so you never have to manually reconcile payments.",
              },
              {
                q: "Can I migrate from Razorpay to MyMobPay easily?",
                a: "Yes. Both platforms offer REST APIs and SDKs. Most developers can switch in under an hour — MyMobPay provides migration guides and dedicated support to make the transition smooth.",
              },
              {
                q: "What happens if my monthly volume is less than ₹1 Lakh?",
                a: "MyMobPay charges a flat ₹499/month regardless of volume. If you&apos;re processing less than ~₹25,000/month, Razorpay&apos;s 2% fee might be cheaper. But once you cross that threshold, MyMobPay saves you money immediately.",
              },
            ].map((faq, i) => (
              <div key={i} className="border-b border-slate-100 pb-6 last:border-0 last:pb-0">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#0c2340]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Stop paying 2% on every transaction
          </h2>
          <p className="text-slate-300 text-base leading-relaxed">
            Join thousands of founders who switched from Razorpay to MyMobPay and now keep 100% of their revenue.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login?mode=signup"
              className="px-6 py-3 bg-[#533afd] hover:bg-[#4434d4] text-white font-semibold rounded-full transition-all shadow-sm text-sm"
            >
              Start with MyMobPay — ₹499/month
            </Link>
            <Link
              href="/#developer-section"
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition-all text-sm border border-white/20"
            >
              Read the API Docs
            </Link>
          </div>
        </div>
      </section>

      {/* Breadcrumb nav */}
      <nav className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-xs text-slate-400" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-slate-600">Home</Link></li>
          <li>/</li>
          <li><Link href="/compare" className="hover:text-slate-600">Comparisons</Link></li>
          <li>/</li>
          <li className="text-slate-700 font-medium">MyMobPay vs Razorpay</li>
        </ol>
      </nav>
    </div>
  );
}
