-- HERO SETTINGS DATABASE FIX
-- Run this in Supabase SQL Editor to add hero section management to your settings table

-- Add hero section columns safely (won't error if they already exist)
DO $$ 
BEGIN
    -- Add hero_image_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'hero_image_url') THEN
        ALTER TABLE settings ADD COLUMN hero_image_url TEXT DEFAULT 'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/f9e9c1ced82f14bddc858a8dd7b36cff.png';
        RAISE NOTICE 'Added hero_image_url column';
    END IF;
    
    -- Add hero_title column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'hero_title') THEN
        ALTER TABLE settings ADD COLUMN hero_title VARCHAR(255) DEFAULT 'Modern Elegance Redefined';
        RAISE NOTICE 'Added hero_title column';
    END IF;
    
    -- Add hero_subtitle column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'hero_subtitle') THEN
        ALTER TABLE settings ADD COLUMN hero_subtitle TEXT DEFAULT 'Discover our collection of meticulously crafted African-inspired pieces that blend traditional aesthetics with contemporary design.';
        RAISE NOTICE 'Added hero_subtitle column';
    END IF;
    
    -- Add hero_button_text column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'hero_button_text') THEN
        ALTER TABLE settings ADD COLUMN hero_button_text VARCHAR(100) DEFAULT 'EXPLORE COLLECTION';
        RAISE NOTICE 'Added hero_button_text column';
    END IF;
    
    RAISE NOTICE 'Hero settings columns check completed!';
END $$;

-- Ensure the settings table has at least one row with default hero values
INSERT INTO settings (
    id, 
    hero_image_url, 
    hero_title, 
    hero_subtitle, 
    hero_button_text,
    created_at,
    updated_at
) VALUES (
    1,
    'https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/f9e9c1ced82f14bddc858a8dd7b36cff.png',
    'Modern Elegance Redefined',
    'Discover our collection of meticulously crafted African-inspired pieces that blend traditional aesthetics with contemporary design.',
    'EXPLORE COLLECTION',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    hero_image_url = COALESCE(settings.hero_image_url, EXCLUDED.hero_image_url),
    hero_title = COALESCE(settings.hero_title, EXCLUDED.hero_title),
    hero_subtitle = COALESCE(settings.hero_subtitle, EXCLUDED.hero_subtitle),
    hero_button_text = COALESCE(settings.hero_button_text, EXCLUDED.hero_button_text),
    updated_at = NOW();

-- Verify the changes
SELECT 
    'Hero Settings Verification' as info,
    id,
    hero_image_url,
    hero_title,
    hero_subtitle,
    hero_button_text
FROM settings 
WHERE id = 1; 