-- Add shipping settings columns to settings table
-- Run this SQL script to add the necessary columns for Shippo configuration

-- Add shipping-related columns to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS shippo_api_key TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS shippo_webhook_secret TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS shippo_from_name VARCHAR(100) DEFAULT 'TailoredHands';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS shippo_from_street VARCHAR(200) DEFAULT '123 Business Street';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS shippo_from_city VARCHAR(100) DEFAULT 'Accra';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS shippo_from_state VARCHAR(100) DEFAULT 'Greater Accra';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS shippo_from_zip VARCHAR(20) DEFAULT '00233';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS shippo_from_country VARCHAR(2) DEFAULT 'GH';

-- Add comments for documentation
COMMENT ON COLUMN settings.shippo_api_key IS 'Shippo API key for international shipping';
COMMENT ON COLUMN settings.shippo_webhook_secret IS 'Shippo webhook secret for verification';
COMMENT ON COLUMN settings.shippo_from_name IS 'Business name for shipping origin';
COMMENT ON COLUMN settings.shippo_from_street IS 'Street address for shipping origin';
COMMENT ON COLUMN settings.shippo_from_city IS 'City for shipping origin';
COMMENT ON COLUMN settings.shippo_from_state IS 'State/region for shipping origin';
COMMENT ON COLUMN settings.shippo_from_zip IS 'ZIP/postal code for shipping origin';
COMMENT ON COLUMN settings.shippo_from_country IS 'Country code for shipping origin (ISO 3166-1 alpha-2)';
