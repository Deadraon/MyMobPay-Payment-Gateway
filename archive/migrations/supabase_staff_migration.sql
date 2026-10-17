-- 1. Create the staff_gateway_pool table to manage gateway numbers
CREATE TABLE IF NOT EXISTS public.staff_gateway_pool (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL, -- 'gpay', 'phonepe', 'paytm'
    is_active BOOLEAN DEFAULT true,
    current_merchant_count INTEGER DEFAULT 0,
    max_merchants_limit INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add columns to the merchants table to link gateways and track status
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS verification_method TEXT DEFAULT 'sms_forwarder',
ADD COLUMN IF NOT EXISTS staff_gateway_id UUID REFERENCES public.staff_gateway_pool(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS staff_connection_status TEXT DEFAULT 'disconnected';

-- 3. Enable RLS on the staff pool table
ALTER TABLE public.staff_gateway_pool ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policy to allow authenticated merchants to read gateway details
CREATE POLICY "Merchants can read gateway pool" 
ON public.staff_gateway_pool FOR SELECT 
USING (true);

-- 5. Seed some dummy test gateway numbers into the pool for immediate sandbox usage
INSERT INTO public.staff_gateway_pool (phone_number, provider, is_active, max_merchants_limit)
VALUES 
('+91 90123 45678', 'gpay', true, 50),
('+91 91234 56789', 'phonepe', true, 50),
('+91 92345 67890', 'paytm', true, 50)
ON CONFLICT (phone_number) DO NOTHING;
