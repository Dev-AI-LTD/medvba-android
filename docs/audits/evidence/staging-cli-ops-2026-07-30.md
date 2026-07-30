# Staging CLI Ops Evidence — 2026-07-30

- Timestamp: 2026-07-30 (staging reset + canonical chain — approved)
- Target SHA: `7518d14044f86e17bf19cade923a7af6417173de` (`7518d14` — direct_chat_id bootstrap + 026)
- Railway: Project MEDVBA / Environment `staging-internal` / Service `medvba-android`
- Staging Supabase ref: `blwgdunmnpkpggtpaxwt` (`medvba-staging`)
- Production Supabase ref (untouched): `utbcxdtcznitejbhhquh`
- Method: **CLI only** (`supabase link` + `supabase db query --linked --yes`)
- FA-H03 / H05: **not closed** (022–024 HOLD; Muse/Redis still blocked)

## Guardrails

| Check | Result |
|-------|--------|
| Railway production modified | **NO** |
| Production Supabase ref | **utbcxdtcznitejbhhquh** (unchanged; not linked) |
| Linked project before destructive SQL | **PASS** — `supabase/.temp/project-ref` = `blwgdunmnpkpggtpaxwt` (`medvba-staging`) |
| Applied only approved chain from `7518d14` | **PASS** (022–024 skipped) |
| Clinical EAS prod/dev | **OFF** (unchanged) |
| Secrets/PII in this file | **NONE** |

## Reset method

| Step | Result |
|------|--------|
| `supabase link --project-ref blwgdunmnpkpggtpaxwt --yes` | **PASS** |
| Wipe | **PASS** — `DROP SCHEMA public CASCADE` + recreate grants; clear `supabase_migrations.schema_migrations`; **did not** delete cloud project; auth/storage system schemas kept |
| Prefer vs `db reset --linked` | Used wipe + file apply so `schema.sql` can sit between 003 and 004, and so untracked WIP 022–024 are never applied |

## In-memory apply adjustments (not committed)

| Adjustment | Why |
|------------|-----|
| `002` storage: `DROP POLICY IF EXISTS` before create | Storage policies survived public wipe |
| `schema.sql`: defer `direct_chats` SELECT policy until after `direct_chat_participants` exists; `DROP POLICY IF EXISTS` before creates | Avoid 42P01 + duplicate policies after 001 |
| Pre-`004` bridge: `study_rooms.is_public`, `host_id`, `study_room_participants` | Committed `004` expects columns/table not in `schema.sql` |
| Pre-`012`: `DROP FUNCTION IF EXISTS grant_my_achievement(text)` | Return-type change vs function already created earlier in chain |

## Migrations matrix

| File | Result | Notes |
|------|--------|-------|
| `001_initial_schema.sql` | **PASS** | Stub profiles + trigger |
| `002_storage_buckets.sql` | **PASS** | Policy drops in-memory |
| `003_ai_question_usage.sql` | **PASS** | |
| `supabase/schema.sql` | **PASS** | Order + policy fixes in-memory; greenfield `direct_chat_id` |
| `004_rls_security_hardening.sql` | **PASS** | No `42703` on `direct_chat_id`; study_rooms bridge in-memory |
| `005_kinde_jwt_rls.sql` | **PASS** | No `42703` |
| `006_fix_study_rooms_rls_recursion.sql` | **PASS** | |
| `007_fix_direct_chat_rls_recursion.sql` | **PASS** | No `42703` |
| `008_ai_question_usage_period_start.sql` | **PASS** | |
| `009_subscriptions_client_no_self_premium.sql` | **PASS** | |
| `010_ai_question_usage_server_writes_only.sql` | **PASS** | |
| `011_profiles_premium_columns.sql` | **PASS** | |
| `012_grant_my_achievement_profile_id.sql` | **PASS** | DROP FUNCTION prelude in-memory |
| `013_user_achievements_fk_profiles.sql` | **PASS** | |
| `014_direct_chats_fk_profiles.sql` | **PASS** | Lexical first of dual 014; no `42703` |
| `014_subscriptions_profiles_fk.sql` | **PASS** | Lexical second of dual 014 |
| `015_chapter_study_content.sql` | **PASS** | |
| `016_study_audio_storage.sql` | **PASS** | |
| `017_user_reports.sql` | **PASS** | |
| `018_profiles_premium_server_only.sql` | **PASS** | |
| `019_clinical_copilot_schema.sql` | **PASS** | |
| `020_clinical_copilot_spec_align.sql` | **PASS** | |
| `021_revenuecat_events.sql` | **PASS** | |
| `022_rls_security_hotfix.sql` | **SKIP** | HOLD — untracked WIP / not approved |
| `023_profiles_select_own_only.sql` | **SKIP** | HOLD |
| `024_fix_current_profile_id_rls_recursion.sql` | **SKIP** | HOLD |
| `025_ai_usage_events.sql` | **PASS** | |
| `026_rename_chat_id_to_direct_chat_id.sql` | **PASS** | No-op on greenfield `direct_chat_id` (succeeds) |

## Post-chain validations

| Check | Result |
|-------|--------|
| Columns on `direct_chat_participants` / `direct_chat_messages` | **PASS** — only `direct_chat_id` (no `chat_id`) |
| FK `direct_chat_id` → `direct_chats(id)` | **PASS** (participants + messages) |
| `UNIQUE(direct_chat_id, user_id)` on participants | **PASS** (`direct_chat_participants_direct_chat_id_user_id_key`) |
| 004/005/007/014 without `42703` | **PASS** |
| 026 no-op / success | **PASS** |
| Smoke: chat + 2 participants + message (then cleanup) | **PASS** |
| Client realtime filter uses `direct_chat_id` | **PASS** — `lib/supabase-hooks.ts` `filter: direct_chat_id=eq.${chatId}` |

## Railway smoke (staging-internal)

| Check | Result |
|-------|--------|
| Railway `SUPABASE_URL` ref | **blwgdunmnpkpggtpaxwt** (staging) |
| `/health` | **200** |
| `/health/ready` | **200** |
| `supabaseConfigured` / `supabaseReady` | **true** / **true** |
| `redisConfigured` / `redisReady` | **false** / **false** |
| `aiProvider` | `muse` |
| `hasMetaModelApiKey` | **false** |

## Next actions

1. Keep **022–024 on HOLD** until committed to `main` + CI green, then apply staging-only.
2. Staging Muse: set `META_MODEL_*` when available (do not invent; do not workaround `AI_PROVIDER`).
3. Staging Redis/Upstash for H05 / `redisReady`.
4. Do **not** apply this chain to production until a separate approved production plan (026 + client alignment).
