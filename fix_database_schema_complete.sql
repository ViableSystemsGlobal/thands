-- Comprehensive Database Schema Fix
-- This script fixes all missing columns and schema issues

-- 1. Fix settings table - add missing columns
DO $$ 
BEGIN
    -- Add email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'email') THEN
        ALTER TABLE settings ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column to settings table';
    END IF;
    
    -- Add exchange_rate_ghs column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'exchange_rate_ghs') THEN
        ALTER TABLE settings ADD COLUMN exchange_rate_ghs DECIMAL(10,2) DEFAULT 1.00;
        RAISE NOTICE 'Added exchange_rate_ghs column to settings table';
    END IF;
    
    -- Add company_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'company_name') THEN
        ALTER TABLE settings ADD COLUMN company_name TEXT DEFAULT 'Tailored Hands';
        RAISE NOTICE 'Added company_name column to settings table';
    END IF;
    
    -- Add company_address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'company_address') THEN
        ALTER TABLE settings ADD COLUMN company_address TEXT;
        RAISE NOTICE 'Added company_address column to settings table';
    END IF;
    
    -- Add company_phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'company_phone') THEN
        ALTER TABLE settings ADD COLUMN company_phone TEXT;
        RAISE NOTICE 'Added company_phone column to settings table';
    END IF;
    
    -- Add company_website column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'company_website') THEN
        ALTER TABLE settings ADD COLUMN company_website TEXT;
        RAISE NOTICE 'Added company_website column to settings table';
    END IF;
END $$;

-- 2. Fix consultations table - add recaptcha_token column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'recaptcha_token') THEN
        ALTER TABLE consultations ADD COLUMN recaptcha_token TEXT;
        RAISE NOTICE 'Added recaptcha_token column to consultations table';
    END IF;
END $$;

-- 3. Fix messages table - add recaptcha_token column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recaptcha_token') THEN
        ALTER TABLE messages ADD COLUMN recaptcha_token TEXT;
        RAISE NOTICE 'Added recaptcha_token column to messages table';
    END IF;
END $$;

-- 4. Ensure RLS policies are properly set up
-- Settings table policies
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
CREATE POLICY "Settings are viewable by everyone" ON settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Settings are editable by admins" ON settings;
CREATE POLICY "Settings are editable by admins" ON settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Consultations table policies
DROP POLICY IF EXISTS "Users can insert their own consultations" ON consultations;
CREATE POLICY "Users can insert their own consultations" ON consultations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    );

DROP POLICY IF EXISTS "Users can view their own consultations" ON consultations;
CREATE POLICY "Users can view their own consultations" ON consultations
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Messages table policies
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 5. Insert default settings if none exist
INSERT INTO settings (id, company_name, email, exchange_rate_ghs, company_address, company_phone, company_website)
VALUES (
    'default',
    'Tailored Hands',
    'info@tailoredhands.com',
    1.00,
    'Accra, Ghana',
    '+233 20 123 4567',
    'https://tailoredhands.com'
)
ON CONFLICT (id) DO NOTHING;

-- 6. Enable RLS on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON settings TO anon, authenticated;
GRANT ALL ON consultations TO anon, authenticated;
GRANT ALL ON messages TO anon, authenticated;

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_session_id ON consultations(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- 9. Verify the fixes
SELECT 
    'settings' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND column_name IN ('email', 'exchange_rate_ghs', 'company_name', 'company_address', 'company_phone', 'company_website')
ORDER BY column_name;

SELECT 
    'consultations' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'consultations' 
AND column_name = 'recaptcha_token';

SELECT 
    'messages' as table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'recaptcha_token'; 