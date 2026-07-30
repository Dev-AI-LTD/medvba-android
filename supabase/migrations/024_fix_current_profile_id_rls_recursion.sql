-- ===========================================
-- 024: fix current_profile_id RLS recursion
-- After 023 removed USING(true) SELECT policies, profiles SELECT
-- via current_profile_id() stacked until "stack depth limit exceeded"
-- because the SQL helper SELECTs profiles under invoker RLS.
-- SECURITY DEFINER + fixed search_path breaks the cycle.
-- Also resolve kinde_sub from claim "kinde_sub" before JWT "sub".
-- ===========================================

CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
        AND p.kinde_sub = COALESCE(
          NULLIF(
            current_setting('request.jwt.claims', true)::json->>'kinde_sub',
            ''
          ),
          NULLIF(
            current_setting('request.jwt.claims', true)::json->>'sub',
            ''
          )
        )
      LIMIT 1
    )
  );
$$;

REVOKE ALL ON FUNCTION public.current_profile_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO anon;
GRANT EXECUTE ON FUNCTION public.current_profile_id() TO service_role;
