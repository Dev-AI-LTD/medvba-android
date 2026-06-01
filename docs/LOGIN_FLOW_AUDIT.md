# Login flow audit — MEDVBA (2026-05-26)

## Verdict

| Build | Email hosted | Loading infinit | Notă |
|-------|--------------|-----------------|------|
| **53** | Adesea lipsește `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID` în IPA | Da (overlay + Kinde agățat) | Doar Apple/Google |
| **54** | Posibil OK (env EAS) | **Da** — fără fix-uri overlay / Kinde cleanup | Același commit git ca 53 |
| **54** | — | **Nu se deschide** — overlay + Kinde fără JWT MEDVBA |
| **56** | — | Login eșuează la exchange JWT + UI complicat |
| **57** (repo) | OK dacă env în EAS + Railway redeploy | 3 butoane Kinde, fără email în app, mesaje corecte |

---

## Flux corect (TestFlight / producție)

1. **Apple** sau **Google** → Kinde PKCE → browser → înapoi în app.
2. **Email:** câmp email în app → **„Sign in with email”** → browser **Kinde** → parola **acolo** (nu în app).
3. `__DEV__` singur: parolă în app (ROPC) — Kinde **nu** suportă ROPC în producție.

---

## Probleme găsite în cod

### P0 — Loading infinit / app „nu se deschide”

| # | Cauză | Unde |
|---|--------|------|
| 1 | `isAuthBusy` = `kinde.isAuthenticated && !isAuthenticated` rămâne true după **Anulare** Kinde sau eșec exchange | `AuthProvider.tsx` |
| 2 | La **cancel** hosted OAuth **nu** se apelează `kinde.logout()` | `completeHostedKindeAuth` |
| 3 | `useProtectedRoute` blochează navigarea cât timp `isAuthBusy` (inclusiv pe login) | `_layout.tsx` |
| 4 | Overlay full-screen pe non-auth (fix parțial: `!inAuthGroup`) | `_layout.tsx` |

### P1 — Mesaje înșelătoare

| # | Cauză | Unde |
|---|--------|------|
| 5 | Erori 502 / session exchange mapate la „folosește Apple/Google” (ROPC) | `login.tsx` `mapAuthScreenError` |
| 6 | Build fără `EMAIL_CONNECTION_ID` → `productionEmailSignInHint` fără buton email | `login.tsx` + EAS env |

### P2 — Edge cases

| # | Cauză | Unde |
|---|--------|------|
| 7 | Face ID: anulare = overlay rămâne (există „Încearcă din nou”) | `BiometricLockGate.tsx` |
| 8 | Forgot password = API separat (OK pentru review) | `forgot-password.tsx` |

---

## Ce e deja OK

- `hideInAppPasswordAuth = !__DEV__` pe release.
- Redirect ROPC → hosted când `isEmailHostedAuthEnabled` (`handleEmailAuth`).
- `kinde.logout` la eșec exchange / fără token după hosted (parțial).
- Bootstrap timeout 45s; sync Kinde timeout 25s.
- Sign in with Apple (iOS) + Google.
- Delete account + subscription note.

---

## Fix-uri aplicate (build 56+)

1. `useProtectedRoute`: `isAuthBusy` **nu blochează** rutele `(auth)` (login vizibil + redirect după succes).
2. `completeHostedKindeAuth`: `kinde.logout` și la **cancel** OAuth.
3. `signInWithKindeHosted` / `signUpWithKindeHosted`: `finally` cleanup Kinde dacă nu există JWT MEDVBA.
4. `mapAuthScreenError`: mesaj separat pentru eșec session exchange (nu ROPC).
5. **`reconcileStaleKindeSession`** la sfârșitul auth bootstrap — rezolvă loading infinit la deschidere (build 54).

---

## Test manual (build 55)

- [ ] Login Apple / Google
- [ ] Email → Sign in with email → Kinde → parolă pe Kinde
- [ ] Anulare Kinde → rămâi pe login, poți reîncerca (fără spinner blocat)
- [ ] Backend oprit → mesaj clar, nu loading infinit
- [ ] Face ID ON → cold start → deblocare / Try again

`ios.buildNumber`: **56** (incrementează la fiecare upload ASC).

## Workaround pe build 54 (până la 56)

Șterge app-ul de pe iPhone și reinstalează din TestFlight — poate șterge sesiunea Kinde blocată din Keychain. Dacă tot nu merge, așteaptă build **56**.
