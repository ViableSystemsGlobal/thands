-- Safe approach: Check what exists first

-- Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'settings' 
ORDER BY ordinal_position;

-- If you see this query returns columns that don't include 'key', 
-- then run the commands below:

-- Step 1: Backup any existing data (if the table has important data)
-- CREATE TABLE settings_backup AS SELECT * FROM settings;

-- Step 2: Drop and recreate with correct structure
DROP TABLE IF EXISTS settings CASCADE;

-- Step 3: Create new table with correct structure
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Insert default data
INSERT INTO settings (key, value, description) VALUES
    ('exchange_rate', '15.50', 'USD to GHS exchange rate'),
    ('site_name', 'TailoredHands', 'Website name'),
    ('contact_email', 'info@tailoredhands.com', 'Contact email address'),
    ('shipping_fee_local', '10.00', 'Local shipping fee in GHS'),
    ('shipping_fee_international', '50.00', 'International shipping fee in USD');

-- Step 5: Create index
CREATE INDEX idx_settings_key ON settings(key);

-- Step 6: Create update function and trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 