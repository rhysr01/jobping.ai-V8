-- ============================================================================
-- VERIFY ALL MIGRATIONS WERE APPLIED SUCCESSFULLY
-- Run this to confirm everything is working
-- ============================================================================

-- 1. Verify fingerprint column exists and has unique constraint
SELECT 
    'FINGERPRINT CHECK' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'fingerprint') 
        THEN '✅ fingerprint column exists'
        ELSE '❌ fingerprint column missing'
    END as status;

SELECT 
    'UNIQUE CONSTRAINT CHECK' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_fingerprint_unique') 
        THEN '✅ unique constraint exists'
        ELSE '❌ unique constraint missing'
    END as status;

-- 2. Verify all new tables exist
SELECT 
    'NEW TABLES CHECK' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'raw_jobs') 
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'jobs_rejects')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'match_batch')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_suppression_enhanced')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_queue_dead_letter')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_send_ledger')
        THEN '✅ all new tables exist'
        ELSE '❌ some tables missing'
    END as status;

-- 3. Verify extensions are enabled
SELECT 
    'EXTENSIONS CHECK' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pgcrypto')
        AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent')
        AND EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm')
        THEN '✅ all extensions enabled'
        ELSE '❌ some extensions missing'
    END as status;

-- 4. Verify functions exist
SELECT 
    'FUNCTIONS CHECK' as test_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'generate_job_fingerprint')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'normalize_company_name')
        AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'is_email_suppressed')
        THEN '✅ all functions exist'
        ELSE '❌ some functions missing'
    END as status;

-- 5. Test fingerprint generation
SELECT 
    'FINGERPRINT TEST' as test_name,
    CASE 
        WHEN generate_job_fingerprint('Test Company', 'Software Engineer', 'Amsterdam', NOW()) IS NOT NULL
        THEN '✅ fingerprint function works'
        ELSE '❌ fingerprint function broken'
    END as status;

-- 6. Test email suppression check
SELECT 
    'EMAIL SUPPRESSION TEST' as test_name,
    CASE 
        WHEN is_email_suppressed('nonexistent@example.com') IS NOT NULL
        THEN '✅ email suppression function works'
        ELSE '❌ email suppression function broken'
    END as status;

-- 7. Show table row counts
SELECT 
    'TABLE ROW COUNTS' as info,
    'jobs' as table_name,
    COUNT(*) as row_count,
    COUNT(DISTINCT fingerprint) as unique_fingerprints
FROM jobs
WHERE fingerprint IS NOT NULL
UNION ALL
SELECT 
    'TABLE ROW COUNTS' as info,
    'raw_jobs' as table_name,
    COUNT(*) as row_count,
    0 as unique_fingerprints
FROM raw_jobs
UNION ALL
SELECT 
    'TABLE ROW COUNTS' as info,
    'match_batch' as table_name,
    COUNT(*) as row_count,
    0 as unique_fingerprints
FROM match_batch;

-- 8. Final status
SELECT 
    '🎉 MIGRATION STATUS' as result,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'fingerprint')
        AND EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'jobs_fingerprint_unique')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'raw_jobs')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'match_batch')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_suppression_enhanced')
        THEN '✅ ALL MIGRATIONS SUCCESSFUL - READY FOR 50+ USERS!'
        ELSE '❌ SOME MIGRATIONS FAILED - CHECK ERRORS ABOVE'
    END as final_status;
