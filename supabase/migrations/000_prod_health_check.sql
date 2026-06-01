-- Read-only production health check. Safe to run anytime in SQL Editor.
-- One result table (Supabase shows only the last SELECT if you use multiple).
-- See docs/SUPABASE_SQL_GUIDE.md for interpretation.

SELECT * FROM (
  SELECT 'current_profile_id' AS check_name,
         EXISTS (
           SELECT 1 FROM pg_proc p
           JOIN pg_namespace n ON p.pronamespace = n.oid
           WHERE n.nspname = 'public' AND p.proname = 'current_profile_id'
         ) AS ok
  UNION ALL
  SELECT 'profiles.kinde_sub',
         EXISTS (
           SELECT 1 FROM information_schema.columns
           WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'kinde_sub'
         )
  UNION ALL
  SELECT 'subscriptions_rls_free_only',
         EXISTS (
           SELECT 1
           FROM pg_policy pol
           JOIN pg_class cls ON cls.oid = pol.polrelid
           JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
           WHERE nsp.nspname = 'public' AND cls.relname = 'subscriptions'
             AND pol.polname = 'Users can update own subscription'
             AND pg_get_expr(pol.polwithcheck, pol.polrelid) ILIKE '%free%'
         )
  UNION ALL
  SELECT 'user_reports_table',
         EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'user_reports'
         )
  UNION ALL
  SELECT 'chapter_study_content',
         EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'chapter_study_content'
         )
  UNION ALL
  SELECT 'ai_question_usage',
         EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public' AND table_name = 'ai_question_usage'
         )
) checks
ORDER BY check_name;
