-- Safe Database Optimization for Category-Based Matching
-- Version without CONCURRENTLY to avoid transaction block issues

-- STEP 1: CREATE A TEMPORARY TABLE FOR CATEGORY CLEANUP
CREATE TEMP TABLE IF NOT EXISTS jobs_to_fix AS
SELECT id, categories
FROM jobs
WHERE is_active = true
  AND array_length(categories, 1) > 4;

-- Show what we're fixing
SELECT COUNT(*) as jobs_to_cleanup FROM jobs_to_fix;

-- STEP 2: SIMPLIFY OVERCATEGORIZED JOBS
UPDATE jobs
SET categories = ARRAY['early-career', 'strategy-business-design']
WHERE id IN (SELECT id FROM jobs_to_fix)
  AND 'early-career' = ANY(categories)
  AND (
    'strategy-business-design' = ANY(categories) OR
    LOWER(title) ~ '\b(strategy|strategic|planning|business\s*planning|corporate\s*strategy|consulting|consultant)\b'
  );

UPDATE jobs
SET categories = ARRAY['early-career', 'data-analytics']
WHERE id IN (SELECT id FROM jobs_to_fix)
  AND categories != ARRAY['early-career', 'strategy-business-design']
  AND (
    'data-analytics' = ANY(categories) OR
    LOWER(title) ~ '\b(analyst|data|analytics|data\s*science|business\s*intelligence|bi|insights|reporting)\b'
  );

UPDATE jobs
SET categories = ARRAY['early-career', 'marketing-growth']
WHERE id IN (SELECT id FROM jobs_to_fix)
  AND categories NOT IN (ARRAY['early-career', 'strategy-business-design'], ARRAY['early-career', 'data-analytics'])
  AND (
    'marketing-growth' = ANY(categories) OR
    LOWER(title) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|content\s*marketing|social\s*media)\b'
  );

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
UPDATE jobs
SET categories = categories || ARRAY['strategy-business-design']
WHERE is_active = true
  AND categories = ARRAY['early-career']
  AND LOWER(title) ~ '\b(strategy|strategic|planning|business\s*planning|corporate\s*strategy|consulting|consultant)\b';

UPDATE jobs
SET categories = categories || ARRAY['data-analytics']
WHERE is_active = true
  AND categories = ARRAY['early-career']
  AND LOWER(title) ~ '\b(analyst|data|analytics|data\s*science|business\s*intelligence|bi|insights|reporting)\b';

UPDATE jobs
SET categories = categories || ARRAY['marketing-growth']
WHERE is_active = true
  AND categories = ARRAY['early-career']
  AND LOWER(title) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|content\s*marketing|social\s*media)\b';

UPDATE jobs
SET categories = categories || ARRAY['tech-transformation']
WHERE is_active = true
  AND categories = ARRAY['early-career']
  AND LOWER(title) ~ '\b(tech|technology|digital|transformation|software|engineer|developer|programmer)\b';

UPDATE jobs
SET categories = categories || ARRAY['finance-investment']
WHERE is_active = true
  AND categories = ARRAY['early-career']
  AND LOWER(title) ~ '\b(finance|financial|investment|banking|accounting|audit|treasury|fp&a)\b';

UPDATE jobs
SET categories = categories || ARRAY['sales-client-success']
WHERE is_active = true
  AND categories = ARRAY['early-career']
  AND LOWER(title) ~ '\b(sales|business\s*development|account\s*executive|customer\s*success|revenue|sdr|bdr)\b';

UPDATE jobs
SET categories = categories || ARRAY['operations-supply-chain']
WHERE is_active = true
  AND categories = ARRAY['early-career'];

-- STEP 4: VALIDATION (before creating indexes)
SELECT 'BEFORE INDEXES' as status;

SELECT
  COUNT(*) as jobs_with_only_early_career
FROM jobs
WHERE is_active = true
  AND categories = ARRAY['early-career'];

SELECT
  COUNT(*) as overcategorized_jobs
FROM jobs
WHERE is_active = true
  AND array_length(categories, 1) > 4;

-- Work type category distribution (fixed for PostgreSQL)
SELECT
  'Work Type Categories' as analysis,
  COUNT(*) FILTER (WHERE 'strategy-business-design' = ANY(categories)) as strategy_jobs,
  COUNT(*) FILTER (WHERE 'data-analytics' = ANY(categories)) as data_jobs,
  COUNT(*) FILTER (WHERE 'marketing-growth' = ANY(categories)) as marketing_jobs,
  COUNT(*) FILTER (WHERE 'tech-transformation' = ANY(categories)) as tech_jobs,
  COUNT(*) FILTER (WHERE 'finance-investment' = ANY(categories)) as finance_jobs,
  COUNT(*) FILTER (WHERE 'sales-client-success' = ANY(categories)) as sales_jobs,
  COUNT(*) FILTER (WHERE 'operations-supply-chain' = ANY(categories)) as operations_jobs,
  COUNT(*) FILTER (WHERE 'product-innovation' = ANY(categories)) as product_jobs,
  COUNT(*) FILTER (WHERE 'sustainability-esg' = ANY(categories)) as sustainability_jobs
FROM jobs
WHERE is_active = true
  AND categories IS NOT NULL
  AND array_length(categories, 1) > 0
  AND (
    'strategy-business-design' = ANY(categories) OR
    'data-analytics' = ANY(categories) OR
    'marketing-growth' = ANY(categories) OR
    'tech-transformation' = ANY(categories) OR
    'finance-investment' = ANY(categories) OR
    'sales-client-success' = ANY(categories) OR
    'operations-supply-chain' = ANY(categories) OR
    'product-innovation' = ANY(categories) OR
    'sustainability-esg' = ANY(categories)
  );

-- Clean up temp table
DROP TABLE IF EXISTS jobs_to_fix;
