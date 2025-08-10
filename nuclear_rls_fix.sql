-- ========================================
-- NUCLEAR RLS FIX - COMPLETE CLEANUP
-- ========================================

-- Step 1: Disable RLS on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies on these tables (nuclear option)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    RAISE NOTICE '🧨 NUCLEAR CLEANUP: Dropping ALL policies...';
    
    -- Drop ALL existing policies on your tables
    FOR pol IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'jobs', 'matches')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                      pol.policyname, pol.tablename);
        RAISE NOTICE '💥 Dropped policy % on table %', pol.policyname, pol.tablename;
    END LOOP;
    
    RAISE NOTICE '🎯 Nuclear cleanup complete';
END $$;

-- Step 3: Grant ALL privileges to service role
GRANT ALL PRIVILEGES ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Step 4: Specific grants for your tables
GRANT ALL PRIVILEGES ON public.users TO service_role;
GRANT ALL PRIVILEGES ON public.jobs TO service_role;
GRANT ALL PRIVILEGES ON public.matches TO service_role;

-- Step 5: Verify the fix
SELECT 
    '🧨 NUCLEAR RLS FIX APPLIED' as status,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = false THEN '✅ RLS DISABLED'
        ELSE '❌ RLS STILL ENABLED'
    END as status_check
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'jobs', 'matches')
ORDER BY tablename;

-- Step 6: Show remaining policies (should be 0)
SELECT 
    '📋 REMAINING POLICIES' as policy_check,
    COUNT(*) as policy_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ ALL POLICIES REMOVED'
        ELSE '❌ POLICIES STILL EXIST'
    END as status
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('users', 'jobs', 'matches');

-- Step 7: Success confirmation
SELECT 
    '🎉 NUCLEAR RLS FIX COMPLETED!' as status,
    'All RLS policies removed and service role has full access' as result,
    'Your APIs will now work without any RLS restrictions' as outcome;
