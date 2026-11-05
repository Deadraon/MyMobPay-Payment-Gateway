import Link from "next/link";

export const metadata = {
  title: "How to Integrate UPI Payments in Next.js — Step-by-Step Guide",
  description:
    "Learn how to integrate UPI payments into your Next.js application using MyMobPay's REST API. Includes code examples in Node.js, Python, and cURL. Get started in under 15 minutes.",
  alternates: {
    canonical: "https://www.mymobpay.tech/blog/uapi-integration-guide",
  },
  openGraph: {
    title: "UPI Payment Integration in Next.js — Step-by-Step Guide",
    description: "Complete guide to adding UPI payments to your Next.js app with MyMobPay API. Code examples included.",
    url: "https://www.mymobpay.tech/blog/uapi-integration-guide",
    siteName: "MyMobPay",
    locale: "en_IN",
    type: "article",
    authors: [{ name: "Kunal Chauhan", url: "https://www.mymobpay.tech" }],
    publishedTime: "2026-11-01",
    modifiedTime: "2026-11-05",
    tags: ["Next.js", "UPI", "API", "tutorial", "integration"],
    images: [{ url: "/og-banner.png", width: 1200, height: 630, alt: "UPI integration guide for Next.js" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "UPI Payment Integration in Next.js — Step-by-Step",
    description: "Add UPI payments to your Next.js app in under 15 minutes with MyMobPay.",
    images: ["/og-banner.png"],
  },
};

export default function UapiIntegrationGuidePage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-white border-b border-slate-200 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-[#533afd]">
            Tutorial — Integration Guide
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            How to Integrate UPI Payments in{" "}
            <span className="text-[#533afd]">Next.js</span>
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
            <span>By <span className="font-semibold text-slate-700">Kunal Chauhan</span></span>
            <span>·</span>
            <span>Nov 2026</span>
            <span>·</span>
            <span>10 min read</span>
          </div>
          <p className="mt-6 text-base text-slate-600 leading-relaxed">
            Add UPI payment collection to your Next.js application in under 15 minutes.
            This guide covers API integration, webhook setup, and payment verification — no middleware required.
          </p>
        </div>
      </section>

      <article className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 prose prose-slate max-w-none">
          <h2 className="text-2xl font-bold text-slate-900 mt-0">Prerequisites</h2>
          <ul className="list-disc pl-6 space-y-2 text-slate-600">
            <li>A MyMobPay account — <Link href="/login?mode=signup" className="text-[#533afd] hover:underline">sign up free</Link></li>
            <li>API keys from your dashboard (Settings → API Keys)</li>
            <li>Basic familiarity with Next.js App Router and API routes</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">Step 1: Install the SDK</h2>
          <p className="text-slate-600 leading-relaxed">
            MyMobPay provides official SDKs for multiple languages. For Next.js projects, we recommend the Node.js SDK:
          </p>
          <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto">
            <span className="text-slate-500"># Using npm</span><br />
            npm install @mymobpay/node<br /><br />
            <span className="text-slate-500"># Or yarn</span><br />
            yarn add @mymobpay/node
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">Step 2: Initialize the Client</h2>
          <p className="text-slate-600 leading-relaxed">
            Create a singleton client instance in a dedicated module file:
          </p>
          <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto">
            <span className="text-sky-300">{'// lib/mymobpay.js'}</span><br />
            <span className="text-blue-400">import</span> {`{ MyMobPay }`} <span className="text-blue-400">from</span> <span className="text-cyan-300">'@mymobpay/node'</span>;<br /><br />
            <span className="text-blue-400">export const</span> mymobpay = <span className="text-blue-400">new</span> <span className="text-sky-300">MyMobPay</span>({`{`}<br />
            {"  "}apiKey: process.env.<span className="text-amber-300">MYMOBPAY_SECRET_KEY</span>,<br />
            {"  "}webhookSecret: process.env.<span className="text-amber-300">MYMOBPAY_WEBHOOK_SECRET</span>,<br />
            {`}`});
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">Step 3: Create a Payment Order</h2>
          <p className="text-slate-600 leading-relaxed">
            In your Next.js API route, create a payment order when the user checks out:
          </p>
          <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto">
            <span className="text-slate-500">{'// app/api/create-order/route.ts'}</span><br /><br />
            <span className="text-blue-400">import</span> {`{ `}<span className="text-sky-300">NextResponse</span>{` } `}<span className="text-blue-400">from</span> <span className="text-cyan-300">'next/server'</span>;<br />
            <span className="text-blue-400">import</span> {`{ mymobpay }`} <span className="text-blue-400">from</span> <span className="text-cyan-300">'@/lib/mymobpay'</span>;<br /><br />
            <span className="text-blue-400">export async function</span> <span className="text-sky-300">POST</span>(req: <span className="text-sky-300">Request</span>) {<br />
            {"  "}const {`{`} amount, orderId, customerEmail {`} } = <span className="text-blue-400">await</span> req.<span className="text-sky-300">json</span>();<br /><br />
            {"  "}const order = <span className="text-blue-400">await</span> mymobpay.orders.<span className="text-sky-300">create</span>({`{`}<br />
            {"    "}amount,       <span className="text-slate-500">// in paise (e.g., 149900 = ₹1,499)</span><br />
            {"    "}orderId,<br />
            {"    "}customerEmail,<br />
            {"    "}description: <span className="text-cyan-300">'Premium Plan Subscription'</span>,<br />
            {"  "}});<br /><br />
            {"  "}return <span className="text-sky-300">NextResponse</span>.<span className="text-sky-300">json</span>({ qrString: order.qrString, intentUrl: order.intentUrl });<br />
            {`}
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">Step 4: Display the Payment QR / Link</h2>
          <p className="text-slate-600 leading-relaxed">
            The response includes a <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">qrString</code> and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">intentUrl</code>.
            Display the QR code using any QR library, or redirect the customer to the intent URL for an in-app UPI payment experience.
          </p>
          <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto">
            <span className="text-slate-500">// Example: render QR in React</span><br />
            <span className="text-blue-400">import</span> QRCode from <span className="text-cyan-300">'react-qr-code'</span>;<br /><br />
            <span className="text-blue-400">export default function</span> <span className="text-sky-300">PaymentQR</span>({`{ qrString }`}) {<br />
            {"  "}return (<br />
            {"    "}&lt;<span className="text-sky-300">QRCode</span><br />
            {"      "}<span className="text-sky-300">value</span>={qrString}<br />
            {"      "}<span className="text-sky-300">size</span>={256}<br />
            {"      "}<span className="text-sky-300">bgColor</span>=<span className="text-cyan-300">"#FFFFFF"</span><br />
            {"      "}<span className="text-sky-300">fgColor</span>=<span className="text-cyan-300">"#0B192C"</span><br />
            {"    "}/&gt;<br />
            {"  "});<br />
            {`}
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">Step 5: Handle Webhooks for Auto-Verification</h2>
          <p className="text-slate-600 leading-relaxed">
            Set up a webhook endpoint to receive automatic payment notifications. MyMobPay sends HMAC-SHA256 signed events that you should verify before processing.
          </p>
          <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto">
            <span className="text-slate-500">{'// app/api/webhook/route.ts'}</span><br /><br />
            <span className="text-blue-400">import</span> {`{ `}<span className="text-sky-300">NextResponse</span>{` } `}<span className="text-blue-400">from</span> <span className="text-cyan-300">'next/server'</span>;<br />
            <span className="text-blue-400">import</span> {`{ mymobpay }`} <span className="text-blue-400">from</span> <span className="text-cyan-300">'@/lib/mymobpay'</span>;<br /><br />
            <span className="text-blue-400">export async function</span> <span className="text-sky-300">POST</span>(req: <span className="text-sky-300">Request</span>) {<br />
            {"  "}const signature = req.<span className="text-sky-300">headers</span>.<span className="text-sky-300">get</span>(<span className="text-cyan-300">'x-mymobpay-signature'</span>);<br />
            {"  "}const body = <span className="text-blue-400">await</span> req.<span className="text-sky-300">text</span>();<br /><br />
            {"  "}const event = mymobpay.webhooks.<span className="text-sky-300">constructEvent</span>(body, signature);<br /><br />
            {"  "}switch (event.type) {<br />
            {"    "}case <span className="text-cyan-300">'payment.settled'</span>:<br />
            {"      "}console.<span className="text-sky-300">log</span>(<span className="text-cyan-300">`Payment ${event.data.orderId} settled: ₹${event.data.amount}`</span>);<br />
            {"      "}break;<br />
            {"  "}}<br /><br />
            {"  "}return <span className="text-sky-300">NextResponse</span>.<span className="text-sky-300">json</span>({ ok: <span className="text-blue-400">true</span> });<br />
            {`}
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">Environment Variables</h2>
          <p className="text-slate-600 leading-relaxed">
            Add these to your <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">.env.local</code> file:
          </p>
          <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto">
            MYMOBPAY_SECRET_KEY=sec_live_your_api_key_here<br />
            MYMOBPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">cURL Alternative</h2>
          <p className="text-slate-600 leading-relaxed">
            If you prefer not to use the SDK, you can call the REST API directly:
          </p>
          <div className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto">
            curl -X POST https://api.mymobpay.tech/v1/orders \<br />
            {"  "}-H <span className="text-cyan-300">"Authorization: Bearer sec_live_..."</span> \<br />
            {"  "}-H <span className="text-cyan-300">"Content-Type: application/json"</span> \<br />
            {"  "}-d <span className="text-slate-400">'{`{"`}</span><br />
            {"    "}<span className="text-sky-300">"amount"</span>: <span className="text-amber-300">149900</span>,<br />
            {"    "}<span className="text-sky-300">"orderId"</span>: <span className="text-cyan-300">"ORD_2026_001"</span>,<br />
            {"    "}<span className="text-sky-300">"customerEmail"</span>: <span className="text-cyan-300">"user@example.com"</span><br />
            {"  "}<span className="text-slate-400">'}</span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">That&apos;s It</h2>
          <p className="text-slate-600 leading-relaxed">
            You now have a fully functional UPI payment integration in your Next.js app.
            The customer pays via any UPI app, the money arrives in your bank account instantly, and your system receives an automatic webhook notification.
            No middleware, no escrow, no per-transaction fees.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Full API documentation and additional language SDKs (Python, PHP, Flutter, React Native) are available in your MyMobPay dashboard.
          </p>

          <div className="mt-10 p-6 bg-emerald-50 border border-emerald-200 rounded-xl">
            <h3 className="text-lg font-bold text-emerald-900 mt-0">Ready to integrate?</h3>
            <p className="text-emerald-800 mb-4">Get your API keys and start building in minutes.</p>
            <Link href="/login?mode=signup" className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full text-sm transition-all">
              Create Free Account
            </Link>
          </div>
        </div>
      </article>

      <section className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/blog/direct-bank-settlement-vs-aggregator" className="block p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all">
              <span className="text-xs text-[#533afd] font-semibold">Payments Guide</span>
              <h3 className="font-semibold text-slate-900 mt-1">Direct Bank Settlement vs Aggregators</h3>
              <p className="text-sm text-slate-500 mt-2">Why direct UPI settlement is cheaper and faster than Razorpay, Cashfree, and other aggregators.</p>
            </Link>
            <Link href="/blog/payment-gateway-for-saas" className="block p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all">
              <span className="text-xs text-[#533afd] font-semibold">Strategy</span>
              <h3 className="font-semibold text-slate-900 mt-1">Choosing a Payment Gateway for Your SaaS</h3>
              <p className="text-sm text-slate-500 mt-2">Framework for evaluating payment gateways based on your volume, tech stack, and growth stage.</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
