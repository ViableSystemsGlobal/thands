-- ADJUST RATE LIMITS for Development/Testing
-- Run this to make rate limits more permissive during testing

-- Update the rate limit function to be more permissive for development
CREATE OR REPLACE FUNCTION check_chat_rate_limit(ip_addr INET)
RETURNS JSONB AS $$
DECLARE
    rate_limit_record RECORD;
    daily_limit INTEGER := 500; -- Increased from 50 to 500 for testing
    session_limit INTEGER := 100; -- Increased from 10 to 100 for testing
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
    
    -- Check daily message limit (now much higher)
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
    
    -- Check session limit (sessions in last hour) - now much higher
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

-- Clear existing rate limit data
DELETE FROM public.chat_rate_limits;

SELECT 'Rate limits adjusted for development! New limits: 500 messages/day, 100 sessions/hour' as status; 