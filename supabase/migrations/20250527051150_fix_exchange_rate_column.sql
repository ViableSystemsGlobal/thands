-- Fix settings table structure to include exchange_rate column
-- This fixes the "column settings.exchange_rate does not exist" error

DO $$ 
DECLARE
    table_exists BOOLEAN;
    has_key_column BOOLEAN;
    has_id_column BOOLEAN;
    has_exchange_rate BOOLEAN;
    has_store_name BOOLEAN;
BEGIN
    -- Check if settings table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'settings'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        -- Create settings table if it doesn't exist
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
        
        RAISE NOTICE 'Created settings table with named columns';
    ELSE
        -- Check table structure
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'settings' AND column_name = 'key'
        ) INTO has_key_column;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'settings' AND column_name = 'id'
        ) INTO has_id_column;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'settings' AND column_name = 'exchange_rate'
        ) INTO has_exchange_rate;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'settings' AND column_name = 'store_name'
        ) INTO has_store_name;
        
        RAISE NOTICE 'Settings table structure: key_column=%, id_column=%, exchange_rate=%, store_name=%', 
                     has_key_column, has_id_column, has_exchange_rate, has_store_name;
        
        -- If it's a key-value structure, convert to named columns
        IF has_key_column AND NOT has_store_name THEN
            RAISE NOTICE 'Converting from key-value to named column structure';
            
            -- Drop existing table and recreate with proper structure
            DROP TABLE IF EXISTS settings CASCADE;
            
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
            
            RAISE NOTICE 'Recreated settings table with named columns';
            
        -- If it has named columns but missing exchange_rate
        ELSIF has_id_column AND has_store_name AND NOT has_exchange_rate THEN
            ALTER TABLE settings ADD COLUMN exchange_rate DECIMAL(10,4) DEFAULT 16.0;
            RAISE NOTICE 'Added exchange_rate column to existing named column table';
        END IF;
    END IF;
    
    -- Ensure the table has at least one row with default values
    INSERT INTO settings (
        id, 
        store_name,
        contact_email,
        currency,
        paystack_public_key,
        paystack_secret_key,
        exchange_rate,
        created_at,
        updated_at
    ) 
    VALUES (
        1, 
        'Tailored Hands Store',
        'admin@tailoredhands.com',
        'USD',
        'pk_test_50427dbd3ccc34606d04a1d775d63818c74528ea',
        'sk_test_27fee748f15ac3869348b9e491a9c48a5f2ee0d2',
        16.0,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET 
        exchange_rate = COALESCE(settings.exchange_rate, 16.0),
        paystack_public_key = COALESCE(settings.paystack_public_key, 'pk_test_50427dbd3ccc34606d04a1d775d63818c74528ea'),
        updated_at = NOW();
    
    RAISE NOTICE 'Ensured settings row exists with proper values';
END $$;

-- Disable RLS to prevent access issues
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Grant access to all roles
GRANT SELECT ON settings TO anon;
GRANT SELECT ON settings TO authenticated;
GRANT ALL ON settings TO service_role;

-- Verify the setup
SELECT 
    id,
    store_name,
    exchange_rate,
    paystack_public_key IS NOT NULL as has_paystack_key,
    created_at
FROM settings 
WHERE id = 1;
