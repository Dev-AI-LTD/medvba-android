# Clinical Copilot (feature-flagged)

Educational Clinical Copilot on top of the existing AI Tutor. **Off by default** so App Store / Google Play users are not disrupted until you opt in.

## Safety for live users

| Area | Behavior with flag OFF (default) |
|------|-----------------------------------|
| Classic `tutor.chat` | Unchanged (10 free / 24h, premium unlimited) |
| Quiz flow | No new CTA visible |
| Home | No Clinical card |
| Paywall copy | Existing Premium copy |
| RevenueCat entitlements | Accept **both** legacy `pro` and `medvba_pro_ai` so live subscribers keep Premium |
| Credits | Client never grants credits; only RC purchase → webhook / `clinical.syncEntitlement` |

Public store builds must keep:

```
EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED=false
```

This is **explicit** on the EAS `production` profile in `eas.json`. Do **not** set it `true` as a production/store default.

## TestFlight / Play internal (Clinical ON) + Android API 36

### Client flag by EAS profile

| EAS profile | `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED` | Use for |
|-------------|----------------------------------------|---------|
| **`internal`** | **`true`** | iOS TestFlight + Play **internal** testing |
| **`production`** | **`false`** | App Store / Play production (live app) |
| **`development`** | **`false`** | Dev client (enable locally via `.env` if needed) |

Local `.env` should keep Clinical **false** (see `.env.example`). Profile env from `eas.json` is applied on EAS cloud builds.

### Backend (Railway)

For Clinical API/stream to work on TestFlight/internal builds, set on the API those builds call:

```
CLINICAL_COPILOT_ENABLED=true
```

**Single Railway API (typical):** enabling the backend flag exposes Clinical endpoints to any client that calls them. Store builds with the Expo flag **false** do not show Clinical UI and should not hit those routes; classic Tutor keeps working either way. Prefer a staging API if you need backend ON without any risk to production traffic.

#### Fix: `No procedure found on path 'clinical.startCase'`

The TestFlight client has Clinical UI, but the live API was built **without** `clinicalRouter` (code not deployed).

1. Push/commit includes `backend/trpc/clinical.ts` + `app-router` mount.
2. Railway → set `CLINICAL_COPILOT_ENABLED=true`.
3. Redeploy Railway.
4. Retry Chest pain on the same TestFlight build (no new IPA required for API-only fix).

Client UI/layout/tutorial changes still need a new **internal** EAS build.

### Android target SDK (Play requirement)

`expo-build-properties` in `app.config.ts` sets:

- `compileSdkVersion`: **36**
- `targetSdkVersion`: **36**
- `buildToolsVersion`: `36.0.0`

`android.versionCode` is bumped for Play uploads (currently **43**). iOS `buildNumber` bumped for TestFlight (**67**). See also [`ANDROID_API_36.md`](ANDROID_API_36.md).

### After API fix: new internal build for UI polish

Layout grid + how-to tutorial ship only in a new client binary:

```powershell
cd C:\Users\octav\Desktop\MEDVBA3\medvba-android
eas build --platform ios --profile internal --non-interactive
eas submit --platform ios --profile internal --latest --non-interactive
```

Expect **1.0.31 (67)**. For API-only (`clinical.startCase` missing), redeploy Railway first — no new IPA required.

### Exact build / submit commands

From `medvba-android` (Clinical ON — use **`internal`**, not `production`):

```powershell
cd C:\Users\octav\Desktop\MEDVBA3\medvba-android
bun install --frozen-lockfile
bun run doctor

# iOS → TestFlight
eas build --platform ios --profile internal
eas submit --platform ios --profile internal --latest

# Android → Play internal testing
eas build --platform android --profile internal
eas submit --platform android --profile internal --latest
```

Live store (Clinical OFF — keep using **`production`**):

```powershell
eas build --platform ios --profile production
eas build --platform android --profile production
eas submit --platform ios --profile production --latest
eas submit --platform android --profile production --latest
```

### Manual steps after config

1. **Railway:** set `CLINICAL_COPILOT_ENABLED=true` (and RC webhook secrets if not already) on the API used by TestFlight/internal.
2. **App Store Connect:** wait for processing → Internal Testing group → install via TestFlight.
3. **Play Console:** accept internal track upload; install via internal testing link.
4. **Do not** flip Clinical to `true` on `production` until QA passes.

## Architecture: RevenueCat vs Supabase

| System | Source of truth for |
|--------|---------------------|
| **RevenueCat** | Subscription lifecycle, entitlements, store purchases |
| **Supabase** `ai_entitlements` + `ai_credit_ledger` | Credit balance and consumption |
| **Backend** | Validates entitlement and debits credits **before** each Clinical AI call |

Flow:

1. Client purchases via RevenueCat SDK (`profile.id` = RC `appUserID`).
2. RevenueCat webhook → Railway → idempotent `revenuecat_events` → sync `subscriptions` + grant credits.
3. Client may call `clinical.syncEntitlement` after purchase/restore (refresh only; no local grant).

## Products (configure in RevenueCat dashboard)

### Subscriptions (entitlement `medvba_pro_ai`; also accept legacy `pro`)

| Product id | Credits |
|------------|---------|
| `medvba_pro_ai_monthly` | 120 / month |
| `medvba_pro_ai_annual` | 150 / month equivalent |

### Consumable top-ups (no permanent entitlement)

| Product id | Credits |
|------------|---------|
| `medvba_ai_credits_50` | +50 |
| `medvba_ai_credits_100` | +100 |
| `medvba_ai_credits_250` | +250 |

Legacy aliases still recognized: `credits_50`, `medvba_credits_50`, etc.

## Enable (staging / controlled rollout)

1. Apply DB migrations (once):

```bash
cd medvba-android
npm run db:run-sql -- supabase/migrations/019_clinical_copilot_schema.sql
npm run db:run-sql -- supabase/migrations/020_clinical_copilot_spec_align.sql
npm run db:run-sql -- supabase/migrations/021_revenuecat_events.sql
```

2. Backend (Railway) — secrets stay server-side:

```
CLINICAL_COPILOT_ENABLED=true
REVENUECAT_SECRET_API_KEY=sk_...
REVENUECAT_WEBHOOK_AUTHORIZATION=your_webhook_bearer_secret
# alias also accepted:
# REVENUECAT_WEBHOOK_AUTH_TOKEN=...
REVENUECAT_ENTITLEMENT_ID=medvba_pro_ai

# Clinical AI provider (explicit). Tutor stays on AI_API_KEY / OPENAI_API_KEY.
AI_PROVIDER=muse
META_MODEL_API_KEY=...
META_MODEL_API_BASE_URL=https://...   # OpenAI-compatible /chat/completions base
META_MODEL_NAME=muse-spark-1.1
# If AI_PROVIDER is absent or openai, Clinical uses AI_API_KEY + AI_BASE_URL + AI_CLINICAL_MODEL.
# Never put META_MODEL_* under EXPO_PUBLIC_*.

INTERNAL_HEALTH_SECRET=...            # Bearer for GET /health/ready
```

### Muse Phase 1 — credit / abort policy

| Event | Upstream | Credits | `ai_usage_events.status` |
|-------|----------|---------|--------------------------|
| Client abort / disconnect | aborted | **charge kept** | `aborted` |
| Server timeout | aborted | **refund once** | `timeout` |
| Provider 4xx/5xx before result | — | **refund once** | `provider_error` |
| Success | — | kept | `ok` |
| Guard reject (size/schema) | no call | **zero debit** | `guard_reject` |

Usage rows store `request_id`, tokens (nullable), latency, credit cost — **never** prompts, images, or secrets. Writes are best-effort.

Health: public `GET /health` returns `ok` + `clinicalCopilotEnabled` (+ optional version). Internal `GET /health/ready` requires `Authorization: Bearer $INTERNAL_HEALTH_SECRET` and may report `aiProvider` / `hasMetaModelApiKey` booleans only.

Webhook URL: `POST https://<railway-host>/api/webhooks/revenuecat`  
Authorization: `Bearer <REVENUECAT_WEBHOOK_AUTHORIZATION>`

3. App build — use EAS **`internal`** (embeds `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED=true`). Keep local `.env` false:

```
EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED=false
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_...
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_...
```

4. Ship a **production** store build only after QA (Clinical stays **false** on that profile).

## Schema

- `019` / `020`: clinical tables + `ai_entitlements` / ledger (column remains `user_id` = `profiles.id`)
- `021`: `revenuecat_events` for webhook idempotency (service role only; no client writes)
- `025`: `ai_usage_events` (service role only; no PHI)

## Webhook event handling

| Event | Behavior |
|-------|----------|
| `INITIAL_PURCHASE` / `RENEWAL` | Sync Premium + Pro AI; monthly grant idempotent by `revenuecat_transaction_id` |
| `NON_RENEWING_PURCHASE` | Top-up once by product id |
| `CANCELLATION` | Keep access until expiry; update `renews_at`; do **not** strip credits |
| `EXPIRATION` / `REFUND` | Revoke `subscriptions` + `ai_entitlements.is_pro` |

## API (tRPC)

| Spec name | Alias / legacy |
|-----------|----------------|
| `getStatus` | `isPro` / `isProAi`, `creditBalance`, `trialCreditsRemaining`, `renewsAt`, `costs`, `canStartClinicalCase` |
| `syncEntitlement` | After purchase/restore — RC REST sync + status payload (prefer this over a parallel `clinicalAi` router) |
| `startExplainQuestion` | `explainQuestion` |
| `startClinicalCase` | `startCase` |
| `sendClinicalMessage` | `reply` |
| `analyzeClinicalImage` | `analyzeImage` |
| `generateStudySummary` | `generateSummary` |
| `getSession` / `archiveSession` | — |
| `getCredits` / `createTopupIntent` | — |
| `listSessions` | — |

## Streaming

`POST /api/clinical/stream` (SSE) when flag ON — used by Tutor clinical replies.

## Credits

| Action | Cost |
|--------|------|
| Explain | 1 |
| Follow-up / continue | 1 |
| Clinical case start | 4 |
| Image | 6 |
| Summary | 2 |

Trial: `ai_entitlements.trial_credits_remaining` (default 3). Errors: `PAYWALL_REQUIRED` / `TOPUP_REQUIRED`.

Classic Tutor still uses `ai_question_usage` — **not** changed.

## Legal

Disclaimer version `v1` — educational / simulated only. Never market as medical diagnosis.

## Store checklist

- [ ] `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED=false` on public App Store / Play builds (`production` profile)
- [ ] Clinical QA uses EAS `internal` (flag true) → TestFlight / Play internal
- [ ] Legacy entitlement `pro` still unlocks Premium when Clinical flag is off
- [ ] Confirm classic Tutor free limit still 10/24h
- [ ] Android `targetSdkVersion` / `compileSdkVersion` = **36**
- [ ] RC dashboard: products, entitlement `medvba_pro_ai`, offerings, webhook auth secret on Railway only
