-- FIX ORDER CREATION POLICIES
-- This script adds the missing INSERT policies for orders and order_items tables
-- The current policies only allow SELECT, which prevents order creation

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can insert orders" ON orders;
DROP POLICY IF EXISTS "Admins can insert order items" ON order_items;

-- Create INSERT policies for orders table
-- Allow users to create orders for themselves (by email or user_id)
CREATE POLICY "Users can insert their own orders" ON orders
    FOR INSERT WITH CHECK (
        -- Allow if user is authenticated and creating order for themselves
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR 
        -- Allow if shipping_email matches authenticated user's email
        (auth.email() IS NOT NULL AND shipping_email = auth.email())
        OR
        -- Allow if user is admin
        (auth.email() LIKE '%@tailoredhands.%' OR auth.email() = 'admin@tailoredhands.com')
    );

-- Create INSERT policies for order_items table
-- Allow users to create order items for their own orders
CREATE POLICY "Users can insert their own order items" ON order_items
    FOR INSERT WITH CHECK (
        -- Allow if the order belongs to the authenticated user
        order_id IN (
            SELECT id FROM orders 
            WHERE user_id = auth.uid() 
            OR shipping_email = auth.email()
            OR auth.email() LIKE '%@tailoredhands.%' 
            OR auth.email() = 'admin@tailoredhands.com'
        )
    );

-- Create admin policies for orders
CREATE POLICY "Admins can insert orders" ON orders
    FOR INSERT WITH CHECK (
        auth.email() LIKE '%@tailoredhands.%' OR auth.email() = 'admin@tailoredhands.com'
    );

-- Create admin policies for order_items
CREATE POLICY "Admins can insert order items" ON order_items
    FOR INSERT WITH CHECK (
        auth.email() LIKE '%@tailoredhands.%' OR auth.email() = 'admin@tailoredhands.com'
    );

-- Also add UPDATE policies for orders (for payment status updates)
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

CREATE POLICY "Users can update their own orders" ON orders
    FOR UPDATE USING (
        user_id = auth.uid() OR shipping_email = auth.email()
    );

CREATE POLICY "Admins can update all orders" ON orders
    FOR UPDATE USING (
        auth.email() LIKE '%@tailoredhands.%' OR auth.email() = 'admin@tailoredhands.com'
    );

-- Add UPDATE policies for order_items
DROP POLICY IF EXISTS "Users can update their own order items" ON order_items;
DROP POLICY IF EXISTS "Admins can update all order items" ON order_items;

CREATE POLICY "Users can update their own order items" ON order_items
    FOR UPDATE USING (
        order_id IN (
            SELECT id FROM orders 
            WHERE user_id = auth.uid() OR shipping_email = auth.email()
        )
    );

CREATE POLICY "Admins can update all order items" ON order_items
    FOR UPDATE USING (
        auth.email() LIKE '%@tailoredhands.%' OR auth.email() = 'admin@tailoredhands.com'
    );

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('orders', 'order_items')
ORDER BY tablename, policyname;
