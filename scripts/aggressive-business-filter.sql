-- ============================================================================
-- AGGRESSIVE BUSINESS FILTER SCRIPT
-- ============================================================================
-- This script aggressively removes ALL non-business jobs
-- Only keeps true business career path roles + internships/graduates

-- ============================================================================
-- STEP 1: REMOVE ALL NON-BUSINESS JOBS (AGGRESSIVE DELETION)
-- ============================================================================

-- Delete teaching roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(teaching\s*assistant|teacher|tutor|instructor|lecturer|professor|educator|education|sen\s*teaching|reception\s*teaching|year\s*\d+\s*teaching|resource\s*base\s*teaching)\b';

-- Delete IT support roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(it\s*support|tech\s*support|help\s*desk|system\s*administrator|network\s*administrator|desktop\s*support|technical\s*support|support\s*engineer)\b';

-- Delete engineering roles (unless business-relevant)
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(engineer|developer|programmer|coder|software\s*engineer|backend\s*engineer|frontend\s*engineer|full\s*stack\s*engineer|ai\s*developer|mechanical\s*engineer|electrical\s*engineer|civil\s*engineer)\b'
  AND NOT LOWER(title) ~ '\b(business|finance|marketing|sales|strategy|analyst|consultant|manager|specialist|officer|data\s*analyst|financial\s*analyst|marketing\s*analyst|strategy\s*analyst|business\s*analyst|operations\s*analyst|research\s*analyst|risk\s*analyst|credit\s*analyst|investment\s*analyst|budget\s*control\s*analyst|systems\s*business\s*analyst|business\s*process\s*analyst|analyste\s*comptable|analyst\s*strategischer\s*einkauf|growth\s*data\s*analyst)\b';

-- Delete healthcare roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(nurse|doctor|medical|healthcare|therapist|physiotherapist|pharmacist|dentist|veterinary|clinical|nhs)\b';

-- Delete design roles (unless business-relevant)
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(designer|graphic\s*designer|ui\s*designer|ux\s*designer|web\s*designer|visual\s*designer|interior\s*designer)\b'
  AND NOT LOWER(title) ~ '\b(business|product\s*manager|brand\s*manager|marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|content\s*marketing|social\s*media)\b';

-- Delete trades and manual labor
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(electrician|plumber|mechanic|welder|carpenter|painter|landscap|janitor|cleaner|driver|delivery|courier|postal|warehouse|retail\s*assistant|shop\s*assistant|cashier)\b';

-- Delete food service
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(chef|cook|waiter|waitress|barista|kitchen|restaurant|food\s*service)\b';

-- Delete security and safety
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(security|guard|safety|police|firefighter|paramedic)\b';

-- Delete social work and care
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(social\s*worker|care\s*worker|support\s*worker|care\s*assistant|personal\s*care|elderly\s*care|childcare|nursery)\b';

-- Delete sports and fitness
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(personal\s*trainer|fitness|gym|sports|coach|athlete|instructor)\b';

-- Delete beauty and wellness
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(hairdresser|beauty|spa|wellness|massage|aesthetician)\b';

-- Delete other non-business roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(artist|musician|performer|actor|model|photographer|journalist|writer|editor|translator)\b'
  AND NOT LOWER(title) ~ '\b(business|marketing|content\s*marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|content\s*marketing|social\s*media)\b';

-- ============================================================================
-- STEP 2: CLEAN UP MISCLASSIFIED CATEGORIES
-- ============================================================================

-- Remove operations-supply-chain from remaining non-business roles
UPDATE jobs 
SET categories = array_remove(categories, 'operations-supply-chain')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND 'operations-supply-chain' = ANY(categories)
  AND NOT (
    LOWER(title) ~ '\b(business|finance|marketing|sales|strategy|analyst|consultant|manager|specialist|officer|operations|logistics|supply\s*chain|project\s*manager|program\s*manager|operations\s*manager|process\s*manager|procurement\s*analyst|strategischer\s*einkauf)\b' OR
    LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level|intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria|apprentice|apprenti)\b'
  );

-- ============================================================================
-- STEP 3: ADD BUSINESS-GRADUATE CATEGORY TO REMAINING JOBS
-- ============================================================================

-- Add business-graduate category to all remaining jobs (they should all be business now)
UPDATE jobs 
SET categories = array_append(categories, 'business-graduate')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND NOT 'business-graduate' = ANY(categories);

-- ============================================================================
-- STEP 4: FIX EXPERIENCE LEVEL CLASSIFICATION
-- ============================================================================

-- Fix jobs that should be entry-level
UPDATE jobs 
SET experience_required = 'entry-level'
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level|intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria)\b' OR
    LOWER(title) ~ '\b(graduate\s*program|graduate\s*scheme|trainee\s*program|associate\s*program|junior\s*program|analyst\s*programme)\b' OR
    'early-career' = ANY(categories) OR
    is_graduate = true OR
    is_internship = true
  )
  AND experience_required != 'entry-level';

-- Fix jobs that should be experienced (senior roles)
UPDATE jobs 
SET experience_required = 'experienced'
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(senior|lead|principal|director|head\s*of|vp|vice\s*president|architect|specialist|manager|executive|chief)\b'
  AND NOT LOWER(title) ~ '\b(junior|associate|trainee|graduate|entry|intern|stage|prácticas|praktikum)\b'
  AND experience_required != 'experienced';

-- ============================================================================
-- STEP 5: FIX INTERNSHIP AND GRADUATE FLAGS
-- ============================================================================

-- Set is_internship flag for internship roles
UPDATE jobs 
SET is_internship = true
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) ~ '\b(intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria|afstudeerstage|pflichtpraktikum)\b' OR
    LOWER(title) ~ '\b(summer\s*intern|winter\s*intern|spring\s*intern|industrial\s*placement|placement\s*year)\b' OR
    LOWER(title) ~ '\b(space4thesis|thesis|internship\s*corporate\s*governance)\b' OR
    'internship' = ANY(categories)
  );

-- Set is_graduate flag for graduate roles
UPDATE jobs 
SET is_graduate = true
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level)\b' OR
    LOWER(title) ~ '\b(graduate\s*program|graduate\s*scheme|trainee\s*program|associate\s*program|junior\s*program|analyst\s*programme)\b' OR
    'early-career' = ANY(categories)
  )
  AND NOT is_internship = true;

-- ============================================================================
-- STEP 6: ADD GRADUATE PROGRAM CATEGORY
-- ============================================================================

-- Add graduate-program category for graduate programs
UPDATE jobs 
SET categories = array_append(categories, 'graduate-program')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(graduate\s*program|graduate\s*scheme|trainee\s*program|associate\s*program|junior\s*program|analyst\s*programme|2026\s*graduate|2026\s*mufg\s*uk\s*analyst\s*programme)\b'
  AND NOT 'graduate-program' = ANY(categories);

-- ============================================================================
-- STEP 7: FINAL OPTIMIZATION
-- ============================================================================

-- Ensure all business jobs are active
UPDATE jobs 
SET is_active = true
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND 'business-graduate' = ANY(categories);

-- Set proper status
UPDATE jobs 
SET status = 'active'
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND 'business-graduate' = ANY(categories);

-- ============================================================================
-- STEP 8: FINAL VALIDATION
-- ============================================================================

-- Show final results
SELECT 
  'AGGRESSIVE BUSINESS FILTER COMPLETE' as status,
  COUNT(*) as total_business_jobs,
  COUNT(CASE WHEN 'business-graduate' = ANY(categories) THEN 1 END) as business_graduate_jobs,
  COUNT(CASE WHEN 'early-career' = ANY(categories) THEN 1 END) as early_career_jobs,
  COUNT(CASE WHEN 'internship' = ANY(categories) THEN 1 END) as internship_jobs,
  COUNT(CASE WHEN 'graduate-program' = ANY(categories) THEN 1 END) as graduate_program_jobs,
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

-- Show sample of optimized jobs
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
LIMIT 10;

