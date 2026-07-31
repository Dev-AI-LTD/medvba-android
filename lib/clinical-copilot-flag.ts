import Constants from 'expo-constants';
import { isClinicalCopilotEnabled as isClinicalCopilotEnabledFromEnv } from '@/constants/clinical-copilot';

/**
 * Client-safe Clinical Copilot gate.
 * EAS production/internal embed true; development and local default stay OFF unless env/extra set.
 */
export function isClinicalCopilotUiEnabled(): boolean {
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  const fromExtra = extra?.EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED;
  if (fromExtra != null && String(fromExtra).trim() !== '') {
    const v = String(fromExtra).trim().toLowerCase();
    return v === 'true' || v === '1';
  }
  return isClinicalCopilotEnabledFromEnv();
}
