import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizProgressProvider, useQuizProgress } from '../QuizProgressProvider';
import { LanguageProvider } from '../LanguageProvider';
import type { Question } from '@/mocks/questions';
import {
  useUpsertUserProgress,
  useUpsertDailyProgress,
} from '@/lib/supabase-hooks';
import { flushOfflineProgressQueue } from '@/lib/offline-progress-queue';

const QUEUE_KEY = '@medvba_offline_progress_queue';

const mockUseAuth = jest.fn(() => ({ user: null as { id: string } | null }));

jest.mock('../AuthProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>
    <QuizProgressProvider>{children}</QuizProgressProvider>
  </LanguageProvider>
);

const mockQuestion: Question = {
  id: 'q1',
  question: 'Test question?',
  options: ['A', 'B', 'C', 'D'],
  correctAnswer: 0,
  explanation: 'Test explanation',
  difficulty: 'medium',
  category: 'anatomy',
};

describe('QuizProgressProvider', () => {
  const upsertUserProgress = jest.fn().mockResolvedValue({});
  const upsertDailyProgress = jest.fn().mockResolvedValue({});

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null });
    upsertUserProgress.mockResolvedValue({});
    upsertDailyProgress.mockResolvedValue({});
    (useUpsertUserProgress as jest.Mock).mockReturnValue({ mutateAsync: upsertUserProgress });
    (useUpsertDailyProgress as jest.Mock).mockReturnValue({ mutateAsync: upsertDailyProgress });
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
    (AsyncStorage.removeItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Daily Progress', () => {
    it('should initialize with default daily progress', async () => {
      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.dailyProgress.questionsAnswered).toBe(0);
      expect(result.current.dailyProgress.correctAnswers).toBe(0);
      expect(result.current.dailyProgress.goal).toBe(50);
      expect(result.current.dailyProgress.points).toBe(0);
    });

    it('should update daily progress correctly', async () => {
      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateDailyProgress(true, 'q1');
      });

      await waitFor(() => {
        expect(result.current.dailyProgress.questionsAnswered).toBe(1);
        expect(result.current.dailyProgress.correctAnswers).toBe(1);
      });
    });

    it('should not count same question twice', async () => {
      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let first: { pointsDelta: number; dailyGoalJustHit: boolean } | undefined;
      let second: { pointsDelta: number; dailyGoalJustHit: boolean } | undefined;

      await act(async () => {
        first = await result.current.updateDailyProgress(true, 'q1');
      });

      await waitFor(() => {
        expect(result.current.dailyProgress.questionsAnswered).toBe(1);
      });

      const questionsAfterFirst = result.current.allTimeStats.totalQuestionsAnswered;
      const pointsAfterFirst = result.current.allTimeStats.points;

      await act(async () => {
        second = await result.current.updateDailyProgress(false, 'q1');
      });

      await waitFor(() => {
        expect(result.current.dailyProgress.questionsAnswered).toBe(1);
      });

      expect(first?.pointsDelta).toBeGreaterThan(0);
      expect(second).toEqual({ pointsDelta: 0, dailyGoalJustHit: false });
      expect(result.current.allTimeStats.totalQuestionsAnswered).toBe(questionsAfterFirst);
      expect(result.current.allTimeStats.points).toBe(pointsAfterFirst);
    });

    it('should track incorrect answers', async () => {
      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let scoreResult: { pointsDelta: number; dailyGoalJustHit: boolean } | undefined;
      await act(async () => {
        scoreResult = await result.current.updateDailyProgress(false, 'q1');
      });

      await waitFor(() => {
        expect(result.current.dailyProgress.questionsAnswered).toBe(1);
        expect(result.current.dailyProgress.correctAnswers).toBe(0);
      });

      expect(scoreResult).toEqual({ pointsDelta: 2, dailyGoalJustHit: false });
      expect(result.current.allTimeStats.points).toBe(2);
    });

    it('awards correct answer points with streak bonus', async () => {
      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let scoreResult: { pointsDelta: number; dailyGoalJustHit: boolean } | undefined;
      await act(async () => {
        scoreResult = await result.current.updateDailyProgress(true, 'q1');
      });

      // First activity of the day → streak becomes 1 → +10 + 1 = 11
      expect(scoreResult).toEqual({ pointsDelta: 11, dailyGoalJustHit: false });
      expect(result.current.allTimeStats.points).toBe(11);
      expect(result.current.dailyProgress.points).toBe(11);
      expect(result.current.streakData.currentStreak).toBe(1);
    });

    it('grants daily-goal +25 once when crossing 50 questions', async () => {
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      const todayStr = `${y}-${m}-${d}`;

      const answeredIds = Array.from({ length: 49 }, (_, i) => `seed-${i}`);
      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'quiz_daily_progress') {
          return Promise.resolve(JSON.stringify({
            date: todayStr,
            questionsAnswered: 49,
            correctAnswers: 40,
            goal: 50,
            answeredQuestionIds: answeredIds,
            points: 49 * 2,
            dailyGoalBonusGranted: false,
          }));
        }
        if (key === 'quiz_all_time_stats') {
          return Promise.resolve(JSON.stringify({
            totalQuestionsAnswered: 49,
            totalCorrectAnswers: 40,
            totalStudyTimeSeconds: 0,
            points: 49 * 2,
          }));
        }
        if (key === 'quiz_streak_data') {
          return Promise.resolve(JSON.stringify({
            currentStreak: 3,
            lastActiveDate: todayStr,
            longestStreak: 3,
          }));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.dailyProgress.questionsAnswered).toBe(49);
      });

      let fiftieth: { pointsDelta: number; dailyGoalJustHit: boolean } | undefined;
      await act(async () => {
        fiftieth = await result.current.updateDailyProgress(false, 'goal-q');
      });

      // Wrong answer +2 plus daily goal +25
      expect(fiftieth).toEqual({ pointsDelta: 27, dailyGoalJustHit: true });
      expect(result.current.dailyProgress.questionsAnswered).toBe(50);
      expect(result.current.dailyProgress.dailyGoalBonusGranted).toBe(true);

      let fiftyFirst: { pointsDelta: number; dailyGoalJustHit: boolean } | undefined;
      await act(async () => {
        fiftyFirst = await result.current.updateDailyProgress(false, 'after-goal-q');
      });

      expect(fiftyFirst).toEqual({ pointsDelta: 2, dailyGoalJustHit: false });
    });
  });

  describe('All Time Stats', () => {
    it('should calculate accuracy correctly', async () => {
      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateDailyProgress(true, 'q1');
        await result.current.updateDailyProgress(true, 'q2');
        await result.current.updateDailyProgress(false, 'q3');
        await result.current.updateDailyProgress(false, 'q4');
      });

      await waitFor(() => {
        expect(result.current.allTimeStats.totalQuestionsAnswered).toBe(4);
        expect(result.current.allTimeStats.totalCorrectAnswers).toBe(2);
        expect(result.current.accuracy).toBe(50);
      });
    });

    it('should format questions count correctly', async () => {
      const storedStats = JSON.stringify({
        totalQuestionsAnswered: 1500,
        totalCorrectAnswers: 1200,
        totalStudyTimeSeconds: 3600,
      });

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'quiz_all_time_stats') {
          return Promise.resolve(storedStats);
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.formattedQuestionsCount).toBe('1.5k');
      });
    });
  });

  describe('Session State', () => {
    it('should save session state', async () => {
      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const sessionState = {
        category: 'anatomy',
        mode: 'study',
        questions: [mockQuestion],
        currentIndex: 0,
        score: 0,
        answeredInSession: [],
        startedAt: new Date().toISOString(),
      };

      await act(async () => {
        await result.current.saveSessionState(sessionState);
      });

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'quiz_session_state',
        expect.any(String)
      );
    });

    it('should clear session state', async () => {
      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.clearSessionState();
      });

      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('quiz_session_state');
      expect(result.current.sessionState).toBeNull();
    });

    it('should detect active session', async () => {
      const sessionState = {
        category: 'anatomy',
        mode: 'study',
        questions: [mockQuestion, mockQuestion],
        currentIndex: 0,
        score: 0,
        answeredInSession: [],
        startedAt: new Date().toISOString(),
      };

      const storedSession = JSON.stringify(sessionState);

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'quiz_session_state') {
          return Promise.resolve(storedSession);
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.hasActiveSession).toBe(true);
      });
    });
  });

  describe('Streak Tracking', () => {
    it('should update streak when answering questions', async () => {
      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateDailyProgress(true, 'q1');
      });

      await waitFor(() => {
        expect(result.current.streakData.currentStreak).toBeGreaterThan(0);
      });
    });

    it('syncs the fresh streak (not a stale snapshot) with points', async () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const y = yesterday.getFullYear();
      const m = String(yesterday.getMonth() + 1).padStart(2, '0');
      const d = String(yesterday.getDate()).padStart(2, '0');
      const yesterdayStr = `${y}-${m}-${d}`;

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'quiz_streak_data') {
          return Promise.resolve(JSON.stringify({
            currentStreak: 4,
            lastActiveDate: yesterdayStr,
            longestStreak: 6,
          }));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.streakData.currentStreak).toBe(4);
      });

      await act(async () => {
        await result.current.updateDailyProgress(true, 'sync-q1');
      });

      await waitFor(() => {
        expect(upsertUserProgress).toHaveBeenCalled();
      });

      const payload = upsertUserProgress.mock.calls[0][0];
      expect(payload.currentStreak).toBe(5);
      expect(payload.longestStreak).toBe(6);
      expect(payload.points).toBe(15); // +10 + min(5,7)
      expect(payload.lastActivityDate).toBeTruthy();

      await waitFor(() => {
        expect(upsertDailyProgress).toHaveBeenCalled();
      });
      expect(upsertDailyProgress.mock.calls[0][0].points).toBe(15);
    });

    it('failed upsert enqueues absolute points snapshot; flush upserts that total once', async () => {
      mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
      const store = new Map<string, string>();
      (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) =>
        store.has(key) ? store.get(key)! : null,
      );
      (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
        store.set(key, value);
      });

      upsertUserProgress.mockRejectedValueOnce(new Error('network down'));
      upsertDailyProgress.mockRejectedValueOnce(new Error('network down'));

      const { result } = renderHook(() => useQuizProgress(), { wrapper });
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.updateDailyProgress(true, 'offline-q1');
      });

      await waitFor(() => {
        expect(result.current.allTimeStats.points).toBe(11);
      });

      await waitFor(() => {
        const queued = JSON.parse(store.get(QUEUE_KEY) ?? '[]') as Array<{
          type: string;
          payload: { points: number };
        }>;
        expect(queued.length).toBeGreaterThan(0);
        const userItem = queued.find((q) => q.type === 'userProgress');
        expect(userItem?.payload.points).toBe(11);
      });

      upsertUserProgress.mockClear();
      upsertDailyProgress.mockClear();
      upsertUserProgress.mockResolvedValue({});
      upsertDailyProgress.mockResolvedValue({});

      await act(async () => {
        await flushOfflineProgressQueue({
          upsertUserProgress,
          upsertDailyProgress,
        });
      });

      expect(upsertUserProgress).toHaveBeenCalledTimes(1);
      expect(upsertUserProgress).toHaveBeenCalledWith(expect.objectContaining({ points: 11 }));
      expect(JSON.parse(store.get(QUEUE_KEY) ?? '[]')).toEqual([]);
    });
  });

  describe('Study Time', () => {
    it('should add study time correctly', async () => {
      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.addStudyTime(300);
      });

      await waitFor(() => {
        expect(result.current.allTimeStats.totalStudyTimeSeconds).toBe(300);
      });
    });

    it('should format study time correctly', async () => {
      const storedStats = JSON.stringify({
        totalQuestionsAnswered: 100,
        totalCorrectAnswers: 80,
        totalStudyTimeSeconds: 7200,
      });

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'quiz_all_time_stats') {
          return Promise.resolve(storedStats);
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.formattedStudyTime).toBe('2h');
      });
    });
  });

  describe('Weekly Progress', () => {
    it('should calculate weekly goal progress', async () => {
      const weeklyHistory = [
        {
          date: new Date().toISOString().split('T')[0],
          questionsAnswered: 50,
          correctAnswers: 40,
          studyTimeSeconds: 1800,
        },
      ];

      (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'quiz_weekly_history') {
          return Promise.resolve(JSON.stringify(weeklyHistory));
        }
        return Promise.resolve(null);
      });

      const { result } = renderHook(() => useQuizProgress(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.weeklyQuestionsTotal).toBe(50);
        expect(result.current.weeklyGoalProgress).toBeGreaterThan(0);
      });
    });
  });
});
