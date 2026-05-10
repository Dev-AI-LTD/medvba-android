import Constants from "expo-constants";

type LooseConstants = {
  expoConfig?: { extra?: Record<string, unknown> };
  manifest?: { extra?: Record<string, unknown> };
  manifest2?: {
    extra?: {
      expoClient?: Record<string, unknown> & { extra?: Record<string, unknown> };
    };
  };
};

/**
 * Merged `extra` / EXPO_PUBLIC_* from all Expo manifest shapes (dev client, EAS Updates, classic).
 * Used so .env values embedded via app.config `extra` resolve even when `Constants.expoConfig` is sparse.
 */
export function getMergedExpoExtra(): Record<string, unknown> {
  const c = Constants as LooseConstants;
  const expoClient = c.manifest2?.extra?.expoClient;
  const fromManifest2Nested = expoClient?.extra ?? {};
  const fromManifest2Root = Object.fromEntries(
    Object.entries(expoClient ?? {}).filter(([k]) => k.startsWith("EXPO_PUBLIC_")),
  );
  const fromManifest = c.manifest?.extra ?? {};
  const fromExpoConfig = c.expoConfig?.extra ?? {};
  return {
    ...fromManifest2Nested,
    ...fromManifest2Root,
    ...fromManifest,
    ...fromExpoConfig,
  };
}
