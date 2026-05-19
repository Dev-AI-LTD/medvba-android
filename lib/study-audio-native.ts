import { requireOptionalNativeModule } from 'expo-modules-core';

/** True when the dev/production build includes the expo-audio native module. */
export function hasStudyStreamAudioNative(): boolean {
  try {
    return requireOptionalNativeModule('ExpoAudio') != null;
  } catch {
    return false;
  }
}
