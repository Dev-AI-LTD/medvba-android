-- ===========================================
-- MEDVBA AI Question Usage Tracking
-- Created: 2026-04-02
-- Purpose: Server-side tracking for AI question limits
-- ===========================================

-- Create AI question usage table
CREATE TABLE IF NOT EXISTS public.ai_question_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_count INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_daily_usage UNIQUE (user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ai_question_usage_user_id ON public.ai_question_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_question_usage_created_at ON public.ai_question_usage(created_at);

-- Enable RLS
ALTER TABLE public.ai_question_usage ENABLE ROW LEVEL SECURITY;

-- Users can only see and modify their own usage records (idempotent re-run)
DROP POLICY IF EXISTS "Users can view own AI usage" ON public.ai_question_usage;
CREATE POLICY "Users can view own AI usage"
    ON public.ai_question_usage
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own AI usage" ON public.ai_question_usage;
CREATE POLICY "Users can update own AI usage"
    ON public.ai_question_usage
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own AI usage" ON public.ai_question_usage;
CREATE POLICY "Users can insert own AI usage"
    ON public.ai_question_usage
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Service role bypass for admin operations (tRPC procedures use service role)

-- ===========================================
-- Update existing profiles table if needed
-- ===========================================

-- Add subscription_status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT DEFAULT 'free';
    END IF;
END $$;

-- Add ai_questions_today column if it doesn't exist (for quick client-side reference)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'ai_questions_today'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN ai_questions_today INTEGER DEFAULT 0;
    END IF;
END $$;

SELECT 'AI question usage tracking setup complete!' as status;
