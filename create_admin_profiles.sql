-- Create admin profiles for existing auth users
-- Run this in your Supabase SQL Editor to fix the authentication issue

-- Create profile for admin@tailoredhands.com
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  'fee9fded-211e-43e8-88b6-a37edf895199', 
  'admin@tailoredhands.com', 
  'Admin User', 
  'admin', 
  NOW(), 
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- Create profile for sales@tailoredhands.africa  
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  '31e82f81-5a38-4656-9b5e-74b0fa3dfe58', 
  'sales@tailoredhands.africa', 
  'Sales Admin', 
  'admin', 
  NOW(), 
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- Verify the profiles were created
SELECT id, email, full_name, role, created_at FROM profiles WHERE role = 'admin'; 