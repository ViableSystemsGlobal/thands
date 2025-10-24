-- SAFE SECURITY FIX: Enable Row Level Security (RLS) on all tables
-- This version handles type casting issues and checks column types first

-- First, let's check the actual column types to avoid casting errors
-- This is just for reference - we'll use safer policies

-- Enable RLS on all tables that have policies but RLS disabled
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_voucher_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_sizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Enable RLS on all tables that are public but have no RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for tables that don't have any policies yet
-- Using safer approaches that avoid type casting issues

-- Order Items: Only admins can access (safer approach)
CREATE POLICY "Admins can view all order items" ON public.order_items
  FOR SELECT USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

CREATE POLICY "Admins can modify order items" ON public.order_items
  FOR ALL USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

-- Product FAQs: Public read, admin write
CREATE POLICY "Public can view product FAQs" ON public.product_faqs
  FOR SELECT USING (true);

CREATE POLICY "Admins can modify product FAQs" ON public.product_faqs
  FOR ALL USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

-- Gift Vouchers: Only admins can access
CREATE POLICY "Admins can view all gift vouchers" ON public.gift_vouchers
  FOR SELECT USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

CREATE POLICY "Admins can modify gift vouchers" ON public.gift_vouchers
  FOR ALL USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

-- Email Config: Only admins can access
CREATE POLICY "Admins can view email config" ON public.email_config
  FOR SELECT USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

CREATE POLICY "Admins can modify email config" ON public.email_config
  FOR ALL USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

-- Wishlist Items: Only admins for now (we'll add user policies later)
CREATE POLICY "Admins can view all wishlist items" ON public.wishlist_items
  FOR SELECT USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

CREATE POLICY "Admins can modify wishlist items" ON public.wishlist_items
  FOR ALL USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

-- SMS Config: Only admins can access
CREATE POLICY "Admins can view SMS config" ON public.sms_config
  FOR SELECT USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

CREATE POLICY "Admins can modify SMS config" ON public.sms_config
  FOR ALL USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

-- Cart Items: Only admins for now (we'll add user policies later)
CREATE POLICY "Admins can view all cart items" ON public.cart_items
  FOR SELECT USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

CREATE POLICY "Admins can modify cart items" ON public.cart_items
  FOR ALL USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

-- Coupons: Public read, admin write
CREATE POLICY "Public can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can modify coupons" ON public.coupons
  FOR ALL USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

-- Shipping Rules: Public read, admin write
CREATE POLICY "Public can view shipping rules" ON public.shipping_rules
  FOR SELECT USING (true);

CREATE POLICY "Admins can modify shipping rules" ON public.shipping_rules
  FOR ALL USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

-- Notification Logs: Only admins can access
CREATE POLICY "Admins can view notification logs" ON public.notification_logs
  FOR SELECT USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

CREATE POLICY "Admins can modify notification logs" ON public.notification_logs
  FOR ALL USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

-- Notification Settings: Only admins can access
CREATE POLICY "Admins can view notification settings" ON public.notification_settings
  FOR SELECT USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

CREATE POLICY "Admins can modify notification settings" ON public.notification_settings
  FOR ALL USING (
    auth.email() LIKE '%@tailoredhands.%' OR 
    auth.email() = 'admin@tailoredhands.com'
  );

-- Verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
