-- Fix RLS recursion on study_rooms.
--
-- The previous "Users can view accessible study rooms" policy could query
-- study_room_participants; if that table has a policy that references
-- study_rooms, Postgres detects infinite recursion for relation "study_rooms".
--
-- The app's study-room list is a public discovery surface, so SELECT can be
-- public while INSERT/UPDATE remain protected by current_profile_id().

DROP POLICY IF EXISTS "Study rooms are viewable by everyone" ON public.study_rooms;
DROP POLICY IF EXISTS "Users can view accessible study rooms" ON public.study_rooms;

CREATE POLICY "Study rooms are viewable by everyone"
  ON public.study_rooms
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.study_rooms;
CREATE POLICY "Authenticated users can create rooms"
  ON public.study_rooms
  FOR INSERT
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

SELECT '006_fix_study_rooms_rls_recursion applied' AS status;
