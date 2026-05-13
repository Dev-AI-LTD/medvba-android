-- user_achievements.user_id must reference the same actor as the app + JWT (profiles.id).
-- Some databases still FK to public.users or auth.users; Kinde users exist in public.profiles
-- without a matching public.users row, causing 23503 on grant_my_achievement.

DELETE FROM public.user_achievements ua
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = ua.user_id);

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
      AND t.relname = 'user_achievements'
      AND c.contype = 'f'
      AND a.attname = 'user_id'
  LOOP
    EXECUTE format('ALTER TABLE public.user_achievements DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.user_achievements
  ADD CONSTRAINT user_achievements_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;
