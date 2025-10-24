# 🔐 Admin User Setup Guide

## 🚨 Current Issue
If you're experiencing login loops (authenticating but can't access admin panel), this is because:
1. ✅ Authentication system is now fixed (session restoration implemented)
2. ❌ No admin user exists in the database yet

## 🛠️ Quick Fix: Create Admin User

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `fqnzrffsscrhknfzewxd`

2. **Navigate to Authentication**
   - Go to Authentication → Users
   - Click "Add User"

3. **Create Admin User**
   ```
   Email: admin@tailoredhands.com
   Password: admin123456
   Auto Confirm User: ✅ (check this box)
   ```

4. **Add Admin Profile**
   - Go to Database → Table Editor
   - Select the `profiles` table
   - Click "Insert Row"
   - Add the following data:
   ```
   id: [copy the user ID from step 3]
   email: admin@tailoredhands.com
   full_name: Admin User
   role: admin
   created_at: now()
   updated_at: now()
   ```

### Option 2: Using SQL (Advanced)

Run this in your Supabase SQL Editor:

```sql
-- First, you need to create the auth user via Supabase Dashboard
-- Then run this to ensure the profile exists:

INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
  '[USER_ID_FROM_AUTH_USERS]', 
  'admin@tailoredhands.com', 
  'Admin User', 
  'admin', 
  NOW(), 
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  updated_at = NOW();
```

## 🧪 Test Admin Login

1. **Open Admin Login**
   ```
   http://localhost:5173/admin/login
   ```

2. **Login with Admin Credentials**
   ```
   Email: admin@tailoredhands.com
   Password: admin123456
   ```

3. **Verify Access**
   - Should redirect to `/admin/dashboard`
   - No more authentication loops

## 🔧 What Was Fixed

### Authentication System Improvements:
1. **✅ Session Restoration**: Now checks for existing sessions on page load
2. **✅ Auth State Listener**: Handles login/logout across tabs
3. **✅ Proper Status Management**: Fixed AUTHENTICATED vs PENDING states
4. **✅ Console Logging**: Added debugging for easier troubleshooting

### Before the Fix:
- User logs in successfully
- Page refresh → Auth context starts with `IDLE` status
- AdminLayout redirects to login (infinite loop)

### After the Fix:
- User logs in successfully
- Page refresh → Auth context checks for existing session
- Session found → Status set to `AUTHENTICATED`
- AdminLayout allows access ✅

## 🐛 Troubleshooting

### Still Getting Login Loops?

1. **Check Browser Console**
   Look for these messages:
   ```
   🔍 AuthProvider: Checking for existing session...
   ✅ AuthProvider: Found existing session for: admin@tailoredhands.com
   ✅ AuthProvider: Session restored successfully
   ```

2. **Verify Admin Profile**
   ```sql
   SELECT * FROM profiles WHERE email = 'admin@tailoredhands.com';
   ```
   Should return: `role = 'admin'`

3. **Clear Browser Data**
   - Clear localStorage
   - Clear cookies for localhost:5173
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### Profile Not Found Error?

Run this SQL to create the profile:
```sql
-- Get the user ID first
SELECT id, email FROM auth.users WHERE email = 'admin@tailoredhands.com';

-- Then create profile with that ID
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES ('[USER_ID_FROM_ABOVE]', 'admin@tailoredhands.com', 'Admin User', 'admin', NOW(), NOW());
```

## 🔑 Default Admin Credentials
```
Email: admin@tailoredhands.com
Password: admin123456
```

**⚠️ Important**: Change this password after first login in a production environment!

## 📝 Next Steps

After successfully logging in:
1. Navigate to Settings → Payment Settings
2. Configure your Paystack keys for payment processing
3. Test the payment flow with the three-step checkout
4. Create additional admin users if needed

## 🎯 Summary

The authentication system is now robust and handles:
- ✅ Session persistence across page refreshes
- ✅ Proper admin role verification
- ✅ Automatic session restoration
- ✅ Cross-tab authentication state sync

You just need to create the initial admin user to get started! 