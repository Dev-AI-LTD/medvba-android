-- ===========================================
-- 023: profiles SELECT own-only (close leftover open policies)
-- Root cause: 022 added profiles_select_own but left older PERMISSIVE
-- SELECT policies with USING (true). Postgres ORs permissive policies,
-- so cross-user reads still succeeded via PostgREST.
-- Keep public.public_profiles for non-PII peer directory reads.
-- ===========================================

-- Open / leftover SELECT policies (any one of these defeats own-only)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;

-- Catastrophic leftover: ALL USING (true) for PUBLIC (OR'd with SELECT policies)
DROP POLICY IF EXISTS "profiles_service_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_service_insert" ON public.profiles;

-- Recreate own-only SELECT (idempotent)
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = public.current_profile_id());

-- Ensure non-PII directory view still exists for peer reads
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
