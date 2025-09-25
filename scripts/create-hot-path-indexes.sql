-- ============================================================================
-- CREATE HOT PATH INDEXES
-- Critical indexes for performance at scale
-- ============================================================================

-- 1. Matches table - user_id + match_date (for daily batch lookups)
-- Use timestamp range instead of date function
CREATE INDEX IF NOT EXISTS idx_matches_user_email 
ON matches(user_email);

CREATE INDEX IF NOT EXISTS idx_matches_matched_at 
ON matches(matched_at);

-- 2. Email sends - user_id + send_date (for idempotency checks)
CREATE INDEX IF NOT EXISTS idx_email_send_ledger_user_email 
ON email_send_ledger(user_email);

CREATE INDEX IF NOT EXISTS idx_email_send_ledger_sent_at 
ON email_send_ledger(sent_at);

-- 3. Jobs - fingerprint (already exists, but verify)
-- This should already exist from previous migration

-- 4. Jobs - posted_at desc (for fresh job queries)
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at_desc 
ON jobs(posted_at DESC) 
WHERE posted_at IS NOT NULL;

-- 5. Match batch - user + date (for idempotency)
CREATE INDEX IF NOT EXISTS idx_match_batch_user_date 
ON match_batch(user_email, match_date);

-- 6. Email suppression - email lookup (for deliverability checks)
CREATE INDEX IF NOT EXISTS idx_email_suppression_email_active 
ON email_suppression_enhanced(user_email, is_active) 
WHERE is_active = TRUE;

-- 7. Jobs - active jobs with recent posted dates (hot query)
CREATE INDEX IF NOT EXISTS idx_jobs_active_recent 
ON jobs(posted_at DESC, id) 
WHERE is_active = TRUE AND posted_at IS NOT NULL;

-- 8. Users - active users (for matching queries)
CREATE INDEX IF NOT EXISTS idx_users_active 
ON users(email, active) 
WHERE active = TRUE;

-- 9. Dead letter queue - retry scheduling
CREATE INDEX IF NOT EXISTS idx_dead_letter_next_retry 
ON job_queue_dead_letter(next_retry_at, status) 
WHERE status IN ('failed', 'retrying');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE indexname IN (
    'idx_matches_user_email',
    'idx_matches_matched_at',
    'idx_email_send_ledger_user_email',
    'idx_email_send_ledger_sent_at', 
    'idx_jobs_posted_at_desc',
    'idx_match_batch_user_date',
    'idx_email_suppression_email_active',
    'idx_jobs_active_recent',
    'idx_users_active',
    'idx_dead_letter_next_retry'
)
ORDER BY tablename, indexname;

-- Test query performance (should use indexes)
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM matches 
WHERE user_email = 'test@example.com' 
AND matched_at >= CURRENT_DATE 
AND matched_at < CURRENT_DATE + INTERVAL '1 day';

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM jobs 
WHERE is_active = TRUE 
AND posted_at IS NOT NULL 
ORDER BY posted_at DESC 
LIMIT 10;
