# Variabile .env și EAS Secrets pentru Google Play

**Autentificare:** Kinde (nu Supabase Auth în app). Vezi [AUTH_ARCHITECTURE.md](AUTH_ARCHITECTURE.md).

## 1. Toate variabilele necesare pentru Google Play

| Variabilă | Obligatoriu | Unde o găsești | Exemplu |
|-----------|-------------|-----------------|---------|
| **EXPO_PUBLIC_KINDE_ISSUER_URL** | Da (login) | Kinde → Settings → Domain | `https://YOUR_SUBDOMAIN.kinde.com` |
| **EXPO_PUBLIC_KINDE_CLIENT_ID** | Da | Kinde → Applications → native (Expo) app | `…` |
| **EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID** | Da pe iOS (Apple + Google) | Kinde → Authentication → Apple | `conn_…` |
| **EXPO_PUBLIC_KINDE_GOOGLE_CONNECTION_ID** | Da | Kinde → Authentication → Google | `conn_…` |
| **EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID** | Da pentru review / email hosted | Kinde → Authentication → Email + password | `conn_…` |
| **EXPO_PUBLIC_API_BASE_URL** | Da | Railway (Hono + tRPC + `/api/auth/session`) | `https://….up.railway.app` |
| **EXPO_PUBLIC_SUPABASE_URL** | Da (date app) | Supabase → Settings → API → Project URL | `https://abc123.supabase.co` |
| **EXPO_PUBLIC_SUPABASE_ANON_KEY** | Da | Supabase → Settings → API → anon public | `eyJhbGciOiJIUzI1NiIs...` |
| **EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID** | Da (pentru abonamente) | RevenueCat → API Keys → aplicația **Android** (Google Play) → Public key | de obicei `goog_...` |
| **EXPO_PUBLIC_REVENUECAT_API_KEY_IOS** | Doar dacă faci build iOS | RevenueCat → API Keys → aplicația **iOS** (App Store) → Public key | de obicei `appl_...` |
| **EXPO_PUBLIC_PAYWALL_ENABLED** | Da | Tu decizi | `true` sau `false` |
| EXPO_PUBLIC_RORK_API_BASE_URL | Nu | Alias istoric pentru același URL ca **EXPO_PUBLIC_API_BASE_URL** (tRPC); poți folosi unul singur | `https://api.example.com` |
| EXPO_PUBLIC_SENTRY_DSN | Nu | Sentry → Project Settings → DSN | `https://xxx@sentry.io/xxx` |
| EXPO_PUBLIC_APP_REVIEW_PREMIUM_EMAILS | Nu (implicit în cod) | Email demo cu Premium UI în app | `contact@devaieood.com` |
| EXPO_PUBLIC_ENABLE_REVIEW_PREMIUM | Nu (default `false`) | `true` doar pentru TestFlight / App Review | `true` |
| EXPO_PUBLIC_KINDE_LOGIN_HINT_EMAIL | Nu | Prefill email pe pagina Kinde la „Sign in with email” | `contact@devaieood.com` |
| VERIFY_AUTH_EMAIL | Nu (doar scripturi locale) | Cont App Review în Kinde | `contact@devaieood.com` |
| VERIFY_AUTH_PASSWORD | Nu (doar scripturi locale) | Parola contului de review (nu în git) | — |
| SUPABASE_SERVICE_ROLE_KEY | Nu (doar scripturi locale) | Supabase → API → service_role — `npm run grant-review-premium` | — |

---

## 2. Ce scrii în `.env` (pe PC, pentru develop / build local)

Copiază **[`.env.example`](../.env.example)** → **`.env`** (nu se pune în git) și completează valorile reale. Exemplu minim:

```env
EXPO_PUBLIC_SUPABASE_URL=https://TAU_PROIECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.TAU_CHEIE_ANON

EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_TEACHEIA_ANDROID_DIN_REVENUECAT
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_TEACHEIA_IOS_DIN_REVENUECAT

EXPO_PUBLIC_PAYWALL_ENABLED=true
```

**RevenueCat – ce cheie pui:**
- În RevenueCat: **Project** → **API Keys**. Vezi câte o cheie per aplicație (Android și iOS sunt separate).
- **Android:** alegi aplicația **Android** (Google Play, package `com.devaieood.medvba`) și copiezi **Public** key – de obicei începe cu `goog_` (Google).
- **iOS:** alegi aplicația **iOS** (App Store) și copiezi **Public** key – de obicei începe cu `appl_` (Apple).
- Nu pui niciodată **Secret** key în app; doar **Public** key.

---

## 3. Unde și cum pui RevenueCat (și celelalte) ca EAS Secrets

La **EAS Build** serverele Expo **nu au** fișierul tău `.env` (e în .gitignore). Trebuie să setezi variabilele ca **EAS Secrets**.

### Variantă A: Din terminal (recomandat)

Folosește **`eas env:create`** (comanda nouă; `eas secret:create` e depreciată):

```bash
# Supabase
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://TAU_PROIECT.supabase.co" --type string --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIs..." --type string --environment production

# RevenueCat – Android
eas env:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value "goog_xxxxx" --type string --environment production

# RevenueCat – iOS (dacă faci și build iOS)
eas env:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value "appl_xxxxx" --type string --environment production

# Paywall activ
eas env:create --name EXPO_PUBLIC_PAYWALL_ENABLED --value "true" --type string --environment production
```

Poți folosi `--environment production` sau `--environment preview` după cum build-ezi. Dacă vrei pentru toate: rulezi o dată cu `production`, o dată cu `preview`, sau verifici în [expo.dev](https://expo.dev) → Project → Environment variables.

### Variantă B: Din Expo Dashboard

1. Mergi pe **[expo.dev](https://expo.dev)** → **Projects** → proiectul **MEDVBA**.
2. Tab **Secrets** (sau **Project settings** → **Secrets**).
3. **Create secret**:
   - **Name:** exact numele variabilei, e.g. `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`
   - **Value:** valoarea (fără ghilimele), e.g. pentru Android de obicei `goog_xxxxxxxxxxxx`, pentru iOS de obicei `appl_xxxxxxxxxxxx`

Repeti pentru fiecare variabilă din tabelul de mai sus.

### Ce nume de secret folosești

| Nume secret în EAS | Valoare (exemplu) |
|--------------------|--------------------|
| `EXPO_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID` | valoarea din RevenueCat pentru app **Android** (de obicei `goog_...`) |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | valoarea din RevenueCat pentru app **iOS** (de obicei `appl_...`) |
| `EXPO_PUBLIC_PAYWALL_ENABLED` | `true` sau `false` |

La build, EAS pune aceste secrets în `process.env`; `app.config.ts` citește din `process.env` și le pune în `extra`, deci app-ul le primește la runtime.

---

## 4. Verificare că variabilele sunt setate corect

### Pe PC (fișierul .env)
Din root-ul proiectului:
```bash
node scripts/check-env.js
```
Verifică că toate variabilele obligatorii există și nu sunt goale (nu afișează valorile).

### În EAS (pentru build-uri)
Listează variabilele pentru production:
```bash
eas env:list --environment production
```
Verifică că apar **toate** aceste nume (valorile nu se afișează pentru cele setate ca secret):
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID`
- `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` (dacă faci și iOS)
- `EXPO_PUBLIC_PAYWALL_ENABLED`

Poți verifica și din browser: [expo.dev](https://expo.dev) → Projects → medvba → **Environment variables** → Production.

### Ștergere variabilă (dacă ai greșit valoarea)
```bash
eas env:delete --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID
```
Apoi creezi din nou cu `eas env:create`.

---

## 5. Rezumat rapid

- **Pe PC (develop):** completezi **`.env`** cu toate variabilele; folosești pentru `expo start` / build local.
- **Pentru Google Play (EAS Build în cloud):** pui **Environment variables** / secretele EAS cu aceleași nume și valori (fie din terminal cu `eas env:create`, fie din Expo Dashboard → Environment variables).
- **RevenueCat:** în app și în EAS pui doar **Public API key** – pentru Android cea din RevenueCat pentru aplicația Android (de obicei `goog_...`), pentru iOS cea pentru aplicația iOS (de obicei `appl_...`). Copiezi exact ce îți arată RevenueCat.

După ce setezi secrets, rulezi `eas build --platform android --profile production` și build-ul va avea toate variabilele necesare pentru Google Play.
