# Kinde: ROPC (password grant) nu este suportat

**Confirmare oficială (Kinde Support, 2026):** tenant `devaieoodltd.kinde.com`, client `8562172f1c2140c5b0987137cb5eb0d7`.

Kinde **nu suportă** Resource Owner Password Credentials (`grant_type=password`). HTTP **502** la `POST /oauth2/token` apare pentru că proxy-ul nu are rută pentru acest grant — nu e outage temporar.

`client_credentials` (M2M) pe același endpoint poate returna **200**; password grant va eșua mereu.

## Ce NU funcționează

- Login **în app** cu email + parolă → Railway → `grant_type=password` ([`exchangeEmailPasswordSession`](../lib/exchange-medvba-session.ts))
- `npm run diagnose:kinde-password` → va rămâne **502** (nu aștepta fix de la ticket)

## Alternative suportate de Kinde

### 1. App Store Review — recomandat acum

**Sign in with Apple** (iOS) + **Google** — deja în app, flux PKCE prin `@kinde/expo`.

Review Notes: bloc **Primary** din [app-store-metadata-en.md](app-store-metadata-en.md). `npm run review-notes:mode`.

### 2. Email + parolă pentru reviewer (browser, PKCE)

Flux **authorization code + PKCE** (hosted):

1. Cont test în Kinde cu parolă cunoscută, user **Verified**
2. Reviewer: buton care deschide Kinde în browser (sau instrucțiuni în Review Notes)
3. Pe pagina Kinde: **Email + password** (NU „Email + code”) → parolă, **fără OTP** dacă conexiunea e password
4. Callback `medvba://*` revine în app

Necesită `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID` + `signInWithKindeHosted` cu `buildKindeSignInHint` (vezi [kinde-hosted-hints.ts](../lib/kinde-hosted-hints.ts)).

### 3. Magic link / OTP (passwordless)

Kinde oferă cod one-time pe email — **nu** e același lucru cu „parolă în app fără OTP”.

## În app (implementat)

- Buton **Sign in with email** → `signInWithEmailHosted` / `signUpWithEmailHosted` (PKCE, `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID`)
- Câmpurile email+parolă ROPC din app sunt ascunse când connection ID e setat
- Backend password grant rămâne legacy (nu folosi)

## Legături

- [APPLE_REVIEW_AUTH.md](APPLE_REVIEW_AUTH.md)
- [KINDE_IOS_EXPO_SETUP.md](KINDE_IOS_EXPO_SETUP.md)
- Răspuns support arhivat: [KINDE_SUPPORT_TICKET_PASSWORD_GRANT.md](KINDE_SUPPORT_TICKET_PASSWORD_GRANT.md)
