import { getMergedExpoExtra } from "@/lib/expo-public-extra";
import { fixHttpSchemeColonTypo } from "@/lib/fix-http-url-scheme-typo";

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
  let out = fixHttpSchemeColonTypo(s)
    .trim()
    .replace(/^https:\/(?!\/)/, "https://")
    .replace(/^http:\/(?!\/)/, "http://")
    .replace(/\/+$/, "");
  // Avoid `https://host/api` + `/api/auth/register` → `/api/api/auth/...` (404).
  out = out.replace(/\/api\/?$/i, "");
  return out.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const extraConfig = getMergedExpoExtra();

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

/** True when `EXPO_PUBLIC_API_BASE_URL` (or fallback env keys from {@link getApiBaseUrl}) is set. */
export function isApiBaseUrlConfigured(): boolean {
  const extraConfig = getMergedExpoExtra();
  return Boolean(
    pickFirstNonEmpty(
      extraConfig.EXPO_PUBLIC_API_BASE_URL,
      extraConfig.EXPO_PUBLIC_RORK_API_BASE_URL,
      extraConfig.apiBaseUrl,
      process.env.EXPO_PUBLIC_API_BASE_URL,
      process.env.EXPO_PUBLIC_RORK_API_BASE_URL,
    ),
  );
}
