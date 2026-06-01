# Supabase — migrări de aplicat pe producție

**Ghid complet (snippet-uri dashboard vs repo):** [SUPABASE_SQL_GUIDE.md](SUPABASE_SQL_GUIDE.md)

**Health check (read-only):** copiază `supabase/migrations/000_prod_health_check.sql` în SQL Editor → Run.

Rulează migrările lipsă în **ordine 001→017** dacă health check arată `ok = false`.

## Verificare rapidă (subscriptions RLS)

Dacă policy-ul permite doar `free` la UPDATE din client, migrarea **009** e activă:

```sql
SELECT pol.polname, pg_get_expr(pol.polqual, pol.polrelid) AS using_expr,
       pg_get_expr(pol.polwithcheck, pol.polrelid) AS with_check
FROM pg_policy pol
JOIN pg_class cls ON cls.oid = pol.polrelid
JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
WHERE nsp.nspname = 'public' AND cls.relname = 'subscriptions';
```

La `Users can update own subscription`, `with_check` ar trebui să conțină `status` = `'free'` (sau echivalent).

## Migrări importante pentru release iOS

| Fișier | Scop |
|--------|------|
| `005_kinde_jwt_rls.sql` | `current_profile_id()` din JWT MEDVBA |
| `009_subscriptions_client_no_self_premium.sql` | Clientul **nu** poate seta `premium`/`trial` direct în DB |
| `017_user_reports.sql` | Tabel raportări UGC (backend tRPC + service role) |

## Ordine în folder

`supabase/migrations/001` … `017` — nu sări peste **005** înainte de **009**.

## După 009 + fix backend

- Premium în DB: **RevenueCat webhook** sau **`syncFromClient`** (verifică REST pe server — vezi `backend/trpc/subscription.ts`).
- App: `useUpdateSubscription` poate primi RLS error la premium — e **așteptat**; sync-ul merge prin tRPC.

## Tu (manual)

- [x] Health check prod: 6/6 `ok` (2026-05-25)
- [x] `009` — `subscriptions_rls_free_only` pe prod
- [x] `017` — `user_reports_table` pe prod
- [ ] Migrări 001–017: confirmare completă (health check acoperă punctele critice pentru release)

Last updated: 2026-05-25.
