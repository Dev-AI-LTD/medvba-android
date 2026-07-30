# MEDVBA QA Functional Test Plan

**App:** MEDVBA (`medvba-android`)  
**Updated:** 2026-07-30  
**Related:** [FUNCTIONALITY_AUDIT.md](audits/FUNCTIONALITY_AUDIT.md), [FUNCTIONALITY_AUDIT_PLAN.md](audits/FUNCTIONALITY_AUDIT_PLAN.md)

Use **bun** unless a script requires otherwise. Never paste secrets from `.env` / EAS / Railway into tickets or screenshots.

---

## 1) Smoke (every PR / local before push)

**Automated**
- [x] `bun run lint` — 0 errors (2026-07-30 local gate)
- [x] `bun run test:ci` — all green (178 tests)
- [x] `bunx tsc --noEmit` — green
- [x] `bun run doctor` — 17/17
- [x] Spot-check: Clinical flag in `eas.json` production = `"false"`

**Staging / ops still blocked** until Railway deploy + smoke evidence (do not mark release ready for staging).

**Manual (5–10 min, staging or local)**
- [ ] Cold start → session restore or login screen
- [ ] Login success → tabs visible
- [ ] Start quiz chapter → answer 1 question → progress updates after refresh
- [ ] Open AI Tutor → send 1 message (or see paywall/free-limit correctly)
- [ ] Open paywall → offerings load (or graceful empty/error)
- [ ] Logout → cannot access protected tabs without re-auth

---

## 2) Regression (pre-release / weekly)

### Auth
- [ ] Email/password login + wrong password error
- [ ] OAuth path if configured (Google/Apple) — no client secrets in Expo public env
- [ ] Forgot password request returns generic success UX
- [ ] Logout clears cached queries; re-login fresh
- [ ] Expired/invalid session → re-auth, not crash
- [ ] Delete account confirmation + cancellation

### Quiz / progress
- [ ] Chapter list EN/RO locale switch
- [ ] Complete short session → score + progress persist after kill/relaunch
- [ ] Wrong answer / skip / resume saved session (if enabled)
- [ ] Offline: app does not corrupt progress; sync when online (document actual behavior)

### Study
- [ ] Chapters list + open chapter summary
- [ ] Audio play/pause if published URL present
- [ ] Unpublished/missing content → empty/error, not crash

### AI Tutor
- [ ] Free user: free quota increments; at limit → paywall/forbidden
- [ ] Premium user: chat succeeds without free-slot burn
- [ ] Provider failure: free slot restored (no permanent burn)
- [ ] Rate limit: repeated spam → TOO_MANY_REQUESTS / friendly error

### Clinical Copilot (staging / internal **only**)
- [ ] Production / store build: Clinical entry **hidden/disabled**
- [ ] Internal build with flag true: disclaimer must be accepted (`true` only)
- [ ] Explain / start case / reply with trial user
- [ ] Force AI failure after trial charge → **trial restored**, paid balance **unchanged**
- [ ] Force AI failure after paid charge → paid balance restored
- [ ] SSE stream auth: no Bearer → 401
- [ ] SSE stream spam → 429
- [ ] Client abort mid-stream → charge kept (document UX)
- [ ] Image: jpeg/png/webp/gif OK; reject weird MIME; oversized payload fails safely

### RevenueCat / credits
- [ ] Purchase sandbox → webhook updates subscription (staging)
- [ ] Replay same `event_id` → idempotent (no double grant)
- [ ] Webhook without auth → reject
- [ ] Client cannot set `profiles.is_premium` / escalate via API
- [ ] Credit balance UI matches server after consume/refund

### Social / chat
- [ ] Find partners list (public profiles) — no emails visible
- [ ] Open/create direct chat — only participants see messages
- [ ] Presence/leaderboard load without crash

### Settings / legal
- [ ] Appearance persistence
- [ ] Legal / support screens open
- [ ] Notifications permission deny/allow paths

---

## 3) Staging-internal checklist (Clinical enabled)

**Env (names only):** `CLINICAL_COPILOT_ENABLED=true` on API; internal EAS profile Clinical `true`.

- [ ] `GET /health` returns `clinicalCopilotEnabled: true` (or documented field)
- [ ] Migration **022** applied on staging (`supabase migration list` / advisors)
- [ ] Trial→paid mint regression (FA-H01) retested on staging
- [ ] Stream rate limit + auth
- [ ] Sentry events scrub tokens/emails (`beforeSend`)
- [ ] No production writes from this pass

---

## 4) Store release checklist

- [ ] `eas.json` **production** `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED=false`
- [ ] Development profile Clinical also `false` (unless intentionally changed)
- [x] `bun run release:preflight` components green locally (`frozen-lockfile` + doctor + tsc) — **staging still ops-blocked**
- [x] `bun run test:ci` green
- [ ] Privacy / Terms / support URLs current
- [ ] Paywall products match RevenueCat dashboard (do not invent product IDs)
- [ ] Android AAB / iOS archive from production profile
- [ ] Review notes: Clinical not marketed if disabled
- [ ] Post-submit: smoke on TestFlight / Play internal **without** enabling Clinical in production channel

---

## 5) Bug report template (for new defects)

```
Repro:
Cause:
Impact:
File/symbol:
Severity: CRITICAL|HIGH|MEDIUM|LOW
Minimal patch:
Regression test:
Risk/rollback:
```

---

## 6) Commands reference

```bash
bun run lint
bunx tsc --noEmit
bun run test:ci
bun run doctor
```

Optional targeted:

```bash
bun run test:ci -- --testPathPattern=clinical-credits-stream
bun run test:ci -- --testPathPattern=revenuecat-idempotency
bun run test:ci -- --testPathPattern=rls-security-hotfix
```
