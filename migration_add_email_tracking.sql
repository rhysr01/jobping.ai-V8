-- Migration: Add email tracking fields for tier-based matching system
-- This enables proper tracking of user email phases and counts

-- Add email count tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_count INTEGER DEFAULT 0;

-- Add onboarding completion tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Add email phase tracking (welcome, followup, regular)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_phase TEXT DEFAULT 'welcome' CHECK (email_phase IN ('welcome', 'followup', 'regular'));

-- Create indexes for email tracking queries
CREATE INDEX IF NOT EXISTS idx_users_email_count ON users(email_count);
CREATE INDEX IF NOT EXISTS idx_users_onboarding_complete ON users(onboarding_complete);
CREATE INDEX IF NOT EXISTS idx_users_email_phase ON users(email_phase);
CREATE INDEX IF NOT EXISTS idx_users_last_email_sent ON users(last_email_sent) WHERE last_email_sent IS NOT NULL;

-- Add composite index for efficient email eligibility queries
CREATE INDEX IF NOT EXISTS idx_users_email_eligibility ON users(email_verified, subscription_tier, last_email_sent, created_at) 
WHERE email_verified = TRUE;

-- Add comments for documentation
COMMENT ON COLUMN users.email_count IS 'Total number of job emails sent to this user';
COMMENT ON COLUMN users.onboarding_complete IS 'Whether user has completed the 2-email welcome sequence';
COMMENT ON COLUMN users.email_phase IS 'Current email phase: welcome (initial), followup (48h), regular (ongoing)';
COMMENT ON COLUMN users.last_email_sent IS 'Timestamp of the last job email sent to this user';

-- Update existing users to have proper default values
UPDATE users 
SET 
  email_count = CASE 
    WHEN last_email_sent IS NOT NULL THEN 1 
    ELSE 0 
  END,
  onboarding_complete = CASE 
    WHEN last_email_sent IS NOT NULL AND created_at < NOW() - INTERVAL '72 hours' THEN TRUE 
    ELSE FALSE 
  END,
  email_phase = CASE 
    WHEN last_email_sent IS NULL THEN 'welcome'
    WHEN created_at >= NOW() - INTERVAL '72 hours' THEN 'followup'
    ELSE 'regular'
  END
WHERE email_count IS NULL OR onboarding_complete IS NULL OR email_phase IS NULL;

-- Verify the migration
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('email_count', 'onboarding_complete', 'email_phase')
ORDER BY column_name;
