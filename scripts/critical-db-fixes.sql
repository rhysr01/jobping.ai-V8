-- Critical Database Fixes for Category-Based Matching
-- This script addresses the most critical issues found in the database analysis

-- 1. FIX JOBS WITH ONLY 'early-career' CATEGORY
-- These 2,218 jobs need work type classification based on their content

-- Strategy & Business Design jobs
UPDATE jobs 
SET categories = categories || ARRAY['strategy-business-design']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(strategy|strategic|planning|business\s*planning|corporate\s*strategy|consulting|consultant|transformation)\b' OR
    LOWER(description) ~ '\b(strategy|strategic|planning|business\s*planning|corporate\s*strategy|consulting|consultant|transformation)\b'
  );

-- Data & Analytics jobs  
UPDATE jobs 
SET categories = categories || ARRAY['data-analytics']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(analyst|data|analytics|data\s*science|business\s*intelligence|bi|insights|reporting|research)\b' OR
    LOWER(description) ~ '\b(analyst|data|analytics|data\s*science|business\s*intelligence|bi|insights|reporting|research)\b'
  );

-- Marketing & Growth jobs
UPDATE jobs 
SET categories = categories || ARRAY['marketing-growth']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|content\s*marketing|social\s*media|communications)\b' OR
    LOWER(description) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|content\s*marketing|social\s*media|communications)\b'
  );

-- Tech & Transformation jobs
UPDATE jobs 
SET categories = categories || ARRAY['tech-transformation']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(tech|technology|digital|transformation|software|engineer|developer|programmer|it|systems)\b' OR
    LOWER(description) ~ '\b(tech|technology|digital|transformation|software|engineer|developer|programmer|it|systems)\b'
  );

-- Finance & Investment jobs
UPDATE jobs 
SET categories = categories || ARRAY['finance-investment']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(finance|financial|investment|banking|accounting|audit|treasury|fp&a|risk|credit)\b' OR
    LOWER(description) ~ '\b(finance|financial|investment|banking|accounting|audit|treasury|fp&a|risk|credit)\b'
  );

-- Sales & Client Success jobs
UPDATE jobs 
SET categories = categories || ARRAY['sales-client-success']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(sales|business\s*development|account\s*executive|customer\s*success|revenue|sdr|bdr|account\s*manager)\b' OR
    LOWER(description) ~ '\b(sales|business\s*development|account\s*executive|customer\s*success|revenue|sdr|bdr|account\s*manager)\b'
  );

-- Operations & Supply Chain jobs
UPDATE jobs 
SET categories = categories || ARRAY['operations-supply-chain']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(operations|supply\s*chain|logistics|procurement|inventory|fulfillment|sourcing|process)\b' OR
    LOWER(description) ~ '\b(operations|supply\s*chain|logistics|procurement|inventory|fulfillment|sourcing|process)\b'
  );

-- Product & Innovation jobs
UPDATE jobs 
SET categories = categories || ARRAY['product-innovation']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(product|innovation|ux|ui|design|research|development|user\s*experience)\b' OR
    LOWER(description) ~ '\b(product|innovation|ux|ui|design|research|development|user\s*experience)\b'
  );

-- 2. CLEAN UP OVERCATEGORIZED JOBS
-- Jobs with 5+ categories should be simplified to keep only the most relevant ones

-- For jobs with 5+ categories, keep early-career + top 2 work type categories
-- This is a simpler approach that removes excess categories
UPDATE jobs 
SET categories = ARRAY(
  SELECT DISTINCT unnest(categories)
  FROM (
    SELECT unnest(categories) as cat
    FROM jobs j2 
    WHERE j2.id = jobs.id
  ) t
  WHERE cat IN (
    'early-career',
    'strategy-business-design', 'data-analytics', 'marketing-growth', 
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  )
  ORDER BY 
    CASE cat
      WHEN 'early-career' THEN 1
      WHEN 'strategy-business-design' THEN 2
      WHEN 'data-analytics' THEN 3
      WHEN 'marketing-growth' THEN 4
      WHEN 'tech-transformation' THEN 5
      WHEN 'finance-investment' THEN 6
      WHEN 'sales-client-success' THEN 7
      WHEN 'operations-supply-chain' THEN 8
      WHEN 'product-innovation' THEN 9
      WHEN 'sustainability-esg' THEN 10
      ELSE 11
    END
  LIMIT 3
)
WHERE is_active = true 
  AND array_length(categories, 1) > 4;

-- 3. CREATE OPTIMIZED INDEXES FOR CATEGORY MATCHING

-- Main index for work type category filtering (most important)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_work_type_categories 
ON jobs USING gin (categories) 
WHERE is_active = true 
  AND categories && ARRAY[
    'strategy-business-design', 'data-analytics', 'marketing-growth', 
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  ];

-- Composite index for category + location matching (very common in user queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_category_location 
ON jobs USING btree (city, country) 
WHERE is_active = true 
  AND categories && ARRAY[
    'strategy-business-design', 'data-analytics', 'marketing-growth', 
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  ];

-- Index for early career + work type combinations (common pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_early_career_work_type 
ON jobs USING gin (categories) 
WHERE is_active = true 
  AND 'early-career' = ANY(categories)
  AND categories && ARRAY[
    'strategy-business-design', 'data-analytics', 'marketing-growth', 
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  ];

-- 4. UPDATE STATISTICS
ANALYZE jobs;

-- 5. VALIDATION - Check results
SELECT 
  'After optimization - Jobs with only early-career' as metric,
  COUNT(*) as count
FROM jobs 
WHERE is_active = true 
  AND categories = ARRAY['early-career'];

SELECT 
  'After optimization - Overcategorized jobs (5+ categories)' as metric,
  COUNT(*) as count
FROM jobs 
WHERE is_active = true 
  AND array_length(categories, 1) > 4;

-- Show work type category distribution
SELECT 
  'Work Type Category Distribution' as category_type,
  unnest(categories) as category,
  COUNT(*) as job_count
FROM jobs 
WHERE is_active = true 
  AND categories IS NOT NULL 
  AND array_length(categories, 1) > 0
  AND unnest(categories) IN (
    'strategy-business-design', 'data-analytics', 'marketing-growth', 
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  )
GROUP BY unnest(categories)
ORDER BY job_count DESC;
