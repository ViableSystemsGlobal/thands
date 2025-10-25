-- Create notification settings table
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
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    method VARCHAR(20) NOT NULL, -- 'email' or 'sms'
    status VARCHAR(20) NOT NULL, -- 'sent', 'failed', 'pending'
    error_message TEXT,
    order_id INTEGER REFERENCES orders(id),
    consultation_id INTEGER REFERENCES consultations(id),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_order_id ON notification_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_consultation_id ON notification_logs(consultation_id);

-- Insert default notification settings if none exist
INSERT INTO notification_settings (
    email_enabled, sms_enabled, order_confirmation_email, order_confirmation_sms,
    payment_success_email, payment_success_sms, order_shipped_email, order_shipped_sms,
    order_delivered_email, order_delivered_sms, gift_voucher_email, gift_voucher_sms
) 
SELECT 
    true, true, true, true, true, true, true, true, true, false, true, false
WHERE NOT EXISTS (SELECT 1 FROM notification_settings);
