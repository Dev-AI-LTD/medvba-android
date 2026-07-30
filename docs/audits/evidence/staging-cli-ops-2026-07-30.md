# Staging CLI Ops Evidence — 2026-07-30

- Timestamp: 2026-07-30 (local ops)
- Target SHA: `ae8de579c362cfaf6cb3cd356bb13cfe309d6fac`
- Railway: Project MEDVBA / Environment `staging-internal` / Service `medvba-android`
- Staging Supabase ref: `blwgdunmnpkpggtpaxwt` (`medvba-staging`)
- Production Supabase ref (untouched): `utbcxdtcznitejbhhquh`

## Status matrix

| Step | Result | Notes |
|------|--------|-------|
| 1. Railway link | **PASS** | MEDVBA / staging-internal / medvba-android |
| 2. Staging Supabase vars on Railway | **PASS** | URL, anon, service_role, JWT set with `--skip-deploys` |
| 3. Ref double-confirm | **PASS** | staging=`blwgdunmnpkpggtpaxwt`; production=`utbcxdtcznitejbhhquh` unchanged |
| 4. Migrations 022–025 | **FAIL** | Target confirmed; `022` fails — `public.profiles` missing (empty project; baseline 001–021 not present) |
| 5. Feature flags | **PARTIAL** | `CLINICAL_COPILOT_ENABLED=true`, `AI_PROVIDER=muse`, `INTERNAL_HEALTH_SECRET` generated. `META_MODEL_*` missing → Muse smoke **BLOCKED**. Redis/Upstash not obtainable. No `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED` on Railway |
| 6. Redeploy SHA | **PASS** | Redeploy SUCCESS; active SHA `ae8de57…` |
| 7. Smoke | **PARTIAL** | `/health` 200; `/health/ready` 200 (supabaseConfigured=true, supabaseReady=false — no `subscriptions` table); unauth `POST /api/clinical/stream` → 401 |

## Guardrails

| Check | Result |
|-------|--------|
| Railway production modified | **NO** |
| Production Supabase ref | **utbcxdtcznitejbhhquh** (unchanged) |
| EAS production Clinical | **false** |
| EAS development Clinical | **false** |
| Secrets/PII in this file | **NONE** |

## Next actions

1. Apply baseline schema **001–021** to staging ref `blwgdunmnpkpggtpaxwt`, then re-run **022–025**.
2. Set staging-only `META_MODEL_API_KEY` (+ base URL / model name as needed) for Muse.
3. Provision Redis/Upstash (`REDIS_URL` or `UPSTASH_REDIS_REST_*`) on staging-internal if rate-limit readiness is required.
4. Re-smoke `/health/ready` until `supabaseReady=true` (expects `subscriptions` readable via service role).
