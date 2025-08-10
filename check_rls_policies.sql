-- Check existing RLS policies on your tables
-- Run this in your Supabase SQL Editor to see what policies exist

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename IN ('users', 'jobs', 'matches', 'match_logs')
ORDER BY tablename, policyname;

-- Also check if RLS is enabled on these tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('users', 'jobs', 'matches', 'match_logs')
AND schemaname = 'public';
