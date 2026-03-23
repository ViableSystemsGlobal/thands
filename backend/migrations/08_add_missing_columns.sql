-- Add missing columns referenced by route code but not in schema

-- order_items: custom_item_name for custom/bespoke orders
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS custom_item_name VARCHAR(255);

-- Update CHECK constraint to allow custom items (product, gift voucher, OR custom item)
-- Drop the old constraint first, then add the updated one
DO $$
BEGIN
  -- Try to drop the existing check constraint (name may vary)
  BEGIN
    ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_check;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignore if constraint doesn't exist
  END;

  BEGIN
    ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_gift_voucher_type_id_check;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- Add updated constraint: exactly one of product_id, gift_voucher_type_id, or custom_item_name must be set
  ALTER TABLE order_items ADD CONSTRAINT order_items_item_type_check CHECK (
    (product_id IS NOT NULL AND gift_voucher_type_id IS NULL AND custom_item_name IS NULL) OR
    (product_id IS NULL AND gift_voucher_type_id IS NOT NULL AND custom_item_name IS NULL) OR
    (product_id IS NULL AND gift_voucher_type_id IS NULL AND custom_item_name IS NOT NULL)
  );
END $$;

-- settings: google auth columns
ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_auth_enabled BOOLEAN DEFAULT false;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS google_client_id TEXT;
