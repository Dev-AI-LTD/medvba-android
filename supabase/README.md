# MEDVBA Supabase Setup

## Overview
This folder contains the Supabase schema for the MEDVBA medical education app.

## Files
- `schema.sql` - Complete database schema with all tables, functions, and RLS policies

## Setup Instructions

### Option 1: Automatic Push Script (Easiest!)
Run the PowerShell script to automatically push the schema:

```powershell
cd medvba-android/supabase
.\push-schema.ps1
```

If you have your Project Ref, run:
```powershell
.\push-schema.ps1 -ProjectRef "your-project-ref"
```

### Option 2: Manual Setup (Recommended for development)
1. Go to your Supabase project dashboard at https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `schema.sql`
4. Paste and run the SQL query

### Option 2: Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Push the schema
supabase db push
```

### Option 3: Generate Questions Data
To populate the database with quiz questions:

1. First, configure environment variables:
```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_KEY=your-service-role-key
```

2. Run the migration script:
```bash
cd medvba-android
npx ts-node scripts/migrate-questions-to-supabase.ts
# or with bun
bun run scripts/migrate-questions-to-supabase.ts
```

## Required Environment Variables

Create a `.env` file with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in Supabase Dashboard:
- **Settings** → **API** → **Project URL** and **anon public** key

## Tables Created

| Table | Description |
|-------|-------------|
| `profiles` | User profiles with premium status, streaks, points |
| `study_rooms` | Study room listings |
| `study_sessions` | Individual study session records |
| `room_messages` | Messages in study rooms |
| `zoom_requests` | Zoom meeting requests between users |
| `user_progress` | Per-chapter progress tracking |
| `daily_progress` | Daily study statistics |
| `user_achievements` | Achievement unlocks |
| `direct_chats` | Private/group chat metadata |
| `direct_chat_participants` | Chat membership |
| `direct_chat_messages` | Chat messages |
| `activity_feed` | Social activity feed |
| `subscriptions` | User subscription info |
| `ai_question_usage` | Free-tier AI tutor usage (rolling window); **writes server-only** (see migration `010`) |
| `user_presence` | Online status tracking |

## Functions

| Function | Purpose |
|----------|---------|
| `get_leaderboard(period)` | Returns ranked leaderboard |
| `grant_my_achievement(achievement)` | Awards achievement to user |

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Profiles: Users can view all, edit own
- Study rooms: Public read, authenticated create
- Progress: Private to each user
- Chat: Participants only
- **`ai_question_usage`:** authenticated users may **SELECT** their own row only; **INSERT/UPDATE/DELETE** are not granted via RLS to the user JWT — only the **service role** (MEDVBA backend / tRPC) can mutate counts. Apply migration `010_ai_question_usage_server_writes_only.sql` in production after `008`.

### "relation does not exist" error
Make sure you've run the schema.sql in your Supabase SQL Editor.

### Authentication not working
Check that:
1. `EXPO_PUBLIC_SUPABASE_URL` is set correctly
2. `EXPO_PUBLIC_SUPABASE_ANON_KEY` is set correctly
3. Auth is enabled in Supabase Dashboard → Authentication → Settings

### AI Tutor not working
The AI tutor runs on the **Hono/tRPC backend** (`lib/ai-provider.ts`). It requires:
1. Supabase auth to be configured
2. On **Railway** (or local backend): `AI_API_KEY` or `OPENAI_API_KEY` — **not** `EXPO_PUBLIC_*` OpenAI keys
3. Client: `EXPO_PUBLIC_RORK_API_BASE_URL` pointing at that backend for tRPC
