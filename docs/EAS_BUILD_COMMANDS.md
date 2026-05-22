# EAS Build – comenzi și ce trebuie completat

**Prioritate iOS (App Store):** checklist complet în [`PRE_LAUNCH_CHECKLIST_APP_STORE.md`](PRE_LAUNCH_CHECKLIST_APP_STORE.md). Metadata: [`app-store-metadata-en.md`](app-store-metadata-en.md).

Rulează **tot** din folderul `medvba-android` (unde sunt `eas.json` și `package.json`).

---

## 1. Pregătire (o singură dată)

### Instalare EAS CLI
```bash
npm install -g eas-cli
```

### Login Expo
```bash
eas login
```
- Introdu email și parola contului Expo (sau creează cont pe [expo.dev](https://expo.dev)).

### Configurare proiect
```bash
eas build:configure
```
- Dacă proiectul e deja legat de EAS (ai `projectId` în app.config), nu mai e nevoie de pași suplimentari.

---

## 2. Variabile de mediu (ce trebuie completat)

App-ul citește din **`.env`** sau **`.env.local`** (și din EAS Secrets la build). Completează valorile reale.

### Fișier `.env` în root-ul proiectului

Creează sau editează `c:\Users\octav\Desktop\meduba last\medvba-android\.env`:

```env
# Supabase (login, progres)
EXPO_PUBLIC_SUPABASE_URL=https://XXXXXXXX.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....

# RevenueCat (abonamente Android)
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=appl_xxxxxxxxxxxxx

# RevenueCat iOS (dacă faci și build iOS)
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=goog_xxxxxxxxxxxxx

# Paywall activ în build (true = da, false = nu)
EXPO_PUBLIC_PAYWALL_ENABLED=true

# Opțional – URL backend tRPC (alias istoric EXPO_PUBLIC_RORK_API_BASE_URL = același lucru)
EXPO_PUBLIC_API_BASE_URL=https://your-api.example.com
```

**Unde găsești valorile:**
- **Supabase:** Dashboard Supabase → Settings → API → Project URL și anon public key.
- **RevenueCat Android:** RevenueCat → Project → API Keys → Android (Public app-specific API key).
- **RevenueCat iOS:** idem, iOS key (pentru build iOS).

---

## 3. EAS Secrets (pentru build în cloud, fără .env în repo)

Dacă nu vrei să pui `.env` în git, setezi variabilele direct în EAS:

```bash
# Supabase
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://XXXXXXXX.supabase.co" --scope project
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIs..." --scope project

# RevenueCat Android
eas secret:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID --value "appl_xxxxxxxxxxxxx" --scope project

# RevenueCat iOS (dacă folosești)
eas secret:create --name EXPO_PUBLIC_REVENUECAT_API_KEY_IOS --value "goog_xxxxxxxxxxxxx" --scope project

# Paywall
eas secret:create --name EXPO_PUBLIC_PAYWALL_ENABLED --value "true" --scope project
```

**Vizualizare / ștergere:**
```bash
eas secret:list
eas secret:delete --name EXPO_PUBLIC_SUPABASE_URL
```

La **build**, EAS pune aceste variabile în `process.env`, iar `app.config.ts` le citește (din env), deci nu e nevoie să le mai pui și în `.env` pe mașina de build.

---

## 4. Comenzi de build

Rulezi din **root-ul proiectului** `medvba-android` (unde e `eas.json` și `app.config.ts`).

### Build iOS (App Store / TestFlight) — prioritar

**Production (submit review):**
```bash
cd medvba-android
eas build --platform ios --profile production
```

**Internal (TestFlight beta, același channel internal):**
```bash
eas build --platform ios --profile internal
```

Prima dată: terminal **interactiv** pentru Apple Developer credentials (certificat, provisioning). După build:

```bash
eas submit --platform ios --profile production --latest
```

Verifică înainte: `eas env:list --environment production` — obligatoriu `EXPO_PUBLIC_REVENUECAT_API_KEY_IOS`, `EXPO_PUBLIC_PAYWALL_ENABLED=true`, Kinde + `EXPO_PUBLIC_KINDE_APPLE_CONNECTION_ID`.

---

### Build Android (AAB pentru Google Play)

**Profil internal (testare):**
```bash
eas build --platform android --profile internal
```

**Profil production (pentru store):**
```bash
eas build --platform android --profile production
```

La întrebări:
- **Generate a new Android Keystore?** – prima dată alegi **Yes**; EAS îl stochează. La build-uri următoare **No**.
- Dacă ceri credentials (keystore / service account), urmează pașii din terminal.

### Build ambele platforme

```bash
eas build --platform all --profile production
```

### Build local (pe mașina ta, fără EAS cloud)

```bash
eas build --platform android --profile production --local
```

- Trebuie Android SDK / Xcode instalat; build-ul rulează pe PC, nu pe serverele EAS.

---

## 5. După build – descărcare și submit

### Lista build-uri
```bash
eas build:list
```

### Descărcare AAB (Android)
- În [expo.dev](https://expo.dev) → proiectul tău → Builds → click pe build → Download.
- Sau din linkul din terminal după ce build-ul se termină.

### Submit pe Google Play (din EAS)

După ce ai AAB-ul și ai în Play Console aplicația creată (și pachetul `com.devaieood.medvba`):

```bash
# Trimite ultimul build production la Google Play (track production)
eas submit --platform android --profile production --latest

# Sau un build anume (ID-ul îl vezi în eas build:list)
eas submit --platform android --id BUILD_ID --profile production
```

**Prima dată** ți se va cere un **Service Account** (JSON) din Google Play Console:
- Play Console → Setup → API access → Link app → Create service account → descarci JSON.
- Apoi: `eas credentials` sau la `eas submit` urmezi pașii pentru a atașa acel JSON.

---

## 6. Rezumat – ce completezi unde

| Ce completezi | Unde |
|---------------|------|
| **EXPO_PUBLIC_SUPABASE_URL** | `.env` sau `eas secret:create` |
| **EXPO_PUBLIC_SUPABASE_ANON_KEY** | `.env` sau `eas secret:create` |
| **EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID** | `.env` sau `eas secret:create` |
| **EXPO_PUBLIC_REVENUECAT_API_KEY_IOS** | `.env` sau `eas secret:create` (dacă faci iOS) |
| **EXPO_PUBLIC_PAYWALL_ENABLED** | `true` sau `false` în `.env` / EAS secret |
| **Keystore Android** | Generat de EAS la primul build (sau încărcat tu) |
| **Google Play Service Account** | La primul `eas submit` (JSON din Play Console) |

---

## 7. Comenzi rapide — iOS (copy-paste)

```bash
cd medvba-android
eas login
eas env:list --environment production
eas build --platform ios --profile production
eas submit --platform ios --profile production --latest
eas build:list
```

## 8. Comenzi rapide — Android (după iOS)

```bash
cd medvba-android
eas build --platform android --profile production
eas submit --platform android --profile production --latest
```

După ce completezi variabilele în EAS env **production** (vezi [`ENV_AND_EAS_SECRETS.md`](ENV_AND_EAS_SECRETS.md)), poți lansa build iOS, apoi Android.
