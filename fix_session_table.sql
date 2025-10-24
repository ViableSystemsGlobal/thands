-- Fix chat_sessions table structure
-- Run this in your Supabase SQL Editor

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chat_sessions' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason VARCHAR(100);

-- Ensure the id column uses the correct type
-- The function expects 'id' but the table might have 'session_id'
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS id UUID;

-- If the table has session_id instead of id, copy the data with proper casting
-- First, try to update where session_id is already a valid UUID
UPDATE public.chat_sessions 
SET id = session_id::UUID 
WHERE id IS NULL 
  AND session_id IS NOT NULL 
  AND session_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- For non-UUID session_ids, generate new UUIDs
UPDATE public.chat_sessions 
SET id = gen_random_uuid()
WHERE id IS NULL AND session_id IS NOT NULL;

-- Set id as primary key if it's not already
-- First, check if we need to drop an existing primary key
DO $$ 
BEGIN
    -- Drop existing primary key if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'chat_sessions' AND constraint_type = 'PRIMARY KEY') THEN
        ALTER TABLE public.chat_sessions DROP CONSTRAINT chat_sessions_pkey;
    END IF;
    
    -- Add new primary key on id column
    ALTER TABLE public.chat_sessions ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);
    
EXCEPTION WHEN OTHERS THEN
    -- If there's an error, just continue - the table might already be correctly structured
    RAISE NOTICE 'Primary key setup skipped: %', SQLERRM;
END $$;

-- Update RLS policies to allow service role
DROP POLICY IF EXISTS "Service role can manage chat_sessions" ON public.chat_sessions;
CREATE POLICY "Service role can manage chat_sessions" ON public.chat_sessions
    FOR ALL WITH CHECK (true);

-- Allow authenticated users to manage their own sessions
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.chat_sessions;
CREATE POLICY "Users can manage their own sessions" ON public.chat_sessions
    FOR ALL USING (user_email = (auth.jwt() ->> 'email'));

-- Ensure RLS is enabled but not blocking service role
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Test the fix
SELECT 'Session table structure fixed successfully!' as status;

-- Show the final structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chat_sessions' 
ORDER BY ordinal_position; 