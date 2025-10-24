-- Ensure orders table has all shipping address columns
-- This migration adds missing shipping columns if they don't exist

ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_address TEXT,
ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS shipping_email VARCHAR(255);

-- Also ensure billing columns exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS billing_first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS billing_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS billing_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_shipping_email ON orders(shipping_email);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_country ON orders(shipping_country);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id); 