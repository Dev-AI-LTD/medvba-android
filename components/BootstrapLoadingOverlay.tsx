import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const READY_KEY = '__MEDVBA_AUTH_READY__';
const POLL_MS = 150;
const STUCK_AFTER_MS = 22_000;

function readReady(): boolean {
  return (globalThis as Record<string, unknown>)[READY_KEY] === true;
}

/**
 * Shown while @kinde/expo `KindeAuthProvider` still renders `null` (no children mounted).
 * Also covers slow auth init so web/mobile are not a blank white screen.
 */
export function BootstrapLoadingOverlay() {
  const [phase, setPhase] = useState<'loading' | 'stuck' | 'hidden'>('loading');

  useEffect(() => {
    if (readReady()) {
      setPhase('hidden');
      return;
    }

    const started = Date.now();
    const poll = setInterval(() => {
      if (readReady()) {
        setPhase('hidden');
        clearInterval(poll);
        return;
      }
      if (Date.now() - started >= STUCK_AFTER_MS) {
        setPhase('stuck');
        clearInterval(poll);
      }
    }, POLL_MS);

    return () => clearInterval(poll);
  }, []);

  if (phase === 'hidden') return null;

  return (
    <View style={styles.layer} pointerEvents="auto">
      {phase === 'loading' ? (
        <>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.caption}>Se încarcă autentificarea…</Text>
        </>
      ) : (
        <>
          <Text style={styles.title}>Autentificarea nu pornește</Text>
          <Text style={styles.body}>
            Verifică EXPO_PUBLIC_KINDE_ISSUER_URL, EXPO_PUBLIC_KINDE_CLIENT_ID și în Kinde: Callback URLs
            (inclusiv medvba://). Dacă în consolă (F12) apare expoSecureStore și MIME text/html, oprește
            Metro și pornește din nou cu bun run start:web. Altfel: erori de rețea în consolă.
          </Text>
          {Platform.OS === 'web' ? (
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                if (typeof window !== 'undefined') window.location.reload();
              }}
            >
              <Text style={styles.buttonText}>Reîncarcă pagina</Text>
            </TouchableOpacity>
          ) : null}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
    gap: 16,
  },
  caption: {
    marginTop: 8,
    fontSize: 15,
    color: '#334155',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 420,
  },
  button: {
    marginTop: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
