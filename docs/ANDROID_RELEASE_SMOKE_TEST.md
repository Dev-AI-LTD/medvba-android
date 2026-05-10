# Android release smoke test (Kinde + Supabase JWT)

Run on an **internal testing** build (or release candidate) against the **intended production** backend and Supabase project.

## Prerequisites

- Railway env matches [RELEASE_CHECKLIST.md](../RELEASE_CHECKLIST.md) §3.1 (especially JWT secret alignment with Supabase).
- EAS production env matches §3.2.

## 1) Auth

1. **Fresh install** (clear app data or new device).
2. **Login** with Kinde (e.g. Google/Facebook/Apple as enabled in Kinde).
3. Expect: app reaches **authenticated** UI — no infinite loading, no blank screen after redirect.
4. Optional: capture `access_token` from your session exchange and run:
   ```bash
   bun run release:decode-jwt -- '<paste_token>'
   ```
   Confirm `sub` (Kinde id), `profile_id` (UUID), `role: "authenticated"`.
5. **Logout** — expect logged-out state; reopen app if needed to confirm no stale session loop.

## 2) Profile / RLS

1. In Supabase (or app UI), confirm a **`profiles`** row exists for the user with **`kinde_sub`** = Kinde `sub` (server creates/links via `/api/auth/session`).
2. **Update own profile** — must succeed.
3. **Cross-user privacy** — attempt to read/update another user’s private rows (e.g. via SQL editor with a second test user, or API if applicable) — must be **denied** by RLS (`42501` / empty result as designed).

## 3) AI usage

1. Trigger first **tutor / AI** action for the day (or billing period).
2. Confirm **usage increments** (table your product uses, e.g. `ai_question_usage`).
3. Confirm **limits** or **premium bypass** matches `EXPO_PUBLIC_PAYWALL_ENABLED` + RevenueCat state.

## 4) Chats / rooms

1. **Create** a room or chat as user A.
2. **Send** a message; **read** thread — only authorized rows.
3. Backend logs: **no** repeated PostgREST `JWT` / RLS policy failures.

## 5) Regression: token expiry (~15 minutes)

Minted Supabase JWT expires in **15m** (`backend/auth/mint-supabase-jwt.ts`). After idle >15m, Supabase calls should recover after **re-exchange** (open app, trigger auth refresh path). If requests stay broken until reinstall, investigate client session exchange.

## Evidence to attach to release record

- Screenshots or short notes per section above.
- Link to EAS build + Play internal version.
