-- Fix RLS policies for matches and match_logs tables
-- AND fix missing ai_cost_usd column

BEGIN;

-- ============================================================================
-- 1. FIX MATCHES TABLE RLS
-- ============================================================================

SELECT '1️⃣ Fixing matches table RLS policies...' as status;

-- Add policies for service_role and anon to insert matches
CREATE POLICY IF NOT EXISTS matches_insert_service_role ON matches
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS matches_insert_anon ON matches
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS matches_insert_public ON matches
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add SELECT policies if needed
CREATE POLICY IF NOT EXISTS matches_select_own ON matches
  FOR SELECT
  TO public
  USING (user_email = auth.jwt()->>'email' OR auth.role() = 'service_role');

-- ============================================================================
-- 2. FIX MATCH_LOGS TABLE
-- ============================================================================

SELECT '2️⃣ Fixing match_logs table...' as status;

-- Check if ai_cost_usd column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'match_logs' 
    AND column_name = 'ai_cost_usd'
  ) THEN
    ALTER TABLE match_logs ADD COLUMN ai_cost_usd NUMERIC(10, 6) DEFAULT 0;
    RAISE NOTICE 'Added ai_cost_usd column to match_logs';
  ELSE
    RAISE NOTICE 'ai_cost_usd column already exists';
  END IF;
END $$;

-- Add RLS policies for match_logs
CREATE POLICY IF NOT EXISTS match_logs_insert_service_role ON match_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS match_logs_insert_anon ON match_logs
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS match_logs_insert_public ON match_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- ============================================================================
-- 3. VERIFY
-- ============================================================================

SELECT '✅ Verification - matches policies:' as status;

SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'matches'
AND cmd = 'INSERT'
ORDER BY policyname;

SELECT '✅ Verification - match_logs policies:' as status;

SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'match_logs'
AND cmd = 'INSERT'
ORDER BY policyname;

SELECT '✅ Verification - ai_cost_usd column:' as status;

SELECT 
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'match_logs'
AND column_name = 'ai_cost_usd';

COMMIT;

SELECT '🎉 SUCCESS! All fixes applied!' as status;

