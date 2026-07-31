# MEDVBA Release Checklist

## Public Store Release — Clinical ON (OpenAI until Muse)

Use this section for App Store / Google Play **production** candidates while Meta Model API keys are unavailable.

### Client (EAS)

- [ ] `eas.json` → profile **`production`**: `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED=true`
- [ ] `eas.json` → profile **`development`**: Clinical remains **`false`**
- [ ] `eas.json` → profile **`internal`**: Clinical **`true`** (QA)
- [ ] `app.config.ts` production/internal fallback aligns with Clinical ON
- [ ] Local `.env` keeps Clinical **false** unless intentionally testing
- [ ] New EAS **production** binary after flag flip (JS Clinical UI ships in the build)

### Backend (Railway **production**)

- [ ] `CLINICAL_COPILOT_ENABLED=true`
- [ ] `AI_PROVIDER=openai` (not `muse` until Meta keys exist)
- [ ] `AI_API_KEY` or `OPENAI_API_KEY` set
- [ ] Do **not** set `EXPO_PUBLIC_CLINICAL_COPILOT_ENABLED` on Railway
- [ ] Do **not** set empty `META_MODEL_*` placeholders
- [ ] Deploy from GitHub SHA that includes Clinical + tutor stream (prefer Deploy commit, not Redeploy of an old image)
- [ ] Smoke: `GET /health` → `clinicalCopilotEnabled: true`
- [ ] Smoke: `GET /health/ready` → `aiProvider: "openai"`
- [ ] Smoke: `POST /api/clinical/stream` without auth → **401** (not 404)

### Product / compliance

- [ ] Disclaimer EN: *Educational / simulated content only. Does not replace professional medical diagnosis or care.*
- [ ] No Store screenshots that imply real diagnosis/treatment
- [ ] App Review notes: educational exam prep; Clinical simulated; temporarily OpenAI-backed
- [ ] Classic Tutor limits remain separate from Clinical credits
- [ ] Restore purchases visible on paywall

### Muse reactivation (later)

- [ ] Meta Model API key from [dev.meta.ai](https://dev.meta.ai/)
- [ ] Set `META_MODEL_API_KEY`, `META_MODEL_API_BASE_URL=https://api.meta.ai/v1`, `META_MODEL_NAME=muse-spark-1.1`
- [ ] Set `AI_PROVIDER=muse`
- [ ] Redeploy + smoke `aiProvider=muse`, `hasMetaModelApiKey=true`
- [ ] No VPN / false-entity workarounds documented as official path

### Out of scope for this checklist

- Submit / publish without explicit ops confirmation
- Supabase production schema changes
- Enabling Clinical on EAS `development` by default
