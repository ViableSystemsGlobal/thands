-- ADMIN ACCESS FIX - Fix RLS policies so admins can see messages, consultations, and recent activity
-- Run this in Supabase SQL Editor to fix admin dashboard access issues

-- 1. Fix Messages Table Access for Admins
DROP POLICY IF EXISTS "Admins can view all messages" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Messages are viewable by admins" ON messages;
DROP POLICY IF EXISTS "Messages are insertable by everyone" ON messages;

-- Create proper admin access policy for messages
CREATE POLICY "Admins can view all messages" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow public to insert messages (for contact form)
CREATE POLICY "Anyone can insert messages" ON messages
    FOR INSERT WITH CHECK (true);

-- Allow admins to update message status
CREATE POLICY "Admins can update messages" ON messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 2. Fix Consultations Table Access for Admins
DROP POLICY IF EXISTS "Users can view their own consultations" ON consultations;
DROP POLICY IF EXISTS "Users can insert their own consultations" ON consultations;
DROP POLICY IF EXISTS "Consultations are viewable by authenticated users" ON consultations;
DROP POLICY IF EXISTS "Consultations are insertable by everyone" ON consultations;

-- Create proper admin access policy for consultations
CREATE POLICY "Admins can view all consultations" ON consultations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Allow users to view their own consultations
CREATE POLICY "Users can view own consultations" ON consultations
    FOR SELECT USING (
        auth.uid() = user_id OR 
        (user_id IS NULL AND session_id IS NOT NULL)
    );

-- Allow public to insert consultations (for consultation form)
CREATE POLICY "Anyone can insert consultations" ON consultations
    FOR INSERT WITH CHECK (true);

-- Allow admins to update consultations
CREATE POLICY "Admins can update consultations" ON consultations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 3. Fix Chat Leads Table Access (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_leads') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Admin can view all chat leads" ON chat_leads;
        DROP POLICY IF EXISTS "Service role can manage chat_leads" ON chat_leads;
        
        -- Create admin access policy
        CREATE POLICY "Admins can view all chat_leads" ON chat_leads
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.id = auth.uid() 
                    AND profiles.role = 'admin'
                )
            );
        
        -- Allow service role to insert chat leads
        CREATE POLICY "Service role can insert chat_leads" ON chat_leads
            FOR INSERT WITH CHECK (true);
            
        RAISE NOTICE 'Fixed chat_leads table policies';
    END IF;
END $$;

-- 4. Ensure customers table has proper admin access
DROP POLICY IF EXISTS "Admin can view all customers" ON customers;
DROP POLICY IF EXISTS "Admin can update all customers" ON customers;

CREATE POLICY "Admins can view all customers" ON customers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all customers" ON customers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 5. Ensure orders table has proper admin access
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 6. Add missing status column to messages table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'status') THEN
        ALTER TABLE messages ADD COLUMN status VARCHAR(20) DEFAULT 'new';
        RAISE NOTICE 'Added status column to messages table';
    END IF;
END $$;

-- 7. Verify admin access by testing queries
-- Test messages access
DO $$
DECLARE
    message_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO message_count FROM messages;
    RAISE NOTICE 'Messages table has % records', message_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error accessing messages table: %', SQLERRM;
END $$;

-- Test consultations access
DO $$
DECLARE
    consultation_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO consultation_count FROM consultations;
    RAISE NOTICE 'Consultations table has % records', consultation_count;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error accessing consultations table: %', SQLERRM;
END $$;

-- 8. Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON consultations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;

-- 9. Show final verification
SELECT 'ADMIN ACCESS FIX COMPLETED' as status;
SELECT 'Messages table policies:' as info;
SELECT policyname, cmd, permissive FROM pg_policies WHERE tablename = 'messages';
SELECT 'Consultations table policies:' as info;
SELECT policyname, cmd, permissive FROM pg_policies WHERE tablename = 'consultations'; 