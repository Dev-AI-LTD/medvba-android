-- RLS 022 metadata probes only (no row data). Exit via application of results in script.
SELECT 'profiles_select_own' AS probe,
  EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'profiles_select_own'
  ) AS ok
UNION ALL
-- Fail if any permissive SELECT still uses USING (true) (defeats own-only via OR)
SELECT 'profiles_no_open_select',
  NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND cmd = 'SELECT'
      AND permissive = 'PERMISSIVE'
      AND qual IN ('true', '(true)')
  )
UNION ALL
SELECT 'profiles_no_open_all',
  NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND cmd = 'ALL'
      AND permissive = 'PERMISSIVE'
      AND qual IN ('true', '(true)')
  )
UNION ALL
SELECT 'public_profiles',
  EXISTS (
    SELECT 1 FROM pg_views
    WHERE schemaname = 'public' AND viewname = 'public_profiles'
  )
UNION ALL
SELECT 'get_my_ai_credit_balance',
  EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_my_ai_credit_balance'
  )
UNION ALL
SELECT 'legacy_rpc_no_authenticated_execute',
  NOT COALESCE(
    has_function_privilege('authenticated', 'public.get_ai_credit_balance(uuid)', 'EXECUTE'),
    false
  );
