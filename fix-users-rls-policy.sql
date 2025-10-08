-- Fix RLS policy for users table to allow webhook signups
-- Run this in Supabase SQL Editor

-- Allow inserts from service role (for webhook signups)
CREATE POLICY IF NOT EXISTS "Allow service role to insert users"
ON public.users
FOR INSERT
TO authenticated, service_role
WITH CHECK (true);

-- Also allow service role to select users (for duplicate checking)
CREATE POLICY IF NOT EXISTS "Allow service role to select users"
ON public.users
FOR SELECT
TO authenticated, service_role
USING (true);

-- Verify policies were created
SELECT tablename, policyname, cmd FROM pg_policies WHERE tablename = 'users';

