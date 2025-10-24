-- Ensure products and related tables have proper access
-- Fix any potential RLS issues that could block product loading

-- Check if products table has RLS enabled and proper policies
-- If RLS is causing issues, we can temporarily disable it or fix policies

-- For products table - ensure public read access
DO $$
BEGIN
  -- Check if products table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'products') THEN
    -- Drop any problematic policies
    DROP POLICY IF EXISTS "Public can view published products" ON products;
    DROP POLICY IF EXISTS "Admin can view all products" ON products;
    DROP POLICY IF EXISTS "Public read access" ON products;
    
    -- Create simple public read policy
    CREATE POLICY "Public can view products" ON products
      FOR SELECT 
      USING (true);
      
    -- Admin policies for modification (no recursion)
    CREATE POLICY "Admin emails can modify products" ON products
      FOR ALL 
      USING (
        auth.email() = 'admin@tailoredhands.com' OR
        auth.email() LIKE '%@tailoredhands.%'
      );
  END IF;
END $$;

-- For product_sizes table - ensure public read access
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_sizes') THEN
    -- Drop any problematic policies
    DROP POLICY IF EXISTS "Public can view product sizes" ON product_sizes;
    DROP POLICY IF EXISTS "Admin can modify product sizes" ON product_sizes;
    
    -- Create simple public read policy
    CREATE POLICY "Public can view product sizes" ON product_sizes
      FOR SELECT 
      USING (true);
      
    -- Admin policies for modification
    CREATE POLICY "Admin emails can modify product sizes" ON product_sizes
      FOR ALL 
      USING (
        auth.email() = 'admin@tailoredhands.com' OR
        auth.email() LIKE '%@tailoredhands.%'
      );
  END IF;
END $$;

-- For categories table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'categories') THEN
    DROP POLICY IF EXISTS "Public can view categories" ON categories;
    
    CREATE POLICY "Public can view categories" ON categories
      FOR SELECT 
      USING (true);
      
    CREATE POLICY "Admin emails can modify categories" ON categories
      FOR ALL 
      USING (
        auth.email() = 'admin@tailoredhands.com' OR
        auth.email() LIKE '%@tailoredhands.%'
      );
  END IF;
END $$;

-- For gift_voucher_types table - ensure public read access
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'gift_voucher_types') THEN
    DROP POLICY IF EXISTS "Public can view active voucher types" ON gift_voucher_types;
    DROP POLICY IF EXISTS "Admin can modify voucher types" ON gift_voucher_types;
    
    CREATE POLICY "Public can view gift voucher types" ON gift_voucher_types
      FOR SELECT 
      USING (true);
      
    CREATE POLICY "Admin emails can modify gift voucher types" ON gift_voucher_types
      FOR ALL 
      USING (
        auth.email() = 'admin@tailoredhands.com' OR
        auth.email() LIKE '%@tailoredhands.%'
      );
  END IF;
END $$; 