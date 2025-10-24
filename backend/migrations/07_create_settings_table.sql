-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) DEFAULT 'Tailored Hands',
    email VARCHAR(255) DEFAULT 'hello@tailoredhands.africa',
    phone VARCHAR(50) DEFAULT '+233 24 532 7668',
    address TEXT DEFAULT 'Nii Odai Ayiku Road, Accra, Ghana',
    exchange_rate_ghs DECIMAL(10,2) DEFAULT 16.0,
    hero_image_url VARCHAR(500),
    hero_title VARCHAR(500) DEFAULT 'Modern Elegance Redefined',
    hero_subtitle TEXT DEFAULT 'Discover our collection of meticulously crafted African-inspired pieces that blend traditional aesthetics with contemporary design.',
    hero_button_text VARCHAR(100) DEFAULT 'EXPLORE COLLECTION',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_updated_at();

-- Insert default settings
INSERT INTO settings (store_name, email, phone, address, exchange_rate_ghs, hero_image_url, hero_title, hero_subtitle, hero_button_text) 
VALUES (
    'Tailored Hands',
    'hello@tailoredhands.africa',
    '+233 24 532 7668',
    'Nii Odai Ayiku Road, Accra, Ghana',
    16.0,
    'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/f9e9c1ced82f14bddc858a8dd7b36cff.png',
    'Modern Elegance Redefined',
    'Discover our collection of meticulously crafted African-inspired pieces that blend traditional aesthetics with contemporary design.',
    'EXPLORE COLLECTION'
) ON CONFLICT (id) DO NOTHING;
