-- Check for admin profile ID mismatches
-- Run this in Supabase SQL Editor to diagnose profile creation conflicts

-- 1. Check what users exist in auth.users
SELECT 
  'auth.users' as table_name,
  id,
  email,
  created_at,
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE email IN ('admin@tailoredhands.com', 'sales@tailoredhands.africa')
ORDER BY email;

-- 2. Check what profiles exist in profiles table
SELECT 
  'profiles' as table_name,
  id,
  email,
  role,
  created_at
FROM profiles 
WHERE email IN ('admin@tailoredhands.com', 'sales@tailoredhands.africa')
ORDER BY email;

-- 3. Check for ID mismatches between auth.users and profiles
SELECT 
  'ID Mismatch Check' as check_type,
  au.email,
  au.id as auth_user_id,
  p.id as profile_id,
  CASE 
    WHEN au.id = p.id THEN 'MATCH'
    WHEN p.id IS NULL THEN 'PROFILE_MISSING'
    ELSE 'ID_MISMATCH'
  END as status
FROM auth.users au
LEFT JOIN profiles p ON au.email = p.email
WHERE au.email IN ('admin@tailoredhands.com', 'sales@tailoredhands.africa');

-- 4. Check if profiles exist with correct auth.user IDs
SELECT 
  'Profile by Auth ID' as check_type,
  au.email,
  au.id as auth_user_id,
  p.id as profile_id,
  p.role
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email IN ('admin@tailoredhands.com', 'sales@tailoredhands.africa');

-- 5. If there are orphaned profiles, show them
SELECT 
  'Orphaned Profiles' as check_type,
  p.*
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.email IN ('admin@tailoredhands.com', 'sales@tailoredhands.africa')
  AND au.id IS NULL; 