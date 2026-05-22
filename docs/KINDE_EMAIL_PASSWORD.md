# Autentificare email — ce merge cu Kinde

## Important: login în app (email + parolă) nu e suportat de Kinde

Fluxul actual **email + parolă în ecran** → Railway → `grant_type=password` (**ROPC**) este **respins de Kinde** (502 permanent). Detalii: **[KINDE_ROPC_NOT_SUPPORTED.md](KINDE_ROPC_NOT_SUPPORTED.md)**.

Nu aștepta rezolvare la ticket pentru `diagnose:kinde-password`.

## Pentru App Review (acum)

| Metodă | Unde | OTP? |
|--------|------|------|
| **Apple** (iOS) | Buton în app | Nu |
| **Google** | Buton în app | Nu |
| Email + parolă | Doar dacă adaugi flow **browser PKCE** (vezi mai jos) | Nu, dacă Kinde = Email + password |

`npm run review-notes:mode` → folosește **Primary** (Apple + Google).

## Email + parolă fără OTP (varianta Kinde: browser PKCE)

1. Kinde → **Email + password** (NU Email + code)
2. Applications → app native → Authentication ON, callbacks `medvba://*`
3. Copiază **Connection ID** în `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID`
4. User review **Verified**, parolă setată în Kinde
5. În app: deschide `kinde.login()` cu `buildKindeSignInHint({ emailConnectionId })` — reviewer introduce parola **pe pagina Kinde**, nu în câmpurile din app

Instrucțiuni Review Notes (dacă folosești browser):

```
Sign in with Apple or Google, OR tap "Sign in with email" → browser opens →
enter review email and password on the Kinde page (no verification code if Email+password is enabled).
```

## Verificare (doar informativ)

```bash
npm run check:kinde-auth
npm run diagnose:kinde-password   # așteptat: 502 — confirmă ROPC indisponibil
npm run review-notes:mode
```

## Railway

Variabilele `KINDE_*` pe Railway sunt corecte pentru **social PKCE** și alte grant-uri; ROPC nu va funcționa. Vezi [RAILWAY_KINDE_AUTH.md](RAILWAY_KINDE_AUTH.md).
