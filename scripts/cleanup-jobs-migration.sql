-- =====================================================
-- JOB DATABASE CLEANUP MIGRATION
-- =====================================================
-- Run this as a migration to clean up job data quality

-- Step 1: Create a backup of current jobs
CREATE TABLE jobs_backup AS SELECT * FROM jobs;

-- Step 2: Delete jobs missing essential fields (company, location, url)
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

-- Step 5: Update the fingerprint for remaining jobs
UPDATE jobs 
SET fingerprint = MD5(CONCAT(title, company, location, job_url))
WHERE fingerprint IS NULL;

-- Step 6: Show final results
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
