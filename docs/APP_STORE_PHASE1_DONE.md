# App Store — Phase 1 (code) — done in repo

## Implemented

| Item | Change |
|------|--------|
| Paywall default | `app.config.ts` + `SubscriptionProvider` default **true** on EAS unless explicitly `false` |
| Review docs | `PRE_LAUNCH_CHECKLIST_APP_STORE.md`, `APPLE_REVIEW_AUTH.md` — Primary login (Apple/Google/email browser) |
| Web privacy | `docs/web-legal/privacy-policy.md` — removed Zoom; added Chat, AI, Kinde, RevenueCat, Sentry |
| In-app privacy | `app/legal/privacy-policy.tsx` — Kinde, Supabase, RevenueCat, Sentry (if DSN) |
| Tutor disclaimer | `app/(tabs)/tutor.tsx` — shows `tutor.disclaimerShort` |
| Login logo | Local `assets/images/icon.png` (no remote CDN) |
| Chat report | `lib/user-reports-storage.ts` + Report in chat menu |
| Crash reporting | `ErrorBoundary` → `logError` / Sentry |

## Phase 2 — user reports (server)

| Item | Change |
|------|--------|
| Migration | `supabase/migrations/017_user_reports.sql` — run on Supabase |
| API | `backend/trpc/reports.ts` → `reports.submit` |
| Client | `lib/submit-user-report.ts` — server first, local fallback offline |

Apply migration:

```bash
# Supabase SQL editor or CLI: run 017_user_reports.sql
```

Redeploy Railway backend after pulling `reports` router.

---

## Still manual (before submit)

1. Deploy updated privacy to **https://medvba.app/privacy**
2. EAS production env: `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`, all `EXPO_PUBLIC_KINDE_*`, `EXPO_PUBLIC_API_BASE_URL`
3. Railway: `KINDE_M2M_*` for account deletion
4. `eas build --platform ios --profile production` → TestFlight smoke (Apple, Google, email hosted, paywall, restore, delete account)
5. App Store Connect: Review Notes **Primary**, App Privacy questionnaire, IAP products Ready
