import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  enqueueOfflineProgress,
  flushOfflineProgressQueue,
  type OfflineDailyProgressPayload,
  type OfflineUserProgressPayload,
} from '@/lib/offline-progress-queue';

const QUEUE_KEY = '@medvba_offline_progress_queue';

function memoryAsyncStorage() {
  const store = new Map<string, string>();
  (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) =>
    store.has(key) ? store.get(key)! : null,
  );
  (AsyncStorage.setItem as jest.Mock).mockImplementation(async (key: string, value: string) => {
    store.set(key, value);
  });
  (AsyncStorage.removeItem as jest.Mock).mockImplementation(async (key: string) => {
    store.delete(key);
  });
  return store;
}

function userPayload(points: number): OfflineUserProgressPayload {
  return {
    userId: 'user-1',
    totalQuestionsAnswered: 10,
    correctAnswers: 7,
    studyTimeSeconds: 100,
    currentStreak: 2,
    longestStreak: 5,
    lastActivityDate: '2026-08-03',
    points,
  };
}

function dailyPayload(points: number, date = '2026-08-03'): OfflineDailyProgressPayload {
  return {
    userId: 'user-1',
    date,
    questionsAnswered: 10,
    correctAnswers: 7,
    studyTimeSeconds: 100,
    points,
  };
}

describe('offline-progress-queue absolute snapshot sync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    memoryAsyncStorage();
  });

  it('coalesces two daily snapshots for the same userId + date to the latest points', async () => {
    await enqueueOfflineProgress({ type: 'dailyProgress', payload: dailyPayload(40) });
    await enqueueOfflineProgress({ type: 'dailyProgress', payload: dailyPayload(95) });

    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = JSON.parse(raw ?? '[]') as Array<{ type: string; payload: OfflineDailyProgressPayload }>;
    const dailyItems = queue.filter((q) => q.type === 'dailyProgress');

    expect(dailyItems).toHaveLength(1);
    expect(dailyItems[0].payload.points).toBe(95);
    expect(dailyItems[0].payload.userId).toBe('user-1');
    expect(dailyItems[0].payload.date).toBe('2026-08-03');
  });

  it('flush after enqueue upserts the absolute points snapshot once', async () => {
    const upsertUserProgress = jest.fn().mockResolvedValue({});
    const upsertDailyProgress = jest.fn().mockResolvedValue({});

    await enqueueOfflineProgress({ type: 'userProgress', payload: userPayload(120) });
    await enqueueOfflineProgress({ type: 'dailyProgress', payload: dailyPayload(45) });

    await flushOfflineProgressQueue({ upsertUserProgress, upsertDailyProgress });

    expect(upsertUserProgress).toHaveBeenCalledTimes(1);
    expect(upsertUserProgress).toHaveBeenCalledWith(expect.objectContaining({ points: 120 }));
    expect(upsertDailyProgress).toHaveBeenCalledTimes(1);
    expect(upsertDailyProgress).toHaveBeenCalledWith(expect.objectContaining({ points: 45 }));

    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    expect(JSON.parse(raw ?? '[]')).toEqual([]);
  });

  it('replaying the same absolute snapshot does not grow points between retries', async () => {
    const upsertUserProgress = jest.fn().mockResolvedValue({});
    const upsertDailyProgress = jest.fn().mockResolvedValue({});
    const snapshot = userPayload(88);

    await enqueueOfflineProgress({ type: 'userProgress', payload: snapshot });
    await flushOfflineProgressQueue({ upsertUserProgress, upsertDailyProgress });

    await enqueueOfflineProgress({ type: 'userProgress', payload: snapshot });
    await flushOfflineProgressQueue({ upsertUserProgress, upsertDailyProgress });

    expect(upsertUserProgress).toHaveBeenCalledTimes(2);
    expect(upsertUserProgress.mock.calls[0][0].points).toBe(88);
    expect(upsertUserProgress.mock.calls[1][0].points).toBe(88);
    expect(upsertUserProgress.mock.calls[1][0].points).toBe(
      upsertUserProgress.mock.calls[0][0].points,
    );
  });

  it('keeps the absolute snapshot queued when flush upsert fails, then flushes once on retry', async () => {
    const upsertUserProgress = jest
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({});
    const upsertDailyProgress = jest.fn().mockResolvedValue({});

    await enqueueOfflineProgress({ type: 'userProgress', payload: userPayload(150) });

    await flushOfflineProgressQueue({ upsertUserProgress, upsertDailyProgress });
    expect(upsertUserProgress).toHaveBeenCalledTimes(1);
    expect(upsertUserProgress.mock.calls[0][0].points).toBe(150);

    const afterFail = JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) ?? '[]');
    expect(afterFail).toHaveLength(1);
    expect(afterFail[0].payload.points).toBe(150);

    await flushOfflineProgressQueue({ upsertUserProgress, upsertDailyProgress });
    expect(upsertUserProgress).toHaveBeenCalledTimes(2);
    expect(upsertUserProgress.mock.calls[1][0].points).toBe(150);

    const afterOk = JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) ?? '[]');
    expect(afterOk).toEqual([]);
  });
});
