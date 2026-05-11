import { getApiBaseUrl } from "@/lib/api-base-url";

export type ExchangeSessionResult =
  | { ok: true; access_token: string; profile_id: string }
  | { ok: false; error: string; status?: number };

const SESSION_FETCH_TIMEOUT_MS = 22_000;

type SessionResponseJson = {
  access_token?: string;
  profile_id?: string;
  error?: string;
  detail?: unknown;
  issues?: unknown;
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

function formatSessionParseFailure(res: Response, raw: string): string {
  const status = res.status;
  const trimmed = raw.trim();
  if (!trimmed) {
    return `Empty response from server (HTTP ${status}). Check EXPO_PUBLIC_API_BASE_URL and that the backend exposes /api/auth/session.`;
  }
  const looksHtml =
    trimmed.startsWith("<") ||
    /^\s*<!doctype/i.test(trimmed) ||
    /<html[\s>]/i.test(trimmed.slice(0, 500));
  if (looksHtml) {
    return `Server returned HTML instead of JSON (HTTP ${status}). Usually the API URL is wrong, the host serves an error page, or /api/auth/session is not deployed. Check EXPO_PUBLIC_API_BASE_URL.`;
  }
  const snippet = trimmed.length > 200 ? `${trimmed.slice(0, 200)}…` : trimmed;
  return `Invalid JSON from server (HTTP ${status}): ${snippet}`;
}

async function parseSessionJson(res: Response): Promise<
  | { ok: true; json: SessionResponseJson }
  | { ok: false; error: string }
> {
  const raw = await res.text().catch(() => "");
  let body = raw.trim();
  if (body.charCodeAt(0) === 0xfeff) {
    body = body.slice(1);
  }
  if (!body) {
    return { ok: false, error: formatSessionParseFailure(res, raw) };
  }
  try {
    const json = JSON.parse(body) as SessionResponseJson;
    return { ok: true, json };
  } catch {
    return { ok: false, error: formatSessionParseFailure(res, raw) };
  }
}

function formatApiErrorMessage(json: SessionResponseJson, fallback: string): string {
  const base = (typeof json.error === "string" && json.error.trim()) || fallback;
  const detail = json.detail;
  if (typeof detail === "string" && detail.trim()) {
    return `${base}\n\n${detail.trim()}`;
  }
  if (detail != null && typeof detail !== "string") {
    try {
      const s = JSON.stringify(detail);
      if (s && s !== "{}") return `${base}\n\n${s.slice(0, 400)}${s.length > 400 ? "…" : ""}`;
    } catch {
      /* ignore */
    }
  }
  return base;
}

/**
 * Exchange an identity-provider access token for a Supabase-compatible JWT (HS256, minted by backend).
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
    return { ok: false, error: formatApiErrorMessage(json, res.statusText), status: res.status };
  }
  if (!json.access_token || !json.profile_id) {
    return { ok: false, error: formatApiErrorMessage(json, "Invalid session response from server.") };
  }
  return { ok: true, access_token: json.access_token, profile_id: json.profile_id };
}

/**
 * Email + password via backend password grant (no hosted browser login page in app).
 */
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
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
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
    return { ok: false, error: formatApiErrorMessage(json, res.statusText), status: res.status };
  }
  if (!json.access_token || !json.profile_id) {
    return { ok: false, error: formatApiErrorMessage(json, "Login failed.") };
  }
  return { ok: true, access_token: json.access_token, profile_id: json.profile_id };
}
