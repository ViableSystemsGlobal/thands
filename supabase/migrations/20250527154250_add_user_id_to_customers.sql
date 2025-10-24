-- Add missing user_id column to customers table
-- This column links customer records to auth.users for registered users
-- NULL user_id indicates a guest customer

-- Add the user_id column if it doesn't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add the missing address fields if they don't exist
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state VARCHAR(100);  
ALTER TABLE customers ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_email_user_id ON customers(email, user_id);

-- Verify the column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'user_id'
    ) THEN
        RAISE NOTICE 'user_id column successfully added to customers table';
    ELSE
        RAISE NOTICE 'user_id column was not added to customers table';
    END IF;
END $$;
