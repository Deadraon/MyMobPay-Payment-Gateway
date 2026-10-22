-- Migration: Add Crypto Wallet settings to public.merchants
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS crypto_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS crypto_network TEXT DEFAULT 'USDT (TRC-20)',
ADD COLUMN IF NOT EXISTS enable_crypto BOOLEAN DEFAULT true;
