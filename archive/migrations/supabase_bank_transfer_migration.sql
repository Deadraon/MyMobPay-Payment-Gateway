-- Migration: Add Bank Transfer (IMPS/NEFT) fields to public.merchants
ALTER TABLE public.merchants 
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_ifsc TEXT,
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS enable_bank_transfer BOOLEAN DEFAULT true;

-- Add customer_utr column to orders table for pre-submitted UTR matching
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_utr TEXT;
