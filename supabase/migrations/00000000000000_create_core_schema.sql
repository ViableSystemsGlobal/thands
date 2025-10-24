-- Core E-commerce Database Schema
-- This migration creates all the fundamental tables for the TailoredHands e-commerce application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    sku VARCHAR(100) UNIQUE,
    weight DECIMAL(8,2),
    dimensions_length DECIMAL(8,2),
    dimensions_width DECIMAL(8,2),
    dimensions_height DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product sizes table
CREATE TABLE IF NOT EXISTS product_sizes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(50) NOT NULL,
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, size)
);

-- Gift voucher types table
CREATE TABLE IF NOT EXISTS gift_voucher_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    validity_months INTEGER DEFAULT 12,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gift vouchers table (issued vouchers)
CREATE TABLE IF NOT EXISTS gift_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_code VARCHAR(20) NOT NULL UNIQUE,
    gift_voucher_type_id UUID NOT NULL REFERENCES gift_voucher_types(id),
    amount DECIMAL(10,2) NOT NULL,
    issued_to_email VARCHAR(255),
    issued_to_name VARCHAR(100),
    is_redeemed BOOLEAN DEFAULT false,
    redeemed_at TIMESTAMP WITH TIME ZONE,
    redeemed_by_user_id UUID,
    expiry_date DATE NOT NULL,
    payment_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table (for guest checkout and user profiles)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- References auth.users when user is registered
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id),
    user_id UUID, -- References auth.users for registered users
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    
    -- Pricing in USD (base currency)
    base_subtotal DECIMAL(10,2) NOT NULL,
    base_shipping DECIMAL(10,2) DEFAULT 0,
    base_tax DECIMAL(10,2) DEFAULT 0,
    base_total DECIMAL(10,2) NOT NULL,
    
    -- Pricing in GHS (local currency)
    total_amount_ghs DECIMAL(10,2),
    exchange_rate DECIMAL(10,4),
    
    -- Shipping information
    shipping_email VARCHAR(255),
    shipping_phone VARCHAR(20),
    shipping_first_name VARCHAR(100),
    shipping_last_name VARCHAR(100),
    shipping_address TEXT,
    shipping_city VARCHAR(100),
    shipping_state VARCHAR(100),
    shipping_postal_code VARCHAR(20),
    shipping_country VARCHAR(100),
    
    -- Billing information (optional, can be same as shipping)
    billing_email VARCHAR(255),
    billing_first_name VARCHAR(100),
    billing_last_name VARCHAR(100),
    billing_address TEXT,
    billing_city VARCHAR(100),
    billing_state VARCHAR(100),
    billing_postal_code VARCHAR(20),
    billing_country VARCHAR(100),
    
    -- Voucher/discount information
    voucher_code VARCHAR(20),
    voucher_discount DECIMAL(10,2) DEFAULT 0,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    gift_voucher_type_id UUID REFERENCES gift_voucher_types(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    size VARCHAR(50),
    price DECIMAL(10,2) NOT NULL, -- Unit price at time of order
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure each order item is either a product or gift voucher, not both
    CHECK (
        (product_id IS NOT NULL AND gift_voucher_type_id IS NULL) OR
        (product_id IS NULL AND gift_voucher_type_id IS NOT NULL)
    )
);

-- Cart items table (for session-based cart)
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    user_id UUID, -- References auth.users for logged-in users
    product_id UUID REFERENCES products(id),
    gift_voucher_type_id UUID REFERENCES gift_voucher_types(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    size VARCHAR(50),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure each cart item is either a product or gift voucher, not both
    CHECK (
        (product_id IS NOT NULL AND gift_voucher_type_id IS NULL) OR
        (product_id IS NULL AND gift_voucher_type_id IS NOT NULL)
    ),
    
    -- Unique constraint to prevent duplicate items
    UNIQUE(session_id, product_id, gift_voucher_type_id, size)
);

-- Wishlist items table
CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) NOT NULL,
    user_id UUID, -- References auth.users for logged-in users  
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate wishlist items
    UNIQUE(session_id, product_id)
);

-- Shipping rules table
CREATE TABLE IF NOT EXISTS shipping_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    min_order_value DECIMAL(10,2) DEFAULT 0,
    max_order_value DECIMAL(10,2),
    shipping_cost DECIMAL(10,2) NOT NULL,
    free_shipping_threshold DECIMAL(10,2),
    estimated_days_min INTEGER,
    estimated_days_max INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    method VARCHAR(20) NOT NULL CHECK (method IN ('email', 'sms')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    order_id UUID REFERENCES orders(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification settings table
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT true,
    order_confirmation_email BOOLEAN DEFAULT true,
    order_confirmation_sms BOOLEAN DEFAULT true,
    payment_success_email BOOLEAN DEFAULT true,
    payment_success_sms BOOLEAN DEFAULT true,
    order_shipped_email BOOLEAN DEFAULT true,
    order_shipped_sms BOOLEAN DEFAULT true,
    order_delivered_email BOOLEAN DEFAULT true,
    order_delivered_sms BOOLEAN DEFAULT false,
    gift_voucher_email BOOLEAN DEFAULT true,
    gift_voucher_sms BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_session_id ON wishlist_items(session_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON wishlist_items(user_id);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_voucher_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access to products and categories
CREATE POLICY "Public can read products" ON products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read categories" ON categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read product sizes" ON product_sizes
    FOR SELECT USING (is_available = true);

CREATE POLICY "Public can read gift voucher types" ON gift_voucher_types
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can read shipping rules" ON shipping_rules
    FOR SELECT USING (is_active = true);

-- Cart and wishlist policies (session-based)
CREATE POLICY "Users can manage their cart items" ON cart_items
    FOR ALL USING (
        session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can manage their wishlist items" ON wishlist_items
    FOR ALL USING (
        session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
        OR user_id = auth.uid()
    );

-- Order policies
CREATE POLICY "Users can read their own orders" ON orders
    FOR SELECT USING (
        user_id = auth.uid()
        OR shipping_email = auth.email()
    );

CREATE POLICY "Users can read their own order items" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT id FROM orders 
            WHERE user_id = auth.uid() OR shipping_email = auth.email()
        )
    );

-- Insert default notification settings
INSERT INTO notification_settings (id) VALUES (uuid_generate_v4())
ON CONFLICT DO NOTHING;

-- Insert some default shipping rules
INSERT INTO shipping_rules (name, country, shipping_cost, free_shipping_threshold, estimated_days_min, estimated_days_max) VALUES
    ('Ghana Standard', 'Ghana', 25.00, 100.00, 2, 5),
    ('International Standard', NULL, 50.00, 200.00, 7, 14)
ON CONFLICT DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description, sort_order) VALUES
    ('Shirts', 'Custom tailored shirts and blouses', 1),
    ('Suits', 'Bespoke suits and formal wear', 2),
    ('Dresses', 'Custom dresses and gowns', 3),
    ('Accessories', 'Ties, belts, and fashion accessories', 4)
ON CONFLICT (name) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, category, price, image_url, stock_quantity, sku) VALUES
    ('Custom Tailored Shirt', 'Premium cotton shirt tailored to your measurements', 'Shirts', 89.99, '/images/shirt-sample.jpg', 50, 'TS001'),
    ('Business Suit', 'Complete business suit with jacket and trousers', 'Suits', 299.99, '/images/suit-sample.jpg', 25, 'BS001'),
    ('Evening Dress', 'Elegant evening dress for special occasions', 'Dresses', 199.99, '/images/dress-sample.jpg', 30, 'ED001'),
    ('Silk Tie', 'Premium silk tie with custom patterns', 'Accessories', 29.99, '/images/tie-sample.jpg', 100, 'ST001')
ON CONFLICT (sku) DO NOTHING;

-- Insert sample gift voucher types
INSERT INTO gift_voucher_types (name, amount, description, validity_months) VALUES
    ('Basic Gift Card', 50.00, 'Perfect for small alterations or accessories', 12),
    ('Premium Gift Card', 100.00, 'Great for custom shirts or dresses', 12),
    ('Luxury Gift Card', 250.00, 'Ideal for suits or multiple items', 12),
    ('Ultimate Gift Card', 500.00, 'Perfect for complete wardrobe makeover', 12)
ON CONFLICT DO NOTHING; 