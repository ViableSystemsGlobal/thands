-- Add GBP exchange rate column to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS exchange_rate_gbp DECIMAL(10,4) DEFAULT 0.79;

-- Update existing rows with default GBP rate if NULL
UPDATE settings 
SET exchange_rate_gbp = 0.79 
WHERE exchange_rate_gbp IS NULL;

