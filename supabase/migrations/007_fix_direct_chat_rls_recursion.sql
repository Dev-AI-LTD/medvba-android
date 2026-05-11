-- Fix PostgreSQL error 42P17: infinite recursion in RLS for direct_chat_participants.
--
-- Causes:
-- 1) Policies on direct_chats and direct_chat_participants referenced each other in a cycle.
-- 2) Policies that call a SECURITY DEFINER helper which re-scans the same table under RLS
--    still recurse unless the function owner bypasses RLS on those tables (table owner does).
--
-- This migration:
-- - Defines helpers that read membership / created_by without policy-to-policy cycles.
-- - Sets function OWNER to the direct_chat_participants table owner so inner SELECTs bypass RLS.
-- - Drops ALL existing policies on direct_chat_participants (names differ per environment).

CREATE OR REPLACE FUNCTION public.medvba_direct_chat_created_by_profile(p_chat_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dc.created_by FROM public.direct_chats dc WHERE dc.id = p_chat_id LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.medvba_is_direct_chat_participant(p_chat_id uuid, p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.direct_chat_participants dcp
    WHERE dcp.chat_id = p_chat_id
      AND dcp.user_id = p_profile_id
  );
$$;

-- Table owner bypasses RLS on their tables → no recursion when policies call these helpers.
DO $$
DECLARE
  rel_owner name;
BEGIN
  SELECT pg_get_userbyid(c.relowner) INTO rel_owner
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'direct_chat_participants';

  IF rel_owner IS NOT NULL THEN
    EXECUTE format('ALTER FUNCTION public.medvba_direct_chat_created_by_profile(uuid) OWNER TO %I', rel_owner);
    EXECUTE format('ALTER FUNCTION public.medvba_is_direct_chat_participant(uuid, uuid) OWNER TO %I', rel_owner);
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.medvba_direct_chat_created_by_profile(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.medvba_is_direct_chat_participant(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.medvba_direct_chat_created_by_profile(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.medvba_is_direct_chat_participant(uuid, uuid) TO authenticated, service_role;

-- direct_chats SELECT (no subquery on participants from policy text)
DROP POLICY IF EXISTS "Users can view chats they participate in" ON public.direct_chats;
CREATE POLICY "Users can view chats they participate in"
  ON public.direct_chats FOR SELECT
  USING (
    public.medvba_is_direct_chat_participant(id, public.current_profile_id())
    OR public.medvba_direct_chat_created_by_profile(id) = public.current_profile_id()
  );

-- Remove every participants policy (avoids duplicate / stale recursive policies)
DO $$
DECLARE
  pol text;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'direct_chat_participants'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.direct_chat_participants', pol);
  END LOOP;
END $$;

CREATE POLICY "Users can view participant lists"
  ON public.direct_chat_participants FOR SELECT
  USING (
    public.medvba_is_direct_chat_participant(chat_id, public.current_profile_id())
    OR public.medvba_direct_chat_created_by_profile(chat_id) = public.current_profile_id()
  );

CREATE POLICY "Users can join chats"
  ON public.direct_chat_participants FOR INSERT
  WITH CHECK (
    user_id = public.current_profile_id()
    OR public.medvba_direct_chat_created_by_profile(chat_id) = public.current_profile_id()
  );

-- Messages: no JOIN that re-enters participants RLS from policy body
DROP POLICY IF EXISTS "Users can view messages in chats they're part of" ON public.direct_chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.direct_chat_messages;
CREATE POLICY "Users can view messages in chats they're part of"
  ON public.direct_chat_messages FOR SELECT
  USING (public.medvba_is_direct_chat_participant(chat_id, public.current_profile_id()));

DROP POLICY IF EXISTS "Users can send messages to chats they're part of" ON public.direct_chat_messages;
DROP POLICY IF EXISTS "Users can send messages in their chats" ON public.direct_chat_messages;
CREATE POLICY "Users can send messages to chats they're part of"
  ON public.direct_chat_messages FOR INSERT
  WITH CHECK (
    user_id = public.current_profile_id()
    AND public.medvba_is_direct_chat_participant(chat_id, public.current_profile_id())
  );

NOTIFY pgrst, 'reload schema';
