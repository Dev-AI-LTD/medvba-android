# App Store Connect — checklist versiunea **1.0.30**

Bifează pe măsură ce completezi în [App Store Connect](https://appstoreconnect.apple.com).

| | |
|---|---|
| **App** | MEDVBA |
| **Bundle ID** | `com.devaieood.medvba` |
| **ASC App ID** | `6771373486` |
| **Version** | `1.0.30` |
| **iOS buildNumber** (cod) | `58` |
| **Sursă metadata** | `docs/app-store-metadata-en.md`, `docs/app-store-keywords.md` |

**Înainte de submit (local):**

```powershell
cd medvba-android
npm run check:kinde-ios
npm run check:revenuecat-ios
npm run review-notes:mode
```

---

## A. App Information (meniu stânga → App Information)

- [ ] **Name:** MEDVBA
- [ ] **Bundle ID:** `com.devaieood.medvba`
- [ ] **Primary Category:** Education
- [ ] **Secondary Category** (opțional): Medical
- [ ] **Content Rights Information:** completat (de obicei **No** — conținut propriu)
- [ ] **Privacy Policy URL:** `https://medvba.app/privacy` (pagina live, HTTP 200)
- [ ] **Age Rating:** questionnaire completat (educație / fără conținut restricționat nejustificat)

---

## B. Pricing & Availability

- [ ] **App Pricing:** Free — `lei 0.00` (România) / $0 în toate țările
- [ ] **Availability:** toate cele **175** țări — status **Available on App Release**
- [ ] **Pre-Order:** neconfigurat (nu e nevoie pentru lansare normală)

---

## C. App Privacy (meniu stânga → App Privacy)

- [ ] Chestionar **Get Started** / **Edit** completat
- [ ] **Privacy Policy URL:** `https://medvba.app/privacy`
- [ ] Date declarate aliniate cu `app/legal/privacy-policy.tsx` și `docs/web-legal/privacy-policy.md`:
  - [ ] Contact Info (email, nume profil)
  - [ ] User Content (chat, mesaje)
  - [ ] Identifiers / Usage (progres quiz, analytics dacă aplică)
  - [ ] Purchases (RevenueCat / App Store)
  - [ ] Third-party: Kinde, Supabase, RevenueCat, OpenAI (AI Tutor), Sentry (dacă DSN activ)

---

## D. Monetization → Subscriptions

- [ ] Subscription **group** creat
- [ ] **medvba_pro_monthly** — metadata completă, preț RO (~tier echivalent **50 RON**), **Ready to Submit**
- [ ] **medvba_pro_yearly** — metadata completă, preț RO (~tier echivalent **500 RON**), **Ready to Submit**
- [ ] Screenshot review pentru fiecare abonament (paywall din app)
- [ ] Produse **legate la versiunea 1.0.30** (pagina versiunii → In-App Purchases / Subscriptions)

**RevenueCat (verificare):** offering `default` cu `$rc_monthly` + `$rc_annual` → `npm run check:revenuecat-ios`

- [ ] RevenueCat Dashboard → iOS app = același bundle ID
- [ ] Paywall template: **Terms** + **Privacy** URLs (`https://medvba.app/...`)

---

## E. Versiunea 1.0.30 — tab App Store (English + opțional RO)

### E1. Build

- [ ] Build **58** (sau ultimul uploadat pentru 1.0.30) încărcat via EAS / TestFlight
- [ ] Build **selectat** pe versiunea 1.0.30
- [ ] `eas submit --platform ios --profile production --latest` (dacă build-ul nu e încă în ASC)

### E2. Metadata EN (U.S. sau English primary)

- [ ] **Promotional Text** — din `app-store-metadata-en.md`
- [ ] **Description** — din `app-store-metadata-en.md` (fără Zoom / live / video calls)
- [ ] **Keywords** — din `app-store-keywords.md` (max 100 caractere)
- [ ] **Support URL:** `https://medvba.app/support` (live, 200)
- [ ] **Marketing URL:** `https://medvba.app/` (live, 200)
- [ ] **Copyright** completat (ex. `2026 Dev AI LTD. EOOD`)

### E3. Screenshots & Previews (iPhone 6.5")

Ordine recomandată: `docs/app-store-screenshots/README-upload-order.md`

- [ ] 01 — MEDVBA / home
- [ ] 02 — Dashboard
- [ ] 03 — Practice quizzes
- [ ] 04 — Anatomy regions
- [ ] 05 — AI Tutor
- [ ] 06 — Study
- [ ] 07 — Privacy & settings
- [ ] 08 — Subscriptions / paywall
- [ ] App Previews (opțional, max 3): `docs/app-store-screenshots/README-app-previews.md`

### E4. Locale Romanian (opțional)

- [ ] Description RO (dacă publici în `ro`)
- [ ] Keywords RO — din `app-store-keywords.md`

---

## F. App Review Information (versiunea 1.0.30)

- [ ] **First name / Last name / Phone / Email** completate
- [ ] **Sign-in required:** Yes
- [ ] **Username:** `contact@devaieood.com` (verificat în Kinde; același email în Notes + `.env`)
- [ ] **Password:** parola contului Kinde (Email + password, user **Verified**)
- [ ] **Notes:** bloc **Primary** din `docs/app-store-metadata-en.md` (nu Alternate / ROPC)
- [ ] **Attachment** (opțional): captură login sau paywall

**Review path pentru Apple:** Sign in with Apple **sau** Google **sau** Sign in with email → browser Kinde (fără parolă în app).

---

## G. URL-uri web (blocant dacă down)

Verifică în browser **înainte** de Add for Review:

| URL | OK (200) |
|-----|----------|
| `https://medvba.app/privacy` | [ ] |
| `https://medvba.app/support` | [ ] |
| `https://medvba.app/` | [ ] |

Sursă conținut: `docs/web-legal/privacy-policy.md`, `support-en.md`, `marketing-en.md`

---

## H. EAS production (expo.dev → Environment variables)

- [ ] `EXPO_PUBLIC_SUPABASE_URL`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `EXPO_PUBLIC_RORK_API_BASE_URL` (sau `EXPO_PUBLIC_API_BASE_URL`)
- [ ] `EXPO_PUBLIC_KINDE_ISSUER_URL`
- [ ] `EXPO_PUBLIC_KINDE_CLIENT_ID`
- [ ] `EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID`
- [ ] `EXPO_PUBLIC_KINDE_GOOGLE_CONNECTION_ID`
- [ ] `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID`
- [ ] `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` = `appl_…`
- [ ] `EXPO_PUBLIC_PAYWALL_ENABLED` = `true`
- [ ] (Opțional) `EXPO_PUBLIC_KINDE_LOGIN_HINT_EMAIL=contact@devaieood.com`
- [ ] EAS production: `EXPO_PUBLIC_ENABLE_REVIEW_PREMIUM=true` + `EXPO_PUBLIC_APP_REVIEW_PREMIUM_EMAILS=contact@devaieood.com`

Verificare: `eas env:list --environment production`

---

## I. Premium cont demo (înainte de TestFlight)

- [ ] `SUPABASE_SERVICE_ROLE_KEY` în `.env` local (nu în app)
- [ ] `npm run create:review-user` sau `npm run grant-review-premium`
- [ ] Supabase: `subscriptions.status = premium` pentru `profile_id` demo

## J. TestFlight — test manual (build 58)

- [ ] **Sign in with email** (cont demo) → **toate funcțiile deblocate**
- [ ] Home: categorii anatomie fără lock
- [ ] Quiz: peste limita free fără paywall
- [ ] Tutor AI: nelimitat
- [ ] Study: capitole premium accesibile
- [ ] **Sign in with Apple** (iOS) — doar verificare login (fără premium dacă nu e cont demo)
- [ ] **Sign in with Google**
- [ ] Onboarding + Quiz (răspuns la întrebări)
- [ ] Study (rezumat + audio unde există)
- [ ] AI Tutor (mesaj + disclaimer vizibil)
- [ ] Social / Chat (text, fără video)
- [ ] Paywall se deschide; **Restore purchases**
- [ ] Sandbox: achiziție test abonament (opțional dar recomandat)
- [ ] Settings → **Delete account** + mesaj abonament
- [ ] Settings → Biometric toggle (Face ID) — nu crash

---

## K. Submit

- [ ] Toate erorile de la **Add for Review** rezolvate (category, Content Rights, Privacy URL, etc.)
- [ ] Export compliance: **No** (ITSAppUsesNonExemptEncryption = false în app)
- [ ] **Add for Review** → **Submit to App Review**

---

## L. Ce NU pune în store (risc respingere)

- [ ] Fără **Zoom**, live classes, video calls, streaming în description / keywords / capturi
- [ ] Fără promisiuni de funcții care nu sunt în build-ul TestFlight
- [ ] Fără login Facebook în app (doar Apple / Google / email Kinde)

---

## Legături rapide

| Document | Path |
|----------|------|
| Metadata EN | `docs/app-store-metadata-en.md` |
| Keywords | `docs/app-store-keywords.md` |
| Audit Apple | `docs/APPLE_APP_STORE_AUDIT.md` |
| Auth review | `docs/APPLE_REVIEW_AUTH.md` |
| Kinde iOS | `docs/KINDE_IOS_EXPO_SETUP.md` |

---

**Ultima actualizare:** 2026-05-30 · versiune checklist: **1.0.30** / build **58**
