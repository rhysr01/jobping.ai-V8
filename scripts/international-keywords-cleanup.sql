-- ============================================================================
-- International Keywords Cleanup - Final Pass
-- ============================================================================
-- Catches PhD positions, Werkstudent, VIE, and other European keywords
-- ============================================================================

BEGIN;

SELECT 
  'BEFORE INTERNATIONAL CLEANUP' as stage,
  COUNT(*) as total_active,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as flagged,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as unflagged
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- 1. Flag PhD Positions (Early Career Researchers)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%phd%'
    OR LOWER(title) LIKE '%ph.d%'
    OR LOWER(title) LIKE '%doctorate%'
    OR LOWER(title) LIKE '%doctoral%'
  );

-- ============================================================================
-- 2. Flag German Working Students (Werkstudent)
-- ============================================================================

UPDATE jobs
SET 
  is_internship = true,
  updated_at = now()
WHERE is_active = true
  AND is_internship = false
  AND LOWER(title) LIKE '%werkstudent%';

-- ============================================================================
-- 3. Flag Dutch/French Interns (Stagiair)
-- ============================================================================

UPDATE jobs
SET 
  is_internship = true,
  updated_at = now()
WHERE is_active = true
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%stagiair%'
    OR LOWER(title) LIKE '%stagiar%'
  );

-- ============================================================================
-- 4. Flag VIE (French International Volunteer Programme - Early Career)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%vie %'
    OR LOWER(title) LIKE '% vie'
    OR LOWER(title) LIKE '%vie-%'
  );

-- ============================================================================
-- 5. Flag Spanish "Recién Graduados" (Recent Graduates)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%recién graduado%';

-- ============================================================================
-- 6. Flag Spanish "Analista" Roles
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%analista%';

-- ============================================================================
-- 7. Filter Out Mid-Level International Keywords
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'mid_senior_international',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- German leadership roles
    LOWER(title) LIKE '%leitung%'
    OR LOWER(title) LIKE '%koordinierender%'
    OR LOWER(title) LIKE '%koordinierende%'
    OR LOWER(title) LIKE '%referent%in%'
    
    -- Spanish coordinator
    OR LOWER(title) LIKE '%coordinador%'
    OR LOWER(title) LIKE '%coordinadora%'
    
    -- Dutch mid-level
    OR LOWER(title) LIKE '%medior%'
    
    -- Academic mid-level
    OR LOWER(title) LIKE '%lecturer%'
    OR LOWER(title) LIKE '%sachbearbeit%'  -- German administrative officer
    
    -- Technical specialist roles
    OR LOWER(title) LIKE '%técnico%'
    OR LOWER(title) LIKE '%technicien%'
  );

-- ============================================================================
-- 8. Filter Out Specialized/Ambiguous Roles
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'specialized_ambiguous',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- Speech therapist, tutors etc - specialized roles
    LOWER(title) LIKE '%therapist%'
    OR LOWER(title) LIKE '%tutor%'
    
    -- Educator roles (Erzieher) - mid-career
    OR LOWER(title) LIKE '%erzieher%'
    
    -- Officer roles (not entry-level)
    OR (LOWER(title) LIKE '%officer%' AND LOWER(title) NOT LIKE '%graduate%')
    
    -- Trader (experienced role)
    OR LOWER(title) LIKE '%trader%'
    
    -- Delegado (delegate/representative - mid-level)
    OR LOWER(title) LIKE '%delegado%'
  );

-- ============================================================================
-- FINAL RESULTS
-- ============================================================================

SELECT 
  '========================================' as divider;

SELECT 
  'FINAL DATABASE STATE' as summary;

SELECT 
  COUNT(*) as total_active_jobs,
  COUNT(CASE WHEN is_internship = true THEN 1 END) as internships,
  COUNT(CASE WHEN is_graduate = true AND is_internship = false THEN 1 END) as graduate_early_career,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as total_early_career_flagged,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as unflagged_remaining,
  ROUND(100.0 * COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) / COUNT(*), 2) || '%' as pct_early_career_coverage
FROM jobs
WHERE is_active = true;

-- Summary by filtered reason
SELECT 
  'JOBS FILTERED OUT BY REASON' as summary;

SELECT 
  filtered_reason,
  COUNT(*) as count
FROM jobs
WHERE is_active = false
  AND filtered_reason IS NOT NULL
GROUP BY filtered_reason
ORDER BY COUNT(*) DESC;

-- Overall database summary
SELECT 
  'OVERALL DATABASE SUMMARY' as summary;

SELECT 
  COUNT(*) as total_jobs_in_database,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_early_career_jobs,
  COUNT(CASE WHEN is_active = false THEN 1 END) as filtered_non_early_career,
  ROUND(100.0 * COUNT(CASE WHEN is_active = true THEN 1 END) / COUNT(*), 2) || '%' as pct_active
FROM jobs;

-- Remaining unflagged (should be minimal)
SELECT 
  'REMAINING UNFLAGGED JOBS (IF ANY)' as summary;

SELECT 
  COUNT(*) as count
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false;

SELECT 
  title,
  company,
  location
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
ORDER BY created_at DESC
LIMIT 30;

COMMIT;

