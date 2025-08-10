-- Comprehensive RLS fix for Supabase tables
-- Run this in your Supabase SQL Editor

-- First, drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow service role full access to users" ON public.users;
DROP POLICY IF EXISTS "Allow service role full access to jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow service role full access to matches" ON public.matches;
DROP POLICY IF EXISTS "Allow service role full access to match_logs" ON public.match_logs;

-- Drop any other policies that might be blocking access
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can read their own matches" ON public.matches;

-- Create comprehensive service role policies
CREATE POLICY "service_role_full_access_users" 
ON public.users 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_full_access_jobs" 
ON public.jobs 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_full_access_matches" 
ON public.matches 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

CREATE POLICY "service_role_full_access_match_logs" 
ON public.match_logs 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Ensure service role has proper grants
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.jobs TO service_role;
GRANT ALL ON public.matches TO service_role;
GRANT ALL ON public.match_logs TO service_role;

-- Grant usage on sequences (for auto-generated IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Optional: If you want to completely disable RLS for testing (not recommended for production)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.match_logs DISABLE ROW LEVEL SECURITY;

-- Check that policies were created successfully
SELECT 
    tablename,
    policyname,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('users', 'jobs', 'matches', 'match_logs')
AND policyname LIKE '%service_role%'
ORDER BY tablename;
