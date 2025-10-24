-- Update email_config table to support multiple email services
-- Run this in your Supabase SQL editor

-- First, let's see the current structure and backup existing data
-- (You may want to export existing data first)

-- Add new columns for different service types
ALTER TABLE email_config 
ADD COLUMN IF NOT EXISTS smtp_host VARCHAR(255),
ADD COLUMN IF NOT EXISTS smtp_port INTEGER DEFAULT 587,
ADD COLUMN IF NOT EXISTS smtp_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS smtp_password VARCHAR(255),
ADD COLUMN IF NOT EXISTS smtp_secure BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS sendgrid_api_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS mailgun_api_key VARCHAR(500),
ADD COLUMN IF NOT EXISTS mailgun_domain VARCHAR(255);

-- Rename the old api_key column to be more specific (if it exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'email_config' AND column_name = 'api_key'
  ) THEN
    -- If we have existing data in api_key, migrate it to sendgrid_api_key
    UPDATE email_config 
    SET sendgrid_api_key = api_key 
    WHERE api_key IS NOT NULL AND sendgrid_api_key IS NULL;
    
    -- Drop the old api_key column
    ALTER TABLE email_config DROP COLUMN api_key;
  END IF;
END $$;

-- Update the service column to have a default value
ALTER TABLE email_config 
ALTER COLUMN service SET DEFAULT 'hostinger_smtp';

-- Add a comment to the table
COMMENT ON TABLE email_config IS 'Email service configuration supporting multiple providers (SMTP, SendGrid, Mailgun)';

-- Add comments to new columns
COMMENT ON COLUMN email_config.smtp_host IS 'SMTP server hostname (e.g., mail.yourdomain.com)';
COMMENT ON COLUMN email_config.smtp_port IS 'SMTP server port (587 for STARTTLS, 465 for SSL)';
COMMENT ON COLUMN email_config.smtp_username IS 'SMTP authentication username (usually email address)';
COMMENT ON COLUMN email_config.smtp_password IS 'SMTP authentication password';
COMMENT ON COLUMN email_config.smtp_secure IS 'Whether to use secure connection (TLS/SSL)';
COMMENT ON COLUMN email_config.sendgrid_api_key IS 'SendGrid API key (starts with SG.)';
COMMENT ON COLUMN email_config.mailgun_api_key IS 'Mailgun private API key';
COMMENT ON COLUMN email_config.mailgun_domain IS 'Mailgun domain (e.g., mg.yourdomain.com)';

-- Create an index on the service column for better performance
CREATE INDEX IF NOT EXISTS idx_email_config_service ON email_config(service);

-- Show the updated table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'email_config'
ORDER BY ordinal_position; 