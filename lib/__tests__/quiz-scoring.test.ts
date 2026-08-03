import {
  computeAnswerPoints,
  computeDailyGoalBonus,
  computeNextStreak,
  DAILY_GOAL_POINTS_BONUS,
  formatLocalDate,
  getLocalYesterdayDateString,
} from '../quiz-scoring';

describe('quiz-scoring', () => {
  describe('computeAnswerPoints', () => {
    it('awards +10 + streak bonus for correct answers', () => {
      expect(computeAnswerPoints(true, 1)).toEqual({ basePoints: 10, streakBonus: 1, total: 11 });
      expect(computeAnswerPoints(true, 7)).toEqual({ basePoints: 10, streakBonus: 7, total: 17 });
      expect(computeAnswerPoints(true, 12)).toEqual({ basePoints: 10, streakBonus: 7, total: 17 });
    });

    it('awards +2 for wrong answers with no streak bonus', () => {
      expect(computeAnswerPoints(false, 5)).toEqual({ basePoints: 2, streakBonus: 0, total: 2 });
    });
  });

  describe('computeDailyGoalBonus', () => {
    it('grants +25 when first crossing 50 questions', () => {
      expect(computeDailyGoalBonus(49, 50, false)).toBe(DAILY_GOAL_POINTS_BONUS);
    });

    it('does not grant again once already granted', () => {
      expect(computeDailyGoalBonus(49, 50, true)).toBe(0);
      expect(computeDailyGoalBonus(50, 51, true)).toBe(0);
    });

    it('does not grant before crossing the goal', () => {
      expect(computeDailyGoalBonus(48, 49, false)).toBe(0);
    });
  });

  describe('computeNextStreak', () => {
    it('increments when last active was yesterday', () => {
      const today = formatLocalDate();
      const yesterday = getLocalYesterdayDateString();
      expect(
        computeNextStreak(
          { currentStreak: 3, lastActiveDate: yesterday, longestStreak: 5 },
          today,
          yesterday,
        ),
      ).toEqual({ currentStreak: 4, lastActiveDate: today, longestStreak: 5 });
    });

    it('resets to 1 after a missed day', () => {
      const today = formatLocalDate();
      const yesterday = getLocalYesterdayDateString();
      expect(
        computeNextStreak(
          { currentStreak: 10, lastActiveDate: '2000-01-01', longestStreak: 10 },
          today,
          yesterday,
        ),
      ).toEqual({ currentStreak: 1, lastActiveDate: today, longestStreak: 10 });
    });

    it('is unchanged on same local day', () => {
      const today = formatLocalDate();
      const yesterday = getLocalYesterdayDateString();
      const prev = { currentStreak: 4, lastActiveDate: today, longestStreak: 4 };
      expect(computeNextStreak(prev, today, yesterday)).toBe(prev);
    });
  });
});
