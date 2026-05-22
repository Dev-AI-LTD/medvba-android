# Sign in with Apple — Kinde + Apple Developer (MEDVBA)

Tenant: `devaieoodltd.kinde.com` · Team ID: `3L7H3SZXM3` · Bundle: `com.devaieood.medvba` · Services ID (ex.): `com.devaieood.medvba.auth`

---

## Nu confunda cele 3 tipuri de URL

| Câmp Apple / Kinde | Unde | Exemplu MEDVBA | Pentru login? |
|--------------------|------|-----------------|---------------|
| **Return URLs** | Services ID → Sign in with Apple → Configure | `https://devaieoodltd.kinde.com/login/callback` | **Da** (obligatoriu) |
| **Domains and Subdomains** | Același ecran Services ID | `devaieoodltd.kinde.com` (fără `https://`) | **Da** |
| **Server-to-Server Notification Endpoint** | App ID → Sign in with Apple (sau grup) | **Gol** la început | **Nu** (webhook separat) |
| **Allowed callback URLs** | Kinde → Applications → native | `medvba://*` | **Da** (app Expo) |

**Nu pune** callback Kinde (`/login/callback`) sau `medvba://` la **Server-to-Server Notification Endpoint**.

---

## 1. Services ID — Return URLs (obligatoriu pentru login)

### 1a. Copiază Callback URL din Kinde

1. [Kinde](https://app.kinde.com) → **Settings → Environment → Authentication**
2. Tile **Apple** → **Configure** (sau secțiunea **Callback URL** pe tile)
3. Copiază URL-ul (ex. `https://devaieoodltd.kinde.com/login/callback`)

### 1b. Apple Developer → Services ID

1. [developer.apple.com](https://developer.apple.com) → **Identifiers** → Services ID `com.devaieood.medvba.auth` (sau al tău)
2. **Sign in with Apple** → **Configure**
3. **Domains and Subdomains:** `devaieoodltd.kinde.com`
4. **Return URLs:** lipește **exact** Callback URL din Kinde (pas 1a)
5. **Save** → **Continue** → **Done**

---

## 2. Server-to-Server Notification Endpoint (lasă gol)

Câmpul din Apple („Sign in with Apple server-to-server notifications”) trimite evenimente către **serverul tău** când utilizatorii:

- schimbă preferințe email relay (Hide My Email),
- șterg contul în app,
- șterg contul Apple.

**Pentru login Apple + Kinde nu e necesar.** [Ghidul Kinde Apple](https://docs.kinde.com/authenticate/social-sign-in/apple/) nu cere acest URL.

### Ce faci acum

- **Lasă câmpul gol** și salvează, dacă Apple permite.
- MEDVBA **nu** are handler backend pentru notificări Apple ([`backend/`](../backend/) — fără rută S2S).

### Dacă Apple obligă un URL

Nu inventa un URL care dă 404. Variante viitoare:

- Endpoint Railway (de implementat): `https://medvba-android-production.up.railway.app/api/auth/apple/notifications`
- Documentație Apple: [Processing changes for Sign in with Apple accounts](https://developer.apple.com/documentation/signinwithapple/processing-changes-for-sign-in-with-apple-accounts)

---

## 3. Cheie `.p8` + credențiale Kinde

### Apple Developer — Keys

1. **Keys** → **+** → **Sign in with Apple** → App ID `com.devaieood.medvba`
2. **Download** `AuthKey_XXXXX.p8` (o singură dată)
3. Notează **Key ID** (≠ Team ID `3L7H3SZXM3`)

### Kinde → Apple connection

| Câmp Kinde | Valoare |
|------------|---------|
| Client ID | Services ID: `com.devaieood.medvba.auth` |
| Team ID | `3L7H3SZXM3` |
| Key ID | din Keys (ex. 10 caractere) |
| Private key | conținut `.p8` sau JWT de la `npm run apple:jwt-supabase` |

JWT local:

```powershell
$env:APPLE_TEAM_ID="3L7H3SZXM3"
$env:APPLE_KEY_ID="KEY_ID_DIN_KEYS"
$env:APPLE_SERVICES_ID="com.devaieood.medvba.auth"
$env:APPLE_PRIVATE_KEY_PATH="C:\cale\reala\AuthKey_KEY_ID.p8"
npm run apple:jwt-supabase
```

### `.env` Expo

```env
EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID=conn_xxxxxxxx
```

Connection ID din Kinde → Apple → Configure (nu Services ID, nu Team ID).

### App native Kinde

**Settings → Applications** → app native → **Authentication** → **Apple ON** · callbacks `medvba://*`

---

## 4. Verificare

```bash
npm run check:kinde-ios
npm run check:kinde-auth
```

Test login **Apple** pe **iPhone** (sau build iOS), nu doar Android dev.

---

## Legături

- [KINDE_IOS_EXPO_SETUP.md](KINDE_IOS_EXPO_SETUP.md)
- [KINDE_ROPC_NOT_SUPPORTED.md](KINDE_ROPC_NOT_SUPPORTED.md)
- [APPLE_REVIEW_AUTH.md](APPLE_REVIEW_AUTH.md)
