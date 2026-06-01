# Apple App Store audit — MEDVBA (iOS)

Verdict: **NEEDS FIXES** before submission. Work items in priority order. Update **Status** as you go.

**App:** `com.devaieood.medvba` · **Version:** `1.0.30` · **ASC App ID:** `6771373486`

**Auth (unchanged):** Kinde — Apple / Google / hosted email. Not Supabase Auth SDK. See [AUTH_ARCHITECTURE.md](AUTH_ARCHITECTURE.md).

**Supabase prod:** health check 6/6 + RLS `009` ✅ (2026-05-25).

---

## Următorii pași (tu — în ordine)

1. **EAS production env** — `eas env:list --environment production`  
   - `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID`  
   - `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` = `appl_…`  
   - Kinde Apple connection ID  
2. **App Store Connect** — IAP subscriptions Ready + legate la versiunea curentă  
3. **URL-uri live** — `https://medvba.app/privacy`, `https://medvba.app/support`  
4. **RevenueCat** — Paywall template: Terms + Privacy URLs  
5. **App Privacy** — questionnaire aliniat cu `app/legal/privacy-policy.tsx`  
6. **Comenzi locale** (din `medvba-android`):

```powershell
npm run check:kinde-ios
npm run check:revenuecat-ios
npm run review-notes:mode
eas build --platform ios --profile production
```

7. **TestFlight** — Apple / Google / email Kinde, restore purchases, premium, delete account  
8. **Review Notes** — copiază Primary din [app-store-metadata-en.md](app-store-metadata-en.md)

Checklist detaliat: [PRE_LAUNCH_CHECKLIST_APP_STORE.md](PRE_LAUNCH_CHECKLIST_APP_STORE.md).

---

## P0 — Blockers (must pass before review)

| # | Item | Guideline | Status | Owner / action |
|---|------|-----------|--------|----------------|
| 1 | **Hosted email for reviewers** — `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID` in EAS **production**; `npm run check:kinde-ios` shows ✅ | 2.1 | ⚠️ Manual | `eas env:list --environment production` → set connection ID from Kinde (Email + password). Rebuild TestFlight after change. |
| 2 | **No in-app ROPC in release** — password only on Kinde browser | 2.1 | ✅ Code | `login.tsx`: `hideInAppPasswordAuth = !__DEV__`. Verify on TestFlight build, not dev client. |
| 3 | **IAP / subscriptions Ready** — ASC products not Missing Metadata; linked to version **1.0.30** | 3.1.1 | ⚠️ Manual | App Store Connect → Subscriptions → complete metadata, pricing, review screenshot; attach to app version. |
| 4 | **RevenueCat** — `appl_` key in EAS; offerings OK | 3.1.1 | ✅ Local | `npm run check:revenuecat-ios` passed. Confirm same key in EAS production. |
| 5 | **Privacy & Support URLs live** | 2.1 / metadata | ⚠️ Manual | ASC: `https://medvba.app/privacy`, `https://medvba.app/support`. Verify in browser (DNS/hosting). |
| 6 | **Review Notes** + ASC Username/Password | 2.1 | ✅ Docs | `app-store-metadata-en.md` → `contact@devaieood.com` + parola cont Kinde (hosted email). |
| 7 | **RevenueCat paywall** — Terms + Privacy URLs in RC dashboard template | 3.1.1 | ⚠️ Manual | RevenueCat → Paywalls → legal links (not only in-app). |
| 8 | **Sign in with Apple** on iOS (Google also offered) | 4.8 | ✅ Code | Apple button iOS-only; entitlement in `app.config.ts`. Optional: native `AppleAuthenticationButton` (HIG) later. |
| 9 | **Face ID plist matches UI** — toggle in Settings | 5.1.1 | ✅ Code | `NSFaceIDUsageDescription` + **Settings → Biometric login** switch. |
| 10 | **Notification honesty** — chat/updates not fake-active | 5.1.1 | ✅ Code | `notifications.tsx`: disabled switches + “Coming soon” copy. Study reminder = local only. |

---

## P1 — High (fix before or right after first submission)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 11 | **App Privacy questionnaire** (Kinde, Supabase, RevenueCat, OpenAI, Sentry if DSN) | ⚠️ Manual | Align with `app/legal/privacy-policy.tsx` + `docs/web-legal/`. |
| 12 | **Delete account** + subscription cancel note | ✅ Code | `delete-account.tsx` |
| 13 | **AI Tutor disclaimer** + privacy (OpenAI) | ✅ Code | Tutor screen + privacy policy |
| 14 | **Report user** in chat | ✅ | `017_user_reports.sql` pe prod (health check OK) |
| 15 | **Store copy** — no Zoom / live video | ⚠️ Manual | `app-store-metadata-en.md`, keywords, screenshots |
| 16 | **Zoom UI** — removed | ✅ | Zoom requests UI și hooks eliminate din app |

---

## P2 — Polish / post-launch

| # | Item | Notes |
|---|------|-------|
| 17 | Apple Sign In **HIG button** (native style) | Custom icon button today; consider `expo-apple-authentication` |
| 18 | Stale Zoom strings in locales | ✅ Removed from en/ro/es/pt |
| 19 | `modal.tsx`, `+not-found.tsx` static colors | Cosmetic |

---

## Commands (from `medvba-android`)

```powershell
npm run check:kinde-ios
npm run check:revenuecat-ios
npm run review-notes:mode
eas env:list --environment production
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```

---

## Changelog (audit execution)

| Date | Change |
|------|--------|
| 2026-05-24 | Tracker created; P0 code items: biometric Settings, login Apple iOS-only, `check:kinde-ios` email warning |
| 2026-05-25 | Supabase prod 6/6; paywall/RevenueCat logging → `log` (dev-only warn/debug, Sentry on errors) |
