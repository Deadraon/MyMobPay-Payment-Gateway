import Link from "next/link";

export const metadata = {
  title: "MyMobPay vs Cashfree — 2026 Comparison (Zero Fees vs Per-Transaction)",
  description:
    "MyMobPay vs Cashfree: see how a flat ₹499/month subscription beats Cashfree's 1.4% per-transaction fee. Direct bank settlement, no escrow, built for developers.",
  alternates: {
    canonical: "https://www.mymobpay.tech/compare/cashfree",
  },
  openGraph: {
    title: "MyMobPay vs Cashfree — Full Comparison 2026",
    description:
      "Cashfree charges 1.4% per transaction. MyMobPay charges a flat ₹499/month. See the full comparison.",
    url: "https://www.mymobpay.tech/compare/cashfree",
    siteName: "MyMobPay",
    locale: "en_IN",
    type: "article",
    images: [{ url: "/og-banner.png", width: 1200, height: 630, alt: "MyMobPay vs Cashfree comparison 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MyMobPay vs Cashfree — Full Comparison 2026",
    description: "Flat ₹499/month vs 1.4% per transaction. See how much you save.",
    images: ["/og-banner.png"],
  },
};

export default function CashfreeComparePage() {
  const savings = [
    { vol: "₹1 Lakh/mo", cashfree: "₹1,540/mo", mymobpay: "₹499/mo", saved: "₹1,041/mo" },
    { vol: "₹5 Lakhs/mo", cashfree: "₹7,700/mo", mymobpay: "₹499/mo", saved: "₹7,201/mo" },
    { vol: "₹10 Lakhs/mo", cashfree: "₹15,400/mo", mymobpay: "₹499/mo", saved: "₹14,901/mo" },
    { vol: "₹25 Lakhs/mo", cashfree: "₹38,500/mo", mymobpay: "₹499/mo", saved: "₹38,001/mo" },
  ];

  const features = [
    { feature: "Transaction Fee", cashfree: "1.4% per transaction", mymobpay: "0% — flat ₹499/month", win: "mymobpay" },
    { feature: "GST on Fees", cashfree: "18% GST extra", mymobpay: "Included in flat fee", win: "mymobpay" },
    { feature: "Settlement Time", cashfree: "T+2 business days", mymobpay: "T+0 instant", win: "mymobpay" },
    { feature: "Escrow Account", cashfree: "Yes (holds funds)", mymobpay: "None — direct P2P", win: "mymobpay" },
    { feature: "Payment Methods", cashfree: "UPI, Cards, Netbanking, Wallets", mymobpay: "UPI + IMPS only", win: "cashfree" },
    { feature: "International Cards", cashfree: "Yes (Visa, MC, Amex)", mymobpay: "Not available", win: "cashfree" },
    { feature: "Subscriptions / Recurring", cashfree: "Native support", mymobpay: "Via webhook logic", win: "cashfree" },
    { feature: "API Documentation", cashfree: "Extensive docs portal", mymobpay: "In-app docs + SDK examples", win: "tie" },
    { feature: "Payment Links", cashfree: "Yes", mymobpay: "Yes", win: "tie" },
    { feature: "Developer Experience", cashfree: "Good", mymobpay: "Excellent — SDKs for 6+ languages", win: "mymobpay" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-white border-b border-slate-200 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-[#533afd]">
            Comparison — MyMobPay vs Cashfree
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
            MyMobPay vs Cashfree:{" "}
            <span className="text-[#533afd]">The fee difference that matters</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Cashfree charges 1.4% + GST on every UPI payment. MyMobPay charges ₹499/month flat.
            At ₹5 Lakhs/month volume, that&apos;s a difference of ₹7,200 every single month.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/login?mode=signup" className="px-6 py-3 bg-[#533afd] hover:bg-[#4434d4] text-white font-semibold rounded-full transition-all shadow-sm text-sm">
              Switch to MyMobPay
            </Link>
            <a href="#savings" className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold rounded-full transition-all text-sm">
              See the Numbers
            </a>
          </div>
        </div>
      </section>

      <section id="savings" className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Monthly Savings Breakdown</h2>
            <p className="text-slate-500 text-sm">Cashfree 1.4% + 18% GST vs MyMobPay flat ₹499</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="grid grid-cols-4 gap-0 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Monthly Volume</span>
              <span className="text-red-600">Cashfree Cost</span>
              <span className="text-emerald-600">MyMobPay Cost</span>
              <span className="text-blue-600">You Save</span>
            </div>
            {savings.map((row, i) => (
              <div key={row.vol} className={`grid grid-cols-4 gap-0 border-b border-slate-100 last:border-0 px-5 py-4 text-sm items-center ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                <span className="font-semibold text-slate-900">{row.vol}</span>
                <span className="text-red-600 font-semibold">{row.cashfree}</span>
                <span className="text-emerald-600 font-semibold">{row.mymobpay}</span>
                <span className="text-blue-600 font-bold">{row.saved}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-12">Feature Comparison</h2>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="grid grid-cols-3 gap-0 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
              <span>Feature</span>
              <span>Cashfree</span>
              <span>MyMobPay</span>
            </div>
            {features.map((f, i) => (
              <div key={f.feature} className={`grid grid-cols-3 gap-0 border-b border-slate-100 last:border-0 px-5 py-4 text-sm items-start ${f.win === "mymobpay" ? "bg-emerald-50/30" : i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                <span className="font-semibold text-slate-900 pr-4">{f.feature}</span>
                <span className={f.win === "cashfree" ? "text-red-600 font-medium" : "text-slate-600"}>
                  {f.cashfree}
                  {f.win === "cashfree" && <span className="ml-1 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">wins</span>}
                </span>
                <span className={f.win === "mymobpay" ? "text-emerald-700 font-semibold" : f.win === "tie" ? "text-slate-500" : "text-slate-600"}>
                  {f.mymobpay}
                  {f.win === "mymobpay" && <span className="ml-1 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">wins</span>}
                  {f.win === "tie" && <span className="ml-1 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">equal</span>}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4 text-center">
            Cashfree pricing is approximate and may vary. Always check cashfree.com for latest rates.
          </p>
        </div>
      </section>

      <section className="py-16 bg-[#0c2340]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready to stop paying per-transaction fees?</h2>
          <p className="text-slate-300 text-base leading-relaxed">
            MyMobPay&apos;s direct-to-bank rail means every rupee you collect goes straight to your account — no intermediaries, no hidden cuts.
          </p>
          <Link href="/login?mode=signup" className="inline-block px-6 py-3 bg-[#533afd] hover:bg-[#4434d4] text-white font-semibold rounded-full transition-all shadow-sm text-sm">
            Get Started — ₹499/month
          </Link>
        </div>
      </section>

      <nav className="max-w-4xl mx-auto px-4 sm:px-6 py-6 text-xs text-slate-400" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-slate-600">Home</Link></li>
          <li>/</li>
          <li><Link href="/compare" className="hover:text-slate-600">Comparisons</Link></li>
          <li>/</li>
          <li className="text-slate-700 font-medium">MyMobPay vs Cashfree</li>
        </ol>
      </nav>
    </div>
  );
}
