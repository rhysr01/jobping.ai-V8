-- ============================================================================
-- FINAL BUSINESS CLEANUP SCRIPT
-- ============================================================================
-- This script removes the remaining non-business roles that slipped through
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: DELETE REMAINING NON-BUSINESS ENGINEERING ROLES
-- ============================================================================

-- Delete field service engineers and maintenance engineers
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%field service engineer%' OR
    LOWER(title) LIKE '%maintenance engineer%' OR
    LOWER(title) LIKE '%service engineer%' OR
    LOWER(title) LIKE '%field engineer%' OR
    LOWER(title) LIKE '%maintenance technician%' OR
    LOWER(title) LIKE '%service technician%' OR
    LOWER(title) LIKE '%repair technician%' OR
    LOWER(title) LIKE '%installation technician%'
  );

-- ============================================================================
-- STEP 2: DELETE TECHNICIAN ROLES (NON-BUSINESS)
-- ============================================================================

-- Delete technician roles that are not business-relevant
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%technician%' OR
    LOWER(title) LIKE '%water hygiene technician%' OR
    LOWER(title) LIKE '%hygiene technician%' OR
    LOWER(title) LIKE '%laboratory technician%' OR
    LOWER(title) LIKE '%field technician%' OR
    LOWER(title) LIKE '%service technician%' OR
    LOWER(title) LIKE '%repair technician%' OR
    LOWER(title) LIKE '%installation technician%' OR
    LOWER(title) LIKE '%electrical technician%' OR
    LOWER(title) LIKE '%mechanical technician%' OR
    LOWER(title) LIKE '%engineering technician%'
  )
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

-- ============================================================================
-- STEP 3: DELETE OTHER NON-BUSINESS ROLES
-- ============================================================================

-- Delete other non-business roles that might have slipped through
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%assistant%' AND NOT (
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
      LOWER(title) LIKE '%workforce%' OR
      LOWER(title) LIKE '%graduate%' OR
      LOWER(title) LIKE '%trainee%' OR
      LOWER(title) LIKE '%associate%' OR
      LOWER(title) LIKE '%junior%' OR
      LOWER(title) LIKE '%entry level%' OR
      LOWER(title) LIKE '%intern%' OR
      LOWER(title) LIKE '%internship%' OR
      LOWER(title) LIKE '%stage%' OR
      LOWER(title) LIKE '%prácticas%' OR
      LOWER(title) LIKE '%praktikum%' OR
      LOWER(title) LIKE '%tirocinio%' OR
      LOWER(title) LIKE '%stagista%' OR
      LOWER(title) LIKE '%stagiaire%' OR
      LOWER(title) LIKE '%becario%' OR
      LOWER(title) LIKE '%becaria%' OR
      LOWER(title) LIKE '%apprentice%' OR
      LOWER(title) LIKE '%apprenti%' OR
      LOWER(title) LIKE '%strategy%' OR
      LOWER(title) LIKE '%strategic%' OR
      LOWER(title) LIKE '%planning%' OR
      LOWER(title) LIKE '%business planning%' OR
      LOWER(title) LIKE '%corporate strategy%' OR
      LOWER(title) LIKE '%product manager%' OR
      LOWER(title) LIKE '%product owner%' OR
      LOWER(title) LIKE '%product analyst%' OR
      LOWER(title) LIKE '%product specialist%'
    )
  );

-- ============================================================================
-- STEP 4: CLEAN UP REMAINING NON-BUSINESS CATEGORIES
-- ============================================================================

-- Remove business-graduate category from remaining non-business roles
UPDATE jobs 
SET categories = array_remove(categories, 'business-graduate')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND 'business-graduate' = ANY(categories)
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
    LOWER(title) LIKE '%workforce%' OR
    LOWER(title) LIKE '%graduate%' OR
    LOWER(title) LIKE '%trainee%' OR
    LOWER(title) LIKE '%associate%' OR
    LOWER(title) LIKE '%junior%' OR
    LOWER(title) LIKE '%entry level%' OR
    LOWER(title) LIKE '%intern%' OR
    LOWER(title) LIKE '%internship%' OR
    LOWER(title) LIKE '%stage%' OR
    LOWER(title) LIKE '%prácticas%' OR
    LOWER(title) LIKE '%praktikum%' OR
    LOWER(title) LIKE '%tirocinio%' OR
    LOWER(title) LIKE '%stagista%' OR
    LOWER(title) LIKE '%stagiaire%' OR
    LOWER(title) LIKE '%becario%' OR
    LOWER(title) LIKE '%becaria%' OR
    LOWER(title) LIKE '%apprentice%' OR
    LOWER(title) LIKE '%apprenti%' OR
    LOWER(title) LIKE '%strategy%' OR
    LOWER(title) LIKE '%strategic%' OR
    LOWER(title) LIKE '%planning%' OR
    LOWER(title) LIKE '%business planning%' OR
    LOWER(title) LIKE '%corporate strategy%' OR
    LOWER(title) LIKE '%product manager%' OR
    LOWER(title) LIKE '%product owner%' OR
    LOWER(title) LIKE '%product analyst%' OR
    LOWER(title) LIKE '%product specialist%'
  );

-- ============================================================================
-- STEP 5: FINAL VALIDATION
-- ============================================================================

-- Show final results
SELECT 
  'FINAL BUSINESS CLEANUP COMPLETE' as status,
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

