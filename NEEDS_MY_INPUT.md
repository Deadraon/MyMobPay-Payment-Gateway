# MyMobPay Admin Upgrade: Needs My Input

This document tracks every third-party credential, partner API, business threshold, or administrative decision required to operationalize the enterprise admin panel.

---

## 1. External Credentials & Partner APIs

| Item | Purpose | Current Fallback / Stub Status | Action Needed from You |
|---|---|---|---|
| **Bank / UPI Verification API** | Automated real-time payment confirmation without relying on customer UTR typing or email forwarding | Stub adapter built (`BankVerificationAdapterStub` in `lib/verification/`) | Provide API keys and docs for your bank or partner (e.g. Decentro, Setu, ICICI Eazypay, Cashfree, or Open Bank) |
| **Telegram / Slack Alert Webhook** | Instant push alerts for system outages, verification failures, or high-velocity fraud spikes | In-memory/console logging fallback | Provide incoming webhook URL in `.env.local` (`ALERT_TELEGRAM_BOT_TOKEN`, `ALERT_TELEGRAM_CHAT_ID`, or `ALERT_SLACK_WEBHOOK_URL`) |
| **GSTIN & Business Legal Details** | Official GST invoicing for SaaS subscriptions | Placeholders used in invoice generator (`GSTIN: 07AAAAA0000A1Z5`, Address: New Delhi) | Provide legal registered entity name, official GSTIN, state code, and registered office address |

---

## 2. Business & Operational Decisions

| Decision | Recommended Default | Alternatives | Your Decision |
|---|---|---|---|
| **Dual-Approval Threshold** | **₹25,000** (Any manual verification above ₹25k requires approval by a second admin before confirmation) | ₹10,000 / ₹50,000 / Disabled | Confirm preferred threshold |
| **Subscription Grace Period** | **5 Days** (Merchant receives automated reminders at Day 0, +2, +4; auto-suspension triggers at Day 5) | 3 Days / 7 Days / 14 Days | Confirm preferred grace period |
| **VPA Change Lock Policy** | **Strict Admin Approval Required** (Merchant can request VPA change in dashboard; traffic remains on old VPA until Admin approves) | Automatic with 24h delay / Instant without approval (Not recommended) | Confirm strict admin approval |
| **KYC Mandatory Level** | **Tier 1: PAN + Phone** (Immediate start with ₹50k daily cap; PAN + GST + Bank statement required for unlimited volume) | Single mandatory tier / Optional KYC | Confirm tier thresholds |

---

## 3. Database Migration Execution

- Supabase does not expose raw DDL execution via REST (`rpc/exec_sql` returns 404).
- A unified, reversible migration script has been generated at:  
  [`scripts/supabase_schema_migration.sql`](file:///d:/Payment-Page/upi-payment-gateway/scripts/supabase_schema_migration.sql)
- **Action Needed:** Open your [Supabase Dashboard](https://supabase.com/dashboard) -> Select Project -> SQL Editor -> Paste and run `scripts/supabase_schema_migration.sql`.
- **Note:** The application code is built with resilient fallback adapters (JSONB store on platform admin record) so the entire Admin Console functions immediately even before the SQL migration is applied.
