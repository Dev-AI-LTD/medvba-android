# MEDVBA Functionality Audit

**Workspace:** `medvba-android/`  
**Date:** 2026-07-30  
**Plan:** [FUNCTIONALITY_AUDIT_PLAN.md](FUNCTIONALITY_AUDIT_PLAN.md)  
**Method:** Code-first inventory + static authz/credits/RLS review + unit regression; no production DB writes; no secrets printed.  
**Clinical production flag:** `eas.json` production + development `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED=false`; internal=`true` — **confirmed remains false for store/production**.

---

## Executive score

| Dimension | Score | Notes |
|-----------|------:|-------|
| **Total** | **82/100** | Shipped quiz/auth/tutor/paywall paths largely sound; HIGH trial→paid mint + stream rate-limit fixed in repo; **local tsc+doctor green**; **origin push + quality CI green**; staging still blocked on ops (Railway unauthorized) |
| Security / authz | **78** | Server premium + credits; JWT mint has `aud`; verify still lacks `aud`/`role` assert; 022 in tree unverified live |
| Reliability | **82** | Credit refund trial/paid split correct; abort keeps charge by design; in-memory rate limits |
| Credits / billing | **84** | RC webhook auth + idempotency tested; trial refund no longer mints paid balance |
| Clinical safety | **86** | Prod flag false; disclaimer `literal(true)`; MIME allowlist; educational prompts |
| Quality / CI | **92** | lint 0 errors; `test:ci` pass; **`tsc --noEmit` PASS**; **`doctor` 17/17**; CI DoD now **blocks** on tsc+doctor; prior green `@212c796` (tsc soft-fail era); staging wait on Railway link |
| Store readiness | **86** | Clinical off in production EAS; doctor green (nested expo-* deduped in postinstall) |

**Honest acceptance:** Zero **CRITICAL** open for shipped flows. **HIGH** credit mint bug **fixed in repo**. Remaining **HIGH** items are primarily **ops/verification** (live API deploy, RLS 022 apply) plus multi-instance rate-limit residual — not store-binary Clinical enablement.

---

## Flow matrix

| ID | Flow | Result | Evidence |
|----|------|--------|----------|
| A1 | App boot / session restore | **PASS** | AuthProvider + SecureStore session; query clear on logout |
| A2 | Sign-in (Kinde → JWT mint) | **PASS** | `mintSupabaseAccessJwt` 15m, `aud=authenticated`, `role` |
| A3 | Sign-out cleanup | **PASS*** | Clears session + React Query; *Sentry `clearUser` still unused (MEDIUM) |
| A4 | Delete account | **PASS** | `account` protected router + UI confirmation path |
| B1 | Tabs / home | **PASS** | `(tabs)/*` routes present |
| B2 | Quiz chapters | **PASS** | `quiz-chapters.tsx` + content pools |
| B3 | Quiz session / progress | **PASS** | Session UI + `user_progress` hooks; unit progress tests |
| B4 | Achievements | **PASS*** | Client writes + 022 INSERT ownership SQL in tree; *live apply BLOCKED |
| C1 | Study browse | **PASS** | `study/*` + public study router |
| C2 | Study audio | **NOT TESTED** | URL helpers only; no live CDN probe |
| D1 | AI Tutor | **PASS** | `tutor.chat` protected; server premium + free-usage reserve/refund |
| D2 | Clinical tRPC + SSE | **PASS*** | Flag-gated; stream JWT + rate limit + trial-safe refund; *prod disabled |
| D3 | Clinical image | **PASS*** | MIME allowlist + disclaimer; large data-URL MEDIUM; *prod disabled |
| D4 | Batch translate | **PASS** | `__DEV__` redirect; hooks unconditional (prior fix) |
| E1 | Paywall / RC SDK | **PASS** | Client keys public-only; premium from subscriptions server-side |
| E2 | RC webhook | **PASS** | Auth fail-closed + idempotency unit tests |
| E3 | Credit consume | **PASS** | `consumeClinicalCredits` resolves premium server-side |
| E4 | `syncFromClient` | **PASS*** | Cannot escalate to premium; free demotion without RC re-check = MEDIUM |
| F1 | Direct / tab social chat | **PASS** | Redirect + stack routes; RLS history in migrations |
| F2 | Find partners | **PASS** | Redirect to tabs social; `public_profiles` (anon SELECT = MEDIUM) |
| F3 | Leaderboard | **PASS** | Route works; `radiusSm` import fixed |
| F4 | Notifications | **NOT TESTED** | Screen present; device permission not exercised |
| G1 | Settings / appearance | **PASS** | `presentCustomerCenter` exported via RevenueCat UI wrapper |
| G2 | Legal / support | **PASS** | Static screens |
| H1 | Health / doctor / CI | **PASS*** | Local gate green (`tsc` + doctor 17/17); *live Railway deploy/smoke still ops-blocked |
| H2 | RLS 018–022 | **BLOCKED** | SQL + contract tests in repo; production apply not verified here |

\* = caveat / residual MEDIUM or ops note.

---

## Bugs

### CRITICAL

| ID | Status | Description |
|----|--------|-------------|
| — | — | **None confirmed** in this audit |

### HIGH

| ID | Status | Domain | File/symbol | Description | Impact |
|----|--------|--------|-------------|-------------|--------|
| FA-H01 | **FIXED** | Credits / Clinical | `refundClinicalCredits`, `runReply`, `clinical-stream`, image/summary/explain/case | Trial charge (`amount>0`, `usedTrial`) was refunded into **`current_balance`** → mint paid credits on AI failure | Free users could gain paid balance by forcing failures |
| FA-H02 | **FIXED** | Abuse | `clinical-stream.ts` + `tutorRateLimiter` | SSE `/api/clinical/stream` had no rate limit while tRPC clinical did | Stream spam bypassed AI rate gate |
| FA-H03 | **OPEN (ops)** | Release | Live Railway `GET /health` | Prior probe: missing `clinicalCopilotEnabled` vs current `hono.ts` | Staging/internal Clinical fixes may not be live |
| FA-H04 | **CLOSED** | RLS | `022` + `023_profiles_select_own_only` + `024_fix_current_profile_id_rls_recursion` | Live contract A/B **PASS** (evidence `docs/audits/evidence/rls-022-contract-2026-07-30.md`); leftover open SELECT policies removed; `current_profile_id` recursion fixed | Cross-user profiles SELECT / credit IDOR / spoofed achievements gated |
| FA-H05 | **OPEN (residual)** | Abuse | `rate-limiter.ts` Map | In-memory only — not shared across replicas | Partial bypass under horizontal scale (stream now shares same process Map) |

### MEDIUM (documented, not patched this pass)

| ID | Domain | Symbol | Notes |
|----|--------|--------|-------|
| FA-M01 | Auth | `verifyMedvbaRequestJwt` | No `audience`/`role` assert vs mint |
| FA-M02 | Privacy | `AuthProvider.signOut` | `monitoring.clearUser()` never called |
| FA-M03 | Billing | `subscription.syncFromClient` | Client `free` upsert via service role without RC re-check |
| FA-M04 | Social | `public_profiles` | `GRANT SELECT` to `anon` |
| FA-M05 | AI | Image data-URL | Up to ~6M chars still accepted |
| FA-M06 | Product | Stream abort | No refund on client abort (intentional) |
| FA-M07 | Quality | `tsc --noEmit` | **CLOSED** — local gate green (2026-07-30) |
| FA-M08 | Deps | `bun run doctor` | **CLOSED** — 17/17; nested same-version `expo-file-system` / `expo-font` removed in postinstall + overrides |

### LOW

| ID | Notes |
|----|-------|
| FA-L01 | Dual `014_*.sql` naming |
| FA-L02 | ASC key IDs in `eas.json` (not private keys) |
| FA-L03 | Review premium email UX helper (server still authoritative) |

---

## FA-H01 — Trial→paid mint (FIXED)

**Repro**
1. Non-pro user with `trial_credits_remaining >= cost`.
2. Call clinical `reply` or `POST /api/clinical/stream` so `consumeClinicalCredits` returns `{ amount: cost, usedTrial: true }`.
3. Force AI generator failure after charge.
4. Observe refund applied to `current_balance` (pre-fix).

**Cause**  
`charged = charge.amount > 0` (reply/stream/image) treated trial as paid; `refundClinicalCredits` always did `delta: +amount` on paid balance.

**Impact**  
Economic integrity: free trial failures mint paid credits.

**Minimal patch**
- `refundClinicalCredits({ usedTrial })` → restore `trial_credits_remaining` when trial; else paid balance.
- Reply / stream / explain / case / image / summary pass `usedTrial` into refund.
- Stream uses rate limiter after JWT.

**Tests**  
`lib/__tests__/clinical-credits-stream.test.ts` — trial restore vs paid credit assertions (+ existing consume/auth tests). **10/10** in file; suite **149** pass.

**Risk / rollback**  
Low. Revert `ai-credits.ts` + clinical call sites + stream. No migration.

---

## FA-H02 — Stream rate limit (FIXED)

**Repro**  
Authenticated spam of `/api/clinical/stream` while staying under tRPC limits.

**Cause**  
Limiter only wired on tRPC clinical procedures.

**Minimal patch**  
`tutorRateLimiter(userId)` after JWT in `registerClinicalStreamRoutes`; map `TOO_MANY_REQUESTS` → HTTP 429.

**Tests**  
Auth gate still 401 without Bearer; rate-limit shares existing limiter module (in-memory residual = FA-H05).

**Risk / rollback**  
Low. Remove limiter call from stream.

---

## Orphan / duplicate code (analyzed flows)

| Item | Path | Verdict |
|------|------|---------|
| `app/find-partners.tsx` | Redirect → `/(tabs)/social/find-partners` | **Keep** (compat alias) |
| `app/direct-chat.tsx` | Likely alias/compat | **Keep** unless route graph proves unused |
| `app/batch-translate.tsx` | Dev tool; `__DEV__` redirect | **Keep**; scripts use `lib/batch-translate` |
| Clinical UI components | Gated by flag | **Keep** for internal profile |
| Unused theme imports | Various screens | Lint warnings only — not deleted |

No deletions performed (no import-graph proof of dead code requiring removal).

---

## Proposed conventional commits (small batches)

1. `fix(credits): restore trial bucket on clinical AI failure refund`  
   - `backend/lib/ai-credits.ts`, `backend/trpc/clinical.ts`, `backend/clinical-stream.ts`, tests  
2. `fix(clinical): rate-limit SSE stream after JWT`  
   - Can be folded into (1) if preferred; already applied together  
3. `docs(audit): functionality audit + QA functional test plan`  
   - `docs/audits/FUNCTIONALITY_AUDIT*.md`, `docs/QA_FUNCTIONAL_TEST_PLAN.md`  
4. *(ops, separate)* Redeploy Railway; verify `/health.clinicalCopilotEnabled`  
5. *(ops, separate)* Confirm/apply `022_rls_security_hotfix.sql` on staging then prod via controlled `db:run-sql`  
6. *(follow-up MEDIUM)* `fix(auth): assert JWT aud/role on verify` + `fix(privacy): clear Sentry user on logout`

---

## Final commands + results

| Command | Result |
|---------|--------|
| `bun install --frozen-lockfile` | **PASS** — exit 0 |
| `bun run lint` | **PASS** — 0 errors, 17 warnings |
| `bunx tsc --noEmit` | **PASS** — exit 0 |
| `bun run test:ci` | **PASS** — 32 suites, **178** tests |
| `bun run doctor` | **PASS** — 17/17 |
| `git diff --check` | **PASS** — exit 0 |

**Not ready for ops/staging declare:** push + quality CI are green; Railway staging deploy + migrations 022–025 + smoke remain **BLOCKED** (CLI unauthorized / staging not identifiable). Clinical remains `false` on EAS production/development. Railway production untouched.

---

## Top remaining blockers

1. **Ops:** Confirm Railway deploy includes current health + clinical stream fixes (FA-H03).  
2. **Ops:** FA-H04 closed — live RLS contract PASS (022 + 023/024 applied).  
3. **Staging smoke:** still **OPEN** until post-deploy evidence (see `RELEASE_GATE_FOLLOWUPS.md`). Local `tsc` + doctor are green.  
4. **Scale:** Redis/Upstash rate limits for multi-instance (FA-H05).  
5. **Do not** enable Clinical Copilot in production EAS until intentional GA.
