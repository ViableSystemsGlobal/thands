-- Create settings table for store configuration
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    store_name VARCHAR(255) DEFAULT 'Tailored Hands',
    store_description TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(100) DEFAULT 'UTC',
    paystack_public_key VARCHAR(255),
    paystack_secret_key VARCHAR(255),
    exchange_rate DECIMAL(10,4) DEFAULT 16.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT settings_single_row CHECK (id = 1)
);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow admin emails to view and update settings (no recursion)
CREATE POLICY "Admin emails can view settings" ON settings
  FOR SELECT 
  USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

CREATE POLICY "Admin emails can update settings" ON settings
  FOR UPDATE 
  USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

CREATE POLICY "Admin emails can insert settings" ON settings
  FOR INSERT 
  WITH CHECK (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  ); 