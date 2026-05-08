-- Migration 038: Disable RLS for Cognito-only auth
--
-- With Cognito-only auth, Supabase Auth is no longer used for sessions.
-- auth.uid() returns NULL for all client requests, breaking all RLS policies
-- that use auth.uid(). All writes are routed through the tRPC backend (service
-- role key bypasses RLS). Client reads use the anon key.
--
-- Strategy: disable RLS on user-private tables and drop auth.uid() policies.
-- Public-readable tables keep permissive SELECT for anon.

-- profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
-- Re-add permissive policies for anon reads (tRPC handles writes via service role)
CREATE POLICY "Public read access" ON profiles FOR SELECT USING (true);

-- user_progress
DROP POLICY IF EXISTS "Authenticated users can read all progress for leaderboard" ON user_progress;
ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;

-- daily_progress
DROP POLICY IF EXISTS "Authenticated users can read all daily progress for leaderboard" ON daily_progress;
ALTER TABLE daily_progress DISABLE ROW LEVEL SECURITY;

-- user_presence
ALTER TABLE user_presence DISABLE ROW LEVEL SECURITY;

-- user_achievements
ALTER TABLE user_achievements DISABLE ROW LEVEL SECURITY;

-- subscriptions
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- study_rooms
ALTER TABLE study_rooms DISABLE ROW LEVEL SECURITY;

-- direct_chats
ALTER TABLE direct_chats DISABLE ROW LEVEL SECURITY;

-- direct_chat_participants
ALTER TABLE direct_chat_participants DISABLE ROW LEVEL SECURITY;

-- direct_chat_messages
ALTER TABLE direct_chat_messages DISABLE ROW LEVEL SECURITY;

-- activity_feed (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_feed') THEN
    ALTER TABLE activity_feed DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;
