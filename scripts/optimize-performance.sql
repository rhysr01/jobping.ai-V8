-- ============================================================================
-- PERFORMANCE OPTIMIZATION SCRIPT
-- Optimizes database performance for production scale
-- ============================================================================

-- ============================================================================
-- 1. ANALYZE TABLES FOR BETTER QUERY PLANNING
-- ============================================================================

-- Analyze all tables to update statistics
ANALYZE users;
ANALYZE jobs;
ANALYZE matches;
ANALYZE user_feedback;
ANALYZE email_send_ledger;
ANALYZE match_batch;
ANALYZE email_suppression_enhanced;
ANALYZE job_queue_dead_letter;
ANALYZE raw_jobs;
ANALYZE jobs_rejects;

-- ============================================================================
-- 2. CREATE ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_freshness_posted 
ON jobs(is_active, freshness_tier, posted_at DESC) 
WHERE is_active = TRUE AND posted_at IS NOT NULL;

-- Index for job matching queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_matching_criteria 
ON jobs(is_active, is_sent, created_at DESC, source) 
WHERE is_active = TRUE AND is_sent = FALSE;

-- Index for user activity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active_created 
ON users(active, created_at DESC) 
WHERE active = TRUE;

-- Index for email tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_email_send_ledger_user_date 
ON email_send_ledger(user_email, sent_at DESC, status);

-- Index for match analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_user_score_date 
ON matches(user_email, match_score DESC, matched_at DESC);

-- Index for feedback analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_feedback_verdict_date 
ON user_feedback(verdict, created_at DESC, feedback_type);

-- ============================================================================
-- 3. OPTIMIZE EXISTING INDEXES
-- ============================================================================

-- Drop unused or duplicate indexes
DROP INDEX IF EXISTS idx_jobs_posted_at;
DROP INDEX IF EXISTS idx_jobs_created_at;
DROP INDEX IF EXISTS idx_users_email_lower;

-- Recreate optimized versions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_posted_at_optimized 
ON jobs(posted_at DESC) 
WHERE posted_at IS NOT NULL AND is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_created_at_optimized 
ON jobs(created_at DESC) 
WHERE is_active = TRUE;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_optimized 
ON users(lower(email)) 
WHERE active = TRUE;

-- ============================================================================
-- 4. CREATE PARTIAL INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Index only active jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_active_partial 
ON jobs(id, title, company, location_name, posted_at) 
WHERE is_active = TRUE AND status = 'active';

-- Index only recent matches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_recent_partial 
ON matches(user_email, job_hash, match_score, matched_at) 
WHERE matched_at >= CURRENT_DATE - INTERVAL '30 days';

-- Index only pending queue items
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_queue_pending_partial 
ON job_queue(status, priority DESC, created_at ASC) 
WHERE status = 'pending';

-- ============================================================================
-- 5. OPTIMIZE TABLE SETTINGS
-- ============================================================================

-- Set fillfactor for tables with frequent updates
ALTER TABLE jobs SET (fillfactor = 90);
ALTER TABLE matches SET (fillfactor = 90);
ALTER TABLE email_send_ledger SET (fillfactor = 90);

-- Set fillfactor for read-heavy tables
ALTER TABLE users SET (fillfactor = 100);
ALTER TABLE user_feedback SET (fillfactor = 100);

-- ============================================================================
-- 6. CREATE MATERIALIZED VIEWS FOR COMPLEX QUERIES
-- ============================================================================

-- Materialized view for job statistics
DROP MATERIALIZED VIEW IF EXISTS mv_job_stats;
CREATE MATERIALIZED VIEW mv_job_stats AS
SELECT 
    source,
    freshness_tier,
    COUNT(*) as total_jobs,
    COUNT(*) FILTER (WHERE is_active = TRUE) as active_jobs,
    COUNT(*) FILTER (WHERE is_sent = FALSE) as unsent_jobs,
    AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - posted_at))/3600) as avg_age_hours,
    MAX(posted_at) as latest_job,
    MIN(posted_at) as oldest_job
FROM jobs 
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY source, freshness_tier;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_job_stats_source_tier 
ON mv_job_stats(source, freshness_tier);

-- Materialized view for user activity
DROP MATERIALIZED VIEW IF EXISTS mv_user_activity;
CREATE MATERIALIZED VIEW mv_user_activity AS
SELECT 
    u.email,
    u.active,
    u.created_at as user_created_at,
    COUNT(m.id) as total_matches,
    COUNT(m.id) FILTER (WHERE m.matched_at >= CURRENT_DATE - INTERVAL '7 days') as recent_matches,
    COUNT(uf.id) as total_feedback,
    MAX(esl.sent_at) as last_email_sent
FROM users u
LEFT JOIN matches m ON u.email = m.user_email
LEFT JOIN user_feedback uf ON u.email = uf.user_email
LEFT JOIN email_send_ledger esl ON u.email = esl.user_email
GROUP BY u.email, u.active, u.created_at;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_user_activity_email 
ON mv_user_activity(email);

-- ============================================================================
-- 7. CREATE REFRESH FUNCTION FOR MATERIALIZED VIEWS
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_job_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_activity;
    
    RAISE NOTICE 'Performance views refreshed at %', NOW();
END;
$$;

-- ============================================================================
-- 8. CREATE PERFORMANCE MONITORING FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_performance_stats()
RETURNS TABLE(
    table_name text,
    table_size text,
    index_size text,
    total_size text,
    row_count bigint,
    last_analyze timestamptz,
    last_autovacuum timestamptz
)
LANGUAGE sql
AS $$
SELECT 
    schemaname||'.'||tablename as table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    n_tup_ins + n_tup_upd + n_tup_del as row_count,
    last_analyze,
    last_autovacuum
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
$$;

-- ============================================================================
-- 9. OPTIMIZE QUERY SETTINGS
-- ============================================================================

-- Set work_mem for better sort performance (session level)
-- Note: These should be set in postgresql.conf for permanent effect
-- SET work_mem = '256MB';
-- SET shared_buffers = '256MB';
-- SET effective_cache_size = '1GB';

-- ============================================================================
-- 10. CREATE PERFORMANCE TESTING QUERIES
-- ============================================================================

-- Test query performance
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
SELECT j.*, m.match_score 
FROM jobs j
JOIN matches m ON j.job_hash = m.job_hash
WHERE j.is_active = TRUE 
AND j.posted_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY j.posted_at DESC, m.match_score DESC
LIMIT 100;

-- Test user query performance
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT u.*, COUNT(m.id) as match_count
FROM users u
LEFT JOIN matches m ON u.email = m.user_email
WHERE u.active = TRUE
AND u.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id
ORDER BY match_count DESC
LIMIT 50;

-- ============================================================================
-- 11. VERIFICATION QUERIES
-- ============================================================================

-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_tup_read,
    idx_tup_fetch,
    idx_scan
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Check table statistics
SELECT * FROM get_performance_stats();

-- Check materialized views
SELECT 
    schemaname,
    matviewname,
    definition
FROM pg_matviews 
WHERE schemaname = 'public';

-- ============================================================================
-- 12. CLEANUP AND MAINTENANCE
-- ============================================================================

-- Update table statistics
ANALYZE;

-- Vacuum tables to reclaim space
VACUUM ANALYZE users;
VACUUM ANALYZE jobs;
VACUUM ANALYZE matches;
VACUUM ANALYZE user_feedback;
VACUUM ANALYZE email_send_ledger;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '🎉 Performance optimization completed successfully!' as status,
       'Database is now optimized for production scale' as message,
       NOW() as completed_at;
