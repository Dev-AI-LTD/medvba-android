import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

function isDefinitelyDisconnected(state: {
  isConnected: boolean | null;
  isInternetReachable?: boolean | null;
}): boolean {
  if (state.isConnected === false) return true;
  if (state.isConnected === true && state.isInternetReachable === false) return true;
  return false;
}

/** Device has no usable internet (auth gates, offline sync, banners). */
export function useIsOffline(): boolean {
  return useBlockingAuthOfflineInternal();
}

/** @deprecated Prefer {@link useIsOffline} */
export function useBlockingAuthOffline(): boolean {
  return useBlockingAuthOfflineInternal();
}

function useBlockingAuthOfflineInternal(): boolean {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof navigator === 'undefined') return undefined;
      const sync = () => setOffline(!navigator.onLine);
      sync();
      if (typeof window === 'undefined') return undefined;
      window.addEventListener('online', sync);
      window.addEventListener('offline', sync);
      return () => {
        window.removeEventListener('online', sync);
        window.removeEventListener('offline', sync);
      };
    }

    let cancelled = false;
    const unsub = NetInfo.addEventListener((state) => {
      if (!cancelled) setOffline(isDefinitelyDisconnected(state));
    });
    NetInfo.fetch()
      .then((state) => {
        if (!cancelled) setOffline(isDefinitelyDisconnected(state));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  return offline;
}
