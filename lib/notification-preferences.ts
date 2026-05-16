import AsyncStorage from '@react-native-async-storage/async-storage';

export const NOTIFICATIONS_STORAGE_KEY = '@medvba_notifications';

export interface NotificationSettings {
  studyReminders: boolean;
  studyTime: string;
  chatNotifications: boolean;
  medvbaUpdates: boolean;
  soundEnabled: boolean;
  doNotDisturb: boolean;
  doNotDisturbStart: string;
  doNotDisturbEnd: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  studyReminders: false,
  studyTime: '09:00',
  chatNotifications: true,
  medvbaUpdates: true,
  soundEnabled: true,
  doNotDisturb: false,
  doNotDisturbStart: '22:00',
  doNotDisturbEnd: '08:00',
};

let memoryCache: NotificationSettings = { ...DEFAULT_NOTIFICATION_SETTINGS };

export function getCachedNotificationPreferences(): NotificationSettings {
  return memoryCache;
}

export function setCachedNotificationPreferences(next: NotificationSettings): void {
  memoryCache = next;
}

export async function loadNotificationPreferences(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<NotificationSettings>;
      memoryCache = { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
      return memoryCache;
    }
  } catch (e) {
    console.warn('[notifications] load failed', e);
  }
  memoryCache = { ...DEFAULT_NOTIFICATION_SETTINGS };
  return memoryCache;
}

export async function saveNotificationPreferences(
  next: NotificationSettings
): Promise<void> {
  memoryCache = next;
  await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(next));
}
