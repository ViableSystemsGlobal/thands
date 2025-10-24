-- Fix settings table to ensure paystack_public_key column exists
-- Handle both possible table structures

DO $$ 
DECLARE
    has_paystack_column BOOLEAN;
    table_exists BOOLEAN;
BEGIN
    -- Check if settings table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'settings'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Settings table does not exist, creating it...';
        
        -- Create settings table with single-row structure
        CREATE TABLE settings (
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
        
        RAISE NOTICE 'Created settings table with paystack columns';
    ELSE
        -- Check if paystack_public_key column exists
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'settings' AND column_name = 'paystack_public_key'
        ) INTO has_paystack_column;
        
        IF NOT has_paystack_column THEN
            RAISE NOTICE 'Adding missing paystack columns to settings table...';
            
            -- Add missing columns
            ALTER TABLE settings ADD COLUMN IF NOT EXISTS paystack_public_key VARCHAR(255);
            ALTER TABLE settings ADD COLUMN IF NOT EXISTS paystack_secret_key VARCHAR(255);
            
            RAISE NOTICE 'Added paystack columns to existing settings table';
        ELSE
            RAISE NOTICE 'Settings table already has paystack columns';
        END IF;
    END IF;
    
    -- Ensure the table has at least one row with the Paystack keys
    INSERT INTO settings (
        id, 
        store_name,
        paystack_public_key, 
        paystack_secret_key,
        exchange_rate
    ) 
    VALUES (
        1, 
        'Tailored Hands Store',
        'pk_test_50427dbd3ccc34606d04a1d775d63818c74528ea',
        'sk_test_27fee748f15ac3869348b9e491a9c48a5f2ee0d2',
        16.0
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
        paystack_public_key = COALESCE(settings.paystack_public_key, EXCLUDED.paystack_public_key),
        paystack_secret_key = COALESCE(settings.paystack_secret_key, EXCLUDED.paystack_secret_key),
        exchange_rate = COALESCE(settings.exchange_rate, EXCLUDED.exchange_rate);
    
    RAISE NOTICE 'Ensured settings row exists with Paystack configuration';
END $$;

-- Disable RLS to prevent access issues
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Grant access to all roles
GRANT SELECT ON settings TO anon;
GRANT SELECT ON settings TO authenticated;
GRANT ALL ON settings TO service_role;

-- Verify the setup
DO $$ 
DECLARE
    paystack_key VARCHAR(255);
BEGIN 
    SELECT paystack_public_key INTO paystack_key FROM settings WHERE id = 1;
    
    IF paystack_key IS NOT NULL THEN
        RAISE NOTICE 'SUCCESS: Paystack public key is configured: %', LEFT(paystack_key, 15) || '...';
    ELSE
        RAISE NOTICE 'WARNING: Paystack public key is still NULL';
    END IF;
END $$; 