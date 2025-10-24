-- Setup test Paystack keys for development
-- These are demo keys that won't process real payments

INSERT INTO settings (
    id, 
    store_name,
    store_description,
    contact_email,
    contact_phone,
    currency,
    timezone,
    paystack_public_key, 
    paystack_secret_key,
    created_at,
    updated_at,
    exchange_rate
) 
VALUES (
    1, 
    'Tailored Hands Store',
    'Modern fashion with timeless sophistication',
    'admin@tailoredhands.com',
    '+233 123 456 789',
    'USD',
    'UTC',
    'pk_test_50427dbd3ccc34606d04a1d775d63818c74528ea',
    'sk_test_27fee748f15ac3869348b9e491a9c48a5f2ee0d2',
    NOW(),
    NOW(),
    16.0
)
ON CONFLICT (id) 
DO UPDATE SET 
    store_name = 'Tailored Hands Store',
    store_description = 'Modern fashion with timeless sophistication',
    contact_email = 'admin@tailoredhands.com',
    contact_phone = '+233 123 456 789',
    currency = 'USD',
    timezone = 'UTC',
    paystack_public_key = 'pk_test_50427dbd3ccc34606d04a1d775d63818c74528ea',
    paystack_secret_key = 'sk_test_27fee748f15ac3869348b9e491a9c48a5f2ee0d2',
    updated_at = NOW(),
    exchange_rate = 16.0; 