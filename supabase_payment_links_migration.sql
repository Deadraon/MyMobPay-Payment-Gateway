-- ============================================================================
-- MyMobPay Payment Links & Expiry System Migration
-- ============================================================================

-- 1. Create payment_links table
CREATE TABLE IF NOT EXISTS public.payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    amount BIGINT NOT NULL, -- Integer in paise (e.g., Rs 100.00 = 10000 paise)
    currency TEXT NOT NULL DEFAULT 'INR',
    title TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'processing', 'paid', 'expired', 'cancelled')),
    link_type TEXT NOT NULL DEFAULT 'shared' CHECK (link_type IN ('shared', 'checkout')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    expired_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
    customer_name TEXT,
    customer_phone TEXT,
    redirect_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add performance & search indexes
CREATE INDEX IF NOT EXISTS idx_payment_links_status_expires_at 
    ON public.payment_links (status, expires_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_links_token 
    ON public.payment_links (token);

CREATE INDEX IF NOT EXISTS idx_payment_links_merchant_id 
    ON public.payment_links (merchant_id);

CREATE INDEX IF NOT EXISTS idx_payment_links_order_id 
    ON public.payment_links (order_id);

CREATE INDEX IF NOT EXISTS idx_payment_links_created_at 
    ON public.payment_links (created_at DESC);

-- 3. Create webhook_logs table for payment_link.expired and other events with exponential backoff tracking
CREATE TABLE IF NOT EXISTS public.webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
    link_id UUID REFERENCES public.payment_links(id) ON DELETE CASCADE,
    event TEXT NOT NULL,
    target_url TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
    attempts INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 4,
    next_retry_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_response_code INT,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_retry 
    ON public.webhook_logs (status, next_retry_at) 
    WHERE status = 'pending';

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for payment_links
DROP POLICY IF EXISTS "Merchants can view own payment links" ON public.payment_links;
CREATE POLICY "Merchants can view own payment links" 
ON public.payment_links FOR SELECT 
USING (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can insert own payment links" ON public.payment_links;
CREATE POLICY "Merchants can insert own payment links" 
ON public.payment_links FOR INSERT 
WITH CHECK (auth.uid() = merchant_id);

DROP POLICY IF EXISTS "Merchants can update own payment links" ON public.payment_links;
CREATE POLICY "Merchants can update own payment links" 
ON public.payment_links FOR UPDATE 
USING (auth.uid() = merchant_id);

-- 6. RLS Policies for webhook_logs
DROP POLICY IF EXISTS "Merchants can view own webhook logs" ON public.webhook_logs;
CREATE POLICY "Merchants can view own webhook logs" 
ON public.webhook_logs FOR SELECT 
USING (auth.uid() = merchant_id);

-- 7. Backfill & Safety Check
-- If there are any legacy orders with method = 'LINK' that should be reflected,
-- backfill them safely without duplicating existing rows.
DO $$
BEGIN
    -- Backfill active links that might miss expires_at:
    UPDATE public.payment_links
    SET expires_at = created_at + INTERVAL '24 hours'
    WHERE expires_at IS NULL;
END $$;
