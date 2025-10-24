-- Fix double-converted GHS values in orders table
-- This script identifies and fixes orders where total_amount_ghs appears to be double-converted

-- First, let's identify problematic orders
-- (You can run this to see which orders have suspicious conversion ratios)
/*
SELECT 
    order_number,
    total_amount,
    total_amount_ghs,
    (total_amount_ghs / total_amount) as conversion_ratio,
    created_at
FROM orders 
WHERE total_amount > 0 
    AND total_amount_ghs > 0 
    AND (total_amount_ghs / total_amount) > 24  -- Assuming exchange rate is around 16, anything above 24 is suspicious
ORDER BY conversion_ratio DESC
LIMIT 20;
*/

-- To fix the double-converted orders, uncomment and run the following:
-- WARNING: This will permanently modify your data. Make a backup first!

/*
-- Update orders where the conversion ratio suggests double conversion
-- Assuming current exchange rate is around 16.0
UPDATE orders 
SET total_amount_ghs = total_amount * 16.0,
    updated_at = NOW()
WHERE total_amount > 0 
    AND total_amount_ghs > 0 
    AND (total_amount_ghs / total_amount) > 24  -- Adjust this threshold as needed
    AND total_amount_ghs > total_amount * 100; -- Additional safety check

-- Log the changes
SELECT 'Fixed orders with double conversion' as action,
       COUNT(*) as affected_orders
FROM orders 
WHERE total_amount > 0 
    AND total_amount_ghs > 0 
    AND (total_amount_ghs / total_amount) <= 24;
*/

-- Note: Run this script carefully in production after testing with a small subset 