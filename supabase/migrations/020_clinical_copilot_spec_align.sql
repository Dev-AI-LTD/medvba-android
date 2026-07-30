-- Clinical Copilot spec align (additive on 019). Store-safe: new columns/tables only.
-- Apply: npm run db:run-sql -- supabase/migrations/020_clinical_copilot_spec_align.sql

-- ---- ai_sessions enrich ----
ALTER TABLE public.ai_sessions ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.ai_sessions ADD COLUMN IF NOT EXISTS subject_area text;
ALTER TABLE public.ai_sessions ADD COLUMN IF NOT EXISTS disclaimer_version text NOT NULL DEFAULT 'v1';
ALTER TABLE public.ai_sessions ADD COLUMN IF NOT EXISTS disclaimer_accepted boolean NOT NULL DEFAULT false;
ALTER TABLE public.ai_sessions ADD COLUMN IF NOT EXISTS entry_point text;
ALTER TABLE public.ai_sessions ADD COLUMN IF NOT EXISTS source_question_id text;
ALTER TABLE public.ai_sessions ADD COLUMN IF NOT EXISTS source_quiz_session_id text;
ALTER TABLE public.ai_sessions ADD COLUMN IF NOT EXISTS estimated_credits numeric(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.ai_sessions ADD COLUMN IF NOT EXISTS actual_credits numeric(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.ai_sessions ADD COLUMN IF NOT EXISTS cached_summary text;
ALTER TABLE public.ai_sessions ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Backfill disclaimer_accepted from disclaimer_accepted_at when present
UPDATE public.ai_sessions
SET disclaimer_accepted = true
WHERE disclaimer_accepted_at IS NOT NULL AND disclaimer_accepted = false;

-- Relax status check to allow archived/failed (drop old check if present, add broader)
DO $$
BEGIN
  ALTER TABLE public.ai_sessions DROP CONSTRAINT IF EXISTS ai_sessions_status_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.ai_sessions
  ADD CONSTRAINT ai_sessions_status_check
  CHECK (status IN ('active', 'completed', 'cancelled', 'archived', 'failed'));

-- ---- ai_messages enrich ----
ALTER TABLE public.ai_messages ADD COLUMN IF NOT EXISTS sequence_no integer;
ALTER TABLE public.ai_messages ADD COLUMN IF NOT EXISTS content_structured jsonb;
ALTER TABLE public.ai_messages ADD COLUMN IF NOT EXISTS total_tokens integer;
ALTER TABLE public.ai_messages ADD COLUMN IF NOT EXISTS credits_charged numeric(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.ai_messages ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE;

-- Backfill sequence_no by created_at order per session
WITH ordered AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY session_id ORDER BY created_at ASC, id ASC) AS rn
  FROM public.ai_messages
  WHERE sequence_no IS NULL
)
UPDATE public.ai_messages m
SET sequence_no = ordered.rn
FROM ordered
WHERE m.id = ordered.id;

-- Default remaining nulls
UPDATE public.ai_messages SET sequence_no = 1 WHERE sequence_no IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ai_messages_session_id_sequence_no_uidx
  ON public.ai_messages (session_id, sequence_no);

-- ---- ai_attachments enrich ----
ALTER TABLE public.ai_attachments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.ai_attachments ADD COLUMN IF NOT EXISTS bucket_name text NOT NULL DEFAULT 'ai-attachments';
ALTER TABLE public.ai_attachments ADD COLUMN IF NOT EXISTS object_path text;
ALTER TABLE public.ai_attachments ADD COLUMN IF NOT EXISTS mime_type text;
ALTER TABLE public.ai_attachments ADD COLUMN IF NOT EXISTS file_size_bytes bigint;
ALTER TABLE public.ai_attachments ADD COLUMN IF NOT EXISTS width integer;
ALTER TABLE public.ai_attachments ADD COLUMN IF NOT EXISTS height integer;
ALTER TABLE public.ai_attachments ADD COLUMN IF NOT EXISTS extracted_text text;
ALTER TABLE public.ai_attachments ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'pending';
ALTER TABLE public.ai_attachments ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.ai_attachments
SET object_path = storage_path
WHERE object_path IS NULL AND storage_path IS NOT NULL;

UPDATE public.ai_attachments
SET mime_type = mime
WHERE mime_type IS NULL AND mime IS NOT NULL;

UPDATE public.ai_attachments
SET file_size_bytes = bytes
WHERE file_size_bytes IS NULL AND bytes IS NOT NULL;

-- ---- ai_case_snapshots enrich ----
ALTER TABLE public.ai_case_snapshots ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles (id) ON DELETE CASCADE;
ALTER TABLE public.ai_case_snapshots ADD COLUMN IF NOT EXISTS open_questions jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_case_snapshots ADD COLUMN IF NOT EXISTS differential_list jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_case_snapshots ADD COLUMN IF NOT EXISTS next_steps jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ai_case_snapshots ADD COLUMN IF NOT EXISTS message_count integer;

UPDATE public.ai_case_snapshots
SET message_count = message_count_at
WHERE message_count IS NULL AND message_count_at IS NOT NULL;

-- ---- ai_credit_ledger enrich ----
ALTER TABLE public.ai_credit_ledger ADD COLUMN IF NOT EXISTS revenuecat_transaction_id text;
ALTER TABLE public.ai_credit_ledger ADD COLUMN IF NOT EXISTS expires_at timestamptz;
ALTER TABLE public.ai_credit_ledger ADD COLUMN IF NOT EXISTS note text;

DO $$
BEGIN
  ALTER TABLE public.ai_credit_ledger DROP CONSTRAINT IF EXISTS ai_credit_ledger_reason_check;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.ai_credit_ledger
  ADD CONSTRAINT ai_credit_ledger_reason_check
  CHECK (
    reason IN (
      'grant_monthly',
      'trial',
      'consume',
      'topup',
      'refund',
      'reserve',
      'release',
      'monthly_grant',
      'trial_grant',
      'topup_purchase',
      'usage_debit',
      'admin_adjustment'
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS ai_credit_ledger_rc_txn_uidx
  ON public.ai_credit_ledger (revenuecat_transaction_id)
  WHERE revenuecat_transaction_id IS NOT NULL;

-- ---- ai_entitlements ----
CREATE TABLE IF NOT EXISTS public.ai_entitlements (
  user_id uuid PRIMARY KEY REFERENCES public.profiles (id) ON DELETE CASCADE,
  is_pro boolean NOT NULL DEFAULT false,
  entitlement_key text,
  revenuecat_customer_id text,
  monthly_credit_grant numeric(10, 2) NOT NULL DEFAULT 0,
  current_balance numeric(10, 2) NOT NULL DEFAULT 0,
  trial_credits_remaining numeric(10, 2) NOT NULL DEFAULT 0,
  renews_at timestamptz,
  last_synced_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seed entitlements from latest ledger balances (best-effort)
INSERT INTO public.ai_entitlements (user_id, current_balance, trial_credits_remaining, updated_at)
SELECT DISTINCT ON (l.user_id)
  l.user_id,
  l.balance_after,
  0,
  now()
FROM public.ai_credit_ledger l
ORDER BY l.user_id, l.created_at DESC
ON CONFLICT (user_id) DO NOTHING;

-- Seed trial credits for users who never used clinical (spec: ~3 trial credits total)
-- Do not overwrite existing entitlement rows.

ALTER TABLE public.ai_entitlements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own ai entitlements" ON public.ai_entitlements;
CREATE POLICY "Users can view own ai entitlements"
  ON public.ai_entitlements FOR SELECT
  USING (public.current_profile_id() = user_id);

-- ---- RPC balance ----
CREATE OR REPLACE FUNCTION public.get_ai_credit_balance(p_user_id uuid)
RETURNS numeric(10, 2)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce((
    SELECT current_balance
    FROM public.ai_entitlements
    WHERE user_id = p_user_id
  ), 0);
$$;

REVOKE ALL ON FUNCTION public.get_ai_credit_balance(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ai_credit_balance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_credit_balance(uuid) TO service_role;

-- ---- updated_at trigger ----
CREATE OR REPLACE FUNCTION public.set_clinical_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_sessions_updated_at ON public.ai_sessions;
CREATE TRIGGER trg_ai_sessions_updated_at
BEFORE UPDATE ON public.ai_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_clinical_updated_at();

DROP TRIGGER IF EXISTS trg_ai_entitlements_updated_at ON public.ai_entitlements;
CREATE TRIGGER trg_ai_entitlements_updated_at
BEFORE UPDATE ON public.ai_entitlements
FOR EACH ROW EXECUTE FUNCTION public.set_clinical_updated_at();

SELECT '020_clinical_copilot_spec_align applied' AS status;
