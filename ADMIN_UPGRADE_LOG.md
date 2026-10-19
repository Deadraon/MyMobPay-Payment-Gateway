# MyMobPay Admin Upgrade Log

Running progress log of the enterprise upgrade of the MyMobPay Admin Console to Razorpay / Cashfree / PayU operational standards.

---

## Phase 0: Discovery, Architecture Mapping & Security Audit

**Status:** Completed  
**Completed Date:** 2026-10-19  
**Git Commit:** `9e77d33`  

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

## Phase 1: Foundation (Security, RBAC, Data Masking & Audit Trail)

**Status:** Completed  
**Completed Date:** 2026-10-19  
**Git Commit:** `f7f2ec3`  

### Summary of Actions
1. **Role-Based Access Control (`lib/adminRbac.js`):**
   - Implemented 7 granular administrative roles: `super_admin`, `operations`, `finance`, `support`, `risk`, `developer`, `analyst`.
   - Defined strict permissions matrix (`PERMISSIONS` enum) and permission check helper `hasPermission(role, permission)`.

2. **Tamper-Evident Audit Trail (`lib/adminAudit.js` & `app/api/admin/audit/route.js`):**
   - Append-only logging engine `logAdminAction({ actor, action, targetType, targetId, details, request })`.
   - Records actor email, role, IP address, user-agent, previous vs updated state, and timestamp.
   - Integrated with search, action filtering, forensic JSON inspector modal, and CSV export in `components/admin/AuditTab.jsx`.

3. **Sensitive Financial Data Masking (`lib/adminMasking.js` & `app/api/admin/reveal/route.js`):**
   - Mask-by-default for bank accounts (`•••• •••• 1234`), UPI VPAs (`s••••h@okhdfcbank`), API secret keys (`mmp_live_••••••3281`), and phones (`+91 •••• ••89`).
   - Unmasking requires `data.reveal` permission and mandatory justification reason (min 5 chars), permanently recorded to audit log.
   - Integrated into `components/admin/MerchantDrawer.jsx`.

4. **Admin Team Management (`app/api/admin/users/route.js` & `components/admin/TeamTab.jsx`):**
   - Staff member listing, role assignment dropdowns, 2FA status, activation toggle, 2FA secret reset, and invite modal.

---

## Phase 2: Core Operational Modules

**Status:** Completed  
**Completed Date:** 2026-10-19  
**Git Commit:** `64b0d42`  

### Summary of Actions
1. **Pulse & Executive Overview (`components/admin/OverviewTab.jsx`):**
   - Added date range filters: `Today`, `Yesterday`, `Last 7 Days`, `Last 30 Days`, `This Month`.
   - Real-time ingest telemetry strip: Ingest Latency (1.1s), Success Rate (99%).
   - Proactive operations alert banners (failure rate spikes, accumulating queues, expiring merchant subscriptions).
   - Root-cause failure analytics bar chart (abandoned, bad UTR, wrong amount, duplicate replay).

2. **Transaction Ledger & Fraud Replay Detector (`components/admin/TransactionsTab.jsx`):**
   - Duplicate UTR Replay Detector highlighting repeat UTR submissions across multiple orders with alert badge.
   - Added "Replay Alert" quick filter tab.
   - Server/client pagination (25 orders per page) with page navigation controls.
   - Filterable by store, date, amount sort, and full CSV export.

3. **Verification Control Center (`lib/verification/adapters.js`, `app/api/admin/verification/route.js`, `components/admin/VerificationTab.jsx`):**
   - Pluggable verification adapter architecture for Android SMS scraper, Bank webhooks, and UPI intent callbacks.
   - Live telemetry monitoring (p50, p95, p99 latencies, uptime percentage, mobile nodes).
   - Active adapter ping test with live roundtrip measurement.
   - High-value dual-approver threshold rule (₹10,000 cap).

4. **Risk, Fraud & Velocity Control (`app/api/admin/risk/route.js`, `components/admin/RiskTab.jsx`):**
   - Centralized Blocklist Registry for customer phone numbers, UPI VPAs, IP addresses, and device fingerprints.
   - Configurable velocity and anomaly rules engine with toggleable active vs dry-run modes.
   - "Dry-Run Simulator" executing non-blocking heuristic tests against recent live checkout traffic.

5. **Customer Claims & Disputes Desk (`app/api/admin/disputes/route.js`, `components/admin/DisputesTab.jsx`):**
   - Non-custodial evidence tracker (Open, Evidence Requested, Merchant Responded, Resolved, Escalated).
   - Strict non-custodial guarantee: no merchant accounts are ever debited; facilitates direct customer-merchant resolution.
   - Operational note logging with automated Brevo email dispatch to merchants.

6. **Developer & Outbound Webhooks Center (`app/api/admin/developer/route.js`, `components/admin/DeveloperTab.jsx`):**
   - Signed HMAC webhook dispatch log with target URL, HTTP status code, latency, and attempt counters.
   - Raw JSON payload inspector modal.
   - Live "Replay" webhook delivery trigger.

7. **Financial Reports & GST Tax Exports (`app/api/admin/reports/route.js`, `components/admin/ReportsTab.jsx`):**
   - Instant CSV downloads for Full Transaction Ledger, Merchant Master Directory, and Monthly SAC 998315 GST tax schedule.
   - Automated recurring report scheduler (Daily, Weekly, Monthly) with Brevo admin email delivery.

8. **Enterprise Navigation Layout (`components/admin/AdminSidebar.jsx` & `components/AdminConsole.jsx`):**
   - Organized into 5 logical sections: Platform Operations, Infrastructure & Rails, Risk & Claims, Monetization & Reports, Security & Governance.
