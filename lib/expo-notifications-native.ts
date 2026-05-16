import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

import { log } from '@/lib/log';

let linkedCache: boolean | null = null;

/**
 * True when this binary actually includes expo-notifications native modules.
 * Call this before any `import('expo-notifications/...')` — those modules sync-require native code on load.
 */
export function isExpoNotificationsNativeLinked(): boolean {
  if (Platform.OS === 'web') return false;
  if (linkedCache !== null) return linkedCache;

  const scheduler = requireOptionalNativeModule('ExpoNotificationScheduler');
  const permissions = requireOptionalNativeModule('ExpoNotificationPermissionsModule');
  linkedCache = scheduler != null && permissions != null;

  if (!linkedCache) {
    log.warn(
      '[notifications] This install does not include expo-notifications native code (Expo Go or an old dev client). Rebuild: `bun run android`. Local notifications are disabled until then.',
    );
  }

  return linkedCache;
}
