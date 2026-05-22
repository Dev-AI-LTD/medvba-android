# Kinde: aliniere Expo / iOS (o singură app native)

MEDVBA este **Expo / React Native** — același build pentru **iOS** și **Android**. Nu crea o aplicație Kinde separată pentru iOS.

**Client folosit în cod:** `EXPO_PUBLIC_KINDE_CLIENT_ID` din [app.config.ts](../app.config.ts)  
**Scheme callback:** `medvba://` (vezi `scheme: 'medvba'` în app.config)  
**Bundle iOS:** `com.devaieood.medvba`

---

## Checklist Kinde Dashboard (manual)

Bifează în [Kinde](https://app.kinde.com) → **Settings → Applications** → app-ul **native** MEDVBA (același `client_id` ca în `.env`).

### 1. Framework / tip aplicație

| Câmp | Valoare corectă |
|------|-----------------|
| Tip | **Native** / **Mobile** (front-end) — **nu** Machine-to-Machine |
| Framework / SDK | **React Native** sau **Expo** — **nu** Android-only |
| Nu crea | App nouă „MEDVBA iOS” |

Dacă framework-ul arată încă **Android** din setup vechi, editează la **Expo/React Native**. Eticheta nu schimbă `client_id`-ul — păstrează același client în app și Railway.

### 2. URLs (obligatoriu pentru `@kinde/expo`)

| Câmp | Valoare |
|------|---------|
| Allowed callback URLs | `medvba://*` |
| Allowed logout redirect URLs | `medvba://` (sau `medvba://*` dacă Kinde permite) |

### 3. Authentication pe aceeași app

**Applications → Configure → Authentication:**

| Conexiune | Pentru | Variabilă în `.env` |
|-----------|--------|-------------------|
| **Google** | Android + iOS | `EXPO_PUBLIC_KINDE_GOOGLE_CONNECTION_ID` |
| **Apple** | iOS (obligatoriu App Store) | `EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID` |
| **Email + password** | Login în app (când password grant funcționează) | — (backend password grant) |

**Apple** = conexiune în Kinde, nu aplicație nouă. Ghid: [Kinde Apple sign-in](https://docs.kinde.com/authenticate/social-sign-in/apple/).

### 3b. Eroare „Connection not enabled” (Apple / Google)

`.env` poate avea `EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID` setat, dar Kinde tot refuză loginul dacă conexiunea **nu e activată pe aplicația native**.

1. [Kinde](https://app.kinde.com) → **Settings → Applications** → app-ul **native** MEDVBA (același `client_id` ca în `.env`).
2. **View details** → **Authentication** (sau **Connections**).
3. **Pornește (ON)** toggle-ul pentru **Apple** (și **Google** dacă e off).
4. Separat: **Settings → Environment → Authentication** → **Social connections** → **Apple** → **Configure** (Service ID, key `.p8`, Team ID) până conexiunea e **Configured**, nu doar creată.
5. Copiază **Connection ID** din pagina Apple (nu Client ID-ul aplicației) în `.env`:
   `EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID=conn_...`
6. Repornește Metro: `bunx expo start --clear` → Reload pe telefon.

Dacă Google merge dar Apple nu: problema e doar la pasul 3–4 pentru Apple (sau ID greșit în `.env`).

### 4. Apple Developer (în afara Kinde)

Ghid complet (Return URLs vs Server-to-Server, `.p8`, Team ID): **[APPLE_SIGN_IN_KINDE_SETUP.md](APPLE_SIGN_IN_KINDE_SETUP.md)**

| Pas | Acțiune |
|-----|---------|
| Services ID | Domains: `devaieoodltd.kinde.com` · Return URL: din Kinde Callback (ex. `https://devaieoodltd.kinde.com/login/callback`) |
| Server-to-Server Notification Endpoint | **Lasă gol** (nu e pentru login; vezi ghid) |
| App ID | `com.devaieood.medvba` + **Sign in with Apple** |
| Keys | `.p8` + Key ID · Team ID `3L7H3SZXM3` |

### 5. Railway (același client Kinde)

| Variabilă | Sursă |
|-----------|--------|
| `KINDE_ISSUER_URL` | `https://devaieoodltd.kinde.com` |
| `KINDE_CLIENT_ID` | = `EXPO_PUBLIC_KINDE_CLIENT_ID` |
| `KINDE_CLIENT_SECRET` | Secret app **native** (nu M2M) |

După modificări Kinde: **Redeploy** API Railway.

---

## Verificare locală (fără secrete în output)

```bash
cd medvba-android
node scripts/check-env.js
npm run check:kinde-ios
```

`check:kinde-ios` verifică prezența connection ID-urilor pentru Google/Apple și issuer/client.

---

## Test iOS după setări

1. `npm run start` din `medvba-android` (folosește `bunx expo` local — nu `npx` din `C:\Users\octav\node_modules`) → development build pe **iPhone**
2. Login → **Apple** (iOS) și **Google**
3. Callback revine în app (`medvba://`) — fără „redirect mismatch”
4. Email+parolă: `npm run diagnose:kinde-password` (separat de framework; 502 = ticket Kinde)

---

## Ce să eviți

| Greșeală | Efect |
|---------|--------|
| App Kinde nouă doar pentru iOS | Client ID nou → rescrii `.env`, Railway, utilizatori |
| Framework Android-only la setup | Confuzie; aliniază la Expo |
| `KINDE_M2M_CLIENT_SECRET` ca `KINDE_CLIENT_SECRET` | Password grant / session eșuează |
| Lipsă `EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID` | Sign in with Apple nu merge în app |

---

## Expo start: `expo-router/_ctx-shared` not found

Dacă `npm run start` crapă cu `Cannot find module 'expo-router/_ctx-shared'` și stack-ul arată `C:\Users\octav\node_modules\`:

- Rulează din **`medvba-android`**, nu din folderul părinte.
- Scriptul `start` folosește **`bunx expo start`** (Expo din `medvba-android/node_modules`).
- Evită `npx expo start` manual din home — poate lua CLI global greșit.

---

## Legături

- [APPLE_SIGN_IN_KINDE_SETUP.md](APPLE_SIGN_IN_KINDE_SETUP.md) — Apple S2S vs Return URLs, Services ID, `.p8`
- [APPLE_REVIEW_AUTH.md](APPLE_REVIEW_AUTH.md) — cont demo, 502 password grant
- [PRE_LAUNCH_CHECKLIST_APP_STORE.md](PRE_LAUNCH_CHECKLIST_APP_STORE.md) — App Store
- [app-store-metadata-en.md](app-store-metadata-en.md) — Review Notes (Apple/Google fallback)
