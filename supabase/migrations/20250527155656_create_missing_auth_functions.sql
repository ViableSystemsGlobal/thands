-- Create missing authentication functions for customer management

-- Function to get customer history for an email
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

-- Function to transfer guest data to registered user
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

-- Function to link guest customer to new auth user
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

-- Update the profile creation trigger to also handle customer linking
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
    PERFORM link_guest_customer_to_user();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_customer_history_for_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_history_for_email(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION transfer_guest_data_to_user(UUID, UUID, TEXT) TO authenticated;

-- Test the functions exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_customer_history_for_email') THEN
        RAISE NOTICE 'get_customer_history_for_email function created successfully';
    ELSE
        RAISE NOTICE 'get_customer_history_for_email function was NOT created';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'transfer_guest_data_to_user') THEN
        RAISE NOTICE 'transfer_guest_data_to_user function created successfully';
    ELSE
        RAISE NOTICE 'transfer_guest_data_to_user function was NOT created';
    END IF;
END $$;
