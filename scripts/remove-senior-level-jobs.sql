-- ============================================================================
-- Remove Senior-Level Jobs from JobPing Database
-- ============================================================================
-- This script marks all mid-to-senior level jobs as inactive
-- JobPing is focused on early career roles (graduate/intern/junior only)
-- 
-- Jobs are marked inactive (not deleted) so they can be recovered if needed
-- ============================================================================

BEGIN;

-- Show what we're about to update
SELECT 
  COUNT(*) as total_jobs_to_deactivate,
  COUNT(DISTINCT source) as sources_affected,
  COUNT(DISTINCT location) as locations_affected
FROM jobs
WHERE is_active = true
  AND (
    LOWER(title) LIKE '%senior%'
    OR LOWER(title) LIKE '%lead %'
    OR LOWER(title) LIKE '% lead'
    OR LOWER(title) LIKE '%manager%'
    OR LOWER(title) LIKE '%director%'
    OR LOWER(title) LIKE '%head of%'
    OR LOWER(title) LIKE '%principal%'
    OR LOWER(title) LIKE '% vp%'
    OR LOWER(title) LIKE '%vice president%'
    OR LOWER(title) LIKE '%chief %'
    OR LOWER(title) LIKE '%architect%'
    OR LOWER(title) LIKE '%expert%'
    OR LOWER(title) LIKE '%executive%'
  );

-- Sample of jobs that will be deactivated (first 10)
SELECT 
  id,
  title,
  company,
  location,
  source,
  created_at
FROM jobs
WHERE is_active = true
  AND (
    LOWER(title) LIKE '%senior%'
    OR LOWER(title) LIKE '%lead %'
    OR LOWER(title) LIKE '% lead'
    OR LOWER(title) LIKE '%manager%'
    OR LOWER(title) LIKE '%director%'
    OR LOWER(title) LIKE '%head of%'
    OR LOWER(title) LIKE '%principal%'
    OR LOWER(title) LIKE '% vp%'
    OR LOWER(title) LIKE '%vice president%'
    OR LOWER(title) LIKE '%chief %'
    OR LOWER(title) LIKE '%architect%'
    OR LOWER(title) LIKE '%expert%'
    OR LOWER(title) LIKE '%executive%'
  )
ORDER BY created_at DESC
LIMIT 10;

-- Mark senior-level jobs as inactive
UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'senior_level_role',
  updated_at = now()
WHERE is_active = true
  AND (
    LOWER(title) LIKE '%senior%'
    OR LOWER(title) LIKE '%lead %'
    OR LOWER(title) LIKE '% lead'
    OR LOWER(title) LIKE '%manager%'
    OR LOWER(title) LIKE '%director%'
    OR LOWER(title) LIKE '%head of%'
    OR LOWER(title) LIKE '%principal%'
    OR LOWER(title) LIKE '% vp%'
    OR LOWER(title) LIKE '%vice president%'
    OR LOWER(title) LIKE '%chief %'
    OR LOWER(title) LIKE '%architect%'
    OR LOWER(title) LIKE '%expert%'
    OR LOWER(title) LIKE '%executive%'
  );

-- Show results
SELECT 
  COUNT(*) as total_active_jobs_remaining,
  COUNT(CASE WHEN filtered_reason = 'senior_level_role' THEN 1 END) as jobs_marked_as_senior
FROM jobs;

-- Show breakdown of remaining active jobs
SELECT 
  COUNT(*) as total_active,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as graduate_or_intern_flagged,
  COUNT(CASE WHEN LOWER(title) LIKE '%graduate%' OR LOWER(title) LIKE '%intern%' OR LOWER(title) LIKE '%trainee%' OR LOWER(title) LIKE '%junior%' THEN 1 END) as early_career_in_title
FROM jobs
WHERE is_active = true;

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
-- Uncomment and run this if you need to reactivate senior roles:
--
-- BEGIN;
-- UPDATE jobs
-- SET 
--   is_active = true,
--   filtered_reason = NULL,
--   updated_at = now()
-- WHERE filtered_reason = 'senior_level_role';
-- COMMIT;
-- ============================================================================

