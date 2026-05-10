import Constants from "expo-constants";

/** `expo-constants`: `extra` may live on `expoConfig`, legacy `manifest`, or `manifest2` (SDK-dependent). */
function readExpoExtra(): Record<string, unknown> {
  const c = Constants as {
    expoConfig?: { extra?: Record<string, unknown> };
    manifest?: { extra?: Record<string, unknown> };
    manifest2?: { extra?: Record<string, unknown> };
  };
  return (
    c.expoConfig?.extra ??
    (c.manifest2 as { extra?: Record<string, unknown> } | undefined)?.extra ??
    c.manifest?.extra ??
    {}
  );
}

function pickFirstNonEmpty(...candidates: unknown[]): string | undefined {
  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    const t = String(c).trim();
    if (t) return t;
  }
  return undefined;
}

/** Fix common typo: `https:/host` → `https://host` (missing slash after scheme). */
function normalizeApiBaseUrl(s: string): string {
  return s
    .trim()
    .replace(/^https:\/(?!\/)/, "https://")
    .replace(/^http:\/(?!\/)/, "http://")
    .replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const extraConfig = readExpoExtra();

  // Prefer `extra` from app.config.ts (loads .env at config time). Metro may not inline
  // process.env.EXPO_PUBLIC_* the same way in all dev setups.
  const raw = pickFirstNonEmpty(
    extraConfig.EXPO_PUBLIC_API_BASE_URL,
    extraConfig.EXPO_PUBLIC_RORK_API_BASE_URL,
    extraConfig.apiBaseUrl,
    process.env.EXPO_PUBLIC_API_BASE_URL,
    process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
  );

  if (!raw) {
    throw new Error(
      "Set EXPO_PUBLIC_API_BASE_URL (or EXPO_PUBLIC_RORK_API_BASE_URL) in project root .env, then run: npx expo start --clear",
    );
  }

  return normalizeApiBaseUrl(String(raw));
}
