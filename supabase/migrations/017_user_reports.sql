-- UGC user reports (submitted via backend tRPC with service role; RLS blocks direct client access)
-- Handles a pre-existing public.user_reports table that used different column names.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_reports'
  ) THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_reports'
      AND column_name = 'reported_user_id'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_reports'
        AND column_name = 'reported_id'
    ) THEN
      ALTER TABLE public.user_reports RENAME COLUMN reported_id TO reported_user_id;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'user_reports'
      AND column_name = 'reported_user_id'
  ) THEN
    DROP TABLE public.user_reports CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  reported_user_name TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL CHECK (reason IN ('harassment', 'inappropriate', 'spam', 'other')),
  chat_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_reports_no_self_report CHECK (reporter_id <> reported_user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_reports_reported_user
  ON public.user_reports (reported_user_id);

CREATE INDEX IF NOT EXISTS idx_user_reports_created_at
  ON public.user_reports (created_at DESC);

ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;

-- Inserts and reads are performed with SUPABASE_SERVICE_ROLE_KEY on Railway (see backend/trpc/reports.ts).
