# MyMobPay — Zero-Commission B2B UPI Payment Gateway & SaaS 🚀

> 🌐 **Live Website**: [mymob.tech](https://mymob.tech)
> 📊 **Merchant Dashboard**: [mymob.tech/dashboard](https://mymob.tech/dashboard)
> 💳 **Customer Payment Page**: [mymob.tech/pay](https://mymob.tech/pay)

---

## 💡 What is MyMobPay?

**MyMobPay** is a premium, full-stack B2B SaaS UPI Payment Gateway built for modern Indian businesses, merchants, and developers. It enables businesses to **bypass traditional payment aggregators entirely** — achieving **0% MDR (zero commission)** on every transaction by facilitating direct peer-to-peer (P2P) UPI payments bank-to-bank.

### How it Works (Core Flow):
1. **Order Creation**: Merchant or checkout page calls `POST /api/orders` → backend assigns a unique paise-offset amount and stores order in database.
2. **QR & Deep-Link Generation**: Customer sees a dynamic QR code (desktop) or native 1-click app deep-link buttons (mobile — GPay, PhonePe, Paytm, BHIM).
3. **Customer Pays**: Customer completes payment in their UPI app → funds credit **instantly and directly** to the merchant's bank account.
4. **Automated SMS Reconciliation (The Secret Sauce)**: Merchant's Android phone receives the bank's credit SMS → Background SMS Forwarder app posts the SMS to `POST /api/webhook/sms` → Regex engine parses amount + 12-digit UTR → Matches pending order → Updates status to `verified` in under **2 seconds**.
5. **Real-Time Customer Confirmation**: Customer's status page auto-polls and updates to a green success screen with invoice generation and confetti animation.

---

## ✨ Feature Highlights

| Feature | Description |
|---|---|
| **0% MDR** | Zero commission on every transaction — direct bank-to-bank P2P UPI |
| **Paise-Offset Collision Avoidance** | Unique algorithm to handle concurrent same-amount orders |
| **Multi-Bank SMS Parser** | Regex engine for SBI, HDFC, ICICI, Axis, IOB, and generic UPI SMS |
| **Dual-Screen UX** | QR Code on desktop, native deep-links (GPay/PhonePe/Paytm/BHIM) on mobile |
| **Cloudflare Email Ingestion** | Bank confirmation emails forwarded to `<apiKey>@mymob.tech` as backup |
| **Multi-Channel Webhooks** | SMS + Email + Push Notification redundancy for order verification |
| **Outbound Webhook Dispatch** | HMAC SHA-256 signed `payment.verified` events to merchant backends |
| **Merchant SaaS Dashboard** | Real-time analytics, transaction ledger, payment links, settings |
| **Sandbox / Test Mode** | Full test environment with simulated payment verification |
| **Role-Based Auth** | Multi-tier: Super Admin, Staff, Cashier access levels |
| **Anti-Fraud Engine** | UTR uniqueness constraint, HMAC secrets, IP rate limiting |
| **Crypto Checkout** | USDT (TRC-20) with live INR-to-USDT conversion |
| **Bank Transfer Mode** | IMPS/NEFT with account number + IFSC display |
| **WhatsApp OTP Login** | Phone-based authentication via WhatsApp OTP |
| **Invoice Generation** | Auto-generated branded PDF/HTML invoices for verified orders |
| **Coupon/Discount System** | Merchant-configurable discount codes on checkout |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, Serverless API Routes) |
| **Frontend** | React 18, Tailwind CSS v3, Lucide Icons, `react-qr-code`, `canvas-confetti`, Recharts |
| **Database** | Supabase (Managed PostgreSQL) with Row-Level Security (RLS) |
| **Email Ingestion** | Cloudflare Workers (Edge Email Routing daemon) |
| **Outbound Mail** | Nodemailer (invoice & OTP email delivery) |
| **Security** | Node.js Crypto (HMAC SHA-256), IP Rate Limiter, PostgreSQL UNIQUE constraints |
| **Mobile Daemon** | Android Background SMS Forwarder (BroadcastReceiver) |
| **Deployment** | Vercel (Next.js app) + Cloudflare Workers (email daemon) |

---

## 📂 Complete Project Structure

```
upi-payment-gateway/
│
├── app/                                  # Next.js 14 App Router
│   ├── page.js                           # Root redirect → /pay
│   ├── layout.js                         # Global HTML shell, fonts, SEO meta
│   ├── globals.css                       # Global CSS variables and Tailwind base styles
│   ├── loading.js                        # Global loading spinner component
│   ├── error.js                          # Global error boundary component
│   ├── not-found.js                      # 404 Not Found page
│   ├── global-error.js                   # Critical top-level error handler
│   ├── robots.js                         # Auto-generated robots.txt
│   ├── sitemap.js                        # Auto-generated sitemap.xml
│   │
│   ├── pay/
│   │   └── page.jsx                      # ★ Customer Checkout Page
│   │                                     #   - Detects device (desktop/mobile)
│   │                                     #   - Creates order, renders QR or deep-link
│   │                                     #   - Polls order status in real-time
│   │
│   ├── status/
│   │   └── [orderId]/
│   │       └── page.jsx                  # Live Payment Status Page
│   │                                     #   - Polls /api/orders?id=X every 5s
│   │                                     #   - Shows Pending / Verified / Rejected states
│   │
│   ├── dashboard/
│   │   └── page.jsx                      # ★ Merchant SaaS Dashboard
│   │                                     #   - Revenue analytics (Recharts)
│   │                                     #   - Transaction ledger with filters
│   │                                     #   - Payment Links generator
│   │                                     #   - Settings, Subscription, Staff management
│   │
│   ├── admin/
│   │   └── page.jsx                      # Super-Admin Console
│   │                                     #   - Platform-level metrics
│   │                                     #   - Manual verify/reject overrides
│   │                                     #   - Merchant management
│   │
│   ├── login/
│   │   └── page.jsx                      # Merchant Login (Email OTP / WhatsApp OTP)
│   │
│   ├── privacy/                          # Privacy Policy page
│   ├── terms/                            # Terms of Service page
│   │
│   └── api/                              # ★ Serverless API Routes
│       ├── orders/
│       │   ├── route.js                  # POST: Create order  |  GET: Fetch order by ID
│       │   ├── check-status/route.js     # GET: Quick status check for polling
│       │   ├── simulate/route.js         # POST: Simulate verify/reject (sandbox only)
│       │   ├── verify-utr/route.js       # POST: Manual customer UTR submission
│       │   ├── verify-crypto/route.js    # POST: Verify USDT crypto payment by TxHash
│       │   └── confirm-cod/route.js      # POST: Confirm Cash-on-Delivery order
│       │
│       ├── webhook/
│       │   ├── sms/route.js              # ★ POST: Android SMS Forwarder webhook
│       │   ├── email/route.js            # POST: Cloudflare Email Worker relay
│       │   └── notification/route.js     # POST: Android push notification webhook
│       │
│       ├── auth/
│       │   ├── register/route.js         # POST: Merchant registration & onboarding
│       │   ├── email-otp/route.js        # POST: Send/Verify email OTP
│       │   ├── email-link/route.js       # POST: Magic email link auth
│       │   ├── whatsapp-otp/route.js     # POST: WhatsApp OTP send/verify
│       │   ├── firebase-otp/route.js     # POST: Firebase phone OTP
│       │   └── telegram-otp/route.js     # POST: Telegram OTP
│       │
│       ├── merchant/
│       │   ├── route.js                  # GET/PATCH: Merchant profile CRUD
│       │   ├── staff/route.js            # GET/POST/DELETE: Staff member management
│       │   ├── test-webhook/route.js     # POST: Fire test webhook to merchant endpoint
│       │   └── subscription/
│       │       └── activate/route.js     # POST: Activate merchant subscription
│       │
│       ├── coupons/
│       │   └── apply/route.js            # POST: Validate & apply discount coupon code
│       │
│       ├── payments/
│       │   ├── pending/route.js          # POST: Transition order to 'pending' state
│       │   └── utr/route.js             # POST: UTR-based payment lookup
│       │
│       ├── cron/                         # Scheduled maintenance jobs
│       │
│       └── admin/
│           ├── login/route.js            # POST: Admin password authentication
│           ├── orders/route.js           # POST: Manual admin verify/reject
│           ├── merchants/route.js        # GET: List all merchants (super admin)
│           ├── settings/route.js         # GET/POST: Platform admin settings
│           ├── subscriptions/route.js    # POST: Manage merchant subscriptions
│           └── migrate/route.js          # POST: Database migration runner
│
├── components/                           # Reusable React Components
│   ├── DesktopCheckoutView.jsx           # ★ Full desktop QR checkout UI
│   │                                     #   - Multi-tab: UPI / Bank Transfer / Crypto
│   │                                     #   - Timer countdown, copy-to-clipboard
│   │                                     #   - EN/HI language toggle
│   ├── ConsoleActivationPaywall.jsx      # Subscription paywall modal
│   ├── DashboardOverviewRedesign.jsx     # Revenue overview cards & charts
│   ├── InteractiveBackground.jsx         # Animated canvas background effect
│   ├── MerchantOnboardingWizard.jsx      # Step-by-step merchant setup wizard
│   ├── MyMobPayLogo.jsx                  # Brand logo SVG component
│   ├── PaymentLinksRedesign.jsx          # Payment link generator & manager
│   ├── SettingsRedesign.jsx              # Merchant settings panel (UPI, Bank, Crypto, Webhooks)
│   ├── SubscriptionRedesign.jsx          # Subscription plans & billing UI
│   └── TransactionsRedesign.jsx          # Transaction table with search & export
│
├── lib/                                  # Shared backend utilities
│   ├── config.js                         # ★ Central business config (UPI ID, theme, fees)
│   ├── supabase.js                       # Supabase client factory (public + admin service role)
│   ├── parseSms.js                       # ★ Multi-bank SMS/email regex parser engine
│   ├── orderId.js                        # Cryptographically secure Order ID generator
│   ├── rateLimit.js                      # Sliding-window IP rate limiter
│   ├── webhook.js                        # Outbound HMAC-signed webhook dispatcher
│   ├── adminSettings.js                  # Admin/subscription management helpers
│   ├── invoiceGenerator.js               # Branded invoice PDF/HTML generator
│   └── mailer.js                         # Nodemailer email delivery (OTP + invoices)
│
├── cloudflare-worker/                    # Cloudflare Edge Email Daemon
│   ├── worker.js                         # Email routing worker (MIME decoder + relay)
│   └── wrangler.toml                     # Cloudflare Worker deployment config
│
├── public/                               # Static assets (logos, icons, images)
│
├── supabase_saas_migration.sql           # ★ Core DB schema (merchants, orders, RLS)
├── supabase_bank_transfer_migration.sql  # Bank account columns migration
├── supabase_crypto_cod_migration.sql     # Crypto wallet & COD columns migration
├── supabase_staff_migration.sql          # Staff gateway pool migration
├── supabase_profile_migration.sql        # Extended merchant profile columns
├── supabase_whatsapp_otp_migration.sql   # WhatsApp OTP table migration
│
├── .env.local                            # ⚠️ Private secrets (never commit to git)
├── next.config.mjs                       # Next.js config (security headers, CORS)
├── tailwind.config.js                    # Tailwind CSS theme configuration
├── jsconfig.json                         # JS path aliases (@/ → root)
├── vercel.json                           # Vercel deployment overrides
└── package.json                          # Dependencies & npm scripts
```

---

## ⚙️ Dependencies

```json
{
  "dependencies": {
    "next": "14.2.35",
    "react": "^18",
    "react-dom": "^18",
    "@supabase/supabase-js": "^2.106.1",
    "lucide-react": "^1.16.0",
    "nodemailer": "^9.0.5",
    "react-qr-code": "^2.0.21",
    "recharts": "^3.8.1"
  },
  "devDependencies": {
    "eslint": "^8",
    "eslint-config-next": "14.2.35",
    "postcss": "^8",
    "tailwindcss": "^3.4.1"
  }
}
```

---

## 🚀 Setup & Installation

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-username/upi-payment-gateway.git
cd upi-payment-gateway

# Install all Node.js dependencies
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the `upi-payment-gateway/` root:

```env
# ── Supabase Configuration ──────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_public_anon_key
SUPABASE_SERVICE_KEY=your_private_service_role_key   # Required for server-side RLS bypass

# ── Platform Authentication ──────────────────────────────────────────
ADMIN_PASSWORD=your_super_admin_password             # Unlocks /admin console
WEBHOOK_SECRET=your_webhook_secret_string            # Shared secret for SMS forwarder auth

# ── Email (Nodemailer) ───────────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_app_password                          # Gmail App Password (not account password)
```

### 3. Run Development Server

```bash
npm run dev
# App will be available at http://localhost:3000
```

### 4. Build for Production

```bash
npm run build
npm run start
```

### 5. Lint Code

```bash
npm run lint
```

---

## 🗄️ Database Setup (Supabase)

Run the following SQL scripts **in order** in your [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql):

### Step 1 — Core Schema (Run First)

```sql
-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,           -- Format: MMP_YYYYMMDD_<12-char base62>
  merchant_id UUID,
  amount NUMERIC NOT NULL,
  method TEXT DEFAULT 'GENERIC',
  note TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'verified' | 'rejected' | 'expired'
  utr TEXT UNIQUE,               -- ★ UNIQUE prevents replay/double-spend attacks
  customer_name TEXT,
  customer_phone TEXT,
  project TEXT,
  callback_url TEXT,
  external_ref TEXT,
  mode TEXT DEFAULT 'live',      -- 'live' | 'test'
  created_at TIMESTAMP DEFAULT now(),
  verified_at TIMESTAMP
);

-- Performance index for webhook lookup (amount + status)
CREATE INDEX idx_orders_status_amount ON orders (status, amount);

-- Merchants table
CREATE TABLE IF NOT EXISTS public.merchants (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  upi_id TEXT NOT NULL,
  api_key UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  webhook_url TEXT,
  subscription_status TEXT DEFAULT 'active',
  subscription_expires_at TIMESTAMP WITH TIME ZONE,
  theme_color TEXT DEFAULT '#3B82F6',
  sandbox_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable Row-Level Security
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Merchants can view their own profile" ON public.merchants FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Merchants can update their own profile" ON public.merchants FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Merchants can view their own orders" ON public.orders FOR SELECT USING (auth.uid() = merchant_id);
CREATE POLICY "Anyone can insert an order" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view order status" ON public.orders FOR SELECT USING (true);
```

### Step 2 — Extended Merchant Profile

```sql
-- supabase_profile_migration.sql
ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS gstin TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_category TEXT;
```

### Step 3 — Bank Transfer Support

```sql
-- supabase_bank_transfer_migration.sql
ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS enable_bank_transfer BOOLEAN DEFAULT true;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_utr TEXT;
```

### Step 4 — Crypto & COD Support

```sql
-- supabase_crypto_cod_migration.sql
ALTER TABLE public.merchants
ADD COLUMN IF NOT EXISTS crypto_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS crypto_network TEXT DEFAULT 'USDT (TRC-20)',
ADD COLUMN IF NOT EXISTS enable_crypto BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_cod BOOLEAN DEFAULT true;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_details JSONB,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';
```

### Step 5 — Staff Gateway Pool

```sql
-- supabase_staff_migration.sql
CREATE TABLE IF NOT EXISTS public.staff_gateway_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,           -- 'gpay' | 'phonepe' | 'paytm'
  is_active BOOLEAN DEFAULT true,
  current_merchant_count INTEGER DEFAULT 0,
  max_merchants_limit INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);
```

### Step 6 — WhatsApp OTP Login

```sql
-- supabase_whatsapp_otp_migration.sql
CREATE TABLE IF NOT EXISTS public.whatsapp_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  otp_hash TEXT NOT NULL,           -- SHA-256 hash (never store plaintext OTP)
  purpose TEXT NOT NULL DEFAULT 'login',
  attempts INT NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_otps_phone ON public.whatsapp_otps(phone);
ALTER TABLE public.whatsapp_otps ENABLE ROW LEVEL SECURITY;
```

---

## ⚙️ Business Configuration (`lib/config.js`)

```js
export const CONFIG = {
  businessName: "MyMobPay",              // Platform display name
  upiId: "your-merchant-upi-id@bank",   // Default UPI VPA for receiving payments
  themeColor: "#2563EB",                 // Primary brand color (HEX)
  quickAmounts: [500, 1000, 2000, 5000], // Quick-select amount buttons on checkout

  // Webhook Security
  webhookSecret: "your_webhook_secret",  // Pre-shared secret for SMS forwarder auth

  // SaaS Platform Billing
  platformApiKey: "your-admin-uuid",     // Admin merchant account UUID (bypasses subscription check)
  subscriptionFee: 499,                  // Monthly fee in INR

  // Crypto Checkout
  defaultCryptoWallet: "TYour...Wallet", // TRC-20 USDT wallet address
  defaultCryptoNetwork: "USDT (TRC-20)",
  usdtInrRate: 90                        // 1 USDT = ₹90 (update periodically)
};
```

---

## 📡 API Reference

### Orders

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/orders` | Create a new payment order |
| `GET` | `/api/orders?id=MMP_...` | Fetch order details and status |
| `GET` | `/api/orders/check-status?id=MMP_...` | Lightweight status poll |
| `POST` | `/api/orders/verify-utr` | Customer submits UTR manually |
| `POST` | `/api/orders/simulate` | Simulate payment (sandbox mode only) |
| `POST` | `/api/orders/verify-crypto` | Verify USDT crypto TxHash |
| `POST` | `/api/orders/confirm-cod` | Confirm Cash-on-Delivery |

#### `POST /api/orders` — Create Order

```json
{
  "api_key": "live_your-merchant-api-key",
  "amount": 500,
  "method": "UPI",
  "note": "Premium Plan - 1 Month",
  "customer_name": "Rahul Sharma",
  "customer_phone": "9876543210",
  "external_ref": "your-internal-invoice-id",
  "callback_url": "https://yoursite.com/payment-success"
}
```

**Response:**
```json
{
  "orderId": "MMP_20261007_X8kQ9zR2x1Ab",
  "orderAmount": 500.01,
  "mode": "live"
}
```

> **Note:** `orderAmount` may differ from `amount` by a fraction of a rupee due to the **Paise-Offset Collision Avoidance Algorithm** (see Core Algorithms section).

---

### Webhooks (Inbound)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/webhook/sms` | Android SMS Forwarder → bank credit SMS |
| `POST` | `/api/webhook/email` | Cloudflare Worker → bank credit email |
| `POST` | `/api/webhook/notification` | Android push notification → bank credit alert |

#### `POST /api/webhook/sms` — SMS Webhook Payload

```json
{
  "secret": "your_webhook_secret",
  "message": "Dear Customer, your a/c no. XXXXXX1234 is credited by Rs. 500.01 on 07-10-2026 by UPI Ref No 612345678901 -SBI"
}
```

**OR** using a Merchant API Key directly:
```json
{
  "api_key": "your-merchant-api-key-uuid",
  "message": "SBI Acct XX1234: Rs.500.01 credited. UPI/612345678901. Avl Bal:Rs.12345.67"
}
```

**Response Codes:**

| Code | Meaning |
|---|---|
| `ORDER_VERIFIED` | Payment verified successfully |
| `ORDER_NOT_FOUND` | No matching pending order found for that amount |
| `DUPLICATE_UTR` | Fraud: this UTR has already been used |
| `SMS_NOT_PARSED` | SMS did not match credit patterns |

---

### Outbound Webhook (MyMobPay → Your Server)

When an order is verified, MyMobPay fires a signed `POST` request to your configured `webhook_url`:

**Headers:**
```
X-MyMobPay-Signature: <HMAC-SHA256 of payload using your API key>
X-MyMobPay-Event: payment.verified
User-Agent: MyMobPay-Webhook-Dispatcher/2.0
```

**Payload:**
```json
{
  "event": "payment.verified",
  "order_id": "MMP_20261007_X8kQ9zR2x1Ab",
  "amount": 500.01,
  "utr": "612345678901",
  "status": "verified",
  "customer_name": "Rahul Sharma",
  "customer_phone": "9876543210",
  "external_ref": "your-internal-invoice-id",
  "note": "Premium Plan - 1 Month",
  "verified_at": "2026-10-07T18:45:23.000Z",
  "created_at": "2026-10-07T18:43:01.000Z"
}
```

**Verify on your server:**
```js
const crypto = require('crypto');
const expectedSig = crypto
  .createHmac('sha256', YOUR_MERCHANT_API_KEY)
  .update(JSON.stringify(payload))
  .digest('hex');

if (req.headers['x-mymobpay-signature'] !== expectedSig) {
  return res.status(401).send('Invalid signature');
}
```

---

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | New merchant registration |
| `POST` | `/api/auth/email-otp` | Send / verify email OTP |
| `POST` | `/api/auth/whatsapp-otp` | Send / verify WhatsApp OTP |
| `POST` | `/api/auth/email-link` | Send magic email login link |

---

### Merchant Management

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/merchant` | Get merchant profile |
| `PATCH` | `/api/merchant` | Update profile (UPI ID, bank, webhook URL) |
| `GET/POST/DELETE` | `/api/merchant/staff` | Manage staff access |
| `POST` | `/api/merchant/test-webhook` | Send a test `payment.verified` event |
| `POST` | `/api/merchant/subscription/activate` | Activate merchant subscription |

---

## 🧠 Core Algorithms Explained

### 1. Paise-Offset Collision Avoidance (`app/api/orders/route.js`)

**The Problem:** If 5 customers simultaneously buy a ₹500 item, how does a raw bank SMS saying `"Rs. 500 credited"` identify *which* customer paid?

**The Solution:**

```js
const pendingAmounts = new Set(pendingOrders.map(o => parseFloat(o.amount).toFixed(2)));

let offset = 0;
while (offset < 100) {
  const candidate = (requestedAmount + offset / 100).toFixed(2); // 500.01, 500.02...
  if (!pendingAmounts.has(candidate)) {
    finalAmount = parseFloat(candidate);
    break;
  }
  offset++;
}
```

- Customer A → ₹500.00
- Customer B → ₹500.01
- Customer C → ₹500.02

When the bank SMS arrives with `Rs. 500.01`, it maps with **100% mathematical certainty** to Customer B's order. Expired orders (after 15 minutes) release their paise slot back into the pool automatically.

---

### 2. Multi-Bank SMS Regex Parser (`lib/parseSms.js`)

Parses credit SMS from **SBI, HDFC, ICICI, Axis Bank, IOB** and generic UPI formats:

```
Input SMS:
"Dear Customer, your a/c no. XXXXXX1234 is credited by Rs. 500.01 on 07-10-2026 by UPI Ref No 612345678901 -SBI"

Output:
{ amount: 500.01, utr: "612345678901" }
```

**Parsing Pipeline:**
1. **Credit Intent Check** — keywords: `credited`, `deposited`, `received`, `cr.`, `added`
2. **UTR Extraction** — in priority order:
   - Standard 12-digit: `/\b\d{12}\b/`
   - Slash format: `/upi[\/\-:](\d{12})/i`
   - Reference labels: `/(?:ref|utr|txn)[:−\s]*([a-zA-Z0-9]{10,40})/i`
   - Provider-specific: `PTM...` (Paytm), `T\d{15,}` (Axis)
3. **Amount Normalization** — strips commas, parses float, supports `Rs.`, `INR`, `cr` prefixes

---

### 3. Order ID Generation (`lib/orderId.js`)

```js
// Format: MMP_YYYYMMDD_<12-char cryptographically secure base62>
// Example: MMP_20261007_X8kQ9zR2x1Ab

const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const bytes = crypto.randomBytes(12); // Node.js crypto or Web Crypto API
const randPart = Array.from(bytes).map(b => chars[b % chars.length]).join('');
return `MMP_${dateStr}_${randPart}`;
```

62^12 ≈ **3.2 × 10²¹** unique combinations — collision probability is astronomically low.

---

### 4. HMAC-Signed Outbound Webhooks (`lib/webhook.js`)

```js
const signature = crypto
  .createHmac('sha256', merchant.api_key)
  .update(JSON.stringify(payload))
  .digest('hex');

fetch(merchant.webhook_url, {
  method: 'POST',
  headers: {
    'X-MyMobPay-Signature': signature,
    'X-MyMobPay-Event': 'payment.verified',
  },
  body: JSON.stringify(payload),
  signal: AbortSignal.timeout(6000) // 6s timeout
});
```

---

### 5. IP Rate Limiting (`lib/rateLimit.js`)

Sliding-window rate limiter backed by an in-memory `Map` with periodic cleanup every 5 minutes:

```js
// Order creation: max 60 requests per 60 seconds per IP
checkRateLimit(`order_create_${clientIp}`, 60, 60_000)

// Returns: { allowed: boolean, remaining: number, resetInSeconds: number }
```

---

## 📱 Android SMS Forwarder Setup

1. **Install** an SMS Forwarder App on the merchant's Android phone:
   - Recommended: **SMS to Webhook** or **SmsForwarder** (Google Play Store)

2. **Configure Forwarding Rule:**

| Setting | Value |
|---|---|
| **Trigger Keywords** | `credited`, `credit`, `received`, `deposited`, `cr.` |
| **Sender IDs** | `SBI`, `HDFC`, `ICICI`, `AXIS`, `IOB`, `HDFCBK` |
| **Target URL** | `https://mymob.tech/api/webhook/sms` |
| **Method** | `POST` |
| **Content-Type** | `application/json` |

3. **JSON Payload Template:**
   ```json
   {
     "api_key": "YOUR_MERCHANT_API_KEY_UUID",
     "message": "%body%"
   }
   ```

---

## 📧 Cloudflare Email Worker Setup (Backup Verification Channel)

The Cloudflare Worker at `cloudflare-worker/worker.js` acts as an **Email Routing daemon** — bank confirmation emails forwarded to `<apiKey>@mymob.tech` are MIME-decoded and relayed to the SMS webhook.

### Deploy the Worker

```bash
# Install Wrangler CLI
npm install -g wrangler

cd cloudflare-worker

# Authenticate with Cloudflare
npx wrangler login

# Add required secrets (never store in wrangler.toml)
npx wrangler secret put SUPABASE_KEY
npx wrangler secret put NEXTJS_API_URL
# Enter: https://mymob.tech/api/webhook/email

# Deploy to Cloudflare Edge
npx wrangler deploy
```

### How It Works
1. Bank sends confirmation email to merchant
2. Merchant forwards emails → `<merchantApiKey>@mymob.tech`
3. Cloudflare routes email to the Worker
4. Worker decodes MIME/Quoted-Printable, strips HTML
5. Worker POSTs clean body to `/api/webhook/email`
6. Next.js backend runs `parseBankSms()` → verifies order

---

## 🛡️ Security Architecture

| Mechanism | Implementation |
|---|---|
| **Replay Attack Prevention** | PostgreSQL `UNIQUE` constraint on `orders.utr` — duplicate UTR returns `DUPLICATE_UTR` |
| **Webhook Authentication** | Pre-shared `WEBHOOK_SECRET` header OR per-merchant `api_key` |
| **HMAC Signature Dispatch** | All outbound webhook events signed with SHA-256 HMAC using merchant's API key |
| **IP Rate Limiting** | Sliding-window limiter on all order creation endpoints (60 req/min/IP) |
| **Sandbox Isolation** | `mode: 'test'` orders can ONLY be verified via `/api/orders/simulate` |
| **HTTP Security Headers** | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| **Zero Credential Storage** | No bank passwords, PINs, or card data — fully PCI-DSS exempt by design |
| **RLS (Row-Level Security)** | Each merchant can only query their own orders and profile via Supabase policies |
| **Admin Isolation** | Super-admin routes require separate `ADMIN_PASSWORD` env var |

---

## 🔗 Integration — Embed on Other Websites

```html
<a href="https://mymob.tech/pay?amount=499&name=John%20Doe&phone=9876543210&note=Pro%20Plan">
  Pay ₹499
</a>
```

**Supported URL Parameters:**

| Parameter | Description | Example |
|---|---|---|
| `amount` | Pre-fill payment amount | `499` |
| `name` | Customer name | `John%20Doe` |
| `phone` | Customer phone | `9876543210` |
| `note` | Payment description | `Monthly%20Subscription` |
| `ref` | Your internal order/invoice ID | `INV-2026-001` |
| `callback` | Redirect URL after success | `https://yoursite.com/success` |

---

## 🧪 Live Testing & Sandbox

```bash
# 1. Start dev server
npm run dev

# 2. Simulate a successful bank SMS payment
curl -X POST http://localhost:3000/api/webhook/sms \
  -H "Content-Type: application/json" \
  -d '{
    "secret": "your_webhook_secret",
    "message": "Dear Customer, your a/c no. XXXXXX1234 is credited by Rs. 500.01 on 07-10-2026 by UPI Ref No 612345678901 -SBI"
  }'

# 3. Simulate a failed/rejected payment (sandbox orders only)
curl -X POST http://localhost:3000/api/orders/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "MMP_20261007_XXXXXXXXXXXX",
    "simulateStatus": "failed"
  }'

# 4. Check order status
curl "http://localhost:3000/api/orders?id=MMP_20261007_XXXXXXXXXXXX"

# 5. Test outbound webhook delivery
curl -X POST http://localhost:3000/api/merchant/test-webhook \
  -H "x-api-key: your-merchant-api-key"
```

---

## 🌐 Deployment (Vercel)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set all environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel env add ADMIN_PASSWORD
vercel env add WEBHOOK_SECRET
vercel env add SMTP_HOST
vercel env add SMTP_PORT
vercel env add SMTP_USER
vercel env add SMTP_PASS

# Deploy to production
vercel --prod
```

---

## 📊 Database Schema Summary

### `public.orders`
| Column | Type | Description |
|---|---|---|
| `id` | `TEXT` PK | `MMP_YYYYMMDD_<12char>` format |
| `merchant_id` | `UUID` | FK → `merchants.id` |
| `amount` | `NUMERIC` | Exact paise-offset amount |
| `status` | `TEXT` | `pending` → `verified` / `rejected` / `expired` |
| `utr` | `TEXT` UNIQUE | 12-digit UPI Reference Number |
| `mode` | `TEXT` | `live` or `test` (sandbox) |
| `external_ref` | `TEXT` | Merchant's own invoice/order ID |
| `verified_at` | `TIMESTAMP` | When payment was confirmed |

### `public.merchants`
| Column | Type | Description |
|---|---|---|
| `id` | `UUID` PK | Links to `auth.users.id` |
| `api_key` | `UUID` UNIQUE | Auto-generated, used for webhook auth |
| `upi_id` | `TEXT` | UPI VPA (e.g., `business@okaxis`) |
| `webhook_url` | `TEXT` | Outbound webhook endpoint |
| `subscription_status` | `TEXT` | `active` / `inactive` / `expired` |
| `sandbox_mode` | `BOOLEAN` | `true` = test mode only |
| `bank_account_number` | `TEXT` | For IMPS/NEFT bank transfer tab |
| `crypto_wallet_address` | `TEXT` | For USDT TRC-20 payment tab |

---

## 🗺️ Application Pages

| URL | Description |
|---|---|
| `/` | Redirects to `/pay` |
| `/pay` | Customer checkout (QR / deep-link / bank / crypto) |
| `/status/[orderId]` | Live payment status tracker |
| `/dashboard` | Merchant SaaS control panel |
| `/admin` | Super-admin management console |
| `/login` | Merchant authentication |
| `/privacy` | Privacy Policy |
| `/terms` | Terms of Service |

---

## 🆚 Comparative Analysis

| Feature | Razorpay / Cashfree | **MyMobPay** |
|---|---|---|
| **Commission (MDR)** | 2.0–3.0% + 18% GST | **0% (Zero)** |
| **Settlement Time** | T+1 / T+2 Days | **Instant (bank-direct)** |
| **Verification Method** | Aggregator callback | **Automated bank SMS < 2 seconds** |
| **Funds Custody** | Gateway escrow | **Direct P2P — no custody** |
| **Account Freezes** | Common on high volume | **None — direct bank control** |
| **Pricing Model** | Variable % per txn | **Flat SaaS subscription** |

---

## 🔮 Future Roadmap

- [ ] AI-powered fraud anomaly detection
- [ ] Hardware IoT Soundbox (4G/Bluetooth) for retail audio confirmation
- [ ] Multi-bank dynamic VPA rotation to avoid daily UPI velocity limits
- [ ] Pre-built plugins for WooCommerce, Shopify, and Magento
- [ ] Multi-currency support (AED, USD, EUR via cross-border UPI)
- [ ] Native Android/iOS SDK with embedded checkout widget

---

## 🙋 Common Questions

**Q: How does it verify payments without a formal banking API?**
> Uses an event-driven SMS-to-Webhook forwarder. Bank sends credit SMS → background app forwards to `/api/webhook/sms` → regex parser extracts amount & UTR → matches pending order → updates status in under 2 seconds.

**Q: What if two customers pay the exact same amount simultaneously?**
> The Paise-Offset Algorithm assigns each customer a unique fractional amount (₹500.00, ₹500.01, ₹500.02...), guaranteeing 1-to-1 matching.

**Q: What prevents fake or duplicate SMS attacks?**
> A `UNIQUE` PostgreSQL constraint on the `utr` column. Any duplicate UTR is flagged `DUPLICATE_UTR` and rejected. HMAC webhook secrets block unauthorized submissions.

**Q: Is this legal and RBI/NPCI compliant?**
> Yes. MyMobPay is a non-custodial software layer. Money flows directly bank-to-bank over official NPCI UPI rails. MyMobPay never holds or processes customer funds.

---

## 📄 License

This project is proprietary software. All rights reserved © MyMobPay 2026.

---

*Built with ❤️ in India — Empowering Indian businesses to keep 100% of their revenue.*
