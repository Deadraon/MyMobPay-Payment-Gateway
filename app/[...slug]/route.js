import { NextResponse } from 'next/server';

const MARKDOWN_PAGES = {
  '/': `# MyMobPay — UPI Payment Gateway for SaaS Founders

Direct-to-bank UPI payment gateway with **0% transaction fees**. Accept instant UPI payments with real-time automated verification, signed HMAC webhooks, and direct bank settlement.

## Key Features

- **0% Gateway Fees** — Flat ₹499/month subscription, no per-transaction charges
- **Direct Bank Settlement** — T+0 instant credit via IMPS/UPI, no escrow hold
- **Auto-Verification** — Bank email notifications parsed via Cloudflare Workers for real-time payment confirmation
- **HMAC-SHA256 Webhooks** — Cryptographically signed event notifications with automated retries
- **Developer-First** — Typed SDKs for Next.js, Node.js, Python, PHP, Flutter, React Native
- **Sandbox Environment** — Free isolated testing with live checkout simulation

## Quick Start

\`\`\`bash
curl -X POST https://api.mymobpay.tech/v1/orders \\
  -H "Authorization: Bearer sec_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 149900,
    "currency": "INR",
    "orderId": "ORD_2026_001",
    "customerVpa": "customer@okhdfcbank",
    "settlementRoute": "direct_bank"
  }'
\`\`\`

## Supported UPI Applications

All standard UPI apps: Google Pay, PhonePe, Paytm, BHIM, Amazon Pay, WhatsApp Pay, and any UPI-compatible application via QR code or direct payment intent.

## Links

- [Home](https://mymobpay.tech/)
- [Login / Sign Up](https://mymobpay.tech/login)
- [Developer Documentation](https://mymobpay.tech/#developer-section)
- [Pricing](https://mymobpay.tech/#pricing-section)
- [Terms of Service](https://mymobpay.tech/terms)
- [Privacy Policy](https://mymobpay.tech/privacy)

## Schema.org Types Implemented

- \`WebSite\` — Site identity and name
- \`Organization\` — Company details, logo, contact point
- \`SoftwareApplication\` — Product details, pricing, features
- \`FAQPage\` — Common questions
- \`SiteNavigationElement\` — Key navigation for sitelinks
`,

  '/login': `# MyMobPay — Login / Sign Up

Access your merchant dashboard, API keys, and settings.

## Authentication Methods

- **Magic Link** — Passwordless email authentication
- **Email + Password** — Traditional credentials
- **Google SSO** — One-click sign in with Google

## After Login

- Real-time payment monitoring
- Webhook delivery logs
- Settlement analytics
- API key management
- Sandbox testing environment
`,

  '/terms': `# Terms of Service

Last updated: November 2026

## 1. Acceptance of Terms

By accessing and using MyMobPay services, you agree to be bound by these Terms of Service.

## 2. Service Description

MyMobPay provides a direct-to-bank UPI payment gateway infrastructure enabling merchants to accept UPI payments with 0% transaction fees.

## 3. Merchant Responsibilities

- Maintain valid KYC and business registration
- Secure API credentials and webhook secrets
- Comply with RBI/UPI guidelines and applicable laws

## 4. Fees and Billing

- Monthly subscription: ₹499/month (flat rate)
- 0% transaction fees on all UPI payments
- No setup fees, no hidden charges

## 5. Settlement

- Direct bank settlement via IMPS/UPI rails
- T+0 instant credit to designated bank account
- No escrow hold period

## 6. Limitation of Liability

MyMobPay is not liable for indirect, incidental, or consequential damages arising from service use.

## 7. Governing Law

These terms are governed by the laws of India. Disputes subject to Mumbai jurisdiction.
`,

  '/privacy': `# Privacy Policy

Last updated: November 2026

## Data We Collect

- **Account Data**: Email, business name, bank account details for settlement
- **Transaction Data**: Order amounts, UPI IDs, timestamps, settlement status
- **Technical Data**: IP address, user agent, request logs for security

## How We Use Data

- Process payments and settlements
- Send webhook notifications
- Provide analytics and reporting
- Comply with legal obligations

## Data Sharing

We do not sell personal data. Data may be shared with:
- Banking partners for settlement
- Cloudflare for email processing
- Supabase for authentication
- Legal authorities when required

## Your Rights

- Access, rectify, or delete your data
- Withdraw consent where applicable
- Data portability requests

## Security

- AES-256 encryption at rest
- TLS 1.3 in transit
- HMAC-SHA256 webhook signatures
- Regular security audits
`,

  '/#developer-section': `# Developer Documentation

## SDKs & Libraries

Official typed libraries for:
- **Next.js** — \`npm install @mymobpay/next\`
- **Node.js** — \`npm install @mymobpay/node\`
- **Python** — \`pip install mymobpay\`
- **PHP** — \`composer require mymobpay/php\`
- **Flutter** — \`flutter pub add mymobpay\`
- **React Native** — \`npm install @mymobpay/react-native\`

## REST API Endpoints

### Create Order
\`\`\`http
POST /v1/orders
Authorization: Bearer sec_live_...
Content-Type: application/json

{
  "amount": 149900,
  "currency": "INR",
  "orderId": "ORD_2026_001",
  "customerVpa": "customer@okhdfcbank",
  "settlementRoute": "direct_bank"
}
\`\`\`

### Get Order Status
\`\`\`http
GET /v1/orders/{orderId}
Authorization: Bearer sec_live_...
\`\`\`

### Webhook Endpoint
\`\`\`http
POST /v1/webhooks/settlement
X-Mymobpay-Signature: sha256=...
Content-Type: application/json

{
  "event": "payment.settled",
  "utr": "329184029182",
  "net": 1499.00,
  "fee": 0.00,
  "route": "direct_bank"
}
\`\`\`

## Webhook Verification

\`\`\`javascript
import crypto from 'crypto';

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === \`sha256=\${expected}\`;
}
\`\`\`

## Sandbox Environment

- Base URL: \`https://sandbox.mymobpay.tech/v1\`
- Free isolated testing with simulated payments
- Test webhook delivery via dashboard
`,

  '/#pricing-section': `# Pricing

## Simple, Flat Pricing

### Developer Free
- **₹0/month**
- Sandbox environment
- Isolated testing API key
- Interactive dynamic checkout screen
- Simulated webhook dispatches

### Standard
- **₹499/month** (fixed, no transaction fees)
- Live payments with direct bank settlement
- Real-time dashboard & analytics
- HMAC-SHA256 signed webhooks
- Multi-merchant support
- Priority support

## Savings Calculator

| Monthly Volume | Traditional (2% + 18% GST) | MyMobPay | Monthly Savings |
|----------------|---------------------------|----------|-----------------|
| ₹1 Lakh        | ₹2,360                    | ₹499     | ₹1,861 (79%)    |
| ₹5 Lakh        | ₹11,800                   | ₹499     | ₹11,301 (96%)   |
| ₹25 Lakh       | ₹59,000                   | ₹499     | ₹58,501 (99%)   |

*Traditional gateways charge 2% + 18% GST per transaction. MyMobPay charges a flat monthly fee with 0% transaction fees.*
`,
};

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const slugArray = resolvedParams?.slug || [];
  const rawPath = '/' + slugArray.join('/');

  const isDirectMdFile = rawPath.endsWith('.md');
  let cleanPath = rawPath;

  if (isDirectMdFile) {
    cleanPath = rawPath.slice(0, -3); // remove .md
    if (cleanPath === '' || cleanPath === '/') {
      cleanPath = '/';
    } else if (cleanPath === '/developer-section') {
      cleanPath = '/#developer-section';
    } else if (cleanPath === '/pricing-section') {
      cleanPath = '/#pricing-section';
    }
  }

  const accept = request.headers.get('accept') || '';
  const wantsMarkdown = isDirectMdFile || accept.includes('text/markdown') || accept.includes('text/x-markdown');

  const markdownContent = MARKDOWN_PAGES[cleanPath] || MARKDOWN_PAGES[rawPath];

  if (wantsMarkdown && markdownContent) {
    return new NextResponse(markdownContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // Not found or not requesting markdown
  return new NextResponse(null, { status: 404 });
}