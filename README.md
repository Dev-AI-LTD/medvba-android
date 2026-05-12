# MEDVBA

Native mobile app for medical exam preparation (quizzes, progress, study features, AI tutor integrations). Built with **Expo** and **React Native**.

**Product name:** MEDVBA  
**Legal entity (in-app Terms / Privacy):** Dev AI LTD  
**Public site / deep link origin:** [https://medvba.app/](https://medvba.app/)

Configuration in this repo matches `app.config.ts` (e.g. `name`, `slug`, `scheme`, bundle IDs, Expo `extra`).

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

Copy environment variables from `.env.example` into `.env` / `.env.local` and fill values for Supabase, API base URL, auth (Kinde), RevenueCat, etc. The app reads public keys via `EXPO_PUBLIC_*` as wired in `app.config.ts`.

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

Internal checklist for Play / EAS lives in [`.cursor/rules/eas-android-release.mdc`](./.cursor/rules/eas-android-release.mdc) (Bun-only lockfile, `expo-doctor`, versionCode, `mapping.txt`, etc.).

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

## Rork toolkit (`@rork-ai/toolkit-sdk`)

The dependency **`@rork-ai/toolkit-sdk`** is still wired into this repo in a few places:

| Location | Usage |
|----------|--------|
| **`metro.config.js`** | `withRorkMetro(config)` — wraps the Metro bundler config for every dev/production bundle. |
| **`lib/batch-translate.ts`** | `generateObject` from the SDK — used by **`app/batch-translate.tsx`** (batch translation UI). |
| **`scripts/translate-questions.ts`** | Same `generateObject` — CLI helper for question translation. |
| **`package.json`** | Declares the dependency; some scripts still call **`bunx rork start`** (`start`, `start-web`, `start-web-dev`). Prefer **`bun run start:local`** / **`start:web`** for plain Expo if you are not using that flow. |
| **`jest.config.js`** | `@rork-ai` is listed in `transformIgnorePatterns` so Jest can transpile the package. |

**Environment name only (not the AI SDK):** `EXPO_PUBLIC_RORK_API_BASE_URL` in `app.config.ts`, `lib/api-base-url.ts`, and `scripts/check-env.js` is a **legacy alias** for the same API base URL as `EXPO_PUBLIC_API_BASE_URL` (tRPC client), not a separate “Rork cloud” requirement by itself.

To remove Rork entirely you would need to replace `withRorkMetro`, migrate `start` scripts to `expo start`, and swap or drop `generateObject` in the batch-translate path (or remove that tooling if unused).

---

## Support

End-user and legal information (privacy, terms, conduct) is linked from the app. For engineering questions, use your team’s usual channels or issues in this repository if enabled.
