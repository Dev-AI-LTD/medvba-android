# Kinde email login — checklist (manual)

Pentru review App Store și contul `contact@devaieood.com`.

## Kinde dashboard

1. **Authentication → Email** — connection activ, Connection ID = `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID` din EAS production.
2. **Applications → MEDVBA native** — Email connection atașată la app.
3. **User** `contact@devaieood.com` — există, email verificat, parolă setată.
4. Dacă apare „Enter a valid email” pe pagina Kinde — verifică restricții domeniu / allowlist; nu folosi `login_hint` din app (build 57+ nu mai trimite email din app).

## Railway

- `KINDE_ISSUER_URL` = `https://devaieoodltd.kinde.com` (sau tenantul tău)
- `KINDE_CLIENT_ID` / `KINDE_CLIENT_SECRET` = același client ca în app
- `SUPABASE_JWT_SIGNING_SECRET` setat
- Redeploy după modificări env

## Verificare locală

```powershell
cd medvba-android
npm run verify:auth-session
# După login hosted, cu token în .env:
# VERIFY_KINDE_ACCESS_TOKEN=...
npm run verify:auth-session-bearer
```
