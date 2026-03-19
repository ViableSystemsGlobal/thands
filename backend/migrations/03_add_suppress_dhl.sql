-- Add suppress_dhl column to shipping_rules table
-- When true, DHL rates will not be shown for destinations matching this rule
ALTER TABLE shipping_rules ADD COLUMN IF NOT EXISTS suppress_dhl BOOLEAN DEFAULT false;
