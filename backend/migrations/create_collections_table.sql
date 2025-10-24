-- Create collections table for homepage collections management
CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    search_terms TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_collections_active ON collections(is_active);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW
    EXECUTE FUNCTION update_collections_updated_at();

-- Insert default collections
INSERT INTO collections (name, description, search_terms, is_active) VALUES
('Kaftan', 'Explore our collection of elegant kaftans', 'kaftan, kaftans', true),
('Casual Wear', 'Comfortable and stylish casual wear', 'casual, everyday', true)
ON CONFLICT DO NOTHING;
