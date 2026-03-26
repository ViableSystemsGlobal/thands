-- Ensure all columns required by PUT /api/admin/settings exist.
-- Run this if you get "column X does not exist" when saving admin settings.

ALTER TABLE settings ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS exchange_rate_gbp DECIMAL(10,4) DEFAULT 0.79;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_button_text VARCHAR(100) DEFAULT 'EXPLORE COLLECTION';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS favicon_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS navbar_logo_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS footer_logo_url TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS captcha_enabled BOOLEAN DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS recaptcha_site_key TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS recaptcha_secret_key TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_places_api_key TEXT;
