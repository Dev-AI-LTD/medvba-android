import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import type { Question } from '@/mocks/questions';
import { useAuth } from './AuthProvider';
import {
  useUserProgress,
  useUpsertUserProgress,
  useWeeklyProgress,
  useUpsertDailyProgress,
  useCheckAchievements,
  useGrantAchievement,
  type AchievementType,
} from '@/lib/supabase-hooks';
import { log } from '@/lib/log';
import { useIsOffline } from '@/lib/use-network-auth-offline';
import {
  enqueueOfflineProgress,
  flushOfflineProgressQueue,
  type OfflineDailyProgressPayload,
  type OfflineUserProgressPayload,
} from '@/lib/offline-progress-queue';
import { useOfflineReconnectEffect } from '@/lib/use-offline-reconnect';
import {
  computeAnswerPoints,
  computeDailyGoalBonus,
  computeNextStreak,
  DAILY_QUESTION_GOAL,
  formatLocalDate,
  getLocalYesterdayDateString,
} from '@/lib/quiz-scoring';
import { useLanguage } from '@/providers/LanguageProvider';

const DAILY_PROGRESS_KEY = 'quiz_daily_progress';
const SESSION_STATE_KEY = 'quiz_session_state';
const ALL_TIME_STATS_KEY = 'quiz_all_time_stats';
const STREAK_KEY = 'quiz_streak_data';
const WEEKLY_HISTORY_KEY = 'quiz_weekly_history';
const LAST_SESSION_KEY = 'quiz_last_session_info';

export type UpdateDailyProgressResult = {
  pointsDelta: number;
  dailyGoalJustHit: boolean;
};

interface DailyProgress {
  date: string;
  questionsAnswered: number;
  correctAnswers: number;
  goal: number;
  answeredQuestionIds: string[];
  points: number;
  dailyGoalBonusGranted: boolean;
}

interface SessionState {
  category: string;
  mode: string;
  questions: Question[];
  currentIndex: number;
  score: number;
  answeredInSession: string[];
  startedAt: string;
  /** Language when session started; used on resume so language does not switch */
  sessionLanguage?: 'en' | 'ro';
}

interface AllTimeStats {
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  totalStudyTimeSeconds: number;
  points: number;
}

interface StreakData {
  currentStreak: number;
  lastActiveDate: string;
  longestStreak: number;
}

interface DailyHistoryEntry {
  date: string;
  questionsAnswered: number;
  correctAnswers: number;
  studyTimeSeconds: number;
  points: number;
}

interface LastSessionInfo {
  category: string;
  mode: string;
  timestamp: string;
}

function getDefaultAllTimeStats(): AllTimeStats {
  return {
    totalQuestionsAnswered: 0,
    totalCorrectAnswers: 0,
    totalStudyTimeSeconds: 0,
    points: 0,
  };
}

function getDefaultStreakData(): StreakData {
  return {
    currentStreak: 0,
    lastActiveDate: '',
    longestStreak: 0,
  };
}

interface QuizProgressContextValue {
  dailyProgress: DailyProgress;
  sessionState: SessionState | null;
  allTimeStats: AllTimeStats;
  streakData: StreakData;
  weeklyHistory: DailyHistoryEntry[];
  lastSessionInfo: LastSessionInfo | null;
  isLoading: boolean;
  updateDailyProgress: (correct: boolean, questionId: string) => Promise<UpdateDailyProgressResult>;
  saveSessionState: (state: SessionState) => Promise<void>;
  clearSessionState: () => Promise<void>;
  loadSessionState: () => Promise<SessionState | null>;
  saveLastSessionInfo: (category: string, mode: string) => Promise<void>;
  hasActiveSession: boolean;
  resetDailyProgress: () => Promise<void>;
  addStudyTime: (seconds: number) => Promise<void>;
  accuracy: number;
  formattedQuestionsCount: string;
  formattedStudyTime: string;
  weeklyQuestionsTotal: number;
  weeklyStudyTimeSeconds: number;
  weeklyGoalProgress: number;
}

function getTodayDateString(): string {
  return formatLocalDate();
}

function getYesterdayDateString(): string {
  return getLocalYesterdayDateString();
}

function getLast7Days(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(formatLocalDate(date));
  }
  return dates;
}

function getDefaultDailyProgress(): DailyProgress {
  return {
    date: getTodayDateString(),
    questionsAnswered: 0,
    correctAnswers: 0,
    goal: DAILY_QUESTION_GOAL,
    answeredQuestionIds: [],
    points: 0,
    dailyGoalBonusGranted: false,
  };
}

function normalizeDailyProgress(raw: Partial<DailyProgress> | null | undefined): DailyProgress {
  const base = getDefaultDailyProgress();
  if (!raw) return base;
  return {
    date: raw.date || base.date,
    questionsAnswered: raw.questionsAnswered ?? 0,
    correctAnswers: raw.correctAnswers ?? 0,
    goal: raw.goal ?? DAILY_QUESTION_GOAL,
    answeredQuestionIds: Array.isArray(raw.answeredQuestionIds) ? raw.answeredQuestionIds : [],
    points: raw.points ?? 0,
    dailyGoalBonusGranted: Boolean(raw.dailyGoalBonusGranted),
  };
}

function normalizeAllTimeStats(raw: Partial<AllTimeStats> | null | undefined): AllTimeStats {
  const base = getDefaultAllTimeStats();
  if (!raw) return base;
  return {
    totalQuestionsAnswered: raw.totalQuestionsAnswered ?? 0,
    totalCorrectAnswers: raw.totalCorrectAnswers ?? 0,
    totalStudyTimeSeconds: raw.totalStudyTimeSeconds ?? 0,
    // Legacy local data had no points; approximate from questions answered once.
    points: raw.points ?? raw.totalQuestionsAnswered ?? 0,
  };
}

const ACHIEVEMENT_I18N_KEYS: Partial<Record<AchievementType, string>> = {
  first_quiz: 'achievement.firstQuiz',
  quiz_completed_10: 'achievement.quizCompleted10',
  hundred_questions: 'achievement.hundredQuestions',
  five_hundred_questions: 'achievement.fiveHundredQuestions',
  thousand_questions: 'achievement.thousandQuestions',
  week_streak: 'achievement.weekStreak',
  month_streak: 'achievement.monthStreak',
  grand_master: 'achievement.grandMaster',
};

export const [QuizProgressProvider, useQuizProgress] = createContextHook<QuizProgressContextValue>(() => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const userId = user?.id;
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(getDefaultDailyProgress());
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<AllTimeStats>(getDefaultAllTimeStats());
  const [streakData, setStreakData] = useState<StreakData>(getDefaultStreakData());
  const [weeklyHistory, setWeeklyHistory] = useState<DailyHistoryEntry[]>([]);
  const [lastSessionInfo, setLastSessionInfo] = useState<LastSessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const dailyProgressRef = useRef(dailyProgress);
  const allTimeStatsRef = useRef(allTimeStats);
  const streakDataRef = useRef(streakData);
  const weeklyHistoryRef = useRef(weeklyHistory);
  dailyProgressRef.current = dailyProgress;
  allTimeStatsRef.current = allTimeStats;
  streakDataRef.current = streakData;
  weeklyHistoryRef.current = weeklyHistory;

  const cloudProgressQuery = useUserProgress(userId);
  const cloudWeeklyQuery = useWeeklyProgress(
    userId,
    getLast7Days()[0],
    getTodayDateString()
  );
  const upsertUserProgressMutation = useUpsertUserProgress();
  const upsertDailyProgressMutation = useUpsertDailyProgress();
  const achievementCheckQuery = useCheckAchievements(userId);
  const grantAchievementMutation = useGrantAchievement();

  const upsertUserProgressAsync = upsertUserProgressMutation.mutateAsync;
  const upsertDailyProgressAsync = upsertDailyProgressMutation.mutateAsync;
  const isOffline = useIsOffline();

  const flushOfflineQueue = useCallback(async () => {
    if (!userId) return;
    await flushOfflineProgressQueue({
      upsertUserProgress: (payload) => upsertUserProgressAsync(payload),
      upsertDailyProgress: (payload) => upsertDailyProgressAsync(payload),
    });
  }, [userId, upsertUserProgressAsync, upsertDailyProgressAsync]);

  useOfflineReconnectEffect(() => {
    void flushOfflineQueue();
  });

  useEffect(() => {
    if (!isOffline && userId) {
      void flushOfflineQueue();
    }
  }, [isOffline, userId, flushOfflineQueue]);

  const syncUserAndDailyToCloud = useCallback(
    async (
      syncPayload: OfflineUserProgressPayload,
      dailyPayload: OfflineDailyProgressPayload,
      onSuccess?: () => void,
    ) => {
      if (isOffline) {
        await enqueueOfflineProgress({ type: 'userProgress', payload: syncPayload });
        await enqueueOfflineProgress({ type: 'dailyProgress', payload: dailyPayload });
        return;
      }
      try {
        await Promise.all([
          upsertUserProgressAsync(syncPayload),
          upsertDailyProgressAsync(dailyPayload),
        ]);
        log.info('[QuizProgress] Synced to Supabase successfully');
        onSuccess?.();
      } catch (error) {
        log.error('[QuizProgress] Error syncing to Supabase:', error);
        await enqueueOfflineProgress({ type: 'userProgress', payload: syncPayload });
        await enqueueOfflineProgress({ type: 'dailyProgress', payload: dailyPayload });
      }
    },
    [isOffline, upsertUserProgressAsync, upsertDailyProgressAsync],
  );

  const accuracy = useMemo(() => {
    if (allTimeStats.totalQuestionsAnswered === 0) return 0;
    return (allTimeStats.totalCorrectAnswers / allTimeStats.totalQuestionsAnswered) * 100;
  }, [allTimeStats.totalQuestionsAnswered, allTimeStats.totalCorrectAnswers]);

  const checkAndGrantAchievements = useCallback(async () => {
    if (!userId) return;

    try {
      const checkResult = await achievementCheckQuery.refetch();
      const newAchievements = checkResult.data?.earned || [];

      if (newAchievements.length > 0) {
        log.info('[QuizProgress] Granting', newAchievements.length, 'new achievements');

        for (const achievementType of newAchievements) {
          try {
            const success = await grantAchievementMutation.mutateAsync(achievementType);

            if (!success) {
              Alert.alert(
                t('achievement.notSavedTitle'),
                t('achievement.notSavedMessage'),
              );
              continue;
            }

            log.info('[QuizProgress] Granted achievement:', achievementType);
            const titleKey = ACHIEVEMENT_I18N_KEYS[achievementType];
            const title = titleKey ? t(titleKey) : achievementType;
            Alert.alert(t('social.achievementUnlocked'), title);
          } catch (error: any) {
            log.error('[QuizProgress] Error granting achievement:', achievementType, JSON.stringify({
              message: error?.message || String(error),
              code: error?.code,
              details: error?.details,
              hint: error?.hint,
              name: error?.name,
            }, null, 2));
            Alert.alert(
              t('achievement.notSavedTitle'),
              t('achievement.notSavedMessage'),
            );
          }
        }
      }
    } catch (error: any) {
      log.error('[QuizProgress] Error checking achievements:', JSON.stringify({
        message: error?.message || String(error),
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        name: error?.name,
      }, null, 2));
    }
  }, [userId, achievementCheckQuery, grantAchievementMutation, t]);

  const persistStreak = useCallback(async (updated: StreakData) => {
    setStreakData(updated);
    streakDataRef.current = updated;
    try {
      await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(updated));
    } catch (err) {
      log.error('[QuizProgress] Error saving streak:', err);
    }
  }, []);

  const updateWeeklyHistory = useCallback(async (
    questionsAdded: number,
    correctAdded: number,
    studyTimeAdded: number = 0,
    pointsAdded: number = 0,
  ) => {
    const today = getTodayDateString();

    setWeeklyHistory(prev => {
      const existingIndex = prev.findIndex(entry => entry.date === today);
      let updated: DailyHistoryEntry[];

      if (existingIndex >= 0) {
        updated = prev.map((entry, idx) => {
          if (idx === existingIndex) {
            return {
              ...entry,
              questionsAnswered: entry.questionsAnswered + questionsAdded,
              correctAnswers: entry.correctAnswers + correctAdded,
              studyTimeSeconds: entry.studyTimeSeconds + studyTimeAdded,
              points: (entry.points || 0) + pointsAdded,
            };
          }
          return entry;
        });
      } else {
        updated = [...prev, {
          date: today,
          questionsAnswered: questionsAdded,
          correctAnswers: correctAdded,
          studyTimeSeconds: studyTimeAdded,
          points: pointsAdded,
        }];
      }

      const last7Days = getLast7Days();
      updated = updated.filter(entry => last7Days.includes(entry.date));
      weeklyHistoryRef.current = updated;

      log.info('[QuizProgress] Updated weekly history:', updated.length, 'days tracked');

      AsyncStorage.setItem(WEEKLY_HISTORY_KEY, JSON.stringify(updated)).catch(err => {
        log.error('[QuizProgress] Error saving weekly history:', err);
      });

      return updated;
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      try {
        log.info('[QuizProgress] Loading progress from cloud and local...');

        if (!isMounted) return;

        if (userId && cloudProgressQuery.data) {
          log.info('[QuizProgress] Loading from Supabase cloud');
          if (isMounted) {
            const nextAllTime: AllTimeStats = {
              totalQuestionsAnswered: cloudProgressQuery.data.totalQuestionsAnswered,
              totalCorrectAnswers: cloudProgressQuery.data.correctAnswers,
              totalStudyTimeSeconds: cloudProgressQuery.data.studyTimeSeconds,
              points: cloudProgressQuery.data.points ?? 0,
            };
            setAllTimeStats(nextAllTime);
            allTimeStatsRef.current = nextAllTime;
            const nextStreak: StreakData = {
              currentStreak: cloudProgressQuery.data.currentStreak,
              longestStreak: cloudProgressQuery.data.longestStreak,
              lastActiveDate: cloudProgressQuery.data.lastActivityDate || '',
            };
            setStreakData(nextStreak);
            streakDataRef.current = nextStreak;
          }
        } else {
          log.info('[QuizProgress] Loading from local AsyncStorage');
          const allTimeStored = await AsyncStorage.getItem(ALL_TIME_STATS_KEY);
          if (isMounted && allTimeStored) {
            const parsedAllTime = normalizeAllTimeStats(JSON.parse(allTimeStored) as AllTimeStats);
            log.info('[QuizProgress] Loaded all-time stats from local:', parsedAllTime);
            setAllTimeStats(parsedAllTime);
            allTimeStatsRef.current = parsedAllTime;
          }

          const streakStored = await AsyncStorage.getItem(STREAK_KEY);
          if (isMounted && streakStored) {
            const parsedStreak = JSON.parse(streakStored) as StreakData;
            const today = getTodayDateString();
            const yesterday = getYesterdayDateString();

            if (parsedStreak.lastActiveDate !== today && parsedStreak.lastActiveDate !== yesterday) {
              log.info('[QuizProgress] Streak broken, resetting to 0');
              const resetStreak: StreakData = {
                currentStreak: 0,
                lastActiveDate: parsedStreak.lastActiveDate,
                longestStreak: parsedStreak.longestStreak,
              };
              setStreakData(resetStreak);
              streakDataRef.current = resetStreak;
              await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(resetStreak));
            } else {
              log.info('[QuizProgress] Loaded streak from local:', parsedStreak.currentStreak, 'days');
              setStreakData(parsedStreak);
              streakDataRef.current = parsedStreak;
            }
          }
        }

        if (!isMounted) return;

        if (userId && cloudWeeklyQuery.data && cloudWeeklyQuery.data.length > 0) {
          log.info('[QuizProgress] Loading weekly history from Supabase');
          const weeklyData = cloudWeeklyQuery.data.map(day => ({
            date: day.date,
            questionsAnswered: day.questionsAnswered,
            correctAnswers: day.correctAnswers,
            studyTimeSeconds: day.studyTimeSeconds,
            points: day.points ?? 0,
          }));
          if (isMounted) {
            setWeeklyHistory(weeklyData);
            weeklyHistoryRef.current = weeklyData;

            const today = getTodayDateString();
            const todayCloud = weeklyData.find(d => d.date === today);
            if (todayCloud) {
              setDailyProgress(prev => {
                if (prev.date === today && prev.questionsAnswered > 0) {
                  return prev;
                }
                const merged = normalizeDailyProgress({
                  ...prev,
                  date: today,
                  questionsAnswered: Math.max(prev.questionsAnswered, todayCloud.questionsAnswered),
                  correctAnswers: Math.max(prev.correctAnswers, todayCloud.correctAnswers),
                  points: Math.max(prev.points, todayCloud.points),
                });
                dailyProgressRef.current = merged;
                return merged;
              });
            }
          }
        } else {
          const weeklyStored = await AsyncStorage.getItem(WEEKLY_HISTORY_KEY);
          if (isMounted && weeklyStored) {
            const parsedWeekly = (JSON.parse(weeklyStored) as DailyHistoryEntry[]).map(entry => ({
              ...entry,
              points: entry.points ?? 0,
            }));
            const last7Days = getLast7Days();
            const filtered = parsedWeekly.filter(entry => last7Days.includes(entry.date));
            log.info('[QuizProgress] Loaded weekly history from local:', filtered.length, 'days');
            setWeeklyHistory(filtered);
            weeklyHistoryRef.current = filtered;
          }
        }

        if (!isMounted) return;

        const stored = await AsyncStorage.getItem(DAILY_PROGRESS_KEY);

        if (isMounted && stored) {
          const parsed = normalizeDailyProgress(JSON.parse(stored) as DailyProgress);
          const today = getTodayDateString();

          if (parsed.date === today) {
            log.info('[QuizProgress] Found today\'s progress:', parsed.questionsAnswered, 'questions');
            setDailyProgress(parsed);
            dailyProgressRef.current = parsed;
          } else {
            log.info('[QuizProgress] Progress is from a different day, resetting');
            const newProgress = getDefaultDailyProgress();
            setDailyProgress(newProgress);
            dailyProgressRef.current = newProgress;
            await AsyncStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(newProgress));
          }
        } else {
          log.info('[QuizProgress] No stored progress, using default');
        }

        if (!isMounted) return;

        const sessionStored = await AsyncStorage.getItem(SESSION_STATE_KEY);
        if (isMounted && sessionStored) {
          const parsedSession = JSON.parse(sessionStored) as SessionState;
          const sessionDate = formatLocalDate(new Date(parsedSession.startedAt));
          const today = getTodayDateString();

          if (sessionDate === today) {
            log.info('[QuizProgress] Found active session at index:', parsedSession.currentIndex);
            setSessionState(parsedSession);
          } else {
            log.info('[QuizProgress] Session is from a different day, clearing');
            await AsyncStorage.removeItem(SESSION_STATE_KEY);
          }
        }

        if (!isMounted) return;

        const lastSessionStored = await AsyncStorage.getItem(LAST_SESSION_KEY);
        if (isMounted && lastSessionStored) {
          const parsedLastSession = JSON.parse(lastSessionStored) as LastSessionInfo;
          log.info('[QuizProgress] Loaded last session:', parsedLastSession.category, parsedLastSession.mode);
          setLastSessionInfo(parsedLastSession);
        }
      } catch (error) {
        log.error('[QuizProgress] Error loading progress:', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProgress();

    return () => {
      isMounted = false;
    };
  }, [userId, cloudProgressQuery.data, cloudWeeklyQuery.data]);

  const updateDailyProgress = useCallback(async (correct: boolean, questionId: string): Promise<UpdateDailyProgressResult> => {
    const empty: UpdateDailyProgressResult = { pointsDelta: 0, dailyGoalJustHit: false };

    try {
      const today = getTodayDateString();
      const prevDaily = dailyProgressRef.current.date === today
        ? dailyProgressRef.current
        : getDefaultDailyProgress();

      // Early-return on daily dedupe — no counters, points, streak, or sync.
      if (prevDaily.answeredQuestionIds.includes(questionId)) {
        log.info('[QuizProgress] Question already answered today:', questionId);
        return empty;
      }

      const nextStreak = computeNextStreak(
        streakDataRef.current,
        today,
        getYesterdayDateString(),
      );
      await persistStreak(nextStreak);

      const answerScore = computeAnswerPoints(correct, nextStreak.currentStreak);
      const nextQuestions = prevDaily.questionsAnswered + 1;
      const goalBonus = computeDailyGoalBonus(
        prevDaily.questionsAnswered,
        nextQuestions,
        prevDaily.dailyGoalBonusGranted,
      );
      const dailyGoalJustHit = goalBonus > 0;
      const pointsDelta = answerScore.total + goalBonus;

      const newDaily: DailyProgress = {
        ...prevDaily,
        date: today,
        questionsAnswered: nextQuestions,
        correctAnswers: correct ? prevDaily.correctAnswers + 1 : prevDaily.correctAnswers,
        answeredQuestionIds: [...prevDaily.answeredQuestionIds, questionId],
        points: prevDaily.points + pointsDelta,
        dailyGoalBonusGranted: prevDaily.dailyGoalBonusGranted || dailyGoalJustHit,
      };

      setDailyProgress(newDaily);
      dailyProgressRef.current = newDaily;
      await AsyncStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(newDaily));
      log.info('[QuizProgress] Updated daily progress:', newDaily.questionsAnswered, '/', newDaily.goal, 'pts+', pointsDelta);

      const newAllTime: AllTimeStats = {
        ...allTimeStatsRef.current,
        totalQuestionsAnswered: allTimeStatsRef.current.totalQuestionsAnswered + 1,
        totalCorrectAnswers: correct
          ? allTimeStatsRef.current.totalCorrectAnswers + 1
          : allTimeStatsRef.current.totalCorrectAnswers,
        points: allTimeStatsRef.current.points + pointsDelta,
      };
      setAllTimeStats(newAllTime);
      allTimeStatsRef.current = newAllTime;
      await AsyncStorage.setItem(ALL_TIME_STATS_KEY, JSON.stringify(newAllTime));

      const todayEntryBefore = weeklyHistoryRef.current.find(e => e.date === today);
      await updateWeeklyHistory(1, correct ? 1 : 0, 0, pointsDelta);
      const newWeeklyEntry = {
        questionsAnswered: (todayEntryBefore?.questionsAnswered || 0) + 1,
        correctAnswers: (todayEntryBefore?.correctAnswers || 0) + (correct ? 1 : 0),
        studyTimeSeconds: todayEntryBefore?.studyTimeSeconds || 0,
        points: (todayEntryBefore?.points || 0) + pointsDelta,
      };

      if (userId) {
        // Sync uses the fresh streak (not a stale closure snapshot).
        const syncPayload: OfflineUserProgressPayload = {
          userId,
          totalQuestionsAnswered: newAllTime.totalQuestionsAnswered,
          correctAnswers: newAllTime.totalCorrectAnswers,
          studyTimeSeconds: newAllTime.totalStudyTimeSeconds,
          currentStreak: nextStreak.currentStreak,
          longestStreak: nextStreak.longestStreak,
          lastActivityDate: nextStreak.lastActiveDate || null,
          points: newAllTime.points,
        };
        const dailyPayload: OfflineDailyProgressPayload = {
          userId,
          date: today,
          questionsAnswered: newWeeklyEntry.questionsAnswered,
          correctAnswers: newWeeklyEntry.correctAnswers,
          studyTimeSeconds: newWeeklyEntry.studyTimeSeconds,
          points: newWeeklyEntry.points,
        };

        void syncUserAndDailyToCloud(syncPayload, dailyPayload, () => {
          checkAndGrantAchievements();
        });
      }

      return { pointsDelta, dailyGoalJustHit };
    } catch (error) {
      log.error('[QuizProgress] Error updating daily progress:', error);
      return empty;
    }
  }, [persistStreak, updateWeeklyHistory, userId, syncUserAndDailyToCloud, checkAndGrantAchievements]);

  const saveLastSessionInfo = useCallback(async (category: string, mode: string) => {
    try {
      const info: LastSessionInfo = {
        category,
        mode,
        timestamp: new Date().toISOString(),
      };
      log.info('[QuizProgress] Saving last session info:', category, mode);
      setLastSessionInfo(info);
      await AsyncStorage.setItem(LAST_SESSION_KEY, JSON.stringify(info));
    } catch (error) {
      log.error('[QuizProgress] Error saving last session info:', error);
    }
  }, []);

  const saveSessionState = useCallback(async (state: SessionState) => {
    try {
      setSessionState(state);
      await AsyncStorage.setItem(SESSION_STATE_KEY, JSON.stringify(state));

      await saveLastSessionInfo(state.category, state.mode);
    } catch (error) {
      log.error('[QuizProgress] Error saving session state:', error);
    }
  }, [saveLastSessionInfo]);

  const clearSessionState = useCallback(async () => {
    try {
      log.info('[QuizProgress] Clearing session state');
      setSessionState(null);
      await AsyncStorage.removeItem(SESSION_STATE_KEY);
    } catch (error) {
      log.error('[QuizProgress] Error clearing session state:', error);
    }
  }, []);

  const loadSessionState = useCallback(async (): Promise<SessionState | null> => {
    try {
      const stored = await AsyncStorage.getItem(SESSION_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as SessionState;
        const sessionDate = formatLocalDate(new Date(parsed.startedAt));
        const today = getTodayDateString();

        if (sessionDate === today) {
          return parsed;
        }
      }
      return null;
    } catch (error) {
      log.error('[QuizProgress] Error loading session state:', error);
      return null;
    }
  }, []);

  const resetDailyProgress = useCallback(async () => {
    try {
      const newProgress = getDefaultDailyProgress();
      setDailyProgress(newProgress);
      dailyProgressRef.current = newProgress;
      await AsyncStorage.setItem(DAILY_PROGRESS_KEY, JSON.stringify(newProgress));
      log.info('[QuizProgress] Daily progress reset');
    } catch (error) {
      log.error('[QuizProgress] Error resetting daily progress:', error);
    }
  }, []);

  const hasActiveSession = useMemo(() => {
    return sessionState !== null && sessionState.currentIndex < sessionState.questions.length;
  }, [sessionState]);

  const addStudyTime = useCallback(async (seconds: number) => {
    try {
      const updated: AllTimeStats = {
        ...allTimeStatsRef.current,
        totalStudyTimeSeconds: allTimeStatsRef.current.totalStudyTimeSeconds + seconds,
      };
      setAllTimeStats(updated);
      allTimeStatsRef.current = updated;
      log.info('[QuizProgress] Added', seconds, 'seconds. Total study time:', updated.totalStudyTimeSeconds, 'seconds');
      await AsyncStorage.setItem(ALL_TIME_STATS_KEY, JSON.stringify(updated));

      await updateWeeklyHistory(0, 0, seconds, 0);

      if (userId) {
        const currentStreak = streakDataRef.current;
        const today = getTodayDateString();
        const todayEntry = weeklyHistoryRef.current.find(e => e.date === today);

        const userPayload: OfflineUserProgressPayload = {
          userId,
          totalQuestionsAnswered: updated.totalQuestionsAnswered,
          correctAnswers: updated.totalCorrectAnswers,
          studyTimeSeconds: updated.totalStudyTimeSeconds,
          currentStreak: currentStreak.currentStreak,
          longestStreak: currentStreak.longestStreak,
          lastActivityDate: currentStreak.lastActiveDate || null,
          points: updated.points,
        };

        if (todayEntry) {
          const dailyPayload: OfflineDailyProgressPayload = {
            userId,
            date: today,
            questionsAnswered: todayEntry.questionsAnswered,
            correctAnswers: todayEntry.correctAnswers,
            studyTimeSeconds: todayEntry.studyTimeSeconds + seconds,
            points: todayEntry.points || 0,
          };
          void syncUserAndDailyToCloud(userPayload, dailyPayload, () => {
            checkAndGrantAchievements();
          });
        } else if (isOffline) {
          await enqueueOfflineProgress({ type: 'userProgress', payload: userPayload });
        } else {
          upsertUserProgressAsync(userPayload)
            .then(() => {
              log.info('[QuizProgress] Study time synced to Supabase');
              checkAndGrantAchievements();
            })
            .catch(async (error) => {
              log.error('[QuizProgress] Error syncing study time to Supabase:', error);
              await enqueueOfflineProgress({ type: 'userProgress', payload: userPayload });
            });
        }
      }
    } catch (error) {
      log.error('[QuizProgress] Error adding study time:', error);
    }
  }, [
    updateWeeklyHistory,
    userId,
    syncUserAndDailyToCloud,
    isOffline,
    upsertUserProgressAsync,
    checkAndGrantAchievements,
  ]);

  const formattedQuestionsCount = useMemo(() => {
    const count = allTimeStats.totalQuestionsAnswered;
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return String(count);
  }, [allTimeStats.totalQuestionsAnswered]);

  const formattedStudyTime = useMemo(() => {
    const hours = Math.floor(allTimeStats.totalStudyTimeSeconds / 3600);
    if (hours > 0) {
      return `${hours}h`;
    }
    const minutes = Math.floor(allTimeStats.totalStudyTimeSeconds / 60);
    return `${minutes}m`;
  }, [allTimeStats.totalStudyTimeSeconds]);

  const weeklyQuestionsTotal = useMemo(() => {
    return weeklyHistory.reduce((sum, entry) => sum + entry.questionsAnswered, 0);
  }, [weeklyHistory]);

  const weeklyStudyTimeSeconds = useMemo(() => {
    return weeklyHistory.reduce((sum, entry) => sum + entry.studyTimeSeconds, 0);
  }, [weeklyHistory]);

  const weeklyGoalProgress = useMemo(() => {
    const weeklyGoal = 350;
    return Math.min((weeklyQuestionsTotal / weeklyGoal) * 100, 100);
  }, [weeklyQuestionsTotal]);

  return {
    dailyProgress,
    sessionState,
    allTimeStats,
    streakData,
    weeklyHistory,
    lastSessionInfo,
    isLoading,
    updateDailyProgress,
    saveSessionState,
    clearSessionState,
    loadSessionState,
    saveLastSessionInfo,
    hasActiveSession,
    resetDailyProgress,
    addStudyTime,
    accuracy,
    formattedQuestionsCount,
    formattedStudyTime,
    weeklyQuestionsTotal,
    weeklyStudyTimeSeconds,
    weeklyGoalProgress,
  };
});

export type { DailyProgress, SessionState, AllTimeStats, StreakData, DailyHistoryEntry, LastSessionInfo };
