-- Free-tier AI usage counts must only change via backend (service role), not PostgREST as the user.
-- Prevents clients from resetting or inflating question_count / period_start.
-- Reads remain allowed for the row owner (optional transparency); service role bypasses RLS for writes.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_question_usage'
  ) THEN
    RAISE NOTICE '010_ai_question_usage_server_writes_only: table ai_question_usage missing — skipped';
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "Users can insert own AI usage" ON public.ai_question_usage;
  DROP POLICY IF EXISTS "Users can update own AI usage" ON public.ai_question_usage;
END $$;
