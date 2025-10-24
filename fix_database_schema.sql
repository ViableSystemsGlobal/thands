-- Fix missing database columns for reCAPTCHA and settings
-- Run this migration to add missing columns

-- 1. Add missing columns to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS exchange_rate_ghs DECIMAL(10,2) DEFAULT 16.00;

-- 2. Add recaptcha_token column to consultations table
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS recaptcha_token TEXT;

-- 3. Add recaptcha_token column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS recaptcha_token TEXT;

-- 4. Update existing settings record with default values if needed
INSERT INTO settings (id, email, exchange_rate_ghs, created_at, updated_at)
VALUES (1, 'hello@tailoredhands.africa', 16.00, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = COALESCE(settings.email, EXCLUDED.email),
  exchange_rate_ghs = COALESCE(settings.exchange_rate_ghs, EXCLUDED.exchange_rate_ghs),
  updated_at = NOW();

-- 5. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON consultations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;

-- 6. Enable RLS if not already enabled
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for public access to settings (for contact page)
CREATE POLICY IF NOT EXISTS "Settings are viewable by everyone" ON settings
FOR SELECT USING (true);

-- 8. Create policies for consultations
CREATE POLICY IF NOT EXISTS "Consultations are insertable by everyone" ON consultations
FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Consultations are viewable by authenticated users" ON consultations
FOR SELECT USING (auth.uid() = user_id);

-- 9. Create policies for messages
CREATE POLICY IF NOT EXISTS "Messages are insertable by everyone" ON messages
FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Messages are viewable by admins" ON messages
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 10. Verify the changes
SELECT 
  'settings' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND column_name IN ('email', 'exchange_rate_ghs')
UNION ALL
SELECT 
  'consultations' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'consultations' 
AND column_name = 'recaptcha_token'
UNION ALL
SELECT 
  'messages' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'recaptcha_token'; 