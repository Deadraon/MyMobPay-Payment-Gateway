-- 1. Create the merchants table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.merchants (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    upi_id TEXT NOT NULL,
    api_key UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    webhook_url TEXT,
    subscription_status TEXT DEFAULT 'active',
    subscription_expires_at TIMESTAMP WITH TIME ZONE,
    theme_color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add merchant_id to the existing orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE;

-- 3. (Optional but recommended) Enable Row Level Security (RLS) on merchants
ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for merchants to only view/edit their own data
CREATE POLICY "Merchants can view their own profile" 
ON public.merchants FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Merchants can update their own profile" 
ON public.merchants FOR UPDATE 
USING (auth.uid() = id);

-- 5. Enable RLS on orders to restrict merchants to their own orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view their own orders" 
ON public.orders FOR SELECT 
USING (auth.uid() = merchant_id);

-- Note: We will need a policy for the public payment page to insert orders
CREATE POLICY "Anyone can insert an order" 
ON public.orders FOR INSERT 
WITH CHECK (true);

-- Allow public viewing of orders for the status page (by order ID)
CREATE POLICY "Anyone can view order status" 
ON public.orders FOR SELECT 
USING (true);

-- 6. Developer Sandbox / Test Mode Additions
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS sandbox_mode BOOLEAN DEFAULT true;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mode TEXT DEFAULT 'live';

-- 7. Add columns for email forwarding verification
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS gmail_verification_code TEXT;

-- 8. Add project integration columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS project TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS callback_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS external_ref TEXT;

-- 9. Ensure orders.id is TEXT (to match alphanumeric generation logic)
-- Note: If your orders table was created with id as UUID, uncomment the line below to convert it to TEXT.
-- ALTER TABLE public.orders ALTER COLUMN id TYPE TEXT;

-- 10. Add integration setup progress tracking
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS setup_progress JSONB DEFAULT '{"email_forwarding": false, "website": false, "android_sdk": false}';

-- 11. Create email_logs table for the integration dashboard
CREATE TABLE IF NOT EXISTS public.email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES public.merchants(id) ON DELETE CASCADE,
    sender TEXT,
    body_snippet TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view their own email logs" 
ON public.email_logs FOR SELECT 
USING (auth.uid() = merchant_id);

