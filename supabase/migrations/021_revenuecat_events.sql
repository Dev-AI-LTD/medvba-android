-- RevenueCat webhook idempotency (additive). Safe for production.
-- Apply: npm run db:run-sql -- supabase/migrations/021_revenuecat_events.sql
-- Service role only writes; clients have no INSERT/UPDATE/DELETE policies.

CREATE TABLE IF NOT EXISTS public.revenuecat_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  app_user_id text,
  transaction_id text,
  raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  processed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_app_user_id
  ON public.revenuecat_events (app_user_id);

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_transaction_id
  ON public.revenuecat_events (transaction_id)
  WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_revenuecat_events_processed_at
  ON public.revenuecat_events (processed_at DESC);

ALTER TABLE public.revenuecat_events ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated → deny all client access via PostgREST.
-- service_role bypasses RLS.

REVOKE ALL ON TABLE public.revenuecat_events FROM anon, authenticated;
GRANT ALL ON TABLE public.revenuecat_events TO service_role;

SELECT '021_revenuecat_events applied' AS status;
