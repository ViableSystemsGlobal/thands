-- Fix admin policies for chatbot tables
-- This migration updates the RLS policies to check the profiles table instead of JWT claims

-- Drop and recreate chat_leads admin policy
DROP POLICY IF EXISTS "Admin can view all chat leads" ON public.chat_leads;
CREATE POLICY "Admin can view all chat leads" ON public.chat_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Drop and recreate chat_rate_limits admin policy
DROP POLICY IF EXISTS "Admin can view all rate limits" ON public.chat_rate_limits;
CREATE POLICY "Admin can view all rate limits" ON public.chat_rate_limits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Drop and recreate chat_abuse_reports admin policy
DROP POLICY IF EXISTS "Admin can view all abuse reports" ON public.chat_abuse_reports;
CREATE POLICY "Admin can view all abuse reports" ON public.chat_abuse_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Ensure service role policies exist (skip if already exists)
-- Note: These policies may already exist from the original migration
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.chat_rate_limits;
CREATE POLICY "Service role can manage rate limits" ON public.chat_rate_limits
    FOR ALL WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage abuse reports" ON public.chat_abuse_reports;
CREATE POLICY "Service role can manage abuse reports" ON public.chat_abuse_reports
    FOR ALL WITH CHECK (true);

-- Add missing customer_phone column to chat_leads table
ALTER TABLE public.chat_leads ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- Create index for customer_phone
CREATE INDEX IF NOT EXISTS idx_chat_leads_phone ON public.chat_leads(customer_phone);

-- Note: Service role policy for chat_leads should already exist from the original migration 