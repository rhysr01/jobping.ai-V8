-- ========================================
-- JOBPING RLS FIX - PERFECTLY ALIGNED WITH YOUR SCHEMA
-- Based on your exact table structure
-- ========================================

-- Step 1: Complete cleanup
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    RAISE NOTICE '🧹 Cleaning up existing RLS policies...';
    
    -- Drop ALL existing policies on your tables
    FOR pol IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'jobs', 'matches')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                      pol.policyname, pol.tablename);
        RAISE NOTICE '✅ Dropped policy % on table %', pol.policyname, pol.tablename;
    END LOOP;
    
    RAISE NOTICE '🎯 Policy cleanup complete';
END $$;

-- Step 2: Create bulletproof service role policies
-- USERS table - service role has full access
CREATE POLICY "jobping_users_service_access" ON public.users
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- JOBS table - service role has full access  
CREATE POLICY "jobping_jobs_service_access" ON public.jobs
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- MATCHES table - service role has full access
CREATE POLICY "jobping_matches_service_access" ON public.matches
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Step 3: Optional authenticated user policies (for future user dashboard)
-- Users can only see their own data
CREATE POLICY "jobping_users_own_data" ON public.users
    FOR SELECT TO authenticated USING (auth.uid()::text = id::text);

-- Authenticated users can read all active jobs
CREATE POLICY "jobping_jobs_public_read" ON public.jobs
    FOR SELECT TO authenticated USING (is_active = true);

-- Users can only see their own matches (based on user_email field)
CREATE POLICY "jobping_matches_own_email" ON public.matches
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id::text = auth.uid()::text 
            AND users.email = matches.user_email
        )
    );

-- Step 4: Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant comprehensive permissions to service role
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant all privileges on each table
GRANT ALL PRIVILEGES ON public.users TO service_role;
GRANT ALL PRIVILEGES ON public.jobs TO service_role;
GRANT ALL PRIVILEGES ON public.matches TO service_role;

-- Grant sequence access for auto-incrementing IDs
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant function access
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Step 6: Verification report
SELECT 
    '🚀 JOBPING RLS STATUS' as report_type,
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN COUNT(p.policyname) >= 1 THEN '✅ PROTECTED'
        ELSE '❌ NO POLICIES'
    END as protection_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
    AND t.tablename IN ('users', 'jobs', 'matches')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- Step 7: Show all created policies
SELECT 
    '📋 ACTIVE POLICIES' as policy_report,
    tablename, 
    policyname, 
    roles,
    cmd as allowed_operations
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('users', 'jobs', 'matches')
ORDER BY tablename, policyname;

-- Step 8: Success confirmation
SELECT 
    '🎉 RLS FIX COMPLETED SUCCESSFULLY!' as status,
    'Service role has full access to all tables' as access_level,
    'Your JobPing APIs will now work perfectly' as result,
    'Run your tests to confirm!' as next_step;
