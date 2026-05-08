-- Migration 037: Drop Supabase auth.users FK from profiles for Cognito compatibility
-- Cognito `sub` values are not in auth.users, so the FK must be removed.

-- Drop FK from profiles.id → auth.users.id
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Drop the auto-create-profile trigger (profile creation now handled in app via ensureUserExists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the trigger function
DROP FUNCTION IF EXISTS public.handle_new_user();
