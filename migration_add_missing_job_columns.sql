-- Migration: Add missing columns to jobs table for enhanced job matching
-- These columns are required by the match-users API for proper job freshness tiering and status tracking

-- Add status column to track job status (active, inactive, expired, etc.)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired', 'filled', 'draft'));

-- Add freshness_tier column to categorize jobs by recency
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS freshness_tier TEXT CHECK (freshness_tier IN ('ultra_fresh', 'fresh', 'comprehensive'));

-- Add original_posted_date to track when the job was originally posted
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS original_posted_date TIMESTAMP WITH TIME ZONE;

-- Add last_seen_at to track when the job was last confirmed active
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index on status for efficient filtering
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- Create index on freshness_tier for efficient tier-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_freshness_tier ON jobs(freshness_tier);

-- Create index on original_posted_date for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_jobs_original_posted_date ON jobs(original_posted_date);

-- Create index on last_seen_at for efficient recency queries
CREATE INDEX IF NOT EXISTS idx_jobs_last_seen_at ON jobs(last_seen_at);

-- Update existing records to have proper default values
UPDATE jobs 
SET 
  status = COALESCE(status, 'active'),
  original_posted_date = COALESCE(original_posted_date, created_at),
  last_seen_at = COALESCE(last_seen_at, created_at),
  freshness_tier = CASE 
    WHEN original_posted_date IS NOT NULL THEN
      CASE 
        WHEN original_posted_date > NOW() - INTERVAL '48 hours' THEN 'ultra_fresh'
        WHEN original_posted_date > NOW() - INTERVAL '7 days' THEN 'fresh'
        ELSE 'comprehensive'
      END
    ELSE 'comprehensive'
  END
WHERE status IS NULL OR original_posted_date IS NULL OR last_seen_at IS NULL OR freshness_tier IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN jobs.status IS 'Job status: active, inactive, expired, filled, or draft';
COMMENT ON COLUMN jobs.freshness_tier IS 'Job freshness category: ultra_fresh (48h), fresh (7d), or comprehensive (older)';
COMMENT ON COLUMN jobs.original_posted_date IS 'When the job was originally posted (may differ from created_at)';
COMMENT ON COLUMN jobs.last_seen_at IS 'When the job was last confirmed to be active';

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
  AND column_name IN ('status', 'freshness_tier', 'original_posted_date', 'last_seen_at')
ORDER BY column_name;
