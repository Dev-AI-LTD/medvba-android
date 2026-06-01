# Checklist înainte de lansare pe App Store (iOS)

Prioritate **Apple** înainte de Google Play. Rulează comenzile din **`medvba-android`** (nu din folderul părinte `MEDVBA3`).

**Legături:** [Auth (Kinde, sursă canonică)](AUTH_ARCHITECTURE.md) · [Audit Apple (priorități)](APPLE_APP_STORE_AUDIT.md) · [Kinde Expo/iOS setup](KINDE_IOS_EXPO_SETUP.md) · [EAS Build (iOS)](EAS_BUILD_COMMANDS.md) · [EAS Secrets](ENV_AND_EAS_SECRETS.md) · [Keywords](app-store-keywords.md) · [Metadata EN](app-store-metadata-en.md)

---

## 0. Ordinea recomandată (Apple first)

| Pas | Acțiune |
|-----|---------|
| 1 | URL-uri live: `https://medvba.app/support`, `https://medvba.app/`, privacy |
| 2 | App Store Connect: app creată, bundle `com.devaieood.medvba` |
| 3 | EAS env **production**: Supabase, RevenueCat **iOS** (`appl_…`), paywall `true`, Kinde + Apple connection |
| 4 | `eas build --platform ios --profile production` (interactiv prima dată — credențiale Apple) |
| 5 | TestFlight → test manual (login Apple/Google/email, quiz, paywall, Chat) |
| 6 | Metadata + capturi + App Privacy + cont demo în Review Notes |
| 7 | `eas submit --platform ios --profile production --latest` |

---

## 1. Identitate și build (cod + EAS)

| Verificare | Status | Note |
|------------|--------|------|
| **Bundle ID** | ✅ | `com.devaieood.medvba` (`app.config.ts`) |
| **Sign in with Apple** | ✅ | Entitlement + buton pe iOS în login |
| **Versiune / buildNumber** | ✅ | `version` + `ios.buildNumber` în `app.config.ts` — incrementează buildNumber la fiecare upload |
| **eas.json iOS build** | ✅ | `production` + `internal` → `ios.resourceClass: m-medium` |
| **eas.json iOS submit** | ✅ | `submit.production.ios` / `submit.internal.ios` |
| **Paywall în build EAS** | ✅ | Implicit `EXPO_PUBLIC_PAYWALL_ENABLED=true` în `app.config.ts` — setează explicit `false` doar pentru build-uri interne |
| **RevenueCat iOS** | ⚠️ | `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` (`appl_…`) în EAS production |
| **Kinde Expo (nu Android-only)** | ⚠️ | [KINDE_IOS_EXPO_SETUP.md](KINDE_IOS_EXPO_SETUP.md) — `npm run check:kinde-ios` |
| **Kinde Apple** | ⚠️ | `EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID` + conexiune Apple în Kinde |
| **Kinde email+parolă** | ⚠️ | `npm run check:kinde-auth` + [KINDE_EMAIL_PASSWORD.md](KINDE_EMAIL_PASSWORD.md); blocat dacă `diagnose:kinde-password` = 502 |
| **Zoom requests în profil** | ✅ | Funcția și UI-ul au fost eliminate din app |

```powershell
cd C:\Users\octav\Desktop\MEDVBA3\medvba-android
eas env:list --environment production
eas build --platform ios --profile production
```

---

## 2. Ce promiți în App Store vs ce face app-ul

**Nu promite sesiuni live / Zoom / video call.** Produsul actual:

| Promisiune în store | În app |
|---------------------|--------|
| Quiz / MCQ | Tab Quiz, sesiuni, capitole |
| Study + audio | Tab Study, rezumate + redare audio |
| AI Tutor | Tutor AI (text) |
| Chat cu studenți | Tab Social → mesagerie directă (nu Zoom) |
| Progres / leaderboard | Home, profil |
| Premium | Paywall + RevenueCat (App Store IAP) |

**Acțiuni:**
- [ ] Promotional text / description / keywords **fără** live, Zoom, streaming (vezi `app-store-metadata-en.md`)
- [ ] Capturi de ecran din build iOS real (Quiz, Study, Tutor, Chat, Paywall)
- [ ] Onboarding slide 3 = Study (nu „live sessions”)

---

## 3. App Store Connect — metadata

| Câmp | Unde |
|------|------|
| **Promotional Text** | Version → App Store → EN |
| **Description** | Același tab |
| **Keywords** | `docs/app-store-keywords.md` (max 100 caractere) |
| **Support URL** | `https://medvba.app/support` |
| **Marketing URL** | `https://medvba.app/` |
| **Privacy Policy URL** | URL public (ex. `https://medvba.app/privacy`) |
| **Copyright, age rating** | App Information |
| **App Privacy** | Questionnaire aliniat cu Supabase, RevenueCat, Kinde, Chat |

Texte gata de copiat: **`docs/app-store-metadata-en.md`**.

---

## 4. Guideline 4.8 — Sign in with Apple

| Cerință | Status |
|---------|--------|
| Google (sau alt third-party login) | ✅ Kinde hosted |
| Sign in with Apple pe același ecran | ✅ iOS în `login.tsx` |
| Apple configurat în Kinde + ASC | ⚠️ Manual |

---

## 5. Monetizare (App Store)

| Cerință | Acțiune |
|---------|---------|
| IAP prin App Store | RevenueCat + produse în App Store Connect |
| Restore purchases | Buton în paywall |
| Prețuri | RevenueCat + ASC subscriptions |
| Cont Sandbox | Users and Access → Sandbox Tester |

- [ ] Produse / subscription group create și **Ready to Submit**
- [ ] RevenueCat: app iOS legată de același bundle
- [ ] Test achiziție pe TestFlight cu sandbox Apple ID

---

## 6. Review — cont demo și note

**Primary (recomandat):** Sign in with **Apple** (iOS) sau **Google**, sau **Sign in with email** → browser Kinde (Email + password, fără OTP dacă conexiunea e corectă). Nu folosi câmpuri email+parolă în app (ROPC nu e suportat de Kinde).

- [ ] Ghid complet: **`docs/APPLE_REVIEW_AUTH.md`**
- [ ] `npm run check:kinde-ios` și `npm run check:kinde-auth` — toate ✅
- [ ] `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID` setat în EAS production (pentru email hosted)
- [ ] Kinde: user review **verified** sau verificare dezactivată
- [ ] **App Review Information** → Username/Password **gol** (sau notă în Notes) când folosești Primary
- [ ] **Notes** (EN): `docs/app-store-metadata-en.md` → **Review Notes** → bloc **Primary**

Login în app: **Apple** / **Google** / **Sign in with email** (browser). Fără Facebook.

---

## 7. URL-uri web (blocant dacă sunt down)

| URL | Conținut sursă |
|-----|----------------|
| Support | `docs/web-legal/support-en.md` |
| Marketing | `docs/web-legal/marketing-en.md` |
| Privacy | `docs/web-legal/privacy-policy.md` |

- [ ] Toate răspund **200** înainte de submit (nu 503)

---

## 8. Submit EAS → App Store Connect

După build reușit:

```powershell
cd C:\Users\octav\Desktop\MEDVBA3\medvba-android
eas submit --platform ios --profile production --latest
```

La primul submit: **App Store Connect API Key** sau Apple ID; opțional adaugă în `eas.json`:

```json
"ios": {
  "bundleIdentifier": "com.devaieood.medvba",
  "ascAppId": "1234567890"
}
```

(`ascAppId` = Apple ID numeric din App Store Connect → App Information.)

Apoi în ASC: build-ul din TestFlight → **Submit for Review**.

---

## 9. EAS environment variables (production) — minim iOS

| Variabilă | Obligatoriu iOS |
|-----------|-----------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Da |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Da |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | Da |
| `EXPO_PUBLIC_PAYWALL_ENABLED` | Da (`true` pentru release) |
| `EXPO_PUBLIC_API_BASE_URL` | Da (login email) |
| `EXPO_PUBLIC_KINDE_ISSUER_URL` | Da |
| `EXPO_PUBLIC_KINDE_CLIENT_ID` | Da |
| `EXPO_PUBLIC_KINDE_GOOGLE_CONNECTION_ID` | Da |
| `EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID` | Da |
| `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID` | Da (cont demo) |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` | Nu pentru build doar iOS |

```bash
eas env:create --name EXPO_PUBLIC_PAYWALL_ENABLED --value "true" --type string --environment production
eas env:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value "appl_xxxxx" --type string --environment production
```

---

## 10. După Apple — Android

Când iOS e în review sau live, reia `docs/PRE_LAUNCH_CHECKLIST_GOOGLE_PLAY.md` și build Android.
