-- SIMPLE ALTERNATIVE FIX for chat_sessions table
-- Use this if the main fix_session_table.sql gives errors

-- Method 1: Add required columns to existing table
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason VARCHAR(100);

-- Method 2: Ensure RLS policies allow service role
DROP POLICY IF EXISTS "Service role can manage chat_sessions" ON public.chat_sessions;
CREATE POLICY "Service role can manage chat_sessions" ON public.chat_sessions
    FOR ALL WITH CHECK (true);

-- Method 3: Test the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chat_sessions' 
ORDER BY ordinal_position;

-- Method 4: If you still get errors, try this completely fresh approach
-- (Only run this if you're okay with losing existing chat session data)
/*
DROP TABLE IF EXISTS public.chat_sessions CASCADE;

CREATE TABLE public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT, -- Keep for backward compatibility
    user_email TEXT,
    is_active BOOLEAN DEFAULT true,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    is_flagged BOOLEAN DEFAULT false,
    flagged_reason VARCHAR(100)
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage chat_sessions" ON public.chat_sessions
    FOR ALL WITH CHECK (true);

CREATE POLICY "Users can manage their own sessions" ON public.chat_sessions
    FOR ALL USING (user_email = (auth.jwt() ->> 'email'));
*/

SELECT 'Simple fix applied successfully!' as status; 