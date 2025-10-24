-- Add logo fields to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS navbar_logo_url TEXT,
ADD COLUMN IF NOT EXISTS footer_logo_url TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS hero_button_text VARCHAR(100) DEFAULT 'EXPLORE COLLECTION',
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS captcha_enabled BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN settings.navbar_logo_url IS 'URL for the logo displayed in the navigation bar';
COMMENT ON COLUMN settings.footer_logo_url IS 'URL for the logo displayed in the footer';
COMMENT ON COLUMN settings.favicon_url IS 'URL for the website favicon';
