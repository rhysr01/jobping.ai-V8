-- Migration: Add unique constraint on job_hash for atomic upserts
-- This enables atomic upsert operations using Supabase's onConflict feature

-- Add unique constraint on job_hash column
ALTER TABLE jobs 
ADD CONSTRAINT jobs_job_hash_unique UNIQUE (job_hash);

-- Add index for better performance on job_hash lookups
CREATE INDEX IF NOT EXISTS idx_jobs_job_hash ON jobs (job_hash);

-- Add index for freshness tier queries
CREATE INDEX IF NOT EXISTS idx_jobs_freshness_tier ON jobs (freshness_tier);

-- Add index for posted_at queries (for freshness calculations)
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs (posted_at);

-- Add index for source queries
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs (source);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_jobs_source_posted_at ON jobs (source, posted_at);

-- Add index for scraper run tracking
CREATE INDEX IF NOT EXISTS idx_jobs_scraper_run_id ON jobs (scraper_run_id);

-- Add index for extracted posting date
CREATE INDEX IF NOT EXISTS idx_jobs_extracted_posted_date ON jobs (extracted_posted_date);

-- Add index for scrape timestamp
CREATE INDEX IF NOT EXISTS idx_jobs_scrape_timestamp ON jobs (scrape_timestamp);

-- Comment explaining the constraint
COMMENT ON CONSTRAINT jobs_job_hash_unique ON jobs IS 'Ensures job_hash uniqueness for atomic upsert operations';
