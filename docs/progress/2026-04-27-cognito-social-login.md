# Cognito Social Login — Implementation Progress

**Date:** 2026-04-27  
**Branch:** main  
**Status:** Complete (code changes done; AWS infrastructure setup pending)

---

## Objective

Replace the scattered multi-provider social login setup (Supabase Auth + native Google/Apple/Facebook SDKs) with a **single entry point** via AWS Cognito. All auth routes through Cognito when configured; Supabase is retained for data access only.

---

## Research Summary (Opus agent)

Three options were evaluated:

| Option | Description | Verdict |
|---|---|---|
| 1 | Replace Supabase Auth entirely with Cognito User Pools | Best long-term; chosen as target |
| 2 | Cognito as federated layer, Supabase data via custom JWT exchange | Good stepping stone |
| 3 | Keep current structure, standardise entry point | Minimal benefit |

**Chosen approach:** Option 2 as Phase 1 (feature-flagged), migrating toward Option 1. Cognito is enabled via env vars; the codebase falls back to Supabase Auth when they are absent — zero breaking change.

**Key discovery during research:** `backend/trpc/subscription.ts` had a critical bug where `ctx.token` (the raw JWT string) was used as `userId` to query `profiles.id`. This would never match a UUID and made the subscription/AI-limit endpoints non-functional.

---

## Files Changed

| File | Change |
|---|---|
| `backend/trpc/create-context.ts` | Full rewrite — dual JWT verification (Cognito JWKS + Supabase fallback), exposes `ctx.userId` |
| `backend/trpc/account.ts` | Use `ctx.userId`; delete user from both Supabase Auth and Cognito |
| `backend/trpc/subscription.ts` | **Bug fix** — replace `ctx.token` with `ctx.userId` in both procedures |
| `lib/cognito.ts` | **New file** — full Cognito client (REST API, no new deps) |
| `lib/trpc.ts` | Prefer Cognito ID token in Authorization header; fallback to Supabase session |
| `providers/AuthProvider.tsx` | Feature-flagged refactor — all auth routes through Cognito when configured |
| `.env.example` | Added Cognito client + backend variables with setup checklist |

---

## Architecture

### Before

```
App → Supabase Auth (email/password)
App → Google native SDK → Supabase signInWithIdToken
App → Apple native SDK → Supabase signInWithIdToken
App → Supabase OAuth redirect (Facebook)
Backend → supabaseAdmin.auth.getUser(token)  ← JWT never actually verified
```

### After

```
App → Cognito REST API (email/password)          ← USER_PASSWORD_AUTH flow
App → Cognito Hosted UI PKCE (Google)            ← expo-web-browser
App → Cognito Hosted UI PKCE (Facebook)          ← expo-web-browser
App → Cognito Hosted UI PKCE (Apple)             ← expo-web-browser
Backend → JWKS verification (Cognito iss)        ← jose library (already installed)
       → Supabase getUser fallback (legacy iss)  ← transition period
ctx.userId = verified sub/UUID in all procedures
```

When `EXPO_PUBLIC_COGNITO_USER_POOL_ID` is **not** set, every path falls back to the original Supabase Auth flows unchanged.

---

## New File: `lib/cognito.ts`

Zero new npm dependencies — uses:
- Cognito REST API directly (`https://cognito-idp.{region}.amazonaws.com/`)
- `expo-web-browser` (already installed) for Hosted UI PKCE social flows
- `expo-secure-store` (already installed) for token storage
- `crypto.subtle` (available in RN 0.72+) for PKCE SHA-256 challenge

### Exports

| Export | Description |
|---|---|
| `isCognitoConfigured()` | Returns true when all 3 env vars are set |
| `cognitoSignIn(email, password)` | Email/password → `CognitoSession` |
| `cognitoSignUp(email, password, name)` | Sign-up (requires email verification) |
| `cognitoConfirmSignUp(email, code)` | Confirm email verification code |
| `cognitoSignOut()` | GlobalSignOut + clear SecureStore |
| `cognitoForgotPassword(email)` | Initiate password reset |
| `cognitoConfirmForgotPassword(email, code, newPassword)` | Complete password reset |
| `getCognitoSession()` | Load session from storage, auto-refresh if expiring |
| `getCognitoIdToken()` | Get ID token string for Bearer header |
| `cognitoSocialSignIn(provider)` | Hosted UI PKCE for `'Google' \| 'Facebook' \| 'SignInWithApple'` |
| `cognitoExchangeCode(code, verifier)` | Exchange OAuth code for tokens |

---

## Backend: JWT Verification

`backend/trpc/create-context.ts` now supports two JWT issuers simultaneously:

```
JWT received → peek iss claim
  iss contains "cognito-idp" → verify via JWKS → extract sub → ctx.userId
  otherwise                  → verify via Supabase Admin getUser → ctx.userId
```

JWKS URL: `https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json`

The JWKS `RemoteJWKSet` instance is cached per process to avoid redundant fetches.

---

## Bug Fixed

**`backend/trpc/subscription.ts`** — both `validateAiQuestion` and `getSubscriptionStatus` used `ctx.token` (raw JWT string) as the `userId` when querying `profiles.id`. This would never match a UUID, so:
- Premium users could not be detected (always treated as free tier)
- AI usage records were never created or read
- Users could bypass the daily AI question limit

Fixed by using `ctx.userId` (resolved by `protectedProcedure`).

---

## Required: AWS Setup (not automated)

The code is ready; the following AWS Console steps are still needed before enabling Cognito in production:

### 1. Create Cognito User Pool
- Region: pick one close to your Railway backend
- Sign-in options: email
- Password policy: match current Supabase policy
- Enable `ALLOW_USER_PASSWORD_AUTH` + `ALLOW_REFRESH_TOKEN_AUTH` on the App Client

### 2. Configure Social Identity Providers
- **Google**: use existing `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` OAuth credentials
- **Apple**: use existing Apple Service ID (`com.devaieood.medvba.auth`), Team ID, Key ID, private key
- **Facebook**: use existing `EXPO_PUBLIC_FACEBOOK_APP_ID`

### 3. Configure App Client
- Type: Public client (no secret)
- Callback URL: `medvba://auth/cognito-callback`
- Enable Hosted UI
- Note the Cognito domain (e.g. `medvba.auth.us-east-1.amazoncognito.com`)

### 4. Database Migration (Supabase)
```sql
-- Required before Cognito users can create profiles.
-- Cognito sub values are UUIDs but are not in auth.users.
ALTER TABLE profiles DROP CONSTRAINT profiles_id_fkey;
```

### 5. Environment Variables

**Client (`.env` / EAS Secrets):**
```
EXPO_PUBLIC_COGNITO_REGION=us-east-1
EXPO_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
EXPO_PUBLIC_COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_COGNITO_DOMAIN=medvba.auth.us-east-1.amazoncognito.com
```

**Backend (Railway):**
```
COGNITO_REGION=us-east-1
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
```

---

## Migration Path for Existing Users

Existing Supabase-Auth users continue to work unchanged during the transition:
- Their tokens have `iss: https://<project>.supabase.co/auth/v1` → routed to Supabase verifier
- Once a user re-authenticates via Cognito, they get a Cognito token → routed to JWKS verifier
- A user migration Lambda (`UserMigration_Authentication`) can be added to Cognito to transparently migrate existing Supabase credentials on first Cognito login — not yet implemented

### Outstanding work for full migration
- [ ] Cognito `UserMigration_Authentication` Lambda — verify against Supabase on first Cognito login
- [ ] `profiles.cognito_sub` column + mapping table for users who existed in both systems
- [ ] Remove `EXPO_PUBLIC_SUPABASE_ANON_KEY` from client once all users have migrated
- [ ] Remove Supabase Auth fallback from `create-context.ts`
- [ ] Update unit tests in `providers/__tests__/AuthProvider.test.tsx` to mock Cognito

---

## Risks & Notes

- **Apple Sign-In on iOS via Hosted UI**: Cognito Hosted UI redirects to a web view for Apple Sign-In. Apple requires that if any social login is offered, Apple Sign-In must be present and functional. Test this flow thoroughly before App Store submission.
- **Facebook OIDC**: Facebook does not issue standard OIDC `id_token`s. Cognito Hosted UI handles this internally — the app never touches Facebook tokens directly in the Cognito path.
- **Token expiry**: Cognito access/ID tokens expire after 1 hour by default. `getCognitoSession()` auto-refreshes when < 60 seconds remain. Refresh tokens last 30 days by default.
- **`signInWithBiometric`**: relies on a persisted session being present. Works for both Supabase and Cognito sessions since both store to SecureStore.
