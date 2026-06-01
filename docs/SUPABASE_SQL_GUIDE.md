# Supabase SQL — ghid pentru Medix Study Hub / MEDVBA

În dashboard ai **~106 snippet-uri PRIVATE** în SQL Editor. În repo ai **17 migrări ordonate** în `supabase/migrations/`.  
**Sursa de adevăr pentru release:** folderul din repo, nu snippet-urile salvate manual.

Auth: [AUTH_ARCHITECTURE.md](AUTH_ARCHITECTURE.md) (Kinde + JWT, nu Supabase Auth UI).

---

## 1. Ce vezi în SQL Editor vs ce e în repo

| În Supabase (screenshot) | Echivalent în repo |
|--------------------------|-------------------|
| Kinde JWT-Based RLS Profile Isolation | `005_kinde_jwt_rls.sql` |
| RLS Policies for Direct Chat Messaging | `007_fix_direct_chat_rls_recursion.sql` + `014_direct_chats_fk_profiles.sql` |
| Create/Normalize User Reports Table | `017_user_reports.sql` |
| Migrate subscriptions to profiles FK | `014_subscriptions_profiles_fk.sql` |
| Restrict AI Usage Writes to Service Role | `010_ai_question_usage_server_writes_only.sql` |
| Profile Premium Fields | `011_profiles_premium_columns.sql` |
| Chapter Study Content | `015_chapter_study_content.sql` |
| Public study audio bucket | `016_study_audio_storage.sql` |
| Study Rooms RLS | `006_fix_study_rooms_rls_recursion.sql` |
| Quiz / chapters / questions | `001_initial_schema.sql` (+ date separate în app) |

Snippet-urile din dashboard sunt utile pentru debug, dar **pot fi duplicate, parțiale sau în altă ordine**. Pentru producție folosește migrările numerotate din repo.

---

## 2. Ordinea migrărilor în repo (001 → 017)

| # | Fișier | Rol scurt |
|---|--------|-----------|
| 001 | `001_initial_schema.sql` | Schema de bază: profiles, quiz, study rooms, chat, subscriptions, RLS inițial |
| 002 | `002_storage_buckets.sql` | Bucket storage (ex. poze profil) |
| 003 | `003_ai_question_usage.sql` | Tabel utilizare AI tutor |
| 004 | `004_rls_security_hardening.sql` | Întărire RLS generală |
| 005 | `005_kinde_jwt_rls.sql` | **Kinde:** `kinde_sub`, `current_profile_id()`, RLS pe JWT MEDVBA |
| 006 | `006_fix_study_rooms_rls_recursion.sql` | Fix recursie RLS study rooms |
| 007 | `007_fix_direct_chat_rls_recursion.sql` | Fix recursie RLS chat direct |
| 008 | `008_ai_question_usage_period_start.sql` | Coloană perioadă rolling AI |
| 009 | `009_subscriptions_client_no_self_premium.sql` | **Client nu poate scrie premium** în `subscriptions` |
| 010 | `010_ai_question_usage_server_writes_only.sql` | Scrieri AI usage doar service role |
| 011 | `011_profiles_premium_columns.sql` | `is_premium`, `subscription_status` pe profiles |
| 012 | `012_grant_my_achievement_profile_id.sql` | Achievement grant pe profile id |
| 013 | `013_user_achievements_fk_profiles.sql` | FK achievements → profiles |
| 014 | `014_direct_chats_fk_profiles.sql` | FK chat → profiles |
| 014 | `014_subscriptions_profiles_fk.sql` | FK subscriptions → profiles |
| 015 | `015_chapter_study_content.sql` | Conținut studiu capitole |
| 016 | `016_study_audio_storage.sql` | Bucket audio studiu |
| 017 | `017_user_reports.sql` | Raportări utilizatori (UGC) |

**Important:** rulează **005 înainte de 009**. Ambele `014_*` trebuie aplicate (sunt fișiere diferite).

---

## 3. Verificare producție (rulează o dată în SQL Editor)

Copiază tot blocul, apoi **Run**:

```sql
-- === MEDVBA prod health check (read-only) ===

SELECT 'current_profile_id' AS check_name,
       EXISTS (
         SELECT 1 FROM pg_proc p
         JOIN pg_namespace n ON p.pronamespace = n.oid
         WHERE n.nspname = 'public' AND p.proname = 'current_profile_id'
       ) AS ok;

SELECT 'profiles.kinde_sub' AS check_name,
       EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'kinde_sub'
       ) AS ok;

SELECT 'subscriptions_rls_free_only' AS check_name,
       EXISTS (
         SELECT 1
         FROM pg_policy pol
         JOIN pg_class cls ON cls.oid = pol.polrelid
         JOIN pg_namespace nsp ON nsp.oid = cls.relnamespace
         WHERE nsp.nspname = 'public' AND cls.relname = 'subscriptions'
           AND pol.polname = 'Users can update own subscription'
           AND pg_get_expr(pol.polwithcheck, pol.polrelid) ILIKE '%free%'
       ) AS ok;

SELECT 'user_reports_table' AS check_name,
       EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'user_reports'
       ) AS ok;

SELECT 'chapter_study_content' AS check_name,
       EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'chapter_study_content'
       ) AS ok;

SELECT 'ai_question_usage' AS check_name,
       EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema = 'public' AND table_name = 'ai_question_usage'
       ) AS ok;

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

**Toate `ok` = true** pentru primele 6 rânduri → schema aliniată cu app-ul curent.

---

## 4. Dacă ceva e `false` — ce rulezi (idempotent)

Nu rerula tot `001` pe o bază plină de date fără backup. Doar fișierul lipsă:

| Check eșuat | Rulează în SQL Editor (conținutul fișierului din repo) |
|-------------|------------------------------------------------------|
| `current_profile_id` / `kinde_sub` | `005_kinde_jwt_rls.sql` |
| `subscriptions_rls_free_only` | `009_subscriptions_client_no_self_premium.sql` |
| `user_reports_table` | `017_user_reports.sql` |
| `chapter_study_content` | `015_chapter_study_content.sql` |
| `ai_question_usage` | `003` apoi `008`, `010` |

Deschizi fișierul din `medvba-android/supabase/migrations/`, copiezi tot, **Run** o singură dată.

---

## 5. Subscriptions + app (după 009)

| Cine scrie premium | Cum |
|--------------------|-----|
| App direct în Supabase | **Blocat** de RLS 009 (doar `free`) |
| App via tRPC `syncFromClient` | Server verifică **RevenueCat REST** (cod deja în repo) |
| RevenueCat webhook | Service role pe Railway |

Railway trebuie să aibă: `REVENUECAT_SECRET_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

---

## 6. Snippet-uri PRIVATE — ce poți face

- **Păstrează** snippet-urile pentru debug (chat RLS, inspect policies).
- **Nu** le folosi ca singură migrare la un proiect nou — folosește `001`–`017`.
- Opțional: redenumește în dashboard cu prefix `repo-005`, `repo-009` când rulezi din fișiere.

---

## 7. Legătură plan remediere

- Verificare: acest fișier + [SUPABASE_MIGRATIONS_CHECKLIST.md](SUPABASE_MIGRATIONS_CHECKLIST.md)
- Plan general: [REMEDIATION_PLAN.md](REMEDIATION_PLAN.md) — Pas 1.4 (tu aplici/verifici SQL)

---

## 8. Checklist rapid

- [ ] Health check §3 — toate `ok = true`
- [ ] Dacă nu: rulează fișierul lipsă din §4
- [ ] `NOTIFY pgrst, 'reload schema';` după migrări mari (opțional, refresh cache API)
- [ ] Nu șterge tabele din snippet-uri „Schema Teardown” pe **PRODUCTION**

Last updated: 2026-05-25.
