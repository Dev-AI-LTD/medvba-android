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
- Enables `EXPO_PUBLIC_ALLOW_UI_LOCALES=true` on EAS `production` and `internal` profiles (store UI EN/RO/ES).
- Does **not** change Clinical flags, credits, paywall, providers, or stashes.
- App version: **1.0.34**
- Android `versionCode`: **46**
- iOS `buildNumber`: **79**
- Runtime version: **1.0.34**

## Boundaries preserved
- Clinical ES Premium QA remains deferred pending authorized staging Premium OAuth (≥12 credits).
- Issue #2 (Railway auto-deploy) remains non-blocking ops follow-up.

## Builds / promotion
_Filled after EAS build IDs are created._

| Platform | Profile | Build ID | Status | Notes |
|---|---|---|---|---|
| Android | production | TBD | TBD | |
| iOS | production | TBD | TBD | |
