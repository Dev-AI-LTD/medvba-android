import AsyncStorage from '@react-native-async-storage/async-storage';
import { log } from '@/lib/log';

const QUEUE_KEY = '@medvba_offline_progress_queue';

export type OfflineUserProgressPayload = {
  userId: string;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  studyTimeSeconds: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  points: number;
};

export type OfflineDailyProgressPayload = {
  userId: string;
  date: string;
  questionsAnswered: number;
  correctAnswers: number;
  studyTimeSeconds: number;
  points: number;
};

export type OfflineProgressQueueItem =
  | { type: 'userProgress'; payload: OfflineUserProgressPayload }
  | { type: 'dailyProgress'; payload: OfflineDailyProgressPayload };

async function readQueue(): Promise<OfflineProgressQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OfflineProgressQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: OfflineProgressQueueItem[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function enqueueOfflineProgress(item: OfflineProgressQueueItem): Promise<void> {
  const queue = await readQueue();
  const filtered = queue.filter((q) => {
    if (q.type !== item.type) return true;
    if (item.type === 'userProgress' && q.type === 'userProgress') {
      return q.payload.userId !== item.payload.userId;
    }
    if (item.type === 'dailyProgress' && q.type === 'dailyProgress') {
      return !(q.payload.userId === item.payload.userId && q.payload.date === item.payload.date);
    }
    return true;
  });
  filtered.push(item);
  await writeQueue(filtered);
  log.debug('[OfflineQueue] enqueued', item.type);
}

export async function flushOfflineProgressQueue(handlers: {
  upsertUserProgress: (payload: OfflineUserProgressPayload) => Promise<unknown>;
  upsertDailyProgress: (payload: OfflineDailyProgressPayload) => Promise<unknown>;
}): Promise<void> {
  const queue = await readQueue();
  if (queue.length === 0) return;

  const remaining: OfflineProgressQueueItem[] = [];
  for (const item of queue) {
    try {
      if (item.type === 'userProgress') {
        await handlers.upsertUserProgress(item.payload);
      } else {
        await handlers.upsertDailyProgress(item.payload);
      }
    } catch (e) {
      log.warn('[OfflineQueue] flush failed, will retry:', item.type, e);
      remaining.push(item);
    }
  }

  await writeQueue(remaining);
  const flushed = queue.length - remaining.length;
  if (flushed > 0) {
    log.info('[OfflineQueue] flushed', flushed, 'item(s)');
  }
}
