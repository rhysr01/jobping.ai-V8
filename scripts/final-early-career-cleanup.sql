-- ============================================================================
-- Final Early Career Cleanup - Catch Remaining Edge Cases
-- ============================================================================
-- Addresses Spanish/French/Italian keywords, Insight programmes, and more
-- ============================================================================

BEGIN;

-- Show current state
SELECT 
  COUNT(*) as total_active,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as currently_flagged,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as still_unflagged
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- 1. Flag Spanish/Italian/French Internship Keywords
-- ============================================================================

UPDATE jobs
SET 
  is_internship = true,
  updated_at = now()
WHERE is_active = true
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%prácticas%'
    OR LOWER(title) LIKE '%practicas%'
    OR LOWER(title) LIKE '%beca %'
    OR LOWER(title) LIKE '% beca'
    OR LOWER(title) LIKE '%becario%'
    OR LOWER(title) LIKE '%tirocinio%'
    OR LOWER(title) LIKE '%tirocinante%'
  );

-- ============================================================================
-- 2. Flag Insight/Spring/Assessment Programmes (Early Career Schemes)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%insight%'
    OR LOWER(title) LIKE '%spring week%'
    OR LOWER(title) LIKE '%spring program%'
    OR LOWER(title) LIKE '%spring programme%'
    OR LOWER(title) LIKE '%assessment centre%'
    OR LOWER(title) LIKE '%discovery%program%'
    OR LOWER(title) LIKE '%discovery%programme%'
  );

-- ============================================================================
-- 3. Flag Year-Specific Programmes (2025/2026 = Early Career)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    title ~ '202[56].*analyst'
    OR title ~ '202[56].*associate'
    OR title ~ '202[56].*programme'
    OR title ~ '202[56].*program'
  );

-- ============================================================================
-- 4. Flag Specific Entry-Level Finance/Consulting Analyst Roles
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    -- Private Equity/Investment Banking Analysts (always entry-level)
    LOWER(title) LIKE '%pe analyst%'
    OR LOWER(title) LIKE '%private equity analyst%'
    OR LOWER(title) LIKE '%ib analyst%'
    OR LOWER(title) LIKE '%investment banking analyst%'
    OR LOWER(title) LIKE '%m&a analyst%'
    OR LOWER(title) LIKE '%corporate finance analyst%'
    OR LOWER(title) LIKE '%private markets analyst%'
    OR LOWER(title) LIKE '%fund analyst%'
    OR LOWER(title) LIKE '%investment strategy analyst%'
    
    -- Risk/Compliance Analysts (often entry-level)
    OR LOWER(title) LIKE '%risk analyst%'
    OR LOWER(title) LIKE '%compliance analyst%'
    OR LOWER(title) LIKE '%operational risk analyst%'
    
    -- Quant roles
    OR LOWER(title) LIKE '%quantitative analyst%'
    OR LOWER(title) LIKE '%quantitative developer analyst%'
    OR LOWER(title) LIKE '%quantitative engineer%'
    
    -- BI/Reporting
    OR LOWER(title) LIKE '%business intelligence analyst%'
    OR LOWER(title) LIKE '%reporting analyst%'
  );

-- ============================================================================
-- 5. Flag Jobs with "Fellow" (Academic/Research Early Career)
-- ============================================================================

UPDATE jobs
SET 
  is_graduate = true,
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%fellow%'
  AND LOWER(title) NOT LIKE '%senior%';

-- ============================================================================
-- 6. Deactivate Clearly Mid-Level Roles (Accountant, Consultant patterns)
-- ============================================================================

UPDATE jobs
SET 
  is_active = false,
  filtered_reason = 'mid_level_title',
  updated_at = now()
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%management accountant%'
    OR LOWER(title) LIKE '%commercial consultant%'
    OR (LOWER(title) LIKE '%consultant%' AND LOWER(title) NOT LIKE '%graduate%' AND LOWER(title) NOT LIKE '%junior%')
  );

-- ============================================================================
-- RESULTS
-- ============================================================================

SELECT 
  '=== FINAL STATE ===' as summary;

SELECT 
  COUNT(*) as total_active_jobs,
  COUNT(CASE WHEN is_internship = true THEN 1 END) as internships,
  COUNT(CASE WHEN is_graduate = true AND is_internship = false THEN 1 END) as graduate_roles,
  COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) as total_early_career,
  COUNT(CASE WHEN is_graduate = false AND is_internship = false THEN 1 END) as still_unflagged,
  ROUND(100.0 * COUNT(CASE WHEN is_graduate = true OR is_internship = true THEN 1 END) / COUNT(*), 2) as pct_early_career
FROM jobs
WHERE is_active = true;

-- Summary of all filtering
SELECT 
  filtered_reason,
  COUNT(*) as count
FROM jobs
WHERE is_active = false
  AND filtered_reason IS NOT NULL
GROUP BY filtered_reason
ORDER BY COUNT(*) DESC;

-- Final sample of unflagged (if any remain)
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

