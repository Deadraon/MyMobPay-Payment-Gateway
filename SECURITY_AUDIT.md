# MyMobPay Security Audit Report (Phase 0)

**Date:** 2026-10-19  
**Auditor:** Senior Full-Stack & Payments-Security Reviewer  
**Scope:** MyMobPay Internal Admin Architecture, Edge Middleware, Auth Handlers, UPI Verification Pipelines, and Webhook Dispatchers.

---

## Executive Summary
MyMobPay operates on a **non-custodial direct-settlement UPI payment model**—funds move directly from customer VPAs to merchant VPAs without intermediate custodial holding. The platform revenue is driven by **SaaS subscriptions**.

The initial codebase, developed via rapid AI-assisted development, contains foundational protections (SSRF guards in webhooks, rate limiters, basic TOTP helpers, edge path scanning). However, this security audit identified **2 Critical**, **5 High**, **4 Medium**, and **3 Low** vulnerabilities that must be addressed to achieve enterprise payments-grade security (Razorpay/Cashfree standards).

---

## Ranked Findings Summary

| ID | Title | Severity | Area | Status |
|---|---|---|---|---|
| **SEC-01** | Hardcoded Fallback Admin Secret in Diagnostic Route | **CRITICAL** | Secrets & Auth Bypass | Open (Fix in Phase 0) |
| **SEC-02** | Edge Middleware Same-Origin Admin API Bypass | **CRITICAL** | Authorization / WAF | Open (Fix in Phase 0) |
| **SEC-03** | Public Fallback Secrets for HMAC Session Signing & TOTP | **HIGH** | Cryptography / Auth | Open (Fix in Phase 1) |
| **SEC-04** | API Keys Transmitted via GET Query String Parameters | **HIGH** | Credential Exposure | Open (Fix in Phase 1) |
| **SEC-05** | Incomplete `.gitignore` Exposing Production `.env` Files | **HIGH** | Secrets Management | Open (Fix in Phase 0) |
| **SEC-06** | Test Mode Auto-Verification Exploitable in Production Routes | **HIGH** | Payment Verification | Open (Fix in Phase 1) |
| **SEC-07** | High-Severity Dependency CVEs (`postcss`, `source-map-js`, `nodemailer`) | **HIGH** | Supply Chain / DoS | Open (Fix in Phase 0) |
| **SEC-08** | Client-Side Storage of Admin Session Tokens (`sessionStorage`) | **MEDIUM** | Session Security | Open (Fix in Phase 1) |
| **SEC-09** | Lack of Individual Admin RBAC & Account Lockout | **MEDIUM** | Identity & Access | Open (Fix in Phase 1) |
| **SEC-10** | Unmasked Financial Data in Admin Presentation Drawers | **MEDIUM** | Data Protection | Open (Fix in Phase 1) |
| **SEC-11** | Unverifiable Manual Migrations Endpoint (`rpc/exec_sql` 404) | **MEDIUM** | Infrastructure | Open (Fix in Phase 0) |
| **SEC-12** | Absence of Immutable Append-Only Audit Logging | **LOW** | Forensics & Compliance | Open (Fix in Phase 1) |
| **SEC-13** | Sub-Paise Floating Point Storage for Orders (`orders.amount` float) | **LOW** | Accounting Precision | Open (Fix in Phase 1) |
| **SEC-14** | VPA Changes Missing Mandatory Multi-Admin Dual Approval | **LOW** | Operational Risk | Open (Fix in Phase 2) |

---

## Detailed Findings

### 1. [CRITICAL] SEC-01: Hardcoded Fallback Admin Secret in Diagnostic Route
- **File:** [`app/api/admin/test-email/route.js:15-25`](file:///d:/Payment-Page/upi-payment-gateway/app/api/admin/test-email/route.js#L15-L25)
- **Vulnerability:** The route specifies a hardcoded static fallback string:
  ```javascript
  const adminSecret = process.env.ADMIN_API_SECRET || 'mmp_admin_c7f3a92d8e1b4056f9d2a7c3e8b1d4f6';
  ```
  If `ADMIN_API_SECRET` is unset or undefined in production, any external user supplying `?secret=mmp_admin_c7f3a92d8e1b4056f9d2a7c3e8b1d4f6` can trigger emails, query diagnostic states, and view masked credential configurations.
  Furthermore, line 21 accepts any token starting with `adm_` without verifying its HMAC cryptographic signature:
  ```javascript
  if (tokenHeader && (tokenHeader === adminSecret || tokenHeader.startsWith('adm_'))) return true;
  ```
- **Remediation:** Remove the hardcoded secret immediately. Route authorization must strictly require `verifyAdminAuth(req)` using signed HMAC tokens or verified Supabase OAuth admin sessions.

---

### 2. [CRITICAL] SEC-02: Edge Middleware Same-Origin Admin API Bypass
- **File:** [`middleware.js:144`](file:///d:/Payment-Page/upi-payment-gateway/middleware.js#L144)
- **Vulnerability:**
  ```javascript
  const isAuthorized =
    (expectedToken && adminToken === expectedToken) ||
    (adminToken && adminToken.startsWith('adm_')) ||
    (authHeader && (authHeader.startsWith('Bearer adm_') || authHeader.startsWith('Bearer ey'))) ||
    secFetchSite === 'same-origin';
  ```
  The condition `secFetchSite === 'same-origin'` unconditionally authorizes any browser request originating from `mymob.tech`. If an attacker registers as a regular merchant and executes `fetch('/api/admin/...')` in the browser dev tools, the edge middleware lets the request pass into backend route handlers. Defense-in-depth is lost at the edge.
- **Remediation:** Remove `secFetchSite === 'same-origin'` from the authorization condition. Edge middleware must verify either a valid signed `x-admin-token` or valid session cookie.

---

### 3. [HIGH] SEC-03: Public Fallback Secrets for HMAC Session Signing & TOTP
- **File:** [`lib/adminSettings.js:140,244`](file:///d:/Payment-Page/upi-payment-gateway/lib/adminSettings.js#L140)
- **Vulnerability:**
  ```javascript
  export const DEFAULT_ADMIN_TOTP_SECRET = 'MYMOBPAYADMINSEC';
  const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || ... || 'mymobpay-admin-totp-session-key-v1';
  ```
  If environment variables are missing during deployment or container restart, session tokens are signed with the publicly documented string `'mymobpay-admin-totp-session-key-v1'`. An attacker could forge valid 24-hour admin session tokens offline.
- **Remediation:** Enforce that `ADMIN_SESSION_SECRET` must exist. If missing in production, throw an initialization error rather than falling back to static strings.

---

### 4. [HIGH] SEC-04: API Keys Transmitted via GET Query String Parameters
- **File:** [`app/api/merchant/route.js:7-18`](file:///d:/Payment-Page/upi-payment-gateway/app/api/merchant/route.js#L7-L18)
- **Vulnerability:** The route reads merchant API keys from URL search params:
  ```javascript
  const key = searchParams.get('key');
  ```
  API keys in URLs are routinely logged by proxy servers, CDN access logs, browser history, and outgoing Referer headers.
- **Remediation:** Deprecate query param keys. Accept API keys exclusively via `x-api-key` or `Authorization: Bearer <key>` headers.

---

### 5. [HIGH] SEC-05: Incomplete `.gitignore` Exposing Environment Configurations
- **File:** [`.gitignore:29`](file:///d:/Payment-Page/upi-payment-gateway/.gitignore#L29)
- **Vulnerability:** `.gitignore` specifies `.env*.local`. Plain `.env`, `.env.production`, or `.env.staging` files are not covered. A developer creating `.env` could inadvertently commit production secrets to Git.
- **Remediation:** Update `.gitignore` to comprehensively ignore `.env`, `.env.*`, and `!.env.example`.

---

### 6. [HIGH] SEC-06: Test Mode Auto-Verification Exploitable in Production
- **File:** [`app/api/orders/check-status/route.js:46-59`](file:///d:/Payment-Page/upi-payment-gateway/app/api/orders/check-status/route.js#L46-L59), [`app/api/orders/verify-utr/route.js:208`](file:///d:/Payment-Page/upi-payment-gateway/app/api/orders/verify-utr/route.js#L208)
- **Vulnerability:** If an attacker creates an order with `mode: 'test'` pointing to a live store, the endpoint auto-verifies the order and generates mock UTRs. While subscription activation is guarded against test orders, merchant webhooks are fired with `status: verified`, which could trigger fulfillment in unhardened merchant backends.
- **Remediation:** Test mode orders must be strictly segregated; verify that only merchants with sandbox credentials can initiate test orders, and include `test_mode: true` in all merchant webhook payloads.

---

### 7. [HIGH] SEC-07: Dependency CVEs in `nodemailer` & `postcss`
- **Output:** `npm audit` flagged:
  - `nodemailer` `<=10.0.5`: Quadratic backtracking DoS & credential disclosure risks (GHSA-v53p-9fqp-m79j).
  - `postcss` `<=8.5.22`: Source map path traversal & XSS risk.
- **Remediation:** Update `nodemailer` and dev toolchain dependencies to patched versions.

---

### 8. [MEDIUM] SEC-08: Client-Side Storage of Admin Session Tokens
- **File:** [`components/AdminConsole.jsx`](file:///d:/Payment-Page/upi-payment-gateway/components/AdminConsole.jsx)
- **Vulnerability:** Signed session tokens are persisted in browser `sessionStorage`. Any Cross-Site Scripting (XSS) vulnerability on the domain would expose the admin token to JavaScript theft.
- **Remediation:** Transition admin session tokens to `HttpOnly`, `Secure`, `SameSite=Strict` cookies.

---

### 9. [MEDIUM] SEC-09: Lack of Individual Admin RBAC & Account Lockout
- **Vulnerability:** Admin access is currently monolithic. Any authorized email has global access across all functions (modifying VPA, overriding UTRs, toggling subscriptions, viewing keys). There are no specialized roles (Operations, Support, Billing, Read-Only Analyst) and no account lockout after N failed attempts.
- **Remediation:** Implement Phase 1 RBAC system with granular permissions checked by backend middleware.

---

### 10. [MEDIUM] SEC-10: Unmasked Sensitive Financial Credentials
- **Vulnerability:** Merchant bank account numbers, IFSC codes, and full phone numbers are displayed in plaintext across admin inspection drawers without explicit "click to reveal" authorization or audit logging.
- **Remediation:** Implement standard masking (e.g. `•••• •••• 4092`, `98••••••12`) by default, requiring explicit permissioned reveal actions that record to the audit log.

---

### 11. [MEDIUM] SEC-11: Unverifiable Manual Migrations Endpoint
- **File:** [`app/api/admin/migrate/route.js`](file:///d:/Payment-Page/upi-payment-gateway/app/api/admin/migrate/route.js)
- **Vulnerability:** The migration route attempts to invoke `supabaseAdmin.rpc('exec_sql')`, which does not exist in the database schema (`PGRST202`). Any schema extensions must be managed via versioned SQL files and clean application fallback adapters.
- **Remediation:** Provide standard SQL migration files (`migrations/`) for database administrators, and build resilient schema adapters with in-memory/JSONB fallbacks.

---

### 12. [LOW] SEC-12: Absence of Immutable Append-Only Audit Logging
- **Vulnerability:** High-impact administrative actions (manual UTR verification, merchant status freeze/unfreeze, subscription plan grant, API key rotation) currently update database rows directly without creating an immutable trail of *who* performed the action, *from what IP*, *at what time*, and *with what justification*.
- **Remediation:** Introduce `admin_audit_logs` table with mandatory reason prompts for all write actions.

---

### 13. [LOW] SEC-13: Sub-Paise Floating Point Storage for Orders
- **File:** Database column `orders.amount` (numeric/float)
- **Vulnerability:** Floating-point amounts are susceptible to rounding anomalies during multi-currency conversions or high-volume reporting.
- **Remediation:** While `orders.amount` in Rupees is currently functional, enforce integer paise storage for all new ledger and invoice accounting models.

---

### 14. [LOW] SEC-14: VPA Changes Missing Mandatory Dual Approval
- **Vulnerability:** If an attacker compromises a merchant account, modifying their receiving UPI VPA to a fraudulent address would divert customer funds instantly (since MyMobPay does not hold funds).
- **Remediation:** Freeze automatic VPA changes. Any VPA update must enter an admin review queue requiring verification before live traffic is routed.
