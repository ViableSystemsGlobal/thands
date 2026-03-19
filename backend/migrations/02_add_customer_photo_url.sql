-- Add customer_photo_url column to orders table
-- Run: psql $DATABASE_URL -f backend/migrations/02_add_customer_photo_url.sql

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_photo_url TEXT;
