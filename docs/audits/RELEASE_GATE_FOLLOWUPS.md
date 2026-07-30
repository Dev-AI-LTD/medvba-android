# Release gate — follow-up PRs (Phase 3+)

Production `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED` stays **false** in `eas.json` (`production` / `development`). Internal TestFlight may keep it `true`.

## Done in this gate

- F18–F20 RLS migration `022_rls_security_hotfix.sql` applied
- F01 clinical-stream imports + SSE charge/refund/abort/generic errors
- F04 batch-translate Rules of Hooks
- F03 removed `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_SECRET` from local `.env`; `.env.example` documents ban
- F09 Sentry `beforeSend` PII scrub + existing `clearUser` on logout path
- F12 Expo package bump toward SDK 54 expected versions
- F22/F23: disclaimer must be `literal(true)`; image MIME allowlist tightened
- RC idempotency key unit tests; clinical credit/stream auth tests; CI lint+test workflow
- **Muse Phase 1 (code):** explicit `AI_PROVIDER=muse`, guards before debit, abort/timeout refund policy, `ai_usage_events`, `/health` + `/health/ready` split. Clinical remains OFF on EAS production. Apply migration `025_ai_usage_events.sql` before staging smoke. **No live Railway vars/deploy without explicit ops OK.**
- **Local quality gate GREEN (2026-07-30):** `bun install --frozen-lockfile`, `lint`, `tsc --noEmit`, `test:ci`, `doctor` (17/17), `git diff --check` all exit 0. Nested same-version `expo-file-system` / `expo-font` deduped via postinstall + overrides.
- **Controlled push PASS (2026-07-30):** `main` @ `212c796` on origin; no force-push. Evidence: `docs/audits/evidence/push-ci-staging-2026-07-30.md`.
- **Quality CI PASS (2026-07-30):** first green `CI` / `lint-and-test` on pushed SHA after Rules-of-Hooks lint fix (run `30542556738`).
- **Railway staging / migrations 022–025 / smoke:** **BLOCKED** — Railway CLI unauthorized/unlinked; staging cannot be safely distinguished from production. No staging deploy, no prod Railway changes, no migration apply.

## Separate PRs still recommended

1. **JWT alignment** then **Sentry privacy** then **Redis rate limiting** before Clinical internal GA (sequencing gate).
2. **Rate limit (F05):** shared Redis/Upstash store for tutor/clinical limiters across Railway instances.
3. **JWT aud (F06):** verify `aud=authenticated` in `verifyMedvbaRequestJwt`.
4. **Atomic credits (F07):** Postgres RPC for debit instead of optimistic update loop.
5. **Attachment upload pipeline:** move clinical images off raw data-URLs to Storage with server MIME re-check.
6. ~~**Full tsc green**~~ — **DONE** locally (type remediations + doctor dedupe). Staging/ops still blocked separately.
7. **Rotate Google OAuth secret** if `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_SECRET` was ever embedded in a store binary.
8. **Redeploy Railway** from `main` after push so Muse Phase 1 ships; smoke `/health` (no secrets) + `/health/ready` with secret; Clinical flag only on staging.

## Railway staging smoke (not CLOSED until executed post-deploy)

Run only after deploy SHA matches expected commit. Record evidence in `docs/audits/evidence/` — **no** host/URL/token/UUID/email/clinical content in notes.

| Step | Check |
|------|--------|
| 1 | Confirm deploy SHA (Railway / health `version` if set) |
| 2 | `GET /health` — `status`, `clinicalCopilotEnabled` only (no provider secrets) |
| 3 | `GET /health/ready` — Bearer `INTERNAL_HEALTH_SECRET`; booleans: `redisConfigured`, `redisReady`, `supabaseConfigured`, `supabaseReady`, `aiProvider`, `hasMetaModelApiKey`, `clinicalCopilotEnabled` |
| 4 | Clinical SSE explain (staging/internal only) |
| 5 | Case flow |
| 6 | Image reject |
| 7 | Abort / timeout / provider fail |
| 8 | Rate limit |
| 9 | RLS A/B contract |

**Functional audit hotfix status (accurate as of gate prep):**

| ID | Status |
|----|--------|
| FA-H03 | **OPEN** — needs deploy SHA + smoke SSE |
| FA-H04 | **CLOSED** only if RLS A/B contract evidence PASS exists (`docs/audits/evidence/rls-022-contract-*.md`) |
| H01 / H02 | **Pending** — VERIFIED IN DEPLOYMENT only after deploy |
| H05 | **OPEN** — Redis must be confirmed across Railway instances (`redisReady` on `/health/ready`) |

Staging smoke overall: **OPEN / BLOCKED** (do not mark CLOSED here). Ops needs Railway login + explicit staging service link before redeploy/smoke.
