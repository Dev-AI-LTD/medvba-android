# App Store metadata (English) — MEDVBA

Copy into **App Store Connect** → MEDVBA → version → **App Store** tab (English).

Positioning: **medical exam prep** — quiz, study+audio, AI tutor, **Chat** (not live video). No Zoom / live sessions in copy.

---

## Promotional Text (max 170 characters)

```
30,000+ anatomy quizzes, AI tutor, chapter summaries with audio, and detailed progress stats — built for medical exam prep.
```

---

## Description (short + feature bullets)

Use as base; adjust length to ASC limits.

```
MEDVBA helps you prepare for medical school admission and anatomy exams with thousands of multiple-choice questions, structured study chapters, and an AI tutor.

QUIZ
• 30,000+ questions across anatomy, physiology, pathology, and more
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

**Which block to use:** run `npm run review-notes:mode` from `medvba-android` (runs `diagnose:kinde-password`). Exit 0 → **Alternate** + fill Username/Password; exit 1 → **Primary** (Apple/Google only).

### Primary (recommended for review)

```
HOW TO SIGN IN (required for review):
1. Sign in with Apple (iOS) or Sign in with Google, OR
2. Tap "Sign in with email" → secure browser opens → enter review email and password on the Kinde page
   (Email + password connection — no verification code). Optional: pre-fill email in the field above the button.

Do not use any in-app-only password field (removed); password is entered on the Kinde browser page only.

After sign-in:
1. Complete onboarding if shown.
2. Quiz: Home or Quiz tab → pick a chapter → answer questions.
3. Study: Study tab → chapter summary and audio.
4. AI Tutor: Tutor tab → ask a study question.
5. Social: Chat tab → direct messages (text only, no live video).
6. Premium: optional; Restore purchases on the paywall screen.

Sign in with Apple is on iOS because Google sign-in is also offered (App Store guideline 4.8).

No live Zoom or video calls. Social is messenger-style chat only.

Contact: support@medvba.app
```

Leave **Username** / **Password** empty in App Review Information when using the notes above.

### Alternate (when `npm run diagnose:kinde-password` exits 0)

In-app login uses **email + password only** (no email OTP code). Set these in App Review Information **Username** / **Password** fields.

```
Demo account (email + password, no OTP):
Email: contact@devaieood.com
Password: (your VERIFY_AUTH_PASSWORD from local .env — do not commit)

How to test:
1. Login screen → enter email and password → Sign In (in-app, no verification code).
2. Or Sign in with Apple (iOS) or Sign in with Google.
3. Quiz, Study, Tutor, Chat, Premium — same as Primary notes.

Contact: support@medvba.app
```

Replace email if your `VERIFY_AUTH_EMAIL` differs. Use `npm run create:review-user` after Kinde password grant works.

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
