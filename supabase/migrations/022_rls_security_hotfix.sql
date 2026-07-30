-- ===========================================
-- 022: RLS security hotfix (F18–F20)
-- - profiles: SELECT own only (stop email/PII leak)
-- - public_profiles: non-PII directory for social
-- - get_my_ai_credit_balance: no UUID param (stop IDOR)
-- - achievements / activity_feed: INSERT must match current profile
-- ===========================================

-- Ensure social columns exist (used by client + public_profiles)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS university TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year_of_study INTEGER;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- ---- F18: profiles SELECT own only ----
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = public.current_profile_id());

-- Public directory without email / kinde_sub / premium / entitlements.
-- security_invoker = false so the view can list other users while base-table
-- RLS stays own-only (invoker=true would only ever return the caller's row).
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false)
AS
SELECT
  id,
  name,
  avatar,
  username,
  bio,
  city,
  university,
  year_of_study,
  is_public,
  profile_photo_url,
  created_at
FROM public.profiles
WHERE coalesce(is_public, true) = true;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- ---- F19: credit balance — no arbitrary UUID from client ----
CREATE OR REPLACE FUNCTION public.get_my_ai_credit_balance()
RETURNS numeric(10, 2)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    (
      SELECT current_balance
      FROM public.ai_entitlements
      WHERE user_id = public.current_profile_id()
    ),
    0
  );
$$;

REVOKE ALL ON FUNCTION public.get_ai_credit_balance(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_ai_credit_balance(uuid) FROM authenticated;
-- service_role may keep execute for ops/scripts
GRANT EXECUTE ON FUNCTION public.get_ai_credit_balance(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.get_my_ai_credit_balance() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_ai_credit_balance() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_ai_credit_balance() TO service_role;

-- ---- F20: achievements / activity insert ownership ----
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "authenticated_users_can_insert_achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "users_insert_own_achievements" ON public.user_achievements;

CREATE POLICY "users_insert_own_achievements"
  ON public.user_achievements
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = public.current_profile_id());

DROP POLICY IF EXISTS "Users can create activity feed entries" ON public.activity_feed;
DROP POLICY IF EXISTS "authenticated_users_can_insert_activity" ON public.activity_feed;
DROP POLICY IF EXISTS "users_insert_own_activity" ON public.activity_feed;

CREATE POLICY "users_insert_own_activity"
  ON public.activity_feed
  FOR INSERT
  TO authenticated
  WITH CHECK (actor_id = public.current_profile_id());
