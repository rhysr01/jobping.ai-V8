-- Safe Database Optimization for Category-Based Matching
-- Step-by-step approach with simple, reliable SQL statements

-- STEP 1: CREATE A TEMPORARY TABLE FOR CATEGORY CLEANUP
-- This avoids complex set-returning functions in UPDATE statements

CREATE TEMP TABLE IF NOT EXISTS jobs_to_fix AS
SELECT id, categories
FROM jobs
WHERE is_active = true
  AND array_length(categories, 1) > 4;

-- Show what we're fixing
SELECT COUNT(*) as jobs_to_cleanup FROM jobs_to_fix;

-- STEP 2: SIMPLIFY OVERCATEGORIZED JOBS
-- Keep only early-career + the most relevant work type category

-- Strategy jobs (highest priority)
UPDATE jobs
SET categories = ARRAY['early-career', 'strategy-business-design']
WHERE id IN (SELECT id FROM jobs_to_fix)
  AND 'early-career' = ANY(categories)
  AND (
    'strategy-business-design' = ANY(categories) OR
    LOWER(title) ~ '\b(strategy|strategic|planning|business\s*planning|corporate\s*strategy|consulting|consultant)\b'
  );

-- Data jobs
UPDATE jobs
SET categories = ARRAY['early-career', 'data-analytics']
WHERE id IN (SELECT id FROM jobs_to_fix)
  AND categories != ARRAY['early-career', 'strategy-business-design']
  AND (
    'data-analytics' = ANY(categories) OR
    LOWER(title) ~ '\b(analyst|data|analytics|data\s*science|business\s*intelligence|bi|insights|reporting)\b'
  );

-- Marketing jobs
UPDATE jobs
SET categories = ARRAY['early-career', 'marketing-growth']
WHERE id IN (SELECT id FROM jobs_to_fix)
  AND categories NOT IN (ARRAY['early-career', 'strategy-business-design'], ARRAY['early-career', 'data-analytics'])
  AND (
    'marketing-growth' = ANY(categories) OR
    LOWER(title) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|content\s*marketing|social\s*media)\b'
  );

-- Tech jobs
UPDATE jobs
SET categories = ARRAY['early-career', 'tech-transformation']
WHERE id IN (SELECT id FROM jobs_to_fix)
  AND categories NOT IN (
    ARRAY['early-career', 'strategy-business-design'],
    ARRAY['early-career', 'data-analytics'],
    ARRAY['early-career', 'marketing-growth']
  )
  AND (
    'tech-transformation' = ANY(categories) OR
    LOWER(title) ~ '\b(tech|technology|digital|transformation|software|engineer|developer|programmer)\b'
  );

-- Finance jobs
UPDATE jobs
SET categories = ARRAY['early-career', 'finance-investment']
WHERE id IN (SELECT id FROM jobs_to_fix)
  AND categories NOT IN (
    ARRAY['early-career', 'strategy-business-design'],
    ARRAY['early-career', 'data-analytics'],
    ARRAY['early-career', 'marketing-growth'],
    ARRAY['early-career', 'tech-transformation']
  )
  AND (
    'finance-investment' = ANY(categories) OR
    LOWER(title) ~ '\b(finance|financial|investment|banking|accounting|audit|treasury|fp&a)\b'
  );

-- Sales jobs
UPDATE jobs
SET categories = ARRAY['early-career', 'sales-client-success']
WHERE id IN (SELECT id FROM jobs_to_fix)
  AND categories NOT IN (
    ARRAY['early-career', 'strategy-business-design'],
    ARRAY['early-career', 'data-analytics'],
    ARRAY['early-career', 'marketing-growth'],
    ARRAY['early-career', 'tech-transformation'],
    ARRAY['early-career', 'finance-investment']
  )
  AND (
    'sales-client-success' = ANY(categories) OR
    LOWER(title) ~ '\b(sales|business\s*development|account\s*executive|customer\s*success|revenue|sdr|bdr)\b'
  );

-- Operations jobs (catch-all for remaining overcategorized jobs)
UPDATE jobs
SET categories = ARRAY['early-career', 'operations-supply-chain']
WHERE id IN (SELECT id FROM jobs_to_fix)
  AND categories NOT IN (
    ARRAY['early-career', 'strategy-business-design'],
    ARRAY['early-career', 'data-analytics'],
    ARRAY['early-career', 'marketing-growth'],
    ARRAY['early-career', 'tech-transformation'],
    ARRAY['early-career', 'finance-investment'],
    ARRAY['early-career', 'sales-client-success']
  );

-- STEP 3: FIX JOBS WITH ONLY SENIORITY LEVELS
-- Jobs with only 'early-career' should get a work type category

-- Strategy jobs from title/description
UPDATE jobs
SET categories = categories || ARRAY['strategy-business-design']
WHERE is_active = true
  AND categories = ARRAY['early-career']
  AND LOWER(title) ~ '\b(strategy|strategic|planning|business\s*planning|corporate\s*strategy|consulting|consultant)\b';

-- Data jobs from title/description
UPDATE jobs
SET categories = categories || ARRAY['data-analytics']
WHERE is_active = true
  AND categories = ARRAY['early-career']
  AND LOWER(title) ~ '\b(analyst|data|analytics|data\s*science|business\s*intelligence|bi|insights|reporting)\b';

-- Marketing jobs from title/description
UPDATE jobs
SET categories = categories || ARRAY['marketing-growth']
WHERE is_active = true
  AND categories = ARRAY['early-career']
  AND LOWER(title) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|content\s*marketing|social\s*media)\b';

-- Tech jobs from title/description
UPDATE jobs
SET categories = categories || ARRAY['tech-transformation']
WHERE is_active = true
  AND categories = ARRAY['early-career']
  AND LOWER(title) ~ '\b(tech|technology|digital|transformation|software|engineer|developer|programmer)\b';

-- Finance jobs from title/description
UPDATE jobs
SET categories = categories || ARRAY['finance-investment']
WHERE is_active = true
  AND categories = ARRAY['early-career']
  AND LOWER(title) ~ '\b(finance|financial|investment|banking|accounting|audit|treasury|fp&a)\b';

-- Sales jobs from title/description
UPDATE jobs
SET categories = categories || ARRAY['sales-client-success']
WHERE is_active = true
  AND categories = ARRAY['early-career']
  AND LOWER(title) ~ '\b(sales|business\s*development|account\s*executive|customer\s*success|revenue|sdr|bdr)\b';

-- Operations jobs from title/description (catch-all)
UPDATE jobs
SET categories = categories || ARRAY['operations-supply-chain']
WHERE is_active = true
  AND categories = ARRAY['early-career'];

-- STEP 4: CREATE OPTIMIZED INDEXES

-- Main index for work type category filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_work_type_categories
ON jobs USING gin (categories)
WHERE is_active = true
  AND categories && ARRAY[
    'strategy-business-design', 'data-analytics', 'marketing-growth',
    'tech-transformation', 'finance-investment', 'sales-client-success',
    'operations-supply-chain', 'product-innovation', 'sustainability-esg'
  ];

-- Composite index for category + location matching
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

-- STEP 5: VALIDATION

-- Check results
SELECT 'AFTER OPTIMIZATION' as status;

-- Jobs with only early-career (should be much fewer)
SELECT
  COUNT(*) as jobs_with_only_early_career
FROM jobs
WHERE is_active = true
  AND categories = ARRAY['early-career'];

-- Overcategorized jobs (should be 0)
SELECT
  COUNT(*) as overcategorized_jobs
FROM jobs
WHERE is_active = true
  AND array_length(categories, 1) > 4;

-- Work type category distribution
SELECT
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

-- Clean up temp table
DROP TABLE IF EXISTS jobs_to_fix;
