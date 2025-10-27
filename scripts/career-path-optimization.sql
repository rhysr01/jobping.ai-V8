-- ============================================================================
-- CAREER PATH + INTERNSHIP/GRADUATE OPTIMIZATION SCRIPT
-- ============================================================================
-- This script optimizes for career path roles (business functions) + internships/graduates
-- Based on the actual database schema and existing categories

-- ============================================================================
-- STEP 1: REMOVE NON-BUSINESS JOBS
-- ============================================================================

-- Delete jobs that are not career path roles or internship/graduate roles
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND NOT (
    -- Career path roles (business function categories)
    'operations-supply-chain' = ANY(categories) OR
    'strategy-business-design' = ANY(categories) OR
    'data-analytics' = ANY(categories) OR
    'finance-investment' = ANY(categories) OR
    'sales-client-success' = ANY(categories) OR
    'marketing-growth' = ANY(categories) OR
    'sustainability-esg' = ANY(categories) OR
    'retail-luxury' = ANY(categories) OR
    
    -- Internship/graduate roles
    'internship' = ANY(categories) OR
    is_internship = true OR
    is_graduate = true OR
    
    -- Early career business roles (by title analysis)
    LOWER(title) ~ '\b(business\s*analyst|data\s*analyst|operations\s*analyst|financial\s*analyst|marketing\s*analyst|strategy\s*analyst|research\s*analyst|risk\s*analyst|credit\s*analyst|investment\s*analyst|budget\s*control\s*analyst|systems\s*business\s*analyst|business\s*process\s*analyst|analyste\s*comptable|analyst\s*strategischer\s*einkauf|growth\s*data\s*analyst)\b' OR
    
    LOWER(title) ~ '\b(consultant|consulting|advisory|strategy\s*consultant|management\s*consultant|business\s*consultant|tax\s*consultant|financial\s*consultant|cloud\s*consultant|real\s*estate\s*valuation\s*consultant)\b' OR
    
    LOWER(title) ~ '\b(finance|financial|accounting|audit|investment|banking|trading|treasury|corporate\s*finance|private\s*equity|venture\s*capital|asset\s*management|financial\s*analyst|graduate\s*financial\s*analyst|analyste\s*multigestion|analyste\s*investissement)\b' OR
    
    LOWER(title) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|marketing\s*manager|brand\s*manager|content\s*marketing|social\s*media|assistant\s*product\s*developer)\b' OR
    
    LOWER(title) ~ '\b(sales|business\s*development|account\s*manager|relationship\s*manager|sales\s*manager|commercial|revenue|partnership|business\s*developer|commerciale|recruitment\s*consultant)\b' OR
    
    LOWER(title) ~ '\b(operations|logistics|supply\s*chain|project\s*manager|program\s*manager|operations\s*manager|process\s*manager|procurement\s*analyst|strategischer\s*einkauf)\b' OR
    
    LOWER(title) ~ '\b(hr|human\s*resources|recruitment|talent|people|workforce|hr\s*manager|talent\s*acquisition|trainee\s*recruitment\s*consultant)\b' OR
    
    LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level|intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria|apprentice|apprenti)\b' OR
    
    LOWER(title) ~ '\b(strategy|strategic|planning|business\s*planning|corporate\s*strategy|strategy\s*business\s*design)\b' OR
    
    LOWER(title) ~ '\b(product\s*manager|product\s*owner|product\s*analyst|product\s*specialist|assistant\s*product\s*developer)\b'
  );

-- ============================================================================
-- STEP 2: FIX EXPERIENCE LEVEL CLASSIFICATION
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
-- STEP 3: ADD BUSINESS-GRADUATE CATEGORY
-- ============================================================================

-- Add business-graduate category to all career path and internship/graduate jobs
UPDATE jobs 
SET categories = array_append(categories, 'business-graduate')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND NOT 'business-graduate' = ANY(categories)
  AND (
    -- Career path roles
    'operations-supply-chain' = ANY(categories) OR
    'strategy-business-design' = ANY(categories) OR
    'data-analytics' = ANY(categories) OR
    'finance-investment' = ANY(categories) OR
    'sales-client-success' = ANY(categories) OR
    'marketing-growth' = ANY(categories) OR
    'sustainability-esg' = ANY(categories) OR
    'retail-luxury' = ANY(categories) OR
    
    -- Internship/graduate roles
    'internship' = ANY(categories) OR
    is_internship = true OR
    is_graduate = true OR
    
    -- Business roles by title
    LOWER(title) ~ '\b(business\s*analyst|data\s*analyst|operations\s*analyst|financial\s*analyst|marketing\s*analyst|strategy\s*analyst|research\s*analyst|risk\s*analyst|credit\s*analyst|investment\s*analyst|budget\s*control\s*analyst|systems\s*business\s*analyst|business\s*process\s*analyst|analyste\s*comptable|analyst\s*strategischer\s*einkauf|growth\s*data\s*analyst)\b' OR
    
    LOWER(title) ~ '\b(consultant|consulting|advisory|strategy\s*consultant|management\s*consultant|business\s*consultant|tax\s*consultant|financial\s*consultant|cloud\s*consultant|real\s*estate\s*valuation\s*consultant)\b' OR
    
    LOWER(title) ~ '\b(finance|financial|accounting|audit|investment|banking|trading|treasury|corporate\s*finance|private\s*equity|venture\s*capital|asset\s*management|financial\s*analyst|graduate\s*financial\s*analyst|analyste\s*multigestion|analyste\s*investissement)\b' OR
    
    LOWER(title) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|marketing\s*manager|brand\s*manager|content\s*marketing|social\s*media|assistant\s*product\s*developer)\b' OR
    
    LOWER(title) ~ '\b(sales|business\s*development|account\s*manager|relationship\s*manager|sales\s*manager|commercial|revenue|partnership|business\s*developer|commerciale|recruitment\s*consultant)\b' OR
    
    LOWER(title) ~ '\b(operations|logistics|supply\s*chain|project\s*manager|program\s*manager|operations\s*manager|process\s*manager|procurement\s*analyst|strategischer\s*einkauf)\b' OR
    
    LOWER(title) ~ '\b(hr|human\s*resources|recruitment|talent|people|workforce|hr\s*manager|talent\s*acquisition|trainee\s*recruitment\s*consultant)\b' OR
    
    LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level|intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria|apprentice|apprenti)\b' OR
    
    LOWER(title) ~ '\b(strategy|strategic|planning|business\s*planning|corporate\s*strategy|strategy\s*business\s*design)\b' OR
    
    LOWER(title) ~ '\b(product\s*manager|product\s*owner|product\s*analyst|product\s*specialist|assistant\s*product\s*developer)\b'
  );

-- ============================================================================
-- STEP 4: FIX INTERNSHIP AND GRADUATE FLAGS
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
-- STEP 5: ADD GRADUATE PROGRAM CATEGORY
-- ============================================================================

-- Add graduate-program category for graduate programs
UPDATE jobs 
SET categories = array_append(categories, 'graduate-program')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(graduate\s*program|graduate\s*scheme|trainee\s*program|associate\s*program|junior\s*program|analyst\s*programme|2026\s*graduate|2026\s*mufg\s*uk\s*analyst\s*programme)\b'
  AND NOT 'graduate-program' = ANY(categories);

-- ============================================================================
-- STEP 6: FINAL OPTIMIZATION
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
-- STEP 7: FINAL VALIDATION
-- ============================================================================

-- Show final results
SELECT 
  'CAREER PATH + GRADUATE OPTIMIZATION COMPLETE' as status,
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
