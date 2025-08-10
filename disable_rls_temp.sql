-- ========================================
-- TEMPORARY RLS DISABLE FOR TESTING
-- ========================================

-- Disable RLS on all tables temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean slate
DROP POLICY IF EXISTS "jobping_users_service_access" ON public.users;
DROP POLICY IF EXISTS "jobping_jobs_service_access" ON public.jobs;
DROP POLICY IF EXISTS "jobping_matches_service_access" ON public.matches;
DROP POLICY IF EXISTS "jobping_users_own_data" ON public.users;
DROP POLICY IF EXISTS "jobping_jobs_public_read" ON public.jobs;
DROP POLICY IF EXISTS "jobping_matches_own_email" ON public.matches;

-- Grant full access to service role
GRANT ALL PRIVILEGES ON public.users TO service_role;
GRANT ALL PRIVILEGES ON public.jobs TO service_role;
GRANT ALL PRIVILEGES ON public.matches TO service_role;

-- Verification
SELECT 
    '🔓 RLS TEMPORARILY DISABLED' as status,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('users', 'jobs', 'matches')
ORDER BY tablename;
