-- ============================================================================
-- Update Early Career Flags for JobPing Database
-- ============================================================================
-- This script properly flags early career roles with is_graduate and is_internship
-- Currently only 50 jobs are flagged, but 5,330+ have early career keywords
-- ============================================================================

BEGIN;

-- Show current state
SELECT 
  COUNT(*) as total_active_jobs,
  COUNT(CASE WHEN is_graduate = true THEN 1 END) as currently_flagged_graduate,
  COUNT(CASE WHEN is_internship = true THEN 1 END) as currently_flagged_internship,
  COUNT(CASE WHEN LOWER(title) LIKE '%graduate%' THEN 1 END) as has_graduate_in_title,
  COUNT(CASE WHEN LOWER(title) LIKE '%intern%' OR LOWER(title) LIKE '%stage%' OR LOWER(title) LIKE '%praktik%' THEN 1 END) as has_intern_keywords,
  COUNT(CASE WHEN LOWER(title) LIKE '%trainee%' THEN 1 END) as has_trainee_in_title
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- 1. Flag Internship Roles
-- ============================================================================

UPDATE jobs
SET 
  is_internship = true,
  updated_at = now()
WHERE is_active = true
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%intern%'
    OR LOWER(title) LIKE '%internship%'
    OR LOWER(title) LIKE '%stage %'
    OR LOWER(title) LIKE '% stage'
    OR LOWER(title) LIKE '%stagiaire%'
    OR LOWER(title) LIKE '%praktikum%'
    OR LOWER(title) LIKE '%praktikant%'
    OR LOWER(title) LIKE '%tirocinio%'
    OR LOWER(title) LIKE '%placement%'
  );

-- ============================================================================
-- 2. Flag Graduate Roles
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND (
    LOWER(title) LIKE '%graduate%'
    OR LOWER(title) LIKE '%trainee%'
    OR LOWER(title) LIKE '%apprentice%'
    OR LOWER(title) LIKE '%grad %'
    OR LOWER(title) LIKE '% grad'
    OR LOWER(title) LIKE '%rotational%'
    OR LOWER(title) LIKE '%entry level%'
    OR LOWER(title) LIKE '%entry-level%'
    OR LOWER(title) LIKE '%new grad%'
  );

-- ============================================================================
-- 3. Flag Junior Roles (as graduate-level)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND LOWER(title) LIKE '%junior%';

-- ============================================================================
-- Show results after update
-- ============================================================================

SELECT 
  COUNT(*) as total_active_jobs,
  COUNT(CASE WHEN is_graduate = true THEN 1 END) as flagged_graduate,
  COUNT(CASE WHEN is_internship = true THEN 1 END) as flagged_internship,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as total_early_career_flagged,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as unflagged_jobs
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- Show breakdown of unflagged jobs (potential issues)
-- ============================================================================

SELECT 
  COUNT(*) as unflagged_count,
  source,
  SUBSTRING(title, 1, 50) as sample_titles
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
GROUP BY source, title
ORDER BY COUNT(*) DESC
LIMIT 20;

-- ============================================================================
-- Summary statistics by type
-- ============================================================================

SELECT 
  'Internships' as job_type,
  COUNT(*) as count,
  COUNT(DISTINCT location) as unique_locations,
  COUNT(DISTINCT company) as unique_companies
FROM jobs
WHERE is_active = true AND is_internship = true

UNION ALL

SELECT 
  'Graduate Roles' as job_type,
  COUNT(*) as count,
  COUNT(DISTINCT location) as unique_locations,
  COUNT(DISTINCT company) as unique_companies
FROM jobs
WHERE is_active = true AND is_graduate = true AND is_internship = false

UNION ALL

SELECT 
  'Unflagged Roles' as job_type,
  COUNT(*) as count,
  COUNT(DISTINCT location) as unique_locations,
  COUNT(DISTINCT company) as unique_companies
FROM jobs
WHERE is_active = true AND is_graduate = false AND is_internship = false;

COMMIT;

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================
-- Uncomment and run this if you need to reset flags:
--
-- BEGIN;
-- UPDATE jobs
-- SET 
--   is_graduate = false,
--   is_internship = false,
--   updated_at = now()
-- WHERE is_active = true;
-- COMMIT;
-- ============================================================================

