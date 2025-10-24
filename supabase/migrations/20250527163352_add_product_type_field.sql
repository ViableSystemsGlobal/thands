-- Add product_type field to products table
-- This field will distinguish between "Ready to Wear" and "Made to Measure" products

-- Add the product_type column with constraints
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'made_to_measure' 
CHECK (product_type IN ('ready_to_wear', 'made_to_measure'));

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);

-- Update existing products to have a default type (Made to Measure for custom tailoring)
UPDATE products 
SET product_type = 'made_to_measure' 
WHERE product_type IS NULL;

-- Set the column to NOT NULL after updating existing records
ALTER TABLE products ALTER COLUMN product_type SET NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN products.product_type IS 'Indicates whether the product is ready-to-wear or made-to-measure. ready_to_wear = standard sizes in stock, made_to_measure = custom tailored to customer measurements';

-- Verify the changes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'product_type'
    ) THEN
        RAISE NOTICE 'product_type column successfully added to products table';
        
        -- Count products by type
        DECLARE
            ready_to_wear_count INTEGER;
            made_to_measure_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO ready_to_wear_count FROM products WHERE product_type = 'ready_to_wear';
            SELECT COUNT(*) INTO made_to_measure_count FROM products WHERE product_type = 'made_to_measure';
            
            RAISE NOTICE 'Ready to Wear products: %', ready_to_wear_count;
            RAISE NOTICE 'Made to Measure products: %', made_to_measure_count;
        END;
    ELSE
        RAISE NOTICE 'product_type column was not added to products table';
    END IF;
END $$;
