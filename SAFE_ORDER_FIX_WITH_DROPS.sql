-- SAFE ORDER FIX WITH DROPS
-- This version drops existing policies first to avoid conflicts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow order creation" ON orders;
DROP POLICY IF EXISTS "Allow order item creation" ON order_items;
DROP POLICY IF EXISTS "Allow order updates" ON orders;
DROP POLICY IF EXISTS "Allow order item updates" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can insert orders" ON orders;
DROP POLICY IF EXISTS "Admins can insert order items" ON order_items;

-- Add missing columns that the code is trying to insert
ALTER TABLE orders ADD COLUMN IF NOT EXISTS session_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50) DEFAULT 'paystack';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_first_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_last_name VARCHAR(100);

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON orders(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_orders_payment_completed_at ON orders(payment_completed_at);

-- Create new policies
CREATE POLICY "Allow order creation" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow order item creation" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow order updates" ON orders FOR UPDATE USING (true);

-- Verify the fix
SELECT 'Orders table columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
AND column_name IN ('session_id', 'currency', 'total_amount', 'coupon_id', 'coupon_discount_amount', 'payment_gateway', 'payment_completed_at', 'shipping_first_name', 'shipping_last_name')
ORDER BY column_name;

SELECT 'Orders policies:' as info;
SELECT policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;
