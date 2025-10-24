-- URGENT SECURITY FIX: Enable Row Level Security (RLS) on all tables
-- This script addresses the critical security vulnerabilities identified by Supabase linter

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
-- These are basic policies - you may need to customize them based on your needs

-- Order Items: Only admins and order owners can access
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

-- Gift Vouchers: Only admins and voucher owners can access
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

-- Wishlist Items: Users can only access their own items
CREATE POLICY "Users can view own wishlist items" ON public.wishlist_items
  FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can modify own wishlist items" ON public.wishlist_items
  FOR ALL USING (auth.uid() = user_id::uuid);

CREATE POLICY "Admins can view all wishlist items" ON public.wishlist_items
  FOR SELECT USING (
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

-- Cart Items: Users can only access their own cart
CREATE POLICY "Users can view own cart items" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id::uuid);

CREATE POLICY "Users can modify own cart items" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id::uuid);

CREATE POLICY "Admins can view all cart items" ON public.cart_items
  FOR SELECT USING (
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
