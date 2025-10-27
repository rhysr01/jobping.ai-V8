-- ============================================================================
-- ULTIMATE BUSINESS CLEANUP SCRIPT
-- ============================================================================
-- This script removes the final remaining non-business roles
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: DELETE REMAINING NON-BUSINESS ENGINEERING/TECH ROLES
-- ============================================================================

-- Delete network engineers
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) LIKE '%network engineer%';

-- Delete AI engineers (unless business-relevant)
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) LIKE '%ai engineer%'
  AND NOT (
    LOWER(title) LIKE '%business%' OR
    LOWER(title) LIKE '%finance%' OR
    LOWER(title) LIKE '%marketing%' OR
    LOWER(title) LIKE '%sales%' OR
    LOWER(title) LIKE '%strategy%' OR
    LOWER(title) LIKE '%analyst%' OR
    LOWER(title) LIKE '%consultant%' OR
    LOWER(title) LIKE '%manager%' OR
    LOWER(title) LIKE '%specialist%' OR
    LOWER(title) LIKE '%officer%' OR
    LOWER(title) LIKE '%data%' OR
    LOWER(title) LIKE '%financial%' OR
    LOWER(title) LIKE '%accounting%' OR
    LOWER(title) LIKE '%audit%' OR
    LOWER(title) LIKE '%investment%' OR
    LOWER(title) LIKE '%banking%' OR
    LOWER(title) LIKE '%trading%' OR
    LOWER(title) LIKE '%treasury%' OR
    LOWER(title) LIKE '%corporate finance%' OR
    LOWER(title) LIKE '%private equity%' OR
    LOWER(title) LIKE '%venture capital%' OR
    LOWER(title) LIKE '%asset management%'
  );

-- Delete cloud engineers (unless business-relevant)
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) LIKE '%cloud engineer%'
  AND NOT (
    LOWER(title) LIKE '%business%' OR
    LOWER(title) LIKE '%finance%' OR
    LOWER(title) LIKE '%marketing%' OR
    LOWER(title) LIKE '%sales%' OR
    LOWER(title) LIKE '%strategy%' OR
    LOWER(title) LIKE '%analyst%' OR
    LOWER(title) LIKE '%consultant%' OR
    LOWER(title) LIKE '%manager%' OR
    LOWER(title) LIKE '%specialist%' OR
    LOWER(title) LIKE '%officer%' OR
    LOWER(title) LIKE '%data%' OR
    LOWER(title) LIKE '%financial%' OR
    LOWER(title) LIKE '%accounting%' OR
    LOWER(title) LIKE '%audit%' OR
    LOWER(title) LIKE '%investment%' OR
    LOWER(title) LIKE '%banking%' OR
    LOWER(title) LIKE '%trading%' OR
    LOWER(title) LIKE '%treasury%' OR
    LOWER(title) LIKE '%corporate finance%' OR
    LOWER(title) LIKE '%private equity%' OR
    LOWER(title) LIKE '%venture capital%' OR
    LOWER(title) LIKE '%asset management%'
  );

-- Delete website administrators
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) LIKE '%website administrator%';

-- Delete acoustic consultants (engineering role)
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) LIKE '%acoustic consultant%';

-- ============================================================================
-- STEP 2: DELETE OTHER NON-BUSINESS ROLES
-- ============================================================================

-- Delete any remaining engineer roles (unless business-relevant)
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) LIKE '%engineer%'
  AND NOT (
    LOWER(title) LIKE '%business%' OR
    LOWER(title) LIKE '%finance%' OR
    LOWER(title) LIKE '%marketing%' OR
    LOWER(title) LIKE '%sales%' OR
    LOWER(title) LIKE '%strategy%' OR
    LOWER(title) LIKE '%analyst%' OR
    LOWER(title) LIKE '%consultant%' OR
    LOWER(title) LIKE '%manager%' OR
    LOWER(title) LIKE '%specialist%' OR
    LOWER(title) LIKE '%officer%' OR
    LOWER(title) LIKE '%account%' OR
    LOWER(title) LIKE '%financial%' OR
    LOWER(title) LIKE '%accounting%' OR
    LOWER(title) LIKE '%audit%' OR
    LOWER(title) LIKE '%investment%' OR
    LOWER(title) LIKE '%banking%' OR
    LOWER(title) LIKE '%trading%' OR
    LOWER(title) LIKE '%treasury%' OR
    LOWER(title) LIKE '%corporate finance%' OR
    LOWER(title) LIKE '%private equity%' OR
    LOWER(title) LIKE '%venture capital%' OR
    LOWER(title) LIKE '%asset management%' OR
    LOWER(title) LIKE '%data%' OR
    LOWER(title) LIKE '%operations%' OR
    LOWER(title) LIKE '%logistics%' OR
    LOWER(title) LIKE '%supply chain%' OR
    LOWER(title) LIKE '%project manager%' OR
    LOWER(title) LIKE '%program manager%' OR
    LOWER(title) LIKE '%operations manager%' OR
    LOWER(title) LIKE '%process manager%' OR
    LOWER(title) LIKE '%procurement%' OR
    LOWER(title) LIKE '%strategischer%' OR
    LOWER(title) LIKE '%einkauf%' OR
    LOWER(title) LIKE '%hr%' OR
    LOWER(title) LIKE '%human resources%' OR
    LOWER(title) LIKE '%recruitment%' OR
    LOWER(title) LIKE '%talent%' OR
    LOWER(title) LIKE '%people%' OR
    LOWER(title) LIKE '%workforce%'
  );

-- Delete any remaining administrator roles (unless business-relevant)
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) LIKE '%administrator%'
  AND NOT (
    LOWER(title) LIKE '%business%' OR
    LOWER(title) LIKE '%finance%' OR
    LOWER(title) LIKE '%marketing%' OR
    LOWER(title) LIKE '%sales%' OR
    LOWER(title) LIKE '%strategy%' OR
    LOWER(title) LIKE '%analyst%' OR
    LOWER(title) LIKE '%consultant%' OR
    LOWER(title) LIKE '%manager%' OR
    LOWER(title) LIKE '%specialist%' OR
    LOWER(title) LIKE '%officer%' OR
    LOWER(title) LIKE '%account%' OR
    LOWER(title) LIKE '%financial%' OR
    LOWER(title) LIKE '%accounting%' OR
    LOWER(title) LIKE '%audit%' OR
    LOWER(title) LIKE '%investment%' OR
    LOWER(title) LIKE '%banking%' OR
    LOWER(title) LIKE '%trading%' OR
    LOWER(title) LIKE '%treasury%' OR
    LOWER(title) LIKE '%corporate finance%' OR
    LOWER(title) LIKE '%private equity%' OR
    LOWER(title) LIKE '%venture capital%' OR
    LOWER(title) LIKE '%asset management%' OR
    LOWER(title) LIKE '%data%' OR
    LOWER(title) LIKE '%operations%' OR
    LOWER(title) LIKE '%logistics%' OR
    LOWER(title) LIKE '%supply chain%' OR
    LOWER(title) LIKE '%project manager%' OR
    LOWER(title) LIKE '%program manager%' OR
    LOWER(title) LIKE '%operations manager%' OR
    LOWER(title) LIKE '%process manager%' OR
    LOWER(title) LIKE '%procurement%' OR
    LOWER(title) LIKE '%strategischer%' OR
    LOWER(title) LIKE '%einkauf%' OR
    LOWER(title) LIKE '%hr%' OR
    LOWER(title) LIKE '%human resources%' OR
    LOWER(title) LIKE '%recruitment%' OR
    LOWER(title) LIKE '%talent%' OR
    LOWER(title) LIKE '%people%' OR
    LOWER(title) LIKE '%workforce%'
  );

-- ============================================================================
-- STEP 3: CLEAN UP GENERIC ASSISTANT ROLES
-- ============================================================================

-- Delete generic team assistant roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) LIKE '%team assistant%'
  AND NOT (
    LOWER(title) LIKE '%business%' OR
    LOWER(title) LIKE '%finance%' OR
    LOWER(title) LIKE '%marketing%' OR
    LOWER(title) LIKE '%sales%' OR
    LOWER(title) LIKE '%strategy%' OR
    LOWER(title) LIKE '%analyst%' OR
    LOWER(title) LIKE '%consultant%' OR
    LOWER(title) LIKE '%manager%' OR
    LOWER(title) LIKE '%specialist%' OR
    LOWER(title) LIKE '%officer%' OR
    LOWER(title) LIKE '%account%' OR
    LOWER(title) LIKE '%financial%' OR
    LOWER(title) LIKE '%accounting%' OR
    LOWER(title) LIKE '%audit%' OR
    LOWER(title) LIKE '%investment%' OR
    LOWER(title) LIKE '%banking%' OR
    LOWER(title) LIKE '%trading%' OR
    LOWER(title) LIKE '%treasury%' OR
    LOWER(title) LIKE '%corporate finance%' OR
    LOWER(title) LIKE '%private equity%' OR
    LOWER(title) LIKE '%venture capital%' OR
    LOWER(title) LIKE '%asset management%' OR
    LOWER(title) LIKE '%operations%' OR
    LOWER(title) LIKE '%logistics%' OR
    LOWER(title) LIKE '%supply chain%' OR
    LOWER(title) LIKE '%project manager%' OR
    LOWER(title) LIKE '%program manager%' OR
    LOWER(title) LIKE '%operations manager%' OR
    LOWER(title) LIKE '%process manager%' OR
    LOWER(title) LIKE '%procurement%' OR
    LOWER(title) LIKE '%strategischer%' OR
    LOWER(title) LIKE '%einkauf%' OR
    LOWER(title) LIKE '%hr%' OR
    LOWER(title) LIKE '%human resources%' OR
    LOWER(title) LIKE '%recruitment%' OR
    LOWER(title) LIKE '%talent%' OR
    LOWER(title) LIKE '%people%' OR
    LOWER(title) LIKE '%workforce%'
  );

-- ============================================================================
-- STEP 4: FINAL VALIDATION
-- ============================================================================

-- Show final results
SELECT 
  'ULTIMATE BUSINESS CLEANUP COMPLETE' as status,
  COUNT(*) as total_business_jobs,
  COUNT(CASE WHEN 'business-graduate' = ANY(categories) THEN 1 END) as business_graduate_jobs,
  COUNT(CASE WHEN 'early-career' = ANY(categories) THEN 1 END) as early_career_jobs,
  COUNT(CASE WHEN 'internship' = ANY(categories) THEN 1 END) as internship_jobs,
  COUNT(CASE WHEN experience_required = 'entry-level' THEN 1 END) as entry_level_jobs,
  COUNT(CASE WHEN is_graduate = true THEN 1 END) as is_graduate_flag,
  COUNT(CASE WHEN is_internship = true THEN 1 END) as is_internship_flag,
  COUNT(CASE WHEN 'operations-supply-chain' = ANY(categories) THEN 1 END) as operations_jobs,
  COUNT(CASE WHEN 'strategy-business-design' = ANY(categories) THEN 1 END) as strategy_jobs,
  COUNT(CASE WHEN 'data-analytics' = ANY(categories) THEN 1 END) as data_analytics_jobs,
  COUNT(CASE WHEN 'finance-investment' = ANY(categories) THEN 1 END) as finance_jobs,
  COUNT(CASE WHEN 'sales-client-success' = ANY(categories) THEN 1 END) as sales_jobs,
  COUNT(CASE WHEN 'marketing-growth' = ANY(categories) THEN 1 END) as marketing_jobs
FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours';

-- Show sample of final business jobs
SELECT 
  title,
  company,
  location,
  categories,
  experience_required,
  is_graduate,
  is_internship
FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND 'business-graduate' = ANY(categories)
ORDER BY created_at DESC
LIMIT 15;

