# MEDVBA — plan remediere (aplicație completă)

**Principii:** Kinde rămâne pentru sign-in · modificări mici · fără refactor masiv · dashboard = manual.

**Auth:** [AUTH_ARCHITECTURE.md](AUTH_ARCHITECTURE.md) · **App Store:** [APPLE_APP_STORE_AUDIT.md](APPLE_APP_STORE_AUDIT.md)

---

## Pas 0 — Documentație ✅

- [x] AUTH_ARCHITECTURE.md (Kinde + JWT + Supabase date)
- [x] APP_DESCRIPTION, README, ARCHITECTURE §1.4–1.5

---

## Pas 1 — Securitate critică (cod) 🔄

| # | Task | Status | Fișiere |
|---|------|--------|---------|
| 1.1 | `syncFromClient`: premium doar după verificare RevenueCat REST | ✅ | `backend/trpc/subscription.ts` |
| 1.2 | Scoate `subscription` din cache React Query persistat | ✅ | `lib/query-client.ts` |
| 1.3 | Logging delete-account fără `console.error` în prod | ✅ | `app/delete-account.tsx` |
| 1.4 | RLS `subscriptions` (`009`) + health check prod (6/6) | ✅ | [SUPABASE_MIGRATIONS_CHECKLIST.md](SUPABASE_MIGRATIONS_CHECKLIST.md) |
| 1.5 | Quiz limits doar client — server enforcement (opțional) | ⬜ | `backend/trpc/` — faza ulterioară |

**Railway:** `REVENUECAT_SECRET_API_KEY` obligatoriu pentru sync premium din app.

---

## Pas 2 — Subscriptions & App Review (cod) 🔄

| # | Task | Status | Fișiere |
|---|------|--------|---------|
| 2.1 | Restore purchases în Settings (user free) | ✅ | `app/settings.tsx` |
| 2.2 | Refresh RevenueCat la `AppState` active | ✅ | `providers/SubscriptionProvider.tsx` |
| 2.3 | Link-uri Terms/Privacy în RevenueCat Paywall dashboard | ⬜ | **NEEDS MANUAL** |
| 2.4 | IAP Ready + legate la versiune în ASC | ⬜ | **NEEDS MANUAL** |
| 2.5 | `appl_` key în EAS production | ⬜ | `npm run check:revenuecat-ios` |

---

## Pas 3 — Auth Kinde (stabil, fără migrare) ⬜

| # | Task | Risc | Note |
|---|------|------|------|
| 3.1 | Păstrează Kinde — **nu** Supabase Auth SDK | — | Decizie produs |
| 3.2 | EAS: `EXPO_PUBLIC_KINDE_*` + email connection pentru review | Manual | `check:kinde-ios` |
| 3.3 | Apple capability + Kinde Return URL | Manual | APPLE_SIGN_IN_KINDE_SETUP |
| 3.4 | Test cold start / logout / relay email Apple | Test | AuthProvider |
| 3.5 | `KINDE_M2M_*` pentru delete account | Manual | Railway |

---

## Pas 4 — Expo / iOS config ⬜

| # | Task | Status |
|---|------|--------|
| 4.1 | `NSPhotoLibraryUsageDescription`, `NSFaceIDUsageDescription` | ✅ în app.config |
| 4.2 | `com.apple.developer.applesignin` | ✅ |
| 4.3 | Verifică prebuild: fără permisiuni fantomă (cameră/mic) | ⬜ după `expo prebuild` |
| 4.4 | Privacy/Support URLs live | ⬜ manual |
| 4.5 | App Privacy questionnaire | ⬜ manual |

---

## Pas 5 — UGC / Social & compliance ⬜

| # | Task | Status |
|---|------|--------|
| 5.1 | Report/block în chat | ✅ cod |
| 5.2 | Migrare `017_user_reports.sql` pe Supabase prod | ✅ |
| 5.3 | Delete account + notă cancel subscription | ✅ |
| 5.4 | Notificări „coming soon” onest | ✅ |

---

## Pas 6 — App Review cleanup 🔄

| # | Task | Status |
|---|------|--------|
| 6.1 | Store copy fără Zoom / live video | ✅ |
| 6.2 | `batch-translate` dev-only | ✅ |
| 6.3 | Review Notes — app-store-metadata-en.md | ⬜ tu: paste în ASC |
| 6.4 | `modal.tsx` / empty states (P2) | ⬜ |
| 6.5 | Paywall/RevenueCat logging → `log` | ✅ `paywall.tsx`, `revenuecat.ts`, `settings` restore |

---

## Pas 7 — Release ⬜

```bash
cd medvba-android
bun install --frozen-lockfile
bun run doctor
bunx tsc --noEmit
eas build --platform ios --profile production
```

---

## Următorul pas (pe rând)

**Acum (tu):** [APPLE_APP_STORE_AUDIT.md](APPLE_APP_STORE_AUDIT.md) → secțiunea **Următorii pași** + [PRE_LAUNCH_CHECKLIST_APP_STORE.md](PRE_LAUNCH_CHECKLIST_APP_STORE.md).

**Apoi:** TestFlight → `eas submit`.

## Ordinea recomandată de lucru cu agentul

1. ✅ Pas 1.1–1.3 (făcut)
2. ✅ Pas 1.4 — SQL prod (health check 6/6, `009` aplicat)
3. ✅ Pas 2.1–2.2 (făcut)
4. Dashboard Pas 2.3–2.5 + Pas 3 + 4.4–4.5 (tu)
5. Test manual (lista din APPLE_APP_STORE_AUDIT)
6. Build TestFlight → submit

---

## Ce NU facem fără approval explicit

- Migrare auth Kinde → Supabase Auth
- `expo-apple-authentication` / refactor login UI major
- Downgrade Expo 54 → 53
- Refactor `social.tsx` / `supabase-hooks.ts` monolit
- Force push / amend commits

Last updated: 2026-05-25.
