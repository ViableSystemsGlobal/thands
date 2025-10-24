-- Fix product_sizes table schema
-- The table was created with 'price_adjustment' but the app expects 'price'

-- First, let's add the price column
ALTER TABLE product_sizes ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Copy data from price_adjustment to price (if any exists)
UPDATE product_sizes SET price = price_adjustment WHERE price IS NULL;

-- Drop the old price_adjustment column
ALTER TABLE product_sizes DROP COLUMN IF EXISTS price_adjustment;

-- Make price NOT NULL
ALTER TABLE product_sizes ALTER COLUMN price SET NOT NULL;

-- Now let's populate with sample data for existing products
-- First, let's see if we have products but no sizes
DO $$
DECLARE
    product_record RECORD;
    base_prices DECIMAL[] := ARRAY[45.00, 89.99, 199.99, 29.99]; -- Reasonable base prices in USD
    sizes TEXT[] := ARRAY['S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];
    size_name TEXT;
    multiplier DECIMAL;
    i INTEGER := 1;
BEGIN
    -- For each product that might not have sizes
    FOR product_record IN 
        SELECT p.id, p.name 
        FROM products p 
        LEFT JOIN product_sizes ps ON p.id = ps.product_id 
        WHERE ps.id IS NULL
        GROUP BY p.id, p.name
        ORDER BY p.created_at
    LOOP
        -- For each size, create an entry with reasonable pricing
        FOREACH size_name IN ARRAY sizes
        LOOP
            -- Different pricing tiers based on size
            CASE size_name
                WHEN 'S' THEN multiplier := 1.0;
                WHEN 'M' THEN multiplier := 1.2;
                WHEN 'L' THEN multiplier := 1.4;
                WHEN 'XL' THEN multiplier := 1.6;
                WHEN 'XXL' THEN multiplier := 1.8;
                WHEN 'XXXL' THEN multiplier := 2.0;
                WHEN 'XXXXL' THEN multiplier := 2.2;
                ELSE multiplier := 1.0;
            END CASE;
            
            INSERT INTO product_sizes (product_id, size, price, stock_quantity, is_available)
            VALUES (
                product_record.id,
                size_name,
                ROUND((base_prices[LEAST(i, array_length(base_prices, 1))] * multiplier)::numeric, 2),
                10, -- Stock quantity
                true
            )
            ON CONFLICT (product_id, size) DO NOTHING;
        END LOOP;
        
        i := i + 1;
        IF i > array_length(base_prices, 1) THEN
            i := 1; -- Reset to cycle through base prices
        END IF;
    END LOOP;
END $$;

-- Verify the data
SELECT 
    p.name,
    ps.size,
    ps.price
FROM products p
JOIN product_sizes ps ON p.id = ps.product_id
ORDER BY p.name, ps.size; 