-- SIMPLE ORDER CREATION FIX
-- Add missing INSERT policies for orders and order_items

-- Allow users to create orders
CREATE POLICY "Allow order creation" ON orders
    FOR INSERT WITH CHECK (true);

-- Allow users to create order items  
CREATE POLICY "Allow order item creation" ON order_items
    FOR INSERT WITH CHECK (true);

-- Allow order updates (for payment status)
CREATE POLICY "Allow order updates" ON orders
    FOR UPDATE USING (true);

-- Allow order item updates
CREATE POLICY "Allow order item updates" ON order_items
    FOR UPDATE USING (true);
