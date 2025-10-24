-- Create newsletter system tables
-- This migration adds support for newsletter popup configuration and subscriber management

-- Newsletter settings table (for admin configuration)
CREATE TABLE IF NOT EXISTS public.newsletter_settings (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Get 15% Off Your First Order!',
    subtitle TEXT NOT NULL DEFAULT 'Join our newsletter for exclusive offers',
    description TEXT NOT NULL DEFAULT 'Be the first to know about new arrivals, sales, and special promotions.',
    offer_text TEXT NOT NULL DEFAULT 'Use code WELCOME15 at checkout',
    button_text TEXT NOT NULL DEFAULT 'Claim Your Discount',
    image_url TEXT NOT NULL DEFAULT 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center',
    is_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    source TEXT DEFAULT 'popup', -- popup, manual, import, etc.
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_active ON public.newsletter_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_subscribed_at ON public.newsletter_subscribers(subscribed_at);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_newsletter_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_newsletter_settings_updated_at ON public.newsletter_settings;
CREATE TRIGGER update_newsletter_settings_updated_at
    BEFORE UPDATE ON public.newsletter_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_updated_at();

DROP TRIGGER IF EXISTS update_newsletter_subscribers_updated_at ON public.newsletter_subscribers;
CREATE TRIGGER update_newsletter_subscribers_updated_at
    BEFORE UPDATE ON public.newsletter_subscribers
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_updated_at();

-- Insert default newsletter settings
INSERT INTO public.newsletter_settings (id, title, subtitle, description, offer_text, button_text, image_url, is_enabled)
VALUES (1, 'Get 15% Off Your First Order!', 'Join our newsletter for exclusive offers', 'Be the first to know about new arrivals, sales, and special promotions.', 'Use code WELCOME15 at checkout', 'Claim Your Discount', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row Level Security (RLS) policies
ALTER TABLE public.newsletter_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Newsletter settings policies
-- Allow public read access to newsletter settings
CREATE POLICY "Newsletter settings are publicly readable" ON public.newsletter_settings
    FOR SELECT USING (true);

-- Allow admins to update newsletter settings
CREATE POLICY "Admins can update newsletter settings" ON public.newsletter_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Newsletter subscribers policies
-- Allow public insert (for new subscriptions)
CREATE POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers
    FOR INSERT WITH CHECK (true);

-- Allow subscribers to update their own subscription
CREATE POLICY "Subscribers can update their own subscription" ON public.newsletter_subscribers
    FOR UPDATE USING (email = (SELECT email FROM public.profiles WHERE profiles.id = auth.uid()));

-- Allow admins to read all subscribers
CREATE POLICY "Admins can read all newsletter subscribers" ON public.newsletter_subscribers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow admins to update subscriber status
CREATE POLICY "Admins can update newsletter subscribers" ON public.newsletter_subscribers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create unsubscribe function
CREATE OR REPLACE FUNCTION unsubscribe_from_newsletter(subscriber_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.newsletter_subscribers
    SET is_active = false, unsubscribed_at = NOW()
    WHERE email = subscriber_email AND is_active = true;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Create function to get newsletter stats
CREATE OR REPLACE FUNCTION get_newsletter_stats()
RETURNS TABLE (
    total_subscribers BIGINT,
    active_subscribers BIGINT,
    recent_subscribers BIGINT,
    unsubscribed_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_subscribers,
        COUNT(*) FILTER (WHERE is_active = true) as active_subscribers,
        COUNT(*) FILTER (WHERE is_active = true AND subscribed_at >= NOW() - INTERVAL '30 days') as recent_subscribers,
        COUNT(*) FILTER (WHERE is_active = false) as unsubscribed_count
    FROM public.newsletter_subscribers;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON public.newsletter_settings TO anon, authenticated;
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT, UPDATE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_settings TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO authenticated;
GRANT USAGE ON SEQUENCE newsletter_settings_id_seq TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.newsletter_settings IS 'Configuration settings for newsletter popup';
COMMENT ON TABLE public.newsletter_subscribers IS 'Newsletter email subscribers';
COMMENT ON COLUMN public.newsletter_subscribers.source IS 'Source of subscription (popup, manual, import, etc.)';
COMMENT ON COLUMN public.newsletter_subscribers.preferences IS 'JSON object storing subscriber preferences';
COMMENT ON FUNCTION unsubscribe_from_newsletter(TEXT) IS 'Unsubscribe an email from newsletter';
COMMENT ON FUNCTION get_newsletter_stats() IS 'Get newsletter subscription statistics';

-- Verify tables were created
SELECT 'Newsletter system tables created successfully!' as status; 