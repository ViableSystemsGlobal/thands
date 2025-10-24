-- COLLECTIONS DATABASE SETUP
-- Run this in Supabase SQL Editor to create the collections table for homepage management

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    search_terms TEXT[], -- Array of search terms for when users click the collection
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for collections
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for frontend to display collections)
CREATE POLICY "Collections are publicly readable" ON collections
    FOR SELECT USING (is_active = true);

-- Allow admin access for full CRUD operations
CREATE POLICY "Admins can manage collections" ON collections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Insert default collections if none exist
INSERT INTO collections (name, description, image_url, search_terms, is_active, sort_order)
SELECT * FROM (VALUES
    ('Kaftan', 'Explore our collection of elegant kaftans', 'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/fa019d4560e5a2e09dc05211ac6fcb00.jpg', ARRAY['kaftan', 'kaftans'], true, 1),
    ('Casual Wear', 'Explore our casual wear collection', 'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/cc6e91ffdbb67de6a4d6ac4baf0ce080.png', ARRAY['casual', 'casual wear'], true, 2),
    ('Agbada', 'Discover our regal Agbada collection', 'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/cc0ba00c0ee5afba16f73e4f65191966.png', ARRAY['agbada', 'grand boubou'], true, 3)
) AS default_collections(name, description, image_url, search_terms, is_active, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM collections);

-- Verify the setup
SELECT 
    'Collections Setup Verification' as info,
    COUNT(*) as total_collections,
    COUNT(*) FILTER (WHERE is_active = true) as active_collections
FROM collections; 