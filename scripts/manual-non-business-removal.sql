-- ============================================================================
-- MANUAL NON-BUSINESS JOB REMOVAL SCRIPT
-- ============================================================================
-- This script manually removes non-business jobs using specific patterns
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- STEP 1: DELETE TEACHING ROLES BY SPECIFIC PATTERNS
-- ============================================================================

-- Delete all teaching assistant roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%teaching assistant%' OR
    LOWER(title) LIKE '%teacher%' OR
    LOWER(title) LIKE '%tutor%' OR
    LOWER(title) LIKE '%instructor%' OR
    LOWER(title) LIKE '%lecturer%' OR
    LOWER(title) LIKE '%professor%' OR
    LOWER(title) LIKE '%educator%' OR
    LOWER(title) LIKE '%sen teaching%' OR
    LOWER(title) LIKE '%reception teaching%' OR
    LOWER(title) LIKE '%year%teaching%' OR
    LOWER(title) LIKE '%resource base teaching%' OR
    LOWER(title) LIKE '%graduate teaching%'
  );

-- ============================================================================
-- STEP 2: DELETE IT/TECH SUPPORT ROLES
-- ============================================================================

-- Delete IT support and tech roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%it support%' OR
    LOWER(title) LIKE '%tech support%' OR
    LOWER(title) LIKE '%help desk%' OR
    LOWER(title) LIKE '%system administrator%' OR
    LOWER(title) LIKE '%network administrator%' OR
    LOWER(title) LIKE '%desktop support%' OR
    LOWER(title) LIKE '%technical support%' OR
    LOWER(title) LIKE '%support engineer%' OR
    LOWER(title) LIKE '%data admin%' OR
    LOWER(title) LIKE '%admin assistant%'
  );

-- ============================================================================
-- STEP 3: DELETE ENGINEERING ROLES (NON-BUSINESS)
-- ============================================================================

-- Delete engineering roles that are not business-relevant
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%field engineer%' OR
    LOWER(title) LIKE '%mechanical engineer%' OR
    LOWER(title) LIKE '%electrical engineer%' OR
    LOWER(title) LIKE '%civil engineer%' OR
    LOWER(title) LIKE '%software engineer%' OR
    LOWER(title) LIKE '%backend engineer%' OR
    LOWER(title) LIKE '%frontend engineer%' OR
    LOWER(title) LIKE '%full stack engineer%' OR
    LOWER(title) LIKE '%ai developer%' OR
    LOWER(title) LIKE '%developer%' OR
    LOWER(title) LIKE '%programmer%' OR
    LOWER(title) LIKE '%coder%'
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
    LOWER(title) LIKE '%officer%'
  );

-- ============================================================================
-- STEP 4: DELETE HEALTHCARE ROLES
-- ============================================================================

-- Delete healthcare roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%nurse%' OR
    LOWER(title) LIKE '%doctor%' OR
    LOWER(title) LIKE '%medical%' OR
    LOWER(title) LIKE '%healthcare%' OR
    LOWER(title) LIKE '%therapist%' OR
    LOWER(title) LIKE '%physiotherapist%' OR
    LOWER(title) LIKE '%pharmacist%' OR
    LOWER(title) LIKE '%dentist%' OR
    LOWER(title) LIKE '%veterinary%' OR
    LOWER(title) LIKE '%clinical%' OR
    LOWER(title) LIKE '%nhs%'
  );

-- ============================================================================
-- STEP 5: DELETE DESIGN ROLES (NON-BUSINESS)
-- ============================================================================

-- Delete design roles that are not business-relevant
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%designer%' OR
    LOWER(title) LIKE '%graphic designer%' OR
    LOWER(title) LIKE '%ui designer%' OR
    LOWER(title) LIKE '%ux designer%' OR
    LOWER(title) LIKE '%web designer%' OR
    LOWER(title) LIKE '%visual designer%' OR
    LOWER(title) LIKE '%interior designer%'
  )
  AND NOT (
    LOWER(title) LIKE '%business%' OR
    LOWER(title) LIKE '%product manager%' OR
    LOWER(title) LIKE '%brand manager%' OR
    LOWER(title) LIKE '%marketing%' OR
    LOWER(title) LIKE '%brand%'
  );

-- ============================================================================
-- STEP 6: DELETE TRADES AND MANUAL LABOR
-- ============================================================================

-- Delete trades and manual labor roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%electrician%' OR
    LOWER(title) LIKE '%plumber%' OR
    LOWER(title) LIKE '%mechanic%' OR
    LOWER(title) LIKE '%welder%' OR
    LOWER(title) LIKE '%carpenter%' OR
    LOWER(title) LIKE '%painter%' OR
    LOWER(title) LIKE '%landscap%' OR
    LOWER(title) LIKE '%janitor%' OR
    LOWER(title) LIKE '%cleaner%' OR
    LOWER(title) LIKE '%driver%' OR
    LOWER(title) LIKE '%delivery%' OR
    LOWER(title) LIKE '%courier%' OR
    LOWER(title) LIKE '%postal%' OR
    LOWER(title) LIKE '%warehouse%' OR
    LOWER(title) LIKE '%retail assistant%' OR
    LOWER(title) LIKE '%shop assistant%' OR
    LOWER(title) LIKE '%cashier%'
  );

-- ============================================================================
-- STEP 7: DELETE FOOD SERVICE ROLES
-- ============================================================================

-- Delete food service roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%chef%' OR
    LOWER(title) LIKE '%cook%' OR
    LOWER(title) LIKE '%waiter%' OR
    LOWER(title) LIKE '%waitress%' OR
    LOWER(title) LIKE '%barista%' OR
    LOWER(title) LIKE '%kitchen%' OR
    LOWER(title) LIKE '%restaurant%' OR
    LOWER(title) LIKE '%food service%'
  );

-- ============================================================================
-- STEP 8: DELETE SECURITY AND SAFETY ROLES
-- ============================================================================

-- Delete security and safety roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%security%' OR
    LOWER(title) LIKE '%guard%' OR
    LOWER(title) LIKE '%safety%' OR
    LOWER(title) LIKE '%police%' OR
    LOWER(title) LIKE '%firefighter%' OR
    LOWER(title) LIKE '%paramedic%'
  );

-- ============================================================================
-- STEP 9: DELETE SOCIAL WORK AND CARE ROLES
-- ============================================================================

-- Delete social work and care roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%social worker%' OR
    LOWER(title) LIKE '%care worker%' OR
    LOWER(title) LIKE '%support worker%' OR
    LOWER(title) LIKE '%care assistant%' OR
    LOWER(title) LIKE '%personal care%' OR
    LOWER(title) LIKE '%elderly care%' OR
    LOWER(title) LIKE '%childcare%' OR
    LOWER(title) LIKE '%nursery%'
  );

-- ============================================================================
-- STEP 10: DELETE SPORTS AND FITNESS ROLES
-- ============================================================================

-- Delete sports and fitness roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%personal trainer%' OR
    LOWER(title) LIKE '%fitness%' OR
    LOWER(title) LIKE '%gym%' OR
    LOWER(title) LIKE '%sports%' OR
    LOWER(title) LIKE '%coach%' OR
    LOWER(title) LIKE '%athlete%' OR
    LOWER(title) LIKE '%instructor%'
  );

-- ============================================================================
-- STEP 11: DELETE BEAUTY AND WELLNESS ROLES
-- ============================================================================

-- Delete beauty and wellness roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%hairdresser%' OR
    LOWER(title) LIKE '%beauty%' OR
    LOWER(title) LIKE '%spa%' OR
    LOWER(title) LIKE '%wellness%' OR
    LOWER(title) LIKE '%massage%' OR
    LOWER(title) LIKE '%aesthetician%'
  );

-- ============================================================================
-- STEP 12: DELETE OTHER NON-BUSINESS ROLES
-- ============================================================================

-- Delete other non-business roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) LIKE '%artist%' OR
    LOWER(title) LIKE '%musician%' OR
    LOWER(title) LIKE '%performer%' OR
    LOWER(title) LIKE '%actor%' OR
    LOWER(title) LIKE '%model%' OR
    LOWER(title) LIKE '%photographer%' OR
    LOWER(title) LIKE '%journalist%' OR
    LOWER(title) LIKE '%writer%' OR
    LOWER(title) LIKE '%editor%' OR
    LOWER(title) LIKE '%translator%'
  )
  AND NOT (
    LOWER(title) LIKE '%business%' OR
    LOWER(title) LIKE '%marketing%' OR
    LOWER(title) LIKE '%content marketing%' OR
    LOWER(title) LIKE '%brand%' OR
    LOWER(title) LIKE '%digital marketing%' OR
    LOWER(title) LIKE '%product marketing%' OR
    LOWER(title) LIKE '%growth marketing%' OR
    LOWER(title) LIKE '%content marketing%' OR
    LOWER(title) LIKE '%social media%'
  );

-- ============================================================================
-- STEP 13: CLEAN UP REMAINING NON-BUSINESS CATEGORIES
-- ============================================================================

-- Remove operations-supply-chain from remaining non-business roles
UPDATE jobs 
SET categories = array_remove(categories, 'operations-supply-chain')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND 'operations-supply-chain' = ANY(categories)
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
    LOWER(title) LIKE '%operations%' OR
    LOWER(title) LIKE '%logistics%' OR
    LOWER(title) LIKE '%supply chain%' OR
    LOWER(title) LIKE '%project manager%' OR
    LOWER(title) LIKE '%program manager%' OR
    LOWER(title) LIKE '%operations manager%' OR
    LOWER(title) LIKE '%process manager%' OR
    LOWER(title) LIKE '%procurement analyst%' OR
    LOWER(title) LIKE '%strategischer einkauf%'
  );

-- ============================================================================
-- STEP 14: FINAL VALIDATION
-- ============================================================================

-- Show final results
SELECT 
  'MANUAL NON-BUSINESS REMOVAL COMPLETE' as status,
  COUNT(*) as total_business_jobs,
  COUNT(CASE WHEN 'business-graduate' = ANY(categories) THEN 1 END) as business_graduate_jobs,
  COUNT(CASE WHEN 'early-career' = ANY(categories) THEN 1 END) as early_career_jobs,
  COUNT(CASE WHEN 'internship' = ANY(categories) THEN 1 END) as internship_jobs,
  COUNT(CASE WHEN experience_required = 'entry-level' THEN 1 END) as entry_level_jobs,
  COUNT(CASE WHEN is_graduate = true THEN 1 END) as is_graduate_flag,
  COUNT(CASE WHEN is_internship = true THEN 1 END) as is_internship_flag
FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours';

-- Show sample of remaining jobs
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
ORDER BY created_at DESC
LIMIT 10;

