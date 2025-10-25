-- Email Settings Table
CREATE TABLE IF NOT EXISTS email_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    smtp_host VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_username VARCHAR(255),
    smtp_password VARCHAR(255),
    smtp_from_email VARCHAR(255),
    smtp_from_name VARCHAR(255),
    smtp_secure BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates Table
CREATE TABLE IF NOT EXISTS email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    subject VARCHAR(500) NOT NULL,
    recipient_count INTEGER NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_by UUID REFERENCES users(id)
);

-- Insert some default email templates
INSERT INTO email_templates (name, subject, content) VALUES 
('Welcome Email', 'Welcome to TailoredHands!', '<h1>Welcome to TailoredHands!</h1><p>Thank you for joining us. We are excited to have you as part of our community.</p><p>Best regards,<br>The TailoredHands Team</p>'),
('Order Confirmation', 'Your Order Has Been Confirmed', '<h1>Order Confirmation</h1><p>Thank you for your order! We have received your order and will process it shortly.</p><p>Order Details:</p><ul><li>Order ID: {order_id}</li><li>Total: {total}</li></ul><p>Best regards,<br>The TailoredHands Team</p>'),
('Newsletter Welcome', 'Welcome to Our Newsletter!', '<h1>Welcome to Our Newsletter!</h1><p>Thank you for subscribing to our newsletter. You will receive updates about our latest products and offers.</p><p>Best regards,<br>The TailoredHands Team</p>')
ON CONFLICT DO NOTHING;
