-- Branch System Migration
-- Creates tables and schema for multi-branch support with RBAC

-- Branch settings table
CREATE TABLE IF NOT EXISTS branch_settings (
  branch_code VARCHAR(10) PRIMARY KEY,
  branch_name VARCHAR(100) NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  default_currency VARCHAR(3) NOT NULL,
  
  -- Shipping origin (for Shippo)
  shipping_origin_name VARCHAR(100) DEFAULT 'TailoredHands',
  shipping_origin_street VARCHAR(200),
  shipping_origin_city VARCHAR(100),
  shipping_origin_state VARCHAR(100),
  shipping_origin_zip VARCHAR(20),
  shipping_origin_country VARCHAR(2),
  
  -- Shippo API settings (can be branch-specific)
  shippo_from_name VARCHAR(100),
  shippo_from_street VARCHAR(200),
  shippo_from_city VARCHAR(100),
  shippo_from_state VARCHAR(100),
  shippo_from_zip VARCHAR(20),
  shippo_from_country VARCHAR(2),
  
  -- Contact info
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_address TEXT,
  
  -- Regional settings
  tax_rate DECIMAL(5,2) DEFAULT 0,
  timezone VARCHAR(50) DEFAULT 'UTC',
  
  -- Visual/branding
  hero_image_url TEXT,
  hero_title VARCHAR(255),
  hero_subtitle TEXT,
  
  -- Flags
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User branch access table (for RBAC)
CREATE TABLE IF NOT EXISTS user_branch_access (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  branch_code VARCHAR(10) NOT NULL REFERENCES branch_settings(branch_code) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, branch_code)
);

-- Add branch_code to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS branch_code VARCHAR(10) REFERENCES branch_settings(branch_code);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_branch_code ON orders(branch_code);
CREATE INDEX IF NOT EXISTS idx_user_branch_access_user_id ON user_branch_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_branch_access_branch_code ON user_branch_access(branch_code);

-- Insert default branches
INSERT INTO branch_settings (
  branch_code, 
  branch_name, 
  country_code, 
  default_currency,
  shipping_origin_city,
  shipping_origin_country,
  shippo_from_city,
  shippo_from_state,
  shippo_from_zip,
  shippo_from_country,
  is_default
) VALUES
  (
    'GH',
    'Ghana',
    'GH',
    'GHS',
    'Accra',
    'GH',
    'Accra',
    'Greater Accra',
    '00233',
    'GH',
    true
  ),
  (
    'UK',
    'United Kingdom',
    'GB',
    'GBP',
    'London',
    'GB',
    'London',
    'England',
    'SW1A 1AA',
    'GB',
    false
  ),
  (
    'US',
    'United States',
    'US',
    'USD',
    'New York',
    'US',
    'New York',
    'NY',
    '10001',
    'US',
    false
  )
ON CONFLICT (branch_code) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE branch_settings IS 'Stores configuration for each branch/location';
COMMENT ON TABLE user_branch_access IS 'RBAC: Maps users to branches they can access';
COMMENT ON COLUMN orders.branch_code IS 'Branch that fulfilled/processed this order';

