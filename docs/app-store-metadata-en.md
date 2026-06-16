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
English, Romanian, Spanish, and Portuguese.

EDUCATIONAL USE
MEDVBA is for study and exam preparation. It does not replace medical school, clinical training, or professional advice.

Support: https://medvba.app/support
```

---

## Review Notes (paste in App Review Information → Notes)

**Which block to use:** `npm run review-notes:mode` → exit 1 is **expected** (Kinde does not support in-app password grant). Use **Primary** below and fill **Username / Password** in App Store Connect.

### App Store Connect — Sign-in credentials (required fields)

Create or verify this user in **Kinde** (Users → Verified, **Email + password** connection — not email code). Password must match what you paste in ASC.

| Field | Value |
|-------|--------|
| **Username** | `contact@devaieood.com` |
| **Password** | *(your review password — same as `VERIFY_AUTH_PASSWORD` in local `.env`; do not commit)* |

Example local setup: copy [`.env.example`](../.env.example) → `.env` with `VERIFY_AUTH_EMAIL=contact@devaieood.com` and `VERIFY_AUTH_PASSWORD=…` (min. 8 characters; do not commit).

---

### Primary (recommended for review)

Paste into **Notes**. Use the **same email and password** as in the Username / Password fields above.

```
DEMO ACCOUNT (email + password — use on the Kinde page, not in-app):
Email: contact@devaieood.com
Password: (same as the Password field you entered in App Review Information above)

HOW TO SIGN IN (required for review):
1. Sign in with Apple (iOS) or Sign in with Google, OR
2. Tap "Sign in with email" → secure browser opens → enter the demo email and password on the Kinde page
   (Email + password connection — no verification code). You may pre-fill the email in the app field above the button.

Do not use any in-app-only password field (removed in release builds); password is entered on the Kinde browser page only.

After sign-in:
1. Complete onboarding if shown.
2. Quiz: Home or Quiz tab → pick a chapter → answer questions.
3. Study: Study tab → chapter summary and audio.
4. AI Tutor: Tutor tab → ask a study question.
5. Social: Chat tab → direct messages (text only, no live video).
6. Premium: optional; Restore purchases on the paywall screen.

PREMIUM / FULL ACCESS:
Sign in with the test account email and password above (tap "Sign in with email" → enter credentials on the Kinde page).
This account has Premium enabled for review: unlimited quizzes, AI tutor, all study chapters, and anatomy modules.
Sign in with Apple or Google using a personal account will NOT include Premium — use the test account for full feature testing.

Sign in with Apple is on iOS because Google sign-in is also offered (App Store guideline 4.8).

No live Zoom or video calls. Social is messenger-style chat only.

Contact: support@medvba.app
```

### Alternate (deprecated — in-app ROPC not supported by Kinde)

Do **not** use unless `npm run diagnose:kinde-password` exits 0 (unlikely). Kinde does not support `grant_type=password`; see `docs/KINDE_ROPC_NOT_SUPPORTED.md`.

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
