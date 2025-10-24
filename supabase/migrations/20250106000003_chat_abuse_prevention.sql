-- Chat abuse prevention system
-- Tracks chat usage per IP and implements rate limiting

-- Table to track chat sessions per IP address
CREATE TABLE IF NOT EXISTS public.chat_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    session_count INTEGER DEFAULT 1,
    last_session_at TIMESTAMPTZ DEFAULT NOW(),
    daily_message_count INTEGER DEFAULT 0,
    last_message_date DATE DEFAULT CURRENT_DATE,
    is_blocked BOOLEAN DEFAULT false,
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_ip ON public.chat_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_date ON public.chat_rate_limits(last_message_date);
CREATE INDEX IF NOT EXISTS idx_chat_rate_limits_blocked ON public.chat_rate_limits(is_blocked);

-- Table for tracking suspicious activity
CREATE TABLE IF NOT EXISTS public.chat_abuse_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET,
    session_id UUID REFERENCES public.chat_sessions(id),
    abuse_type VARCHAR(50), -- spam, flooding, inappropriate, bot
    details TEXT,
    auto_detected BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add abuse prevention fields to chat_sessions
ALTER TABLE public.chat_sessions 
ADD COLUMN IF NOT EXISTS ip_address INET,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_reason VARCHAR(100);

-- Add message count and timing to chat_messages
ALTER TABLE public.chat_messages
ADD COLUMN IF NOT EXISTS message_length INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS time_since_last_message INTEGER DEFAULT 0;

-- Function to check and update rate limits
CREATE OR REPLACE FUNCTION check_chat_rate_limit(ip_addr INET)
RETURNS JSONB AS $$
DECLARE
    rate_limit_record RECORD;
    daily_limit INTEGER := 50; -- messages per day
    session_limit INTEGER := 10; -- sessions per hour
    result JSONB;
BEGIN
    -- Get or create rate limit record for IP
    SELECT * INTO rate_limit_record 
    FROM public.chat_rate_limits 
    WHERE ip_address = ip_addr;
    
    -- If no record exists, create one
    IF NOT FOUND THEN
        INSERT INTO public.chat_rate_limits (ip_address)
        VALUES (ip_addr)
        RETURNING * INTO rate_limit_record;
    END IF;
    
    -- Check if blocked
    IF rate_limit_record.is_blocked AND 
       (rate_limit_record.blocked_until IS NULL OR rate_limit_record.blocked_until > NOW()) THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'IP is currently blocked',
            'blocked_until', rate_limit_record.blocked_until
        );
    END IF;
    
    -- Reset daily count if it's a new day
    IF rate_limit_record.last_message_date < CURRENT_DATE THEN
        UPDATE public.chat_rate_limits 
        SET daily_message_count = 0, last_message_date = CURRENT_DATE
        WHERE ip_address = ip_addr;
        rate_limit_record.daily_message_count := 0;
    END IF;
    
    -- Check daily message limit
    IF rate_limit_record.daily_message_count >= daily_limit THEN
        -- Block for 24 hours
        UPDATE public.chat_rate_limits
        SET is_blocked = true, blocked_until = NOW() + INTERVAL '24 hours'
        WHERE ip_address = ip_addr;
        
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'Daily message limit exceeded',
            'blocked_until', NOW() + INTERVAL '24 hours'
        );
    END IF;
    
    -- Check session limit (sessions in last hour)
    IF rate_limit_record.last_session_at > NOW() - INTERVAL '1 hour' AND 
       rate_limit_record.session_count >= session_limit THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'Too many sessions in the last hour',
            'retry_after', rate_limit_record.last_session_at + INTERVAL '1 hour'
        );
    END IF;
    
    -- Reset session count if more than an hour has passed
    IF rate_limit_record.last_session_at <= NOW() - INTERVAL '1 hour' THEN
        UPDATE public.chat_rate_limits
        SET session_count = 1, last_session_at = NOW()
        WHERE ip_address = ip_addr;
    ELSE
        UPDATE public.chat_rate_limits
        SET session_count = session_count + 1, last_session_at = NOW()
        WHERE ip_address = ip_addr;
    END IF;
    
    RETURN jsonb_build_object(
        'allowed', true,
        'daily_messages_used', rate_limit_record.daily_message_count,
        'daily_messages_limit', daily_limit,
        'sessions_this_hour', rate_limit_record.session_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment message count
CREATE OR REPLACE FUNCTION increment_message_count(ip_addr INET)
RETURNS void AS $$
BEGIN
    UPDATE public.chat_rate_limits
    SET daily_message_count = daily_message_count + 1
    WHERE ip_address = ip_addr;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect potential spam/abuse
CREATE OR REPLACE FUNCTION detect_chat_abuse(
    session_uuid UUID,
    message_text TEXT,
    ip_addr INET,
    time_since_last INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
    abuse_detected BOOLEAN := false;
    abuse_type TEXT := '';
    abuse_details TEXT := '';
    message_len INTEGER;
    recent_messages INTEGER;
    duplicate_count INTEGER;
BEGIN
    message_len := LENGTH(message_text);
    
    -- Check for very long messages (potential spam)
    IF message_len > 1000 THEN
        abuse_detected := true;
        abuse_type := 'long_message';
        abuse_details := 'Message too long: ' || message_len || ' characters';
    END IF;
    
    -- Check for rapid fire messages (less than 2 seconds apart)
    IF time_since_last < 2 AND time_since_last > 0 THEN
        -- Count recent rapid messages
        SELECT COUNT(*) INTO recent_messages
        FROM public.chat_messages
        WHERE session_id = session_uuid
        AND created_at > NOW() - INTERVAL '30 seconds'
        AND time_since_last_message < 2;
        
        IF recent_messages >= 5 THEN
            abuse_detected := true;
            abuse_type := 'flooding';
            abuse_details := 'Rapid fire messages detected: ' || recent_messages || ' in 30 seconds';
        END IF;
    END IF;
    
    -- Check for duplicate messages
    SELECT COUNT(*) INTO duplicate_count
    FROM public.chat_messages
    WHERE session_id = session_uuid
    AND message = message_text
    AND created_at > NOW() - INTERVAL '5 minutes';
    
    IF duplicate_count >= 3 THEN
        abuse_detected := true;
        abuse_type := 'duplicate_spam';
        abuse_details := 'Duplicate message sent ' || duplicate_count || ' times';
    END IF;
    
    -- Check for common spam patterns
    IF message_text ~* '(viagra|casino|lottery|winner|congratulations|click here|free money|make money fast)' THEN
        abuse_detected := true;
        abuse_type := 'spam_content';
        abuse_details := 'Message contains spam keywords';
    END IF;
    
    -- If abuse detected, log it
    IF abuse_detected THEN
        INSERT INTO public.chat_abuse_reports (
            ip_address, session_id, abuse_type, details, auto_detected
        ) VALUES (
            ip_addr, session_uuid, abuse_type, abuse_details, true
        );
        
        -- Flag the session
        UPDATE public.chat_sessions
        SET is_flagged = true, flagged_reason = abuse_type
        WHERE id = session_uuid;
    END IF;
    
    RETURN jsonb_build_object(
        'abuse_detected', abuse_detected,
        'abuse_type', abuse_type,
        'details', abuse_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on new tables
ALTER TABLE public.chat_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_abuse_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can view all rate limits" ON public.chat_rate_limits
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admin can view all abuse reports" ON public.chat_abuse_reports
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Allow service role to access these tables
CREATE POLICY "Service role can manage rate limits" ON public.chat_rate_limits
    FOR ALL WITH CHECK (true);

CREATE POLICY "Service role can manage abuse reports" ON public.chat_abuse_reports
    FOR ALL WITH CHECK (true); 