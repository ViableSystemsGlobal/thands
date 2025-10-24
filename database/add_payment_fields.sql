-- Add payment tracking fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(50) DEFAULT 'paystack',
ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

-- Create indexes for payment fields
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON orders(payment_gateway);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_completed_at ON orders(payment_completed_at); 