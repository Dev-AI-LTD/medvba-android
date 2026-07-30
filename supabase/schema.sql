-- ===========================================
-- MEDVBA Supabase Schema
-- Run this in your Supabase SQL Editor
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- PROFILES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  streak_count INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'display_name', NEW.email),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- STUDY ROOMS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.study_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  max_participants INTEGER DEFAULT 10,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.study_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Study rooms are viewable by everyone" ON public.study_rooms
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create rooms" ON public.study_rooms
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Room creators can update rooms" ON public.study_rooms
  FOR UPDATE USING (auth.uid() = created_by);

-- ===========================================
-- STUDY SESSIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.study_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON public.study_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON public.study_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- ROOM MESSAGES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room messages are viewable by everyone" ON public.room_messages
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can post messages" ON public.room_messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ===========================================
-- ZOOM REQUESTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.zoom_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  room_id UUID REFERENCES public.study_rooms(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.zoom_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own zoom requests" ON public.zoom_requests
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Authenticated users can create zoom requests" ON public.zoom_requests
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update zoom requests" ON public.zoom_requests
  FOR UPDATE USING (auth.uid() = recipient_id);

-- ===========================================
-- USER PROGRESS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  chapter_id TEXT NOT NULL,
  questions_attempted INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  last_attempt_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);

ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.user_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON public.user_progress
  FOR ALL USING (auth.uid() = user_id);

-- ===========================================
-- DAILY PROGRESS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.daily_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  streak_day BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own daily progress" ON public.daily_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own daily progress" ON public.daily_progress
  FOR ALL USING (auth.uid() = user_id);

-- ===========================================
-- USER ACHIEVEMENTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_type TEXT NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_type)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Achievements are viewable by everyone" ON public.user_achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- DIRECT CHATS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.direct_chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  is_group BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.direct_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view chats they participate in" ON public.direct_chats
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM direct_chat_participants WHERE direct_chat_id = id)
  );

CREATE POLICY "Authenticated users can create chats" ON public.direct_chats
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update chats they created" ON public.direct_chats
  FOR UPDATE USING (auth.uid() = created_by);

-- ===========================================
-- DIRECT CHAT PARTICIPANTS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.direct_chat_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  direct_chat_id UUID REFERENCES public.direct_chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(direct_chat_id, user_id)
);

ALTER TABLE public.direct_chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participant lists" ON public.direct_chat_participants
  FOR SELECT USING (true);

CREATE POLICY "Users can join chats" ON public.direct_chat_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- DIRECT CHAT MESSAGES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.direct_chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  direct_chat_id UUID REFERENCES public.direct_chats(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.direct_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in chats they're part of" ON public.direct_chat_messages
  FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM direct_chat_participants WHERE direct_chat_id = direct_chat_messages.direct_chat_id)
  );

CREATE POLICY "Users can send messages to chats they're part of" ON public.direct_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    auth.uid() IN (SELECT user_id FROM direct_chat_participants WHERE direct_chat_id = direct_chat_messages.direct_chat_id)
  );

-- ===========================================
-- ACTIVITY FEED TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.activity_feed (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL,
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Activity feed is viewable by everyone" ON public.activity_feed
  FOR SELECT USING (true);

CREATE POLICY "Users can create activity feed entries" ON public.activity_feed
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- SUBSCRIPTIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan TEXT DEFAULT 'free',
  status TEXT DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON public.subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- ===========================================
-- USER PRESENCE TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS public.user_presence (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'offline')),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  current_room_id UUID REFERENCES public.study_rooms(id) ON DELETE SET NULL
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User presence is viewable by everyone" ON public.user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" ON public.user_presence
  FOR ALL USING (auth.uid() = user_id);

-- ===========================================
-- FUNCTIONS
-- ===========================================

-- Get leaderboard function
CREATE OR REPLACE FUNCTION public.get_leaderboard(p_period TEXT DEFAULT 'all')
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  total_points BIGINT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.total_points,
    ROW_NUMBER() OVER (ORDER BY p.total_points DESC)::BIGINT as rank
  FROM public.profiles p
  WHERE p.total_points > 0
  ORDER BY p.total_points DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant achievement function
CREATE OR REPLACE FUNCTION public.grant_my_achievement(p_achievement TEXT)
RETURNS void AS $$
BEGIN
  INSERT INTO public.user_achievements (user_id, achievement_type)
  VALUES (auth.uid(), p_achievement)
  ON CONFLICT (user_id, achievement_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_study_rooms_created_by ON public.study_rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_id ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_room_id ON public.study_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON public.room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON public.room_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_zoom_requests_sender_id ON public.zoom_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_zoom_requests_recipient_id ON public.zoom_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_id ON public.daily_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_progress_date ON public.daily_progress(date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_chat_participants_direct_chat_id ON public.direct_chat_participants(direct_chat_id);
CREATE INDEX IF NOT EXISTS idx_direct_chat_participants_user_id ON public.direct_chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_direct_chat_messages_direct_chat_id ON public.direct_chat_messages(direct_chat_id);
CREATE INDEX IF NOT EXISTS idx_direct_chat_messages_created_at ON public.direct_chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id ON public.activity_feed(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at ON public.activity_feed(created_at);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);

-- ===========================================
-- FINISH
-- ===========================================
