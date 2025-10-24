-- FIX CHAT LEADS TABLE - Add all missing columns
-- Run this in your Supabase SQL Editor

-- First, check what columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat_leads' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chat_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    customer_name TEXT,
    customer_email TEXT,
    chat_summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add all missing columns one by one
ALTER TABLE public.chat_leads 
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

ALTER TABLE public.chat_leads 
ADD COLUMN IF NOT EXISTS chat_duration_minutes INTEGER DEFAULT 0;

ALTER TABLE public.chat_leads 
ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0;

ALTER TABLE public.chat_leads 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new';

-- Ensure RLS is properly configured
ALTER TABLE public.chat_leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Service role can manage chat_leads" ON public.chat_leads;
DROP POLICY IF EXISTS "Admin can view all chat_leads" ON public.chat_leads;
DROP POLICY IF EXISTS "Public can insert chat_leads" ON public.chat_leads;

-- Create policies for service role (used by edge functions)
CREATE POLICY "Service role can manage chat_leads" ON public.chat_leads
    FOR ALL USING (true) WITH CHECK (true);

-- Create policy for admin access
CREATE POLICY "Admin can view all chat_leads" ON public.chat_leads
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Verify the final table structure
SELECT 'Final table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'chat_leads' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test insert to make sure it works
INSERT INTO public.chat_leads (
    session_id,
    customer_name,
    customer_email,
    chat_summary,
    message_count,
    chat_duration_minutes,
    lead_score,
    status
) VALUES (
    gen_random_uuid(),
    'Test Customer',
    'test@example.com',
    'This is a test chat summary',
    5,
    10,
    85,
    'new'
) ON CONFLICT (id) DO NOTHING;

SELECT 'Test insert successful!' as result;
SELECT * FROM public.chat_leads WHERE customer_email = 'test@example.com';

-- Clean up test data
DELETE FROM public.chat_leads WHERE customer_email = 'test@example.com';

SELECT 'Chat leads table is now ready!' as status; 