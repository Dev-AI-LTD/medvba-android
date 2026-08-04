# T1 ES client release — 2026-08-04

## Authorization
Release-owner authorized ES client release/promotion for the T1 descendant validated on staging:

- Staging commit: `15d66e53c2c2f420908ba5d32f30fbf11a3e0476` (`15d66e5`)
- Staging deploy: `20367cba` SUCCESS
- `RAILWAY_GIT_COMMIT_SHA=15d66e53c2c2f420908ba5d32f30fbf11a3e0476`
- Staging API: `https://medvba-android-staging-internal.up.railway.app`
- Device route: USB reverse 8081–8083 only (no local `:3000`)
- ES Tutor device check: English prompt → Spanish response (*“El papel de las microvellosidades en la absorción intestinal…”*); no locale/schema rejection

## Release commit (client)
- Git: `57beac179d0125193593a278086f5ce04379f429` (`57beac1`) — descendant of validated staging `15d66e5`
- Enables `EXPO_PUBLIC_ALLOW_UI_LOCALES=true` on EAS `production` and `internal` profiles (store UI EN/RO/ES).
- Does **not** change Clinical flags, credits, paywall, providers, or stashes.
- App version: **1.0.34**
- Android `versionCode`: **46**
- iOS `buildNumber`: **79**
- Runtime version: **1.0.34**

## Production API promotion
- GitHub-validated Railway deploy `4f6ecaf8` → **SUCCESS**
- `RAILWAY_GIT_COMMIT_SHA=57beac179d0125193593a278086f5ce04379f429`
- API: `https://medvba-android-production.up.railway.app`

## Boundaries preserved
- Clinical ES Premium QA remains deferred pending authorized staging Premium OAuth (≥12 credits).
- Issue #2 (Railway auto-deploy) remains non-blocking ops follow-up.

## Builds / promotion

| Platform | Profile | Build ID | Status | Notes |
|---|---|---|---|---|
| Android | production | `5c474967-3e54-48a2-ab35-3a926eafb4bb` | submitted to EAS | https://expo.dev/accounts/devaieood79/projects/medvba/builds/5c474967-3e54-48a2-ab35-3a926eafb4bb |
| iOS | production | `4c0b2a21-598a-4c14-8acd-593859f18601` | submitted to EAS | https://expo.dev/accounts/devaieood79/projects/medvba/builds/4c0b2a21-598a-4c14-8acd-593859f18601 |

Store submit (`eas submit --profile production`) runs after both builds finish.
