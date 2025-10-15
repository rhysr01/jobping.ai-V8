-- ============================================================================
-- CREATE INDEXES FOR FASTER MATCHING
-- ============================================================================
-- Creates indexes on frequently queried columns to speed up job matching
-- Run AFTER improve-matching-data-quality.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: LOCATION INDEXES
-- ============================================================================

-- City index (partial - only active jobs)
CREATE INDEX IF NOT EXISTS idx_jobs_city 
ON jobs(city) 
WHERE is_active = true;

-- Country index (partial - only active jobs)
CREATE INDEX IF NOT EXISTS idx_jobs_country 
ON jobs(country) 
WHERE is_active = true;

-- Combined city + country index for location-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_city_country 
ON jobs(city, country) 
WHERE is_active = true;

-- Location text search index
CREATE INDEX IF NOT EXISTS idx_jobs_location_text 
ON jobs USING gin(to_tsvector('english', COALESCE(location, ''))) 
WHERE is_active = true;

-- ============================================================================
-- PART 2: EARLY CAREER CLASSIFICATION INDEXES
-- ============================================================================

-- Graduate flag index
CREATE INDEX IF NOT EXISTS idx_jobs_is_graduate 
ON jobs(is_graduate) 
WHERE is_active = true AND is_graduate = true;

-- Internship flag index
CREATE INDEX IF NOT EXISTS idx_jobs_is_internship 
ON jobs(is_internship) 
WHERE is_active = true AND is_internship = true;

-- Combined early career index
CREATE INDEX IF NOT EXISTS idx_jobs_early_career 
ON jobs(is_graduate, is_internship) 
WHERE is_active = true;

-- ============================================================================
-- PART 3: WORK ENVIRONMENT INDEXES
-- ============================================================================

-- Work environment index (remote/hybrid/on-site)
CREATE INDEX IF NOT EXISTS idx_jobs_work_environment 
ON jobs(work_environment) 
WHERE is_active = true;

-- ============================================================================
-- PART 4: COMPANY INDEXES
-- ============================================================================

-- Normalized company name index
CREATE INDEX IF NOT EXISTS idx_jobs_company_name 
ON jobs(company_name) 
WHERE is_active = true;

-- Original company index
CREATE INDEX IF NOT EXISTS idx_jobs_company 
ON jobs(company) 
WHERE is_active = true;

-- ============================================================================
-- PART 5: FRESHNESS & AGE INDEXES
-- ============================================================================

-- Job age index for freshness queries
CREATE INDEX IF NOT EXISTS idx_jobs_job_age 
ON jobs(job_age_days) 
WHERE is_active = true;

-- Posted date index
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at 
ON jobs(posted_at DESC) 
WHERE is_active = true;

-- Created date index
CREATE INDEX IF NOT EXISTS idx_jobs_created_at 
ON jobs(created_at DESC) 
WHERE is_active = true;

-- ============================================================================
-- PART 6: FULL-TEXT SEARCH INDEXES
-- ============================================================================

-- Title full-text search
CREATE INDEX IF NOT EXISTS idx_jobs_title_search 
ON jobs USING gin(to_tsvector('english', title)) 
WHERE is_active = true;

-- Description full-text search
CREATE INDEX IF NOT EXISTS idx_jobs_description_search 
ON jobs USING gin(to_tsvector('english', COALESCE(description, ''))) 
WHERE is_active = true;

-- Combined title + description search
CREATE INDEX IF NOT EXISTS idx_jobs_combined_search 
ON jobs USING gin(to_tsvector('english', title || ' ' || COALESCE(description, ''))) 
WHERE is_active = true;

-- ============================================================================
-- PART 7: CATEGORIES & LANGUAGE INDEXES
-- ============================================================================

-- Categories array index
CREATE INDEX IF NOT EXISTS idx_jobs_categories 
ON jobs USING gin(categories) 
WHERE is_active = true;

-- Language requirements array index
CREATE INDEX IF NOT EXISTS idx_jobs_language_requirements 
ON jobs USING gin(language_requirements) 
WHERE is_active = true;

-- ============================================================================
-- PART 8: DEDUPLICATION INDEXES
-- ============================================================================

-- Job hash index (for deduplication)
CREATE INDEX IF NOT EXISTS idx_jobs_job_hash 
ON jobs(job_hash) 
WHERE is_active = true;

-- Fingerprint index
CREATE INDEX IF NOT EXISTS idx_jobs_fingerprint 
ON jobs(fingerprint) 
WHERE is_active = true;

-- ============================================================================
-- PART 9: COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================================================

-- City + early career + freshness
CREATE INDEX IF NOT EXISTS idx_jobs_city_early_career_fresh 
ON jobs(city, is_graduate, is_internship, job_age_days) 
WHERE is_active = true;

-- Country + work environment + early career
CREATE INDEX IF NOT EXISTS idx_jobs_country_work_early 
ON jobs(country, work_environment, is_graduate, is_internship) 
WHERE is_active = true;

-- ============================================================================
-- PART 10: MATCH TABLE INDEXES
-- ============================================================================

-- User email index for retrieving user matches
CREATE INDEX IF NOT EXISTS idx_matches_user_email 
ON matches(user_email);

-- Job hash index for retrieving job matches
CREATE INDEX IF NOT EXISTS idx_matches_job_hash 
ON matches(job_hash);

-- Match score index for sorting
CREATE INDEX IF NOT EXISTS idx_matches_score 
ON matches(match_score DESC);

-- Combined user + score for ranking
CREATE INDEX IF NOT EXISTS idx_matches_user_score 
ON matches(user_email, match_score DESC);

-- Matched date index for recency
CREATE INDEX IF NOT EXISTS idx_matches_matched_at 
ON matches(matched_at DESC);

-- ============================================================================
-- STATISTICS
-- ============================================================================

SELECT 
  '========================================' as divider;

SELECT 
  'INDEXES CREATED SUCCESSFULLY' as status;

-- Show all indexes on jobs table
SELECT 
  'JOBS TABLE INDEXES' as info;

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'jobs'
  AND schemaname = 'public'
ORDER BY indexname;

-- Show all indexes on matches table
SELECT 
  'MATCHES TABLE INDEXES' as info;

SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'matches'
  AND schemaname = 'public'
ORDER BY indexname;

-- Show table sizes
SELECT 
  'TABLE SIZES' as info;

SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as indexes_size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('jobs', 'matches', 'users')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

COMMIT;

-- ============================================================================
-- VACUUM & ANALYZE
-- ============================================================================
-- Run these after index creation to update statistics:
-- VACUUM ANALYZE jobs;
-- VACUUM ANALYZE matches;
-- VACUUM ANALYZE users;
-- ============================================================================

