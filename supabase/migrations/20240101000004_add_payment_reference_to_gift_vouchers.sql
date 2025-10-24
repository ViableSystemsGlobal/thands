-- Add payment_reference column to gift_vouchers table for tracking Paystack payments
ALTER TABLE gift_vouchers 
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_gift_vouchers_payment_reference 
ON gift_vouchers(payment_reference);

-- Add comment explaining the field
COMMENT ON COLUMN gift_vouchers.payment_reference IS 'Paystack payment reference for voucher purchase transactions'; 