-- TailoredHands Local Database Schema
-- This creates the complete database schema for local testing

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
    product_type VARCHAR(50) DEFAULT 'made_to_measure',
    is_featured BOOLEAN DEFAULT false,
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

-- Users table (replaces Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_sign_in TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends user information)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(10),
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Customers table (for guest checkout and user profiles)
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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
    user_id UUID REFERENCES users(id),
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
    user_id UUID REFERENCES users(id),
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
    user_id UUID REFERENCES users(id),
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

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    store_name VARCHAR(100) DEFAULT 'TailoredHands',
    store_description TEXT,
    contact_email VARCHAR(255) DEFAULT 'sales@tailoredhands.africa',
    contact_phone VARCHAR(20),
    exchange_rate_ghs DECIMAL(10,4) DEFAULT 16.0,
    paystack_public_key VARCHAR(255),
    paystack_secret_key VARCHAR(255),
    hero_image_url TEXT,
    hero_title VARCHAR(255),
    hero_subtitle TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat system tables
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_email TEXT,
    user_name TEXT,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_flagged BOOLEAN DEFAULT FALSE,
    flagged_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'assistant')),
    message_length INTEGER DEFAULT 0,
    time_since_last_message INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    chat_summary TEXT,
    message_count INTEGER DEFAULT 0,
    chat_duration_minutes INTEGER DEFAULT 0,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'converted', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    tags TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
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
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_leads_session_id ON chat_leads(session_id);

-- Insert default data
INSERT INTO settings (id, store_name, exchange_rate_ghs) 
VALUES (1, 'TailoredHands', 16.0) 
ON CONFLICT (id) DO NOTHING;

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

-- Insert default shipping rules
INSERT INTO shipping_rules (name, country, shipping_cost, free_shipping_threshold, estimated_days_min, estimated_days_max) VALUES
    ('Ghana Standard', 'Ghana', 25.00, 100.00, 2, 5),
    ('International Standard', NULL, 50.00, 200.00, 7, 14)
ON CONFLICT DO NOTHING;
