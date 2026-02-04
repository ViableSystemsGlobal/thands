-- Add shipping fields to orders table for Shippo integration
-- Run this SQL script to add the necessary columns

-- Add shipping-related columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_service VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_currency VARCHAR(3) DEFAULT 'USD';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_country VARCHAR(2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_international BOOLEAN DEFAULT FALSE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_rate_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_estimated_days INTEGER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_country ON orders(shipping_country);
CREATE INDEX IF NOT EXISTS idx_orders_is_international ON orders(is_international);

-- Add comments for documentation
COMMENT ON COLUMN orders.shipping_carrier IS 'Shipping carrier name (e.g., UPS, FedEx, DHL)';
COMMENT ON COLUMN orders.shipping_service IS 'Shipping service level (e.g., Express, Standard)';
COMMENT ON COLUMN orders.tracking_number IS 'Package tracking number';
COMMENT ON COLUMN orders.shipping_label_url IS 'URL to download shipping label';
COMMENT ON COLUMN orders.shipping_cost IS 'Cost of shipping in shipping_currency';
COMMENT ON COLUMN orders.shipping_currency IS 'Currency for shipping cost (USD, GHS, etc.)';
COMMENT ON COLUMN orders.shipping_country IS 'Destination country code (ISO 3166-1 alpha-2)';
COMMENT ON COLUMN orders.is_international IS 'Whether this is an international shipment';
COMMENT ON COLUMN orders.shipping_rate_id IS 'Shippo rate ID for creating labels';
COMMENT ON COLUMN orders.shipping_estimated_days IS 'Estimated delivery time in days';

-- Update existing orders to set default values
UPDATE orders 
SET 
  shipping_currency = 'USD',
  is_international = FALSE,
  shipping_country = 'GH'
WHERE shipping_currency IS NULL;

-- Create a view for international orders
CREATE OR REPLACE VIEW international_orders AS
SELECT 
  o.*,
  c.first_name,
  c.last_name,
  c.email,
  c.phone
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.is_international = TRUE;

-- Create a view for orders requiring shipping labels
CREATE OR REPLACE VIEW orders_needing_labels AS
SELECT 
  o.*,
  c.first_name,
  c.last_name,
  c.email,
  c.phone
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
WHERE o.is_international = TRUE 
  AND o.status IN ('confirmed', 'processing')
  AND o.tracking_number IS NULL;

COMMENT ON VIEW international_orders IS 'View of all international orders';
COMMENT ON VIEW orders_needing_labels IS 'View of international orders that need shipping labels';
