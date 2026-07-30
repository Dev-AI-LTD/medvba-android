# Variabile pe Railway (backend)

Backend-ul (Hono + tRPC) rulează pe Railway. Iată cum verifici și ce variabile trebuie setate.

Logica AI pentru **Tutor** este în `lib/ai-provider.ts` → `generateText`, apelată din `backend/trpc/tutor.ts`. Cheia **OpenAI nu** trebuie setată ca `EXPO_PUBLIC_*`.

**Clinical** folosește același fișier prin `generateClinicalText` / stream: dacă `AI_PROVIDER=muse`, citește **doar** `META_MODEL_*` (fără fallback la OpenAI când cheia Meta lipsește). Tutor **nu** citește `META_MODEL_*`.

`GET /health` public: `status`, `clinicalCopilotEnabled`, opțional `version` — **fără** chei, URL provider, model.  
`GET /health/ready`: Bearer `INTERNAL_HEALTH_SECRET` → `aiProvider`, `hasMetaModelApiKey` (booleans).

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
| **AI_API_KEY** sau **OPENAI_API_KEY** | Da, dacă folosești Tutor | Cheie OpenAI pentru **Tutor clasic**. **`generateText`** le citește pe server. Nu folosi `EXPO_PUBLIC_*`. |
| **AI_BASE_URL** | Opțional | URL OpenAI-compatible pentru Tutor / Clinical când `AI_PROVIDER` ≠ `muse`. |
| **AI_MODEL** | Opțional | Model Tutor (implicit `gpt-4o-mini`). |
| **AI_PROVIDER** | Pentru Clinical Muse | Exact `muse` pentru Meta Muse pe Clinical. Absent / `openai` = path OpenAI. **Nu** selecta Muse doar pentru că există `META_MODEL_API_KEY`. |
| **META_MODEL_API_KEY** | Obligatoriu dacă `AI_PROVIDER=muse` | Cheie Meta Model API (Railway only). Lipsă cheie → eroare configurare, **fără** fallback OpenAI. |
| **META_MODEL_API_BASE_URL** | Obligatoriu dacă Muse | Base URL OpenAI-compatible (`…/v1`). Alias: `META_MODEL_BASE_URL`. |
| **META_MODEL_NAME** | Opțional | Implicit `muse-spark-1.1`. |
| **INTERNAL_HEALTH_SECRET** | Pentru `/health/ready` | Bearer secret. Public `GET /health` rămâne minimal (fără provider/key hints). |
| **CORS_ALLOWED_ORIGINS** | Opțional | Origini extra permise (separate prin virgulă). |
| **CLINICAL_COPILOT_ENABLED** | Pentru TestFlight Clinical | `true` pe staging/internal API. **Implicit false** — store UI nu apelează Clinical când Expo flag e off. |
| **UPSTASH_REDIS_REST_URL** + **UPSTASH_REDIS_REST_TOKEN** | Rate limit distribuit (recomandat) | Sliding window partajat între replici Railway pentru Clinical/tutor AI. |
| **REDIS_URL** | Alternativă la Upstash | `redis://…` — același store rate limit dacă Upstash lipsește. |
| **RATE_LIMIT_MEMORY_FALLBACK** | Doar dev/staging temporar | `true` permite Map in-memory când Redis lipsește (nu pentru producție multi-instance). |

### Clinical Copilot pe Railway (TestFlight)

1. Asigură-te că ultimile commit-uri cu `backend/trpc/clinical.ts` sunt pe branch-ul pe care Railway îl deploy-uiește.
2. Variables → adaugă **`CLINICAL_COPILOT_ENABLED=true`**.
3. **Redeploy** serviciul (Deployments → Redeploy).
4. Smoke: din app TestFlight (profil `internal`) → Clinical → Chest pain → răspuns AI.

Store builds cu `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED=false` nu arată UI Clinical; Tutor clasic rămâne neschimbat.

`backend/hono.ts` poate raporta în `/health` și variabile `EXPO_PUBLIC_AI_PROVIDER`, `EXPO_PUBLIC_AI_BASE_URL`, `EXPO_PUBLIC_AI_MODEL` dacă există în mediu — **doar pentru diagnostic**. **`lib/ai-provider.ts`** (Tutor) folosește pentru apeluri **`AI_API_KEY` / `OPENAI_API_KEY`**, **`AI_BASE_URL`**, **`AI_MODEL`** (fără cheie în `EXPO_PUBLIC_*`). **Nu** documentăm `EXPO_PUBLIC_AI_API_KEY` pentru backend — **nu există** în cod pentru cheie; folosește `AI_API_KEY` / `OPENAI_API_KEY`.

**Notă:** `EXPO_PUBLIC_RORK_API_BASE_URL` rămâne un **nume istoric** în client pentru URL-ul API tRPC (același rol ca `EXPO_PUBLIC_API_BASE_URL`), nu pentru Tutor.

---

## Troubleshooting după redeploy

### `NET::ERR_NAME_NOT_RESOLVED` la `…kinde.com/oauth2/auth`

- URL-ul issuer trebuie să fie exact **`https://subdomeniu.kinde.com`** (două puncte **`:`**, apoi **`//`**).
- **`https;//…`** este o greșeală uzuală din tastatură (**`;`** lângă **`:``**). În **EAS (production)** și **Railway**, verifică `EXPO_PUBLIC_KINDE_ISSUER_URL`, respectiv **`KINDE_ISSUER_URL`**, să nu conțină `;`.
- Codul MEDVBA autocorectează `https;//` → `https://` la pornire (client + backend), dar **mai bine corectezi valorile salvate**.

### Logs: `SCOPE_MISSING` / `"Scope is missing: read:users"`

- Aplicația **Machine-to-machine** din Kinde trebuie autorizată pentru **Management API** cu permisiuni de tip **Users** (read / update / create / delete, după ce folosești).
- Pe Railway poți seta explicit:
  **`KINDE_M2M_TOKEN_SCOPE=read:users update:users create:users delete:users`**
  (sau scopes exact cum le arată dashboard-ul pentru M2M).
- În cod, dacă **`KINDE_M2M_TOKEN_SCOPE` lipsește**, backend-ul cere implicit scope-urile de mai sus la token M2M (evită eroarea pentru search / înregistrare).

### Railway build: „SecretsUsedInArgOrEnv … Dockerfile” sau `NIXPACKS_PATH`

- Avertizările **Docker BuildKit** despre `ARG`/`ENV` pentru secrete sunt frecvente cu **builder NIXPACKS**; **nu înseamnă neapărat** că serverul nu pornește (Railway injectează valorile și la rulare).
- Dacă build-ul pică efectiv din cauza `UndefinedVar … NIXPACKS_PATH`: actualizează **Railway Nixpacks** / ghid oficial sau înlocuiește cu un **Dockerfile** propriu care nu referă `$NIXPACKS_PATH`.

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
