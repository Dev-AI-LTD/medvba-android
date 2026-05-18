-- direct_chats / participants / messages must reference public.profiles (Kinde profile_id).
-- Some DBs still FK to public.users; profiles rows exist without users rows → 23503 on chat create.

-- direct_chats.created_by
DELETE FROM public.direct_chat_messages dm
WHERE NOT EXISTS (SELECT 1 FROM public.direct_chats dc WHERE dc.id = dm.chat_id);

DELETE FROM public.direct_chat_participants dcp
WHERE NOT EXISTS (SELECT 1 FROM public.direct_chats dc WHERE dc.id = dcp.chat_id);

DELETE FROM public.direct_chat_participants dcp
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = dcp.user_id);

DELETE FROM public.direct_chats dc
WHERE dc.created_by IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = dc.created_by);

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT c.conname AS conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN unnest(c.conkey) AS ck(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ck.attnum AND a.attisdropped = false
    WHERE n.nspname = 'public'
      AND t.relname = 'direct_chats'
      AND c.contype = 'f'
      AND a.attname = 'created_by'
  LOOP
    EXECUTE format('ALTER TABLE public.direct_chats DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.direct_chats
  ADD CONSTRAINT direct_chats_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.profiles (id) ON DELETE SET NULL;

-- direct_chat_participants.user_id
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT c.conname AS conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN unnest(c.conkey) AS ck(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ck.attnum AND a.attisdropped = false
    WHERE n.nspname = 'public'
      AND t.relname = 'direct_chat_participants'
      AND c.contype = 'f'
      AND a.attname = 'user_id'
  LOOP
    EXECUTE format('ALTER TABLE public.direct_chat_participants DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.direct_chat_participants
  ADD CONSTRAINT direct_chat_participants_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

-- direct_chat_messages.user_id
DELETE FROM public.direct_chat_messages dm
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = dm.user_id);

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT c.conname AS conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    JOIN unnest(c.conkey) AS ck(attnum) ON true
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ck.attnum AND a.attisdropped = false
    WHERE n.nspname = 'public'
      AND t.relname = 'direct_chat_messages'
      AND c.contype = 'f'
      AND a.attname = 'user_id'
  LOOP
    EXECUTE format('ALTER TABLE public.direct_chat_messages DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.direct_chat_messages
  ADD CONSTRAINT direct_chat_messages_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

SELECT '014_direct_chats_fk_profiles applied' AS status;
