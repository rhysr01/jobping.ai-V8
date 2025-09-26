-- =====================================================
-- JOB DATABASE CLEANUP SCRIPT
-- =====================================================
-- This script cleans up the jobs table to ensure all jobs have
-- quality title, company, url, location, and description data

-- Step 1: Identify and mark problematic jobs
CREATE TEMP TABLE problematic_jobs AS
SELECT id, 
  CASE 
    WHEN title = '' OR title IS NULL THEN 'empty_title'
    WHEN company = '' OR company IS NULL THEN 'empty_company'
    WHEN job_url = '' OR job_url IS NULL THEN 'empty_url'
    WHEN location = '' OR location IS NULL THEN 'empty_location'
    WHEN description = '' OR description IS NULL THEN 'empty_description'
    WHEN LENGTH(description) < 50 THEN 'short_description'
    WHEN LENGTH(title) < 3 THEN 'short_title'
    WHEN LENGTH(company) < 2 THEN 'short_company'
    ELSE 'ok'
  END as issue_type
FROM jobs;

-- Step 2: Show summary of issues
SELECT 
  issue_type,
  COUNT(*) as count
FROM problematic_jobs
WHERE issue_type != 'ok'
GROUP BY issue_type
ORDER BY count DESC;

-- Step 3: Delete jobs with critical missing data
-- (These jobs would make terrible matches)
DELETE FROM jobs 
WHERE id IN (
  SELECT id FROM problematic_jobs 
  WHERE issue_type IN (
    'empty_title', 
    'empty_company', 
    'empty_url',
    'short_title',
    'short_company'
  )
);

-- Step 4: For jobs with missing descriptions, try to create basic ones
UPDATE jobs 
SET description = CONCAT(
  'We are looking for a ', title, ' at ', company, 
  ' in ', location, '. This is an exciting opportunity to join our team.'
)
WHERE description = '' OR description IS NULL
AND title IS NOT NULL 
AND company IS NOT NULL 
AND location IS NOT NULL;

-- Step 5: For jobs with missing locations, try to infer from other data
UPDATE jobs 
SET location = 'Remote' 
WHERE location = '' OR location IS NULL
AND work_location = 'remote';

UPDATE jobs 
SET location = CONCAT(city, ', ', country)
WHERE location = '' OR location IS NULL
AND city IS NOT NULL 
AND country IS NOT NULL;

-- Step 6: For jobs with missing URLs, mark them as inactive
UPDATE jobs 
SET is_active = false
WHERE job_url = '' OR job_url IS NULL;

-- Step 7: Clean up malformed data where fields are mixed up
-- (Some jobs have description in title field, etc.)
UPDATE jobs 
SET title = TRIM(REGEXP_REPLACE(title, '^[*\-\s]+', ''))
WHERE title LIKE '*%' OR title LIKE '-%';

-- Step 8: Remove duplicate jobs based on fingerprint
DELETE FROM jobs 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM jobs 
  WHERE fingerprint IS NOT NULL
  GROUP BY fingerprint
);

-- Step 9: Final quality check
SELECT 
  'FINAL QUALITY CHECK' as status,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN title IS NOT NULL AND title != '' THEN 1 END) as has_title,
  COUNT(CASE WHEN company IS NOT NULL AND company != '' THEN 1 END) as has_company,
  COUNT(CASE WHEN job_url IS NOT NULL AND job_url != '' THEN 1 END) as has_url,
  COUNT(CASE WHEN location IS NOT NULL AND location != '' THEN 1 END) as has_location,
  COUNT(CASE WHEN description IS NOT NULL AND description != '' AND LENGTH(description) >= 50 THEN 1 END) as has_good_description,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_jobs
FROM jobs;

-- Step 10: Show remaining issues
SELECT 
  'REMAINING ISSUES' as status,
  COUNT(CASE WHEN title = '' OR title IS NULL THEN 1 END) as empty_titles,
  COUNT(CASE WHEN company = '' OR company IS NULL THEN 1 END) as empty_companies,
  COUNT(CASE WHEN job_url = '' OR job_url IS NULL THEN 1 END) as empty_urls,
  COUNT(CASE WHEN location = '' OR location IS NULL THEN 1 END) as empty_locations,
  COUNT(CASE WHEN description = '' OR description IS NULL THEN 1 END) as empty_descriptions,
  COUNT(CASE WHEN LENGTH(description) < 50 THEN 1 END) as short_descriptions
FROM jobs;
