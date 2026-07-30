-- ===========================================
-- MEDVBA: Kinde external auth + RLS
-- Run after Supabase JWT signing uses same HS256 secret as KINDE_CLIENT_SECRET (see Kinde+Supabase docs).
-- ===========================================

-- 1) profiles: drop FK to auth.users so Kinde-only users can exist
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2) Optional email on profiles (link legacy users by email on first Kinde login)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (lower(email));

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id AND (p.email IS NULL OR p.email = '') AND u.email IS NOT NULL;

-- 3) Columns used by the app / exchange endpoint (safe if already present)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 4) Kinde subject (stable user id from Kinde)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kinde_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_kinde_sub ON public.profiles (kinde_sub) WHERE kinde_sub IS NOT NULL;

-- 5) ai_question_usage: reference profiles instead of auth.users
-- Some DBs used profile_id for the same semantic (profile UUID); app + RLS expect user_id.
DO $$
DECLARE
  r record;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_question_usage'
  ) THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_question_usage' AND column_name = 'user_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_question_usage' AND column_name = 'profile_id'
  ) THEN
    -- Drop FKs so RENAME COLUMN can succeed regardless of constraint names.
    FOR r IN
      SELECT c.conname AS conname
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname = 'public' AND t.relname = 'ai_question_usage' AND c.contype = 'f'
    LOOP
      EXECUTE format('ALTER TABLE public.ai_question_usage DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;
    ALTER TABLE public.ai_question_usage RENAME COLUMN profile_id TO user_id;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_question_usage'
  ) THEN
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_question_usage' AND column_name = 'user_id'
  ) THEN
    RAISE NOTICE '005_kinde_jwt_rls: skipped ai_question_usage FK — no user_id (add column or align schema)';
    RETURN;
  END IF;
  ALTER TABLE public.ai_question_usage DROP CONSTRAINT IF EXISTS ai_question_usage_user_id_fkey;
  ALTER TABLE public.ai_question_usage
    ADD CONSTRAINT ai_question_usage_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
END $$;

-- 5b) Normalize profile_id -> user_id in legacy tables used by RLS policies
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'study_sessions',
      'direct_chat_participants',
      'direct_chat_messages',
      'user_progress',
      'daily_progress',
      'subscriptions',
      'user_presence',
      'user_achievements'
    ])
  LOOP
    IF to_regclass(format('public.%I', tbl)) IS NULL THEN
      CONTINUE;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'user_id'
    ) THEN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = tbl AND column_name = 'profile_id'
      ) THEN
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN profile_id TO user_id', tbl);
      ELSE
        -- Last-resort compatibility for older custom schemas:
        -- keep migration runnable even if the table used a different actor column name.
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN user_id uuid', tbl);
      END IF;
    END IF;
  END LOOP;
END $$;

-- 6) JWT helper: profile UUID from signed claim (preferred) or kinde_sub lookup
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (NULLIF(
      current_setting('request.jwt.claims', true)::json->>'profile_id',
      ''
    ))::uuid,
    (
      SELECT p.id
      FROM public.profiles p
      WHERE p.kinde_sub IS NOT NULL
        AND p.kinde_sub = NULLIF(
          current_setting('request.jwt.claims', true)::json->>'sub',
          ''
        )
      LIMIT 1
    )
  );
$$;

-- 7) RLS policies: replace auth.uid() with current_profile_id() (from 004_rls_security_hardening + storage)

-- study_sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.study_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.study_sessions FOR SELECT
  USING (public.current_profile_id() = user_id);

DROP POLICY IF EXISTS "Users can create own sessions" ON public.study_sessions;
CREATE POLICY "Users can create own sessions"
  ON public.study_sessions FOR INSERT
  WITH CHECK (public.current_profile_id() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON public.study_sessions;
CREATE POLICY "Users can update own sessions"
  ON public.study_sessions FOR UPDATE
  USING (public.current_profile_id() = user_id);

-- direct_chats
DROP POLICY IF EXISTS "Users can view chats they participate in" ON public.direct_chats;
CREATE POLICY "Users can view chats they participate in"
  ON public.direct_chats FOR SELECT
  USING (
    public.current_profile_id() IN (
      SELECT user_id FROM public.direct_chat_participants
      WHERE direct_chat_id = public.direct_chats.id
    )
  );

DROP POLICY IF EXISTS "Users can create chats" ON public.direct_chats;
CREATE POLICY "Users can create chats"
  ON public.direct_chats FOR INSERT
  WITH CHECK (public.current_profile_id() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update chats they own" ON public.direct_chats;
CREATE POLICY "Users can update chats they own"
  ON public.direct_chats FOR UPDATE
  USING (public.current_profile_id() = created_by);

-- direct_chat_messages
DROP POLICY IF EXISTS "Users can view messages in chats they're part of" ON public.direct_chat_messages;
CREATE POLICY "Users can view messages in chats they're part of"
  ON public.direct_chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.direct_chat_participants dcp
      JOIN public.direct_chats dc ON dcp.direct_chat_id = dc.id
      WHERE dc.id = direct_chat_messages.direct_chat_id
        AND dcp.user_id = public.current_profile_id()
    )
  );

DROP POLICY IF EXISTS "Users can send messages to chats they're part of" ON public.direct_chat_messages;
CREATE POLICY "Users can send messages to chats they're part of"
  ON public.direct_chat_messages FOR INSERT
  WITH CHECK (
    public.current_profile_id() IN (
      SELECT user_id FROM public.direct_chat_participants
      WHERE direct_chat_id = direct_chat_messages.direct_chat_id
    )
  );

-- direct_chat_participants
DROP POLICY IF EXISTS "Users can view participant lists" ON public.direct_chat_participants;
CREATE POLICY "Users can view participant lists"
  ON public.direct_chat_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.direct_chats dc
      WHERE dc.id = direct_chat_participants.direct_chat_id
        AND (
          dc.created_by = public.current_profile_id()
          OR EXISTS (
            SELECT 1 FROM public.direct_chat_participants dcp2
            WHERE dcp2.direct_chat_id = dc.id
              AND dcp2.user_id = public.current_profile_id()
          )
        )
    )
  );

-- activity_feed
DROP POLICY IF EXISTS "Users can view activity feed" ON public.activity_feed;
CREATE POLICY "Users can view activity feed"
  ON public.activity_feed FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create activity feed entries" ON public.activity_feed;
CREATE POLICY "Users can create activity feed entries"
  ON public.activity_feed FOR INSERT
  WITH CHECK (public.current_profile_id() IS NOT NULL);

-- study_rooms (schema-tolerant: supports is_public/created_by/host_id variants)
DO $$
DECLARE
  visibility_col text;
  owner_col text;
  member_col text;
  member_room_col text;
  conds text[] := ARRAY[]::text[];
  pol text;
BEGIN
  DROP POLICY IF EXISTS "Users can view accessible study rooms" ON public.study_rooms;

  SELECT c.column_name INTO visibility_col
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'study_rooms'
    AND c.column_name IN ('is_public', 'public')
  ORDER BY CASE c.column_name WHEN 'is_public' THEN 0 ELSE 1 END
  LIMIT 1;

  IF visibility_col IS NOT NULL THEN
    conds := conds || format('COALESCE(%I, false) = true', visibility_col);
  END IF;

  SELECT c.column_name INTO owner_col
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'study_rooms'
    AND c.column_name IN ('host_id', 'created_by', 'user_id', 'profile_id')
  ORDER BY CASE c.column_name
    WHEN 'host_id' THEN 0
    WHEN 'created_by' THEN 1
    WHEN 'user_id' THEN 2
    WHEN 'profile_id' THEN 3
    ELSE 9
  END
  LIMIT 1;

  IF owner_col IS NOT NULL THEN
    conds := conds || format('public.current_profile_id() = %I', owner_col);
  END IF;

  IF to_regclass('public.study_room_participants') IS NOT NULL THEN
    SELECT c.column_name INTO member_col
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'study_room_participants'
      AND c.column_name IN ('user_id', 'profile_id')
    ORDER BY CASE c.column_name WHEN 'user_id' THEN 0 ELSE 1 END
    LIMIT 1;

    SELECT c.column_name INTO member_room_col
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'study_room_participants'
      AND c.column_name IN ('room_id', 'study_room_id')
    ORDER BY CASE c.column_name WHEN 'room_id' THEN 0 ELSE 1 END
    LIMIT 1;

    IF member_col IS NOT NULL AND member_room_col IS NOT NULL THEN
      conds := conds || format(
        'EXISTS (SELECT 1 FROM public.study_room_participants srp WHERE srp.%I = public.study_rooms.id AND srp.%I = public.current_profile_id())',
        member_room_col,
        member_col
      );
    END IF;
  END IF;

  IF array_length(conds, 1) IS NULL THEN
    conds := ARRAY['true'];
  END IF;

  pol := format(
    'CREATE POLICY "Users can view accessible study rooms" ON public.study_rooms FOR SELECT USING (%s);',
    array_to_string(conds, ' OR ')
  );
  EXECUTE pol;
END $$;

DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.study_rooms;
CREATE POLICY "Authenticated users can create rooms"
  ON public.study_rooms FOR INSERT
  WITH CHECK (public.current_profile_id() IS NOT NULL);

DROP POLICY IF EXISTS "Room creators can update rooms" ON public.study_rooms;
DO $$
DECLARE
  owner_col text;
BEGIN
  SELECT c.column_name INTO owner_col
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'study_rooms'
    AND c.column_name IN ('host_id', 'created_by', 'user_id', 'profile_id')
  ORDER BY CASE c.column_name
    WHEN 'host_id' THEN 0
    WHEN 'created_by' THEN 1
    WHEN 'user_id' THEN 2
    WHEN 'profile_id' THEN 3
    ELSE 9
  END
  LIMIT 1;

  IF owner_col IS NULL THEN
    EXECUTE 'CREATE POLICY "Room creators can update rooms" ON public.study_rooms FOR UPDATE USING (false);';
  ELSE
    EXECUTE format(
      'CREATE POLICY "Room creators can update rooms" ON public.study_rooms FOR UPDATE USING (public.current_profile_id() = %I);',
      owner_col
    );
  END IF;
END $$;

-- user_progress
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
CREATE POLICY "Users can view own progress"
  ON public.user_progress FOR SELECT
  USING (public.current_profile_id() = user_id);

DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;
CREATE POLICY "Users can update own progress"
  ON public.user_progress FOR ALL
  USING (public.current_profile_id() = user_id);

-- daily_progress
DROP POLICY IF EXISTS "Users can view own daily progress" ON public.daily_progress;
CREATE POLICY "Users can view own daily progress"
  ON public.daily_progress FOR SELECT
  USING (public.current_profile_id() = user_id);

DROP POLICY IF EXISTS "Users can update own daily progress" ON public.daily_progress;
CREATE POLICY "Users can update own daily progress"
  ON public.daily_progress FOR ALL
  USING (public.current_profile_id() = user_id);

-- profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (public.current_profile_id() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    kinde_sub IS NOT NULL
    AND kinde_sub = NULLIF(current_setting('request.jwt.claims', true)::json->>'sub', '')
  );

-- subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (public.current_profile_id() = user_id);

DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;
CREATE POLICY "Users can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (public.current_profile_id() = user_id);

-- user_presence
DROP POLICY IF EXISTS "User presence is viewable by everyone" ON public.user_presence;
CREATE POLICY "User presence is viewable by everyone"
  ON public.user_presence FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own presence" ON public.user_presence;
CREATE POLICY "Users can update own presence"
  ON public.user_presence FOR ALL
  USING (public.current_profile_id() = user_id);

-- ai_question_usage (skip if table/column missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ai_question_usage' AND column_name = 'user_id'
  ) THEN
    RETURN;
  END IF;

  DROP POLICY IF EXISTS "Users can view own AI usage" ON public.ai_question_usage;
  CREATE POLICY "Users can view own AI usage"
    ON public.ai_question_usage FOR SELECT
    USING (public.current_profile_id() = user_id);

  DROP POLICY IF EXISTS "Users can update own AI usage" ON public.ai_question_usage;
  CREATE POLICY "Users can update own AI usage"
    ON public.ai_question_usage FOR UPDATE
    USING (public.current_profile_id() = user_id);

  DROP POLICY IF EXISTS "Users can insert own AI usage" ON public.ai_question_usage;
  CREATE POLICY "Users can insert own AI usage"
    ON public.ai_question_usage FOR INSERT
    WITH CHECK (public.current_profile_id() = user_id);
END $$;

-- user_achievements
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.user_achievements;
CREATE POLICY "Achievements are viewable by everyone"
  ON public.user_achievements FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (public.current_profile_id() IS NOT NULL);

-- storage.objects (profile-photos)
DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
CREATE POLICY "Users can upload their own profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = public.current_profile_id()::text
  );

DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
CREATE POLICY "Users can update their own profile photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = public.current_profile_id()::text
  );

DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
CREATE POLICY "Users can delete their own profile photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-photos'
    AND (storage.foldername(name))[1] = public.current_profile_id()::text
  );

SELECT '005_kinde_jwt_rls applied' AS status;
