-- ============================================================================
-- French & German Keywords - Final Cleanup
-- ============================================================================
-- Catches Alternance, Jobstudent, Doktoratsstelle, and filters remaining
-- mid-level roles
-- ============================================================================

BEGIN;

SELECT 
  'BEFORE FRENCH/GERMAN CLEANUP' as stage,
  COUNT(*) as total_active,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as flagged,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as unflagged
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- 1. Flag French "Alternance" (Work-Study Programmes)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%alternance%';

-- ============================================================================
-- 2. Flag German "Doktoratsstelle" (PhD Positions)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%doktoratsstelle%';

-- ============================================================================
-- 3. Flag "Jobstudent" (Belgian/Dutch Student Jobs)
-- ============================================================================

UPDATE jobs
SET 
  is_internship = true,
  updated_at = now()
WHERE is_active = true
  AND is_internship = false
  AND LOWER(title) LIKE '%jobstudent%';

-- ============================================================================
-- 4. Flag "Working Student" (We missed this!)
-- ============================================================================

UPDATE jobs
SET 
  is_internship = true,
  updated_at = now()
WHERE is_active = true
  AND is_internship = false
  AND LOWER(title) LIKE '%working student%';

-- ============================================================================
-- 5. Filter Out French Mid-Level Roles
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'french_mid_level',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- Responsable = Manager/Head of
    LOWER(title) LIKE '%responsable%'
    
    -- Comptable = Accountant (mid-level in France)
    OR LOWER(title) LIKE '%comptable%'
    
    -- Chargé(e) = Officer/In charge of (mid-level)
    OR (LOWER(title) LIKE '%chargé%' AND LOWER(title) NOT LIKE '%alternance%')
  );

-- ============================================================================
-- 6. Filter Out German Mid-Level Roles
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'german_mid_level',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- Personalreferent = HR Specialist
    LOWER(title) LIKE '%personalreferent%'
    
    -- Projektmitarbeiter = Project staff
    OR LOWER(title) LIKE '%projektmitarbeiter%'
    
    -- Kundenberater = Customer advisor
    OR LOWER(title) LIKE '%kundenberater%'
    
    -- Direktionsassistent = Director's assistant (senior support)
    OR LOWER(title) LIKE '%direktionsassistent%'
  );

-- ============================================================================
-- 7. Filter Out Generic Mid-Level Roles
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'generic_mid_level',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- HRBP = HR Business Partner
    LOWER(title) LIKE '%hrbp%'
    OR LOWER(title) LIKE '%hr business partner%'
    
    -- PMO = Project Management Office
    OR LOWER(title) LIKE '%pmo%'
    
    -- Economist (typically mid-level)
    OR LOWER(title) LIKE '%economist%'
    
    -- Mentor (experienced role)
    OR LOWER(title) LIKE '%mentor%'
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

-- Breakdown of filtered jobs
SELECT 
  'FILTERED JOBS BY REASON' as summary;

SELECT 
  filtered_reason,
  COUNT(*) as count
FROM jobs
WHERE is_active = false
  AND filtered_reason IS NOT NULL
GROUP BY filtered_reason
ORDER BY COUNT(*) DESC;

-- Complete database stats
SELECT 
  'COMPLETE DATABASE STATISTICS' as summary;

SELECT 
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_early_career,
  COUNT(CASE WHEN is_active = false THEN 1 END) as filtered_out,
  ROUND(100.0 * COUNT(CASE WHEN is_active = true THEN 1 END) / COUNT(*), 2) || '%' as pct_active,
  COUNT(CASE WHEN is_active = true AND is_internship = true THEN 1 END) as internships,
  COUNT(CASE WHEN is_active = true AND is_graduate = true THEN 1 END) as graduate_flagged
FROM jobs;

-- Any remaining unflagged
SELECT 
  'REMAINING UNFLAGGED (SHOULD BE <50)' as summary;

SELECT 
  title,
  company,
  location,
  source
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
ORDER BY created_at DESC
LIMIT 50;

COMMIT;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- After this script, your database should be:
-- - ~12,000-13,000 active early career jobs
-- - >98% early career coverage
-- - <50 unflagged jobs remaining (likely truly ambiguous)
-- ============================================================================

