-- Weighted gamification: persist scored points; rank leaderboard by points

ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.daily_progress
  ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- One-time backfill from question counts (existing rows)
UPDATE public.user_progress
SET points = total_questions_answered
WHERE points = 0 AND total_questions_answered > 0;

UPDATE public.daily_progress
SET points = questions_answered
WHERE points = 0 AND questions_answered > 0;

COMMENT ON COLUMN public.user_progress.points IS 'Weighted quiz score (correct/wrong/streak/daily-goal bonuses)';
COMMENT ON COLUMN public.daily_progress.points IS 'Points earned on this calendar day';

-- Rank by scored points (allTime / period sums)
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_period TEXT DEFAULT 'allTime',
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  avatar TEXT,
  points BIGINT,
  streak INTEGER,
  rank BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_period = 'allTime' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.name,
      COALESCE(p.profile_photo_url, p.avatar, 'https://api.dicebear.com/7.x/avataaars/png?seed=' || p.id) AS avatar,
      up.points::BIGINT AS points,
      up.current_streak::INTEGER AS streak,
      ROW_NUMBER() OVER (ORDER BY up.points DESC)::BIGINT AS rank
    FROM profiles p
    INNER JOIN user_progress up ON up.user_id = p.id
    WHERE up.points > 0
    ORDER BY up.points DESC
    LIMIT p_limit;
  ELSIF p_period = 'weekly' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.name,
      COALESCE(p.profile_photo_url, p.avatar, 'https://api.dicebear.com/7.x/avataaars/png?seed=' || p.id) AS avatar,
      COALESCE(SUM(d.points), 0)::BIGINT AS points,
      up.current_streak::INTEGER AS streak,
      ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(d.points), 0) DESC)::BIGINT AS rank
    FROM profiles p
    INNER JOIN user_progress up ON up.user_id = p.id
    LEFT JOIN daily_progress d ON d.user_id = p.id AND d.date >= (CURRENT_DATE - INTERVAL '7 days')
    GROUP BY p.id, p.name, p.profile_photo_url, p.avatar, up.current_streak
    HAVING COALESCE(SUM(d.points), 0) > 0
    ORDER BY points DESC
    LIMIT p_limit;
  ELSIF p_period = 'monthly' THEN
    RETURN QUERY
    SELECT
      p.id,
      p.name,
      COALESCE(p.profile_photo_url, p.avatar, 'https://api.dicebear.com/7.x/avataaars/png?seed=' || p.id) AS avatar,
      COALESCE(SUM(d.points), 0)::BIGINT AS points,
      up.current_streak::INTEGER AS streak,
      ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(d.points), 0) DESC)::BIGINT AS rank
    FROM profiles p
    INNER JOIN user_progress up ON up.user_id = p.id
    LEFT JOIN daily_progress d ON d.user_id = p.id AND d.date >= (CURRENT_DATE - INTERVAL '30 days')
    GROUP BY p.id, p.name, p.profile_photo_url, p.avatar, up.current_streak
    HAVING COALESCE(SUM(d.points), 0) > 0
    ORDER BY points DESC
    LIMIT p_limit;
  ELSE
    -- daily: today only
    RETURN QUERY
    SELECT
      p.id,
      p.name,
      COALESCE(p.profile_photo_url, p.avatar, 'https://api.dicebear.com/7.x/avataaars/png?seed=' || p.id) AS avatar,
      COALESCE(d.points, 0)::BIGINT AS points,
      up.current_streak::INTEGER AS streak,
      ROW_NUMBER() OVER (ORDER BY COALESCE(d.points, 0) DESC)::BIGINT AS rank
    FROM profiles p
    INNER JOIN user_progress up ON up.user_id = p.id
    LEFT JOIN daily_progress d ON d.user_id = p.id AND d.date = CURRENT_DATE
    WHERE COALESCE(d.points, 0) > 0
    ORDER BY points DESC
    LIMIT p_limit;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.get_leaderboard(TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(TEXT, INTEGER) TO authenticated;

COMMENT ON POLICY "Authenticated users can read all progress for leaderboard" ON user_progress IS 'Enables leaderboard to show top users by scored points';
COMMENT ON POLICY "Authenticated users can read all daily progress for leaderboard" ON daily_progress IS 'Enables weekly/monthly leaderboard aggregation by points';
