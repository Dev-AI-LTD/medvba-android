# Autentificare pentru App Review (email + parolă)

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
- **Email + parolă în ecran** → backend ROPC: **nu funcționează** (Kinde nu suportă password grant). Vezi **[KINDE_ROPC_NOT_SUPPORTED.md](KINDE_ROPC_NOT_SUPPORTED.md)**.
- Opțional viitor: buton email → browser Kinde (PKCE), parolă pe pagina Kinde, fără OTP dacă ai „Email + password”.

## 1. Setări Kinde (obligatoriu)

Ghid pas cu pas: **[KINDE_EMAIL_PASSWORD.md](KINDE_EMAIL_PASSWORD.md)** · Railway: **[RAILWAY_KINDE_AUTH.md](RAILWAY_KINDE_AUTH.md)** · Apple (Return URL, S2S gol): **[APPLE_SIGN_IN_KINDE_SETUP.md](APPLE_SIGN_IN_KINDE_SETUP.md)**

1. **Applications** → app native MEDVBA → Framework **Expo/React Native**, callbacks `medvba://*`
2. **Authentication** → **Apple** + **Google** ON; copiază connection IDs în `.env`
3. **Email + password** (NU „Email + code”) — login în app, fără OTP
4. **Email verification:** user review **verified** sau verificare dezactivată

```bash
npm run check:kinde-auth
```

Fără `EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID`, Sign in with Apple nu funcționează pe iOS.

## 2. Creează contul de test

În `.env` (local, nu în git):

```env
VERIFY_AUTH_EMAIL=review@medvba.app
VERIFY_AUTH_PASSWORD=YourSecureReviewPass8
VERIFY_AUTH_NAME=App Review
EXPO_PUBLIC_API_BASE_URL=https://medvba-android-production.up.railway.app
```

Rulează:

```bash
cd medvba-android
npm run create:review-user
```

Folosește `node` / `npm run` (nu `bun run` pe acest script — pe Windows poate apărea crash la ieșire).

### `502` la `/oauth2/token` (password grant)

**Cauză confirmată de Kinde:** ROPC nu e suportat — nu e bug Railway. **App Review:** **Sign in with Apple** + **Google** ([app-store-metadata-en.md](app-store-metadata-en.md) Primary).

`npm run diagnose:kinde-password` va rămâne 502; folosește `npm run review-notes:mode`.

## 3. App Store Connect

**Când email+parolă funcționează** (`npm run diagnose:kinde-password` → ✅):

| Câmp | Valoare |
|------|---------|
| Username | `VERIFY_AUTH_EMAIL` (ex. `contact@devaieood.com`) |
| Password | `VERIFY_AUTH_PASSWORD` |

**Când password grant dă încă 502** (fallback obligatoriu):

| Câmp | Valoare |
|------|---------|
| Username | (gol sau notă în Notes) |
| Password | (gol) |

**Notes (EN):** [app-store-metadata-en.md](app-store-metadata-en.md) → **Review Notes** (Apple + Google primary).

## 4. Test în Expo dev / TestFlight

1. `npm run check:kinde-ios` — toate ✅
2. `npm run start` → iPhone sau simulator iOS
3. Login → **Sign in with Apple** și **Google** (obligatoriu dacă 502 la email)
4. Opțional email+parolă după ce Kinde repară password grant

## 5. EAS production

Environment **production**: `EXPO_PUBLIC_KINDE_*`, `EXPO_PUBLIC_API_BASE_URL`, RevenueCat iOS (`appl_…`).

Setează **`EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID`** în EAS production pentru butonul **Sign in with email** (hosted PKCE). Fără el, reviewerul nu are flux email în app.
