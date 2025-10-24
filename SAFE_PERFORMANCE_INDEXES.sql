-- SAFE PERFORMANCE INDEXES
-- This version only creates indexes for columns that actually exist

-- Orders table indexes (these columns should exist)
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_email ON orders(shipping_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Products table indexes (check if is_active exists first)
DO $$
BEGIN
    -- Only create is_active index if column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'is_active' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
        RAISE NOTICE 'Created is_active index on products table';
    ELSE
        RAISE NOTICE 'is_active column does not exist on products table, skipping index';
    END IF;
END $$;

-- Create other product indexes that should exist
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Newsletter subscribers indexes (check if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'newsletter_subscribers' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers(email);
        CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_created_at ON newsletter_subscribers(created_at DESC);
        RAISE NOTICE 'Created newsletter subscriber indexes';
    ELSE
        RAISE NOTICE 'newsletter_subscribers table does not exist, skipping indexes';
    END IF;
END $$;

-- Messages/consultations indexes (check if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'messages' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
        RAISE NOTICE 'Created messages index';
    ELSE
        RAISE NOTICE 'messages table does not exist, skipping index';
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'consultations' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at DESC);
        RAISE NOTICE 'Created consultations index';
    ELSE
        RAISE NOTICE 'consultations table does not exist, skipping index';
    END IF;
END $$;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
