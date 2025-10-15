-- ============================================================================
-- Aggressive Analyst & Final Cleanup
-- ============================================================================
-- Flag ALL remaining Analyst roles + catch final edge cases
-- ============================================================================

BEGIN;

SELECT 
  'BEFORE AGGRESSIVE CLEANUP' as stage,
  COUNT(*) as total_active,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as flagged,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as unflagged
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- 1. Flag ALL Remaining Analyst Roles (Almost Always Entry-Level)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%analyst%';

SELECT 
  'After Analyst Roles' as stage,
  COUNT(*) as unflagged_remaining
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false;

-- ============================================================================
-- 2. Flag Remaining Associate Roles
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%associate%';

-- ============================================================================
-- 3. Flag Spanish "Asistente" (Assistant)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%asistente%';

-- ============================================================================
-- 4. Flag Special Programmes (#XPLORER, etc.)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%#xplorer%'
    OR LOWER(title) LIKE '%xplorer%'
    OR title ~ '202[56]'  -- Any role with 2025/2026 in title
  );

-- ============================================================================
-- 5. Flag Big 4/Consulting Early Career Programmes
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%valuation%modelling%'
    OR LOWER(title) LIKE '%valuation%modeling%'
  )
  AND company IN ('Deloitte', 'PwC', 'KPMG', 'EY', 'Pwc UK', 'KPMG UK', 'Deloitte UK', 'EY UK');

-- ============================================================================
-- 6. Filter Out Mid/Senior Level Roles
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'mid_senior_title',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- Supervisor/Coordinator = Mid-level
    LOWER(title) LIKE '%supervisor%'
    OR LOWER(title) LIKE '%coordinator%'
    
    -- Partner/Adviser = Senior
    OR LOWER(title) LIKE '%partner%'
    OR LOWER(title) LIKE '%adviser%'
    OR LOWER(title) LIKE '%advisor%'
    
    -- Spanish: "con experiencia" = with experience
    OR LOWER(title) LIKE '%con experiencia%'
    
    -- Specialist/Expert = Mid-level
    OR (LOWER(title) LIKE '%specialist%' AND LOWER(title) NOT LIKE '%graduate%')
    OR LOWER(title) LIKE '%expert%'
  );

-- ============================================================================
-- 7. Filter Out Generic Engineer/Developer Roles (No Clear Level)
-- ============================================================================
-- These are ambiguous without description - likely mid-level

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'ambiguous_level',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%engineer%'
    OR LOWER(title) LIKE '%developer%'
  )
  AND LOWER(title) NOT LIKE '%graduate%'
  AND LOWER(title) NOT LIKE '%junior%'
  AND LOWER(title) NOT LIKE '%trainee%';

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
  ROUND(100.0 * COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) / COUNT(*), 2) || '%' as pct_early_career
FROM jobs
WHERE is_active = true;

-- Jobs filtered out summary
SELECT 
  'JOBS FILTERED OUT' as summary;

SELECT 
  filtered_reason,
  COUNT(*) as count
FROM jobs
WHERE is_active = false
  AND filtered_reason IS NOT NULL
GROUP BY filtered_reason
ORDER BY COUNT(*) DESC;

-- Overall stats
SELECT 
  'OVERALL DATABASE STATS' as summary;

SELECT 
  COUNT(*) as total_jobs_in_db,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_jobs,
  COUNT(CASE WHEN is_active = false THEN 1 END) as filtered_jobs,
  COUNT(CASE WHEN is_active = true AND (is_graduate = true OR is_internship = true) THEN 1 END) as early_career_jobs
FROM jobs;

-- Sample of any remaining unflagged (should be minimal)
SELECT 
  'REMAINING UNFLAGGED (IF ANY)' as summary;

SELECT 
  title,
  company,
  location
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
ORDER BY created_at DESC
LIMIT 50;

COMMIT;

