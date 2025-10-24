-- Ensure settings table has proper data and access for gift voucher payments

-- Handle different possible settings table structures
DO $$ 
DECLARE
    has_key_column BOOLEAN;
    has_id_column BOOLEAN;
BEGIN
    -- Check if settings table has key column (key-value structure)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'key'
    ) INTO has_key_column;
    
    -- Check if settings table has id column (single row structure)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'settings' AND column_name = 'id'
    ) INTO has_id_column;
    
    RAISE NOTICE 'Settings table structure - has_key_column: %, has_id_column: %', has_key_column, has_id_column;
    
    -- Handle key-value structure
    IF has_key_column THEN
        -- Add paystack public key
        INSERT INTO settings (key, value) 
        VALUES ('paystack_public_key', 'pk_test_50427dbd3ccc34606d04a1d775d63818c74528ea')
        ON CONFLICT (key) 
        DO UPDATE SET value = EXCLUDED.value;
        
        -- Add exchange rate
        INSERT INTO settings (key, value) 
        VALUES ('exchange_rate', '16.0')
        ON CONFLICT (key) 
        DO UPDATE SET value = EXCLUDED.value;
        
        RAISE NOTICE 'Configured key-value settings table';
        
    -- Handle single row structure  
    ELSIF has_id_column THEN
        -- Add columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'settings' AND column_name = 'paystack_public_key') THEN
            ALTER TABLE settings ADD COLUMN paystack_public_key VARCHAR(255);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'settings' AND column_name = 'exchange_rate') THEN
            ALTER TABLE settings ADD COLUMN exchange_rate DECIMAL(10,4) DEFAULT 16.0;
        END IF;
        
        -- Insert or update single row
        INSERT INTO settings (id, paystack_public_key, exchange_rate) 
        VALUES (1, 'pk_test_50427dbd3ccc34606d04a1d775d63818c74528ea', 16.0)
        ON CONFLICT (id) 
        DO UPDATE SET 
            paystack_public_key = EXCLUDED.paystack_public_key,
            exchange_rate = EXCLUDED.exchange_rate;
            
        RAISE NOTICE 'Configured single-row settings table';
    ELSE
        RAISE NOTICE 'Unknown settings table structure';
    END IF;
END $$;

-- Ensure RLS is disabled (should already be done but just in case)
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Grant explicit access to anon role for public key access
GRANT SELECT ON settings TO anon;
GRANT SELECT ON settings TO authenticated;

-- Confirm the data exists
DO $$ 
BEGIN 
    RAISE NOTICE 'Settings table configured for gift voucher payments';
    RAISE NOTICE 'Paystack public key exists: %', (SELECT paystack_public_key IS NOT NULL FROM settings WHERE id = 1);
END $$; 