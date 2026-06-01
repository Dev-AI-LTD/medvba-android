# Authentication architecture (MEDVBA)

**Sign-in stays on Kinde.** This document is the source of truth for how auth works in the repo. Do not migrate to Supabase Auth SDK without an explicit product decision.

## Summary

| Layer | Role |
|-------|------|
| **Kinde** (`@kinde/expo`) | Identity provider: Sign in with **Apple** (iOS), **Google**, optional **hosted email** (browser PKCE). |
| **Backend** (Hono, Railway) | Exchanges credentials / Kinde tokens → mints **MEDVBA JWT** (HS256, Supabase-compatible). |
| **Supabase** | PostgreSQL + PostgREST with RLS; **not** the primary login UI. Anon key + `Authorization: Bearer <MEDVBA JWT>`. |
| **Client storage** | `expo-secure-store`: MEDVBA access token + Kinde refresh (email/password path). |

## User-facing flows (build 57+)

1. **Apple / Google / Email** — trei butoane pe [`login.tsx`](../app/(auth)/login.tsx); toate folosesc Kinde hosted OAuth (`kinde.login` / `kinde.register`) → `POST /api/auth/session` cu `Authorization: Bearer <kinde_access_token>`.
2. **Fără** câmp email/parolă în app pe TestFlight/App Store.
3. **Email + password (server only)** — `POST /api/auth/session` JSON pentru scripturi/diag (`verify:auth-session`), nu din UI release.

After any successful login, `AuthProvider` applies the MEDVBA JWT, loads/creates `profiles`, and gates navigation via onboarding flags.

## Environment (client)

Set in `.env` / EAS **production** (see `.env.example`):

- `EXPO_PUBLIC_KINDE_ISSUER_URL`, `EXPO_PUBLIC_KINDE_CLIENT_ID`
- `EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID` (required on iOS when Google is offered — App Store 4.8)
- `EXPO_PUBLIC_KINDE_GOOGLE_CONNECTION_ID`
- `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID` (hosted email for reviewers)
- `EXPO_PUBLIC_API_BASE_URL` (same Railway host as session routes)
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` (data API, not login UI)

## Environment (backend — not in app bundle)

- `KINDE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SIGNING_SECRET` (or aligned JWT secret)
- `KINDE_M2M_*` for account deletion and password-reset flows

## Related docs

- [KINDE_IOS_EXPO_SETUP.md](KINDE_IOS_EXPO_SETUP.md) — one native Kinde app, callbacks `medvba://*`
- [APPLE_SIGN_IN_KINDE_SETUP.md](APPLE_SIGN_IN_KINDE_SETUP.md) — Apple Developer + Kinde Apple connection
- [KINDE_EMAIL_PASSWORD.md](KINDE_EMAIL_PASSWORD.md) — hosted email for App Review
- [RAILWAY_KINDE_AUTH.md](RAILWAY_KINDE_AUTH.md) — server env for session routes
- [APPLE_REVIEW_AUTH.md](APPLE_REVIEW_AUTH.md) — reviewer sign-in checklist
- [app-store-metadata-en.md](app-store-metadata-en.md) — Review Notes (Apple / Google / email)

## What this is not

- **Not** `supabase.auth.signInWithPassword` / Supabase OAuth in the app.
- **Not** a reason to remove Sign in with Apple while Google is offered on iOS.
- **Not** PostHog or analytics — optional Sentry only (`EXPO_PUBLIC_SENTRY_DSN`).

Last updated: 2026-05-25.
