-- ALTERNATIVE FIX: Handle session_id NOT NULL constraint
-- Use this if the main fix still gives session_id constraint errors

-- Option 1: Make session_id nullable (if you don't need it to be required)
ALTER TABLE public.chat_sessions 
ALTER COLUMN session_id DROP NOT NULL;

-- Option 2: Add a default value for session_id
ALTER TABLE public.chat_sessions 
ALTER COLUMN session_id SET DEFAULT gen_random_uuid()::text;

-- Option 3: Check what constraints exist and remove the NOT NULL if needed
SELECT column_name, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'chat_sessions' AND column_name = 'session_id';

-- Show table constraints
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.chat_sessions'::regclass;

-- Clean test: Try to insert without session_id (should work after making it nullable)
INSERT INTO public.chat_sessions (
    id,
    user_email, 
    last_message_at
) VALUES (
    gen_random_uuid(),
    'test-nullable@example.com',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Clean up test record
DELETE FROM public.chat_sessions WHERE user_email = 'test-nullable@example.com';

-- Final test: Insert with both id and session_id
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
    'test-full@example.com',
    NOW(),
    '127.0.0.1'::inet,
    'Test User Agent Full'
) ON CONFLICT (id) DO NOTHING;

-- Clean up test record
DELETE FROM public.chat_sessions WHERE user_email = 'test-full@example.com';

SELECT 'Session ID constraint fix applied successfully!' as status; 