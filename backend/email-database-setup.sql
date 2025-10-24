-- Email System Database Setup
-- Run this SQL to create the required tables for the email system

-- Email configuration table
CREATE TABLE IF NOT EXISTS email_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INTEGER DEFAULT 587,
    smtp_username VARCHAR(255) NOT NULL,
    smtp_password TEXT NOT NULL,
    from_email VARCHAR(255) NOT NULL,
    from_name VARCHAR(255) DEFAULT 'TailoredHands',
    reply_to_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    template_type VARCHAR(50) DEFAULT 'general',
    status VARCHAR(20) NOT NULL, -- 'sent', 'failed', 'pending'
    message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_config_active ON email_config(is_active);
CREATE INDEX IF NOT EXISTS idx_email_config_created_at ON email_config(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_by ON email_logs(sent_by);

-- Insert default email configuration (update with your actual SMTP settings)
INSERT INTO email_config (
    smtp_host,
    smtp_port,
    smtp_username,
    smtp_password,
    from_email,
    from_name,
    reply_to_email,
    is_active
) VALUES (
    'mail.tailoredhands.africa',  -- Replace with your actual SMTP host
    587,                          -- Replace with your actual SMTP port
    'noreply@tailoredhands.africa', -- Replace with your actual email
    'your-email-password',        -- Replace with your actual password
    'noreply@tailoredhands.africa', -- Replace with your actual from email
    'TailoredHands',
    'support@tailoredhands.africa',
    true
) ON CONFLICT DO NOTHING;

-- Add RLS policies for security
ALTER TABLE email_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy for email_config: Only admins can read/write
CREATE POLICY "email_config_admin_only" ON email_config
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy for email_logs: Admins can read all, users can read their own
CREATE POLICY "email_logs_admin_read_all" ON email_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "email_logs_user_read_own" ON email_logs
    FOR SELECT USING (sent_by = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_email_config_updated_at 
    BEFORE UPDATE ON email_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE email_config IS 'Stores SMTP configuration for email sending';
COMMENT ON TABLE email_logs IS 'Logs all email sending attempts for monitoring and debugging';

-- Grant necessary permissions (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE ON email_config TO your_app_user;
-- GRANT SELECT, INSERT ON email_logs TO your_app_user;
