-- MAKE CURRENT USER ADMIN - Run this while logged in as the user you want to be admin
-- This will give your current user admin privileges

-- Step 1: Check who you are currently logged in as
SELECT 
    'You are logged in as:' as info,
    auth.uid() as your_user_id,
    auth.email() as your_email;

-- Step 2: Create or update your profile to be admin
INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
VALUES (
    auth.uid(),
    auth.email(),
    'Admin User',
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Step 3: Verify you are now admin
SELECT 
    'Verification:' as info,
    p.email,
    p.role,
    'SUCCESS - You are now admin!' as status
FROM profiles p
WHERE p.id = auth.uid();

-- Step 4: Test access to admin tables
SELECT 'Testing Messages Access:' as test, COUNT(*) as count FROM messages;
SELECT 'Testing Consultations Access:' as test, COUNT(*) as count FROM consultations; 