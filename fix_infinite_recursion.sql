-- CRITICAL FIX: Fix infinite recursion in profiles table RLS policies
-- Run this in your Supabase SQL Editor immediately to fix login and products loading

-- Step 1: Drop ALL existing policies on profiles table that might cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Admin emails can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin emails can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin emails can delete profiles" ON profiles;

-- Step 2: Temporarily disable RLS to clear any stuck queries
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create new NON-RECURSIVE policies using only auth.email()
-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow profile creation for new users
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow admin emails to view all profiles (NO RECURSION)
CREATE POLICY "Admin emails can view all profiles" ON profiles
  FOR SELECT 
  USING (
    auth.email() = 'admin@tailoredhands.com' OR
    auth.email() LIKE '%@tailoredhands.%'
  );

-- Allow admin emails to update all profiles (NO RECURSION)
CREATE POLICY "Admin emails can update all profiles" ON profiles
  FOR UPDATE 
  USING (
    auth.email() = 'admin@tailoredhands.com' OR
    auth.email() LIKE '%@tailoredhands.%'
  );

-- Allow admin emails to delete profiles if needed
CREATE POLICY "Admin emails can delete profiles" ON profiles
  FOR DELETE 
  USING (
    auth.email() = 'admin@tailoredhands.com' OR
    auth.email() LIKE '%@tailoredhands.%'
  );

-- Step 5: Fix products table access (if RLS is enabled)
-- Ensure products can be viewed by everyone
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'products' AND schemaname = 'public') THEN
    -- Drop problematic product policies
    DROP POLICY IF EXISTS "Public can view published products" ON products;
    DROP POLICY IF EXISTS "Admin can view all products" ON products;
    DROP POLICY IF EXISTS "Public read access" ON products;
    DROP POLICY IF EXISTS "Public can view products" ON products;
    
    -- Create simple public read policy for products
    CREATE POLICY "Public can view products" ON products
      FOR SELECT 
      USING (true);
  END IF;
END $$;

-- Step 6: Fix product_sizes table access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'product_sizes' AND schemaname = 'public') THEN
    -- Drop problematic product sizes policies
    DROP POLICY IF EXISTS "Public can view product sizes" ON product_sizes;
    DROP POLICY IF EXISTS "Admin can modify product sizes" ON product_sizes;
    
    -- Create simple public read policy for product sizes
    CREATE POLICY "Public can view product sizes" ON product_sizes
      FOR SELECT 
      USING (true);
  END IF;
END $$;

-- Step 7: Fix gift voucher types access
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'gift_voucher_types' AND schemaname = 'public') THEN
    DROP POLICY IF EXISTS "Public can view active voucher types" ON gift_voucher_types;
    DROP POLICY IF EXISTS "Public can view gift voucher types" ON gift_voucher_types;
    
    CREATE POLICY "Public can view gift voucher types" ON gift_voucher_types
      FOR SELECT 
      USING (true);
  END IF;
END $$;

-- Step 8: Update the user creation trigger to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with proper role detection based on email
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email = 'admin@tailoredhands.com' OR NEW.email LIKE '%@tailoredhands.%' THEN 'admin'
      ELSE 'customer'
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Create admin profile if it doesn't exist
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  'Admin User',
  'admin',
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'admin@tailoredhands.com'
  AND NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = au.id
  )
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();

-- Verification queries
SELECT 'Profiles table check' as test, count(*) as count FROM profiles;
SELECT 'Products table check' as test, count(*) as count FROM products;
SELECT 'Settings table check' as test, count(*) as count FROM settings; 