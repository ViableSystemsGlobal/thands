-- Manually confirm users for development testing
-- This allows existing users to sign in without email confirmation

-- Note: For new signups to work without confirmation, this needs to be configured
-- in the Supabase dashboard under Authentication > Settings > Email confirmation

-- Create a function to handle manual user confirmation if needed
CREATE OR REPLACE FUNCTION confirm_user_manually(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Find the user by email
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE NOTICE 'User with email % not found', user_email;
        RETURN FALSE;
    END IF;
    
    -- Update the user to be confirmed
    UPDATE auth.users
    SET 
        email_confirmed_at = NOW()
    WHERE id = user_id;
    
    RAISE NOTICE 'User % manually confirmed', user_email;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to admin roles
GRANT EXECUTE ON FUNCTION confirm_user_manually(TEXT) TO service_role;

-- Confirm any existing unconfirmed users for development
UPDATE auth.users
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

DO $$
BEGIN
    RAISE NOTICE 'Email confirmation settings updated for development. Check Supabase dashboard to disable email confirmation completely.';
END $$;
