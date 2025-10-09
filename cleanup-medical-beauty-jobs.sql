-- Remove medical, beauty, and technician jobs that slipped through
-- Run this in Supabase SQL Editor

-- Show what will be removed
SELECT 'JOBS TO REMOVE' as status, COUNT(*) as count FROM jobs
WHERE 
  title ILIKE '%biomedical scientist%' OR
  title ILIKE '%medical science liaison%' OR
  title ILIKE '%beauty consultant%' OR
  title ILIKE '%tecnico elettromedicale%' OR
  title ILIKE '%quality assurance analyst ii - medical%' OR
  title ILIKE '%heating technician%' OR
  title ILIKE '%motor technician%' OR
  title ILIKE '%molecular technician%' OR
  title ILIKE '%pharmasource technician%' OR
  title ILIKE '%service technician%' OR
  title ILIKE '%deskside technician%' OR
  title ILIKE '%power station%' OR
  title ILIKE '%wardrobe technician%' OR
  title ILIKE '%projections technician%';

-- Delete them
DELETE FROM jobs
WHERE 
  title ILIKE '%biomedical scientist%' OR
  title ILIKE '%medical science liaison%' OR
  title ILIKE '%beauty consultant%' OR
  title ILIKE '%tecnico elettromedicale%' OR
  title ILIKE '%quality assurance analyst ii - medical%' OR
  title ILIKE '%heating technician%' OR
  title ILIKE '%motor technician%' OR
  title ILIKE '%molecular technician%' OR
  title ILIKE '%pharmasource technician%' OR
  title ILIKE '%service technician%' OR
  title ILIKE '%deskside technician%' OR
  title ILIKE '%power station%' OR
  title ILIKE '%wardrobe technician%' OR
  title ILIKE '%projections technician%';

-- Verify removal
SELECT 'AFTER CLEANUP' as status, COUNT(*) as total_jobs FROM jobs;

-- Final check: No more medical/beauty roles
SELECT COUNT(*) as remaining_bad_jobs
FROM jobs
WHERE 
  title ILIKE '%biomedical%' OR
  title ILIKE '%medical science liaison%' OR
  title ILIKE '%beauty consultant%';

