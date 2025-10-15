-- ============================================================================
-- Flag Early Career Roles Using Description Analysis
-- ============================================================================
-- Uses both title and description to properly categorize remaining 6,726 jobs
-- Flags early-career roles and filters out mid-level positions
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: Flag German Apprenticeships (Ausbildung)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%ausbildung%'
    OR LOWER(title) LIKE '%fachausbildung%'
    OR LOWER(title) LIKE '%nachwuchsführungskraft%'
    OR LOWER(title) LIKE '%lehrling%'
    OR LOWER(title) LIKE '%azubi%'
    OR LOWER(title) LIKE '%apprentissage%'
  );

SELECT 
  'After German Apprenticeships' as stage,
  COUNT(*) as total_active,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as flagged_early_career,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as still_unflagged
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- PART 2: Flag Roles with Early Career Description Keywords
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND description IS NOT NULL
  AND (
    -- Years of experience indicators
    LOWER(description) LIKE '%0-1 year%'
    OR LOWER(description) LIKE '%0-2 year%'
    OR LOWER(description) LIKE '%0 to 1 year%'
    OR LOWER(description) LIKE '%0 to 2 year%'
    OR LOWER(description) LIKE '%no experience%'
    OR LOWER(description) LIKE '%little to no experience%'
    OR LOWER(description) LIKE '%minimal experience%'
    
    -- Entry level indicators
    OR LOWER(description) LIKE '%entry level%'
    OR LOWER(description) LIKE '%entry-level%'
    OR LOWER(description) LIKE '%early career%'
    OR LOWER(description) LIKE '%early-career%'
    OR LOWER(description) LIKE '%first role%'
    OR LOWER(description) LIKE '%first job%'
    OR LOWER(description) LIKE '%starting your career%'
    OR LOWER(description) LIKE '%kick-start your career%'
    OR LOWER(description) LIKE '%kickstart your career%'
    
    -- Graduate indicators
    OR LOWER(description) LIKE '%recent graduate%'
    OR LOWER(description) LIKE '%new graduate%'
    OR LOWER(description) LIKE '%newly qualified%'
    OR LOWER(description) LIKE '%graduate programme%'
    OR LOWER(description) LIKE '%graduate program%'
    OR LOWER(description) LIKE '%graduate scheme%'
    OR LOWER(description) LIKE '%graduate opportunity%'
    OR LOWER(description) LIKE '%fresh graduate%'
  );

SELECT 
  'After Description Keywords' as stage,
  COUNT(*) as total_active,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as flagged_early_career,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as still_unflagged
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- PART 3: Flag Assistant Roles (typically entry-level)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%assistant%';

SELECT 
  'After Assistant Roles' as stage,
  COUNT(*) as total_active,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as flagged_early_career,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as still_unflagged
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- PART 4: Deactivate Roles Requiring Significant Experience
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'requires_experience',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND description IS NOT NULL
  AND (
    -- Explicit years of experience
    LOWER(description) LIKE '%3+ year%'
    OR LOWER(description) LIKE '%4+ year%'
    OR LOWER(description) LIKE '%5+ year%'
    OR LOWER(description) LIKE '%3-5 year%'
    OR LOWER(description) LIKE '%5-7 year%'
    OR LOWER(description) LIKE '%7+ year%'
    OR LOWER(description) LIKE '%10+ year%'
    OR LOWER(description) LIKE '%minimum 3 year%'
    OR LOWER(description) LIKE '%minimum of 3 year%'
    OR LOWER(description) LIKE '%at least 3 year%'
    OR LOWER(description) LIKE '%at least 4 year%'
    OR LOWER(description) LIKE '%at least 5 year%'
    
    -- Experience descriptors
    OR LOWER(description) LIKE '%extensive experience%'
    OR LOWER(description) LIKE '%proven track record%'
    OR LOWER(description) LIKE '%significant experience%'
    OR LOWER(description) LIKE '%substantial experience%'
    OR LOWER(description) LIKE '%several years% experience%'
    OR LOWER(description) LIKE '%many years% experience%'
    OR LOWER(description) LIKE '%years of proven%'
    OR LOWER(description) LIKE '%demonstrated experience%'
  );

SELECT 
  'After Filtering Experience Requirements' as stage,
  COUNT(*) as total_active,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as flagged_early_career,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as still_unflagged
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- PART 5: Flag Common Entry-Level Analyst/Associate Titles
-- ============================================================================
-- Banking/Finance: "Analyst" and "Associate" are typically entry-level
-- Consulting: "Consultant" can be entry-level, "Associate" definitely is

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- Investment Banking Analysts (entry-level)
    LOWER(title) LIKE '%investment%analyst%'
    OR LOWER(title) LIKE '%banking%analyst%'
    OR LOWER(title) LIKE '%m&a%analyst%'
    
    -- Finance Analysts (often entry-level)
    OR LOWER(title) LIKE '%financial analyst%'
    OR LOWER(title) LIKE '%finance analyst%'
    OR LOWER(title) LIKE '%fp&a analyst%'
    
    -- Data Analysts (often entry-level)
    OR LOWER(title) LIKE '%data analyst%'
    OR LOWER(title) LIKE '%business analyst%'
    OR LOWER(title) LIKE '%operations analyst%'
    
    -- Associates in banking/finance (entry-level in Europe)
    OR (LOWER(title) LIKE '%associate%' AND LOWER(title) NOT LIKE '%senior%')
  )
  -- Only if description doesn't indicate mid/senior level
  AND (
    description IS NULL
    OR (
      LOWER(description) NOT LIKE '%5+ year%'
      AND LOWER(description) NOT LIKE '%7+ year%'
      AND LOWER(description) NOT LIKE '%extensive experience%'
      AND LOWER(description) NOT LIKE '%proven track record%'
    )
  );

SELECT 
  'After Analyst/Associate Roles' as stage,
  COUNT(*) as total_active,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as flagged_early_career,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as still_unflagged
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- FINAL RESULTS & SUMMARY
-- ============================================================================

SELECT 
  '=== FINAL BREAKDOWN ===' as summary;

SELECT 
  COUNT(*) as total_active_jobs,
  COUNT(CASE WHEN is_internship = true THEN 1 END) as internships,
  COUNT(CASE WHEN is_graduate = true AND is_internship = false THEN 1 END) as graduate_roles,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as still_unflagged,
  ROUND(100.0 * COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) / COUNT(*), 2) as pct_early_career
FROM jobs
WHERE is_active = true;

-- Show what was filtered out
SELECT 
  COUNT(*) as jobs_filtered_out,
  filtered_reason
FROM jobs
WHERE is_active = false
  AND filtered_reason IS NOT NULL
GROUP BY filtered_reason
ORDER BY COUNT(*) DESC;

-- Sample of remaining unflagged jobs
SELECT 
  'Sample Unflagged Jobs' as info;

SELECT 
  title,
  company,
  location,
  SUBSTRING(description, 1, 100) as description_preview
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
ORDER BY created_at DESC
LIMIT 20;

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
-- After running this script, remaining unflagged jobs may be:
-- 1. Legitimately ambiguous roles that could suit early-career candidates
-- 2. Poorly described jobs without clear experience requirements
-- 3. Non-standard job titles that don't fit typical patterns
--
-- You may want to keep these for matching or apply additional filters
-- ============================================================================

