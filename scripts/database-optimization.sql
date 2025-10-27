-- Database Optimization for Category-Based Matching
-- This script optimizes the database for the new category mapping system

-- 1. CLEAN UP OVERCATEGORIZED JOBS
-- Jobs with 5+ categories are likely over-tagged and should be simplified

-- First, let's see what we're dealing with
SELECT 
  'Overcategorized jobs' as issue,
  COUNT(*) as count
FROM jobs 
WHERE is_active = true 
  AND array_length(categories, 1) > 4;

-- Clean up jobs with too many categories by keeping only the most relevant ones
-- This is a conservative approach - we'll keep early-career + top 2 work type categories
UPDATE jobs 
SET categories = ARRAY(
  SELECT unnest(categories) 
  WHERE unnest(categories) IN (
    'early-career',
    (SELECT unnest(categories) 
     FROM jobs j2 
     WHERE j2.id = jobs.id 
       AND unnest(categories) IN (
         'strategy-business-design', 'data-analytics', 'marketing-growth', 
         'tech-transformation', 'finance-investment', 'sales-client-success',
         'operations-supply-chain', 'product-innovation', 'sustainability-esg'
       )
     ORDER BY 
       CASE unnest(categories)
         WHEN 'strategy-business-design' THEN 1
         WHEN 'data-analytics' THEN 2
         WHEN 'marketing-growth' THEN 3
         WHEN 'tech-transformation' THEN 4
         WHEN 'finance-investment' THEN 5
         WHEN 'sales-client-success' THEN 6
         WHEN 'operations-supply-chain' THEN 7
         WHEN 'product-innovation' THEN 8
         WHEN 'sustainability-esg' THEN 9
         ELSE 10
       END
     LIMIT 2)
  )
)
WHERE is_active = true 
  AND array_length(categories, 1) > 4;

-- 2. FIX JOBS WITH ONLY SENIORITY LEVELS
-- Jobs with only 'early-career' should be classified by their job title/description

-- Add work type categories based on job title patterns
UPDATE jobs 
SET categories = categories || ARRAY['strategy-business-design']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(strategy|strategic|planning|business\s*planning|corporate\s*strategy|consulting|consultant)\b' OR
    LOWER(description) ~ '\b(strategy|strategic|planning|business\s*planning|corporate\s*strategy|consulting|consultant)\b'
  );

UPDATE jobs 
SET categories = categories || ARRAY['data-analytics']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(analyst|data|analytics|data\s*science|business\s*intelligence|bi|insights|reporting)\b' OR
    LOWER(description) ~ '\b(analyst|data|analytics|data\s*science|business\s*intelligence|bi|insights|reporting)\b'
  );

UPDATE jobs 
SET categories = categories || ARRAY['marketing-growth']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|content\s*marketing|social\s*media)\b' OR
    LOWER(description) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|content\s*marketing|social\s*media)\b'
  );

UPDATE jobs 
SET categories = categories || ARRAY['tech-transformation']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(tech|technology|digital|transformation|software|engineer|developer|programmer)\b' OR
    LOWER(description) ~ '\b(tech|technology|digital|transformation|software|engineer|developer|programmer)\b'
  );

UPDATE jobs 
SET categories = categories || ARRAY['finance-investment']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(finance|financial|investment|banking|accounting|audit|treasury|fp&a)\b' OR
    LOWER(description) ~ '\b(finance|financial|investment|banking|accounting|audit|treasury|fp&a)\b'
  );

UPDATE jobs 
SET categories = categories || ARRAY['sales-client-success']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(sales|business\s*development|account\s*executive|customer\s*success|revenue|sdr|bdr)\b' OR
    LOWER(description) ~ '\b(sales|business\s*development|account\s*executive|customer\s*success|revenue|sdr|bdr)\b'
  );

UPDATE jobs 
SET categories = categories || ARRAY['operations-supply-chain']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(operations|supply\s*chain|logistics|procurement|inventory|fulfillment|sourcing)\b' OR
    LOWER(description) ~ '\b(operations|supply\s*chain|logistics|procurement|inventory|fulfillment|sourcing)\b'
  );

UPDATE jobs 
SET categories = categories || ARRAY['product-innovation']
WHERE is_active = true 
  AND categories = ARRAY['early-career']
  AND (
    LOWER(title) ~ '\b(product|innovation|ux|ui|design|research|development)\b' OR
    LOWER(description) ~ '\b(product|innovation|ux|ui|design|research|development)\b'
  );

-- 3. CREATE OPTIMIZED INDEXES FOR CATEGORY MATCHING

-- Index for work type categories (most important for matching)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_work_type_categories 
ON jobs USING gin (categories) 
WHERE is_active = true 
  AND categories && ARRAY[
    'strategy-business-design', 'data-analytics', 'marketing-growth', 
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  ];

-- Composite index for category + location matching (very common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_category_location 
ON jobs USING btree (city, country) 
WHERE is_active = true 
  AND categories && ARRAY[
    'strategy-business-design', 'data-analytics', 'marketing-growth', 
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  ];

-- Index for early career + work type combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_early_career_work_type 
ON jobs USING gin (categories) 
WHERE is_active = true 
  AND 'early-career' = ANY(categories)
  AND categories && ARRAY[
    'strategy-business-design', 'data-analytics', 'marketing-growth', 
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  ];

-- Index for specific work type categories (for fast filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_strategy_business_design 
ON jobs USING btree (id) 
WHERE is_active = true 
  AND 'strategy-business-design' = ANY(categories);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_data_analytics 
ON jobs USING btree (id) 
WHERE is_active = true 
  AND 'data-analytics' = ANY(categories);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_marketing_growth 
ON jobs USING btree (id) 
WHERE is_active = true 
  AND 'marketing-growth' = ANY(categories);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_tech_transformation 
ON jobs USING btree (id) 
WHERE is_active = true 
  AND 'tech-transformation' = ANY(categories);

-- 4. CREATE STATISTICS FOR BETTER QUERY PLANNING
ANALYZE jobs;

-- 5. VALIDATION QUERIES
-- Check the results of our optimization

-- Show category distribution after cleanup
SELECT 
  'Category Distribution After Cleanup' as metric,
  unnest(categories) as category,
  COUNT(*) as job_count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM jobs WHERE is_active = true), 2) as percentage
FROM jobs 
WHERE is_active = true 
  AND categories IS NOT NULL 
  AND array_length(categories, 1) > 0
GROUP BY unnest(categories)
ORDER BY job_count DESC;

-- Show jobs with only seniority levels (should be much fewer now)
SELECT 
  'Jobs with only seniority levels' as issue,
  COUNT(*) as count
FROM jobs 
WHERE is_active = true 
  AND categories = ARRAY['early-career'];

-- Show overcategorized jobs (should be 0 now)
SELECT 
  'Overcategorized jobs (5+ categories)' as issue,
  COUNT(*) as count
FROM jobs 
WHERE is_active = true 
  AND array_length(categories, 1) > 4;

-- Show work type category distribution
SELECT 
  'Work Type Categories' as category_type,
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
