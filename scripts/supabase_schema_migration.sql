-- ==============================================================================
-- MyMobPay Enterprise Admin Schema Migration
-- Standard: PostgreSQL / Supabase
-- Description: Creates RBAC, Audit Logging, Fraud/Risk, KYC, Disputes, Support, 
--              and Telemetry tables with indexes and soft deletes.
-- Reversible: Drop commands provided in comments.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Admin Users & RBAC Table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'operations', 'finance', 'support', 'risk', 'developer', 'analyst')),
    totp_secret TEXT,
    totp_enabled BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    failed_login_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    last_login_ip TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);

-- Seed Initial Super Admin records
INSERT INTO public.admin_users (email, full_name, role, is_active, totp_enabled)
VALUES 
    ('chauhankunal695@gmail.com', 'Kunal Chauhan', 'super_admin', true, true),
    ('deadraon@gmail.com', 'Platform Admin', 'super_admin', true, true),
    ('deadraon1@gmail.com', 'Operations Lead', 'operations', true, true)
ON CONFLICT (email) DO NOTHING;

-- 3. Immutable Append-Only Audit Log
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.admin_audit_logs(actor_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.admin_audit_logs(target_type, target_id);

-- 4. Risk, Velocity & Blocklist Registry
CREATE TABLE IF NOT EXISTS public.admin_blocklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('vpa', 'phone', 'ip', 'device', 'bank_account')),
    value TEXT NOT NULL,
    reason TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocklist_type_val ON public.admin_blocklist(type, value);

-- 5. Risk Rules Engine Table
CREATE TABLE IF NOT EXISTS public.risk_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('velocity', 'amount_spike', 'failure_rate', 'new_merchant_limit')),
    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    action TEXT NOT NULL CHECK (action IN ('flag', 'pause_merchant', 'block')),
    is_active BOOLEAN DEFAULT true,
    dry_run BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Default Risk Rules
INSERT INTO public.risk_rules (name, description, rule_type, conditions, action, is_active, dry_run)
VALUES
    ('VPA Velocity Limit', 'Blocks more than 10 payments to same VPA within 60 seconds', 'velocity', '{"max_count": 10, "window_seconds": 60}'::jsonb, 'flag', true, false),
    ('Abnormal Order Amount Spike', 'Flags payments exceeding ₹100,000 for accounts under 14 days old', 'amount_spike', '{"threshold_paise": 10000000, "merchant_age_days": 14}'::jsonb, 'flag', true, false),
    ('Failure Rate Auto-Pause', 'Pauses merchant if verification failure rate exceeds 80% on >= 20 orders', 'failure_rate', '{"min_orders": 20, "max_failure_percent": 80}'::jsonb, 'pause_merchant', true, true)
ON CONFLICT DO NOTHING;

-- 6. Merchant KYC & Verification Queue
CREATE TABLE IF NOT EXISTS public.merchant_kyc (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    pan_number TEXT,
    pan_doc_url TEXT,
    gstin TEXT,
    business_proof_url TEXT,
    bank_proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resubmit_requested')),
    rejection_reason TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kyc_merchant ON public.merchant_kyc(merchant_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON public.merchant_kyc(status);

-- 7. Mandatory VPA Change Approval Table (Anti-Fraud Vector)
CREATE TABLE IF NOT EXISTS public.merchant_vpa_changes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    old_vpa TEXT NOT NULL,
    new_vpa TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reason TEXT,
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vpa_changes_status ON public.merchant_vpa_changes(status);

-- 8. Customer Disputes & Evidence Tracker (No Money Movement)
CREATE TABLE IF NOT EXISTS public.disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_contact TEXT,
    claimed_amount NUMERIC(12,2) NOT NULL,
    claimed_utr TEXT,
    proof_url TEXT,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'awaiting_merchant', 'resolved', 'escalated')),
    resolution_notes TEXT,
    assigned_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_order ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_merchant ON public.disputes(merchant_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);

-- 9. Merchant Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to TEXT,
    messages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_merchant ON public.support_tickets(merchant_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);

-- 10. System Broadcasts & Incident Notices
CREATE TABLE IF NOT EXISTS public.system_broadcasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'maintenance', 'critical')),
    target_audience TEXT NOT NULL DEFAULT 'all',
    channels JSONB DEFAULT '["in_app"]'::jsonb,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sent')),
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Flat-Fee Plans & Monetization Catalog
CREATE TABLE IF NOT EXISTS public.admin_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_inr NUMERIC(10,2) NOT NULL,
    billing_period_days INT NOT NULL DEFAULT 30,
    daily_volume_cap_paise BIGINT,
    per_txn_cap_paise BIGINT,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.admin_plans (id, name, price_inr, billing_period_days, daily_volume_cap_paise, per_txn_cap_paise, features)
VALUES
    ('starter', 'Starter Gateway', 499.00, 30, 5000000, 1000000, '["Direct UPI QR", "Instant Webhooks", "Zero MDR", "Email Alerts"]'::jsonb),
    ('growth', 'Growth Business', 1499.00, 30, 25000000, 5000000, '["All Starter Features", "Custom Branding", "Priority Support", "High Volume Rails"]'::jsonb),
    ('enterprise', 'Scale Enterprise', 4999.00, 30, NULL, NULL, '["Unlimited Volume", "Dedicated Account Manager", "Multi-VPA Routing", "Custom Webhooks"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET price_inr = EXCLUDED.price_inr;

-- 12. Soft Deletes and Essential Performance Indexes on Existing Tables
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS daily_cap_paise BIGINT DEFAULT 5000000;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS per_txn_cap_paise BIGINT DEFAULT 1000000;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS risk_tier TEXT DEFAULT 'standard';
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS internal_notes TEXT;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_paise BIGINT;

CREATE INDEX IF NOT EXISTS idx_orders_merchant_status ON public.orders(merchant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_utr_clean ON public.orders(utr) WHERE utr IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merchants_active_sub ON public.merchants(subscription_status);
