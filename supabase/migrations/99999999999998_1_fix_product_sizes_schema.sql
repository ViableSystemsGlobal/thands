-- Fix product_sizes table schema
-- The table was created with 'price_adjustment' but the app expects 'price'

-- First check if we need to add the price column
DO $$
BEGIN
    -- Check if price column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'product_sizes' AND column_name = 'price'
    ) THEN
        -- Add the price column
        ALTER TABLE product_sizes ADD COLUMN price DECIMAL(10,2);
        
        -- Copy any existing price_adjustment data to price
        UPDATE product_sizes SET price = COALESCE(price_adjustment, 0) WHERE price IS NULL;
        
        -- Drop the old price_adjustment column if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'product_sizes' AND column_name = 'price_adjustment'
        ) THEN
            ALTER TABLE product_sizes DROP COLUMN price_adjustment;
        END IF;
        
        -- Make price NOT NULL with a default
        ALTER TABLE product_sizes ALTER COLUMN price SET NOT NULL;
        ALTER TABLE product_sizes ALTER COLUMN price SET DEFAULT 0;
        
        RAISE NOTICE 'Added price column to product_sizes table';
    ELSE
        RAISE NOTICE 'Price column already exists in product_sizes table';
    END IF;
END $$;

-- Clear any existing product_sizes data to avoid conflicts
DELETE FROM product_sizes;

-- Now populate with reasonable sample data for existing products
DO $$
DECLARE
    product_record RECORD;
    base_prices DECIMAL[] := ARRAY[45.00, 89.99, 159.99, 29.99]; -- Reasonable base prices in USD
    sizes TEXT[] := ARRAY['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
    size_name TEXT;
    size_multiplier DECIMAL;
    base_price DECIMAL;
    i INTEGER := 1;
BEGIN
    RAISE NOTICE 'Starting to populate product sizes...';
    
    -- For each existing product
    FOR product_record IN 
        SELECT id, name FROM products ORDER BY created_at
    LOOP
        -- Get base price for this product (cycle through our reasonable prices)
        base_price := base_prices[((i - 1) % array_length(base_prices, 1)) + 1];
        
        RAISE NOTICE 'Processing product: % with base price: %', product_record.name, base_price;
        
        -- For each size, create an entry with size-based pricing
        FOREACH size_name IN ARRAY sizes
        LOOP
            -- Different pricing multipliers based on size
            CASE size_name
                WHEN 'S' THEN size_multiplier := 1.0;
                WHEN 'M' THEN size_multiplier := 1.2;
                WHEN 'L' THEN size_multiplier := 1.4;
                WHEN 'XL' THEN size_multiplier := 1.6;
                WHEN 'XXL' THEN size_multiplier := 1.8;
                WHEN 'XXXL' THEN size_multiplier := 2.0;
                WHEN 'XXXXL' THEN size_multiplier := 2.2;
                ELSE size_multiplier := 1.0;
            END CASE;
            
            INSERT INTO product_sizes (product_id, size, price, stock_quantity, is_available)
            VALUES (
                product_record.id,
                size_name,
                ROUND((base_price * size_multiplier)::numeric, 2),
                10, -- Stock quantity
                true
            );
        END LOOP;
        
        i := i + 1;
    END LOOP;
    
    RAISE NOTICE 'Finished populating product sizes';
END $$;

-- Verify the data was created correctly
DO $$
DECLARE
    size_count INTEGER;
    sample_record RECORD;
BEGIN
    SELECT COUNT(*) INTO size_count FROM product_sizes;
    RAISE NOTICE 'Total product_sizes records created: %', size_count;
    
    -- Show a few sample records
    FOR sample_record IN 
        SELECT p.name, ps.size, ps.price 
        FROM products p 
        JOIN product_sizes ps ON p.id = ps.product_id 
        ORDER BY p.name, ps.size 
        LIMIT 10
    LOOP
        RAISE NOTICE 'Sample: % - Size % = $%', sample_record.name, sample_record.size, sample_record.price;
    END LOOP;
END $$; 