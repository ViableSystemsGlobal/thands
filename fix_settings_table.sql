-- First, let's check if the settings table exists and what columns it has
-- If it exists but has wrong structure, we'll fix it

-- Drop the existing settings table if it has wrong structure
DROP TABLE IF EXISTS settings CASCADE;

-- Create the settings table with correct structure
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default exchange rate setting
INSERT INTO settings (key, value, description) 
VALUES ('exchange_rate', '15.50', 'USD to GHS exchange rate');

-- Insert other default settings
INSERT INTO settings (key, value, description) 
VALUES 
    ('site_name', 'TailoredHands', 'Website name'),
    ('contact_email', 'info@tailoredhands.com', 'Contact email address'),
    ('shipping_fee_local', '10.00', 'Local shipping fee in GHS'),
    ('shipping_fee_international', '50.00', 'International shipping fee in USD');

-- Create index for faster lookups
CREATE INDEX idx_settings_key ON settings(key);

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update trigger for settings
CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 