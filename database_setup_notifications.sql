-- Email Configuration Table
CREATE TABLE IF NOT EXISTS email_config (
    id SERIAL PRIMARY KEY,
    service VARCHAR(50) NOT NULL DEFAULT 'SendGrid', -- 'SendGrid', 'Mailgun', 'Gmail', 'SMTP'
    api_key TEXT,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) DEFAULT 'TailoredHands',
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_user VARCHAR(255),
    smtp_password TEXT,
    mailgun_domain VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SMS Configuration Table
CREATE TABLE IF NOT EXISTS sms_config (
    id SERIAL PRIMARY KEY,
    service VARCHAR(50) NOT NULL DEFAULT 'Twilio', -- 'Twilio', 'AfricasTalking', 'Vonage', 'Termii', 'Custom'
    account_sid VARCHAR(255), -- For Twilio
    auth_token TEXT, -- For Twilio
    from_number VARCHAR(20), -- For Twilio/Vonage
    api_key TEXT, -- For most services
    api_secret TEXT, -- For Vonage
    username VARCHAR(255), -- For Africa's Talking
    sender_id VARCHAR(20), -- For Africa's Talking/Termii
    custom_api_url TEXT, -- For custom SMS API
    auth_type VARCHAR(20) DEFAULT 'bearer', -- 'bearer', 'api-key', 'custom'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Settings Table
CREATE TABLE IF NOT EXISTS notification_settings (
    id SERIAL PRIMARY KEY,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT true,
    order_confirmation_email BOOLEAN DEFAULT true,
    order_confirmation_sms BOOLEAN DEFAULT true,
    payment_success_email BOOLEAN DEFAULT true,
    payment_success_sms BOOLEAN DEFAULT true,
    order_shipped_email BOOLEAN DEFAULT true,
    order_shipped_sms BOOLEAN DEFAULT true,
    order_delivered_email BOOLEAN DEFAULT true,
    order_delivered_sms BOOLEAN DEFAULT false,
    gift_voucher_email BOOLEAN DEFAULT true,
    gift_voucher_sms BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification Logs Table for tracking sent notifications
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'order_confirmation', 'payment_success', 'order_shipped', etc.
    recipient VARCHAR(255) NOT NULL, -- email or phone number
    method VARCHAR(10) NOT NULL, -- 'email' or 'sms'
    status VARCHAR(20) NOT NULL, -- 'sent', 'failed'
    error_message TEXT, -- if failed, store error details
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    metadata JSONB, -- additional data like tracking numbers, voucher codes, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default notification settings if none exist
INSERT INTO notification_settings (
    email_enabled,
    sms_enabled,
    order_confirmation_email,
    order_confirmation_sms,
    payment_success_email,
    payment_success_sms,
    order_shipped_email,
    order_shipped_sms,
    order_delivered_email,
    order_delivered_sms,
    gift_voucher_email,
    gift_voucher_sms
) 
SELECT 
    true, true, true, true, true, true, true, true, true, false, true, false
WHERE NOT EXISTS (SELECT 1 FROM notification_settings);

-- Insert default email config if none exists
INSERT INTO email_config (
    service,
    from_email,
    from_name
) 
SELECT 
    'SendGrid',
    'noreply@tailoredhands.com',
    'TailoredHands'
WHERE NOT EXISTS (SELECT 1 FROM email_config);

-- Insert default SMS config if none exists
INSERT INTO sms_config (
    service
) 
SELECT 
    'Twilio'
WHERE NOT EXISTS (SELECT 1 FROM sms_config);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_order_id ON notification_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_method ON notification_logs(method);

-- Update function for updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_email_config_updated_at ON email_config;
CREATE TRIGGER update_email_config_updated_at
    BEFORE UPDATE ON email_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_config_updated_at ON sms_config;
CREATE TRIGGER update_sms_config_updated_at
    BEFORE UPDATE ON sms_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (uncomment and adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON TABLE email_config TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE sms_config TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE notification_settings TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE notification_logs TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE email_config_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE sms_config_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE notification_settings_id_seq TO your_app_user;
-- GRANT USAGE, SELECT ON SEQUENCE notification_logs_id_seq TO your_app_user; 