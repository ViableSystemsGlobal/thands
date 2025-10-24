-- Fix admin profile ID mismatches
-- Run this AFTER running check_admin_profile_mismatch.sql to see the issues
-- This script will update profiles to use the correct auth.user IDs

-- Step 1: Update admin@tailoredhands.com profile ID if there's a mismatch
UPDATE profiles 
SET id = (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email = 'admin@tailoredhands.com'
)
WHERE email = 'admin@tailoredhands.com'
  AND id != (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email = 'admin@tailoredhands.com'
  );

-- Step 2: Update sales@tailoredhands.africa profile ID if there's a mismatch  
UPDATE profiles 
SET id = (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email = 'sales@tailoredhands.africa'
)
WHERE email = 'sales@tailoredhands.africa'
  AND id != (
    SELECT au.id 
    FROM auth.users au 
    WHERE au.email = 'sales@tailoredhands.africa'
  );

-- Step 3: Insert missing profiles if they don't exist at all
INSERT INTO profiles (id, email, role, full_name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'admin' as role,
  COALESCE(au.raw_user_meta_data->>'full_name', SPLIT_PART(au.email, '@', 1)) as full_name,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.email IN ('admin@tailoredhands.com', 'sales@tailoredhands.africa')
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
  );

-- Step 4: Clean up any orphaned profiles (profiles with IDs that don't exist in auth.users)
DELETE FROM profiles 
WHERE email IN ('admin@tailoredhands.com', 'sales@tailoredhands.africa')
  AND id NOT IN (
    SELECT id FROM auth.users WHERE email IN ('admin@tailoredhands.com', 'sales@tailoredhands.africa')
  );

-- Step 5: Verify the fix worked
SELECT 
  'Final Check' as status,
  au.email,
  au.id as auth_user_id,
  p.id as profile_id,
  p.role,
  CASE WHEN au.id = p.id THEN 'FIXED' ELSE 'STILL_BROKEN' END as result
FROM auth.users au
JOIN profiles p ON au.id = p.id
WHERE au.email IN ('admin@tailoredhands.com', 'sales@tailoredhands.africa'); 