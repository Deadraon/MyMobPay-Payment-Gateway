# MyMobPay Admin Upgrade Log

Running progress log of the enterprise upgrade of the MyMobPay Admin Console to Razorpay / Cashfree / PayU operational standards.

---

## Phase 0: Discovery, Architecture Mapping & Security Audit

**Status:** Completed  
**Completed Date:** 2026-10-19  

### Summary of Actions
1. **Architecture & Stack Discovery:**
   - **Framework:** Next.js 14.2.35 (App Router, Server Actions, Route Handlers)
   - **Styling:** Tailwind CSS + Lucide Icons + Recharts
   - **Database:** Supabase PostgreSQL with Service Role Key for server administrative actions
   - **Authentication:** Supabase Auth (Google OAuth, Email OTP) + HMAC-SHA256 signed admin session tokens (`adm_...`)
   - **Email Engine:** Brevo REST API / SMTP transactional pipeline
   - **Model:** 100% Non-custodial UPI Direct Settlement (funds go directly to merchant bank account; no pooling, no wallets, no settlement payouts). Revenue is 100% flat-fee subscriptions.

2. **Security Audit (`SECURITY_AUDIT.md`):**
   - Discovered 2 Critical, 5 High, 4 Medium, and 3 Low security vulnerabilities.
   - Fixed Critical `SEC-01` (hardcoded admin secret in diagnostic route).
   - Fixed Critical `SEC-02` (edge middleware `same-origin` authorization bypass).
   - Fixed High `SEC-05` (unprotected `.env` files in `.gitignore`).

3. **Database Schema Mapping:**
   - Existing tables: `merchants`, `orders`, `payment_links`, `webhook_logs`, `email_logs`, `whatsapp_otps`, `staff_gateway_pool`.
   - Determined that `rpc/exec_sql` is not installed on Supabase PostgreSQL.
   - Engineered dual-mode data persistence: standard Supabase tables for new entities (`admin_audit_logs`, `admin_users`, `admin_blocklist`, `merchant_kyc`, `disputes`, `support_tickets`), paired with graceful JSONB memory/fallback adapters so all UI features operate seamlessly out-of-the-box.

---

## Phase 1: Foundation (Security, RBAC & Audit Trail)

**Status:** In Progress  
**Planned Scope:**
- [ ] Admin RBAC middleware with 7 distinct roles (`super_admin`, `operations`, `finance`, `support`, `risk`, `developer`, `analyst`).
- [ ] Immutable append-only `admin_audit_logs` engine.
- [ ] Sensitive financial data masking (`•••• •••• 1234`) with permission-gated "reveal" action logged to audit.
- [ ] Cookie-based `HttpOnly` admin session tokens.
- [ ] IP allowlist configuration.

---

## Phase 2: Core Operational Modules

**Status:** Queued  
**Planned Scope:**
- **2.1 Executive Dashboard:** Multi-date range filters (Today, 7D, 30D, Custom), failure analytics chart, proactive operations alerts panel.
- **2.2 Merchant Central & KYC Review:** Full document review queue (PAN, GST, Bank Proof), VPA change approval lock, merchant transaction/daily caps, read-only impersonation banner.
- **2.3 Transaction Ledger:** Server-side paginated ledger, duplicate UTR replay detection queue, failure breakdown by bank/app.
- **2.4 Verification Control Center:** Verification health telemetry, pluggable adapter interfaces, dual-approver rule for high-value manual verifications.
- **2.5 Billing & Monetization:** Flat-fee plan catalog, GST invoice generation & download, automated grace period & suspension rules.
- **2.6 Developer & Integrations:** Hashed API secret management, signed webhook delivery log with exponential backoff retries, API request inspector.
- **2.7 Risk & Fraud:** Blocklist registry (VPAs, phones, IPs, devices), velocity & anomaly rules engine with dry-run mode, merchant risk scoring.
- **2.8 Disputes & Complaints:** Customer payment evidence intake, dispute tracker linked to orders, SLA timers (no money movement).
- **2.9 Support & Broadcasts:** Multi-channel merchant tickets, broadcast composer (in-app banner + Brevo email blast).
- **2.10 Monitoring & Telemetry:** Bank-wise uptime/success monitor, error log search, outage alert webhooks.
- **2.11 Reports & Exports:** Scheduled automated reporting, multi-format export (CSV/Excel/PDF).
- **2.12 Platform Configuration:** Global defaults manager, maintenance mode kill-switch, feature flags.
