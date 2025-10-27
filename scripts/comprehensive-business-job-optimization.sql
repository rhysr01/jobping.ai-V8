-- ============================================================================
-- COMPREHENSIVE BUSINESS JOB OPTIMIZATION SCRIPT
-- ============================================================================
-- This script fixes all classification issues and optimizes the database
-- for business school graduate jobs, internships, and early-career roles

-- ============================================================================
-- STEP 1: BACKUP AND ANALYSIS
-- ============================================================================

-- Create backup table before making changes
CREATE TABLE IF NOT EXISTS jobs_backup_before_optimization AS 
SELECT * FROM jobs WHERE created_at > NOW() - INTERVAL '2 hours';

-- Show current state
SELECT 
  'BEFORE OPTIMIZATION' as status,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN categories = ARRAY['early-career'] THEN 1 END) as early_career,
  COUNT(CASE WHEN categories = ARRAY['experienced'] THEN 1 END) as experienced,
  COUNT(CASE WHEN 'internship' = ANY(categories) THEN 1 END) as internships,
  COUNT(CASE WHEN experience_required = 'entry-level' THEN 1 END) as entry_level,
  COUNT(CASE WHEN experience_required = 'experienced' THEN 1 END) as exp_level
FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours';

-- ============================================================================
-- STEP 2: REMOVE NON-BUSINESS JOBS
-- ============================================================================

-- Delete non-business jobs (jobs that don't match business criteria)
DELETE FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND NOT (
    -- Business analyst roles
    LOWER(title) ~ '\b(business\s*analyst|data\s*analyst|operations\s*analyst|financial\s*analyst|marketing\s*analyst|strategy\s*analyst|research\s*analyst|risk\s*analyst|credit\s*analyst|investment\s*analyst)\b' OR
    
    -- Consulting roles
    LOWER(title) ~ '\b(consultant|consulting|advisory|strategy\s*consultant|management\s*consultant|business\s*consultant|tax\s*consultant|financial\s*consultant)\b' OR
    
    -- Finance roles
    LOWER(title) ~ '\b(finance|financial|accounting|audit|investment|banking|trading|treasury|corporate\s*finance|private\s*equity|venture\s*capital|asset\s*management)\b' OR
    
    -- Marketing roles
    LOWER(title) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|marketing\s*manager|brand\s*manager|content\s*marketing|social\s*media)\b' OR
    
    -- Sales roles
    LOWER(title) ~ '\b(sales|business\s*development|account\s*manager|relationship\s*manager|sales\s*manager|commercial|revenue|partnership)\b' OR
    
    -- Operations roles
    LOWER(title) ~ '\b(operations|logistics|supply\s*chain|project\s*manager|program\s*manager|operations\s*manager|process\s*manager)\b' OR
    
    -- HR roles
    LOWER(title) ~ '\b(hr|human\s*resources|recruitment|talent|people|workforce|hr\s*manager|talent\s*acquisition)\b' OR
    
    -- Graduate/Entry level roles
    LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level|intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria)\b' OR
    
    -- Management roles (but only if early career indicators present)
    (LOWER(title) ~ '\b(manager|supervisor|coordinator|specialist|officer|director|head\s*of)\b' AND 
     LOWER(title) ~ '\b(junior|associate|trainee|graduate|entry|intern|stage|prácticas|praktikum)\b') OR
    
    -- Business support roles
    LOWER(title) ~ '\b(business\s*support|administrative|executive\s*assistant|office\s*manager|receptionist)\b' OR
    
    -- Strategy roles
    LOWER(title) ~ '\b(strategy|strategic|planning|business\s*planning|corporate\s*strategy)\b' OR
    
    -- Product roles
    LOWER(title) ~ '\b(product\s*manager|product\s*owner|product\s*analyst|product\s*specialist)\b' OR
    
    -- Data roles (business-focused)
    LOWER(title) ~ '\b(data\s*analyst|business\s*intelligence|reporting\s*analyst|insights\s*analyst)\b'
  );

-- ============================================================================
-- STEP 3: FIX EXPERIENCE LEVEL CLASSIFICATION
-- ============================================================================

-- Update experience_required for business jobs based on title analysis
UPDATE jobs 
SET experience_required = 'entry-level'
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    -- Early career indicators
    LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level|intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria|apprentice|apprenti)\b' OR
    
    -- Recent graduate programs
    LOWER(title) ~ '\b(graduate\s*program|graduate\s*scheme|trainee\s*program|associate\s*program|junior\s*program)\b' OR
    
    -- Entry-level business roles
    LOWER(title) ~ '\b(entry\s*level|junior|associate|trainee|graduate)\b' AND 
    LOWER(title) ~ '\b(analyst|consultant|finance|marketing|sales|operations|business|manager|specialist|officer)\b'
  );

-- Update experience_required to 'experienced' for senior roles
UPDATE jobs 
SET experience_required = 'experienced'
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) ~ '\b(senior|lead|principal|director|head\s*of|vp|vice\s*president|architect|specialist|manager|executive|chief)\b' AND
    NOT LOWER(title) ~ '\b(junior|associate|trainee|graduate|entry|intern|stage|prácticas|praktikum)\b'
  );

-- ============================================================================
-- STEP 4: FIX CATEGORY CLASSIFICATION
-- ============================================================================

-- Update categories for early career business jobs
UPDATE jobs 
SET categories = ARRAY['business-graduate', 'early-career']
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND experience_required = 'entry-level'
  AND (
    LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level|intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria)\b' OR
    LOWER(title) ~ '\b(graduate\s*program|graduate\s*scheme|trainee\s*program|associate\s*program|junior\s*program)\b'
  );

-- Update categories for internship roles
UPDATE jobs 
SET categories = ARRAY['internship', 'business-graduate', 'early-career']
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND (
    LOWER(title) ~ '\b(intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria|afstudeerstage|pflichtpraktikum)\b' OR
    LOWER(title) ~ '\b(summer\s*intern|winter\s*intern|spring\s*intern|industrial\s*placement|placement\s*year)\b'
  );

-- Update categories for experienced business roles
UPDATE jobs 
SET categories = ARRAY['business-professional', 'experienced']
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND experience_required = 'experienced'
  AND NOT 'internship' = ANY(categories);

-- ============================================================================
-- STEP 5: ADD BUSINESS SPECIALIZATION CATEGORIES
-- ============================================================================

-- Add finance specialization
UPDATE jobs 
SET categories = array_append(categories, 'finance')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(finance|financial|accounting|audit|investment|banking|trading|treasury|corporate\s*finance|private\s*equity|venture\s*capital|asset\s*management|risk|credit)\b';

-- Add consulting specialization
UPDATE jobs 
SET categories = array_append(categories, 'consulting')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(consultant|consulting|advisory|strategy\s*consultant|management\s*consultant|business\s*consultant|tax\s*consultant)\b';

-- Add marketing specialization
UPDATE jobs 
SET categories = array_append(categories, 'marketing')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(marketing|brand|digital\s*marketing|product\s*marketing|growth\s*marketing|content\s*marketing|social\s*media)\b';

-- Add sales specialization
UPDATE jobs 
SET categories = array_append(categories, 'sales')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(sales|business\s*development|account\s*manager|relationship\s*manager|commercial|revenue|partnership)\b';

-- Add operations specialization
UPDATE jobs 
SET categories = array_append(categories, 'operations')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(operations|logistics|supply\s*chain|project\s*manager|program\s*manager|process\s*manager)\b';

-- Add analyst specialization
UPDATE jobs 
SET categories = array_append(categories, 'analyst')
WHERE created_at > NOW() - INTERVAL '2 hours'
  AND LOWER(title) ~ '\b(analyst|business\s*intelligence|reporting\s*analyst|insights\s*analyst|data\s*analyst)\b';

-- ============================================================================
-- STEP 6: OPTIMIZE WORK ENVIRONMENT AND JOB LEVELS
-- ============================================================================

-- Set work environment based on location
UPDATE jobs 
SET work_environment = CASE 
  WHEN LOWER(location) LIKE '%remote%' OR LOWER(title) LIKE '%remote%' THEN 'remote'
  WHEN LOWER(location) LIKE '%hybrid%' OR LOWER(title) LIKE '%hybrid%' THEN 'hybrid'
  ELSE 'on-site'
END
WHERE created_at > NOW() - INTERVAL '2 hours';

-- Set job level based on title analysis
UPDATE jobs 
SET job_level = CASE 
  WHEN LOWER(title) ~ '\b(intern|internship|stage|prácticas|praktikum|tirocinio|stagista|stagiaire|becario|becaria)\b' THEN 'intern'
  WHEN LOWER(title) ~ '\b(graduate|trainee|associate|junior|entry\s*level)\b' THEN 'entry'
  WHEN LOWER(title) ~ '\b(senior|lead|principal|manager|director|head\s*of|vp|vice\s*president|executive|chief)\b' THEN 'senior'
  ELSE 'mid'
END
WHERE created_at > NOW() - INTERVAL '2 hours';

-- ============================================================================
-- STEP 7: CLEAN UP DUPLICATES AND OPTIMIZE
-- ============================================================================

-- Remove exact duplicates based on job_hash
DELETE FROM jobs 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY job_hash ORDER BY created_at DESC) as rn
    FROM jobs 
    WHERE created_at > NOW() - INTERVAL '2 hours'
  ) t WHERE rn > 1
);

-- ============================================================================
-- STEP 8: FINAL OPTIMIZATION AND VALIDATION
-- ============================================================================

-- Update last_seen_at for all recent jobs
UPDATE jobs 
SET last_seen_at = NOW()
WHERE created_at > NOW() - INTERVAL '2 hours';

-- Ensure all business jobs are active
UPDATE jobs 
SET is_active = true
WHERE created_at > NOW() - INTERVAL '2 hours';

-- ============================================================================
-- STEP 9: FINAL ANALYSIS AND REPORTING
-- ============================================================================

-- Show final state
SELECT 
  'AFTER OPTIMIZATION' as status,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN 'business-graduate' = ANY(categories) THEN 1 END) as business_graduate_jobs,
  COUNT(CASE WHEN 'early-career' = ANY(categories) THEN 1 END) as early_career_jobs,
  COUNT(CASE WHEN 'internship' = ANY(categories) THEN 1 END) as internship_jobs,
  COUNT(CASE WHEN experience_required = 'entry-level' THEN 1 END) as entry_level_jobs,
  COUNT(CASE WHEN experience_required = 'experienced' THEN 1 END) as experienced_jobs,
  COUNT(CASE WHEN 'finance' = ANY(categories) THEN 1 END) as finance_jobs,
  COUNT(CASE WHEN 'consulting' = ANY(categories) THEN 1 END) as consulting_jobs,
  COUNT(CASE WHEN 'marketing' = ANY(categories) THEN 1 END) as marketing_jobs,
  COUNT(CASE WHEN 'sales' = ANY(categories) THEN 1 END) as sales_jobs,
  COUNT(CASE WHEN 'operations' = ANY(categories) THEN 1 END) as operations_jobs,
  COUNT(CASE WHEN 'analyst' = ANY(categories) THEN 1 END) as analyst_jobs
FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours';

-- Geographic distribution after optimization
SELECT 
  'GEOGRAPHIC DISTRIBUTION' as analysis_type,
  CASE 
    WHEN location ILIKE '%london%' THEN 'London'
    WHEN location ILIKE '%madrid%' THEN 'Madrid'
    WHEN location ILIKE '%berlin%' THEN 'Berlin'
    WHEN location ILIKE '%paris%' THEN 'Paris'
    WHEN location ILIKE '%dublin%' THEN 'Dublin'
    WHEN location ILIKE '%amsterdam%' THEN 'Amsterdam'
    WHEN location ILIKE '%munich%' THEN 'Munich'
    WHEN location ILIKE '%milan%' THEN 'Milan'
    WHEN location ILIKE '%rome%' THEN 'Rome'
    WHEN location ILIKE '%zurich%' THEN 'Zurich'
    WHEN location ILIKE '%hamburg%' THEN 'Hamburg'
    WHEN location ILIKE '%brussels%' THEN 'Brussels'
    WHEN location ILIKE '%barcelona%' THEN 'Barcelona'
    ELSE 'Other'
  END as city,
  COUNT(*) as job_count,
  COUNT(CASE WHEN 'business-graduate' = ANY(categories) THEN 1 END) as business_jobs
FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
GROUP BY city
ORDER BY business_jobs DESC;

-- Top companies after optimization
SELECT 
  'TOP COMPANIES' as analysis_type,
  company,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN 'business-graduate' = ANY(categories) THEN 1 END) as business_jobs,
  COUNT(CASE WHEN 'internship' = ANY(categories) THEN 1 END) as internship_jobs
FROM jobs 
WHERE created_at > NOW() - INTERVAL '2 hours'
GROUP BY company
HAVING COUNT(*) >= 3
ORDER BY business_jobs DESC, total_jobs DESC
LIMIT 20;

-- ============================================================================
-- STEP 10: CREATE INDEXES FOR OPTIMAL PERFORMANCE
-- ============================================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_business_graduate ON jobs USING GIN (categories) WHERE 'business-graduate' = ANY(categories);
CREATE INDEX IF NOT EXISTS idx_jobs_early_career ON jobs USING GIN (categories) WHERE 'early-career' = ANY(categories);
CREATE INDEX IF NOT EXISTS idx_jobs_internship ON jobs USING GIN (categories) WHERE 'internship' = ANY(categories);
CREATE INDEX IF NOT EXISTS idx_jobs_experience_level ON jobs (experience_required) WHERE created_at > NOW() - INTERVAL '7 days';
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs (location) WHERE created_at > NOW() - INTERVAL '7 days';
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs (company) WHERE created_at > NOW() - INTERVAL '7 days';
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs (created_at DESC);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 
  'OPTIMIZATION COMPLETE' as status,
  'Database optimized for business school graduate jobs' as message,
  NOW() as completed_at;

