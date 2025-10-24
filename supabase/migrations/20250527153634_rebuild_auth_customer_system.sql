-- Rebuild Customer Authentication System
-- This migration ensures proper separation between guest customers and registered users
-- while providing account linking capabilities

-- Step 1: Update customers table structure to ensure consistency
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state VARCHAR(100);  
ALTER TABLE customers ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);

-- Step 2: Create function to link guest customer to new auth user
CREATE OR REPLACE FUNCTION link_guest_customer_to_user()
RETURNS TRIGGER AS $$
DECLARE
    guest_customer_record RECORD;
BEGIN
    -- Look for existing guest customer record with same email
    SELECT * INTO guest_customer_record 
    FROM customers 
    WHERE email = NEW.email 
    AND user_id IS NULL  -- This indicates it's a guest customer
    LIMIT 1;
    
    IF guest_customer_record.id IS NOT NULL THEN
        -- Link the guest customer to the new user
        UPDATE customers 
        SET user_id = NEW.id,
            updated_at = NOW()
        WHERE id = guest_customer_record.id;
        
        RAISE NOTICE 'Linked guest customer % to new user %', guest_customer_record.id, NEW.id;
    ELSE
        -- Create new customer record for the user if no guest record exists
        INSERT INTO customers (
            id,
            user_id, 
            email, 
            first_name, 
            last_name, 
            phone,
            created_at, 
            updated_at
        ) VALUES (
            NEW.id,  -- Use auth user ID as customer ID for registered users
            NEW.id,  -- Link to auth user
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
            COALESCE(NEW.raw_user_meta_data->>'phone', ''),
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Created new customer record for user %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Update the profile creation trigger to also handle customer linking
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- First create the profile
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 
                 CONCAT(
                     COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
                     ' ',
                     COALESCE(NEW.raw_user_meta_data->>'last_name', '')
                 ),
                 NEW.email),
        CASE 
            WHEN NEW.email LIKE '%@tailoredhands.%' OR NEW.email = 'admin@tailoredhands.com' THEN 'admin'
            ELSE 'customer'
        END
    );
    
    -- Then handle customer record linking/creation
    PERFORM link_guest_customer_to_user() FROM (SELECT NEW.*) AS subquery;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create function to get customer history for account linking
CREATE OR REPLACE FUNCTION get_customer_history_for_email(customer_email TEXT)
RETURNS TABLE (
    orders_count BIGINT,
    total_spent DECIMAL(10,2),
    last_order_date TIMESTAMPTZ,
    cart_items_count BIGINT,
    wishlist_items_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH customer_data AS (
        SELECT c.id as customer_id, c.user_id
        FROM customers c 
        WHERE c.email = customer_email
    ),
    order_stats AS (
        SELECT 
            COUNT(o.id) as order_count,
            COALESCE(SUM(o.base_total), 0) as total_amount,
            MAX(o.created_at) as last_order
        FROM orders o
        WHERE o.customer_id IN (SELECT customer_id FROM customer_data)
           OR o.shipping_email = customer_email
    ),
    cart_stats AS (
        SELECT COUNT(*) as cart_count
        FROM cart_items ci
        WHERE ci.user_id IN (SELECT customer_id FROM customer_data WHERE user_id IS NOT NULL)
    ),
    wishlist_stats AS (
        SELECT COUNT(*) as wishlist_count  
        FROM wishlist_items wi
        WHERE wi.user_id IN (SELECT customer_id FROM customer_data WHERE user_id IS NOT NULL)
    )
    SELECT 
        COALESCE(os.order_count, 0),
        COALESCE(os.total_amount, 0),
        os.last_order,
        COALESCE(cs.cart_count, 0),
        COALESCE(ws.wishlist_count, 0)
    FROM order_stats os
    CROSS JOIN cart_stats cs  
    CROSS JOIN wishlist_stats ws;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to transfer guest data to registered user
CREATE OR REPLACE FUNCTION transfer_guest_data_to_user(
    guest_customer_id UUID,
    auth_user_id UUID,
    session_id_to_transfer TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    transfer_results JSONB := '{}';
    orders_transferred INTEGER := 0;
    cart_items_transferred INTEGER := 0;
    wishlist_items_transferred INTEGER := 0;
BEGIN
    -- Transfer orders (update customer_id and user_id)
    UPDATE orders 
    SET customer_id = auth_user_id,
        user_id = auth_user_id,
        updated_at = NOW()
    WHERE customer_id = guest_customer_id;
    
    GET DIAGNOSTICS orders_transferred = ROW_COUNT;
    
    -- Transfer cart items if session_id provided
    IF session_id_to_transfer IS NOT NULL THEN
        UPDATE cart_items 
        SET user_id = auth_user_id,
            session_id = CONCAT('user_', auth_user_id::TEXT)
        WHERE session_id = session_id_to_transfer;
        
        GET DIAGNOSTICS cart_items_transferred = ROW_COUNT;
        
        -- Transfer wishlist items
        UPDATE wishlist_items 
        SET user_id = auth_user_id,
            session_id = CONCAT('user_', auth_user_id::TEXT)
        WHERE session_id = session_id_to_transfer;
        
        GET DIAGNOSTICS wishlist_items_transferred = ROW_COUNT;
    END IF;
    
    -- Update the customer record to link it to the user
    UPDATE customers 
    SET user_id = auth_user_id,
        updated_at = NOW()
    WHERE id = guest_customer_id;
    
    -- Build results
    transfer_results := jsonb_build_object(
        'orders_transferred', orders_transferred,
        'cart_items_transferred', cart_items_transferred, 
        'wishlist_items_transferred', wishlist_items_transferred,
        'guest_customer_id', guest_customer_id,
        'auth_user_id', auth_user_id
    );
    
    RETURN transfer_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email_user_id ON customers(email, user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_customer_id_user_id ON orders(customer_id, user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_session_user ON cart_items(session_id, user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_session_user ON wishlist_items(session_id, user_id);

-- Step 7: Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_customer_history_for_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION transfer_guest_data_to_user(UUID, UUID, TEXT) TO authenticated;

-- Step 8: Update RLS policies for customers table
DROP POLICY IF EXISTS "Users can view own customer record" ON customers;
DROP POLICY IF EXISTS "Users can update own customer record" ON customers;
DROP POLICY IF EXISTS "Allow customer record creation" ON customers;

-- Allow users to view their own customer records (both guest and registered)
CREATE POLICY "Users can view own customer record" ON customers
  FOR SELECT 
  USING (
    auth.uid() = user_id OR  -- Registered user viewing their record
    (user_id IS NULL AND auth.uid() IS NULL)  -- Guest viewing (no auth required for guests)
  );

-- Allow users to update their own customer records
CREATE POLICY "Users can update own customer record" ON customers
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Allow customer record creation for both guests and registered users
CREATE POLICY "Allow customer record creation" ON customers
  FOR INSERT 
  WITH CHECK (
    user_id IS NULL OR  -- Guest customer creation
    auth.uid() = user_id  -- Registered user customer creation
  );

-- Admin policies remain the same
CREATE POLICY "Admin can view all customers" ON customers
  FOR SELECT 
  USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

CREATE POLICY "Admin can update all customers" ON customers
  FOR UPDATE 
  USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

-- Step 9: Ensure proper cleanup of existing data inconsistencies
DO $$
DECLARE
    customer_record RECORD;
    fixed_count INTEGER := 0;
BEGIN
    -- Find customers with user_id but no corresponding auth user and clean up
    FOR customer_record IN 
        SELECT c.id, c.user_id, c.email 
        FROM customers c 
        WHERE c.user_id IS NOT NULL 
    LOOP
        -- Check if the user_id actually exists in auth.users
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = customer_record.user_id) THEN
            -- This customer record has an invalid user_id, treat as guest
            UPDATE customers 
            SET user_id = NULL,
                updated_at = NOW()
            WHERE id = customer_record.id;
            
            fixed_count := fixed_count + 1;
            RAISE NOTICE 'Fixed orphaned customer record: % (email: %)', customer_record.id, customer_record.email;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Fixed % orphaned customer records', fixed_count;
END $$;
