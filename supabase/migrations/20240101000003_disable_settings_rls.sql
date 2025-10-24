-- Completely disable RLS on settings table to avoid circular dependencies
-- This is the simplest solution for now

-- Drop all existing policies
DROP POLICY IF EXISTS "Public can view basic settings" ON settings;
DROP POLICY IF EXISTS "Admin emails can view settings" ON settings;
DROP POLICY IF EXISTS "Admin emails can update settings" ON settings;
DROP POLICY IF EXISTS "Admin emails can insert settings" ON settings;

-- Disable RLS completely for settings table
ALTER TABLE settings DISABLE ROW LEVEL SECURITY; 