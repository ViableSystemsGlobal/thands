-- DEBUG CHAT LEADS SYSTEM
-- Run this in your Supabase SQL Editor to check if everything is set up correctly

-- 1. Check if chat_leads table exists
SELECT 'Checking chat_leads table...' as step;
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_leads' 
ORDER BY ordinal_position;

-- 2. Check if we have any chat sessions
SELECT 'Checking chat_sessions...' as step;
SELECT COUNT(*) as session_count FROM public.chat_sessions;
SELECT * FROM public.chat_sessions ORDER BY created_at DESC LIMIT 5;

-- 3. Check if we have any chat messages
SELECT 'Checking chat_messages...' as step;
SELECT COUNT(*) as message_count FROM public.chat_messages;
SELECT session_id, COUNT(*) as messages_per_session 
FROM public.chat_messages 
GROUP BY session_id 
ORDER BY COUNT(*) DESC 
LIMIT 5;

-- 4. Check if we have any chat leads
SELECT 'Checking chat_leads...' as step;
SELECT COUNT(*) as lead_count FROM public.chat_leads;
SELECT * FROM public.chat_leads ORDER BY created_at DESC LIMIT 5;

-- 5. Create chat_leads table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    chat_summary TEXT,
    message_count INTEGER DEFAULT 0,
    chat_duration_minutes INTEGER DEFAULT 0,
    lead_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
ALTER TABLE public.chat_leads 
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS chat_duration_minutes INTEGER DEFAULT 0;

-- 6. Set up RLS policies for chat_leads
ALTER TABLE public.chat_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage chat_leads" ON public.chat_leads;
CREATE POLICY "Service role can manage chat_leads" ON public.chat_leads
    FOR ALL WITH CHECK (true);

DROP POLICY IF EXISTS "Admin can view all chat_leads" ON public.chat_leads;
CREATE POLICY "Admin can view all chat_leads" ON public.chat_leads
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- 7. Test manual lead creation
INSERT INTO public.chat_leads (
    session_id,
    customer_name,
    customer_email,
    chat_summary,
    lead_score,
    status
) VALUES (
    gen_random_uuid(),
    'Test Customer',
    'test@example.com',
    'This is a test chat summary to verify the table works',
    85,
    'new'
) ON CONFLICT (id) DO NOTHING;

-- 8. Show results
SELECT 'Manual test lead created!' as result;
SELECT * FROM public.chat_leads WHERE customer_email = 'test@example.com';

-- 9. Clean up test lead
DELETE FROM public.chat_leads WHERE customer_email = 'test@example.com';

SELECT 'Chat leads debug complete! Check the results above.' as status; 