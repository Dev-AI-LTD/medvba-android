# TestFlight — MEDVBA (iOS)

Rulează tot din `medvba-android`. Cont Expo: **devaieood79** (proiect EAS `667a66db-a3be-4c1e-b7da-8ad212c92bb4`).

---

## Înainte de build (obligatoriu)

### 1. Apple Developer + App Store Connect

- [ ] Cont [Apple Developer Program](https://developer.apple.com/programs/) activ (99 USD/an)
- [ ] [App Store Connect](https://appstoreconnect.apple.com) → **Apps** → app **MEDVBA** (sau creează una nouă)
- [ ] Bundle ID: **`com.devaieood.medvba`** (trebuie să existe în [Certificates, Identifiers](https://developer.apple.com/account/resources/identifiers/list))
- [ ] Capability **Sign in with Apple** pe App ID

### 2. EAS env `production` (Expo Dashboard → medvba → Environment variables → production)

Verifică:

```powershell
cd C:\Users\octav\Desktop\MEDVBA3\medvba-android
eas env:list --environment production
```

**Minim pentru TestFlight:**

| Variabilă | Obligatoriu |
|-----------|-------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Da |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Da |
| `EXPO_PUBLIC_RORK_API_BASE_URL` sau `EXPO_PUBLIC_API_BASE_URL` | Da (HTTPS Railway) |
| `EXPO_PUBLIC_KINDE_ISSUER_URL` | Da |
| `EXPO_PUBLIC_KINDE_CLIENT_ID` | Da |
| `EXPO_PUBLIC_KINDE_GOOGLE_CONNECTION_ID` | Da |
| `EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID` | Da |
| `EXPO_PUBLIC_KINDE_EMAIL_CONNECTION_ID` | Recomandat (email în browser) |
| `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` | Da — **obligatoriu `appl_…` (production), NU `test_…`** |
| `EXPO_PUBLIC_PAYWALL_ENABLED` | `true` |

Copiază valorile din `.env` local (nu comite `.env`):

```powershell
npm run check:kinde-ios
npm run check:kinde-auth
npm run check:revenuecat-ios
```

Adaugă lipsuri în Expo (sau CLI):

```powershell
eas env:create --name EXPO_PUBLIC_KINDE_ISSUER_URL --value "https://devaieoodltd.kinde.com" --type string --environment production
# Repetă pentru fiecare variabilă lipsă; sau bulk în expo.dev → Project → Environment variables
```

### 3. Incrementează build iOS

În `app.config.ts`, la fiecare upload TestFlight:

- `ios.buildNumber` → +1 (ex. `49` → `50`)

`version` (`1.0.30`) rămâne până la release notes majore.

### 4. Supabase

- [ ] Migrarea `017_user_reports.sql` aplicată
- [ ] Railway backend redeployat (după ultimul push git)

---

## Build IPA (EAS cloud)

```powershell
cd C:\Users\octav\Desktop\MEDVBA3\medvba-android
eas login
eas build --platform ios --profile production
```

**Prima dată iOS:** terminalul va cere:

1. Apple ID (Developer)
2. Generare / alegere **Distribution Certificate**
3. **Provisioning Profile** pentru `com.devaieood.medvba`

Alege **Let EAS handle credentials** (recomandat).

Build durează ~15–25 min. Urmărește: [expo.dev](https://expo.dev) → Projects → medvba → Builds.

---

## Upload la TestFlight

După build **Finished**:

```powershell
eas submit --platform ios --profile production --latest
```

**Prima dată submit:** îți cere una din:

- **App Store Connect API Key** (recomandat) — App Store Connect → Users and Access → Integrations → App Store Connect API → Generate → descarcă `.p8`, notează Key ID și Issuer ID
- sau Apple ID + app-specific password

Opțional în `eas.json` (submit mai rapid data viitor):

```json
"ios": {
  "bundleIdentifier": "com.devaieood.medvba",
  "ascAppId": "1234567890"
}
```

`ascAppId` = număr din App Store Connect → App Information → **Apple ID** (nu bundle id).

---

## În App Store Connect (după submit)

1. **TestFlight** tab → buildul apare în ~5–30 min („Processing”)
2. Dacă apare **Export Compliance**: ai `ITSAppUsesNonExemptEncryption: false` — răspunde **No** (doar HTTPS standard)
3. **Missing Compliance** → poți seta automat în App Store Connect pentru versiuni viitoare
4. **Internal Testing** → creează grup → adaugă testeri (email Apple ID)
5. Testerii instalează app **TestFlight** din App Store și acceptă invitația

---

## Test manual pe TestFlight (înainte de Review)

| # | Verificare |
|---|------------|
| 1 | Sign in with **Apple** |
| 2 | Sign in with **Google** |
| 3 | **Sign in with email** → browser Kinde → login |
| 4 | Quiz + Study + Tutor |
| 5 | Chat + Report user |
| 6 | Paywall + Restore purchases (Sandbox Apple ID) |
| 7 | Ștergere cont (Settings) |

Sandbox IAP: App Store Connect → Users and Access → **Sandbox** → Sandbox Tester.

---

## Review Notes (când trimiți la Apple)

Copiază blocul **Primary** din [`app-store-metadata-en.md`](app-store-metadata-en.md). Username/Password gol dacă folosești Apple/Google/email hosted.

---

## RevenueCat: „Wrong API Key” (TestFlight)

Dacă vezi modalul **Wrong API Key** și app-ul se închide, build-ul folosește cheie **test** (`test_…`) în loc de **production** (`appl_…`).

1. [RevenueCat](https://app.revenuecat.com) → Project → **API keys** → app iOS → copiază **Public API key** (`appl_…`, nu Test Store).
2. Actualizează EAS production (înlocuiește `test_eTw…`):

```powershell
cd C:\Users\octav\Desktop\MEDVBA3\medvba-android
eas env:update production --variable-name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value "appl_PASTE_YOUR_KEY_HERE" --non-interactive
eas env:list --environment production
```

3. Incrementează `ios.buildNumber` în `app.config.ts`, apoi **rebuild obligatoriu** (cheia e încorporată la build):

```powershell
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```

**Workaround temporar** (fără IAP, doar login/quiz): `EXPO_PUBLIC_PAYWALL_ENABLED=false` în EAS production + rebuild.

---

## Probleme frecvente

| Problemă | Soluție |
|----------|---------|
| **Wrong API Key** / app se închide la launch | `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS` = `appl_…` în EAS production, rebuild |
| Login nu merge în TestFlight | Lipsesc `EXPO_PUBLIC_KINDE_*` în EAS production — rebuild |
| Paywall gol | `appl_` key + produse Ready în App Store Connect + offerings în RevenueCat |
| Build credentials failed | `eas credentials` → iOS → reset și regenerează |
| Submit „No suitable build” | `eas build:list` → `eas submit --id BUILD_ID` |

---

## Comenzi rapide (copy-paste)

```powershell
cd C:\Users\octav\Desktop\MEDVBA3\medvba-android
eas env:list --environment production
npm run check:kinde-ios
npm run check:revenuecat-ios
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
```
