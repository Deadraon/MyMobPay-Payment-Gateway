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
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-xs font-semibold text-[#0284C7]">
            Tutorial — Integration Guide
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            How to Integrate UPI Payments in{" "}
            <span className="text-[#0284C7]">Next.js</span>
          </h1>
          <div className="mt-4 flex items-center gap-4 text-sm text-slate-500">
            <span>By <span className="font-semibold text-slate-700">Kunal Chauhan</span></span>
            <span className="text-slate-300">·</span>
            <span>Nov 2026</span>
            <span className="text-slate-300">·</span>
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
            <li>A MyMobPay account — <Link href="/login?mode=signup" className="text-[#0284C7] hover:underline">sign up free</Link></li>
            <li>API keys from your dashboard (Settings → API Keys)</li>
            <li>Basic familiarity with Next.js App Router and API routes</li>
          </ul>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">Step 1: Install the SDK</h2>
          <p className="text-slate-600 leading-relaxed">
            MyMobPay provides official SDKs for multiple languages. For Next.js projects, we recommend the Node.js SDK:
          </p>
          <pre className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto whitespace-pre">
{`# Using npm
npm install @mymobpay/node

# Or yarn
yarn add @mymobpay/node`}
          </pre>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">Step 2: Initialize the Client</h2>
          <p className="text-slate-600 leading-relaxed">
            Create a singleton client instance in a dedicated module file:
          </p>
          <pre className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto whitespace-pre">
{`// lib/mymobpay.js
import { MyMobPay } from '@mymobpay/node';

export const mymobpay = new MyMobPay({
  apiKey: process.env.MYMOBPAY_SECRET_KEY,
  webhookSecret: process.env.MYMOBPAY_WEBHOOK_SECRET,
});`}
          </pre>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">Step 3: Create a Payment Order</h2>
          <p className="text-slate-600 leading-relaxed">
            In your Next.js API route, create a payment order when the user checks out:
          </p>
          <pre className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto whitespace-pre">
{`// app/api/create-order/route.ts

import { NextResponse } from 'next/server';
import { mymobpay } from '@/lib/mymobpay';

export async function POST(req: Request) {
  const { amount, orderId, customerEmail } = await req.json();

  const order = await mymobpay.orders.create({
    amount,       // in paise (e.g., 149900 = ₹1,499)
    orderId,
    customerEmail,
    description: 'Premium Plan Subscription',
  });

  return NextResponse.json({ qrString: order.qrString, intentUrl: order.intentUrl });
}`}
          </pre>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">Step 4: Display the Payment QR / Link</h2>
          <p className="text-slate-600 leading-relaxed">
            The response includes a <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">qrString</code> and <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">intentUrl</code>.
            Display the QR code using any QR library, or redirect the customer to the intent URL for an in-app UPI payment experience.
          </p>
          <pre className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto whitespace-pre">
{`// Example: render QR in React
import QRCode from 'react-qr-code';

export default function PaymentQR({ qrString }) {
  return (
    <QRCode
      value={qrString}
      size={256}
      bgColor="#FFFFFF"
      fgColor="#0B192C"
    />
  );
}`}
          </pre>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">Step 5: Handle Webhooks for Auto-Verification</h2>
          <p className="text-slate-600 leading-relaxed">
            Set up a webhook endpoint to receive automatic payment notifications. MyMobPay sends HMAC-SHA256 signed events that you should verify before processing.
          </p>
          <pre className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto whitespace-pre">
{`// app/api/webhook/route.ts

import { NextResponse } from 'next/server';
import { mymobpay } from '@/lib/mymobpay';

export async function POST(req: Request) {
  const signature = req.headers.get('x-mymobpay-signature');
  const body = await req.text();

  const event = mymobpay.webhooks.constructEvent(body, signature);

  switch (event.type) {
    case 'payment.settled':
      console.log(\`Payment \${event.data.orderId} settled: ₹\${event.data.amount}\`);
      break;
  }

  return NextResponse.json({ ok: true });
}`}
          </pre>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">Environment Variables</h2>
          <p className="text-slate-600 leading-relaxed">
            Add these to your <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono">.env.local</code> file:
          </p>
          <pre className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto whitespace-pre">
{`MYMOBPAY_SECRET_KEY=sec_live_your_api_key_here
MYMOBPAY_WEBHOOK_SECRET=whsec_your_webhook_secret_here`}
          </pre>

          <h2 className="text-2xl font-bold text-slate-900 mt-12">cURL Alternative</h2>
          <p className="text-slate-600 leading-relaxed">
            If you prefer not to use the SDK, you can call the REST API directly:
          </p>
          <pre className="bg-slate-900 rounded-xl p-5 font-mono text-sm text-slate-200 overflow-x-auto whitespace-pre">
{`curl -X POST https://api.mymobpay.tech/v1/orders \\
  -H "Authorization: Bearer sec_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"amount": 149900, "orderId": "ORD_2026_001", "customerEmail": "user@example.com"}'`}
          </pre>

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
            <Link href="/login?mode=signup" className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-full text-sm transition-colors">
              Create Free Account
            </Link>
          </div>
        </div>
      </article>

      <section className="py-12 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/blog/direct-bank-settlement-vs-aggregator" className="block p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <span className="text-xs text-[#0284C7] font-semibold">Payments Guide</span>
              <h3 className="font-semibold text-slate-900 mt-1">Direct Bank Settlement vs Aggregators</h3>
              <p className="text-sm text-slate-500 mt-2">Why direct UPI settlement is cheaper and faster than Razorpay, Cashfree, and other aggregators.</p>
            </Link>
            <Link href="/blog/payment-gateway-for-saas" className="block p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-colors">
              <span className="text-xs text-[#0284C7] font-semibold">Strategy</span>
              <h3 className="font-semibold text-slate-900 mt-1">Choosing a Payment Gateway for Your SaaS</h3>
              <p className="text-sm text-slate-500 mt-2">Framework for evaluating payment gateways based on your volume, tech stack, and growth stage.</p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
