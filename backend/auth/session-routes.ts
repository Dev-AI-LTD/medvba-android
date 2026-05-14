import type { Hono } from "hono";
import bcrypt from "bcryptjs";
import { mintSupabaseAccessJwt } from "./mint-supabase-jwt";
import { fetchKindeUserProfile } from "./kinde-user-profile";
import { getSupabaseAdmin, resolveOrCreateProfileId, type KindeUserProfile } from "./resolve-profile";

/** Strip wrapping quotes often pasted into Railway / .env by mistake. */
function trimEnvValue(s: string | undefined): string {
  let t = (s ?? "").trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

const KINDE_OAUTH2_TOKEN_MAX_ATTEMPTS = 5;
const TRANSIENT_KINDE_TOKEN_STATUSES = new Set([429, 502, 503, 504]);

function sleepMs(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Kinde `/oauth2/token` sometimes returns transient gateway errors; retry with short backoff. */
async function fetchKindeOAuth2Token(url: string, init: RequestInit, logLabel: string): Promise<Response> {
  let attempt = 0;
  while (true) {
    attempt += 1;
    const res = await fetch(url, init);
    if (res.ok) return res;
    const canRetry =
      TRANSIENT_KINDE_TOKEN_STATUSES.has(res.status) && attempt < KINDE_OAUTH2_TOKEN_MAX_ATTEMPTS;
    if (!canRetry) return res;
    await res.text().catch(() => {});
    const delayMs = Math.min(2500, 350 * attempt ** 2);
    console.warn(
      `[auth] ${logLabel}: HTTP ${res.status} from oauth2/token, retry ${attempt}/${KINDE_OAUTH2_TOKEN_MAX_ATTEMPTS} after ${delayMs}ms`,
    );
    await sleepMs(delayMs);
  }
}

/**
 * Resource Owner Password Credentials (identity server) — server only (never expose client_secret to the app).
 * Enable password grant for the app client in the identity provider admin console.
 */
type KindeTokenPair = { access_token: string; refresh_token?: string };

type KindePasswordTokenResult =
  | { ok: true; tokens: KindeTokenPair }
  | {
      ok: false;
      code: "missing_env" | "token_error";
      detail?: string;
      /** Set when Kinde returned a non-2xx from /oauth2/token (for clearer client hints). */
      upstreamStatus?: number;
    };

async function kindePasswordToken(email: string, password: string): Promise<KindePasswordTokenResult> {
  const issuer = trimEnvValue(process.env.KINDE_ISSUER_URL).replace(/\/+$/, "");
  const clientId = trimEnvValue(process.env.KINDE_CLIENT_ID);
  const clientSecret = trimEnvValue(process.env.KINDE_CLIENT_SECRET);
  if (!issuer || !clientId || !clientSecret) {
    return { ok: false, code: "missing_env" };
  }

  const body = new URLSearchParams({
    grant_type: "password",
    username: email.trim(),
    password,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const aud = trimEnvValue(process.env.KINDE_AUDIENCE);
  if (aud) {
    body.set("audience", aud);
  }

  const res = await fetchKindeOAuth2Token(
    `${issuer}/oauth2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    "Password grant",
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.warn("[auth] Password grant token failed:", res.status, t.slice(0, 400));
    let hint = t.slice(0, 500);
    try {
      const errJson = JSON.parse(t) as { error?: string; error_description?: string };
      if (errJson.error_description) {
        hint = `${errJson.error ?? "error"}: ${errJson.error_description}`;
      }
    } catch {
      /* plain text */
    }
    return {
      ok: false,
      code: "token_error",
      detail: `HTTP ${res.status} ${issuer}/oauth2/token. ${hint}`,
      upstreamStatus: res.status,
    };
  }
  const json = (await res.json()) as { access_token?: string; refresh_token?: string };
  const access_token = json.access_token;
  if (!access_token) {
    return { ok: false, code: "token_error", detail: "Token response had no access_token." };
  }
  return {
    ok: true,
    tokens: {
      access_token,
      ...(typeof json.refresh_token === "string" && json.refresh_token.length > 0
        ? { refresh_token: json.refresh_token }
        : {}),
    },
  };
}

async function kindeRefreshAccessToken(refreshToken: string): Promise<KindeTokenPair | null> {
  const issuer = trimEnvValue(process.env.KINDE_ISSUER_URL).replace(/\/+$/, "");
  const clientId = trimEnvValue(process.env.KINDE_CLIENT_ID);
  const clientSecret = trimEnvValue(process.env.KINDE_CLIENT_SECRET);
  if (!issuer || !clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const aud = trimEnvValue(process.env.KINDE_AUDIENCE);
  if (aud) {
    body.set("audience", aud);
  }

  const res = await fetchKindeOAuth2Token(
    `${issuer}/oauth2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    "Refresh token grant",
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.warn("[auth] Refresh token grant failed:", res.status, t.slice(0, 200));
    return null;
  }
  const json = (await res.json()) as { access_token?: string; refresh_token?: string };
  const access_token = json.access_token;
  if (!access_token) return null;
  return {
    access_token,
    ...(typeof json.refresh_token === "string" && json.refresh_token.length > 0
      ? { refresh_token: json.refresh_token }
      : {}),
  };
}

async function mintSessionBody(input: {
  profileId: string;
  email: string | null;
  kindeSub: string;
}): Promise<{
  access_token: string;
  expires_in: number;
  token_type: "bearer";
  profile_id: string;
}> {
  const access_token = await mintSupabaseAccessJwt({
    kindeSub: input.kindeSub,
    profileId: input.profileId,
    email: input.email,
  });
  return {
    access_token,
    expires_in: 900,
    token_type: "bearer",
    profile_id: input.profileId,
  };
}

async function sessionFromKindeAccessToken(kindeAccessToken: string) {
  const profileRes = await fetchKindeUserProfile(kindeAccessToken);
  if (!profileRes.ok) {
    const t = await profileRes.text().catch(() => "");
    return {
      ok: false as const,
      status: 401,
      message: "Invalid or expired sign-in. Please sign in again.",
      detail: t.slice(0, 200),
    };
  }
  const kindeUser = (await profileRes.json()) as KindeUserProfile;
  if (!kindeUser?.id) {
    return { ok: false as const, status: 401, message: "Account profile is incomplete. Try signing in again." };
  }

  const admin = getSupabaseAdmin();
  const { profileId } = await resolveOrCreateProfileId(admin, kindeUser);
  const email = (kindeUser.preferred_email || kindeUser.email || "").trim() || null;
  const kindeSub = kindeUser.id;
  const body = await mintSessionBody({ profileId, email, kindeSub });

  return {
    ok: true as const,
    body,
  };
}

function getKindeIssuerBase(): string {
  return trimEnvValue(process.env.KINDE_ISSUER_URL).replace(/\/+$/, "");
}

function getKindeManagementAudience(issuer: string): string {
  const explicit =
    trimEnvValue(process.env.KINDE_MANAGEMENT_AUDIENCE) || trimEnvValue(process.env.KINDE_AUDIENCE) || "";
  if (explicit) return explicit.replace(/\/+$/, "");
  return `${issuer}/api`;
}

type KindeM2mTokenResult =
  | { ok: true; token: string }
  | { ok: false; code: "missing_env" | "token_error"; detail?: string };

async function kindeManagementAccessToken(): Promise<KindeM2mTokenResult> {
  const issuer = getKindeIssuerBase();
  const m2mId = trimEnvValue(process.env.KINDE_M2M_CLIENT_ID);
  const m2mSecret = trimEnvValue(process.env.KINDE_M2M_CLIENT_SECRET);
  if (!issuer || !m2mId || !m2mSecret) {
    return { ok: false, code: "missing_env" };
  }

  const audience = getKindeManagementAudience(issuer);
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: m2mId,
    client_secret: m2mSecret,
    audience,
  });
  const scope = trimEnvValue(process.env.KINDE_M2M_TOKEN_SCOPE);
  if (scope) {
    body.set("scope", scope);
  }

  const res = await fetchKindeOAuth2Token(
    `${issuer}/oauth2/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
    "Kinde M2M token",
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.warn("[auth] Kinde M2M token failed:", res.status, t.slice(0, 400));
    let hint = t.slice(0, 500);
    try {
      const errJson = JSON.parse(t) as { error?: string; error_description?: string };
      if (errJson.error_description) {
        hint = `${errJson.error ?? "error"}: ${errJson.error_description}`;
      }
    } catch {
      /* plain text body */
    }
    return {
      ok: false,
      code: "token_error",
      detail: `HTTP ${res.status} ${issuer}/oauth2/token (audience: ${audience}). ${hint}`,
    };
  }
  const json = (await res.json()) as { access_token?: string };
  const token = json.access_token;
  if (!token) {
    return { ok: false, code: "token_error", detail: "Token response had no access_token." };
  }
  return { ok: true, token };
}

function splitDisplayName(name: string): { given_name: string; family_name: string } {
  const t = name.trim();
  if (!t) return { given_name: "Student", family_name: "" };
  const sp = t.indexOf(" ");
  if (sp === -1) return { given_name: t, family_name: "" };
  return { given_name: t.slice(0, sp).trim(), family_name: t.slice(sp + 1).trim() };
}

async function kindeManagementCreateUser(
  m2mToken: string,
  email: string,
  displayName: string,
): Promise<{ ok: true; userId: string } | { ok: false; status: number; message: string; detail?: string }> {
  const issuer = getKindeIssuerBase();
  const orgCode = process.env.KINDE_REGISTER_ORG_CODE?.trim();
  const { given_name, family_name } = splitDisplayName(displayName);

  const payload: Record<string, unknown> = {
    identities: [{ type: "email", details: { email: email.trim().toLowerCase() } }],
    given_name,
    family_name: family_name || undefined,
  };
  if (orgCode) {
    payload.organization_code = orgCode;
  }

  const res = await fetch(`${issuer}/api/v1/user`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${m2mToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    return {
      ok: false,
      status: res.status >= 400 && res.status < 600 ? res.status : 502,
      message: "Could not create account.",
      detail: raw.slice(0, 400),
    };
  }

  let json: unknown;
  try {
    json = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return { ok: false, status: 502, message: "Invalid response from identity server." };
  }

  const obj = json as Record<string, unknown>;
  const userId =
    (typeof obj.id === "string" && obj.id) ||
    (typeof (obj.user as Record<string, unknown> | undefined)?.id === "string"
      ? String((obj.user as Record<string, unknown>).id)
      : "") ||
    (Array.isArray(obj.users) && obj.users[0] && typeof (obj.users[0] as { id?: string }).id === "string"
      ? String((obj.users[0] as { id: string }).id)
      : "");

  if (!userId) {
    console.warn("[auth] Kinde create user: missing id in response:", raw.slice(0, 300));
    return { ok: false, status: 502, message: "Account created but user id was not returned." };
  }

  return { ok: true, userId };
}

async function kindeManagementSetPassword(
  m2mToken: string,
  userId: string,
  plainPassword: string,
): Promise<{ ok: true } | { ok: false; status: number; message: string; detail?: string }> {
  const issuer = getKindeIssuerBase();
  const hashed_password = await bcrypt.hash(plainPassword, 12);
  const res = await fetch(`${issuer}/api/v1/users/${encodeURIComponent(userId)}/password`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${m2mToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      hashed_password,
      hashing_method: "bcrypt",
      is_temporary_password: false,
    }),
  });
  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    return {
      ok: false,
      status: res.status >= 400 && res.status < 600 ? res.status : 502,
      message: "Could not set account password.",
      detail: raw.slice(0, 400),
    };
  }
  return { ok: true };
}

async function kindeManagementFindUserIdByEmail(
  m2mToken: string,
  emailLower: string,
): Promise<
  { ok: true; userId: string } | { ok: false; notFound: true } | { ok: false; status: number; detail: string }
> {
  const issuer = getKindeIssuerBase();
  const q = encodeURIComponent(emailLower.trim().toLowerCase());
  const res = await fetch(`${issuer}/api/v1/search/users?query=${q}`, {
    headers: {
      Authorization: `Bearer ${m2mToken}`,
      Accept: "application/json",
    },
  });
  const raw = await res.text().catch(() => "");
  if (!res.ok) {
    return { ok: false, status: res.status, detail: raw.slice(0, 400) };
  }
  let parsed: unknown;
  try {
    parsed = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    return { ok: false, status: 502, detail: "Invalid JSON from Kinde user search." };
  }
  const want = emailLower.trim().toLowerCase();
  const obj = parsed as { results?: unknown };
  const rows = Array.isArray(obj.results) ? obj.results : [];
  for (const row of rows) {
    const r = row as { id?: string; email?: string };
    if (
      typeof r.id === "string" &&
      r.id.length > 0 &&
      typeof r.email === "string" &&
      r.email.trim().toLowerCase() === want
    ) {
      return { ok: true, userId: r.id };
    }
  }
  return { ok: false, notFound: true };
}

async function kindeManagementRequestPasswordResetFlag(
  m2mToken: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; status: number; detail: string }> {
  const issuer = getKindeIssuerBase();
  const res = await fetch(`${issuer}/api/v1/users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${m2mToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ is_password_reset_requested: true }),
  });
  const raw = await res.text().catch(() => "");
  if (res.ok) {
    return { ok: true };
  }
  return { ok: false, status: res.status, detail: raw.slice(0, 500) };
}

async function kindeManagementDeleteUser(
  m2mToken: string,
  kindeUserId: string,
): Promise<{ ok: true } | { ok: false; status: number; detail: string }> {
  const issuer = getKindeIssuerBase();
  const res = await fetch(`${issuer}/api/v1/users/${encodeURIComponent(kindeUserId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${m2mToken}`,
      Accept: "application/json",
    },
  });
  const raw = await res.text().catch(() => "");
  if (res.ok || res.status === 204 || res.status === 404) {
    return { ok: true };
  }
  return { ok: false, status: res.status, detail: raw.slice(0, 500) };
}

/**
 * Removes the end-user from Kinde (frees email for re-registration). Requires the same M2M app as
 * POST /api/auth/register, with Management API permission to delete users.
 */
export async function deleteMedvbaKindeIdentityUser(kindeUserId: string): Promise<
  | { ok: true }
  | { ok: false; code: "missing_m2m" | "m2m_token_error" | "kinde_delete_failed"; detail?: string }
> {
  const trimmed = kindeUserId.trim();
  if (!trimmed) {
    return { ok: false, code: "kinde_delete_failed", detail: "Missing Kinde user id." };
  }

  const m2mRes = await kindeManagementAccessToken();
  if (!m2mRes.ok) {
    if (m2mRes.code === "missing_env") {
      return {
        ok: false,
        code: "missing_m2m",
        detail: "KINDE_M2M_CLIENT_ID / KINDE_M2M_CLIENT_SECRET not set on the API server.",
      };
    }
    return { ok: false, code: "m2m_token_error", detail: m2mRes.detail };
  }

  const del = await kindeManagementDeleteUser(m2mRes.token, trimmed);
  if (!del.ok) {
    return {
      ok: false,
      code: "kinde_delete_failed",
      detail: `HTTP ${del.status} ${del.detail}`,
    };
  }
  return { ok: true };
}

export function registerAuthSessionRoutes(app: Hono) {
  app.post("/api/auth/register", async (c) => {
    try {
      const body = (await c.req.json().catch(() => null)) as {
        email?: string;
        password?: string;
        name?: string;
      } | null;
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      const password = typeof body?.password === "string" ? body.password : "";
      const name = typeof body?.name === "string" ? body.name.trim() : "";

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return c.json({ error: "A valid email is required." }, 400);
      }
      if (password.length < 8) {
        return c.json({ error: "Password must be at least 8 characters." }, 400);
      }
      if (!name || name.length < 1) {
        return c.json({ error: "Name is required." }, 400);
      }

      const m2mRes = await kindeManagementAccessToken();
      if (!m2mRes.ok) {
        if (m2mRes.code === "missing_env") {
          return c.json(
            {
              error:
                "Registration is not configured. Set KINDE_M2M_CLIENT_ID and KINDE_M2M_CLIENT_SECRET on the API server (Railway), redeploy, and authorize the M2M app for the Kinde Management API.",
            },
            503,
          );
        }
        return c.json(
          {
            error:
              "Kinde M2M login failed. In Kinde: open the Machine to machine app → APIs → authorize Kinde Management API (create/read users, set password). Check KINDE_ISSUER_URL matches your tenant. Optional: set KINDE_MANAGEMENT_AUDIENCE if your tenant uses a custom audience.",
            detail: m2mRes.detail,
          },
          503,
        );
      }
      const m2m = m2mRes.token;

      const created = await kindeManagementCreateUser(m2m, email, name);
      if (!created.ok) {
        const dup =
          created.status === 409 ||
          (created.detail &&
            /already exists|duplicate|unique|409|user.*exist/i.test(created.detail));
        if (dup) {
          return c.json({ error: "An account with this email already exists." }, 409);
        }
        console.warn("[auth] register create user:", created.status, created.detail);
        return c.json(
          { error: created.message, ...(created.detail ? { detail: created.detail } : {}) },
          created.status >= 400 && created.status < 600 ? (created.status as 400) : 502,
        );
      }

      const pwdSet = await kindeManagementSetPassword(m2m, created.userId, password);
      if (!pwdSet.ok) {
        console.error("[auth] register set password failed:", pwdSet.detail);
        return c.json(
          { error: pwdSet.message, ...(pwdSet.detail ? { detail: pwdSet.detail } : {}) },
          pwdSet.status >= 400 && pwdSet.status < 600 ? (pwdSet.status as 400) : 502,
        );
      }

      const kindeTokensRes = await kindePasswordToken(email, password);
      if (!kindeTokensRes.ok) {
        if (kindeTokensRes.code === "missing_env") {
          return c.json(
            {
              error:
                "Account was created but automatic sign-in is not configured. Set KINDE_ISSUER_URL, KINDE_CLIENT_ID, and KINDE_CLIENT_SECRET on the API server (same native Kinde app as the mobile client).",
            },
            503,
          );
        }
        return c.json(
          {
            error:
              "Account was created but sign-in failed. If email verification is required in Kinde, complete verification from your inbox, then try logging in. Otherwise check the detail below (e.g. password grant disabled in Kinde).",
            detail: kindeTokensRes.detail,
          },
          401,
        );
      }
      const kindeTokens = kindeTokensRes.tokens;

      const out = await sessionFromKindeAccessToken(kindeTokens.access_token);
      if (!out.ok) {
        return c.json({ error: out.message, detail: out.detail }, out.status as 401);
      }

      return c.json({
        ...out.body,
        ...(typeof kindeTokens.refresh_token === "string" && kindeTokens.refresh_token.length > 0
          ? { refresh_token: kindeTokens.refresh_token }
          : {}),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[auth] /api/auth/register:", msg);
      return c.json({ error: msg }, 500);
    }
  });

  /**
   * Self-service password reset: asks Kinde to email reset instructions for the user (no in-browser password step).
   * Requires the same M2M app as registration, with Management API permission to read + update users.
   * Always returns 200 for a valid email shape to avoid account enumeration.
   */
  app.post("/api/auth/request-password-reset", async (c) => {
    try {
      const body = (await c.req.json().catch(() => null)) as { email?: string } | null;
      const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return c.json({ error: "A valid email is required." }, 400);
      }

      const m2mRes = await kindeManagementAccessToken();
      if (!m2mRes.ok) {
        if (m2mRes.code === "missing_env") {
          console.warn("[auth] request-password-reset: M2M not configured");
        } else {
          console.warn("[auth] request-password-reset: M2M token failed:", m2mRes.detail);
        }
        return c.json({ ok: true });
      }

      const found = await kindeManagementFindUserIdByEmail(m2mRes.token, email);
      if (!found.ok) {
        if ("notFound" in found && found.notFound) {
          return c.json({ ok: true });
        }
        console.warn("[auth] request-password-reset: user search failed:", found.detail);
        return c.json({ ok: true });
      }

      const flagged = await kindeManagementRequestPasswordResetFlag(m2mRes.token, found.userId);
      if (!flagged.ok) {
        console.warn(
          "[auth] request-password-reset: PATCH user failed:",
          flagged.status,
          flagged.detail.slice(0, 400),
        );
      }
      return c.json({ ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[auth] /api/auth/request-password-reset:", msg);
      return c.json({ ok: true });
    }
  });

  app.post("/api/auth/session/refresh", async (c) => {
    try {
      const body = (await c.req.json().catch(() => null)) as { refresh_token?: string } | null;
      const refreshToken = typeof body?.refresh_token === "string" ? body.refresh_token.trim() : "";
      if (!refreshToken) {
        return c.json({ error: "refresh_token is required." }, 400);
      }

      const kindeAccess = await kindeRefreshAccessToken(refreshToken);
      if (!kindeAccess) {
        return c.json(
          {
            error:
              "Token refresh failed. Check KINDE_ISSUER_URL, KINDE_CLIENT_ID, KINDE_CLIENT_SECRET, or sign in again.",
          },
          401,
        );
      }

      const out = await sessionFromKindeAccessToken(kindeAccess.access_token);
      if (!out.ok) {
        return c.json({ error: out.message, detail: out.detail }, out.status as 401);
      }

      const nextRefresh = kindeAccess.refresh_token ?? refreshToken;
      return c.json({
        ...out.body,
        refresh_token: nextRefresh,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[auth] /api/auth/session/refresh:", msg);
      return c.json({ error: msg }, 500);
    }
  });

  app.post("/api/auth/session", async (c) => {
    try {
      const authHeader = c.req.header("authorization");
      const bearer = authHeader?.replace(/^Bearer\s+/i, "").trim();
      if (bearer) {
        const out = await sessionFromKindeAccessToken(bearer);
        if (!out.ok) {
          return c.json({ error: out.message, detail: out.detail }, out.status as 401);
        }
        return c.json(out.body);
      }

      const ct = c.req.header("content-type") || "";
      if (ct.includes("application/json")) {
        const body = (await c.req.json().catch(() => null)) as {
          email?: string;
          password?: string;
        } | null;
        const email = body?.email?.trim();
        const password = body?.password;
        if (!email || typeof password !== "string" || !password) {
          return c.json({ error: "email and password are required." }, 400);
        }

        const kindeTokensRes = await kindePasswordToken(email, password);
        if (!kindeTokensRes.ok) {
          if (kindeTokensRes.code === "missing_env") {
            return c.json(
              {
                error:
                  "Email/password login is not configured on the API server. Set KINDE_ISSUER_URL, KINDE_CLIENT_ID, and KINDE_CLIENT_SECRET on Railway (same native Kinde application as EXPO_PUBLIC_KINDE_CLIENT_ID), then redeploy.",
              },
              503,
            );
          }
          const st = kindeTokensRes.upstreamStatus;
          const kinde5xx =
            typeof st === "number" && st >= 500 && st <= 599
              ? "Kinde returned a server error (5xx) at the token URL — usually a temporary outage or gateway issue on Kinde’s side, not wrong email/password. Retry in a few minutes; check https://status.kinde.com/ ; try another network (Wi‑Fi vs mobile data)."
              : "In Kinde: Applications → your native app → enable Password / Resource Owner grant. Turn on Email + password for that app. If KINDE_AUDIENCE is set on Railway, remove it unless your Kinde app requires a specific audience for password grant. Ensure the user email is verified if your tenant requires it.";
          return c.json(
            {
              error: "Email/password login failed.",
              detail: kindeTokensRes.detail,
              hint: kinde5xx,
            },
            401,
          );
        }
        const kindeTokens = kindeTokensRes.tokens;

        const out = await sessionFromKindeAccessToken(kindeTokens.access_token);
        if (!out.ok) {
          return c.json({ error: out.message, detail: out.detail }, out.status as 401);
        }
        return c.json({
          ...out.body,
          ...(typeof kindeTokens.refresh_token === "string" && kindeTokens.refresh_token.length > 0
            ? { refresh_token: kindeTokens.refresh_token }
            : {}),
        });
      }

      return c.json(
        {
          error:
            "Send Authorization: Bearer <identity_access_token> or JSON { \"email\", \"password\" } for server-side email login.",
        },
        400,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[auth] /api/auth/session:", msg);
      return c.json({ error: msg }, 500);
    }
  });
}
