-- grant_my_achievement: use app profile id (Kinde JWT) instead of auth.uid() alone.
-- Fixes FK violations when user_id references public.profiles/public.users but
-- auth.uid() does not match that row (external auth + profile_id claim).

CREATE OR REPLACE FUNCTION public.grant_my_achievement(p_achievement text)
RETURNS public.user_achievements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := COALESCE(
    (SELECT public.current_profile_id()),
    (SELECT auth.uid())
  );
  v_row public.user_achievements;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_achievements (user_id, achievement_type)
  VALUES (v_uid, p_achievement)
  ON CONFLICT (user_id, achievement_type)
  DO UPDATE SET earned_at = public.user_achievements.earned_at
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_my_achievement(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_my_achievement(text) TO authenticated;
