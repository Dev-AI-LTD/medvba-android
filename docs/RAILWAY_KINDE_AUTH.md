# Railway: variabile Kinde pentru email + parolă

Backend-ul ([`backend/auth/session-routes.ts`](../backend/auth/session-routes.ts)) apelează Kinde `grant_type=password` — **doar pe server**.

## Variabile obligatorii (service API)

| Variabilă | Valoare |
|-----------|---------|
| `KINDE_ISSUER_URL` | `https://devaieoodltd.kinde.com` (fără slash final) |
| `KINDE_CLIENT_ID` | = `EXPO_PUBLIC_KINDE_CLIENT_ID` (app **native**, nu M2M) |
| `KINDE_CLIENT_SECRET` | Secret din Kinde → Applications → native app → **Client secret** |

**Nu** folosi `KINDE_M2M_CLIENT_SECRET` sau secretul aplicației Machine-to-Machine ca `KINDE_CLIENT_SECRET`.

Opțional: `KINDE_AUDIENCE` dacă e configurat în Kinde.

## După modificare

1. **Redeploy** serviciul Railway (Variables → Deploy)
2. Local:
   ```bash
   npm run diagnose:kinde-password
   npm run verify:auth-session
   ```

- Dacă `diagnose` = ✅ dar `verify:auth-session` = 401 → secret greșit pe Railway sau redeploy lipsă
- Dacă ambele = 502 → ticket Kinde (password grant)

## App (Expo)

`EXPO_PUBLIC_API_BASE_URL` trebuie să pointeze la același Railway production URL.
