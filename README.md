# MEDVBA

Native mobile app for medical exam preparation (quizzes, progress, study features, AI tutor integrations). Built with **Expo** and **React Native**.

**Product name:** MEDVBA  
**Legal entity (in-app Terms / Privacy):** Dev AI LTD  
**Public site / deep link origin:** [https://medvba.app/](https://medvba.app/)

Configuration in this repo matches `app.config.ts` (e.g. `name`, `slug`, `scheme`, bundle IDs, Expo `extra`).

**Current stack** (see `package.json` for exact ranges): **Expo SDK 54**, **React Native 0.81**, **React 19**. Package manager: **Bun** (`bun.lock`).

**README last updated:** 12 May 2026.

---

## License and copyright

This repository is **proprietary**. See [`LICENSE`](./LICENSE).

Copyright © 2026 **Dev AI LTD**. All rights reserved.

---

## Requirements

- **Node.js** ≥ 20 (see `package.json` → `engines`)
- **Bun** (package manager and scripts; commit `bun.lock`)

---

## Setup

```bash
git clone <repository-url>
cd medvba-android
bun install
```

Copy environment variables from `.env.example` into `.env` / `.env.local` and fill values for **Kinde**, Supabase, API base URL, RevenueCat, etc. The app reads public keys via `EXPO_PUBLIC_*` as wired in `app.config.ts`.

## Authentication (Kinde — do not replace with Supabase Auth SDK)

Sign-in is implemented with **Kinde** and stays that way:

- **iOS:** Sign in with Apple + Google (+ optional hosted email for review).
- **Android:** Google (+ optional hosted email).
- **Session:** backend on Railway mints a **MEDVBA JWT**; the app stores it in **SecureStore** and calls Supabase PostgREST / tRPC with `Authorization: Bearer …`.
- **Supabase** holds profiles, quiz progress, chat, etc. — it is **not** the login screen provider.

Canonical overview: [docs/AUTH_ARCHITECTURE.md](docs/AUTH_ARCHITECTURE.md).

**Kinde setup (one native app for iOS + Android, Expo):** [docs/KINDE_IOS_EXPO_SETUP.md](docs/KINDE_IOS_EXPO_SETUP.md) · verify: `npm run check:kinde-ios` · Apple: [docs/APPLE_SIGN_IN_KINDE_SETUP.md](docs/APPLE_SIGN_IN_KINDE_SETUP.md) · App Review: [docs/APPLE_REVIEW_AUTH.md](docs/APPLE_REVIEW_AUTH.md).

---

## Run locally (Expo)

Prefer these scripts (standard Expo CLI):

| Script | Purpose |
|--------|---------|
| `bun run start:local` | `npx expo start` — dev client / Expo Go |
| `bun run start:web` | Web preview (`expo start --web`) |
| `bun run start:dev:tunnel` | Dev server with tunnel |

Platform builds:

| Script | Purpose |
|--------|---------|
| `bun run android` | `expo run:android` |
| `bun run ios` | `expo run:ios` |

---

## Tests and typecheck

```bash
bun run test
bunx tsc --noEmit
```

---

## Android production builds (MEDVBA)

Internal checklist for Play / EAS lives in [`.cursor/rules/eas-android-release.mdc`](./.cursor/rules/eas-android-release.mdc) (Bun-only lockfile, `bun run doctor`, versionCode, `mapping.txt`, etc.). **EAS must receive `bun.lock`** (do not list it in `.easignore`); otherwise cloud installs have no lockfile and can diverge from local / break Gradle.

---

## Repository layout (overview)

| Path | Role |
|------|------|
| `app/` | Screens and navigation (Expo Router) |
| `providers/` | React context (auth, language, theme, subscription, …) |
| `locales/` | UI strings (`en`, `ro`, …) |
| `backend/` | tRPC / Hono API used by the app |
| `supabase/` | SQL migrations and Supabase notes |
| `eas.json` | EAS Build profiles |
| `app.config.ts` | Expo app id, version, plugins, `extra` env passthrough |
| `docs/AUTH_ARCHITECTURE.md` | Auth: Kinde + MEDVBA JWT + Supabase (canonical) |
| `docs/presentation-video-teachers/` | Kit video promo profesori (script, shot list, Hunyuan, montaj) |

---

## App identifiers (from `app.config.ts`)

| Field | Value |
|-------|--------|
| Expo `name` | MEDVBA |
| `slug` | medvba |
| `scheme` | medvba |
| iOS bundle id | `com.devaieood.medvba` |
| Android package | `com.devaieood.medvba` |
| `version` | `APP_VERSION` in `app.config.ts` (store / OTA alignment) |
| Expo owner | `devaieood79` |

---

## Batch translation (OpenAI, no Rork SDK)

Structured question translation uses **`lib/llm-generate-object-json.ts`**: OpenAI Chat Completions with `response_format: json_object` and Zod validation. It is used from **`lib/batch-translate.ts`** (in-app **`app/batch-translate.tsx`**) and **`scripts/translate-questions.ts`** (legacy ES/PT CLI). For **Romanian** on the **full quiz-session pool** (deduped `allQuestions` from `lib/quizSessionQuestionPool.ts`), use **`bun run translate:quiz-ro`** (`scripts/batch-translate-quiz-ro.ts`) with optional `--skip`, `--max`, `--delta-out`. It writes **`scripts/ro-delta-last-run.json`** (only `ro` for ids in that run). Apply into the repo with **`bun run merge:ro-delta`** (`scripts/merge-ro-delta-apply.ts`). Optional **`--out`** on translate still writes the full merged `.ts` if you want it.

**Keys (see also `lib/llm-generate-object-json.ts`):**

- **Scripts / CI:** set **`OPENAI_API_KEY`** or **`AI_API_KEY`** in `.env` (loaded via `dotenv` for the CLI script). Optional: **`AI_BASE_URL`**, **`AI_MODEL`**.
- **Expo dev only:** the in-app screen can fall back to **`EXPO_PUBLIC_OPENAI_API_KEY`** if secret env vars are unset. **Do not** put real production secrets in public env for store builds.

**Legacy env name:** `EXPO_PUBLIC_RORK_API_BASE_URL` in `app.config.ts`, `lib/api-base-url.ts`, and `scripts/check-env.js` is only a **legacy alias** for the same API base URL as `EXPO_PUBLIC_API_BASE_URL` (tRPC), not the translation stack.

Metro uses the standard **`expo/metro-config`** setup in **`metro.config.js`**, with a small resolver override for Kinde / `expo-secure-store` (see that file).

---

## Support

End-user and legal information (privacy, terms, conduct) is linked from the app. For engineering questions, use your team’s usual channels or issues in this repository if enabled.
