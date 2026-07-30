-- Clinical AI usage events (Faza 1 Muse). No PHI / prompts / images.
-- service_role insert only; authenticated has no access.

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.ai_sessions (id) ON DELETE SET NULL,
  operation text NOT NULL CHECK (
    operation IN ('explain', 'follow_up', 'clinical_case', 'image', 'summary')
  ),
  provider text NOT NULL,
  model text,
  token_input integer,
  token_output integer,
  provider_request_id text,
  latency_ms integer,
  status text NOT NULL CHECK (
    status IN ('ok', 'provider_error', 'aborted', 'timeout', 'guard_reject')
  ),
  credit_cost integer NOT NULL CHECK (credit_cost >= 0),
  used_trial boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_usage_events_request_id_unique UNIQUE (request_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_user_created
  ON public.ai_usage_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_usage_events_session_created
  ON public.ai_usage_events (session_id, created_at DESC);

ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.ai_usage_events FROM PUBLIC;
REVOKE ALL ON public.ai_usage_events FROM anon;
REVOKE ALL ON public.ai_usage_events FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_usage_events TO service_role;

COMMENT ON TABLE public.ai_usage_events IS
  'Clinical AI usage metrics only. No prompts, images, or medical content.';
