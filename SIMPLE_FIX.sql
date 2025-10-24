-- Simple Database Fix - Copy and paste this into Supabase SQL Editor

-- Add missing columns
ALTER TABLE messages ADD COLUMN recaptcha_token TEXT;
ALTER TABLE consultations ADD COLUMN recaptcha_token TEXT;
ALTER TABLE consultations ADD COLUMN session_id TEXT;
ALTER TABLE settings ADD COLUMN email TEXT;
ALTER TABLE settings ADD COLUMN exchange_rate_ghs DECIMAL(10,2) DEFAULT 1.00;
ALTER TABLE settings ADD COLUMN company_name TEXT DEFAULT 'Tailored Hands';
ALTER TABLE settings ADD COLUMN company_address TEXT;
ALTER TABLE settings ADD COLUMN company_phone TEXT;
ALTER TABLE settings ADD COLUMN company_website TEXT;

-- Add default settings
INSERT INTO settings (id, company_name, email, exchange_rate_ghs, company_address, company_phone, company_website)
VALUES (1, 'Tailored Hands', 'info@tailoredhands.com', 1.00, 'Accra, Ghana', '+233 20 123 4567', 'https://tailoredhands.com')
ON CONFLICT (id) DO NOTHING;

-- Basic permissions
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

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