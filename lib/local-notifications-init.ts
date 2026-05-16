import { Platform } from 'react-native';

import { isExpoNotificationsNativeLinked } from '@/lib/expo-notifications-native';
import { getCachedNotificationPreferences } from '@/lib/notification-preferences';
import { isMinuteInQuietHours, timeStringToMinutes } from '@/lib/dnd-time';
import {
  ANDROID_STUDY_CHANNEL_SILENT,
  ANDROID_STUDY_CHANNEL_SOUND,
} from '@/lib/notification-constants';
import { log } from '@/lib/log';

let presentationInitAttempted = false;

function isCurrentlyInDndFromCache(): boolean {
  const p = getCachedNotificationPreferences();
  if (!p.doNotDisturb) return false;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return isMinuteInQuietHours(
    nowMin,
    timeStringToMinutes(p.doNotDisturbStart),
    timeStringToMinutes(p.doNotDisturbEnd),
    true
  );
}

/**
 * Registers foreground notification behavior. Loads native code only when called
 * (avoids crashing older dev clients / Expo Go that lack `expo-notifications` native modules).
 */
export async function initNotificationPresentationOnce(): Promise<void> {
  if (Platform.OS === 'web' || presentationInitAttempted) {
    return;
  }
  presentationInitAttempted = true;

  if (!isExpoNotificationsNativeLinked()) {
    return;
  }

  try {
    const { setNotificationHandler } = await import('expo-notifications/build/NotificationsHandler');
    setNotificationHandler({
      handleNotification: async () => {
        const prefs = getCachedNotificationPreferences();
        const inDnd = isCurrentlyInDndFromCache();
        const playSound = prefs.soundEnabled && !inDnd;
        return {
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: playSound,
          shouldSetBadge: false,
        };
      },
    });
  } catch (e) {
    log.warn(
      '[notifications] setNotificationHandler unavailable — rebuild the dev client after adding expo-notifications (e.g. `npx expo run:android`).',
      e,
    );
  }
}

export async function ensureAndroidStudyNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  if (!isExpoNotificationsNativeLinked()) {
    return;
  }

  try {
    const setNotificationChannelAsync = (await import('expo-notifications/build/setNotificationChannelAsync'))
      .default;
    const { AndroidImportance } = await import('expo-notifications/build/NotificationChannelManager.types');

    await setNotificationChannelAsync(ANDROID_STUDY_CHANNEL_SOUND, {
      name: 'Study reminders',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      enableVibrate: true,
      vibrationPattern: [0, 250, 250, 250],
      bypassDnd: false,
    });

    await setNotificationChannelAsync(ANDROID_STUDY_CHANNEL_SILENT, {
      name: 'Study reminders (silent)',
      importance: AndroidImportance.DEFAULT,
      sound: null,
      enableVibrate: false,
      bypassDnd: false,
    });
  } catch (e) {
    log.warn('[notifications] Android channels unavailable (rebuild dev client with expo-notifications).', e);
  }
}
