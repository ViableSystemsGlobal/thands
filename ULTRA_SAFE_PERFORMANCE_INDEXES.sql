-- ULTRA SAFE PERFORMANCE INDEXES
-- This version checks every column before creating indexes

-- Orders table indexes (check each column exists)
DO $$
BEGIN
    -- Check and create orders indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'created_at' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
        RAISE NOTICE 'Created created_at index on orders table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'payment_status' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
        RAISE NOTICE 'Created payment_status index on orders table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'status' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        RAISE NOTICE 'Created status index on orders table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'shipping_email' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_orders_shipping_email ON orders(shipping_email);
        RAISE NOTICE 'Created shipping_email index on orders table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'customer_id' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
        RAISE NOTICE 'Created customer_id index on orders table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'orders' AND column_name = 'user_id' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
        RAISE NOTICE 'Created user_id index on orders table';
    END IF;
END $$;

-- Products table indexes (check each column exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'category' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
        RAISE NOTICE 'Created category index on products table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'price' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
        RAISE NOTICE 'Created price index on products table';
    ELSE
        RAISE NOTICE 'price column does not exist on products table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'created_at' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
        RAISE NOTICE 'Created created_at index on products table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'products' AND column_name = 'is_active' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
        RAISE NOTICE 'Created is_active index on products table';
    ELSE
        RAISE NOTICE 'is_active column does not exist on products table';
    END IF;
END $$;

-- Customers table indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'customers' AND column_name = 'email' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
        RAISE NOTICE 'Created email index on customers table';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'customers' AND column_name = 'user_id' 
               AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
        RAISE NOTICE 'Created user_id index on customers table';
    END IF;
END $$;

-- Cart items indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'cart_items' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cart_items' AND column_name = 'session_id' 
                   AND table_schema = 'public') THEN
            CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);
            RAISE NOTICE 'Created session_id index on cart_items table';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cart_items' AND column_name = 'user_id' 
                   AND table_schema = 'public') THEN
            CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
            RAISE NOTICE 'Created user_id index on cart_items table';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'cart_items' AND column_name = 'product_id' 
                   AND table_schema = 'public') THEN
            CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
            RAISE NOTICE 'Created product_id index on cart_items table';
        END IF;
    ELSE
        RAISE NOTICE 'cart_items table does not exist';
    END IF;
END $$;

-- Order items indexes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_name = 'order_items' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'order_id' 
                   AND table_schema = 'public') THEN
            CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
            RAISE NOTICE 'Created order_id index on order_items table';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'order_items' AND column_name = 'product_id' 
                   AND table_schema = 'public') THEN
            CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
            RAISE NOTICE 'Created product_id index on order_items table';
        END IF;
    ELSE
        RAISE NOTICE 'order_items table does not exist';
    END IF;
END $$;

-- Show what indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
