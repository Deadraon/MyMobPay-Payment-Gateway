'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Copy, Check, Terminal, Code2, Webhook, ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react';
import { MyMobPayLogoMark } from '@/components/MyMobPayLogo';

export default function DocsClient() {
  const [copiedKey, setCopiedKey] = useState(null);
  const [activeTab, setActiveTab] = useState('curl'); // 'curl' | 'node' | 'python'

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const curlCreateSnippet = `curl -X POST https://mymobpay.tech/api/orders \\
  -H "x-api-key: mmp_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 499.00,
    "customer_name": "Rohan Sharma",
    "customer_phone": "9876543210",
    "customer_email": "rohan@example.com",
    "order_id": "ORDER_2026_1001",
    "notes": "Starter Plan Subscription",
    "callback_url": "https://yourdomain.com/checkout/success"
  }'`;

  const nodeCreateSnippet = `import axios from 'axios';

const createOrder = async () => {
  const response = await axios.post(
    'https://mymobpay.tech/api/orders',
    {
      amount: 499.00,
      customer_name: 'Rohan Sharma',
      customer_phone: '9876543210',
      customer_email: 'rohan@example.com',
      order_id: 'ORDER_2026_1001',
      notes: 'Starter Plan Subscription',
      callback_url: 'https://yourdomain.com/checkout/success'
    },
    {
      headers: {
        'x-api-key': process.env.MYMOBPAY_API_KEY,
        'Content-Type': 'application/json'
      }
    }
  );

  // Return payment link or intent URL
  const { payment_url, upi_intent } = response.data;
  return payment_url;
};`;

  const pythonCreateSnippet = `import requests
import os

url = "https://mymobpay.tech/api/orders"
headers = {
    "x-api-key": os.getenv("MYMOBPAY_API_KEY"),
    "Content-Type": "application/json"
}
payload = {
    "amount": 499.00,
    "customer_name": "Rohan Sharma",
    "customer_phone": "9876543210",
    "customer_email": "rohan@example.com",
    "order_id": "ORDER_2026_1001",
    "notes": "Starter Plan Subscription",
    "callback_url": "https://yourdomain.com/checkout/success"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()
print("Payment URL:", data.get("payment_url"))`;

  const webhookVerifySnippet = `import crypto from 'crypto';

// Next.js API Route / Express Handler
export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-mymobpay-signature');
  const webhookSecret = process.env.MYMOBPAY_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    return new Response('Invalid Signature', { status: 401 });
  }

  const event = JSON.parse(rawBody);
  if (event.status === 'VERIFIED') {
    const { order_id, utr, amount } = event;
    // Fulfill order, activate user access in database
    console.log(\`Payment of ₹\${amount} verified with UTR \${utr}\`);
  }

  return new Response('OK', { status: 200 });
}`;

  return (
    <div className="min-h-screen bg-[#07090E] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0B0E17]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-8 h-8 flex items-center justify-center shrink-0">
              <MyMobPayLogoMark className="w-full h-full" id="docs-nav-logo" />
            </span>
            <span className="font-sans font-extrabold text-xl tracking-tight text-white">
              MyMob<span className="text-[#0F2BFF]">Pay</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-300">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="text-white font-bold">Developers</Link>
            <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs sm:text-sm font-bold text-slate-200 hover:text-white px-3 py-1.5">
              Log in
            </Link>
            <Link href="/login?mode=signup" className="bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full transition-colors">
              Get API Keys
            </Link>
          </div>
        </div>
      </header>

      {/* Docs Layout */}
      <main className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Quick Navigation Sticky Menu */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-24 space-y-6 text-xs text-slate-400">
              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  GETTING STARTED
                </span>
                <ul className="mt-2 space-y-1.5 border-l border-white/10 pl-3">
                  <li><a href="#quickstart" className="hover:text-white transition-colors block py-0.5">Quickstart (5 Mins)</a></li>
                  <li><a href="#authentication" className="hover:text-white transition-colors block py-0.5">API Authentication</a></li>
                  <li><a href="#environments" className="hover:text-white transition-colors block py-0.5">Sandbox vs Production</a></li>
                </ul>
              </div>

              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  CORE ENDPOINTS
                </span>
                <ul className="mt-2 space-y-1.5 border-l border-white/10 pl-3">
                  <li><a href="#create-payment" className="hover:text-white transition-colors block py-0.5">Create Payment Session</a></li>
                  <li><a href="#check-status" className="hover:text-white transition-colors block py-0.5">Check Order Status</a></li>
                </ul>
              </div>

              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  WEBHOOKS & SECURITY
                </span>
                <ul className="mt-2 space-y-1.5 border-l border-white/10 pl-3">
                  <li><a href="#webhooks" className="hover:text-white transition-colors block py-0.5">HMAC Webhook Verification</a></li>
                  <li><a href="#utr-engine" className="hover:text-white transition-colors block py-0.5">UTR Verification Engine</a></li>
                </ul>
              </div>

              <div className="pt-4 border-t border-white/10">
                <Link
                  href="/login?mode=signup"
                  className="w-full py-2.5 rounded-lg bg-[#0F2BFF] text-white font-bold text-center block"
                >
                  Generate Live API Keys
                </Link>
              </div>
            </div>
          </aside>

          {/* Right Column: Documentation Content */}
          <div className="lg:col-span-9 space-y-14">
            {/* Header / Intro */}
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0F2BFF]/15 text-[#60A5FA] font-mono text-xs font-bold uppercase">
                REST API v1 SPECIFICATION
              </span>
              <h1 className="mt-3 text-3xl sm:text-4xl font-black text-white tracking-tight">
                Developer API & Webhook Documentation
              </h1>
              <p className="mt-3 text-base text-slate-400 leading-relaxed">
                Integrate universal UPI QR, intent payments, and real-time bank settlement callbacks into your SaaS application with zero platform commission.
              </p>
            </div>

            {/* Quickstart / Architecture */}
            <section id="quickstart" className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#0F2BFF]" />
                <span>1. Quickstart & Integration Flow</span>
              </h2>
              <div className="bg-[#0E131F] border border-white/10 rounded-xl p-5 text-sm text-slate-300 space-y-3">
                <ol className="list-decimal pl-5 space-y-2 leading-relaxed">
                  <li><strong>Initiate Order:</strong> Send a JSON request from your backend with the order amount, customer details, and your unique order ID.</li>
                  <li><strong>Display Checkout:</strong> Redirect your customer to the generated <code className="text-[#34D399] font-mono">payment_url</code> or render the dynamic UPI QR code on your website.</li>
                  <li><strong>Instant Settlement:</strong> Customer pays via Google Pay, PhonePe, Paytm, or any UPI app directly to your bank account.</li>
                  <li><strong>Webhook Delivery:</strong> MyMobPay verifies the bank settlement UTR and sends an HMAC-signed webhook to your server within seconds.</li>
                </ol>
              </div>
            </section>

            {/* Authentication */}
            <section id="authentication" className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#34D399]" />
                <span>2. Authentication</span>
              </h2>
              <p className="text-sm text-slate-400">
                All requests to MyMobPay APIs must include your API Key in the <code className="bg-white/10 px-2 py-0.5 rounded font-mono text-[#60A5FA]">x-api-key</code> HTTP header.
              </p>
              <div className="bg-black/50 border border-white/10 rounded-xl p-4 font-mono text-xs text-slate-300 flex items-center justify-between">
                <span>x-api-key: mmp_live_your_api_key_here</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('x-api-key: mmp_live_your_api_key_here', 'auth-header')}
                  className="text-slate-400 hover:text-white"
                >
                  {copiedKey === 'auth-header' ? <Check className="w-4 h-4 text-[#34D399]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </section>

            {/* Create Payment Session */}
            <section id="create-payment" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Code2 className="w-5 h-5 text-[#0F2BFF]" />
                  <span>3. Create Payment Session</span>
                </h2>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#0F2BFF]/20 text-[#60A5FA] font-bold">
                  POST /api/orders
                </span>
              </div>

              {/* Language Switcher */}
              <div className="bg-[#0E131F] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                <div className="px-4 py-2 bg-[#141B2D] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('curl')}
                      className={`px-3 py-1 rounded text-xs font-bold font-mono transition-colors ${
                        activeTab === 'curl' ? 'bg-[#0F2BFF] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      cURL
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('node')}
                      className={`px-3 py-1 rounded text-xs font-bold font-mono transition-colors ${
                        activeTab === 'node' ? 'bg-[#0F2BFF] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Node.js
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('python')}
                      className={`px-3 py-1 rounded text-xs font-bold font-mono transition-colors ${
                        activeTab === 'python' ? 'bg-[#0F2BFF] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Python
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const snippet =
                        activeTab === 'curl'
                          ? curlCreateSnippet
                          : activeTab === 'node'
                          ? nodeCreateSnippet
                          : pythonCreateSnippet;
                      copyToClipboard(snippet, 'create-snippet');
                    }}
                    className="text-xs font-mono text-slate-400 hover:text-white inline-flex items-center gap-1.5"
                  >
                    {copiedKey === 'create-snippet' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#34D399]" />
                        <span className="text-[#34D399]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-4 overflow-x-auto bg-[#080B12]">
                  <pre className="font-mono text-xs text-slate-200 leading-relaxed">
                    {activeTab === 'curl' && curlCreateSnippet}
                    {activeTab === 'node' && nodeCreateSnippet}
                    {activeTab === 'python' && pythonCreateSnippet}
                  </pre>
                </div>
              </div>
            </section>

            {/* HMAC Webhook Verification */}
            <section id="webhooks" className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-[#A855F7]" />
                  <span>4. Webhook Signature Verification (HMAC-SHA256)</span>
                </h2>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#A855F7]/20 text-[#C084FC] font-bold">
                  POST /your-webhook-endpoint
                </span>
              </div>
              <p className="text-sm text-slate-400">
                To prevent spoofing attacks, every webhook payload is signed with your secret key using HMAC-SHA256. Verify the header <code className="bg-white/10 px-2 py-0.5 rounded font-mono text-purple-300">x-mymobpay-signature</code> before fulfilling user orders.
              </p>

              <div className="bg-[#0E131F] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                <div className="px-4 py-2 bg-[#141B2D] border-b border-white/10 flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400 font-bold">Next.js / Node.js Verification Example</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookVerifySnippet, 'webhook-snippet')}
                    className="text-xs font-mono text-slate-400 hover:text-white inline-flex items-center gap-1.5"
                  >
                    {copiedKey === 'webhook-snippet' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#34D399]" />
                        <span className="text-[#34D399]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 overflow-x-auto bg-[#080B12]">
                  <pre className="font-mono text-xs text-slate-200 leading-relaxed">
                    {webhookVerifySnippet}
                  </pre>
                </div>
              </div>
            </section>

            {/* Bottom Support Callout */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0F2BFF]/20 to-[#10B981]/20 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-white text-base">Need integration assistance?</h3>
                <p className="text-xs text-slate-400 mt-1">Our engineering team assists founders with custom webhooks and Next.js / Express integrations.</p>
              </div>
              <Link
                href="/login?mode=signup"
                className="bg-[#0F2BFF] hover:bg-[#081EC4] text-white text-xs font-bold px-5 py-2.5 rounded-xl shrink-0 transition-colors"
              >
                Access Merchant Portal
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#07090E] py-12 text-xs text-slate-500 mt-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <MyMobPayLogoMark className="w-5 h-5" id="docs-footer-logo" />
            <span className="font-bold text-slate-300">MyMobPay</span>
            <span>&bull; Developer Payment Infrastructure</span>
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
