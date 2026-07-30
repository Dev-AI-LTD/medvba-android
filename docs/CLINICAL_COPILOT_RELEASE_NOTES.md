# Clinical Copilot — release notes (draft)

**Status:** shipped behind feature flag `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED` (default **false**).

Live App Store / Google Play builds keep the current AI Tutor and Premium experience until the flag is enabled in a controlled release.

## What was added (inactive until flag ON)

- Migrations `019` + `020` + `021`: clinical tables + `ai_entitlements` + `revenuecat_events` (webhook idempotency)
- Backend tRPC `clinical.*` (spec aliases + `syncEntitlement` + getSession / archive / getCredits / createTopupIntent)
- Credits: entitlements cache + ledger; costs explain=1, follow-up=1, case=4, image=6, summary=2
- SSE `POST /api/clinical/stream` for clinical replies
- Quiz CTA + contextual paywall (flag ON)
- Tutor Clinical mode: disclaimer v1 gate, top-up sheet, streaming replies, trial banner
- Home card “Solve a clinical case” (flag ON)
- Analytics events `clinical_*` via monitoring breadcrumbs
- Paywall optional Clinical Copilot copy (flag ON)
- RevenueCat: accepts `pro` + `medvba_pro_ai`; webhook grants monthly/top-up with txn dedupe; client never grants credits

## What did NOT change for store users (flag OFF)

- `tutor.chat` free limit (10 / 24h) and premium unlimited
- Existing paywall entitlement `pro` purchase flow
- Quiz answering / static explanations
- No Home clinical card, no streaming client path

## Rollout checklist

1. EAS **`internal`**: client flag ON (`EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED=true` in `eas.json`) → TestFlight / Play internal
2. Railway: `CLINICAL_COPILOT_ENABLED=true` on the API those builds call (single API: store clients stay UI-gated off)
3. QA: explain, case, stream reply, credits, disclaimer v1, top-up sheet, paywall / TOPUP paths
4. Legal: educational / simulated only — not diagnosis
5. EAS **`production`**: keep client flag **false** until KPI smoke passes
6. Play: ship AAB with `targetSdkVersion` **36** (see `ANDROID_API_36.md`)

## Messaging

Use “educational Clinical Copilot sessions”, never “diagnoses”.
