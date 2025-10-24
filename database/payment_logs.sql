-- Create payment_logs table for tracking payment transactions
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL,
  payment_reference VARCHAR(100) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'GHS',
  status VARCHAR(20) NOT NULL,
  gateway VARCHAR(50) DEFAULT 'paystack',
  gateway_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_number ON payment_logs(order_number);
CREATE INDEX IF NOT EXISTS idx_payment_logs_reference ON payment_logs(payment_reference);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at);

-- Add RLS policies
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Allow admin users to view all payment logs
CREATE POLICY "Admin can view all payment logs" ON payment_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow admin users to insert payment logs
CREATE POLICY "Admin can insert payment logs" ON payment_logs
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Allow system to insert payment logs (for automated processes)
CREATE POLICY "System can insert payment logs" ON payment_logs
  FOR INSERT 
  WITH CHECK (true);

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_payment_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_logs_updated_at
  BEFORE UPDATE ON payment_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_logs_updated_at(); 