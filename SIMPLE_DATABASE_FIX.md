# Simple Database Fix Guide

## 🚨 Issues Found:
1. `settings` table missing `email` and `exchange_rate_ghs` columns
2. `consultations` table missing `recaptcha_token` column
3. `messages` table missing `recaptcha_token` column

## 🔧 Quick Fix (Run in Supabase SQL Editor):

### Step 1: Add missing columns to settings table
```sql
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS exchange_rate_ghs DECIMAL(10,2) DEFAULT 16.00;
```

### Step 2: Add recaptcha_token to consultations table
```sql
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS recaptcha_token TEXT;
```

### Step 3: Add recaptcha_token to messages table
```sql
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS recaptcha_token TEXT;
```

### Step 4: Update settings with default values
```sql
INSERT INTO settings (id, email, exchange_rate_ghs, created_at, updated_at)
VALUES (1, 'hello@tailoredhands.africa', 16.00, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  email = COALESCE(settings.email, EXCLUDED.email),
  exchange_rate_ghs = COALESCE(settings.exchange_rate_ghs, EXCLUDED.exchange_rate_ghs),
  updated_at = NOW();
```

### Step 5: Create policies for public access
```sql
-- Allow public access to settings (for contact page)
CREATE POLICY IF NOT EXISTS "Settings are viewable by everyone" ON settings
FOR SELECT USING (true);

-- Allow public insertion to consultations
CREATE POLICY IF NOT EXISTS "Consultations are insertable by everyone" ON consultations
FOR INSERT WITH CHECK (true);

-- Allow public insertion to messages
CREATE POLICY IF NOT EXISTS "Messages are insertable by everyone" ON messages
FOR INSERT WITH CHECK (true);
```

## 🎯 How to Run:

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Copy and paste each SQL block above**
4. **Run them one by one**
5. **Restart your development server**

## ✅ Verification:

After running the SQL, you should see:
- ✅ Contact page loads without errors
- ✅ Consultation form works with reCAPTCHA
- ✅ Exchange rates work properly
- ✅ No more "column does not exist" errors

## 🚀 Alternative: Run the Script

If you prefer to run the automated script:

1. **Install dependencies:**
   ```bash
   npm install dotenv
   ```

2. **Add to your .env file:**
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Run the script:**
   ```bash
   node run_database_fix.js
   ```

## 📝 Notes:

- The `IF NOT EXISTS` clause ensures the commands won't fail if columns already exist
- Default exchange rate is set to 16.00 (USD to GHS)
- Default email is set to 'hello@tailoredhands.africa'
- All tables will have proper RLS policies for security 