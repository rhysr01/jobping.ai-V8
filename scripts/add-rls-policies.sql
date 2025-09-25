-- ============================================================================
-- ADD MINIMAL RLS POLICIES
-- Enable RLS with "select own rows" for users, "service_writes" for service role
-- ============================================================================

-- Enable RLS on key tables (if not already enabled)
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_send_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_batch ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- MATCHES TABLE POLICIES
-- ============================================================================

-- Users can only see their own matches
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
CREATE POLICY "Users can view their own matches" ON matches
    FOR SELECT USING (user_email = auth.jwt() ->> 'email');

-- Service role can do everything (for matching system)
DROP POLICY IF EXISTS "Service role full access to matches" ON matches;
CREATE POLICY "Service role full access to matches" ON matches
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- EMAIL SEND LEDGER POLICIES
-- ============================================================================

-- Users can only see their own email sends
DROP POLICY IF EXISTS "Users can view their own email sends" ON email_send_ledger;
CREATE POLICY "Users can view their own email sends" ON email_send_ledger
    FOR SELECT USING (user_email = auth.jwt() ->> 'email');

-- Service role can do everything (for email system)
DROP POLICY IF EXISTS "Service role full access to email sends" ON email_send_ledger;
CREATE POLICY "Service role full access to email sends" ON email_send_ledger
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- MATCH BATCH POLICIES
-- ============================================================================

-- Users can only see their own batches
DROP POLICY IF EXISTS "Users can view their own batches" ON match_batch;
CREATE POLICY "Users can view their own batches" ON match_batch
    FOR SELECT USING (user_email = auth.jwt() ->> 'email');

-- Service role can do everything (for batch system)
DROP POLICY IF EXISTS "Service role full access to batches" ON match_batch;
CREATE POLICY "Service role full access to batches" ON match_batch
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- USERS TABLE POLICIES (if not already set)
-- ============================================================================

-- Ensure users table has proper policies
DO $$
BEGIN
    -- Check if users table has RLS enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'users' AND relrowsecurity = true
    ) THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    END IF;
    
    -- Add user policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can view their own data'
    ) THEN
        CREATE POLICY "Users can view their own data" ON users
            FOR SELECT USING (email = auth.jwt() ->> 'email');
    END IF;
    
    -- Add service role policy if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Service role full access to users'
    ) THEN
        CREATE POLICY "Service role full access to users" ON users
            FOR ALL USING (auth.role() = 'service_role');
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check RLS is enabled on key tables
SELECT 
    'RLS STATUS' as check_type,
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables pt
JOIN pg_class pc ON pc.relname = pt.tablename
WHERE tablename IN ('matches', 'email_send_ledger', 'match_batch', 'users')
AND schemaname = 'public';

-- Check policies exist
SELECT 
    'POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    cmd as policy_type
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('matches', 'email_send_ledger', 'match_batch', 'users')
ORDER BY tablename, policyname;

-- Test policy enforcement (should work with service role)
SELECT 
    'POLICY TEST' as check_type,
    CASE 
        WHEN auth.role() = 'service_role' THEN 'Service role active'
        WHEN auth.jwt() ->> 'email' IS NOT NULL THEN 'User role active'
        ELSE 'Anonymous role'
    END as current_role;
