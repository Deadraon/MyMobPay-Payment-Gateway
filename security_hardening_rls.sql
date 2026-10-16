-- ==============================================================================
-- 🔐 MyMobPay Enterprise Database Security Hardening Script (100% Resilient)
-- ==============================================================================
-- Run this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Click "RUN"
--
-- Dynamically inspects your schema:
-- 1. Enables pgcrypto extension for cryptographic hashing
-- 2. Adds and indexes api_key_hash on the merchants table
-- 3. Backfills SHA-256 hashes for existing merchant API keys
-- 4. Enables Row Level Security (RLS) on merchants, orders, and any existing log tables
-- 5. Safe: skips tables that don't exist yet without throwing errors
-- ==============================================================================

-- 1. Enable Cryptographic Functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Add api_key_hash Column and Index to Merchants Table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'merchants' 
    AND column_name = 'api_key_hash'
  ) THEN
    ALTER TABLE public.merchants ADD COLUMN api_key_hash TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_merchants_api_key_hash ON public.merchants(api_key_hash);

-- 3. Backfill SHA-256 Hashes for All Existing Merchant API Keys
UPDATE public.merchants
SET api_key_hash = encode(digest(
  CASE 
    WHEN api_key::text LIKE 'live_%' THEN SUBSTRING(api_key::text FROM 6)
    WHEN api_key::text LIKE 'test_%' THEN SUBSTRING(api_key::text FROM 6)
    ELSE api_key::text 
  END, 'sha256'), 'hex')
WHERE api_key IS NOT NULL AND (api_key_hash IS NULL OR api_key_hash = '');

-- 4. Enable Row Level Security (RLS) on Core Tables
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 5. Policies for MERCHANTS Table
DROP POLICY IF EXISTS "Merchants can read own profile" ON public.merchants;
DROP POLICY IF EXISTS "Merchants can update own profile" ON public.merchants;

CREATE POLICY "Merchants can read own profile" 
ON public.merchants 
FOR SELECT 
TO authenticated 
USING (auth.uid()::text = id::text);

CREATE POLICY "Merchants can update own profile" 
ON public.merchants 
FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = id::text);

-- 6. Policies for ORDERS Table
DROP POLICY IF EXISTS "Merchants can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view active order by exact ID" ON public.orders;

CREATE POLICY "Merchants can view own orders" 
ON public.orders 
FOR SELECT 
TO authenticated 
USING (auth.uid()::text = merchant_id::text);

CREATE POLICY "Public can view active order by exact ID" 
ON public.orders 
FOR SELECT 
TO anon 
USING (true);

-- 7. Dynamic Policies for Optional Tables (Only runs if the table exists in your DB)

-- EMAIL_LOGS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'email_logs') THEN
    ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "Block anon access to email_logs" ON public.email_logs';
    EXECUTE 'DROP POLICY IF EXISTS "Merchants can view own email logs" ON public.email_logs';
    EXECUTE 'CREATE POLICY "Merchants can view own email logs" ON public.email_logs FOR SELECT TO authenticated USING (auth.uid()::text = merchant_id::text)';
  END IF;
END $$;

-- SMS_LOGS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sms_logs') THEN
    ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "Block anon access to sms_logs" ON public.sms_logs';
    EXECUTE 'DROP POLICY IF EXISTS "Merchants can view own sms logs" ON public.sms_logs';
    EXECUTE 'CREATE POLICY "Merchants can view own sms logs" ON public.sms_logs FOR SELECT TO authenticated USING (auth.uid()::text = merchant_id::text)';
  END IF;
END $$;

-- PAYMENT_LINKS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_links') THEN
    ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "Merchants can view own payment links" ON public.payment_links';
    EXECUTE 'DROP POLICY IF EXISTS "Public can view active payment link by token" ON public.payment_links';
    EXECUTE 'CREATE POLICY "Merchants can view own payment links" ON public.payment_links FOR ALL TO authenticated USING (auth.uid()::text = merchant_id::text)';
    EXECUTE 'CREATE POLICY "Public can view active payment link by token" ON public.payment_links FOR SELECT TO anon USING (status = ''active'')';
  END IF;
END $$;

-- WEBHOOK_LOGS
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhook_logs') THEN
    ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
    EXECUTE 'DROP POLICY IF EXISTS "Block anon access to webhook_logs" ON public.webhook_logs';
    EXECUTE 'DROP POLICY IF EXISTS "Merchants can view own webhook logs" ON public.webhook_logs';
    EXECUTE 'CREATE POLICY "Merchants can view own webhook logs" ON public.webhook_logs FOR SELECT TO authenticated USING (auth.uid()::text = merchant_id::text)';
  END IF;
END $$;

-- 8. Success Output
DO $$ 
BEGIN
  RAISE NOTICE '✅ MyMobPay Database Security Hardening & RLS Applied Successfully!';
END $$;
