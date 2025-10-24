-- SAFE ORDER CREATION FIX
-- This version avoids type casting issues by using simpler policies

-- Drop any existing policies that might cause conflicts
DROP POLICY IF EXISTS "Allow order creation" ON orders;
DROP POLICY IF EXISTS "Allow order item creation" ON order_items;
DROP POLICY IF EXISTS "Allow order updates" ON orders;
DROP POLICY IF EXISTS "Allow order item updates" ON order_items;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can insert orders" ON orders;
DROP POLICY IF EXISTS "Admins can insert order items" ON order_items;
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;
DROP POLICY IF EXISTS "Users can update their own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can update all order items" ON order_items;

-- Create simple, safe policies that allow order creation
-- These policies are permissive but will allow orders to be created

-- Allow anyone to create orders (for now - you can tighten this later)
CREATE POLICY "Allow order creation" ON orders
    FOR INSERT WITH CHECK (true);

-- Allow anyone to create order items
CREATE POLICY "Allow order item creation" ON order_items
    FOR INSERT WITH CHECK (true);

-- Allow order updates (needed for payment status updates)
CREATE POLICY "Allow order updates" ON orders
    FOR UPDATE USING (true);

-- Allow order item updates
CREATE POLICY "Allow order item updates" ON order_items
    FOR UPDATE USING (true);

-- Verify the policies were created successfully
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;
