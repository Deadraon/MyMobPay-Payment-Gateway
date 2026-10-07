<div align="center">

<a href="https://mymob.tech" target="_blank">
  <img src="public/icon.png" alt="MyMobPay Logo" width="96" height="96" />
</a>

# 🚀 MyMobPay
### Zero-Commission UPI Payment Gateway for Indian Businesses

[![Live Demo](https://img.shields.io/badge/Live_Demo-mymob.tech-2563EB?style=for-the-badge)](https://mymob.tech)
[![Merchant Dashboard](https://img.shields.io/badge/Merchant_Dashboard-mymob.tech%2Fdashboard-10B981?style=for-the-badge)](https://mymob.tech/dashboard)
[![Customer Checkout](https://img.shields.io/badge/Checkout-mymob.tech%2Fpay-6366F1?style=for-the-badge)](https://mymob.tech/pay)

> **Presented at Hackathon — October 2026**  
> *Empowering Indian businesses to keep 100% of their revenue*

<br />

<a href="https://mymob.tech" target="_blank">
  <img src="public/og-banner.png" alt="MyMobPay Platform Showcase" width="750" />
</a>

</div>

---

## 💡 The Problem

Every month, India processes over **14 Billion UPI transactions** — all at **zero cost** between banks.

Yet small businesses, SaaS startups, freelancers, and digital creators lose **2% to 3% + 18% GST** on every single rupee they earn when they use traditional payment aggregators like Razorpay, Cashfree, or PayU.

On a business doing ₹10,00,000/month, that's **₹20,000–₹30,000 lost every month** — for life.

That's not a payment fee. That's a **permanent tax on small business revenue.**

---

## ✅ Our Solution — MyMobPay

**MyMobPay** is a B2B SaaS Payment Infrastructure that lets Indian businesses accept UPI payments at **0% commission**, with **instant settlement** directly into their own bank account.

No middlemen. No escrow. No delays. No account freezes.

> **"The money goes straight from the customer's bank to the merchant's bank — MyMobPay is just the intelligent layer that confirms it happened."**

---

## ⚡ How It Works

```
Customer Opens Checkout
        │
        ▼
  Dynamic QR Code (Desktop)        or        1-Click Deep Link (Mobile)
  [Scan with any UPI app]                    [Google Pay / PhonePe / Paytm / BHIM]
        │
        ▼
  Customer Pays via their UPI App
        │
        ▼
  Money credits directly to Merchant's Bank ← No intermediary holds funds
        │
        ▼
  MyMobPay's Proprietary Reconciliation Engine
  confirms the payment in under 2 seconds ⚡
        │
        ▼
  Customer sees ✅ Success  |  Merchant sees 📊 Revenue Updated
```

<p align="center">
  <img src="public/how_it_works_flow.jpg" alt="How It Works Flow" width="700" />
</p>

Our core reconciliation technology is proprietary and patent-pending.

---

## ✨ Product Features

### 👤 For Customers
| Feature | Description |
|---|---|
| **Smart Dual-Screen Checkout** | QR code on desktop, native app deep-links on mobile |
| **One-Click Payments** | GPay, PhonePe, Paytm, BHIM — no typing, no friction |
| **Multiple Payment Methods** | UPI, Bank Transfer (IMPS/NEFT), Crypto (USDT TRC-20) |
| **Real-Time Status** | Live payment confirmation screen with instant receipt |
| **Branded Experience** | Custom colors, business logo, and merchant branding |
| **Instant Invoice** | Auto-generated receipt downloadable immediately after payment |

### 🏢 For Merchants
| Feature | Description |
|---|---|
| **Zero Commission (0% MDR)** | Keep 100% of every rupee you earn |
| **Instant Settlement** | Money in your bank the moment customer pays |
| **SaaS Dashboard** | Real-time revenue analytics, transaction ledger, export |
| **Payment Links** | Generate shareable payment links in seconds |
| **Multi-Channel Verification** | SMS + Email + Push Notification redundancy |
| **Developer Webhooks** | Get notified the moment a payment is verified |
| **Sandbox Mode** | Full test environment — simulate payments without real money |
| **Coupon/Discount Engine** | Run promotions and discount codes on checkout |

### 🔒 Security & Compliance
| Feature | Description |
|---|---|
| **Anti-Fraud Engine** | Proprietary duplicate-payment detection system |
| **HMAC-Signed Webhooks** | Cryptographically signed payment notifications |
| **Zero Data Custody** | We never hold, touch, or store customer bank credentials |
| **PCI-DSS Exempt by Design** | Non-custodial architecture — no card/PIN data ever stored |
| **IP Rate Limiting** | Automatic DDoS and abuse protection |
| **Role-Based Access** | Super Admin, Staff, and Cashier permission tiers |

---

## 🆚 Why Not Just Use Razorpay?

| | Traditional Gateways | **MyMobPay** |
|---|---|---|
| **Commission** | 2%–3% + 18% GST | **0% (Zero Commission)** |
| **Settlement** | T+1 / T+2 Days | **Instant** |
| **Verification** | Aggregator-controlled | **Automated (< 2 seconds)** |
| **Fund Custody** | Held in gateway escrow | **Direct bank-to-bank** |
| **Account Freezes** | Frequent on high volume | **None** |
| **KYC Friction** | Complex, strict | **Minimal** |
| **Pricing** | Variable % on every rupee | **Flat monthly SaaS** |

---

## 💰 Business Model

MyMobPay operates on a **flat-fee B2B SaaS subscription** model:

- Merchants pay a **small flat monthly fee** (e.g., ₹499/month)
- In return, they get **unlimited transactions at 0% commission**
- A merchant doing just ₹25,000/month in volume **saves more than the subscription cost on Day 1**

> **Unit Economics:** A merchant doing ₹5,00,000/month pays ₹499 to us vs. ₹10,000–₹15,000 to a traditional gateway. That's a **20–30x saving** for the merchant.

---

## 🛠️ Technology Stack

Built with production-grade, modern technology:

| Layer | Technology |
|---|---|
| **Web App** | Next.js 14 (App Router) — deployed on Vercel |
| **Frontend** | React 18, Tailwind CSS, Recharts, react-qr-code |
| **Database** | Supabase (Managed PostgreSQL with Row-Level Security) |
| **Edge Infrastructure** | Cloudflare Workers (Global Edge Network) |
| **Authentication** | Multi-channel OTP (Email, WhatsApp, Telegram) |
| **Security** | HMAC SHA-256, PostgreSQL constraints, IP rate limiting |

---

## 🌐 Live Product

The product is **live and working** at [mymob.tech](https://mymob.tech).

- 🛒 **Customer Checkout**: [mymob.tech/pay](https://mymob.tech/pay)
- 📊 **Merchant Dashboard**: [mymob.tech/dashboard](https://mymob.tech/dashboard)

---

## 📈 Market Opportunity

- **India UPI Volume**: 14+ Billion transactions/month (~₹20 Lakh Crore)
- **Target Segment**: 6.3 Crore MSMEs + 2 Lakh+ SaaS/digital businesses in India
- **Addressable Market**: Every business currently paying 2%–3% MDR to aggregators
- **Entry Point**: Thin-margin digital businesses, SaaS startups, content creators, freelancers

---

## 🗺️ Pages & Navigation

| URL | Description |
|---|---|
| `/` | Landing page |
| `/pay` | Customer payment checkout |
| `/status/[orderId]` | Live payment status tracker |
| `/dashboard` | Merchant control panel |
| `/login` | Merchant authentication |

---

## 🔮 Roadmap

- [ ] **AI Fraud Detection** — ML model for anomalous transaction pattern alerts
- [ ] **IoT Sound Box** — 4G/Bluetooth retail counter audio confirmation device
- [ ] **WooCommerce & Shopify Plugins** — One-click e-commerce integration
- [ ] **Cross-Border UPI** — Multi-currency support (AED, USD, EUR)
- [ ] **Native Mobile SDK** — Embedded iOS/Android checkout widget
- [ ] **Multi-VPA Failover** — Automatic UPI ID rotation to bypass velocity limits

---

## 👥 Team

Built for the **October 2026 Hackathon** — a full-stack fintech startup from concept to live product.

---

## 📬 Contact & Collaboration

Interested in partnering, investing, or integrating?

> 🌐 [mymob.tech](https://mymob.tech) | 📧 hello@mymob.tech

---

<div align="center">

*Built with ❤️ in India*  
*© MyMobPay 2026 — All Rights Reserved*  
*Core reconciliation technology is proprietary and confidential.*

</div>
