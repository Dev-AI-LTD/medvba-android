-- ===========================================
-- 026: Bridge chat_id → direct_chat_id
-- ===========================================
-- Canonical FK column on direct_chat_participants / direct_chat_messages is
-- direct_chat_id (matches 004+). Existing DBs that still have chat_id get a
-- safe rename. Fresh bootstraps already using direct_chat_id are a no-op.
--
-- Four states per table:
--   1) chat_id exists, direct_chat_id absent  → RENAME
--   2) only direct_chat_id                   → no-op
--   3) both columns                         → FAIL loudly (no silent merge)
--   4) neither / table missing              → no-op + notice
--
-- After rename (or when already canonical): recreate SECURITY DEFINER helper
-- and 007-style policies that embed column names as SQL text.

BEGIN;

CREATE OR REPLACE FUNCTION public.medvba_026_bridge_rename_chat_id(p_table text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  has_table boolean;
  has_chat boolean;
  has_direct boolean;
  old_idx text;
  new_idx text;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table
  ) INTO has_table;

  IF NOT has_table THEN
    RAISE NOTICE '026: public.% missing — no-op', p_table;
    RETURN 'missing_table';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = 'chat_id'
  ) INTO has_chat;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = 'direct_chat_id'
  ) INTO has_direct;

  IF has_chat AND has_direct THEN
    RAISE EXCEPTION
      '026: both chat_id and direct_chat_id exist on public.% — refuse ambiguous merge',
      p_table;
  END IF;

  IF has_chat AND NOT has_direct THEN
    EXECUTE format(
      'ALTER TABLE public.%I RENAME COLUMN chat_id TO direct_chat_id',
      p_table
    );

    old_idx := 'idx_' || p_table || '_chat_id';
    new_idx := 'idx_' || p_table || '_direct_chat_id';
    IF EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname = old_idx
    ) AND NOT EXISTS (
      SELECT 1
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'i' AND c.relname = new_idx
    ) THEN
      EXECUTE format('ALTER INDEX public.%I RENAME TO %I', old_idx, new_idx);
    END IF;

    RAISE NOTICE '026: renamed public.%.chat_id → direct_chat_id', p_table;
    RETURN 'renamed';
  END IF;

  IF has_direct THEN
    RAISE NOTICE '026: public.% already has direct_chat_id — no-op', p_table;
    RETURN 'already_canonical';
  END IF;

  RAISE NOTICE '026: public.% has neither chat_id nor direct_chat_id — no-op', p_table;
  RETURN 'neither';
END;
$$;

SELECT public.medvba_026_bridge_rename_chat_id('direct_chat_participants') AS participants_bridge;
SELECT public.medvba_026_bridge_rename_chat_id('direct_chat_messages') AS messages_bridge;

DROP FUNCTION public.medvba_026_bridge_rename_chat_id(text);

-- Recreate RLS helper + policies when participants table has direct_chat_id.
DO $$
DECLARE
  has_participants boolean;
  has_messages boolean;
  has_direct boolean;
  rel_owner name;
  pol text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'direct_chat_participants'
  ) INTO has_participants;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'direct_chat_messages'
  ) INTO has_messages;

  IF NOT has_participants THEN
    RAISE NOTICE '026: skip RLS recreate — direct_chat_participants missing';
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'direct_chat_participants'
      AND column_name = 'direct_chat_id'
  ) INTO has_direct;

  IF NOT has_direct THEN
    RAISE NOTICE '026: skip RLS recreate — direct_chat_id not present';
    RETURN;
  END IF;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.medvba_direct_chat_created_by_profile(p_chat_id uuid)
    RETURNS uuid
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $body$
      SELECT dc.created_by FROM public.direct_chats dc WHERE dc.id = p_chat_id LIMIT 1;
    $body$;
  $fn$;

  EXECUTE $fn$
    CREATE OR REPLACE FUNCTION public.medvba_is_direct_chat_participant(p_chat_id uuid, p_profile_id uuid)
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $body$
      SELECT EXISTS (
        SELECT 1
        FROM public.direct_chat_participants dcp
        WHERE dcp.direct_chat_id = p_chat_id
          AND dcp.user_id = p_profile_id
      );
    $body$;
  $fn$;

  SELECT pg_get_userbyid(c.relowner) INTO rel_owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'direct_chat_participants';

  IF rel_owner IS NOT NULL THEN
    EXECUTE format(
      'ALTER FUNCTION public.medvba_direct_chat_created_by_profile(uuid) OWNER TO %I',
      rel_owner
    );
    EXECUTE format(
      'ALTER FUNCTION public.medvba_is_direct_chat_participant(uuid, uuid) OWNER TO %I',
      rel_owner
    );
  END IF;

  REVOKE ALL ON FUNCTION public.medvba_direct_chat_created_by_profile(uuid) FROM PUBLIC;
  REVOKE ALL ON FUNCTION public.medvba_is_direct_chat_participant(uuid, uuid) FROM PUBLIC;
  GRANT EXECUTE ON FUNCTION public.medvba_direct_chat_created_by_profile(uuid) TO authenticated, service_role;
  GRANT EXECUTE ON FUNCTION public.medvba_is_direct_chat_participant(uuid, uuid) TO authenticated, service_role;

  -- current_profile_id may be absent on very early DBs; policies still match 007.
  DROP POLICY IF EXISTS "Users can view chats they participate in" ON public.direct_chats;
  CREATE POLICY "Users can view chats they participate in"
    ON public.direct_chats FOR SELECT
    USING (
      public.medvba_is_direct_chat_participant(id, public.current_profile_id())
      OR public.medvba_direct_chat_created_by_profile(id) = public.current_profile_id()
    );

  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'direct_chat_participants'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.direct_chat_participants', pol);
  END LOOP;

  CREATE POLICY "Users can view participant lists"
    ON public.direct_chat_participants FOR SELECT
    USING (
      public.medvba_is_direct_chat_participant(direct_chat_id, public.current_profile_id())
      OR public.medvba_direct_chat_created_by_profile(direct_chat_id) = public.current_profile_id()
    );

  CREATE POLICY "Users can join chats"
    ON public.direct_chat_participants FOR INSERT
    WITH CHECK (
      user_id = public.current_profile_id()
      OR public.medvba_direct_chat_created_by_profile(direct_chat_id) = public.current_profile_id()
    );

  IF has_messages THEN
    DROP POLICY IF EXISTS "Users can view messages in chats they're part of" ON public.direct_chat_messages;
    DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.direct_chat_messages;
    CREATE POLICY "Users can view messages in chats they're part of"
      ON public.direct_chat_messages FOR SELECT
      USING (public.medvba_is_direct_chat_participant(direct_chat_id, public.current_profile_id()));

    DROP POLICY IF EXISTS "Users can send messages to chats they're part of" ON public.direct_chat_messages;
    DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.direct_chat_messages;
    CREATE POLICY "Users can send messages to chats they're part of"
      ON public.direct_chat_messages FOR INSERT
      WITH CHECK (
        user_id = public.current_profile_id()
        AND public.medvba_is_direct_chat_participant(direct_chat_id, public.current_profile_id())
      );
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

SELECT '026_rename_chat_id_to_direct_chat_id applied' AS status;

COMMIT;
