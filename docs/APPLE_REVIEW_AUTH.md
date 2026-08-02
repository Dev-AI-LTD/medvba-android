# Autentificare pentru App Review (email + parolă)



**Conturi review recomandate:**
- `review-expired@devaieood.com` = contul pentru **Username/Password** în App Store Connect (fără premium activ, pentru fluxul purchase/restore).
- `contact@devaieood.com` = contul premium pentru testarea funcțiilor complete în Notes.



Nu folosi același email pentru toate câmpurile:
- App Store Connect Username/Password: `review-expired@devaieood.com`
- Notes + premium test: `contact@devaieood.com`



## Kinde: o app native pentru iOS + Android (Expo)



**Nu** crea o aplicație Kinde separată pentru iOS. Folderul `medvba-android` e istoric — app-ul e Expo pentru ambele platforme.



| Greșeală în Kinde | Corect |

|-------------------|--------|

| Framework **Android** only | **React Native** / **Expo** |

| App nouă „MEDVBA iOS” | Editează app-ul existent (`EXPO_PUBLIC_KINDE_CLIENT_ID`) |

| Callback lipsă | `medvba://*` |



Checklist complet: **[KINDE_IOS_EXPO_SETUP.md](KINDE_IOS_EXPO_SETUP.md)**



Verificare `.env`:



```bash

npm run check:kinde-ios

```



---



## În app (build curent)



- **Fără Facebook** (implicit dezactivat).

- **Google** și **Sign in with Apple** — flux PKCE suportat (Review **Primary**).

- **Sign in with email** → browser Kinde (PKCE), parolă pe pagina Kinde — **recomandat pentru review** cu `contact@devaieood.com`.

- **Email + parolă în ecran** → backend ROPC: **nu funcționează** (Kinde nu suportă password grant). Vezi **[KINDE_ROPC_NOT_SUPPORTED.md](KINDE_ROPC_NOT_SUPPORTED.md)**.



## 1. Setări Kinde (obligatoriu)



Ghid pas cu pas: **[KINDE_EMAIL_PASSWORD.md](KINDE_EMAIL_PASSWORD.md)** · Railway: **[RAILWAY_KINDE_AUTH.md](RAILWAY_KINDE_AUTH.md)** · Apple (Return URL, S2S gol): **[APPLE_SIGN_IN_KINDE_SETUP.md](APPLE_SIGN_IN_KINDE_SETUP.md)**



1. **Applications** → app native MEDVBA → Framework **Expo/React Native**, callbacks `medvba://*`

2. **Authentication** → **Apple** + **Google** ON; copiază connection IDs în `.env`

3. **Email + password** (NU „Email + code”) — login în browser Kinde, fără OTP pentru user **verified**

4. User **`contact@devaieood.com`** → **Verified**, conexiune Email + password



```bash

npm run check:kinde-auth

npm run verify:review-user

```



Fără `EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID`, Sign in with Apple nu funcționează pe iOS.



## 2. Creează / verifică contul de test



Copiază din **[`.env.example`](../.env.example)** în `.env` (local, nu în git):



```env

VERIFY_AUTH_EMAIL=contact@devaieood.com

VERIFY_AUTH_PASSWORD=YourSecureReviewPass8

VERIFY_AUTH_NAME=App Review

EXPO_PUBLIC_KINDE_LOGIN_HINT_EMAIL=contact@devaieood.com

EXPO_PUBLIC_APP_REVIEW_PREMIUM_EMAILS=contact@devaieood.com

EXPO_PUBLIC_ENABLE_REVIEW_PREMIUM=true

EXPO_PUBLIC_API_BASE_URL=https://medvba-android-production.up.railway.app

```



Rulează:



```bash

cd medvba-android

npm run verify:review-user

npm run grant-review-premium

```



Opțional (dacă userul nu există în Kinde): `npm run create:review-user` — folosește `node` / `npm run` (nu `bun run` pe Windows).



### `502` la `/oauth2/token` (password grant)



**Cauză confirmată de Kinde:** ROPC nu e suportat — nu e bug Railway. **App Review:** **Sign in with email** (Kinde browser) sau **Apple** / **Google** ([app-store-metadata-en.md](app-store-metadata-en.md) Primary).



`npm run diagnose:kinde-password` va rămâne 502; folosește `npm run review-notes:mode`.



## 3. App Store Connect



| Câmp | Valoare |

|------|---------|

| **Username** | `review-expired@devaieood.com` |

| **Password** | aceeași parolă ca `VERIFY_AUTH_PASSWORD` în Kinde |



**Notes (EN):** [app-store-metadata-en.md](app-store-metadata-en.md) → **Review Notes** (Primary).



## 4. Test în Expo dev / TestFlight



1. `npm run check:kinde-ios` — toate ✅

2. `npm run start` → iPhone sau simulator iOS

3. Login → **Sign in with email** → Kinde → `contact@devaieood.com` + parolă

4. Opțional: **Sign in with Apple** / **Google** (fără premium — doar contul demo are premium)



## 5. EAS production



Environment **production**: `EXPO_PUBLIC_KINDE_*`, `EXPO_PUBLIC_API_BASE_URL`, RevenueCat iOS (`appl_…`).



Obligatoriu pentru review email:



- `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID`

- `EXPO_PUBLIC_KINDE_LOGIN_HINT_EMAIL=contact@devaieood.com` (opțional, prefill)

- `EXPO_PUBLIC_APP_REVIEW_PREMIUM_EMAILS=contact@devaieood.com`
- **`EXPO_PUBLIC_ENABLE_REVIEW_PREMIUM=false`** pe EAS **production** (public App Store) — utilizatorii plătesc prin RevenueCat; premium demo vine din `grant-review-premium` (Supabase), nu din bypass client
- Setează `EXPO_PUBLIC_ENABLE_REVIEW_PREMIUM=true` doar pe un profil/build dedicat App Review / TestFlight dacă ai nevoie de bypass client fără grant DB



## 6. Premium complet pentru contul demo (review)



Reviewerul trebuie să testeze **toate** funcțiile (quiz nelimitat, AI, study, module). **Sign in with Apple / Google personal** rămâne free — în Notes specificați contul demo.



### Kinde + Supabase (fără feature flag)



1. User **`contact@devaieood.com`** — **Verified**, Email + password (fără OTP).

2. Premium în DB (server: study, AI):



```bash

# .env: SUPABASE_SERVICE_ROLE_KEY + EXPO_PUBLIC_SUPABASE_URL + VERIFY_AUTH_*

npm run grant-review-premium

```



### App (client)



- Allowlist în [`lib/app-review-premium.ts`](../lib/app-review-premium.ts): `contact@devaieood.com` (implicit).

- EAS **production** (public store): `EXPO_PUBLIC_ENABLE_REVIEW_PREMIUM=false` + `EXPO_PUBLIC_PAYWALL_ENABLED=true` — plată reală via store/RevenueCat. Contul demo rămâne premium prin grant Supabase (`npm run grant-review-premium`).

- Opțional prefill Kinde: `EXPO_PUBLIC_KINDE_LOGIN_HINT_EMAIL=contact@devaieood.com`

- Bypass client (`ENABLE_REVIEW_PREMIUM=true`) doar pe build-uri dedicate review/TestFlight, nu pe App Store public.

- **EAS upload:** `.easignore` înlocuiește `.gitignore`. Păstrează `.env` în `.easignore` — altfel un `.env` local cu `ENABLE_REVIEW_PREMIUM=true` poate fi urcat pe EAS și dezactiva paywall-ul real. Pe profilul `production`, `app.config.ts` forțează flag-ul din EAS env (default `false`), nu din fișier.

- **Nu** implementați `app_store_review_mode`, buton ascuns sau `medvba://hidden-login` pentru primul submit.



### TestFlight



Login cu **`contact@devaieood.com`** (Sign in with email → Kinde) → Home fără lock pe categorii, quiz >10/zi, Tutor nelimitat.



Vezi și: [ENV_AND_EAS_SECRETS.md](ENV_AND_EAS_SECRETS.md) · [ASC_CHECKLIST_1.0.30.md](ASC_CHECKLIST_1.0.30.md)


