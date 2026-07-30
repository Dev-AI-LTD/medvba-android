# Staging CLI Ops Evidence — 2026-07-30

- Timestamp: 2026-07-30 (local ops, baseline resume)
- Target SHA: `ae8de579c362cfaf6cb3cd356bb13cfe309d6fac` (`origin/main`)
- Railway: Project MEDVBA / Environment `staging-internal` / Service `medvba-android`
- Staging Supabase ref: `blwgdunmnpkpggtpaxwt` (`medvba-staging`)
- Production Supabase ref (untouched): `utbcxdtcznitejbhhquh`
- FA-H03 / H05: **not closed**

## Guardrails

| Check | Result |
|-------|--------|
| Railway production modified | **NO** |
| Production Supabase ref | **utbcxdtcznitejbhhquh** (unchanged) |
| Migration target confirmed before SQL | **PASS** (`blwgdunmnpkpggtpaxwt` only) |
| Applied only committed `origin/main` SQL | **PASS** (local WIP 022–024 not applied) |
| Secrets/PII in this file | **NONE** |

## Migrations (STOP on first error)

| File | Result | Notes |
|------|--------|-------|
| `001_initial_schema.sql` | **PASS** (then SKIP on resume) | Stub creates `profiles` only; comments say rest is in `schema.sql` |
| `002_storage_buckets.sql` | **PASS** (then SKIP on resume) | |
| `003_ai_question_usage.sql` | **PASS** (then SKIP on resume) | |
| `supabase/schema.sql` (committed bootstrap dump) | **PASS** | Required because `001` does not create app tables; policy order adjusted in-memory only |
| `004_rls_security_hardening.sql` | **FAIL** | `code=42703` msg=`column "direct_chat_id" does not exist` |
| `005`–`021` | **NOT RUN** | Stopped after 004 |
| `022_rls_security_hotfix.sql` | **SKIP** | Untracked WIP (not on `origin/main`) |
| `023_profiles_select_own_only.sql` | **SKIP** | Untracked WIP (not on `origin/main`) |
| `024_fix_current_profile_id_rls_recursion.sql` | **SKIP** | Untracked WIP (not on `origin/main`) |
| `025_ai_usage_events.sql` | **NOT RUN** | Blocked by 004 stop |

### Schema checks after stop

| Check | Result |
|-------|--------|
| `public.profiles` exists | **true** |
| `public.study_sessions` exists | **true** |
| `public.subscriptions` exists | **true** |

### Root cause (004)

Committed `supabase/schema.sql` / older `supabase_migrations/*` use column `chat_id` on direct-chat tables. Committed `supabase/migrations/004_rls_security_hardening.sql` references `direct_chat_id`. No committed rename migration found. Fresh-project chain breaks at 004.

## Smoke

| Check | Result |
|-------|--------|
| `/health` | **200** |
| `/health/ready` (Bearer `INTERNAL_HEALTH_SECRET`) | **200** |
| `supabaseConfigured` | **true** |
| `supabaseReady` | **true** |
| `redisConfigured` / `redisReady` | **false** / **false** |
| `aiProvider` | `muse` |
| `hasMetaModelApiKey` | **false** |

## Remaining blockers

| Item | Status |
|------|--------|
| Muse `META_MODEL_*` | **BLOCKED** (not present; do not invent) |
| Redis / Upstash | **BLOCKED** (not present; do not invent) |
| Migrations `004`–`021` + `025` | **BLOCKED** on `direct_chat_id` vs `chat_id` drift |
| `022`–`024` | **BLOCKED** until committed to `main` |

## Next actions

1. Fix schema drift: align `schema.sql` (or add a committed rename/bridge migration) so columns match `004+` (`direct_chat_id` vs `chat_id`), then resume from `004`.
2. Commit `022`–`024` to `main` before applying them to staging.
3. Set staging-only `META_MODEL_*` and Redis/Upstash when available — do not workaround `AI_PROVIDER`.
4. Keep FA-H03 / H05 open until full migration + RLS contract pass.
