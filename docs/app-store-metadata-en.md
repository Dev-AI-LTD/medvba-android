# App Store metadata (English) — MEDVBA

Copy into **App Store Connect** → MEDVBA → version → **App Store** tab (English).

Positioning: **medical exam prep** — quiz, study+audio, AI tutor, **Chat** (not live video). No Zoom / live sessions in copy.

---

## Promotional Text (max 170 characters)

```
Thousands of anatomy quizzes, AI tutor, chapter summaries with audio, and detailed progress stats — built for medical exam prep.
```

---

## Description (short + feature bullets)

Use as base; adjust length to ASC limits.

```
MEDVBA helps you prepare for medical school admission and anatomy exams with thousands of multiple-choice questions, structured study chapters, and an AI tutor.

QUIZ
• Thousands of questions across anatomy, physiology, pathology, and more
• Chapter-based practice and timed sessions
• Detailed accuracy and progress tracking

STUDY
• Concise chapter summaries
• Listen to recorded audio for each topic
• Learn before you test yourself

AI TUTOR
• Ask questions and get clear explanations
• Deepen concepts beyond memorization

CHAT
• Message other students in the app
• Find study partners — text chat, not live video calls

PROGRESS
• Streaks, stats, and leaderboards
• Track improvement over time

PREMIUM
• Optional subscription unlocks higher daily limits and premium features
• Manage or restore purchases in the app

LANGUAGES
English (launch UI). Romanian support is included in the codebase and enabled in rollout builds.

EDUCATIONAL USE
MEDVBA is for study and exam preparation. It does not replace medical school, clinical training, or professional advice.

Support: https://medvba.app/support
```

---

## Previews and Screenshots (iPhone 6.5" Display)

Upload framed PNGs from [`docs/app-store-screenshots/ios-6.5/`](../docs/app-store-screenshots/ios-6.5/) in order — see [`README-upload-order.md`](../docs/app-store-screenshots/README-upload-order.md).

**Regenerate after changing captures:**

```bash
npm run screenshots:ios-6.5
```

| # | File | Purpose |
|---|------|---------|
| 1 | `01-medvba.png` | Hero / value prop (install sheet slot 1) |
| 2 | `02-premium-subscription.png` | **In-app paywall** — monthly/yearly + restore (install sheet slot 2) |
| 3 | `03-practice-quizzes.png` | Core feature (install sheet slot 3) |
| 4–8 | `04-…` through `08-…` | Dashboard, anatomy, AI Tutor, premium content, settings |

Apple uses only the **first 3** screenshots on the app installation sheet — paywall must be **#2**.

**App Previews (video):** optional (0 of 3 is fine). See [`README-app-previews.md`](../docs/app-store-screenshots/README-app-previews.md).

**Fresh paywall capture:** [`CAPTURE-PAYWALL.md`](../docs/app-store-screenshots/CAPTURE-PAYWALL.md) — sign in with free review account on TestFlight, open paywall, screenshot, regenerate.

**iPad:** reuse iPhone set or add iPad captures separately if required for your ASC version.

---

## Review Notes (paste in App Review Information → Notes)

**Which block to use:** `npm run review-notes:mode` → exit 1 is **expected** (Kinde does not support in-app password grant). Use **Primary** below.

### Rejection fix (2026-06-19, build 61) — three items

| Guideline | Issue | Fix (where) |
|-----------|--------|-------------|
| **2.3.2** | IAP promotional images = app icon / duplicates | **App Store Connect only** — see [IAP promotional images](#iap-promotional-images-232) below |
| **2.1(a)** | Sign in with Apple not working on iPad | **TestFlight on iPad** + verify Kinde Apple connection in EAS production; rebuild if needed |
| **2.1** | Need demo account with **expired** subscription | **Second Kinde user** (no review premium) — see credentials below |

---

### App Store Connect — Sign-in credentials (required fields)

Apple asked for an account with an **expired subscription** to test purchase / restore. Use that account in the **Username / Password** fields. Keep the premium demo account in **Notes** for full-feature testing.

| Field | Value |
|-------|--------|
| **Username** | `boctavian2014@gmail.com` |
| **Password** | *(same as `VERIFY_AUTH_PASSWORD` in Kinde — do not commit)* |

**Setup (once, before resubmit):**

1. Kinde → user `boctavian2014@gmail.com` → **Verified**, **Email + password** connection.
2. Do **not** add this email to `EXPO_PUBLIC_APP_REVIEW_PREMIUM_EMAILS`.
3. Sign in once in TestFlight (hosted email) so a Supabase profile exists.
4. Set subscription to expired/free: `npm run expire-review-subscription -- boctavian2014@gmail.com`.
5. Premium demo (separate): `contact@devaieood.com` — `npm run grant-review-premium` for that user only.

Example local setup: copy [`.env.example`](../.env.example) → `.env` with `VERIFY_AUTH_EMAIL=contact@devaieood.com` and `VERIFY_AUTH_PASSWORD=…` (min. 8 characters; do not commit).

---

### IAP promotional images (2.3.2)

In **App Store Connect → Monetization → Subscriptions** (each product: `medvba_pro_monthly`, `medvba_pro_yearly`):

- **Option A (fastest):** Delete the promotional image on each subscription if you are not promoting IAP on the store today.
- **Option B:** Upload a **unique** image per product (e.g. paywall screenshot showing monthly vs yearly). **Do not** use the app icon. **Do not** reuse the same image for both products.

Repo assets and step-by-step: [`docs/app-store-screenshots/README-iap-promotional-images.md`](../docs/app-store-screenshots/README-iap-promotional-images.md).

No app rebuild required for this item.

---

### Primary (recommended for review)

Paste into **Notes**. **Username / Password** fields = expired-subscription account (`boctavian2014@gmail.com`).

```
SUBSCRIPTION / PURCHASE FLOW (expired account — matches Username / Password fields):
Email: boctavian2014@gmail.com
Password: (same as Password field above)
Sign in: tap "Sign in with email" → Kinde browser → enter credentials.
This account has NO active Premium (expired / free tier). You should see the paywall when hitting limits or opening Premium.
Test: Subscribe (Sandbox), Restore purchases, and Manage subscription from Settings.

PREMIUM FEATURE TESTING (second account — in Notes only):
Email: contact@devaieood.com
Password: (same review password used when this account was created in Kinde)
Sign in via "Sign in with email" → Kinde browser.
This account has Premium enabled for review (unlimited quiz, AI tutor, study chapters). Use it to test full app features.

HOW TO SIGN IN (all accounts):
1. Sign in with Apple (iOS) or Sign in with Google, OR
2. Tap "Sign in with email" → secure browser opens → enter email and password on the Kinde page
   (Email + password connection — no verification code).

Do not use any in-app-only password field; password is entered on the Kinde browser page only.

SIGN OUT / SWITCH ACCOUNT:
Settings → Sign out, then sign in again. If Kinde auto-fills the previous user, choose "Use another account" / "Not you?" on the hosted page.

After sign-in:
1. Complete onboarding if shown.
2. Quiz: Home or Quiz tab → pick a chapter → answer questions.
3. Study: Study tab → chapter summary and audio.
4. AI Tutor: Tutor tab → ask a study question.
5. Social: Chat tab → direct messages (text only, no live video).

Sign in with Apple is on iOS because Google sign-in is also offered (App Store guideline 4.8).
Tested on iPad (iPhone compatibility mode) before resubmit.

No live Zoom or video calls. Social is messenger-style chat only.

Contact: support@medvba.app
```

### Alternate (deprecated — in-app ROPC not supported by Kinde)

Do **not** use unless `npm run diagnose:kinde-password` exits 0 (unlikely). Kinde does not support `grant_type=password`; see `docs/KINDE_ROPC_NOT_SUPPORTED.md`.

---

## Pre-submit checklist (metadata + visuals)

Before **Submit for Review**:

- [ ] **iPhone 6.5" screenshots:** upload `docs/app-store-screenshots/ios-6.5/01` … `08` in order; **#2 = paywall** (`02-premium-subscription.png`).
- [ ] **IAP promotional images:** delete both OR upload unique images per product ([`README-iap-promotional-images.md`](../docs/app-store-screenshots/README-iap-promotional-images.md)).
- [ ] **Sign-in fields:** Username `boctavian2014@gmail.com`, Password matches Kinde.
- [ ] **Notes:** paste Primary block above; premium demo `contact@devaieood.com` only in Notes.
- [ ] **Support URL:** `https://medvba.app/support` (align Marketing/Privacy URLs with live pages).
- [ ] **Build:** TestFlight build linked (e.g. 63 / 1.0.30); subscriptions **Ready** and attached to version.
- [ ] **RevenueCat:** paywall template has Terms + Privacy URLs.

---

## URLs

| Field | URL |
|-------|-----|
| Support | `https://medvba.app/support` |
| Marketing | `https://medvba.app/` |
| Privacy | Your live privacy policy URL on medvba.app |

---

## Keywords

See **`app-store-keywords.md`** (do not use: live, Zoom, video, streaming).

---

## What NOT to write (rejection risk)

- Live classes, Zoom rooms, video calls, streaming
- Features not in the TestFlight build
- “Free” / “best app” / competitor names in keywords
