-- Final Settings Database Fix
-- Run this in Supabase SQL Editor to ensure your settings table works with the rebuilt admin settings page

-- Add missing columns safely (won't error if they already exist)
DO $$ 
BEGIN
    -- Ensure all required columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'store_name') THEN
        ALTER TABLE settings ADD COLUMN store_name VARCHAR(255) DEFAULT 'Tailored Hands';
        RAISE NOTICE 'Added store_name column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'contact_email') THEN
        ALTER TABLE settings ADD COLUMN contact_email VARCHAR(255);
        RAISE NOTICE 'Added contact_email column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'contact_phone') THEN
        ALTER TABLE settings ADD COLUMN contact_phone VARCHAR(50);
        RAISE NOTICE 'Added contact_phone column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'address') THEN
        ALTER TABLE settings ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'store_description') THEN
        ALTER TABLE settings ADD COLUMN store_description TEXT;
        RAISE NOTICE 'Added store_description column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'currency') THEN
        ALTER TABLE settings ADD COLUMN currency VARCHAR(3) DEFAULT 'USD';
        RAISE NOTICE 'Added currency column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'timezone') THEN
        ALTER TABLE settings ADD COLUMN timezone VARCHAR(100) DEFAULT 'UTC';
        RAISE NOTICE 'Added timezone column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'exchange_rate') THEN
        ALTER TABLE settings ADD COLUMN exchange_rate DECIMAL(10,4) DEFAULT 16.0;
        RAISE NOTICE 'Added exchange_rate column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'exchange_rate_ghs') THEN
        ALTER TABLE settings ADD COLUMN exchange_rate_ghs DECIMAL(10,4) DEFAULT 16.0;
        RAISE NOTICE 'Added exchange_rate_ghs column (for compatibility)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'paystack_public_key') THEN
        ALTER TABLE settings ADD COLUMN paystack_public_key VARCHAR(255);
        RAISE NOTICE 'Added paystack_public_key column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'paystack_secret_key') THEN
        ALTER TABLE settings ADD COLUMN paystack_secret_key VARCHAR(255);
        RAISE NOTICE 'Added paystack_secret_key column';
    END IF;
    
    -- Add compatibility columns (for Contact page and other components)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'email') THEN
        ALTER TABLE settings ADD COLUMN email VARCHAR(255);
        RAISE NOTICE 'Added email column (compatibility)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'phone') THEN
        ALTER TABLE settings ADD COLUMN phone VARCHAR(50);
        RAISE NOTICE 'Added phone column (compatibility)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'created_at') THEN
        ALTER TABLE settings ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'updated_at') THEN
        ALTER TABLE settings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- Insert default settings row if none exists
INSERT INTO settings (
    id, 
    store_name, 
    contact_email, 
    email,
    contact_phone, 
    phone,
    address, 
    store_description,
    currency, 
    timezone, 
    exchange_rate, 
    exchange_rate_ghs,
    paystack_public_key, 
    paystack_secret_key,
    created_at, 
    updated_at
) 
VALUES (
    1,
    'Tailored Hands',
    'hello@tailoredhands.africa',
    'hello@tailoredhands.africa',
    '+233 24 532 7668',
    '+233 24 532 7668',
    'Nii Odai Ayiku Road, Accra, Ghana',
    'Premium custom clothing and tailoring services',
    'USD',
    'Africa/Accra',
    16.0,
    16.0,
    'pk_test_50427dbd3ccc34606d04a1d775d63818c74528ea',
    'sk_test_27fee748f15ac3869348b9e491a9c48a5f2ee0d2',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    -- Only update if current values are null or empty
    store_name = COALESCE(NULLIF(settings.store_name, ''), EXCLUDED.store_name),
    contact_email = COALESCE(NULLIF(settings.contact_email, ''), EXCLUDED.contact_email),
    email = COALESCE(NULLIF(settings.email, ''), EXCLUDED.email),
    contact_phone = COALESCE(NULLIF(settings.contact_phone, ''), EXCLUDED.contact_phone),
    phone = COALESCE(NULLIF(settings.phone, ''), EXCLUDED.phone),
    address = COALESCE(NULLIF(settings.address, ''), EXCLUDED.address),
    store_description = COALESCE(NULLIF(settings.store_description, ''), EXCLUDED.store_description),
    currency = COALESCE(NULLIF(settings.currency, ''), EXCLUDED.currency),
    timezone = COALESCE(NULLIF(settings.timezone, ''), EXCLUDED.timezone),
    exchange_rate = COALESCE(settings.exchange_rate, EXCLUDED.exchange_rate),
    exchange_rate_ghs = COALESCE(settings.exchange_rate_ghs, EXCLUDED.exchange_rate_ghs),
    paystack_public_key = COALESCE(NULLIF(settings.paystack_public_key, ''), EXCLUDED.paystack_public_key),
    paystack_secret_key = COALESCE(NULLIF(settings.paystack_secret_key, ''), EXCLUDED.paystack_secret_key),
    updated_at = NOW();

-- Enable RLS and create policies for settings access
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
DROP POLICY IF EXISTS "Settings are editable by admins" ON settings;
DROP POLICY IF EXISTS "Settings can be inserted" ON settings;

-- Create new policies
CREATE POLICY "Settings are viewable by everyone" ON settings 
    FOR SELECT USING (true);

CREATE POLICY "Settings are editable by admins" ON settings 
    FOR UPDATE USING (true);

CREATE POLICY "Settings can be inserted" ON settings 
    FOR INSERT WITH CHECK (true);

-- Create update trigger for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS settings_updated_at ON settings;
CREATE TRIGGER settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_settings_updated_at();

-- Verify the setup
SELECT 
    'Settings table is ready!' as status,
    id,
    store_name,
    contact_email,
    exchange_rate,
    paystack_public_key IS NOT NULL as has_paystack_key
FROM settings 
WHERE id = 1;

-- Show all available columns
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'settings' 
ORDER BY ordinal_position; 