-- Rolling window for AI free-tier usage: one row per user, reset via period_start
-- (avoids INSERT after UNIQUE(user_id) when the old query used created_at >= window)

ALTER TABLE public.ai_question_usage
  ADD COLUMN IF NOT EXISTS period_start TIMESTAMPTZ;

UPDATE public.ai_question_usage
SET period_start = COALESCE(updated_at, created_at, NOW())
WHERE period_start IS NULL;

ALTER TABLE public.ai_question_usage
  ALTER COLUMN period_start SET DEFAULT NOW();

ALTER TABLE public.ai_question_usage
  ALTER COLUMN period_start SET NOT NULL;
