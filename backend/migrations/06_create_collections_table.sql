-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    slug VARCHAR(255) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections (slug);
CREATE INDEX IF NOT EXISTS idx_collections_is_active ON collections (is_active);
CREATE INDEX IF NOT EXISTS idx_collections_sort_order ON collections (sort_order);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_collections_updated_at();

-- Insert some default collections
INSERT INTO collections (name, description, slug, sort_order) VALUES
('Kaftans', 'Elegant traditional kaftans for every occasion', 'kaftans', 1),
('Agbadas', 'Traditional formal wear for special events', 'agbadas', 2),
('Casual Wear', 'Comfortable everyday clothing', 'casual-wear', 3)
ON CONFLICT (slug) DO NOTHING;
