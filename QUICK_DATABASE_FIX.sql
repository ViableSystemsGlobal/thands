-- Quick Database Fix - Run this in Supabase SQL Editor

-- 1. Add missing columns to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS exchange_rate_ghs DECIMAL(10,2) DEFAULT 1.00;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'Tailored Hands';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_website TEXT;

-- 2. Add missing columns to consultations table
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS recaptcha_token TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS session_id TEXT;

-- 3. Add missing column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recaptcha_token TEXT;

-- 4. Insert default settings
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

-- 5. Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 6. Create basic RLS policies
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
CREATE POLICY "Settings are viewable by everyone" ON settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can insert consultations" ON consultations;
CREATE POLICY "Users can insert consultations" ON consultations FOR INSERT WITH CHECK (true);

-- 7. Verify the fixes
SELECT 'settings' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND column_name IN ('email', 'exchange_rate_ghs', 'company_name', 'company_address', 'company_phone', 'company_website')
ORDER BY column_name;

SELECT 'consultations' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'consultations' 
AND column_name IN ('recaptcha_token', 'session_id')
ORDER BY column_name;

SELECT 'messages' as table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'recaptcha_token'; 