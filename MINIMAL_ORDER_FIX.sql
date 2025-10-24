-- MINIMAL ORDER CREATION FIX
-- Just the essential policies to allow order creation

-- Allow order creation
CREATE POLICY "Allow order creation" ON orders FOR INSERT WITH CHECK (true);

-- Allow order item creation  
CREATE POLICY "Allow order item creation" ON order_items FOR INSERT WITH CHECK (true);

-- Allow order updates (for payment status)
CREATE POLICY "Allow order updates" ON orders FOR UPDATE USING (true);
