-- Create customer_addresses table
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'home' CHECK (type IN ('home', 'work', 'other')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_is_default ON customer_addresses(customer_id, is_default);

-- Enable RLS (Row Level Security)
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own addresses" ON customer_addresses
  FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own addresses" ON customer_addresses
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can update their own addresses" ON customer_addresses
  FOR UPDATE USING (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own addresses" ON customer_addresses
  FOR DELETE USING (auth.uid() = customer_id);

-- Function to ensure only one default address per customer
CREATE OR REPLACE FUNCTION ensure_single_default_address()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting this address as default, remove default from all other addresses for this customer
  IF NEW.is_default = TRUE THEN
    UPDATE customer_addresses 
    SET is_default = FALSE 
    WHERE customer_id = NEW.customer_id AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to ensure only one default address per customer
CREATE TRIGGER ensure_single_default_address_trigger
  BEFORE INSERT OR UPDATE ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_address();

-- Function to automatically set first address as default
CREATE OR REPLACE FUNCTION set_first_address_as_default()
RETURNS TRIGGER AS $$
BEGIN
  -- If this is the first address for the customer, make it default
  IF NOT EXISTS (
    SELECT 1 FROM customer_addresses 
    WHERE customer_id = NEW.customer_id AND id != NEW.id
  ) THEN
    NEW.is_default = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set first address as default
CREATE TRIGGER set_first_address_as_default_trigger
  BEFORE INSERT ON customer_addresses
  FOR EACH ROW
  EXECUTE FUNCTION set_first_address_as_default(); 