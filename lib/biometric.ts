import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { log } from './log';

export interface BiometricResult {
  success: boolean;
  error?: string;
}

export interface BiometricCapabilities {
  hasHardware: boolean;
  isEnrolled: boolean;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

const BIOMETRIC_STORAGE_KEY = '@medvba_biometric_enabled';

export async function getBiometricCapabilities(): Promise<BiometricCapabilities> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    return {
      hasHardware,
      isEnrolled,
      supportedTypes,
    };
  } catch (error) {
    log.error('[Biometric] Error checking capabilities:', error);
    return {
      hasHardware: false,
      isEnrolled: false,
      supportedTypes: [],
    };
  }
}

export async function isBiometricAvailable(): Promise<boolean> {
  const capabilities = await getBiometricCapabilities();
  return capabilities.hasHardware && capabilities.isEnrolled;
}

export async function authenticateWithBiometric(
  reason: string = 'Authenticate to access MEDVBA'
): Promise<BiometricResult> {
  if (Platform.OS === 'android' || Platform.OS === 'ios') {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return { success: true };
      }

      if (
        result.error === 'user_cancel' ||
        result.error === 'system_cancel' ||
        result.error === 'app_cancel'
      ) {
        return { success: false, error: 'Authentication cancelled' };
      }

      if (result.error === 'user_fallback') {
        return { success: false, error: 'user_fallback' };
      }

      if (result.error === 'lockout') {
        return { success: false, error: 'Too many attempts. Please try again later.' };
      }

      if (result.error === 'not_enrolled' || result.error === 'passcode_not_set') {
        return {
          success: false,
          error: 'Biometric login is not set up on this device. Enable Face ID in iOS Settings.',
        };
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      return { success: false, error: 'Authentication failed. Please try again.' };
    } catch (error) {
      log.error('[Biometric] Authentication error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return { success: false, error: 'Authentication failed. Please try again.' };
    }
  }

  return { success: false, error: 'Biometric authentication not available on this platform' };
}

export function getBiometricTypeName(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris';
  }
  return 'Biometric';
}
