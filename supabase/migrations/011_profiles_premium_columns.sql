-- Ensures columns read by backend premium fallback (see backend/lib/premium-access.ts).
-- Safe to re-run: ADD COLUMN IF NOT EXISTS.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free';
