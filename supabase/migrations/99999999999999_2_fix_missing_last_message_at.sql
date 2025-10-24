-- Add missing last_message_at column to chat_sessions table
-- This column is expected by the edge functions but is missing from the current schema

DO $$ 
BEGIN
    -- Add the column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'chat_sessions' 
        AND column_name = 'last_message_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.chat_sessions
        ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
        
        -- Add index for performance
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message_at ON public.chat_sessions(last_message_at);
        
        -- Update existing records to have a sensible default
        UPDATE public.chat_sessions
        SET last_message_at = created_at
        WHERE last_message_at IS NULL;
        
        RAISE NOTICE 'Added last_message_at column to chat_sessions table';
    ELSE
        RAISE NOTICE 'Column last_message_at already exists in chat_sessions table';
    END IF;
END $$; 