-- DIAGNOSE ORDER CREATION ISSUE
-- This script will help identify what's preventing orders from being created

-- 1. Check if the required columns exist
SELECT 'Checking orders table columns:' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
AND column_name IN (
    'session_id', 'currency', 'total_amount', 'coupon_id', 
    'coupon_discount_amount', 'payment_gateway', 'payment_completed_at',
    'shipping_first_name', 'shipping_last_name', 'notes'
)
ORDER BY column_name;

-- 2. Check RLS policies on orders table
SELECT 'Checking orders table policies:' as step;
SELECT policyname, cmd, permissive, qual, with_check
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- 3. Check RLS policies on order_items table
SELECT 'Checking order_items table policies:' as step;
SELECT policyname, cmd, permissive, qual, with_check
FROM pg_policies 
WHERE tablename = 'order_items'
ORDER BY policyname;

-- 4. Check if RLS is enabled
SELECT 'Checking RLS status:' as step;
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('orders', 'order_items')
AND schemaname = 'public';

-- 5. Test a simple insert to see what error we get
SELECT 'Testing order insert permissions:' as step;
-- This will show us the exact error if any
