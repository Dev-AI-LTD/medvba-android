import { getApiBaseUrl } from "@/lib/api-base-url";
import { setMedvbaAccessToken } from "@/lib/medvba-access-token";

export type ExchangeSessionResult =
  | { ok: true; access_token: string; profile_id: string }
  | { ok: false; error: string; status?: number };

const SESSION_FETCH_TIMEOUT_MS = 22_000;

type SessionResponseJson = {
  access_token?: string;
  profile_id?: string;
  error?: string;
};

function isAbortError(e: unknown): boolean {
  if (e instanceof Error && e.name === "AbortError") return true;
  if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "AbortError") {
    return true;
  }
  return false;
}

async function fetchSession(
  url: string,
  init: Omit<RequestInit, "signal">,
): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), SESSION_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (e) {
    if (isAbortError(e)) {
      throw new Error("Connection timed out. Check network and EXPO_PUBLIC_API_BASE_URL.");
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

async function parseSessionJson(res: Response): Promise<
  | { ok: true; json: SessionResponseJson }
  | { ok: false; error: string }
> {
  try {
    return { ok: true, json: (await res.json()) as SessionResponseJson };
  } catch {
    return { ok: false, error: "Invalid JSON response from session server." };
  }
}

/**
 * Exchange a Kinde access token for a Supabase-compatible JWT (HS256, minted by backend).
 */
export async function exchangeKindeAccessToken(
  kindeAccessToken: string,
): Promise<ExchangeSessionResult> {
  const base = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetchSession(`${base}/api/auth/session`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kindeAccessToken}`,
        Accept: "application/json",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: msg };
  }
  const parsed = await parseSessionJson(res);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, status: res.status };
  }
  const json = parsed.json;
  if (!res.ok) {
    return { ok: false, error: json.error || res.statusText, status: res.status };
  }
  if (!json.access_token || !json.profile_id) {
    return { ok: false, error: "Invalid session response from server." };
  }
  setMedvbaAccessToken(json.access_token);
  return { ok: true, access_token: json.access_token, profile_id: json.profile_id };
}

export async function exchangeEmailPasswordSession(
  email: string,
  password: string,
): Promise<ExchangeSessionResult> {
  const base = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetchSession(`${base}/api/auth/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: msg };
  }
  const parsed = await parseSessionJson(res);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error, status: res.status };
  }
  const json = parsed.json;
  if (!res.ok) {
    return { ok: false, error: json.error || res.statusText, status: res.status };
  }
  if (!json.access_token || !json.profile_id) {
    return { ok: false, error: json.error || "Login failed." };
  }
  setMedvbaAccessToken(json.access_token);
  return { ok: true, access_token: json.access_token, profile_id: json.profile_id };
}
