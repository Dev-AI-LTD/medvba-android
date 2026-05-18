import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

function isOnlineState(state: {
  isConnected: boolean | null;
  isInternetReachable?: boolean | null;
}): boolean {
  if (state.isConnected !== true) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

/** Runs callback when device regains usable internet (native NetInfo or web `online`). */
export function useOfflineReconnectEffect(onReconnect: () => void): void {
  const callbackRef = useRef(onReconnect);
  callbackRef.current = onReconnect;

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return undefined;
      const handler = () => {
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          callbackRef.current();
        }
      };
      window.addEventListener('online', handler);
      return () => window.removeEventListener('online', handler);
    }

    return NetInfo.addEventListener((state) => {
      if (isOnlineState(state)) {
        callbackRef.current();
      }
    });
  }, []);
}
