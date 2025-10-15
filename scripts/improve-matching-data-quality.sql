-- ============================================================================
-- IMPROVE MATCHING DATA QUALITY
-- ============================================================================
-- Extracts city/country from location, normalizes companies, and enriches data
-- Run after classify-early-career-jobs.sql for best results
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: EXTRACT CITY & COUNTRY FROM LOCATION FIELD
-- ============================================================================

-- Extract city and country from location using common patterns
UPDATE jobs
SET 
  city = CASE
    -- Handle "City, Country" pattern
    WHEN location ~ '^([^,]+),\s*([A-Z]{2,3})\s*$' THEN 
      TRIM(SPLIT_PART(location, ',', 1))
    -- Handle "City, State, Country" pattern  
    WHEN location ~ '^([^,]+),\s*([^,]+),\s*([A-Z]{2,3})\s*$' THEN
      TRIM(SPLIT_PART(location, ',', 1))
    -- Handle just city name
    WHEN location !~ ',' THEN TRIM(location)
    ELSE city
  END,
  country = CASE
    -- Extract 2-3 letter country codes
    WHEN location ~ ',\s*([A-Z]{2,3})\s*$' THEN
      TRIM(REGEXP_REPLACE(location, '^.+,\s*([A-Z]{2,3})\s*$', '\1'))
    -- Map common country names
    WHEN LOWER(location) LIKE '%united kingdom%' OR LOWER(location) LIKE '%uk%' THEN 'GB'
    WHEN LOWER(location) LIKE '%england%' THEN 'GB'
    WHEN LOWER(location) LIKE '%germany%' OR LOWER(location) LIKE '%deutschland%' THEN 'DE'
    WHEN LOWER(location) LIKE '%france%' THEN 'FR'
    WHEN LOWER(location) LIKE '%spain%' OR LOWER(location) LIKE '%españa%' THEN 'ES'
    WHEN LOWER(location) LIKE '%italy%' OR LOWER(location) LIKE '%italia%' THEN 'IT'
    WHEN LOWER(location) LIKE '%netherlands%' OR LOWER(location) LIKE '%nederland%' THEN 'NL'
    WHEN LOWER(location) LIKE '%belgium%' OR LOWER(location) LIKE '%belgi%' THEN 'BE'
    WHEN LOWER(location) LIKE '%switzerland%' OR LOWER(location) LIKE '%schweiz%' OR LOWER(location) LIKE '%suisse%' THEN 'CH'
    WHEN LOWER(location) LIKE '%ireland%' THEN 'IE'
    WHEN LOWER(location) LIKE '%austria%' OR LOWER(location) LIKE '%österreich%' THEN 'AT'
    WHEN LOWER(location) LIKE '%portugal%' THEN 'PT'
    ELSE country
  END,
  updated_at = now()
WHERE is_active = true
  AND location IS NOT NULL
  AND (city IS NULL OR country IS NULL);

SELECT 
  'After City/Country Extraction' as stage,
  COUNT(*) as total_active,
  COUNT(CASE WHEN city IS NOT NULL THEN 1 END) as has_city,
  COUNT(CASE WHEN country IS NOT NULL THEN 1 END) as has_country,
  ROUND(100.0 * COUNT(CASE WHEN city IS NOT NULL THEN 1 END) / COUNT(*), 2) || '%' as pct_with_city
FROM jobs
WHERE is_active = true;

-- ============================================================================
-- PART 2: NORMALIZE COMPANY NAMES
-- ============================================================================

-- Remove common suffixes to normalize company names
UPDATE jobs
SET 
  company_name = CASE
    WHEN company IS NULL THEN NULL
    ELSE TRIM(REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(company, 
          '\s+(Ltd|Limited|GmbH|AG|SA|S\.A\.|SRL|S\.L\.|B\.V\.|N\.V\.|plc|PLC|Inc|Inc\.|Corp|Corporation|S\.p\.A\.|SAS|SARL)\s*$', 
          '', 'i'),
        '\s+(UK|Deutschland|France|España|Italia)\s*$',
        '', 'i'),
      '\s+',
      ' '))
  END,
  updated_at = now()
WHERE is_active = true
  AND (company_name IS NULL OR company_name = '');

-- ============================================================================
-- PART 3: INFER LANGUAGE REQUIREMENTS FROM JOB DATA
-- ============================================================================

-- Extract language requirements from location, title, and description
UPDATE jobs
SET 
  language_requirements = ARRAY(
    SELECT DISTINCT lang FROM (
      -- English if UK/Ireland or English in description
      SELECT 'English' as lang 
      WHERE country IN ('GB', 'IE') 
        OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%english%'
      
      UNION
      
      -- German
      SELECT 'German' as lang
      WHERE country IN ('DE', 'AT', 'CH')
        OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%german%'
        OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%deutsch%'
      
      UNION
      
      -- French
      SELECT 'French' as lang
      WHERE country IN ('FR', 'BE', 'CH')
        OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%french%'
        OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%français%'
      
      UNION
      
      -- Spanish
      SELECT 'Spanish' as lang
      WHERE country = 'ES'
        OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%spanish%'
        OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%español%'
      
      UNION
      
      -- Italian
      SELECT 'Italian' as lang
      WHERE country = 'IT'
        OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%italian%'
        OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%italiano%'
      
      UNION
      
      -- Dutch
      SELECT 'Dutch' as lang
      WHERE country IN ('NL', 'BE')
        OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%dutch%'
        OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%nederlands%'
      
      UNION
      
      -- Portuguese
      SELECT 'Portuguese' as lang
      WHERE country = 'PT'
        OR LOWER(title || ' ' || COALESCE(description, '')) LIKE '%portuguese%'
    ) langs
  ),
  updated_at = now()
WHERE is_active = true
  AND (language_requirements = '{}' OR language_requirements IS NULL);

-- ============================================================================
-- PART 4: EXTRACT SALARY INFORMATION (if present in description)
-- ============================================================================

-- Add salary column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'jobs' AND column_name = 'salary_info') THEN
    ALTER TABLE jobs ADD COLUMN salary_info TEXT;
  END IF;
END $$;

-- Extract salary information from description
UPDATE jobs
SET 
  salary_info = CASE
    WHEN description ~ '£\d+[,\d]*\s*-\s*£\d+[,\d]*' THEN
      REGEXP_REPLACE(description, '.*(£\d+[,\d]*\s*-\s*£\d+[,\d]*).*', '\1')
    WHEN description ~ '€\d+[,\d]*\s*-\s*€\d+[,\d]*' THEN
      REGEXP_REPLACE(description, '.*(€\d+[,\d]*\s*-\s*€\d+[,\d]*).*', '\1')
    WHEN description ~ '\$\d+[,\d]*\s*-\s*\$\d+[,\d]*' THEN
      REGEXP_REPLACE(description, '.*(\$\d+[,\d]*\s*-\s*\$\d+[,\d]*).*', '\1')
    ELSE NULL
  END,
  updated_at = now()
WHERE is_active = true
  AND description IS NOT NULL
  AND (salary_info IS NULL OR salary_info = '');

-- ============================================================================
-- PART 5: IMPROVE WORK_ENVIRONMENT CLASSIFICATION
-- ============================================================================

-- Infer work environment from description if not set
UPDATE jobs
SET 
  work_environment = CASE
    WHEN description IS NULL THEN work_environment
    WHEN LOWER(description) LIKE '%fully remote%' OR LOWER(description) LIKE '%100% remote%' 
      OR LOWER(description) LIKE '%work from anywhere%' THEN 'remote'
    WHEN LOWER(description) LIKE '%hybrid%' OR LOWER(description) LIKE '%flexible working%' THEN 'hybrid'
    WHEN LOWER(description) LIKE '%on-site%' OR LOWER(description) LIKE '%office-based%' THEN 'on-site'
    ELSE work_environment
  END,
  updated_at = now()
WHERE is_active = true
  AND (work_environment IS NULL OR work_environment = '');

-- ============================================================================
-- PART 6: CALCULATE JOB AGE FOR FRESHNESS
-- ============================================================================

-- Add job_age_days column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'jobs' AND column_name = 'job_age_days') THEN
    ALTER TABLE jobs ADD COLUMN job_age_days INTEGER;
  END IF;
END $$;

-- Calculate job age in days
UPDATE jobs
SET 
  job_age_days = EXTRACT(DAY FROM (now() - COALESCE(posted_at, created_at)))::INTEGER,
  updated_at = now()
WHERE is_active = true;

-- ============================================================================
-- FINAL STATISTICS
-- ============================================================================

SELECT 
  '========================================' as divider;

SELECT 
  'DATA QUALITY IMPROVEMENTS COMPLETE' as status;

SELECT 
  COUNT(*) as total_active_jobs,
  COUNT(CASE WHEN city IS NOT NULL THEN 1 END) as has_city,
  COUNT(CASE WHEN country IS NOT NULL THEN 1 END) as has_country,
  COUNT(CASE WHEN language_requirements != '{}' THEN 1 END) as has_language_reqs,
  COUNT(CASE WHEN salary_info IS NOT NULL THEN 1 END) as has_salary_info,
  COUNT(CASE WHEN work_environment IS NOT NULL THEN 1 END) as has_work_environment,
  ROUND(100.0 * COUNT(CASE WHEN city IS NOT NULL THEN 1 END) / COUNT(*), 2) || '%' as pct_with_city,
  ROUND(100.0 * COUNT(CASE WHEN language_requirements != '{}' THEN 1 END) / COUNT(*), 2) || '%' as pct_with_languages
FROM jobs
WHERE is_active = true;

-- Show sample of improved data
SELECT 
  'SAMPLE IMPROVED DATA' as info;

SELECT 
  title,
  company,
  city,
  country,
  language_requirements,
  work_environment,
  job_age_days
FROM jobs
WHERE is_active = true
  AND city IS NOT NULL
  AND country IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

COMMIT;

-- ============================================================================
-- RECOMMENDATIONS FOR INDEXES
-- ============================================================================
-- Run these separately after the data improvements:
-- 
-- CREATE INDEX IF NOT EXISTS idx_jobs_city ON jobs(city) WHERE is_active = true;
-- CREATE INDEX IF NOT EXISTS idx_jobs_country ON jobs(country) WHERE is_active = true;
-- CREATE INDEX IF NOT EXISTS idx_jobs_is_graduate ON jobs(is_graduate) WHERE is_active = true;
-- CREATE INDEX IF NOT EXISTS idx_jobs_is_internship ON jobs(is_internship) WHERE is_active = true;
-- CREATE INDEX IF NOT EXISTS idx_jobs_work_environment ON jobs(work_environment) WHERE is_active = true;
-- CREATE INDEX IF NOT EXISTS idx_jobs_job_age ON jobs(job_age_days) WHERE is_active = true;
-- CREATE INDEX IF NOT EXISTS idx_jobs_company_name ON jobs(company_name) WHERE is_active = true;
-- ============================================================================

