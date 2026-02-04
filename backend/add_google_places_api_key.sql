-- Add Google Places API key to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_places_api_key TEXT;

-- Add comment for documentation
COMMENT ON COLUMN settings.google_places_api_key IS 'Google Places API key for address autocomplete';

-- Insert default value if no settings exist
INSERT INTO settings (id, google_places_api_key) 
VALUES (1, '') 
ON CONFLICT (id) DO NOTHING;
