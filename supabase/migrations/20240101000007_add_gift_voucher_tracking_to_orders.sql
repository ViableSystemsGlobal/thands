-- Add gift voucher tracking columns to orders table
-- First, check if gift_vouchers table exists and get its id column type
DO $$ 
DECLARE
    voucher_id_type TEXT;
BEGIN
    -- Get the data type of the id column in gift_vouchers table
    SELECT data_type INTO voucher_id_type
    FROM information_schema.columns 
    WHERE table_name = 'gift_vouchers' 
    AND column_name = 'id' 
    AND table_schema = 'public';
    
    -- Only proceed if gift_vouchers table exists
    IF voucher_id_type IS NOT NULL THEN
        RAISE NOTICE 'Gift vouchers table found with id type: %', voucher_id_type;
        
        -- Add gift_voucher_code column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'orders' AND column_name = 'gift_voucher_code') THEN
            ALTER TABLE orders ADD COLUMN gift_voucher_code VARCHAR(20);
            RAISE NOTICE 'Added gift_voucher_code column';
        END IF;
        
        -- Add gift_voucher_id column with the correct type
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'orders' AND column_name = 'gift_voucher_id') THEN
            IF voucher_id_type = 'uuid' THEN
                ALTER TABLE orders ADD COLUMN gift_voucher_id UUID REFERENCES gift_vouchers(id);
                RAISE NOTICE 'Added gift_voucher_id column with UUID type';
            ELSIF voucher_id_type = 'integer' THEN
                ALTER TABLE orders ADD COLUMN gift_voucher_id INTEGER REFERENCES gift_vouchers(id);
                RAISE NOTICE 'Added gift_voucher_id column with INTEGER type';
            ELSE
                RAISE NOTICE 'Unsupported id type in gift_vouchers table: %', voucher_id_type;
            END IF;
        END IF;
        
        -- Add gift_voucher_redemption_amount column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'orders' AND column_name = 'gift_voucher_redemption_amount') THEN
            ALTER TABLE orders ADD COLUMN gift_voucher_redemption_amount DECIMAL(10,2);
            RAISE NOTICE 'Added gift_voucher_redemption_amount column';
        END IF;
        
    ELSE
        RAISE NOTICE 'Gift vouchers table not found, skipping migration';
    END IF;
END $$;

-- Create indexes for efficient lookups (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'gift_voucher_code') THEN
        CREATE INDEX IF NOT EXISTS idx_orders_gift_voucher_code ON orders(gift_voucher_code);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'gift_voucher_id') THEN
        CREATE INDEX IF NOT EXISTS idx_orders_gift_voucher_id ON orders(gift_voucher_id);
    END IF;
END $$;

-- Add comments explaining the fields (only if columns exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'gift_voucher_code') THEN
        COMMENT ON COLUMN orders.gift_voucher_code IS 'Gift voucher code used in this order';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'gift_voucher_id') THEN
        COMMENT ON COLUMN orders.gift_voucher_id IS 'Reference to the gift voucher used in this order';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'gift_voucher_redemption_amount') THEN
        COMMENT ON COLUMN orders.gift_voucher_redemption_amount IS 'Amount redeemed from the gift voucher for this order (in USD)';
    END IF;
END $$; 