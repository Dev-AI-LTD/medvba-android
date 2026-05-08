# MEDVBA Android — Claude Code Guide

## Project Overview

Cross-platform medical anatomy quiz app built with React Native/Expo. Targets medical students with quiz sessions, social study features, an AI tutor, and subscription monetization.

**App store version:** 1.0.20  
**Platform targets:** iOS, Android, Web  
**Bundle identifier:** `com.devaieood.medvba`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81.5, Expo SDK 54 |
| Language | TypeScript 5.9.2 (strict) |
| Routing | Expo Router 6 (file-based, typed routes) |
| Backend | Hono 4 + tRPC 11 (Node.js, Railway) |
| Database | Supabase (PostgreSQL, Auth, Realtime, Storage) |
| Server state | TanStack Query 5 + tRPC React hooks |
| Client state | React Context via `@nkzw/create-context-hook` |
| UI | React Native Paper 5, Lucide icons |
| Auth | Supabase Auth + Google/Apple/Facebook OAuth + Biometric |
| Payments | RevenueCat (`react-native-purchases`) |
| Monitoring | Sentry 7 |
| Testing | Jest (unit), Detox 20 (E2E) |
| Builds | EAS Build (development / internal / production) |
| Package mgr | Bun (primary), npm lock maintained for CI |

---

## Directory Structure

```
app/              Expo Router screens
  (auth)/         Login, signup, onboarding, password reset
  (tabs)/         5 main tabs: Home, Quiz, Social, AI Tutor, Profile
  [screens]/      quiz-session, leaderboard, paywall, settings, etc.
backend/          Hono + tRPC server (Node.js)
  trpc/           Routers: account, subscription, tutor
providers/        React Context: Auth, Quiz, Subscription, Theme, Language
components/       Reusable UI components
lib/              Core utilities and integrations
  supabase.ts     Supabase client
  supabase-hooks.ts  React Query hooks for all Supabase operations
  trpc.ts         tRPC client config
  query-keys.ts   Centralized React Query key factory
  validation.ts   Form validation helpers (returns translated errors)
constants/        Colors, design tokens, subscription constants
locales/          i18n: en, ro, es, pt + question/chapter translations
mocks/            40+ anatomy question files (~79K lines)
supabase/         DB migrations (38+ versions)
supabase_migrations/  Migration output
types/            Shared TypeScript types
```

---

## Development Commands

```bash
# Start development server (tunnel mode for iOS)
npm start

# Start locally (no tunnel)
npm run start:local

# Start backend server
npm run start:backend

# Run tests
npm test

# Lint
npm run lint

# E2E (Android)
npm run e2e:prebuild
npm run e2e:build:android
npm run e2e:test:android
```

---

## Key Conventions

### Context / State
- All React Context providers use `createContextHook` from `@nkzw/create-context-hook`
- Server state lives in TanStack Query; all query keys are defined in `lib/query-keys.ts`
- Zustand is installed but not actively used

### Backend / API
- tRPC procedures in `backend/trpc/` — use `protectedProcedure` for authenticated endpoints
- Authentication: Bearer token from Supabase session in `Authorization` header
- Backend env: `EXPO_PUBLIC_API_BASE_URL` for client, separate service-role key for admin ops

### Database
- Schema changes require a new migration in `supabase_migrations/`
- Admin operations use Supabase service role key (server-side only)

### i18n
- 5 languages: English, Romanian, Spanish, Portuguese + more
- Translation keys in `locales/en.ts` (source of truth)
- Question/chapter translations are separate large files
- Validation errors must use translated messages from `lib/validation.ts`

### Security
- Production console logs strip PII (emails, JWTs, Supabase keys) — see `app/_layout.tsx`
- Sensitive credentials stored via `expo-secure-store` (iOS Keychain / Android Keystore)
- Never commit `.env` — use `.env.example` as template

### Subscriptions
- Free tier: daily limits tracked in AsyncStorage with date keys
- Premium: RevenueCat entitlement check via `SubscriptionProvider`
- Paywall route: `app/paywall.tsx`

---

## Deep Link Scheme

| Route | Purpose |
|---|---|
| `medvba://auth/callback` | OAuth redirect |
| `medvba://reset-password` | Password reset |
| `medvba://profile/[userId]` | User profiles |

---

## Build Profiles (EAS)

| Profile | Format | Distribution |
|---|---|---|
| development | APK | Internal (dev client) |
| internal | App Bundle | Internal beta |
| production | App Bundle | Google Play |

Android: minSdk 24, compileSdk/targetSdk 35, R8 + resource shrinking enabled.

---

## Environment Variables

See `.env.example` for all required variables. Key groups:

- `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_REVENUECAT_*` (iOS & Android keys)
- `EXPO_PUBLIC_GOOGLE_*_CLIENT_ID` (web, iOS, Android)
- `EXPO_PUBLIC_FACEBOOK_APP_ID`
- `EXPO_PUBLIC_API_BASE_URL` — backend URL
- `AI_API_KEY` / `OPENAI_API_KEY` — server-side only

---

## Testing

- **Unit/integration:** Jest with React Native preset; mocks in `jest.setup.js`
- **E2E:** Detox 20 targeting Android emulator (`DETOX_AVD_NAME`) or device (`DETOX_ADB_NAME`)
- Coverage collected from `providers/**` and `lib/**`
