-- ============================================================================
-- Fix All RLS Policies for JobPing
-- ============================================================================
-- This script fixes RLS policies on:
-- 1. promo_pending table (for promo code applications)
-- 2. users table (for Tally webhook signups)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FIX PROMO_PENDING TABLE
-- ============================================================================

SELECT '1️⃣ Fixing promo_pending RLS policies...' as status;

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "promo_pending_access" ON promo_pending;

-- Allow anyone to insert a promo code
CREATE POLICY "promo_pending_insert" 
ON promo_pending
FOR INSERT
TO public
WITH CHECK (true);  -- Allow public inserts (webhook uses anon key)

-- Allow users to see only their own promo codes
CREATE POLICY "promo_pending_select" 
ON promo_pending
FOR SELECT
TO public
USING (email = auth.jwt()->>'email' OR auth.role() = 'service_role');

-- ============================================================================
-- 2. FIX USERS TABLE
-- ============================================================================

SELECT '2️⃣ Fixing users table RLS policies...' as status;

-- Drop the problematic policy
DROP POLICY IF EXISTS users_access_policy ON users;

-- Create separate policies for better granularity

-- Allow public to INSERT new users (for webhook signups)
CREATE POLICY users_insert_policy ON users
  FOR INSERT
  TO public
  WITH CHECK (true);  -- Allow anyone to insert (webhook validation happens at app level)

-- Allow users to SELECT their own data (and service_role to see all)
CREATE POLICY users_select_policy ON users
  FOR SELECT
  TO public
  USING (
    (auth.role() = 'service_role'::text)
    OR (id = auth.uid())
  );

-- Allow users to UPDATE only their own data (and service_role to update all)
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

-- Allow users to DELETE only their own data (and service_role to delete all)
CREATE POLICY users_delete_policy ON users
  FOR DELETE
  TO public
  USING (
    (auth.role() = 'service_role'::text)
    OR (id = auth.uid())
  );

-- ============================================================================
-- 3. VERIFY ALL POLICIES
-- ============================================================================

SELECT '✅ Verification - promo_pending policies:' as status;

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
WHERE tablename = 'promo_pending'
ORDER BY policyname;

SELECT '✅ Verification - users policies:' as status;

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

COMMIT;

-- ============================================================================
-- SUCCESS! 🎉
-- ============================================================================
-- After running this script:
-- ✅ Promo code applications will work
-- ✅ Tally webhook signups will work
-- ✅ Users can only access their own data
-- ✅ Service role has full access to everything
-- ============================================================================

