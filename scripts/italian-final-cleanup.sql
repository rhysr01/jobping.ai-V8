-- ============================================================================
-- Italian Keywords & Final Edge Cases Cleanup
-- ============================================================================
-- Catches Stagista, ITP programmes, and filters remaining non-early-career
-- ============================================================================

BEGIN;

SELECT 
  'BEFORE ITALIAN CLEANUP' as stage,
  COUNT(*) as total_active,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as flagged,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as unflagged
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- 1. Flag Italian "Stagista" (Intern/Trainee)
-- ============================================================================

UPDATE jobs
SET 
  is_internship = true,
  updated_at = now()
WHERE is_active = true
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%stagista%'
    OR LOWER(title) LIKE '%stage)%'  -- "Receptionist front office hotel (stage)"
  );

-- ============================================================================
-- 2. Flag French "Alternant" (Work-Study)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%alternant%';

-- ============================================================================
-- 3. Flag "Candidature Spontanée - Stages" (French Internship Applications)
-- ============================================================================

UPDATE jobs
SET 
  is_internship = true,
  updated_at = now()
WHERE is_active = true
  AND is_internship = false
  AND LOWER(title) LIKE '%stages%';

-- ============================================================================
-- 4. Flag ITP/Graduate Programmes at Banks
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%itp%'
    OR LOWER(title) LIKE '%talent community%'
    OR LOWER(title) LIKE '%bankeinstieg%'  -- German bank entry
  );

-- ============================================================================
-- 5. Filter Out Academic Faculty Positions
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'academic_faculty',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%faculty%'
    OR LOWER(title) LIKE '%professor%'
    OR LOWER(title) LIKE '%lecturer%'
  );

-- ============================================================================
-- 6. Filter Out Qualified Professional Roles
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'qualified_professional',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- German Master qualifications
    LOWER(title) LIKE '%meister%'
    
    -- Healthcare professionals
    OR LOWER(title) LIKE '%therapist%'
    OR LOWER(title) LIKE '%therapeut%'
    
    -- Surveyors
    OR LOWER(title) LIKE '%surveyor%'
    
    -- Controllers
    OR LOWER(title) LIKE '%controller%'
    
    -- Trainers
    OR LOWER(title) LIKE '%trainer%'
    
    -- Facilitators
    OR LOWER(title) LIKE '%facilitator%'
  );

-- ============================================================================
-- 7. Filter Out Sales/Commercial Experienced Roles
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'sales_commercial_experienced',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- German sales roles (typically experienced)
    LOWER(title) LIKE '%vertriebsmitarbeiter%'
    
    -- Agents (experienced)
    OR LOWER(title) LIKE '%agente%'
    
    -- Italian specialized sales roles
    OR LOWER(title) LIKE '%addetto/a%alle vendite%'
  );

-- ============================================================================
-- 8. Filter Out Ambiguous/Generic Roles
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'ambiguous_generic',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- Vague titles without level indicators
    LOWER(title) LIKE '%picnic behind the scenes%'
    OR LOWER(title) LIKE '%opportunità%'  -- Generic opportunity
    OR LOWER(title) LIKE '%lavoro full time%'  -- Generic full time work
    OR LOWER(title) LIKE '%tempo pieno%'  -- Generic full time
    OR LOWER(title) LIKE '%comienza tu desarrollo%'  -- Generic career start
    
    -- Service technicians (experienced)
    OR LOWER(title) LIKE '%service-techniker%'
    OR LOWER(title) LIKE '%techniker%'
    
    -- Administrators (mid-level)
    OR (LOWER(title) LIKE '%administrator%' AND LOWER(title) NOT LIKE '%graduate%')
    
    -- Operatives (ambiguous/experienced)
    OR LOWER(title) LIKE '%operative%'
    
    -- Secretaries (mid-level support)
    OR LOWER(title) LIKE '%sekretär%'
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

-- Filtered jobs breakdown
SELECT 
  'FILTERED JOBS SUMMARY' as summary;

SELECT 
  filtered_reason,
  COUNT(*) as count
FROM jobs
WHERE is_active = false
  AND filtered_reason IS NOT NULL
GROUP BY filtered_reason
ORDER BY COUNT(*) DESC;

-- Complete database overview
SELECT 
  'COMPLETE DATABASE OVERVIEW' as summary;

SELECT 
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_early_career,
  COUNT(CASE WHEN is_active = false THEN 1 END) as filtered_out,
  ROUND(100.0 * COUNT(CASE WHEN is_active = true THEN 1 END) / COUNT(*), 2) || '%' as pct_active
FROM jobs;

-- Final unflagged (should be minimal)
SELECT 
  'REMAINING UNFLAGGED (GOAL: <20)' as summary;

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
LIMIT 20;

COMMIT;

-- ============================================================================
-- FINAL NOTE
-- ============================================================================
-- Your database is now optimized for early career roles!
-- Any remaining unflagged jobs are likely truly ambiguous or edge cases
-- that can be handled on a case-by-case basis or left for user matching.
-- ============================================================================

