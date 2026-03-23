-- Add search_terms column to collections table
ALTER TABLE collections ADD COLUMN IF NOT EXISTS search_terms TEXT DEFAULT '';
