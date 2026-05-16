/** Same transient backoff policy as oauth2/token in session-routes. */
const KINDE_PROFILE_MAX_ATTEMPTS = 4;
const TRANSIENT_KINDE_PROFILE_STATUSES = new Set([429, 502, 503, 504]);

async function sleepMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch current user from the identity provider userinfo endpoint using an access token.
 * @see https://docs.kinde.com/api/oauth2/user-profile/
 */
export async function fetchKindeUserProfile(
  accessToken: string,
): Promise<Response> {
  const issuer = (process.env.KINDE_ISSUER_URL || process.env.KINDE_SITE_URL || "")
    .trim()
    .replace(/\/+$/, "");
  if (!issuer) {
    throw new Error("KINDE_ISSUER_URL is not configured.");
  }

  let attempt = 0;
  while (true) {
    attempt += 1;
    const res = await fetch(`${issuer}/oauth2/user_profile`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    if (res.ok) return res;
    const retryable =
      TRANSIENT_KINDE_PROFILE_STATUSES.has(res.status) && attempt < KINDE_PROFILE_MAX_ATTEMPTS;
    if (!retryable) return res;
    await res.text().catch(() => {});
    const delayMs = Math.min(2500, 350 * attempt ** 2);
    console.warn(
      `[auth] user_profile HTTP ${res.status}, retry ${attempt}/${KINDE_PROFILE_MAX_ATTEMPTS} after ${delayMs}ms`,
    );
    await sleepMs(delayMs);
  }
}
