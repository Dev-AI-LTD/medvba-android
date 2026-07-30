-- Clinical Copilot schema (additive). Safe for production: new tables only.
-- Apply: npm run db:run-sql -- supabase/migrations/019_clinical_copilot_schema.sql
-- Does not alter existing tutor / subscriptions / ai_question_usage behavior.

-- Sessions
CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('tutor', 'explain', 'clinical_case', 'image', 'summary')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'ro')),
  disclaimer_accepted_at timestamptz,
  case_topic text,
  credit_cost_reserved numeric(10, 2) NOT NULL DEFAULT 0,
  model text,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_id ON public.ai_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_type ON public.ai_sessions (user_id, type);
CREATE INDEX IF NOT EXISTS idx_ai_sessions_created_at ON public.ai_sessions (created_at DESC);

-- Messages
CREATE TABLE IF NOT EXISTS public.ai_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.ai_sessions (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  token_input integer,
  token_output integer,
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_messages_session_id ON public.ai_messages (session_id, created_at);

-- Attachments (S5 upload; table ready now)
CREATE TABLE IF NOT EXISTS public.ai_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.ai_sessions (id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  mime text,
  bytes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_attachments_session_id ON public.ai_attachments (session_id);

-- Credit ledger (Clinical Copilot / AI Pass). Classic tutor keeps ai_question_usage.
CREATE TABLE IF NOT EXISTS public.ai_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  delta numeric(10, 2) NOT NULL,
  balance_after numeric(10, 2) NOT NULL,
  reason text NOT NULL CHECK (
    reason IN ('grant_monthly', 'trial', 'consume', 'topup', 'refund', 'reserve', 'release')
  ),
  session_id uuid REFERENCES public.ai_sessions (id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_credit_ledger_user_id ON public.ai_credit_ledger (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_credit_ledger_reason ON public.ai_credit_ledger (user_id, reason);

-- Case context snapshots for long sessions
CREATE TABLE IF NOT EXISTS public.ai_case_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.ai_sessions (id) ON DELETE CASCADE,
  summary_text text NOT NULL,
  message_count_at integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_case_snapshots_session ON public.ai_case_snapshots (session_id, created_at DESC);

-- Storage bucket for clinical images (private; access via signed URLs / service role)
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-attachments', 'ai-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: owner SELECT only; writes via service role (backend)
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_case_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ai sessions" ON public.ai_sessions;
CREATE POLICY "Users can view own ai sessions"
  ON public.ai_sessions FOR SELECT
  USING (public.current_profile_id() = user_id);

DROP POLICY IF EXISTS "Users can view own ai messages" ON public.ai_messages;
CREATE POLICY "Users can view own ai messages"
  ON public.ai_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_sessions s
      WHERE s.id = ai_messages.session_id
        AND s.user_id = public.current_profile_id()
    )
  );

DROP POLICY IF EXISTS "Users can view own ai attachments" ON public.ai_attachments;
CREATE POLICY "Users can view own ai attachments"
  ON public.ai_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_sessions s
      WHERE s.id = ai_attachments.session_id
        AND s.user_id = public.current_profile_id()
    )
  );

DROP POLICY IF EXISTS "Users can view own ai credit ledger" ON public.ai_credit_ledger;
CREATE POLICY "Users can view own ai credit ledger"
  ON public.ai_credit_ledger FOR SELECT
  USING (public.current_profile_id() = user_id);

DROP POLICY IF EXISTS "Users can view own ai case snapshots" ON public.ai_case_snapshots;
CREATE POLICY "Users can view own ai case snapshots"
  ON public.ai_case_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_sessions s
      WHERE s.id = ai_case_snapshots.session_id
        AND s.user_id = public.current_profile_id()
    )
  );

-- Storage: users can read/write only under their profile folder
DROP POLICY IF EXISTS "Users can upload own ai attachments" ON storage.objects;
CREATE POLICY "Users can upload own ai attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ai-attachments'
    AND (storage.foldername(name))[1] = public.current_profile_id()::text
  );

DROP POLICY IF EXISTS "Users can read own ai attachments" ON storage.objects;
CREATE POLICY "Users can read own ai attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ai-attachments'
    AND (storage.foldername(name))[1] = public.current_profile_id()::text
  );

DROP POLICY IF EXISTS "Users can delete own ai attachments" ON storage.objects;
CREATE POLICY "Users can delete own ai attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ai-attachments'
    AND (storage.foldername(name))[1] = public.current_profile_id()::text
  );

SELECT '019_clinical_copilot_schema applied' AS status;
