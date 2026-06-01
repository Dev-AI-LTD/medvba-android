import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useSegments } from 'expo-router';
import { ScanFace } from 'lucide-react-native';
import { useAuth, getBiometricTypeName } from '@/providers/AuthProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { sectionGap, space, typeScale, buttonHeight, radiusMd } from '@/theme/iosDesign';

const UNLOCK_GRACE_MS = 30_000;

/**
 * When biometric login is enabled in Settings, prompts Face ID / Touch ID on cold start
 * and when returning from background (banking-app style unlock).
 */
export function BiometricLockGate({ children }: { children: React.ReactNode }) {
  const {
    isAuthenticated,
    isLoading,
    isAuthBusy,
    isBiometricEnabled,
    biometricCapabilities,
    signInWithBiometric,
  } = useAuth();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const segments = useSegments();
  const [isLocked, setIsLocked] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const lastUnlockAtRef = useRef(0);
  const coldStartHandledRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  const inAuthGroup = segments[0] === '(auth)';
  const canLock =
    Platform.OS !== 'web' &&
    isBiometricEnabled &&
    biometricCapabilities?.hasHardware &&
    biometricCapabilities?.isEnrolled;
  const skipLock = !isAuthenticated || isLoading || isAuthBusy || inAuthGroup || !canLock;

  const biometricLabel = getBiometricTypeName(biometricCapabilities?.supportedTypes ?? []);

  const attemptUnlock = useCallback(async () => {
    if (isPrompting || skipLock) return;
    setIsPrompting(true);
    try {
      const result = await signInWithBiometric();
      if (!result.error) {
        lastUnlockAtRef.current = Date.now();
        setIsLocked(false);
      }
    } finally {
      setIsPrompting(false);
    }
  }, [isPrompting, skipLock, signInWithBiometric]);

  useEffect(() => {
    if (!isAuthenticated) {
      coldStartHandledRef.current = false;
      setIsLocked(false);
      return;
    }
    if (isLoading || isAuthBusy) return;
    if (coldStartHandledRef.current) return;
    coldStartHandledRef.current = true;
    if (!canLock) return;
    setIsLocked(true);
  }, [isAuthenticated, isLoading, isAuthBusy, canLock]);

  useEffect(() => {
    if (skipLock) {
      setIsLocked(false);
      return;
    }
    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;
      if (
        (prev === 'background' || prev === 'inactive') &&
        nextState === 'active' &&
        Date.now() - lastUnlockAtRef.current > UNLOCK_GRACE_MS
      ) {
        setIsLocked(true);
      }
    });
    return () => sub.remove();
  }, [skipLock]);

  useEffect(() => {
    if (!isLocked || skipLock || isPrompting) return;
    void attemptUnlock();
  }, [isLocked, skipLock, isPrompting, attemptUnlock]);

  return (
    <>
      {children}
      {isLocked && !skipLock ? (
        <View
          style={[styles.overlay, { backgroundColor: colors.background }]}
          accessibilityViewIsModal
          importantForAccessibility="yes"
        >
          <ScanFace color={colors.primary} size={56} />
          <Text style={[styles.title, { color: colors.text }]}>
            {t('biometric.unlockTitle').replace('{type}', biometricLabel)}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('biometric.unlockSubtitle')}
          </Text>
          {isPrompting ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
          ) : (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary }]}
              onPress={() => void attemptUnlock()}
              accessibilityRole="button"
              accessibilityLabel={t('biometric.tryAgain')}
            >
              <Text style={[styles.buttonText, { color: colors.background }]}>
                {t('biometric.tryAgain')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    justifyContent: 'center',
    alignItems: 'center',
    padding: sectionGap,
  },
  title: {
    ...typeScale.title2,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: space.space5,
  },
  subtitle: {
    ...typeScale.body,
    textAlign: 'center',
    marginTop: space.space3,
    marginBottom: space.space6,
    maxWidth: 320,
  },
  spinner: {
    marginTop: space.space4,
  },
  button: {
    minHeight: buttonHeight,
    paddingHorizontal: space.space7,
    paddingVertical: space.space3,
    borderRadius: radiusMd,
    justifyContent: 'center',
  },
  buttonText: {
    ...typeScale.body,
    fontWeight: '600',
  },
});
