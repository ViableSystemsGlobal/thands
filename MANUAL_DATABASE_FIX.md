# Manual Database Schema Fix

## 🚨 **URGENT: Database Schema Issues**

The following database errors need to be fixed:

1. **Missing `recaptcha_token` column in `messages` table**
2. **Missing `recaptcha_token` column in `consultations` table**  
3. **Missing columns in `settings` table**

## 🔧 **Step-by-Step Fix**

### **1. Go to Supabase Dashboard**
- Navigate to your Supabase project dashboard
- Go to **SQL Editor**

### **2. Run These SQL Commands**

```sql
-- Fix settings table - add missing columns
ALTER TABLE settings ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS exchange_rate_ghs DECIMAL(10,2) DEFAULT 1.00;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT 'Tailored Hands';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_address TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_phone TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS company_website TEXT;

-- Fix consultations table - add missing columns
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS recaptcha_token TEXT;
ALTER TABLE consultations ADD COLUMN IF NOT EXISTS session_id TEXT;

-- Fix messages table - add recaptcha_token column
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recaptcha_token TEXT;

-- Insert default settings if none exist
INSERT INTO settings (id, company_name, email, exchange_rate_ghs, company_address, company_phone, company_website)
VALUES (
    'default',
    'Tailored Hands',
    'info@tailoredhands.com',
    1.00,
    'Accra, Ghana',
    '+233 20 123 4567',
    'https://tailoredhands.com'
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON settings;
CREATE POLICY "Settings are viewable by everyone" ON settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Settings are editable by admins" ON settings;
CREATE POLICY "Settings are editable by admins" ON settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can insert messages" ON messages;
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Users can insert their own consultations" ON consultations;
CREATE POLICY "Users can insert their own consultations" ON consultations
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    );

DROP POLICY IF EXISTS "Users can view their own consultations" ON consultations;
CREATE POLICY "Users can view their own consultations" ON consultations
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL) OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
```

### **3. Verify the Fix**

Run this query to check if all columns were added:

```sql
-- Check settings table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'settings' 
AND column_name IN ('email', 'exchange_rate_ghs', 'company_name', 'company_address', 'company_phone', 'company_website')
ORDER BY column_name;

-- Check consultations table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consultations' 
AND column_name IN ('recaptcha_token', 'session_id')
ORDER BY column_name;

-- Check messages table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'recaptcha_token';
```

## ✅ **Expected Results**

After running the fix, you should see:

- ✅ **Settings table**: 6 new columns added
- ✅ **Consultations table**: 2 new columns (`recaptcha_token`, `session_id`)
- ✅ **Messages table**: 1 new column (`recaptcha_token`)
- ✅ **RLS policies**: Properly configured
- ✅ **Default settings**: Inserted

## 🎯 **What This Fixes**

1. **reCAPTCHA errors** on Contact and Consultation forms
2. **Exchange rate loading** in admin settings
3. **Company profile data** in Contact page
4. **Database permission issues**

## 🚀 **After Running the Fix**

1. **Refresh your website**
2. **Test Contact form** - reCAPTCHA should work
3. **Test Consultation form** - reCAPTCHA should work  
4. **Check admin settings** - exchange rate should load
5. **Check checkout page** - should stop infinite loading

---

**⚠️ Important**: Run these commands in your Supabase SQL Editor, not in your application code! 