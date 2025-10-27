-- ============================================================================
-- FOCUSED BUSINESS JOB OPTIMIZATION SCRIPT
-- ============================================================================
-- This script fixes the specific issues identified in the job sample
-- and optimizes for business school graduate jobs only

-- ============================================================================
-- STEP 1: REMOVE NON-BUSINESS JOBS
-- ============================================================================

-- Delete tech/engineering jobs that are not business-relevant
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    -- Pure tech roles
    LOWER(title) ~ '\b(backend\s*engineer|frontend\s*engineer|full\s*stack\s*engineer|software\s*engineer|developer|programmer|coder|devops|sre|site\s*reliability)\b' OR
    
    -- Design roles (non-business)
    LOWER(title) ~ '\b(designer\s*graphique|graphic\s*designer|ui\s*designer|ux\s*designer|web\s*designer|visual\s*designer)\b' OR
    
    -- Pure engineering roles
    LOWER(title) ~ '\b(mechanical\s*engineer|electrical\s*engineer|civil\s*engineer|chemical\s*engineer|systems\s*engineer)\b' OR
    
    -- Tech support roles
    LOWER(title) ~ '\b(tech\s*support|it\s*support|help\s*desk|system\s*administrator|network\s*administrator)\b' OR
    
    -- Data science roles (non-business)
    LOWER(title) ~ '\b(data\s*scientist|machine\s*learning\s*engineer|ai\s*engineer|research\s*scientist)\b' AND
    NOT LOWER(title) ~ '\b(business|finance|marketing|sales|strategy|analyst|consultant)\b'
  );

-- ============================================================================
-- STEP 2: FIX MISCLASSIFIED EXPERIENCE LEVELS
-- ============================================================================

-- Fix Junior Store Manager and similar roles that should be entry-level
UPDATE jobs 
SET 
  experience_required = 'entry-level',
  categories = ARRAY['business-graduate', 'early-career', 'retail-management']
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(junior|associate|trainee|graduate|entry\s*level|intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria)\b'
  AND experience_required = 'experienced';

-- Fix MUFG UK Analyst Programme that should be entry-level
UPDATE jobs 
SET 
  experience_required = 'entry-level',
  categories = ARRAY['business-graduate', 'early-career', 'finance', 'graduate-program']
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level|intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria)\b'
  AND LOWER(title) ~ '\b(program|programme|scheme)\b';

-- ============================================================================
-- STEP 3: ADD BUSINESS-GRADUATE CATEGORY TO ALL BUSINESS JOBS
-- ============================================================================

-- Add business-graduate category to all early-career business jobs
UPDATE jobs 
SET categories = array_append(categories, 'business-graduate')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND 'early-career' = ANY(categories)
  AND NOT 'business-graduate' = ANY(categories)
  AND (
    -- Business analyst roles
    LOWER(title) ~ '\b(business\s*analyst|data\s*analyst|operations\s*analyst|financial\s*analyst|marketing\s*analyst|strategy\s*analyst|research\s*analyst|risk\s*analyst|credit\s*analyst|investment\s*analyst|budget\s*control\s*analyst|systems\s*business\s*analyst|business\s*process\s*analyst|analyste\s*comptable|analyst\s*strategischer\s*einkauf|growth\s*data\s*analyst)\b' OR
    
    -- Consulting roles
    LOWER(title) ~ '\b(consultant|consulting|advisory|strategy\s*consultant|management\s*consultant|business\s*consultant|tax\s*consultant|financial\s*consultant|cloud\s*consultant|real\s*estate\s*valuation\s*consultant)\b' OR
    
    -- Finance roles
    LOWER(title) ~ '\b(finance|financial|accounting|audit|investment|banking|trading|treasury|corporate\s*finance|private\s*equity|venture\s*capital|asset\s*management|financial\s*analyst|graduate\s*financial\s*analyst|analyste\s*multigestion|analyste\s*investissement)\b' OR
    
    -- Marketing roles
    LOWER(title) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|marketing\s*manager|brand\s*manager|content\s*marketing|social\s*media|assistant\s*product\s*developer)\b' OR
    
    -- Sales roles
    LOWER(title) ~ '\b(sales|business\s*development|account\s*manager|relationship\s*manager|sales\s*manager|commercial|revenue|partnership|business\s*developer|commerciale|recruitment\s*consultant)\b' OR
    
    -- Operations roles
    LOWER(title) ~ '\b(operations|logistics|supply\s*chain|project\s*manager|program\s*manager|operations\s*manager|process\s*manager|procurement\s*analyst|strategischer\s*einkauf)\b' OR
    
    -- HR roles
    LOWER(title) ~ '\b(hr|human\s*resources|recruitment|talent|people|workforce|hr\s*manager|talent\s*acquisition|trainee\s*recruitment\s*consultant)\b' OR
    
    -- Graduate/Entry level roles
    LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level|intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria|apprentice|apprenti)\b' OR
    
    -- Management roles (but only if early career indicators present)
    LOWER(title) ~ '\b(manager|supervisor|coordinator|specialist|officer|director|head\s*of)\b' AND 
    LOWER(title) ~ '\b(junior|associate|trainee|graduate|entry|intern|stage|prácticas|praktikum)\b' OR
    
    -- Business support roles
    LOWER(title) ~ '\b(business\s*support|administrative|executive\s*assistant|office\s*manager|receptionist)\b' OR
    
    -- Strategy roles
    LOWER(title) ~ '\b(strategy|strategic|planning|business\s*planning|corporate\s*strategy|strategy\s*business\s*design)\b' OR
    
    -- Product roles
    LOWER(title) ~ '\b(product\s*manager|product\s*owner|product\s*analyst|product\s*specialist|assistant\s*product\s*developer)\b'
  );

-- ============================================================================
-- STEP 4: FIX SPECIFIC CATEGORY ISSUES
-- ============================================================================

-- Fix tech-transformation category - only keep for business roles
UPDATE jobs 
SET categories = array_remove(categories, 'tech-transformation')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND 'tech-transformation' = ANY(categories)
  AND NOT (
    LOWER(title) ~ '\b(business|finance|marketing|sales|strategy|analyst|consultant|manager|specialist|officer)\b' OR
    LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level|intern|internship|stage|prácticas|praktikum)\b'
  );

-- Add proper business categories
UPDATE jobs 
SET categories = array_append(categories, 'finance')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(finance|financial|accounting|audit|investment|banking|trading|treasury|corporate\s*finance|financial\s*analyst|graduate\s*financial\s*analyst|analyste\s*comptable|analyste\s*multigestion|analyste\s*investissement|budget\s*control\s*analyst)\b'
  AND NOT 'finance' = ANY(categories);

UPDATE jobs 
SET categories = array_append(categories, 'consulting')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(consultant|consulting|advisory|strategy\s*consultant|management\s*consultant|business\s*consultant|cloud\s*consultant|real\s*estate\s*valuation\s*consultant)\b'
  AND NOT 'consulting' = ANY(categories);

UPDATE jobs 
SET categories = array_append(categories, 'marketing')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|content\s*marketing|social\s*media|assistant\s*product\s*developer|growth\s*data\s*analyst)\b'
  AND NOT 'marketing' = ANY(categories);

UPDATE jobs 
SET categories = array_append(categories, 'sales')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(sales|business\s*development|account\s*manager|relationship\s*manager|commercial|revenue|partnership|business\s*developer|commerciale|recruitment\s*consultant)\b'
  AND NOT 'sales' = ANY(categories);

UPDATE jobs 
SET categories = array_append(categories, 'analyst')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(analyst|business\s*intelligence|reporting\s*analyst|insights\s*analyst|data\s*analyst|business\s*analyst|financial\s*analyst|marketing\s*analyst|strategy\s*analyst|research\s*analyst|risk\s*analyst|credit\s*analyst|investment\s*analyst|budget\s*control\s*analyst|systems\s*business\s*analyst|business\s*process\s*analyst|analyste\s*comptable|analyst\s*strategischer\s*einkauf|growth\s*data\s*analyst|junior\s*data\s*analyst|stagiaire\s*analyste|internship\s*corporate\s*governance\s*executive\s*compensation\s*analyst)\b'
  AND NOT 'analyst' = ANY(categories);

-- ============================================================================
-- STEP 5: FIX INTERNSHIP CLASSIFICATION
-- ============================================================================

-- Ensure all internship roles are properly categorized
UPDATE jobs 
SET categories = ARRAY['internship', 'business-graduate', 'early-career']
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) ~ '\b(intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria|afstudeerstage|pflichtpraktikum)\b' OR
    LOWER(title) ~ '\b(summer\s*intern|winter\s*intern|spring\s*intern|industrial\s*placement|placement\s*year)\b' OR
    LOWER(title) ~ '\b(space4thesis|thesis|internship\s*corporate\s*governance)\b'
  );

-- ============================================================================
-- STEP 6: FIX GRADUATE PROGRAMS
-- ============================================================================

-- Ensure graduate programs are properly categorized
UPDATE jobs 
SET categories = ARRAY['graduate-program', 'business-graduate', 'early-career']
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(graduate\s*program|graduate\s*scheme|trainee\s*program|associate\s*program|junior\s*program|analyst\s*programme|2026\s*graduate|2026\s*mufg\s*uk\s*analyst\s*programme)\b';

-- ============================================================================
-- STEP 7: FINAL CLEANUP AND OPTIMIZATION
-- ============================================================================

-- Remove any remaining non-business categories from business jobs
UPDATE jobs 
SET categories = array_remove(categories, 'product-innovation')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND 'product-innovation' = ANY(categories)
  AND NOT LOWER(title) ~ '\b(product\s*manager|product\s*owner|product\s*analyst|product\s*specialist|assistant\s*product\s*developer)\b';

-- Ensure all business jobs have proper work environment
UPDATE jobs 
SET work_environment = 'on-site'
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND work_environment IS NULL;

-- Set proper job level
UPDATE jobs 
SET job_level = CASE 
  WHEN LOWER(title) ~ '\b(intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria)\b' THEN 'intern'
  WHEN LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level)\b' THEN 'entry'
  WHEN LOWER(title) ~ '\b(senior|lead|principal|manager|director|head\s*of|vp|vice\s*president|executive|chief)\b' THEN 'senior'
  ELSE 'mid'
END
WHERE created_at > NOW() - INTERVAL '2 hours';

-- ============================================================================
-- STEP 8: FINAL VALIDATION
-- ============================================================================

-- Show final results
SELECT 
  'OPTIMIZATION COMPLETE' as status,
  COUNT(*) as total_business_jobs,
  COUNT(CASE WHEN 'business-graduate' = ANY(categories) THEN 1 END) as business_graduate_jobs,
  COUNT(CASE WHEN 'early-career' = ANY(categories) THEN 1 END) as early_career_jobs,
  COUNT(CASE WHEN 'internship' = ANY(categories) THEN 1 END) as internship_jobs,
  COUNT(CASE WHEN 'graduate-program' = ANY(categories) THEN 1 END) as graduate_program_jobs,
  COUNT(CASE WHEN experience_required = 'entry-level' THEN 1 END) as entry_level_jobs,
  COUNT(CASE WHEN 'finance' = ANY(categories) THEN 1 END) as finance_jobs,
  COUNT(CASE WHEN 'consulting' = ANY(categories) THEN 1 END) as consulting_jobs,
  COUNT(CASE WHEN 'marketing' = ANY(categories) THEN 1 END) as marketing_jobs,
  COUNT(CASE WHEN 'sales' = ANY(categories) THEN 1 END) as sales_jobs,
  COUNT(CASE WHEN 'analyst' = ANY(categories) THEN 1 END) as analyst_jobs
FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours';

-- Show sample of optimized jobs
SELECT 
  title,
  company,
  location,
  categories,
  experience_required,
  job_level
FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND 'business-graduate' = ANY(categories)
ORDER BY created_at DESC
LIMIT 10;

