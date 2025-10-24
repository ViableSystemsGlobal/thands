-- Create missing tables for backend APIs

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    description TEXT,
    min_order_value DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product FAQs table
CREATE TABLE IF NOT EXISTS product_faqs (
    id SERIAL PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletter settings table
CREATE TABLE IF NOT EXISTS newsletter_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    title VARCHAR(255),
    subtitle VARCHAR(255),
    description TEXT,
    offer_text VARCHAR(255),
    button_text VARCHAR(100),
    image_url TEXT,
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_settings_row CHECK (id = 1)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_dates ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

CREATE INDEX IF NOT EXISTS idx_product_faqs_product_id ON product_faqs(product_id);

-- Create update trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_product_faqs_updated_at ON product_faqs;
CREATE TRIGGER update_product_faqs_updated_at
    BEFORE UPDATE ON product_faqs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_newsletter_settings_updated_at ON newsletter_settings;
CREATE TRIGGER update_newsletter_settings_updated_at
    BEFORE UPDATE ON newsletter_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default newsletter settings
INSERT INTO newsletter_settings (id, title, subtitle, description, offer_text, button_text, image_url, is_enabled)
VALUES (
    1,
    'Get 15% Off Your First Order!',
    'Join our newsletter for exclusive offers',
    'Be the first to know about new arrivals, special promotions, and styling tips.',
    'Use code WELCOME15 at checkout',
    'Claim Your Discount',
    '',
    true
) ON CONFLICT (id) DO NOTHING;

