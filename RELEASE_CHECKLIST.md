# MEDVBA Release Checklist

Reusable runbook for production releases with Bun + Expo EAS.

**App Store (iOS) first:** [`docs/PRE_LAUNCH_CHECKLIST_APP_STORE.md`](docs/PRE_LAUNCH_CHECKLIST_APP_STORE.md) · metadata [`docs/app-store-metadata-en.md`](docs/app-store-metadata-en.md)

**Google Play (Android):** [`docs/PRE_LAUNCH_CHECKLIST_GOOGLE_PLAY.md`](docs/PRE_LAUNCH_CHECKLIST_GOOGLE_PLAY.md)

---

## Release Metadata

- [ ] Release date:
- [ ] Owner:
- [ ] Branch:
- [ ] Git commit:
- [ ] Version (`app.config.ts` -> `version`):
- [ ] Android `versionCode`:
- [ ] iOS `buildNumber`:
- [ ] EAS profile: `production`

---

## 1) Local Preflight

Run from repo root:

```bash
cd "C:\Users\octav\Desktop\MEDVBA3\medvba-android"
git status
git branch --show-current
bun install --frozen-lockfile
npx expo-doctor
bunx tsc --noEmit
bun run test:ci
```

- [ ] On correct branch
- [ ] Working tree is clean (or intended changes only)
- [ ] `bun install --frozen-lockfile` passed
- [ ] `expo-doctor` reports 0 failed
- [ ] Typecheck passed
- [ ] Tests passed (or exceptions documented)

---

## 2) Version Bump

Update `app.config.ts`:

- [ ] `version` bumped (semver)
- [ ] `android.versionCode` incremented (+1 vs Play)
- [ ] `ios.buildNumber` incremented/aligned
- [ ] `buildType: app-bundle` still set for production

Verify:

```bash
git diff -- "app.config.ts"
```

---

## 3) Environment Verification

## 3.1 Backend (Railway)

- [ ] `KINDE_ISSUER_URL` (same subdomain as Kinde; no trailing slash issues — backend trims)
- [ ] `KINDE_CLIENT_ID`
- [ ] `KINDE_CLIENT_SECRET` (used for Kinde token exchange; also **JWT signing fallback** if `SUPABASE_JWT_SIGNING_SECRET` unset)
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `SUPABASE_JWT_SIGNING_SECRET` (**recommended**) — must be **identical** to Supabase Dashboard → **Project Settings → API → JWT Secret** (HS256). If omitted, backend uses `KINDE_CLIENT_SECRET`; then that same value must be the Supabase JWT secret (Kinde+Supabase HS256 pattern).
- [ ] `CORS_ALLOWED_ORIGINS` if you call the API from web origins beyond defaults
- [ ] AI vars if tutor is used: `AI_API_KEY` or `OPENAI_API_KEY`, plus `AI_BASE_URL` / `AI_MODEL` / `AI_PROVIDER` as needed
- [ ] API domain/base URL vars are correct for your deployment

After any env change: **redeploy** the Railway service.

## 3.2 Expo/EAS (Production env)

- [ ] `EXPO_PUBLIC_KINDE_ISSUER_URL`
- [ ] `EXPO_PUBLIC_KINDE_CLIENT_ID`
- [ ] `EXPO_PUBLIC_API_BASE_URL` (HTTPS in production; required — `getApiBaseUrl()` throws if missing)
- [ ] `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` (client PostgREST + minted JWT via `lib/supabase.ts`)
- [ ] `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` (and iOS key if you ship iOS)
- [ ] `EXPO_PUBLIC_PAYWALL_ENABLED` (`true` / `false` as intended)
- [ ] Optional: `EXPO_PUBLIC_SENTRY_DSN`, or legacy `EXPO_PUBLIC_RORK_API_BASE_URL` instead of `EXPO_PUBLIC_API_BASE_URL`

Confirm `app.config.ts` passes these into `extra` (EAS injects `process.env` at build time).

## 3.3 Auth/JWT Alignment (Supabase RLS)

Backend mints HS256 JWTs in `backend/auth/mint-supabase-jwt.ts`. PostgREST + RLS in `supabase/migrations/005_kinde_jwt_rls.sql` expect:

| Claim / field | Expected |
|-----------------|----------|
| `sub` | Kinde user id (subject) |
| `profile_id` | UUID of `public.profiles.id` |
| `role` | `authenticated` |
| `aud` | `authenticated` |
| `exp` / `iat` | set by signer (app uses **15m** lifetime — client must re-exchange via `/api/auth/session`) |

**Supabase Dashboard:** Project Settings → API → **JWT Secret** must match the secret used by Railway (`SUPABASE_JWT_SIGNING_SECRET` or `KINDE_CLIENT_SECRET`).

**Quick verify:** after login, decode the minted `access_token` from `/api/auth/session` (e.g. `bun run release:decode-jwt -- '<paste_token>'`) and confirm `sub`, `profile_id`, `role`.

## 3.4 Kinde (callbacks, logout, social)

App scheme (Expo): **`medvba`** — see `scheme` in `app.config.ts`.

- [ ] **Callback URLs** in Kinde include at least: `medvba://*` (or the exact redirect URIs `@kinde/expo` uses for your SDK version — often `medvba://<kinde-default-path>`). Add any **web** callback URL if you use web sign-in.
- [ ] **Allowed logout redirect URLs** include the post-logout destination you use (e.g. `medvba://` or your hosted URL).
- [ ] **Google / Facebook / Apple** enabled in Kinde with valid client IDs/secrets; Apple Sign In matches iOS bundle if used.
- [ ] Email sign-up/sign-in: **hosted Kinde** in app — **Create account with email** → `kinde.register()`; **Sign in with email** → `kinde.login()`; social → `kinde.login` with connection ID. Enable **email registration** under Authentication → Sign-up and sign-in.
- [ ] **Email UX (Kinde):** If the hosted page asks for a **password**, that is the user's **Kinde / MEDVBA account** password (created in that flow), **not** their Gmail password unless they use Google sign-in. For **email code (OTP)** instead, enable the **Email + code** (passwordless) authentication method in Kinde and set `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID` to **that** connection’s ID (see [Kinde passwordless](https://docs.kinde.com/authenticate/authentication-methods/passwordless-authentication/)).
- [ ] Password grant on server (optional): only for forgot-password API / legacy; Railway `KINDE_CLIENT_SECRET` if you keep `POST /api/auth/session` JSON `{ email, password }`.
- [ ] Backend accepts `Authorization: Bearer <kinde_access_token>` on `POST /api/auth/session` after hosted OAuth.

## 3.5 Post-deploy smoke (see `docs/ANDROID_RELEASE_SMOKE_TEST.md`)

Use internal testing build + staging backend as needed before full rollout.

---

## 4) Optional: Commit Release Prep

```bash
git add .
git commit -m "chore(release): prepare Android release vX.Y.Z"
```

- [ ] Release prep committed

---

## 5) Build Android on EAS

```bash
cd "C:\Users\octav\Desktop\MEDVBA3\medvba-android"
bun install --frozen-lockfile
npx expo-doctor
npx eas-cli build --platform android --profile production --non-interactive --no-wait
```

- [ ] EAS build started
- [ ] EAS build finished successfully
- [ ] Build link saved:

---

## 6) Artifacts

When the EAS build finishes, open the build page → **Artifacts**: download **`.aab`**, **`mapping.txt`**, and optionally **`native-debug-symbols.zip`** (same `versionCode` as `app.config.ts`).

- [ ] Downloaded `.aab`
- [ ] Downloaded `mapping.txt` from the same build
- [ ] Confirmed `mapping.txt` matches same `versionCode`

---

## 7) Play Console

- [ ] Uploaded `.aab` to Internal testing
- [ ] Uploaded `mapping.txt` for matching `versionCode`
- [ ] Reviewed release notes
- [ ] Verified permissions and Data safety declarations
- [ ] Promoted rollout (internal -> staged -> production)

---

## 8) Post-Release Smoke Test

Follow **[docs/ANDROID_RELEASE_SMOKE_TEST.md](docs/ANDROID_RELEASE_SMOKE_TEST.md)** for step-by-step checks.

- [ ] Fresh install/update from Play internal track
- [ ] Login works (Kinde/social providers)
- [ ] Logout works
- [ ] Profile read/update works
- [ ] AI usage flow works (increment/limits)
- [ ] Direct chat read/write works
- [ ] Study room visibility works
- [ ] No auth/RLS errors in backend logs
- [ ] Optional: `bun run release:decode-jwt` on session `access_token` — `sub`, `profile_id`, `role`

---

## 9) Rollback Plan (if needed)

- [ ] Note **previous** Railway deployment ID / image tag (or git SHA) before promoting this release
- [ ] Pause rollout in Play Console
- [ ] Redeploy previous Railway backend version if required
- [ ] Keep DB rollback non-destructive; avoid emergency destructive SQL
- [ ] Document incident and mitigation

---

## 10) Final Release Record

- [ ] Final app version:
- [ ] Final Android `versionCode`:
- [ ] EAS build URL:
- [ ] Play release URL:
- [ ] Smoke test evidence:
- [ ] Known issues / follow-ups:

---

## Quick Command Bundle (Happy Path)

After `bun install`, **`postinstall`** removes nested `@kinde/expo` / `expo-auth-session` copies so **`expo-doctor` passes** (SDK 54 vs Kinde’s bundled Expo 51 deps). Do not skip `postinstall` in CI.

```bash
cd "C:\Users\octav\Desktop\MEDVBA3\medvba-android" \
&& bun install --frozen-lockfile \
&& bun run doctor \
&& bunx tsc --noEmit \
&& bun run test:ci \
&& npx eas-cli build --platform android --profile production --non-interactive --no-wait
```

PowerShell (same steps):

```powershell
Set-Location "C:\Users\octav\Desktop\MEDVBA3\medvba-android"
bun install --frozen-lockfile; bun run doctor; bunx tsc --noEmit; bun run test:ci; npx eas-cli build --platform android --profile production --non-interactive --no-wait
```

Or: `bun run release:preflight` then `bun run release:android`.

When the EAS build starts, confirm logs list **all** required env vars (including **`EXPO_PUBLIC_KINDE_*`**). If missing, add them in EAS → Project → Environment variables → **production**.

