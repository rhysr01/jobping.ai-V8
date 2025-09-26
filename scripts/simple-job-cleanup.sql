-- =====================================================
-- SIMPLE JOB DATABASE CLEANUP
-- =====================================================
-- Keep only jobs that have: company, location, url
-- These are the essential fields for quality matches

-- Step 1: Check current state
SELECT 
  'BEFORE CLEANUP' as status,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN company IS NOT NULL AND company != '' THEN 1 END) as has_company,
  COUNT(CASE WHEN location IS NOT NULL AND location != '' THEN 1 END) as has_location,
  COUNT(CASE WHEN job_url IS NOT NULL AND job_url != '' THEN 1 END) as has_url,
  COUNT(CASE WHEN company IS NOT NULL AND company != '' 
             AND location IS NOT NULL AND location != '' 
             AND job_url IS NOT NULL AND job_url != '' THEN 1 END) as quality_jobs
FROM jobs;

-- Step 2: Delete jobs missing essential fields
DELETE FROM jobs 
WHERE company IS NULL OR company = '' 
   OR location IS NULL OR location = '' 
   OR job_url IS NULL OR job_url = '';

-- Step 3: Clean up any remaining empty strings
UPDATE jobs 
SET company = TRIM(company),
    location = TRIM(location),
    job_url = TRIM(job_url)
WHERE company IS NOT NULL OR location IS NOT NULL OR job_url IS NOT NULL;

-- Step 4: Remove duplicates based on job_url (same job posted multiple times)
DELETE FROM jobs 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM jobs 
  GROUP BY job_url
);

-- Step 5: Final quality check
SELECT 
  'AFTER CLEANUP' as status,
  COUNT(*) as total_jobs,
  COUNT(CASE WHEN company IS NOT NULL AND company != '' THEN 1 END) as has_company,
  COUNT(CASE WHEN location IS NOT NULL AND location != '' THEN 1 END) as has_location,
  COUNT(CASE WHEN job_url IS NOT NULL AND job_url != '' THEN 1 END) as has_url,
  COUNT(CASE WHEN company IS NOT NULL AND company != '' 
             AND location IS NOT NULL AND location != '' 
             AND job_url IS NOT NULL AND job_url != '' THEN 1 END) as quality_jobs
FROM jobs;

-- Step 6: Show sample of remaining jobs
SELECT id, title, company, location, job_url, source
FROM jobs 
ORDER BY created_at DESC
LIMIT 5;
