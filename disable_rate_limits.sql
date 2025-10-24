-- TEMPORARILY DISABLE RATE LIMITING for Development
-- Use this only during development/testing

-- Replace rate limit function with one that always allows
CREATE OR REPLACE FUNCTION check_chat_rate_limit(ip_addr INET)
RETURNS JSONB AS $$
BEGIN
    -- Always return allowed for development
    RETURN jsonb_build_object(
        'allowed', true,
        'daily_messages_used', 0,
        'daily_messages_limit', 999999,
        'sessions_this_hour', 0,
        'development_mode', true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear all rate limit data
DELETE FROM public.chat_rate_limits;

SELECT 'Rate limiting DISABLED for development! Remember to re-enable for production.' as status; 