-- Migration: Add email verification fields and missing columns to users table
-- Run this migration to add email verification support and fix missing columns

-- Add email verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- Create index for verification token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token) WHERE verification_token IS NOT NULL;

-- Create index for email verification status
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified) WHERE email_verified = FALSE;

-- Create index for active users
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active) WHERE active = TRUE;

-- Add comment to document the new fields
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.verification_token IS 'Temporary token for email verification (24-hour expiry)';
COMMENT ON COLUMN users.active IS 'Whether the user account is active';

-- Ensure jobs table has required columns
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS freshness_tier TEXT,
ADD COLUMN IF NOT EXISTS original_posted_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP;

-- Create indexes for jobs table
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_freshness_tier ON jobs(freshness_tier);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_is_sent ON jobs(is_sent) WHERE is_sent = FALSE;
