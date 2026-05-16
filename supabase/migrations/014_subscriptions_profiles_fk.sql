-- subscriptions.user_id must reference profiles.id (MEDVBA profile UUID from Kinde JWT).
-- Legacy FK to auth.users causes 23503 for Kinde-only users without auth.users rows.

DELETE FROM public.subscriptions s
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = s.user_id);

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
      AND t.relname = 'subscriptions'
      AND c.contype = 'f'
      AND a.attname = 'user_id'
  LOOP
    EXECUTE format('ALTER TABLE public.subscriptions DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

-- Stop creating subscription rows from auth.users (Kinde users may never exist there).
DROP TRIGGER IF EXISTS on_auth_user_created_subscription ON auth.users;

CREATE OR REPLACE FUNCTION public.create_default_subscription_for_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, status)
  VALUES (NEW.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_created_subscription ON public.profiles;
CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_subscription_for_profile();

INSERT INTO public.subscriptions (user_id, status)
SELECT p.id, 'free'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
