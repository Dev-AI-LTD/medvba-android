/** Daily question goal (rings stay question-count based). */
export const DAILY_QUESTION_GOAL = 50;

/** One-time points bonus when first crossing the daily question goal. */
export const DAILY_GOAL_POINTS_BONUS = 25;

/** Max streak days that add to a correct-answer score. */
export const MAX_STREAK_BONUS = 7;

export type AnswerScoreResult = {
  basePoints: number;
  streakBonus: number;
  total: number;
};

/**
 * Weighted points for a unique quiz answer today.
 * Correct: +10 + min(currentStreak, 7); wrong: +2.
 */
export function computeAnswerPoints(correct: boolean, currentStreak: number): AnswerScoreResult {
  if (!correct) {
    return { basePoints: 2, streakBonus: 0, total: 2 };
  }
  const streakBonus = Math.min(Math.max(0, currentStreak), MAX_STREAK_BONUS);
  return { basePoints: 10, streakBonus, total: 10 + streakBonus };
}

/**
 * +25 once when questions answered crosses the daily goal (e.g. 49 → 50).
 */
export function computeDailyGoalBonus(
  previousQuestionsAnswered: number,
  nextQuestionsAnswered: number,
  alreadyGranted: boolean,
): number {
  if (alreadyGranted) return 0;
  if (previousQuestionsAnswered < DAILY_QUESTION_GOAL && nextQuestionsAnswered >= DAILY_QUESTION_GOAL) {
    return DAILY_GOAL_POINTS_BONUS;
  }
  return 0;
}

/** Local calendar YYYY-MM-DD (not UTC ISO). */
export function formatLocalDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getLocalYesterdayDateString(now: Date = new Date()): string {
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return formatLocalDate(yesterday);
}

export type StreakSnapshot = {
  currentStreak: number;
  lastActiveDate: string;
  longestStreak: number;
};

/**
 * Advance streak on first activity of a local calendar day.
 * Miss a day → reset to 1. Same day → unchanged.
 */
export function computeNextStreak(
  prev: StreakSnapshot,
  today: string = formatLocalDate(),
  yesterday: string = getLocalYesterdayDateString(),
): StreakSnapshot {
  if (prev.lastActiveDate === today) {
    return prev;
  }

  let newStreak = 1;
  if (prev.lastActiveDate === yesterday) {
    newStreak = prev.currentStreak + 1;
  } else if (prev.lastActiveDate === '') {
    newStreak = 1;
  }

  return {
    currentStreak: newStreak,
    lastActiveDate: today,
    longestStreak: Math.max(prev.longestStreak, newStreak),
  };
}
