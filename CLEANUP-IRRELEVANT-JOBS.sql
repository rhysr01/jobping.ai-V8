-- ============================================
-- JOBPING: Remove Irrelevant Jobs from Database
-- ============================================
-- Run this in Supabase SQL Editor
-- Total jobs to remove: ~304 (out of 660)
-- ============================================

-- Count before deletion
SELECT 'BEFORE CLEANUP' as status, COUNT(*) as total_jobs FROM jobs;

-- ============================================
-- DELETE IRRELEVANT JOBS
-- ============================================

DELETE FROM jobs
WHERE 
  -- 1. HAIRDRESSER (4 jobs)
  title ILIKE '%hairdresser%' OR
  
  -- 2. DRIVERS (5 jobs)
  title ILIKE '%HGV%' OR 
  title ILIKE '%truck driver%' OR 
  title ILIKE '%delivery driver%' OR
  
  -- 3. HEALTHCARE (9 jobs)
  title ILIKE '%dental nurse%' OR
  title ILIKE '%doctor%' OR
  title ILIKE '%nurse%' OR
  title ILIKE '%veterinary%' OR
  title ILIKE '%WCA Doctor%' OR
  
  -- 4. TRADES (17 jobs - but keep "trainee electrician" as it may be engineering)
  title ILIKE '%apprentice mechanic%' OR
  title ILIKE '%apprentice plumber%' OR
  title ILIKE '%plumber%' OR
  title ILIKE '%mechanic%' AND title NOT ILIKE '%mechanical engineer%' AND title NOT ILIKE '%mechanical design%' OR
  
  -- 5. MANUAL LABOR (5 jobs)
  title ILIKE '%warehouse operative%' OR
  title ILIKE '%warehouse employee%' OR
  title ILIKE '%cleaner%' OR
  
  -- 6. RETAIL (4 jobs)
  title ILIKE '%cashier%' OR
  title ILIKE '%retail assistant%' OR
  
  -- 7. SPECIALIZED NON-BUSINESS (10 jobs)
  title ILIKE '%acoustic consultant%' OR
  title ILIKE '%laboratory technician%' OR
  title ILIKE '%laboratory assistant%' OR
  title ILIKE '%laboratory analyst%' OR
  
  -- 8. SENIOR/LEADERSHIP ROLES (232 jobs - largest cleanup!)
  title ILIKE '%senior %' OR
  title ILIKE '%sr. %' OR
  title ILIKE '%director%' AND title NOT ILIKE '%trainee%' AND title NOT ILIKE '%junior%' OR
  title ILIKE '%head of%' OR
  title ILIKE '%VP %' OR
  title ILIKE '%vice president%' OR
  title ILIKE '%principal %' OR
  
  -- 9. OTHER IRRELEVANT (18 jobs)
  title ILIKE '%veterinary surgeon%' OR
  title ILIKE '%head of finance%' OR
  title ILIKE '%head of product%' OR
  title ILIKE '%head of resident%';

-- Count after deletion
SELECT 'AFTER CLEANUP' as status, COUNT(*) as total_jobs FROM jobs;

-- Show breakdown of remaining jobs by category
SELECT 
  CASE 
    WHEN title ILIKE '%analyst%' THEN 'Analyst Roles'
    WHEN title ILIKE '%engineer%' OR title ILIKE '%developer%' THEN 'Engineering/Tech'
    WHEN title ILIKE '%consultant%' THEN 'Consulting'
    WHEN title ILIKE '%graduate%' OR title ILIKE '%trainee%' THEN 'Graduate Programs'
    WHEN title ILIKE '%sales%' OR title ILIKE '%account%' THEN 'Sales/Account Management'
    WHEN title ILIKE '%marketing%' THEN 'Marketing'
    WHEN title ILIKE '%finance%' OR title ILIKE '%accountant%' THEN 'Finance/Accounting'
    WHEN title ILIKE '%product%' THEN 'Product Management'
    ELSE 'Other Business Roles'
  END as category,
  COUNT(*) as job_count
FROM jobs
GROUP BY category
ORDER BY job_count DESC;

-- Sample of remaining jobs (should all be business school relevant)
SELECT title, company, location
FROM jobs
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- EXPECTED RESULTS:
-- ============================================
-- Before: 660 jobs
-- After: ~356 jobs (46% reduction)
-- All remaining jobs should be business school relevant:
--   ✅ Analyst roles (Business, Data, Finance, etc.)
--   ✅ Graduate programs/schemes
--   ✅ Junior/trainee business roles
--   ✅ Entry-level consulting, sales, marketing
--   ✅ Junior engineers (technical but graduate-level)
-- ============================================

