import { getApiBaseUrl } from "@/lib/api-base-url";
import { log } from "@/lib/log";

export type ExchangeSessionResult =
  | { ok: true; access_token: string; profile_id: string; refresh_token?: string }
  | { ok: false; error: string; status?: number };

const SESSION_FETCH_TIMEOUT_MS = 22_000;

type SessionResponseJson = {
  access_token?: string;
  profile_id?: string;
  refresh_token?: string;
  error?: string;
  detail?: unknown;
  issues?: unknown;
  hint?: string;
};

function isAbortError(e: unknown): boolean {
  if (e instanceof Error && e.name === "AbortError") return true;
  if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "AbortError") {
    return true;
  }
  return false;
}

function sleepMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Backend signals Kinde /oauth2/token gateway or 5xx after its own retries — safe to retry once or twice from the app. */
function isTransientKindeLoginJson(json: SessionResponseJson): boolean {
  const hint = typeof json.hint === "string" ? json.hint : "";
  if (hint.includes("Kinde returned a server error")) return true;
  const detail = typeof json.detail === "string" ? json.detail : "";
  return /HTTP (502|503|504)\b.*oauth2\/token/i.test(detail);
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

function authEndpointNotFoundMessage(base: string, path: string): string {
  return `Backend returned HTTP 404 for POST ${path}. Use EXPO_PUBLIC_API_BASE_URL as the API root only (example: https://your-service.up.railway.app — not …/api). Restart Expo with --clear, redeploy backend/server.ts if this route is missing, or run the API locally. Current base: ${base}`;
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
  let body = base;
  if (typeof detail === "string" && detail.trim()) {
    body = `${base}\n\n${detail.trim()}`;
  } else if (detail != null && typeof detail !== "string") {
    try {
      const s = JSON.stringify(detail);
      if (s && s !== "{}") body = `${base}\n\n${s.slice(0, 400)}${s.length > 400 ? "…" : ""}`;
    } catch {
      /* ignore */
    }
  }
  const hint = typeof json.hint === "string" ? json.hint.trim() : "";
  if (hint) {
    body = `${body}\n\n${hint}`;
  }
  return body;
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
  if (res.status === 404) {
    return { ok: false, error: authEndpointNotFoundMessage(base, "/api/auth/session"), status: 404 };
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
  const refresh_token =
    typeof json.refresh_token === "string" && json.refresh_token.length > 0
      ? json.refresh_token
      : undefined;
  return {
    ok: true,
    access_token: json.access_token,
    profile_id: json.profile_id,
    ...(refresh_token ? { refresh_token } : {}),
  };
}

/**
 * Mint a new MEDVBA JWT using a stored Kinde refresh_token (server-side; email/password flow).
 */
export async function exchangeKindeRefreshToken(refreshToken: string): Promise<ExchangeSessionResult> {
  const base = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetchSession(`${base}/api/auth/session/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: msg };
  }
  if (res.status === 404) {
    return {
      ok: false,
      error: authEndpointNotFoundMessage(base, "/api/auth/session/refresh"),
      status: 404,
    };
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
  const nextRefresh =
    typeof json.refresh_token === "string" && json.refresh_token.length > 0
      ? json.refresh_token
      : refreshToken;
  return {
    ok: true,
    access_token: json.access_token,
    profile_id: json.profile_id,
    refresh_token: nextRefresh,
  };
}

/**
 * Email + password via backend password grant (no hosted browser login page in app).
 */
export async function exchangeEmailPasswordSession(
  email: string,
  password: string,
): Promise<ExchangeSessionResult> {
  const base = getApiBaseUrl();
  const body = JSON.stringify({ email: email.trim().toLowerCase(), password });
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res: Response;
    try {
      res = await fetchSession(`${base}/api/auth/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Network error";
      return { ok: false, error: msg };
    }
    if (res.status === 404) {
      return { ok: false, error: authEndpointNotFoundMessage(base, "/api/auth/session"), status: 404 };
    }
    const parsed = await parseSessionJson(res);
    if (__DEV__) {
      try {
        const u = new URL(`${base}/api/auth/session`);
        log.debug(
          `[exchangeEmailPasswordSession] attempt ${attempt}/${maxAttempts} ${u.origin}/api/auth/session → HTTP ${res.status}`,
        );
      } catch {
        log.debug(`[exchangeEmailPasswordSession] attempt ${attempt}/${maxAttempts} HTTP ${res.status}`);
      }
    }
    if (!parsed.ok) {
      return { ok: false, error: parsed.error, status: res.status };
    }
    const json = parsed.json;
    if (!res.ok) {
      if (isTransientKindeLoginJson(json) && attempt < maxAttempts) {
        await sleepMs(700 * attempt);
        continue;
      }
      return { ok: false, error: formatApiErrorMessage(json, res.statusText), status: res.status };
    }
    if (!json.access_token || !json.profile_id) {
      return { ok: false, error: formatApiErrorMessage(json, "Login failed.") };
    }
    const refresh_token =
      typeof json.refresh_token === "string" && json.refresh_token.length > 0
        ? json.refresh_token
        : undefined;
    return {
      ok: true,
      access_token: json.access_token,
      profile_id: json.profile_id,
      ...(refresh_token ? { refresh_token } : {}),
    };
  }

  return { ok: false, error: "Login failed after retries." };
}

/**
 * Email + password + display name — server creates the Kinde user (Management API) and returns a MEDVBA session (no hosted browser).
 */
export async function registerEmailPasswordSession(
  email: string,
  password: string,
  name: string,
): Promise<ExchangeSessionResult> {
  const base = getApiBaseUrl();
  let res: Response;
  try {
    res = await fetchSession(`${base}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        name: name.trim(),
      }),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: msg };
  }
  if (res.status === 404) {
    return { ok: false, error: authEndpointNotFoundMessage(base, "/api/auth/register"), status: 404 };
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
    return { ok: false, error: formatApiErrorMessage(json, "Registration failed.") };
  }
  const refresh_token =
    typeof json.refresh_token === "string" && json.refresh_token.length > 0
      ? json.refresh_token
      : undefined;
  return {
    ok: true,
    access_token: json.access_token,
    profile_id: json.profile_id,
    ...(refresh_token ? { refresh_token } : {}),
  };
}
