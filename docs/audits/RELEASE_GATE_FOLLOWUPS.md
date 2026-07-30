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

## Separate PRs still recommended

1. **JWT alignment** then **Sentry privacy** then **Redis rate limiting** before Clinical internal GA (sequencing gate).
2. **Rate limit (F05):** shared Redis/Upstash store for tutor/clinical limiters across Railway instances.
3. **JWT aud (F06):** verify `aud=authenticated` in `verifyMedvbaRequestJwt`.
4. **Atomic credits (F07):** Postgres RPC for debit instead of optimistic update loop.
5. **Attachment upload pipeline:** move clinical images off raw data-URLs to Storage with server MIME re-check.
6. **Full tsc green:** remaining errors outside clinical-stream (quiz styles, study scripts, biometric, etc.).
7. **Rotate Google OAuth secret** if `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_SECRET` was ever embedded in a store binary.
8. **Redeploy Railway** from `main` after push so Muse Phase 1 ships; smoke `/health` (no secrets) + `/health/ready` with secret; Clinical flag only on staging.
