-- ═════════════════════════════════════════════════════════════════════
-- Remove Cash on Delivery (COD) Columns from Supabase Database
-- Run this in your Supabase SQL Editor:
-- ═════════════════════════════════════════════════════════════════════

-- 1. Remove enable_cod setting from merchants table if present
ALTER TABLE IF EXISTS public.merchants 
DROP COLUMN IF EXISTS enable_cod;

-- 2. Remove physical shipping & delivery columns from orders table if present
ALTER TABLE IF EXISTS public.orders 
DROP COLUMN IF EXISTS shipping_details,
DROP COLUMN IF EXISTS delivery_status;

-- 3. Success notice
SELECT 'COD columns removed cleanly.' AS status;
