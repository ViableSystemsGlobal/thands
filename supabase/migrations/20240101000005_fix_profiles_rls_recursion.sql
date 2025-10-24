-- Fix infinite recursion in profiles table RLS policies
-- This happens when policies reference the profiles table itself to check roles

-- Drop ALL existing policies on profiles table to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow profile creation" ON profiles;
DROP POLICY IF EXISTS "Admin emails can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin emails can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;

-- Disable RLS temporarily to clear any stuck queries
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies that DON'T reference the profiles table itself
-- This prevents infinite recursion by using only auth.email() for admin checks

-- Allow users to view their own profile (safe)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update their own profile (safe)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow profile creation for new users (safe)
CREATE POLICY "Allow profile creation" ON profiles
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Allow admin emails to view all profiles (NO RECURSION - uses auth.email() only)
CREATE POLICY "Admin emails can view all profiles" ON profiles
  FOR SELECT 
  USING (
    auth.email() = 'admin@tailoredhands.com' OR
    auth.email() LIKE '%@tailoredhands.%'
  );

-- Allow admin emails to update all profiles (NO RECURSION - uses auth.email() only)
CREATE POLICY "Admin emails can update all profiles" ON profiles
  FOR UPDATE 
  USING (
    auth.email() = 'admin@tailoredhands.com' OR
    auth.email() LIKE '%@tailoredhands.%'
  );

-- Allow admin emails to delete profiles if needed (NO RECURSION)
CREATE POLICY "Admin emails can delete profiles" ON profiles
  FOR DELETE 
  USING (
    auth.email() = 'admin@tailoredhands.com' OR
    auth.email() LIKE '%@tailoredhands.%'
  );

-- Update the trigger function to be more robust
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

-- Drop and recreate the trigger to ensure it's using the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 