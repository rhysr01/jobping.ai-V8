-- Migration: Add database indexes for IngestJob performance optimization
-- This migration adds indexes to improve query performance for the simplified job processing approach

-- 1. Composite index for main job fetching query (match-users route)
-- This covers the most common query pattern: active, unsent jobs from recent dates
CREATE INDEX IF NOT EXISTS idx_jobs_active_unsent_recent 
ON public.jobs (is_sent, status, created_at DESC) 
WHERE is_sent = FALSE AND status = 'active';

-- 2. Index for job deduplication and hash lookups
-- Improves performance for job_hash uniqueness checks during upserts
CREATE INDEX IF NOT EXISTS idx_jobs_hash_lookup 
ON public.jobs (job_hash) 
WHERE job_hash IS NOT NULL;

-- 3. Composite index for freshness-based job distribution
-- Optimizes queries that filter by freshness tier and posted date
CREATE INDEX IF NOT EXISTS idx_jobs_freshness_posted 
ON public.jobs (freshness_tier, original_posted_date DESC) 
WHERE status = 'active' AND is_sent = FALSE;

-- 4. Index for location-based filtering
-- Improves performance for location-based job matching
CREATE INDEX IF NOT EXISTS idx_jobs_location 
ON public.jobs USING gin (location gin_trgm_ops) 
WHERE status = 'active';

-- 5. Index for company-based filtering
-- Improves performance for company-based job matching
CREATE INDEX IF NOT EXISTS idx_jobs_company 
ON public.jobs USING gin (company gin_trgm_ops) 
WHERE status = 'active';

-- 6. Index for experience level filtering
-- Optimizes queries that filter by experience_required
CREATE INDEX IF NOT EXISTS idx_jobs_experience 
ON public.jobs (experience_required) 
WHERE status = 'active' AND is_sent = FALSE;

-- 7. Index for work environment filtering
-- Optimizes queries that filter by work_environment
CREATE INDEX IF NOT EXISTS idx_jobs_work_env 
ON public.jobs (work_environment) 
WHERE status = 'active' AND is_sent = FALSE;

-- 8. Index for source-based filtering
-- Improves performance for source-specific queries
CREATE INDEX IF NOT EXISTS idx_jobs_source 
ON public.jobs (source, created_at DESC) 
WHERE status = 'active';

-- 9. Index for categories array searching
-- Optimizes queries that search within job categories
CREATE INDEX IF NOT EXISTS idx_jobs_categories 
ON public.jobs USING gin (categories) 
WHERE status = 'active';

-- 10. Index for language requirements array searching
-- Optimizes queries that filter by language requirements
CREATE INDEX IF NOT EXISTS idx_jobs_languages 
ON public.jobs USING gin (language_requirements) 
WHERE status = 'active';

-- 11. Composite index for user matching queries
-- Optimizes the main matching query with multiple filters
CREATE INDEX IF NOT EXISTS idx_jobs_matching_composite 
ON public.jobs (status, is_sent, experience_required, work_environment, created_at DESC) 
WHERE status = 'active' AND is_sent = FALSE;

-- 12. Index for job cleanup and maintenance queries
-- Optimizes queries for job lifecycle management
CREATE INDEX IF NOT EXISTS idx_jobs_lifecycle 
ON public.jobs (last_seen_at, status, is_active) 
WHERE is_active = TRUE;

-- 13. Index for analytics and reporting queries
-- Optimizes queries for job statistics and analytics
CREATE INDEX IF NOT EXISTS idx_jobs_analytics 
ON public.jobs (source, created_at, status) 
WHERE status = 'active';

-- 14. Index for title-based searching (if needed for future features)
-- Optimizes text search on job titles
CREATE INDEX IF NOT EXISTS idx_jobs_title_search 
ON public.jobs USING gin (title gin_trgm_ops) 
WHERE status = 'active';

-- 15. Index for description-based searching (if needed for future features)
-- Optimizes text search on job descriptions
CREATE INDEX IF NOT EXISTS idx_jobs_description_search 
ON public.jobs USING gin (description gin_trgm_ops) 
WHERE status = 'active';

-- Add comments to document the indexes
COMMENT ON INDEX idx_jobs_active_unsent_recent IS 'Optimizes main job fetching query for match-users route';
COMMENT ON INDEX idx_jobs_hash_lookup IS 'Optimizes job deduplication and hash-based lookups';
COMMENT ON INDEX idx_jobs_freshness_posted IS 'Optimizes freshness-based job distribution';
COMMENT ON INDEX idx_jobs_location IS 'Optimizes location-based job filtering';
COMMENT ON INDEX idx_jobs_company IS 'Optimizes company-based job filtering';
COMMENT ON INDEX idx_jobs_experience IS 'Optimizes experience level filtering';
COMMENT ON INDEX idx_jobs_work_env IS 'Optimizes work environment filtering';
COMMENT ON INDEX idx_jobs_source IS 'Optimizes source-based queries';
COMMENT ON INDEX idx_jobs_categories IS 'Optimizes category array searching';
COMMENT ON INDEX idx_jobs_languages IS 'Optimizes language requirements filtering';
COMMENT ON INDEX idx_jobs_matching_composite IS 'Optimizes main matching query with multiple filters';
COMMENT ON INDEX idx_jobs_lifecycle IS 'Optimizes job lifecycle management queries';
COMMENT ON INDEX idx_jobs_analytics IS 'Optimizes analytics and reporting queries';
COMMENT ON INDEX idx_jobs_title_search IS 'Optimizes title-based text search';
COMMENT ON INDEX idx_jobs_description_search IS 'Optimizes description-based text search';

-- Verify indexes were created successfully
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE indexname LIKE 'idx_jobs_%' 
    AND schemaname = 'public';
    
    RAISE NOTICE 'Created % job-related indexes successfully', index_count;
END $$;

-- Performance monitoring query to verify index usage
-- Run this after the migration to check if indexes are being used:
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE indexname LIKE 'idx_jobs_%'
ORDER BY idx_scan DESC;
*/
