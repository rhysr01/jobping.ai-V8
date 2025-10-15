-- Fix Users Table RLS Policy to Allow Public Inserts
-- This enables the Tally webhook to create new users without authentication
--
-- Problem: The existing users_access_policy has no WITH CHECK clause,
-- which blocks public INSERTs (even though the webhook has a valid anon key)
--
-- Solution: Split the policy into separate policies for different operations
-- to allow public inserts while maintaining security for updates/deletes

-- Drop the problematic policy
DROP POLICY IF EXISTS users_access_policy ON users;

-- Create separate policies for better granularity

-- 1. Allow public to INSERT new users (for webhook signups)
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  TO public
  WITH CHECK (true);  -- Allow anyone to insert (webhook validation happens at app level)

-- 2. Allow users to SELECT their own data (and service_role to see all)
CREATE POLICY users_select_policy ON users
  FOR SELECT
  TO public
  USING (
    (auth.role() = 'service_role'::text)
    OR (id = auth.uid())
  );

-- 3. Allow users to UPDATE only their own data (and service_role to update all)
CREATE POLICY users_update_policy ON users
  FOR UPDATE
  TO public
  USING (
    (auth.role() = 'service_role'::text)
    OR (id = auth.uid())
  )
  WITH CHECK (
    (auth.role() = 'service_role'::text)
    OR (id = auth.uid())
  );

-- 4. Allow users to DELETE only their own data (and service_role to delete all)
CREATE POLICY users_delete_policy ON users
  FOR DELETE
  TO public
  USING (
    (auth.role() = 'service_role'::text)
    OR (id = auth.uid())
  );

-- Verify the policies are created
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN qual IS NULL THEN 'NO USING'
    ELSE 'HAS USING'
  END as has_using,
  CASE 
    WHEN with_check IS NULL THEN 'NO WITH CHECK'
    ELSE 'HAS WITH CHECK'
  END as has_with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

