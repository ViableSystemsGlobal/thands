-- Create working chat system with proper RLS policies
-- This migration creates a complete, functional chat system for admin management

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    user_name TEXT,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'assistant')),
    message_length INTEGER DEFAULT 0,
    time_since_last_message INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create chat_leads table with ALL required columns
CREATE TABLE IF NOT EXISTS public.chat_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    chat_summary TEXT,
    message_count INTEGER DEFAULT 0,
    chat_duration_minutes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create chat_abuse_reports table
CREATE TABLE IF NOT EXISTS public.chat_abuse_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    ip_address INET,
    abuse_type TEXT NOT NULL,
    details TEXT,
    auto_detected BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create chat_rate_limits table
CREATE TABLE IF NOT EXISTS public.chat_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL UNIQUE,
    session_count INTEGER DEFAULT 1,
    last_session_at TIMESTAMPTZ DEFAULT NOW(),
    daily_message_count INTEGER DEFAULT 0,
    last_message_date DATE DEFAULT CURRENT_DATE,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create knowledge_base table
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON public.chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON public.chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_is_flagged ON public.chat_sessions(is_flagged);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON public.chat_messages(sender_type);

CREATE INDEX IF NOT EXISTS idx_chat_leads_session_id ON public.chat_leads(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_leads_status ON public.chat_leads(status);
CREATE INDEX IF NOT EXISTS idx_chat_leads_created_at ON public.chat_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_leads_email ON public.chat_leads(customer_email);
CREATE INDEX IF NOT EXISTS idx_chat_leads_phone ON public.chat_leads(customer_phone);
-- Priority score is calculated dynamically, no need for index

CREATE INDEX IF NOT EXISTS idx_chat_abuse_reports_session_id ON public.chat_abuse_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_abuse_reports_ip ON public.chat_abuse_reports(ip_address);
CREATE INDEX IF NOT EXISTS idx_chat_abuse_reports_created_at ON public.chat_abuse_reports(created_at);

CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_ip ON public.chat_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_date ON public.chat_rate_limits(last_message_date);
CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_blocked ON public.chat_rate_limits(is_blocked);

CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_is_active ON public.knowledge_base(is_active);

-- Enable RLS on all tables
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_abuse_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for admin access
-- Admin can do everything on all tables
CREATE POLICY "Admin full access to chat_sessions" ON public.chat_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to chat_messages" ON public.chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to chat_leads" ON public.chat_leads
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to chat_abuse_reports" ON public.chat_abuse_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to chat_rate_limits" ON public.chat_rate_limits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin full access to knowledge_base" ON public.knowledge_base
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create policies for public read access (for chatbot functionality)
CREATE POLICY "Public can read active knowledge base" ON public.knowledge_base
    FOR SELECT USING (is_active = TRUE);

-- Create policies for anonymous/authenticated users to create chat sessions
CREATE POLICY "Anyone can create chat sessions" ON public.chat_sessions
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can create chat messages" ON public.chat_messages
    FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Anyone can create chat leads" ON public.chat_leads
    FOR INSERT WITH CHECK (TRUE);

-- Service role policies (for backend functions)
CREATE POLICY "Service role full access chat_sessions" ON public.chat_sessions
    FOR ALL USING (TRUE);

CREATE POLICY "Service role full access chat_messages" ON public.chat_messages
    FOR ALL USING (TRUE);

CREATE POLICY "Service role full access chat_leads" ON public.chat_leads
    FOR ALL USING (TRUE);

CREATE POLICY "Service role full access chat_abuse_reports" ON public.chat_abuse_reports
    FOR ALL USING (TRUE);

CREATE POLICY "Service role full access chat_rate_limits" ON public.chat_rate_limits
    FOR ALL USING (TRUE);

CREATE POLICY "Service role full access knowledge_base" ON public.knowledge_base
    FOR ALL USING (TRUE);

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns (drop if exists to avoid conflicts)
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON public.chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at();

DROP TRIGGER IF EXISTS update_chat_leads_updated_at ON public.chat_leads;
CREATE TRIGGER update_chat_leads_updated_at
    BEFORE UPDATE ON public.chat_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at();

DROP TRIGGER IF EXISTS update_knowledge_base_updated_at ON public.knowledge_base;
CREATE TRIGGER update_knowledge_base_updated_at
    BEFORE UPDATE ON public.knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_updated_at();

-- Create function to calculate lead priority score
CREATE OR REPLACE FUNCTION calculate_lead_priority_score(
    p_customer_name TEXT,
    p_customer_email TEXT,
    p_customer_phone TEXT,
    p_message_count INTEGER,
    p_chat_summary TEXT
)
RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
BEGIN
    -- Basic contact info (30 points)
    IF p_customer_name IS NOT NULL AND p_customer_email IS NOT NULL THEN
        score := score + 30;
    END IF;
    
    -- Phone number (20 points)
    IF p_customer_phone IS NOT NULL THEN
        score := score + 20;
    END IF;
    
    -- Message engagement (25 points)
    IF p_message_count >= 3 THEN
        score := score + 25;
    END IF;
    
    -- High-value keywords (25 points)
    IF p_chat_summary IS NOT NULL AND (
        p_chat_summary ILIKE '%consultation%' OR
        p_chat_summary ILIKE '%custom%' OR
        p_chat_summary ILIKE '%bespoke%' OR
        p_chat_summary ILIKE '%tailored%' OR
        p_chat_summary ILIKE '%order%' OR
        p_chat_summary ILIKE '%purchase%'
    ) THEN
        score := score + 25;
    END IF;
    
    RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Priority score is calculated dynamically in the application, no need for trigger

-- Insert some sample knowledge base entries
INSERT INTO public.knowledge_base (title, content, category, tags, is_active) VALUES
('Welcome Message', 'Welcome to Tailored Hands! We specialize in custom tailored clothing and ready-to-wear fashion. How can I help you today?', 'general', ARRAY['welcome', 'greeting'], TRUE),
('Services Overview', 'We offer two main services: Made-to-Measure tailoring for custom fitted garments, and Ready-to-Wear collections for immediate purchase. Both services focus on quality craftsmanship and attention to detail.', 'services', ARRAY['services', 'tailoring', 'ready-to-wear'], TRUE),
('Consultation Process', 'Our consultation process includes: 1) Initial discussion of your needs, 2) Style and fabric selection, 3) Measurements and fitting, 4) Creation timeline, 5) Final delivery. Book a consultation to get started!', 'consultation', ARRAY['consultation', 'process', 'booking'], TRUE),
('Pricing Information', 'Our pricing varies based on the garment type and customization level. Made-to-Measure suits start from $800, shirts from $150. Ready-to-Wear items have fixed pricing shown on the website.', 'pricing', ARRAY['pricing', 'cost', 'suits', 'shirts'], TRUE),
('Delivery and Timeline', 'Made-to-Measure garments typically take 3-4 weeks from final measurements. Ready-to-Wear items ship within 2-3 business days. We offer both local and international shipping.', 'delivery', ARRAY['delivery', 'timeline', 'shipping'], TRUE);

-- Create a sample admin user function
CREATE OR REPLACE FUNCTION create_sample_admin_user()
RETURNS TEXT AS $$
DECLARE
    admin_user_id UUID;
    existing_profile RECORD;
BEGIN
    -- Check if admin profile already exists
    SELECT * INTO existing_profile 
    FROM public.profiles 
    WHERE email = 'admin@tailoredhands.com' AND role = 'admin';
    
    IF existing_profile IS NULL THEN
        -- Generate a UUID for the admin user
        admin_user_id := gen_random_uuid();
        
        -- Insert admin profile
        INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
        VALUES (admin_user_id, 'admin@tailoredhands.com', 'Admin User', 'admin', NOW(), NOW());
        
        RETURN 'Admin profile created with ID: ' || admin_user_id::TEXT;
    ELSE
        RETURN 'Admin profile already exists with ID: ' || existing_profile.id::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create sample data function
CREATE OR REPLACE FUNCTION create_sample_chat_data()
RETURNS TEXT AS $$
DECLARE
    session_1 UUID;
    session_2 UUID;
    session_3 UUID;
    result TEXT := '';
BEGIN
    -- Create sample chat sessions
    session_1 := gen_random_uuid();
    session_2 := gen_random_uuid();
    session_3 := gen_random_uuid();
    
    -- Insert sample chat sessions
    INSERT INTO public.chat_sessions (id, session_id, user_email, user_name, ip_address, user_agent, is_active, created_at) VALUES
    (session_1, 'session_' || session_1::TEXT, 'john.doe@example.com', 'John Doe', '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', TRUE, NOW() - INTERVAL '2 hours'),
    (session_2, 'session_' || session_2::TEXT, 'jane.smith@example.com', 'Jane Smith', '192.168.1.101', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', TRUE, NOW() - INTERVAL '1 hour'),
    (session_3, 'session_' || session_3::TEXT, NULL, 'Anonymous User', '192.168.1.102', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15', TRUE, NOW() - INTERVAL '30 minutes');
    
    -- Insert sample chat messages
    INSERT INTO public.chat_messages (session_id, message, sender_type, message_length, created_at) VALUES
    (session_1, 'Hello! I''m interested in getting a custom suit made.', 'user', 52, NOW() - INTERVAL '2 hours'),
    (session_1, 'Great! I''d be happy to help you with a custom suit. What type of occasion is this for?', 'assistant', 87, NOW() - INTERVAL '2 hours' + INTERVAL '1 minute'),
    (session_1, 'It''s for my wedding next month. I want something really special.', 'user', 61, NOW() - INTERVAL '2 hours' + INTERVAL '2 minutes'),
    (session_1, 'Congratulations! Wedding suits are our specialty. Would you like to schedule a consultation?', 'assistant', 94, NOW() - INTERVAL '2 hours' + INTERVAL '3 minutes'),
    (session_1, 'Yes, I''d love to. My phone number is +1-555-0123 and my email is john.doe@example.com', 'user', 90, NOW() - INTERVAL '2 hours' + INTERVAL '4 minutes'),
    
    (session_2, 'Hi, do you have any ready-to-wear dresses available?', 'user', 50, NOW() - INTERVAL '1 hour'),
    (session_2, 'Yes, we have a beautiful collection of ready-to-wear dresses. What style are you looking for?', 'assistant', 99, NOW() - INTERVAL '1 hour' + INTERVAL '1 minute'),
    (session_2, 'Something elegant for a business event. Size 8-10.', 'user', 49, NOW() - INTERVAL '1 hour' + INTERVAL '2 minutes'),
    
    (session_3, 'What are your prices for shirts?', 'user', 31, NOW() - INTERVAL '30 minutes'),
    (session_3, 'Our made-to-measure shirts start from $150, and ready-to-wear shirts range from $80-$120.', 'assistant', 95, NOW() - INTERVAL '30 minutes' + INTERVAL '1 minute');
    
    -- Insert sample chat leads
    INSERT INTO public.chat_leads (session_id, customer_name, customer_email, customer_phone, chat_summary, message_count, chat_duration_minutes, status, created_at) VALUES
    (session_1, 'John Doe', 'john.doe@example.com', '+1-555-0123', 'Customer interested in custom wedding suit. Provided contact details and wants consultation.', 5, 4, 'new', NOW() - INTERVAL '2 hours'),
    (session_2, 'Jane Smith', 'jane.smith@example.com', NULL, 'Looking for ready-to-wear elegant dress for business event, size 8-10.', 3, 2, 'new', NOW() - INTERVAL '1 hour'),
    (session_3, 'Anonymous User', NULL, NULL, 'Inquired about shirt pricing. Potential customer but no contact details provided.', 2, 1, 'new', NOW() - INTERVAL '30 minutes');
    
    -- Insert sample abuse reports
    INSERT INTO public.chat_abuse_reports (session_id, ip_address, abuse_type, details, auto_detected, created_at) VALUES
    (session_3, '192.168.1.102', 'rapid_messaging', 'User sent multiple messages in quick succession', TRUE, NOW() - INTERVAL '25 minutes');
    
    -- Insert sample rate limits
    INSERT INTO public.chat_rate_limits (ip_address, session_count, daily_message_count, last_session_at, is_blocked, created_at) VALUES
    ('192.168.1.100', 1, 5, NOW() - INTERVAL '2 hours', FALSE, NOW() - INTERVAL '2 hours'),
    ('192.168.1.101', 1, 3, NOW() - INTERVAL '1 hour', FALSE, NOW() - INTERVAL '1 hour'),
    ('192.168.1.102', 1, 2, NOW() - INTERVAL '30 minutes', FALSE, NOW() - INTERVAL '30 minutes');
    
    result := 'Sample chat data created successfully with ' || 
              (SELECT COUNT(*) FROM public.chat_sessions) || ' sessions, ' ||
              (SELECT COUNT(*) FROM public.chat_messages) || ' messages, ' ||
              (SELECT COUNT(*) FROM public.chat_leads) || ' leads, ' ||
              (SELECT COUNT(*) FROM public.chat_abuse_reports) || ' abuse reports, ' ||
              (SELECT COUNT(*) FROM public.chat_rate_limits) || ' rate limits';
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Execute the sample data creation
-- SELECT create_sample_admin_user();
-- Sample data creation disabled for production environment
-- SELECT create_sample_chat_data(); 