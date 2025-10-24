-- SECURITY IMPROVEMENTS: Fix function search path vulnerabilities
-- This script addresses the function search path mutable warnings

-- Fix all functions to have secure search paths
-- This prevents potential SQL injection attacks

-- Update trigger functions
ALTER FUNCTION public.update_chat_sessions_updated_at() SET search_path = '';
ALTER FUNCTION public.update_newsletter_updated_at() SET search_path = '';
ALTER FUNCTION public.update_coupon_updated_at_column() SET search_path = '';
ALTER FUNCTION public.update_profiles_updated_at() SET search_path = '';
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.update_coupons_updated_at_column() SET search_path = '';
ALTER FUNCTION public.update_chat_leads_updated_at() SET search_path = '';
ALTER FUNCTION public.update_payment_logs_updated_at() SET search_path = '';
ALTER FUNCTION public.update_communication_settings_updated_at() SET search_path = '';
ALTER FUNCTION public.update_settings_updated_at() SET search_path = '';

-- Update business logic functions
ALTER FUNCTION public.check_chat_rate_limit() SET search_path = '';
ALTER FUNCTION public.unsubscribe_from_newsletter(text) SET search_path = '';
ALTER FUNCTION public.get_customer_history_for_email(text) SET search_path = '';
ALTER FUNCTION public.get_newsletter_stats() SET search_path = '';
ALTER FUNCTION public.link_guest_customer_to_user(uuid, text) SET search_path = '';
ALTER FUNCTION public.increment_coupon_usage(text) SET search_path = '';
ALTER FUNCTION public.transfer_guest_data_to_user(uuid, text) SET search_path = '';
ALTER FUNCTION public.handle_profile_update() SET search_path = '';
ALTER FUNCTION public.ensure_single_default_address() SET search_path = '';
ALTER FUNCTION public.set_first_address_as_default() SET search_path = '';
ALTER FUNCTION public.confirm_user_manually(text) SET search_path = '';
ALTER FUNCTION public.increment_message_count() SET search_path = '';
ALTER FUNCTION public.detect_chat_abuse() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- Verify the changes
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  p.prosecdef as security_definer,
  p.proconfig as search_path_config
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'update_chat_sessions_updated_at',
    'update_newsletter_updated_at',
    'update_coupon_updated_at_column',
    'check_chat_rate_limit',
    'unsubscribe_from_newsletter',
    'get_customer_history_for_email',
    'get_newsletter_stats',
    'link_guest_customer_to_user',
    'increment_coupon_usage',
    'transfer_guest_data_to_user',
    'update_profiles_updated_at',
    'update_updated_at_column',
    'update_coupons_updated_at_column',
    'handle_profile_update',
    'ensure_single_default_address',
    'set_first_address_as_default',
    'update_chat_leads_updated_at',
    'update_payment_logs_updated_at',
    'confirm_user_manually',
    'increment_message_count',
    'detect_chat_abuse',
    'update_communication_settings_updated_at',
    'update_settings_updated_at',
    'handle_new_user'
  )
ORDER BY p.proname;
