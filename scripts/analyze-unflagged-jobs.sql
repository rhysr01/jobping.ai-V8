-- ============================================================================
-- Analyze Unflagged Jobs in JobPing Database
-- ============================================================================
-- 6,726 jobs remain unflagged - let's see what they are
-- ============================================================================

-- ============================================================================
-- 1. Most common job titles (unflagged)
-- ============================================================================

SELECT 
  SUBSTRING(title, 1, 60) as job_title,
  COUNT(*) as count,
  ARRAY_AGG(DISTINCT company) FILTER (WHERE company IS NOT NULL) as sample_companies
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
GROUP BY SUBSTRING(title, 1, 60)
ORDER BY COUNT(*) DESC
LIMIT 30;

-- ============================================================================
-- 2. Check for common patterns that might indicate entry-level
-- ============================================================================

SELECT 
  'Analyst roles' as category,
  COUNT(*) as count
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%analyst%'

UNION ALL

SELECT 
  'Associate roles' as category,
  COUNT(*) as count
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%associate%'

UNION ALL

SELECT 
  'Consultant roles' as category,
  COUNT(*) as count
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%consultant%'

UNION ALL

SELECT 
  'Assistant roles' as category,
  COUNT(*) as count
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%assistant%'

UNION ALL

SELECT 
  'Developer/Engineer roles' as category,
  COUNT(*) as count
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (LOWER(title) LIKE '%developer%' OR LOWER(title) LIKE '%engineer%')

UNION ALL

SELECT 
  'Other unflagged' as category,
  COUNT(*) as count
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) NOT LIKE '%analyst%'
  AND LOWER(title) NOT LIKE '%associate%'
  AND LOWER(title) NOT LIKE '%consultant%'
  AND LOWER(title) NOT LIKE '%assistant%'
  AND LOWER(title) NOT LIKE '%developer%'
  AND LOWER(title) NOT LIKE '%engineer%';

-- ============================================================================
-- 3. Sample of each category
-- ============================================================================

-- Analyst roles sample
SELECT 'ANALYST ROLES' as category, title, company, location
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%analyst%'
ORDER BY created_at DESC
LIMIT 10;

-- Associate roles sample
SELECT 'ASSOCIATE ROLES' as category, title, company, location
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND LOWER(title) LIKE '%associate%'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 4. Check for roles that might be mid-level (missed in first cleanup)
-- ============================================================================

SELECT 
  title,
  company,
  location,
  'Potential mid-level' as reason
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
  AND (
    LOWER(title) LIKE '%coordinator%'
    OR LOWER(title) LIKE '%specialist%'
    OR LOWER(title) LIKE '%officer%'
    OR LOWER(title) LIKE '%professional%'
    OR LOWER(title) LIKE '%fellow%'
    OR LOWER(title) LIKE '%staff %'
    OR LOWER(title) LIKE '% staff'
    OR title ~ '\d+\s*years'  -- Contains "2 years", "3+ years" etc
    OR title ~ '\d+\+'  -- Contains "2+", "3+" etc
  )
LIMIT 30;

-- ============================================================================
-- 5. Breakdown by source
-- ============================================================================

SELECT 
  source,
  COUNT(*) as unflagged_count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM jobs
WHERE is_active = true
  AND is_graduate = false
  AND is_internship = false
GROUP BY source
ORDER BY COUNT(*) DESC;

