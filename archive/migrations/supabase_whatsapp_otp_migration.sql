-- ===================================================================
-- WhatsApp OTP Login System — Supabase Migration
-- Run this in your Supabase SQL editor (https://app.supabase.com)
-- ===================================================================

-- 1. OTP storage table (auto-cleaned after expiry)
create table if not exists public.whatsapp_otps (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,                          -- +91XXXXXXXXXX format
  otp_hash    text not null,                          -- SHA-256 hash of the OTP
  purpose     text not null default 'login',          -- 'login' | 'signup'
  attempts    int  not null default 0,
  verified    boolean not null default false,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- Index for fast lookup
create index if not exists idx_whatsapp_otps_phone on public.whatsapp_otps(phone);

-- RLS: only service role can access (API routes use supabaseAdmin)
alter table public.whatsapp_otps enable row level security;
create policy "service_only" on public.whatsapp_otps
  using (false) with check (false);

-- 2. Add phone_verified flag to merchants if not present
alter table public.merchants
  add column if not exists phone_verified boolean not null default false;

-- 3. (Optional) Cron: auto-delete expired OTPs every hour
-- Enable pg_cron in Supabase Dashboard → Database → Extensions first, then uncomment:
-- select cron.schedule('cleanup-whatsapp-otps', '0 * * * *',
--   $$delete from public.whatsapp_otps where expires_at < now()$$);
