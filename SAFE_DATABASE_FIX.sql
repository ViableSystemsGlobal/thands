-- Safe Database Fix - Won't error if columns already exist

-- Add missing columns safely
DO $$ 
BEGIN
    -- Add recaptcha_token to messages if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'recaptcha_token') THEN
        ALTER TABLE messages ADD COLUMN recaptcha_token TEXT;
        RAISE NOTICE 'Added recaptcha_token column to messages table';
    ELSE
        RAISE NOTICE 'recaptcha_token column already exists in messages table';
    END IF;
    
    -- Add recaptcha_token to consultations if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'recaptcha_token') THEN
        ALTER TABLE consultations ADD COLUMN recaptcha_token TEXT;
        RAISE NOTICE 'Added recaptcha_token column to consultations table';
    ELSE
        RAISE NOTICE 'recaptcha_token column already exists in consultations table';
    END IF;
    
    -- Add session_id to consultations if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'session_id') THEN
        ALTER TABLE consultations ADD COLUMN session_id TEXT;
        RAISE NOTICE 'Added session_id column to consultations table';
    ELSE
        RAISE NOTICE 'session_id column already exists in consultations table';
    END IF;
    
    -- Add email to settings if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'email') THEN
        ALTER TABLE settings ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column to settings table';
    ELSE
        RAISE NOTICE 'email column already exists in settings table';
    END IF;
    
    -- Add exchange_rate_ghs to settings if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'exchange_rate_ghs') THEN
        ALTER TABLE settings ADD COLUMN exchange_rate_ghs DECIMAL(10,2) DEFAULT 1.00;
        RAISE NOTICE 'Added exchange_rate_ghs column to settings table';
    ELSE
        RAISE NOTICE 'exchange_rate_ghs column already exists in settings table';
    END IF;
    
    -- Add company_name to settings if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'company_name') THEN
        ALTER TABLE settings ADD COLUMN company_name TEXT DEFAULT 'Tailored Hands';
        RAISE NOTICE 'Added company_name column to settings table';
    ELSE
        RAISE NOTICE 'company_name column already exists in settings table';
    END IF;
    
    -- Add company_address to settings if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'company_address') THEN
        ALTER TABLE settings ADD COLUMN company_address TEXT;
        RAISE NOTICE 'Added company_address column to settings table';
    ELSE
        RAISE NOTICE 'company_address column already exists in settings table';
    END IF;
    
    -- Add company_phone to settings if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'company_phone') THEN
        ALTER TABLE settings ADD COLUMN company_phone TEXT;
        RAISE NOTICE 'Added company_phone column to settings table';
    ELSE
        RAISE NOTICE 'company_phone column already exists in settings table';
    END IF;
    
    -- Add company_website to settings if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'company_website') THEN
        ALTER TABLE settings ADD COLUMN company_website TEXT;
        RAISE NOTICE 'Added company_website column to settings table';
    ELSE
        RAISE NOTICE 'company_website column already exists in settings table';
    END IF;
END $$;

-- Add default settings (will only insert if ID=1 doesn't exist)
INSERT INTO settings (id, company_name, email, exchange_rate_ghs, company_address, company_phone, company_website)
VALUES (1, 'Tailored Hands', 'info@tailoredhands.com', 1.00, 'Accra, Ghana', '+233 20 123 4567', 'https://tailoredhands.com')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS (safe to run multiple times)
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create/update RLS policies (safe to run multiple times)
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
CREATE POLICY "Settings are viewable by everyone" ON settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Settings are editable by admins" ON settings;
CREATE POLICY "Settings are editable by admins" ON settings FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Settings can be inserted" ON settings;
CREATE POLICY "Settings can be inserted" ON settings FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert consultations" ON consultations;
CREATE POLICY "Users can insert consultations" ON consultations FOR INSERT WITH CHECK (true);

-- Verify what was added
SELECT 
    'settings' as table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND column_name IN ('email', 'exchange_rate_ghs', 'company_name', 'company_address', 'company_phone', 'company_website')
ORDER BY column_name; 