import { Platform } from 'react-native';

import { isExpoNotificationsNativeLinked } from '@/lib/expo-notifications-native';
import type { NotificationSettings } from '@/lib/notification-preferences';
import { isStudyTimeBlockedByDnd } from '@/lib/dnd-time';
import {
  ANDROID_STUDY_CHANNEL_SILENT,
  ANDROID_STUDY_CHANNEL_SOUND,
  STUDY_REMINDER_NOTIFICATION_ID,
} from '@/lib/notification-constants';
import { log } from '@/lib/log';

export type StudyReminderCopy = {
  title: string;
  body: string;
};

type NotificationModules = {
  getPermissionsAsync: typeof import('expo-notifications/build/NotificationPermissions').getPermissionsAsync;
  requestPermissionsAsync: typeof import('expo-notifications/build/NotificationPermissions').requestPermissionsAsync;
  cancelScheduledNotificationAsync: typeof import('expo-notifications/build/cancelScheduledNotificationAsync').default;
  scheduleNotificationAsync: typeof import('expo-notifications/build/scheduleNotificationAsync').default;
  SchedulableTriggerInputTypes: typeof import('expo-notifications/build/Notifications.types').SchedulableTriggerInputTypes;
  IosAuthorizationStatus: typeof import('expo-notifications/build/NotificationPermissions.types').IosAuthorizationStatus;
};

let cachedMods: NotificationModules | null = null;
let modsLoadFailed = false;

async function loadNotificationModules(): Promise<NotificationModules> {
  const [perms, cancelM, scheduleM, typesM, iosPermM] = await Promise.all([
    import('expo-notifications/build/NotificationPermissions'),
    import('expo-notifications/build/cancelScheduledNotificationAsync'),
    import('expo-notifications/build/scheduleNotificationAsync'),
    import('expo-notifications/build/Notifications.types'),
    import('expo-notifications/build/NotificationPermissions.types'),
  ]);
  return {
    getPermissionsAsync: perms.getPermissionsAsync,
    requestPermissionsAsync: perms.requestPermissionsAsync,
    cancelScheduledNotificationAsync: cancelM.default,
    scheduleNotificationAsync: scheduleM.default,
    SchedulableTriggerInputTypes: typesM.SchedulableTriggerInputTypes,
    IosAuthorizationStatus: iosPermM.IosAuthorizationStatus,
  };
}

async function getNotificationModules(): Promise<NotificationModules | null> {
  if (Platform.OS === 'web' || modsLoadFailed) return null;
  if (!isExpoNotificationsNativeLinked()) return null;
  if (cachedMods) return cachedMods;
  try {
    cachedMods = await loadNotificationModules();
    return cachedMods;
  } catch (e) {
    modsLoadFailed = true;
    log.warn('[study-reminder] expo-notifications modules unavailable (rebuild dev client).', e);
    return null;
  }
}

export async function requestNotificationPermissionAsync(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const mods = await getNotificationModules();
  if (!mods) return false;
  try {
    const { status: existing } = await mods.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await mods.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === 'granted';
  } catch (e) {
    log.warn('[study-reminder] requestNotificationPermissionAsync failed', e);
    return false;
  }
}

function parseStudyClock(studyTime: string): { hour: number; minute: number } {
  const [h, m] = studyTime.split(':').map((x) => parseInt(x, 10));
  return {
    hour: Math.min(23, Math.max(0, Number.isFinite(h) ? h : 9)),
    minute: Math.min(59, Math.max(0, Number.isFinite(m) ? m : 0)),
  };
}

async function allowsNotificationsAsync(mods: NotificationModules): Promise<boolean> {
  const settings = await mods.getPermissionsAsync();
  if (settings.granted) return true;
  if (Platform.OS === 'ios' && settings.ios?.status === mods.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  return false;
}

/**
 * Cancels or (re)schedules the daily local study reminder from persisted settings.
 */
export async function syncStudyReminderNotification(
  settings: NotificationSettings,
  copy: StudyReminderCopy
): Promise<void> {
  if (Platform.OS === 'web') return;

  const mods = await getNotificationModules();
  if (!mods) return;

  try {
    await mods.cancelScheduledNotificationAsync(STUDY_REMINDER_NOTIFICATION_ID);
  } catch {
    /* ignore */
  }

  if (!settings.studyReminders) {
    return;
  }

  if (
    isStudyTimeBlockedByDnd(
      settings.studyTime,
      settings.doNotDisturb,
      settings.doNotDisturbStart,
      settings.doNotDisturbEnd
    )
  ) {
    return;
  }

  const allowed = await allowsNotificationsAsync(mods);
  if (!allowed) {
    return;
  }

  const { hour, minute } = parseStudyClock(settings.studyTime);
  const channelId = settings.soundEnabled ? ANDROID_STUDY_CHANNEL_SOUND : ANDROID_STUDY_CHANNEL_SILENT;

  const trigger = {
    type: mods.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
    ...(Platform.OS === 'android' ? { channelId } : {}),
  } as const;

  try {
    await mods.scheduleNotificationAsync({
      identifier: STUDY_REMINDER_NOTIFICATION_ID,
      content: {
        title: copy.title,
        body: copy.body,
        sound: settings.soundEnabled,
      },
      trigger,
    });
  } catch (e) {
    log.warn('[study-reminder] scheduleNotificationAsync failed', e);
  }
}
