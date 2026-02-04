-- Add MyDHL API columns to settings table (replacing Shippo)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dhl_api_key TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dhl_api_secret TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dhl_account_number TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dhl_base_url TEXT DEFAULT 'https://express.api.dhl.com/mydhlapi/test';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dhl_from_name VARCHAR(100) DEFAULT 'TailoredHands';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dhl_from_street VARCHAR(200) DEFAULT '123 Business Street';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dhl_from_city VARCHAR(100) DEFAULT 'Accra';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dhl_from_state VARCHAR(100) DEFAULT 'Greater Accra';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dhl_from_zip VARCHAR(20) DEFAULT '00233';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS dhl_from_country VARCHAR(2) DEFAULT 'GH';

-- Comment on columns
COMMENT ON COLUMN settings.dhl_api_key IS 'MyDHL API Key (Consumer Key from DHL Developer Portal)';
COMMENT ON COLUMN settings.dhl_api_secret IS 'MyDHL API Secret (Secret Key from DHL Developer Portal)';
COMMENT ON COLUMN settings.dhl_account_number IS 'DHL Shipper Account Number';
COMMENT ON COLUMN settings.dhl_base_url IS 'MyDHL API Base URL (test or production)';
