-- Allow public read access to specific settings fields
-- This is needed for currency conversion throughout the app

-- Fix settings table access for public exchange rate queries
-- Drop existing restrictive policies and create new ones

DROP POLICY IF EXISTS "Admin emails can view settings" ON settings;
DROP POLICY IF EXISTS "Admin emails can update settings" ON settings;
DROP POLICY IF EXISTS "Admin emails can insert settings" ON settings;

-- Allow public read access to non-sensitive settings fields
CREATE POLICY "Public can view basic settings" ON settings
  FOR SELECT 
  USING (true);

-- Only admin emails can modify settings
CREATE POLICY "Admin emails can update settings" ON settings
  FOR UPDATE 
  USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

CREATE POLICY "Admin emails can insert settings" ON settings
  FOR INSERT 
  WITH CHECK (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  ); 