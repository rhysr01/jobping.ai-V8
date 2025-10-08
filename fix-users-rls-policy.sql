-- Fix RLS policy for users table to allow webhook signups
-- Run this in Supabase SQL Editor

-- The issue: jobping_users_own_data requires auth.uid() which is null for webhooks
-- This policy blocks all unauthenticated inserts

-- SOLUTION: Drop the restrictive policy for now
DROP POLICY IF EXISTS "jobping_users_own_data" ON public.users;

-- Keep the permissive service access policy
-- (jobping_users_service_access with qual=true should allow inserts)

-- Verify remaining policies
SELECT policyname, cmd, qual::text, with_check::text 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;

