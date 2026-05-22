# Kinde Support — password grant 502 (închis)

## Răspuns Kinde (2026)

**ROPC (`grant_type=password`) nu este suportat** pe infrastructura Kinde. HTTP 502 = proxy fără rută pentru acest grant; **nu** se va „repara” cu redeploy.

Alternative oficiale: **authorization code + PKCE** (native), **passwordless** (magic link/OTP).

Detalii proiect: **[KINDE_ROPC_NOT_SUPPORTED.md](KINDE_ROPC_NOT_SUPPORTED.md)**.

---

## Template istoric (doar referință)

Copiază în ticket când `npm run diagnose:kinde-password` returnează **HTTP 502** (înainte de confirmarea de mai sus).

---

**Subject:** Password grant (`grant_type=password`) returns 502 on `/oauth2/token` — tenant `devaieoodltd`

**Body:**

Hello,

Our tenant **`devaieoodltd.kinde.com`** cannot complete the Resource Owner Password Credentials flow.

**Request:**
```
POST https://devaieoodltd.kinde.com/oauth2/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
username=<user email>
password=<password>
client_id=<native application client_id>
client_secret=<native application client_secret>
```

**Response:** HTTP **502 Bad Gateway** (HTML error page, not JSON).

**Notes:**
- Same endpoint with `grant_type=client_credentials` (M2M client) returns **HTTP 200**.
- Native mobile app (Expo/React Native); email+password sign-in is implemented server-side only (client secret not in the app).
- We need password grant enabled for App Store review (in-app email + password, no OTP).

**Application:** Native app MEDVBA (client_id matches our Expo `EXPO_PUBLIC_KINDE_CLIENT_ID`).

Please advise if password grant is disabled for our plan/tenant or if this is an incident on your side.

Thank you.

---

După fix Kinde:

```bash
npm run diagnose:kinde-password
npm run verify:auth-session
npm run create:review-user
```

Apoi folosește **Alternate** Review Notes din [app-store-metadata-en.md](app-store-metadata-en.md).
