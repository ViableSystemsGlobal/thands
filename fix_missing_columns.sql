-- TARGETED FIX: Add missing columns to chat_sessions table
-- Run this in your Supabase SQL Editor

-- First, let's see what columns currently exist
SELECT 'Current chat_sessions columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chat_sessions' 
ORDER BY ordinal_position;

-- Add the missing last_message_at column
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ DEFAULT NOW();

-- Add other commonly missing columns
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason VARCHAR(100);

-- Ensure RLS policies allow service role access
DROP POLICY IF EXISTS "Service role can manage chat_sessions" ON public.chat_sessions;
CREATE POLICY "Service role can manage chat_sessions" ON public.chat_sessions
    FOR ALL WITH CHECK (true);

-- Allow users to manage their own sessions
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage their own sessions" ON public.chat_sessions
    FOR ALL USING (user_email = (auth.jwt() ->> 'email'));

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Show the final table structure
SELECT 'Updated chat_sessions columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chat_sessions' 
ORDER BY ordinal_position;

-- Test that we can insert a sample record
INSERT INTO public.chat_sessions (
    id,
    session_id, 
    user_email, 
    last_message_at, 
    ip_address, 
    user_agent
) VALUES (
    gen_random_uuid(),
    'test-session-' || extract(epoch from now()),
    'test@example.com',
    NOW(),
    '127.0.0.1'::inet,
    'Test User Agent'
) ON CONFLICT (id) DO NOTHING;

-- Clean up test record
DELETE FROM public.chat_sessions WHERE user_email = 'test@example.com';

SELECT 'Column fix applied successfully! The chat_sessions table now has all required columns.' as status; 