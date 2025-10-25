-- Create email_templates table for storing email template settings
CREATE TABLE IF NOT EXISTS email_templates (
    id INTEGER PRIMARY KEY DEFAULT 1,
    header_html TEXT,
    footer_html TEXT,
    body_styles TEXT,
    primary_color VARCHAR(7) DEFAULT '#D2B48C',
    secondary_color VARCHAR(7) DEFAULT '#f8f9fa',
    font_family VARCHAR(100) DEFAULT 'Arial, sans-serif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default template if none exists
INSERT INTO email_templates (id, header_html, footer_html, body_styles, primary_color, secondary_color, font_family)
VALUES (1, '', '', '', '#D2B48C', '#f8f9fa', 'Arial, sans-serif')
ON CONFLICT (id) DO NOTHING;
