-- ============================================================================
-- FIX DUPLICATE FINGERPRINTS IN JOBS TABLE
-- Run this if you get duplicate fingerprint errors during migration
-- ============================================================================

-- First, add the fingerprint column if it doesn't exist (make it larger to handle job IDs)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'fingerprint') THEN
        ALTER TABLE jobs ADD COLUMN fingerprint VARCHAR(100);
        RAISE NOTICE 'Added fingerprint column to jobs table';
    ELSE
        -- If column exists but is too small, increase it
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'fingerprint' AND character_maximum_length < 100) THEN
            ALTER TABLE jobs ALTER COLUMN fingerprint TYPE VARCHAR(100);
            RAISE NOTICE 'Increased fingerprint column size to 100 characters';
        END IF;
    END IF;
END $$;

-- Generate fingerprints for all jobs that don't have them
UPDATE jobs SET fingerprint = encode(
    digest(
        COALESCE(company, '') || '|' || 
        COALESCE(title, '') || '|' || 
        COALESCE(location_name, '') || '|' || 
        COALESCE(posted_at::text, ''),
        'sha256'
    ), 'hex'
) WHERE fingerprint IS NULL;

-- Now let's see what duplicates we have
SELECT 
    fingerprint, 
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as job_ids
FROM jobs 
WHERE fingerprint IS NOT NULL
GROUP BY fingerprint 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 10;

-- Fix duplicates by appending job ID to make them unique
DO $$
DECLARE
    duplicate_count INTEGER;
    fixed_count INTEGER := 0;
BEGIN
    -- Count total duplicates
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT fingerprint, COUNT(*) as cnt
        FROM jobs 
        WHERE fingerprint IS NOT NULL
        GROUP BY fingerprint
        HAVING COUNT(*) > 1
    ) duplicates;
    
    RAISE NOTICE 'Found % duplicate fingerprints to fix', duplicate_count;
    
    -- Fix each duplicate by appending job ID
    WITH duplicates AS (
        SELECT fingerprint, id
        FROM jobs 
        WHERE fingerprint IN (
            SELECT fingerprint 
            FROM jobs 
            WHERE fingerprint IS NOT NULL
            GROUP BY fingerprint 
            HAVING COUNT(*) > 1
        )
        ORDER BY fingerprint, id
    ),
    fixed AS (
        UPDATE jobs 
        SET fingerprint = jobs.fingerprint || '_' || jobs.id::text
        FROM duplicates d
        WHERE jobs.id = d.id
        AND jobs.fingerprint = d.fingerprint
        RETURNING jobs.id
    )
    SELECT COUNT(*) INTO fixed_count FROM fixed;
    
    RAISE NOTICE 'Fixed % duplicate fingerprints', fixed_count;
    
    -- Verify no duplicates remain
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT fingerprint, COUNT(*) as cnt
        FROM jobs 
        WHERE fingerprint IS NOT NULL
        GROUP BY fingerprint
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All fingerprints are now unique';
    ELSE
        RAISE WARNING 'WARNING: % duplicates still exist', duplicate_count;
    END IF;
END $$;

-- Verify the fix worked
SELECT 
    'VERIFICATION' as status,
    COUNT(*) as total_jobs,
    COUNT(DISTINCT fingerprint) as unique_fingerprints,
    COUNT(*) - COUNT(DISTINCT fingerprint) as remaining_duplicates
FROM jobs 
WHERE fingerprint IS NOT NULL;

-- Show sample of fixed fingerprints
SELECT 
    fingerprint,
    company,
    title,
    location_name
FROM jobs 
WHERE fingerprint LIKE '%_%'
LIMIT 5;
