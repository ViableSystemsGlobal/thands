-- Quick fix for email_config table - run this in Supabase SQL Editor
-- This adds the missing columns that are causing the immediate error

-- Add new columns for different email services
ALTER TABLE email_config 
ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(255),
ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
ADD COLUMN IF NOT EXISTS smtp_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS smtp_password VARCHAR(255),
ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sendgrid_api_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS mailgun_api_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS mailgun_domain VARCHAR(255);

-- Update the service column to have a default value
ALTER TABLE email_config 
ALTER COLUMN service SET DEFAULT 'hostinger_smtp';

-- Show what we just added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'email_config' 
  AND column_name IN ('smtp_host', 'smtp_port', 'smtp_username', 'smtp_password', 'smtp_secure', 'sendgrid_api_key', 'mailgun_api_key', 'mailgun_domain')
ORDER BY column_name; 