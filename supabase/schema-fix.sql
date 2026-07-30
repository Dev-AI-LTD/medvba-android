-- MEDVBA Schema Fix - Drop existing policies first, then recreate
-- Run this AFTER the partial schema ran (when you see "policy already exists" errors)

-- Drop all existing policies for profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Recreate policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Drop and recreate other policies
DROP POLICY IF EXISTS "Study rooms are viewable by everyone" ON public.study_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.study_rooms;
DROP POLICY IF EXISTS "Room creators can update rooms" ON public.study_rooms;

CREATE POLICY "Study rooms are viewable by everyone" ON public.study_rooms
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" ON public.study_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Room creators can update rooms" ON public.study_rooms
  FOR UPDATE USING (auth.uid() = created_by);

-- Study sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can create own sessions" ON public.study_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.study_sessions;

CREATE POLICY "Users can view own sessions" ON public.study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Room messages
DROP POLICY IF EXISTS "Room messages are viewable by everyone" ON public.room_messages;
DROP POLICY IF EXISTS "Authenticated users can post messages" ON public.room_messages;

CREATE POLICY "Room messages are viewable by everyone" ON public.room_messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post messages" ON public.room_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Zoom requests
DROP POLICY IF EXISTS "Users can view own zoom requests" ON public.zoom_requests;
DROP POLICY IF EXISTS "Authenticated users can create zoom requests" ON public.zoom_requests;
DROP POLICY IF EXISTS "Recipients can update zoom requests" ON public.zoom_requests;

CREATE POLICY "Users can view own zoom requests" ON public.zoom_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Authenticated users can create zoom requests" ON public.zoom_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update zoom requests" ON public.zoom_requests
  FOR UPDATE USING (auth.uid() = recipient_id);

-- User progress
DROP POLICY IF EXISTS "Users can view own progress" ON public.user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON public.user_progress;

CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);

-- Daily progress
DROP POLICY IF EXISTS "Users can view own daily progress" ON public.daily_progress;
DROP POLICY IF EXISTS "Users can update own daily progress" ON public.daily_progress;

CREATE POLICY "Users can view own daily progress" ON public.daily_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own daily progress" ON public.daily_progress
  FOR ALL USING (auth.uid() = user_id);

-- User achievements
DROP POLICY IF EXISTS "Achievements are viewable by everyone" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;

CREATE POLICY "Achievements are viewable by everyone" ON public.user_achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Direct chats
DROP POLICY IF EXISTS "Users can view chats they participate in" ON public.direct_chats;
DROP POLICY IF EXISTS "Authenticated users can create chats" ON public.direct_chats;
DROP POLICY IF EXISTS "Users can update chats they created" ON public.direct_chats;

CREATE POLICY "Users can view chats they participate in" ON public.direct_chats
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM direct_chat_participants WHERE direct_chat_id = id)
  );

CREATE POLICY "Authenticated users can create chats" ON public.direct_chats
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update chats they created" ON public.direct_chats
  FOR UPDATE USING (auth.uid() = created_by);

-- Direct chat participants
DROP POLICY IF EXISTS "Users can view participant lists" ON public.direct_chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON public.direct_chat_participants;

CREATE POLICY "Users can view participant lists" ON public.direct_chat_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join chats" ON public.direct_chat_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Direct chat messages
DROP POLICY IF EXISTS "Users can view messages in chats they're part of" ON public.direct_chat_messages;
DROP POLICY IF EXISTS "Users can send messages to chats they're part of" ON public.direct_chat_messages;

CREATE POLICY "Users can view messages in chats they're part of" ON public.direct_chat_messages
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM direct_chat_participants WHERE direct_chat_id = direct_chat_messages.direct_chat_id)
  );

CREATE POLICY "Users can send messages to chats they're part of" ON public.direct_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (SELECT user_id FROM direct_chat_participants WHERE direct_chat_id = direct_chat_messages.direct_chat_id)
  );

-- Activity feed
DROP POLICY IF EXISTS "Activity feed is viewable by everyone" ON public.activity_feed;
DROP POLICY IF EXISTS "Users can create activity feed entries" ON public.activity_feed;

CREATE POLICY "Activity feed is viewable by everyone" ON public.activity_feed
  FOR SELECT USING (true);

CREATE POLICY "Users can create activity feed entries" ON public.activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscriptions;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- User presence
DROP POLICY IF EXISTS "User presence is viewable by everyone" ON public.user_presence;
DROP POLICY IF EXISTS "Users can update own presence" ON public.user_presence;

CREATE POLICY "User presence is viewable by everyone" ON public.user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" ON public.user_presence
  FOR ALL USING (auth.uid() = user_id);

SELECT 'All policies recreated successfully!' as status;
