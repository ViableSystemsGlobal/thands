-- CHECK ADMIN USER - Verify admin user setup and data access
-- Run this in Supabase SQL Editor while logged in as admin

-- 1. Check current user authentication
SELECT 
    'Current User Info' as info,
    auth.uid() as user_id,
    auth.email() as user_email;

-- 2. Check if admin user exists in profiles table
SELECT 
    'Admin Profile Check' as info,
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at
FROM profiles p
WHERE p.email = auth.email()
   OR p.id = auth.uid();

-- 3. Check if admin role exists in profiles
SELECT 
    'All Admin Users' as info,
    p.id,
    p.email,
    p.full_name,
    p.role
FROM profiles p
WHERE p.role = 'admin';

-- 4. Test access to messages table
SELECT 
    'Messages Access Test' as info,
    COUNT(*) as message_count,
    MAX(created_at) as latest_message
FROM messages;

-- 5. Test access to consultations table  
SELECT 
    'Consultations Access Test' as info,
    COUNT(*) as consultation_count,
    MAX(created_at) as latest_consultation
FROM consultations;

-- 6. Test access to customers table
SELECT 
    'Customers Access Test' as info,
    COUNT(*) as customer_count,
    MAX(created_at) as latest_customer
FROM customers;

-- 7. Test access to orders table
SELECT 
    'Orders Access Test' as info,
    COUNT(*) as order_count,
    MAX(created_at) as latest_order
FROM orders;

-- 8. If admin user doesn't exist, create it
-- Replace 'YOUR_ADMIN_EMAIL' with your actual admin email
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    auth.uid(),
    auth.email(),
    'Admin User',
    'admin',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid()
)
AND auth.uid() IS NOT NULL;

-- 9. Update existing user to admin if needed
-- Replace 'admin@tailoredhands.com' with your actual admin email
UPDATE profiles 
SET role = 'admin', updated_at = NOW()
WHERE email = 'admin@tailoredhands.com'
   OR email LIKE '%@tailoredhands.%';

-- 10. Final verification
SELECT 
    'Final Verification' as info,
    'Admin user exists: ' || CASE WHEN EXISTS(SELECT 1 FROM profiles WHERE role = 'admin') THEN 'YES' ELSE 'NO' END as admin_exists,
    'Current user is admin: ' || CASE WHEN EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN 'YES' ELSE 'NO' END as current_user_admin; 