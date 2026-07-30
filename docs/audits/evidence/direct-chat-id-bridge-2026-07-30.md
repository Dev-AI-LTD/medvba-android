# Direct chat_id → direct_chat_id bridge — 2026-07-30

- Scope: repo bootstrap + idempotent migration `026` + **staging live apply**
- Staging reset + canonical chain: **DONE** on `blwgdunmnpkpggtpaxwt` at SHA `7518d14` (see `staging-cli-ops-2026-07-30.md`)
- Production: apply `026` **before/with** any client that requires `direct_chat_id` (separate approval; not done this turn)
- Not done: `022`–`024` apply, FA-H03/H05 close, Muse keys, Redis
- Clinical EAS / Railway production: **unchanged**

## Files

| Path | Change |
|------|--------|
| `supabase/schema.sql` / `schema-fix.sql` | Greenfield `direct_chat_id` |
| `005` / `007` / `014_direct_chats_fk_profiles` | Companion text → `direct_chat_id` |
| `026_rename_chat_id_to_direct_chat_id.sql` | 4-state idempotent rename + RLS recreate |
| `lib/supabase-hooks.ts` | Participants/messages/realtime → `direct_chat_id` |
| `lib/__tests__/direct-chat-id-bridge.test.ts` | Schema + branch contracts |

## Staging post-land (done)

1. CI DoD on bridge SHA — assumed land at `7518d14`
2. Reset staging public schema only (CLI wipe; project kept)
3. Applied `001`–`003` + `schema.sql` + `004`–`021` + `025`–`026` (skip 022–024)
4. Validated columns/FK/UNIQUE + smoke chat; `/health/ready` `supabaseReady=true`
