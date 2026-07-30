# Staging CLI Ops Evidence — 2026-07-30 (ops block complete)

- Timestamp: 2026-07-30 (CLI-only staging-internal block)
- Deploy method: `railway up -d` from local HEAD (CI-green `6b20c18`); prior `ae8de57` deploys superseded
- Active Railway deploy id (staging-internal): `b4b30d3c` **SUCCESS**
- Railway: Project MEDVBA / Environment `staging-internal` / Service `medvba-android`
- Staging public URL: `https://medvba-android-staging-internal.up.railway.app`
- Staging Supabase ref: `blwgdunmnpkpggtpaxwt` (`medvba-staging`)
- Production Supabase ref (untouched): `utbcxdtcznitejbhhquh`
- Method: **CLI only** (Railway CLI + Supabase CLI / Management API linked queries)
- FA-H03: metadata PASS after 022–024; live A/B JWT contract still open
- FA-H05: **OPEN** (Redis/Upstash missing)

## Guardrails

| Check | Result |
|-------|--------|
| Railway production modified | **NO** |
| Production Supabase SQL | **NO** |
| Production Supabase ref | **utbcxdtcznitejbhhquh** (unchanged) |
| Linked project before SQL | **PASS** — `supabase/.temp/project-ref` = `blwgdunmnpkpggtpaxwt` |
| `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED` on Railway | **ABSENT** (correct) |
| EAS Clinical production/development | **false** (unchanged) |
| Secrets/PII in this file | **NONE** |

## Railway link

| Item | Result |
|------|--------|
| Project | MEDVBA |
| Environment | staging-internal |
| Service | medvba-android |

## Supabase rewire (staging-internal only)

| Var | Result |
|-----|--------|
| `SUPABASE_URL` | **PASS** → ref `blwgdunmnpkpggtpaxwt` |
| `EXPO_PUBLIC_SUPABASE_URL` | **PASS** → ref `blwgdunmnpkpggtpaxwt` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **PASS** → JWT ref `blwgdunmnpkpggtpaxwt` |
| `SUPABASE_SERVICE_ROLE_KEY` | **PASS** → JWT ref `blwgdunmnpkpggtpaxwt` |
| `SUPABASE_JWT_SIGNING_SECRET` | **PRESENT** (pre-existing; Management API refresh blocked by auth-token path — smoke `supabaseReady=true`) |

## Migrations 022–025 (staging only)

| File | Result | Method |
|------|--------|--------|
| `022_rls_security_hotfix.sql` | **PASS** | `npx supabase@latest db query --linked --yes -f …` |
| `023_profiles_select_own_only.sql` | **PASS** | same |
| `024_fix_current_profile_id_rls_recursion.sql` | **PASS** | same |
| `025_ai_usage_events.sql` | **PASS** | same (idempotent re-apply) |

### RLS 022 metadata probes (post-apply)

| Probe | ok |
|-------|-----|
| profiles_select_own | true |
| profiles_no_open_select | true |
| profiles_no_open_all | true |
| public_profiles | true |
| get_my_ai_credit_balance | true |
| legacy_rpc_no_authenticated_execute | true |

Live A/B JWT contract: **NOT RUN** (QA JWT unavailable).

## Staging vars inventory (names only)

| Key | Status |
|-----|--------|
| `CLINICAL_COPILOT_ENABLED` | **SET** `true` |
| `AI_PROVIDER` | **SET** `muse` |
| `META_MODEL_NAME` | **SET** `muse-spark-1.1` |
| `META_MODEL_API_KEY` | **MISSING** → Muse smoke **BLOCKED** |
| `META_MODEL_API_BASE_URL` | **MISSING** → Muse smoke **BLOCKED** |
| `INTERNAL_HEALTH_SECRET` | **SET** (generated) |
| `UPSTASH_REDIS_REST_URL` | **MISSING** |
| `UPSTASH_REDIS_REST_TOKEN` | **MISSING** |
| `REDIS_URL` | **MISSING** |
| `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED` | **ABSENT** |

## Smoke matrix (staging)

| Check | Result |
|-------|--------|
| `GET /health` | **200** |
| `GET /health/ready` (Bearer health secret) | **200** |
| `supabaseConfigured` / `supabaseReady` | **true** / **true** |
| `redisConfigured` / `redisReady` | **false** / **false** |
| `aiProvider` | `muse` |
| `hasMetaModelApiKey` | **false** |
| `clinicalCopilotEnabled` | **true** |
| `POST /api/clinical/stream` (no Bearer) | **401** |

## Production untouched

- No `railway variables set/delete` against environment `production`
- No SQL against Supabase ref `utbcxdtcznitejbhhquh`
- Linked CLI target remained `blwgdunmnpkpggtpaxwt` for all migration/query calls
