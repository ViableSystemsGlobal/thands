-- Create chat leads table for storing customer information from chat sessions
CREATE TABLE IF NOT EXISTS public.chat_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    chat_summary TEXT,
    message_count INTEGER DEFAULT 0,
    chat_duration_minutes INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, converted, closed
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_leads_status ON public.chat_leads(status);
CREATE INDEX IF NOT EXISTS idx_chat_leads_created_at ON public.chat_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_leads_email ON public.chat_leads(customer_email);

-- Enable Row Level Security
ALTER TABLE public.chat_leads ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Admin can view all chat leads" ON public.chat_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow service role to insert leads
CREATE POLICY "Service role can insert chat leads" ON public.chat_leads
    FOR INSERT WITH CHECK (true);

-- Update timestamp function
CREATE OR REPLACE FUNCTION update_chat_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_chat_leads_updated_at_trigger
    BEFORE UPDATE ON public.chat_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_leads_updated_at(); 