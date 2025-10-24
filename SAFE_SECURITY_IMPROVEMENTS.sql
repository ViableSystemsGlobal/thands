-- SAFE SECURITY IMPROVEMENTS: Fix function search path vulnerabilities
-- This script only updates functions that actually exist in the database

-- First, let's see what functions actually exist
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.prosecdef as security_definer,
  p.proconfig as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%update%'
  OR p.proname LIKE '%check%'
  OR p.proname LIKE '%get%'
  OR p.proname LIKE '%handle%'
  OR p.proname LIKE '%increment%'
  OR p.proname LIKE '%detect%'
  OR p.proname LIKE '%confirm%'
  OR p.proname LIKE '%link%'
  OR p.proname LIKE '%transfer%'
  OR p.proname LIKE '%ensure%'
  OR p.proname LIKE '%set%'
  OR p.proname LIKE '%unsubscribe%'
ORDER BY p.proname;

-- Now let's safely update only the functions that exist
-- We'll use a more targeted approach

-- Update trigger functions (these are most likely to exist)
DO $$
DECLARE
    func_name text;
    func_list text[] := ARRAY[
        'update_chat_sessions_updated_at',
        'update_newsletter_updated_at', 
        'update_coupon_updated_at_column',
        'update_profiles_updated_at',
        'update_updated_at_column',
        'update_coupons_updated_at_column',
        'update_chat_leads_updated_at',
        'update_payment_logs_updated_at',
        'update_communication_settings_updated_at',
        'update_settings_updated_at'
    ];
BEGIN
    FOREACH func_name IN ARRAY func_list
    LOOP
        -- Check if function exists before trying to alter it
        IF EXISTS (
            SELECT 1 FROM pg_proc p 
            JOIN pg_namespace n ON p.pronamespace = n.oid 
            WHERE n.nspname = 'public' AND p.proname = func_name
        ) THEN
            EXECUTE format('ALTER FUNCTION public.%I() SET search_path = ''''', func_name);
            RAISE NOTICE 'Updated function: %', func_name;
        ELSE
            RAISE NOTICE 'Function does not exist: %', func_name;
        END IF;
    END LOOP;
END $$;

-- Update business logic functions with parameters
DO $$
DECLARE
    func_record record;
BEGIN
    -- Get all functions that might need search_path updates
    FOR func_record IN 
        SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' 
        AND (
            p.proname LIKE '%check%' OR
            p.proname LIKE '%get%' OR
            p.proname LIKE '%handle%' OR
            p.proname LIKE '%increment%' OR
            p.proname LIKE '%detect%' OR
            p.proname LIKE '%confirm%' OR
            p.proname LIKE '%link%' OR
            p.proname LIKE '%transfer%' OR
            p.proname LIKE '%ensure%' OR
            p.proname LIKE '%set%' OR
            p.proname LIKE '%unsubscribe%'
        )
    LOOP
        BEGIN
            -- Try to update the function with its arguments
            IF func_record.args IS NULL OR func_record.args = '' THEN
                EXECUTE format('ALTER FUNCTION public.%I() SET search_path = ''''', func_record.proname);
            ELSE
                EXECUTE format('ALTER FUNCTION public.%I(%s) SET search_path = ''''', func_record.proname, func_record.args);
            END IF;
            RAISE NOTICE 'Updated function: %', func_record.proname;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not update function %: %', func_record.proname, SQLERRM;
        END;
    END LOOP;
END $$;

-- Final verification - show which functions now have secure search paths
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  CASE 
    WHEN p.proconfig IS NULL THEN 'No search_path set'
    WHEN array_to_string(p.proconfig, ',') = 'search_path=' THEN 'Secure (empty search_path)'
    ELSE array_to_string(p.proconfig, ',')
  END as search_path_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname LIKE '%update%' OR
    p.proname LIKE '%check%' OR
    p.proname LIKE '%get%' OR
    p.proname LIKE '%handle%' OR
    p.proname LIKE '%increment%' OR
    p.proname LIKE '%detect%' OR
    p.proname LIKE '%confirm%' OR
    p.proname LIKE '%link%' OR
    p.proname LIKE '%transfer%' OR
    p.proname LIKE '%ensure%' OR
    p.proname LIKE '%set%' OR
    p.proname LIKE '%unsubscribe%'
  )
ORDER BY p.proname;
