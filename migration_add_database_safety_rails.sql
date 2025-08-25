-- Migration: Add database safety rails and performance indexes
-- This adds missing constraints and indexes for production stability

-- Add UNIQUE constraint for matches table (user_id, job_hash, sent_at::date)
-- This prevents duplicate job matches for the same user on the same day
ALTER TABLE matches 
ADD CONSTRAINT IF NOT EXISTS matches_user_job_date_unique 
UNIQUE (user_email, job_hash, DATE(sent_at));

-- Add indexes for heavy queries
CREATE INDEX IF NOT EXISTS idx_jobs_created_at_desc ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_location_created ON jobs(location, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_career_path_created ON jobs(career_path, created_at DESC) WHERE career_path IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_email_verified_last_sent ON users(email_verified, last_email_sent) WHERE email_verified = TRUE;

-- Add index for freshness tier queries
CREATE INDEX IF NOT EXISTS idx_jobs_freshness_tier ON jobs(freshness_tier, created_at DESC) WHERE freshness_tier IS NOT NULL;

-- Add index for job matching queries
CREATE INDEX IF NOT EXISTS idx_jobs_active_freshness ON jobs(is_active, freshness_tier, created_at DESC) WHERE is_active = TRUE;

-- Add index for user matching queries
CREATE INDEX IF NOT EXISTS idx_users_active_verified ON users(active, email_verified, created_at DESC) WHERE active = TRUE AND email_verified = TRUE;

-- Add index for subscription tier queries
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier, email_verified, last_email_sent) WHERE email_verified = TRUE;

-- Add index for job hash lookups (already has unique constraint, but index helps performance)
CREATE INDEX IF NOT EXISTS idx_jobs_job_hash ON jobs(job_hash);

-- Add index for company queries
CREATE INDEX IF NOT EXISTS idx_jobs_company_created ON jobs(company, created_at DESC);

-- Add index for work environment queries
CREATE INDEX IF NOT EXISTS idx_jobs_work_env_created ON jobs(work_environment, created_at DESC) WHERE work_environment IS NOT NULL;

-- Add index for experience level queries
CREATE INDEX IF NOT EXISTS idx_jobs_experience_created ON jobs(experience_required, created_at DESC) WHERE experience_required IS NOT NULL;

-- Add composite index for job matching efficiency
CREATE INDEX IF NOT EXISTS idx_jobs_matching_efficiency ON jobs(
  is_active, 
  freshness_tier, 
  location, 
  career_path, 
  created_at DESC
) WHERE is_active = TRUE;

-- Add index for user preference queries
CREATE INDEX IF NOT EXISTS idx_users_preferences ON users(
  target_cities, 
  professional_expertise, 
  entry_level_preference, 
  work_environment
) USING GIN;

-- Verify the indexes were created
SELECT 
  indexname, 
  tablename, 
  indexdef
FROM pg_indexes 
WHERE tablename IN ('jobs', 'users', 'matches', 'email_sends')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
