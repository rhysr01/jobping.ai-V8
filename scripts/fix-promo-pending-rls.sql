-- ============================================================================
-- Fix RLS Policy for promo_pending Table
-- ============================================================================
-- Issue: API can't insert into promo_pending due to missing with_check clause
-- Error: "new row violates row-level security policy for table promo_pending"
-- ============================================================================

BEGIN;

-- Show current policies
SELECT 
  'BEFORE FIX - Current Policies' as status;

SELECT 
  policyname,
  cmd,
  qual IS NOT NULL as has_using_check,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE tablename = 'promo_pending';

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "promo_pending_access" ON promo_pending;

-- Option 1: Simple public access (recommended for promo codes)
-- Anyone can insert a promo, but only see their own
CREATE POLICY "promo_pending_insert" 
ON promo_pending
FOR INSERT
TO public
WITH CHECK (true);  -- Allow anyone to insert

CREATE POLICY "promo_pending_select" 
ON promo_pending
FOR SELECT
TO public
USING (email = auth.jwt()->>'email' OR auth.role() = 'service_role');

-- Show new policies
SELECT 
  'AFTER FIX - New Policies' as status;

SELECT 
  policyname,
  cmd,
  qual as using_check,
  with_check
FROM pg_policies
WHERE tablename = 'promo_pending'
ORDER BY policyname;

-- Test insert (will rollback since we're in a transaction)
DO $$
BEGIN
  -- This should work now
  INSERT INTO promo_pending (email, promo_code, expires_at)
  VALUES ('test@example.com', 'TEST123', now() + interval '7 days');
  
  RAISE NOTICE 'Test insert successful!';
  
  -- Clean up test data
  DELETE FROM promo_pending WHERE email = 'test@example.com';
END $$;

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running this:
-- 1. Your API route should be able to insert promo codes
-- 2. Users can only see their own promo codes
-- 3. Service role has full access via the existing service_role policy
-- ============================================================================

