-- Fix RLS policy for users table to allow webhook signups
-- Run this in Supabase SQL Editor

-- Option 1: Simple fix - Allow all inserts (less secure but works)
DROP POLICY IF EXISTS "Allow all inserts to users" ON public.users;
CREATE POLICY "Allow all inserts to users"
ON public.users
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all selects from users" ON public.users;
CREATE POLICY "Allow all selects from users"
ON public.users
FOR SELECT
USING (true);

-- Verify policies were created
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'users';

-- Alternative Option 2: Temporarily disable RLS (if Option 1 doesn't work)
-- Uncomment this if above doesn't work:
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

