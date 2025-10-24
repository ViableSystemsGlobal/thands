-- FIX ORDERS TABLE SCHEMA
-- Add missing columns that the code is trying to insert

-- Add session_id column for tracking guest sessions
ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);

-- Add currency column 
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';

-- Add total_amount column (in addition to total_amount_ghs)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);

-- Add coupon tracking columns
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount_amount DECIMAL(10,2) DEFAULT 0;

-- Add payment gateway and completion tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50) DEFAULT 'paystack';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

-- Add shipping name fields (first_name, last_name)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_first_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_last_name VARCHAR(100);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON orders(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_orders_payment_completed_at ON orders(payment_completed_at);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;
