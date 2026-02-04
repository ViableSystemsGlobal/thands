-- First, ensure the weight column exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2) DEFAULT 1.0;

-- Update all products to have weight of 1kg if weight is NULL or 0
UPDATE products SET weight = 1.0 WHERE weight IS NULL OR weight = 0;

-- Verify the update
SELECT id, name, weight FROM products LIMIT 10;
