-- Check products table access for admin users
-- Run this in your Supabase SQL Editor to debug products loading issues

-- 1. Check if products table exists and has data
SELECT 'Products table check' as check_type, count(*) as count FROM products;

-- 2. Check if product_sizes table exists and has data  
SELECT 'Product sizes table check' as check_type, count(*) as count FROM product_sizes;

-- 3. Check RLS status on products table
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('products', 'product_sizes');

-- 4. Check RLS policies on products table
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
WHERE tablename IN ('products', 'product_sizes');

-- 5. Test basic products query (FIXED - removed price column)
SELECT 
  id, 
  name, 
  category, 
  image_url,
  is_featured,
  created_at 
FROM products 
ORDER BY created_at DESC 
LIMIT 5;

-- 6. Test products with sizes query
SELECT 
  p.id,
  p.name,
  p.category,
  ps.size,
  ps.price
FROM products p
LEFT JOIN product_sizes ps ON p.id = ps.product_id
WHERE ps.size = 'M'
LIMIT 5;

-- 7. Check current user role
SELECT 
  auth.uid() as current_user_id,
  p.email,
  p.role
FROM profiles p 
WHERE p.id = auth.uid();

-- 8. Test if product_sizes table has any data
SELECT 
  product_id,
  size,
  price
FROM product_sizes 
LIMIT 10;

-- 9. NEW: Test exact query that admin panel uses
SELECT 
  p.id, 
  p.name, 
  p.category, 
  p.image_url, 
  p.is_featured, 
  p.created_at
FROM products p
ORDER BY p.created_at DESC;

-- 10. NEW: Test the exact price query used by admin panel
SELECT 
  ps.price
FROM product_sizes ps
WHERE ps.product_id = 1 AND ps.size = 'M';

-- 11. NEW: Test if RLS is blocking admin access
SELECT 
  'Can admin access products?' as test,
  CASE 
    WHEN EXISTS(SELECT 1 FROM products LIMIT 1) THEN 'YES'
    ELSE 'NO'
  END as result;

-- 12. NEW: Test full product query with join (like the admin panel does)
SELECT 
  p.*, 
  ps.size, 
  ps.price 
FROM products p 
LEFT JOIN product_sizes ps ON p.id = ps.product_id 
WHERE ps.size = 'M' OR ps.size IS NULL
LIMIT 5; 