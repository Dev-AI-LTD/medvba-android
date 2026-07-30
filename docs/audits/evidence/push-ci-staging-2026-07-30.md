# Push / CI / Staging Ops Evidence

- Timestamp: 2026-07-30T12:28:00Z
- Branch: `main`
- Remote HEAD SHA: `212c796554310d941b28e29f802b31fc0b912a44`
- Force-push: no

## Controlled push

| Check | Result |
|-------|--------|
| Push to `origin/main` | **PASS** |
| Intended commits published (Muse Phase 1 + quality gate fixes + CI workflow + lint hooks fix) | **PASS** |
| Local uncommitted WIP left unpushed | **PASS** (intentional) |

## Quality CI (`CI` / `lint-and-test`)

| Check | Result |
|-------|--------|
| First run after workflow add (lint Rules-of-Hooks) | **FAIL** (fixed) |
| Run on SHA `212c796` | **PASS** (conclusion success) |
| Lint | **PASS** |
| `test:ci` | **PASS** |
| `tsc --noEmit` (non-blocking step) | completed under `continue-on-error` |

Workflow: `.github/workflows/ci.yml`  
Run: GitHub Actions run id `30542556738` (conclusion success)

## Railway staging + migrations + smoke

| Check | Result |
|-------|--------|
| Identify staging vs production Railway service | **BLOCKED** — Railway CLI unauthorized / not linked |
| Staging redeploy from pushed SHA | **SKIPPED** (blocked) |
| Migrations 022–025 on staging Supabase | **BLOCKED** — no confirmed staging DB target |
| Smoke `GET /health` / `/health/ready` / clinical auth | **SKIPPED** (blocked) |

### User actions required (no secrets invented)

1. `railway login` then `railway link` to the **staging/internal** service only (never production).
2. Confirm staging service name distinctly from production before any `railway up` / redeploy / variable change.
3. Set staging-only env **names** as needed (values from your secret store; do not paste here):
   - `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED` (staging true; leave EAS production/development false)
   - `INTERNAL_HEALTH_SECRET`
   - `AI_PROVIDER` / Muse-related server keys
   - Redis / Upstash rate-limit vars if used
   - Supabase server vars for the **staging** project
4. Apply migrations `022`–`025` with `bun run db:run-sql` against **staging** `DATABASE_URL` / `SUPABASE_DB_PASSWORD` only.
5. Re-run staging smoke checklist in `RELEASE_GATE_FOLLOWUPS.md`.

## Production / EAS Clinical guardrails

| Check | Result |
|-------|--------|
| Railway production vars/deploy touched | **NO** (untouched) |
| `eas.json` production `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED` | **false** |
| `eas.json` development `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED` | **false** |
| `eas.json` internal | `true` (unchanged) |

## PII / secrets policy

No host URLs, tokens, UUIDs, emails, connection strings, or clinical content recorded.
