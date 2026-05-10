import type { Hono } from "hono";
import { mintSupabaseAccessJwt } from "./mint-supabase-jwt";
import { fetchKindeUserProfile } from "./kinde-user-profile";
import { getSupabaseAdmin, resolveOrCreateProfileId, type KindeUserProfile } from "./resolve-profile";

async function kindePasswordToken(email: string, password: string): Promise<string | null> {
  const issuer = (process.env.KINDE_ISSUER_URL || "").trim().replace(/\/+$/, "");
  const clientId = process.env.KINDE_CLIENT_ID?.trim();
  const clientSecret = process.env.KINDE_CLIENT_SECRET?.trim();
  if (!issuer || !clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    grant_type: "password",
    username: email.trim(),
    password,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const aud = process.env.KINDE_AUDIENCE?.trim();
  if (aud) {
    body.set("audience", aud);
  }

  const res = await fetch(`${issuer}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    console.warn("[auth] Kinde password token failed:", res.status, t.slice(0, 200));
    return null;
  }
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

async function sessionFromKindeAccessToken(kindeAccessToken: string) {
  const profileRes = await fetchKindeUserProfile(kindeAccessToken);
  if (!profileRes.ok) {
    const t = await profileRes.text().catch(() => "");
    return { ok: false as const, status: 401, message: "Invalid or expired Kinde token.", detail: t.slice(0, 200) };
  }
  const kindeUser = (await profileRes.json()) as KindeUserProfile;
  if (!kindeUser?.id) {
    return { ok: false as const, status: 401, message: "Kinde user profile missing id." };
  }

  const admin = getSupabaseAdmin();
  const { profileId } = await resolveOrCreateProfileId(admin, kindeUser);
  const email = (kindeUser.preferred_email || kindeUser.email || "").trim() || null;
  const access_token = await mintSupabaseAccessJwt({
    kindeSub: kindeUser.id,
    profileId,
    email,
  });

  return {
    ok: true as const,
    body: {
      access_token,
      expires_in: 900,
      token_type: "bearer",
      profile_id: profileId,
    },
  };
}

export function registerAuthSessionRoutes(app: Hono) {
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
      if (!ct.includes("application/json")) {
        return c.json(
          { error: "Send Authorization: Bearer <kinde_access_token> or JSON { email, password }." },
          400,
        );
      }

      const body = await c.req.json().catch(() => null) as {
        email?: string;
        password?: string;
      } | null;
      const email = body?.email?.trim();
      const password = body?.password;
      if (!email || !password) {
        return c.json({ error: "email and password are required." }, 400);
      }

      const kindeAccess = await kindePasswordToken(email, password);
      if (!kindeAccess) {
        return c.json(
          {
            error:
              "Email/password login failed. Enable the password grant for this Kinde application, or use the in-app Kinde login button.",
          },
          401,
        );
      }

      const out = await sessionFromKindeAccessToken(kindeAccess);
      if (!out.ok) {
        return c.json({ error: out.message, detail: out.detail }, out.status as 401);
      }
      return c.json(out.body);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[auth] /api/auth/session:", msg);
      return c.json({ error: msg }, 500);
    }
  });
}
