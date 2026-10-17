-- Migration: Add Crypto Wallet and Physical COD settings to public.merchants
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS crypto_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS crypto_network TEXT DEFAULT 'USDT (TRC-20)',
ADD COLUMN IF NOT EXISTS enable_crypto BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_cod BOOLEAN DEFAULT true;

-- Add shipping details and delivery status to public.orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS shipping_details JSONB,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';
