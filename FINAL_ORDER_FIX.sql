-- FINAL ORDER CREATION FIX
-- This fixes the NOT NULL constraints that are preventing order creation

-- Make session_id nullable (it might be null for guest users)
ALTER TABLE orders ALTER COLUMN session_id DROP NOT NULL;

-- Make total_amount nullable (it might be calculated as 0)
ALTER TABLE orders ALTER COLUMN total_amount DROP NOT NULL;

-- Add default values for required fields
ALTER TABLE orders ALTER COLUMN session_id SET DEFAULT '';
ALTER TABLE orders ALTER COLUMN total_amount SET DEFAULT 0;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
AND column_name IN ('session_id', 'total_amount')
ORDER BY column_name;
