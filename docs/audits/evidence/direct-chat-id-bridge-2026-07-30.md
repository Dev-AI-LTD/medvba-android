# Direct chat_id → direct_chat_id bridge — 2026-07-30

- Scope: repo bootstrap + idempotent migration `026` (no live SQL this turn)
- Staging reset: **WAIT** until this lands on `main` + CI DoD green
- Production: apply `026` **before/with** any client that requires `direct_chat_id`
- Not done: staging reset, live migrate, `022`–`024` apply, FA-H03/H05 close
- Clinical EAS / Railway production: **unchanged**

## Files

| Path | Change |
|------|--------|
| `supabase/schema.sql` / `schema-fix.sql` | Greenfield `direct_chat_id` |
| `005` / `007` / `014_direct_chats_fk_profiles` | Companion text → `direct_chat_id` |
| `026_rename_chat_id_to_direct_chat_id.sql` | 4-state idempotent rename + RLS recreate |
| `lib/supabase-hooks.ts` | Participants/messages/realtime → `direct_chat_id` |
| `lib/__tests__/direct-chat-id-bridge.test.ts` | Schema + branch contracts |

## Post-land ops (next)

1. Confirm CI DoD green on the bridge SHA
2. Reset/recreate staging Supabase only (ref ≠ production)
3. Apply canonical chain `001`–`003` + `schema.sql` + `004`–`026`
4. Smoke direct chat; keep `022`–`024` on hold until on `main` + CI green
