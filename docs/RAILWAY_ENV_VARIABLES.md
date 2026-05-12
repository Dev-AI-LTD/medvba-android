# Variabile pe Railway (backend)

Backend-ul (Hono + tRPC) rulează pe Railway. Iată cum verifici și ce variabile trebuie setate.

Logica AI pentru **Tutor** este în `lib/ai-provider.ts`, apelată doar din `backend/trpc/tutor.ts`. Cheia **OpenAI nu** trebuie setată ca `EXPO_PUBLIC_*` (s-ar împacheta în aplicația client). Pe Railway folosește **`AI_API_KEY`** sau **`OPENAI_API_KEY`**.

`backend/hono.ts` (`GET /health`) raportează `hasAiApiKey` doar pentru `AI_API_KEY` / `OPENAI_API_KEY`. Dacă încă ai `EXPO_PUBLIC_AI_API_KEY` într-un fișier `.env` local, `/health` setează `legacyExpoPublicAiKeyPresent: true` — **șterge** acea variabilă și folosește doar `AI_API_KEY` / `OPENAI_API_KEY` pe server; **nu** seta `EXPO_PUBLIC_AI_API_KEY` pe Railway.

---

## Cum verifici variabilele pe Railway

### Din browser (Railway Dashboard)
1. Mergi pe **[railway.app](https://railway.app)** și intră în cont.
2. Deschide **proiectul** în care e deployat MEDVBA (backend).
3. Click pe **serviciul** (service) care rulează backend-ul.
4. Tab **Variables** (sau **Settings** → **Variables**).
5. Acolo vezi toate variabilele setate; poți edita sau adăuga.

### Din terminal (Railway CLI)
```bash
# Instalare CLI (dacă nu e instalat)
npm install -g @railway/cli

# Login
railway login

# Legare proiect (din root-ul repo-ului)
railway link

# Listare variabile (numele variabilelor, nu valorile sensibile)
railway variables
```

---

## Ce variabile trebuie să fie setate

| Variabilă | Obligatoriu | Descriere |
|-----------|-------------|-----------|
| **PORT** | Setat de Railway | Railway îl setează automat la deploy. Nu e nevoie să îl pui tu. |
| **SUPABASE_URL** | Da | URL proiect Supabase: `https://xxxxx.supabase.co` (același proiect ca în app; numele variabilei **fără** prefix `EXPO_PUBLIC_`). |
| **SUPABASE_SERVICE_ROLE_KEY** | Da | Cheia **service_role** (secret) din Supabase → Settings → API. **Nu** folosi anon/publishable aici. |
| **AI_API_KEY** sau **OPENAI_API_KEY** | Da, dacă folosești Tutor | Cheie OpenAI (`sk-...`). **`lib/ai-provider.ts`** le citește direct pe server. |
| **AI_BASE_URL** | Opțional | URL compatibil OpenAI (ex. `https://api.openai.com/v1`). Implicit în cod: `https://api.openai.com/v1`. |
| **AI_MODEL** | Opțional | Model chat (implicit `gpt-4o-mini`). |
| **CORS_ALLOWED_ORIGINS** | Opțional | Origini extra permise (separate prin virgulă). |

### Fallback-uri (doar afișare în `/health`)

`backend/hono.ts` poate raporta în `/health` și variabile `EXPO_PUBLIC_AI_PROVIDER`, `EXPO_PUBLIC_AI_BASE_URL`, `EXPO_PUBLIC_AI_MODEL` dacă există în mediu — **doar pentru diagnostic**. **`lib/ai-provider.ts`** (Tutor) folosește pentru apeluri **`AI_API_KEY` / `OPENAI_API_KEY`**, **`AI_BASE_URL`**, **`AI_MODEL`** (fără cheie în `EXPO_PUBLIC_*`). **Nu** documentăm `EXPO_PUBLIC_AI_API_KEY` pentru backend — **nu există** în cod pentru cheie; folosește `AI_API_KEY` / `OPENAI_API_KEY`.

**Notă:** `EXPO_PUBLIC_RORK_API_BASE_URL` rămâne un **nume istoric** în client pentru URL-ul API tRPC (același rol ca `EXPO_PUBLIC_API_BASE_URL`), nu pentru Tutor.

---

## Variabile pentru AI Tutor (exemplu Railway)

**Exemplu în Railway Dashboard (Variables):**

- `SUPABASE_URL` = `https://your-project.supabase.co`
- `SUPABASE_SERVICE_ROLE_KEY` = cheia **service_role** din Supabase (Settings → API)
- `AI_API_KEY` = `sk-proj-...` (cheie OpenAI)
- `AI_BASE_URL` = `https://api.openai.com/v1` (opțional)
- `AI_MODEL` = `gpt-4o-mini` (opțional)
- `CORS_ALLOWED_ORIGINS` = dacă e nevoie, ex. `https://your-frontend-domain.com`

---

## Verificare rapidă

- În **Railway Dashboard** → serviciul tău → **Variables**: trebuie să vezi cel puțin **SUPABASE_URL** și **SUPABASE_SERVICE_ROLE_KEY**.
- Dacă lipsește una, backend-ul poate da eroare la ștergere cont sau la alte operații care folosesc Supabase admin.
- `GET /health` pe deploy: `env.hasAiApiKey` trebuie `true` dacă vrei Tutor OpenAI funcțional.

**Notă:** Pe Railway pui **SUPABASE_SERVICE_ROLE_KEY** și **AI_API_KEY** / **OPENAI_API_KEY** (doar server). În aplicația Expo / EAS folosești **EXPO_PUBLIC_SUPABASE_ANON_KEY**, nu service_role și **nu** chei OpenAI în `EXPO_PUBLIC_*`.
