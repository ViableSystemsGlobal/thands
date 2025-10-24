-- Enhance chat_sessions table to better support user information collection
-- Run this in your Supabase SQL editor

-- Add new columns to chat_sessions table
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS user_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS user_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS user_info_collected BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add new column to chat_leads table for phone number
ALTER TABLE public.chat_leads 
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_info_collected ON public.chat_sessions(user_info_collected);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON public.chat_sessions(updated_at);
CREATE INDEX IF NOT EXISTS idx_chat_leads_customer_phone ON public.chat_leads(customer_phone);

-- Create trigger function for chat_sessions updated_at
CREATE OR REPLACE FUNCTION update_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for chat_sessions updated_at
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at_trigger ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at_trigger
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_sessions_updated_at();

-- Add comments to new columns
COMMENT ON COLUMN public.chat_sessions.user_name IS 'Customer name collected during chat';
COMMENT ON COLUMN public.chat_sessions.user_phone IS 'Customer phone number collected during chat';
COMMENT ON COLUMN public.chat_sessions.user_info_collected IS 'Whether user information has been collected';
COMMENT ON COLUMN public.chat_sessions.updated_at IS 'Timestamp when session was last updated';
COMMENT ON COLUMN public.chat_leads.customer_phone IS 'Customer phone number from chat session';

-- Test the schema changes
SELECT 'Enhanced chat_sessions table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'chat_sessions' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Enhanced chat_leads table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'chat_leads' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show indexes
SELECT 'New indexes created:' as info;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('chat_sessions', 'chat_leads') 
AND indexname LIKE '%user%' OR indexname LIKE '%phone%' OR indexname LIKE '%updated_at%'
ORDER BY tablename, indexname; 