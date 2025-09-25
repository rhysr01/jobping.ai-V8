-- ============================================================================
-- PHASE 1: DATABASE TRUTH (MIGRATIONS, NOT VIBES)
-- Goal: deterministic data + email idempotency + deliverability safety
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Raw jobs staging table (anything goes)
CREATE TABLE IF NOT EXISTS raw_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_data JSONB NOT NULL,
    source_platform TEXT NOT NULL,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processing_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clean jobs table (strict schema)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    canonical_url TEXT NOT NULL,
    source_platform TEXT NOT NULL,
    location_text TEXT,
    loc_city TEXT,
    loc_country_code TEXT,
    remote_type TEXT CHECK (remote_type IN ('remote', 'hybrid', 'onsite')),
    employment_type TEXT CHECK (employment_type IN ('internship', 'graduate', 'full-time', 'contract')),
    posted_at DATE,
    description_snippet TEXT,
    tags TEXT[],
    seniority TEXT CHECK (seniority IN ('intern', 'junior', 'mid', 'senior')),
    languages TEXT[],
    salary_min NUMERIC,
    salary_max NUMERIC,
    salary_currency TEXT,
    salary_period TEXT,
    fingerprint TEXT UNIQUE,
    completeness_score NUMERIC,
    provenance JSONB,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs that failed normalization
CREATE TABLE IF NOT EXISTS jobs_rejects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_id UUID REFERENCES raw_jobs(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    decided_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EMAIL IDEMPOTENCY + SUPPRESSION
-- ============================================================================

-- Email suppression list
CREATE TABLE IF NOT EXISTS email_suppression (
    user_email TEXT PRIMARY KEY,
    reason TEXT NOT NULL CHECK (reason IN ('bounce', 'complaint', 'manual', 'unsub')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for case-insensitive email lookups
CREATE INDEX IF NOT EXISTS email_suppression_email_lower_idx 
ON email_suppression (lower(user_email));

-- Email sends tracking (idempotency)
CREATE TABLE IF NOT EXISTS email_sends (
    send_token TEXT PRIMARY KEY,     -- unique per user+date+category
    user_id UUID NOT NULL,
    user_email TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('daily_matches', 'welcome', 'feedback')),
    status TEXT NOT NULL CHECK (status IN ('queued', 'sent', 'bounced', 'complained', 'failed')),
    meta JSONB,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MATCH DETERMINISM + RECOVERY
-- ============================================================================

-- Match batches for deterministic processing
CREATE TABLE IF NOT EXISTS match_batch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    match_date DATE NOT NULL,
    matches JSONB NOT NULL,
    batch_status TEXT DEFAULT 'pending' CHECK (batch_status IN ('pending', 'processing', 'sent', 'failed')),
    email_sent_at TIMESTAMPTZ,
    matches_count INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, match_date)
);

-- Dead letter queue for failed jobs
CREATE TABLE IF NOT EXISTS job_queue_dead_letter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'retrying', 'failed', 'resolved')),
    failed_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES THAT ACTUALLY MATTER
-- ============================================================================

-- Matches table indexes
CREATE INDEX IF NOT EXISTS matches_user_date_idx 
ON matches(user_id, match_date);

CREATE INDEX IF NOT EXISTS matches_user_email_idx 
ON matches(user_email);

CREATE INDEX IF NOT EXISTS matches_matched_at_idx 
ON matches(matched_at);

-- Email sends indexes
CREATE INDEX IF NOT EXISTS email_sends_user_date_idx 
ON email_sends(user_id, sent_at);

CREATE INDEX IF NOT EXISTS email_sends_user_email_idx 
ON email_sends(user_email);

CREATE INDEX IF NOT EXISTS email_sends_category_idx 
ON email_sends(category);

-- Jobs indexes
CREATE INDEX IF NOT EXISTS jobs_fingerprint_idx 
ON jobs(fingerprint);

CREATE INDEX IF NOT EXISTS jobs_posted_recent_idx 
ON jobs(posted_at DESC) WHERE posted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS jobs_source_platform_idx 
ON jobs(source_platform);

CREATE INDEX IF NOT EXISTS jobs_remote_type_idx 
ON jobs(remote_type);

CREATE INDEX IF NOT EXISTS jobs_employment_type_idx 
ON jobs(employment_type);

-- Raw jobs indexes
CREATE INDEX IF NOT EXISTS raw_jobs_source_platform_idx 
ON raw_jobs(source_platform);

CREATE INDEX IF NOT EXISTS raw_jobs_processed_at_idx 
ON raw_jobs(processed_at);

CREATE INDEX IF NOT EXISTS raw_jobs_scraped_at_idx 
ON raw_jobs(scraped_at);

-- Match batch indexes
CREATE INDEX IF NOT EXISTS match_batch_user_date_idx 
ON match_batch(user_id, match_date);

CREATE INDEX IF NOT EXISTS match_batch_status_idx 
ON match_batch(batch_status);

-- Dead letter queue indexes
CREATE INDEX IF NOT EXISTS dead_letter_status_idx 
ON job_queue_dead_letter(status);

CREATE INDEX IF NOT EXISTS dead_letter_next_retry_idx 
ON job_queue_dead_letter(next_retry_at) WHERE status = 'pending';

-- ============================================================================
-- MINIMAL RLS
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_batch ENABLE ROW LEVEL SECURITY;

-- User sees their own data
CREATE POLICY IF NOT EXISTS matches_select_own 
ON matches FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS email_sends_select_own 
ON email_sends FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS match_batch_select_own 
ON match_batch FOR SELECT 
USING (user_id = auth.uid());

-- Service role has full access
CREATE POLICY IF NOT EXISTS service_all_matches 
ON matches FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS service_all_email_sends 
ON email_sends FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS service_all_match_batch 
ON match_batch FOR ALL 
USING (true) WITH CHECK (true);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to generate email send tokens
CREATE OR REPLACE FUNCTION generate_send_token(
    user_email TEXT,
    category TEXT,
    send_date DATE DEFAULT CURRENT_DATE
) RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT encode(digest(user_email || '|' || category || '|' || send_date::text, 'sha256'), 'hex');
$$;

-- Function to check if email is suppressed
CREATE OR REPLACE FUNCTION is_email_suppressed(email_address TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS(
        SELECT 1 FROM email_suppression 
        WHERE lower(user_email) = lower(email_address)
    );
$$;

-- Function to calculate next retry time
CREATE OR REPLACE FUNCTION calculate_next_retry(retry_count INTEGER)
RETURNS TIMESTAMPTZ
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT NOW() + (INTERVAL '5 minutes' * POWER(2, retry_count));
$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that all tables were created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'raw_jobs', 'jobs', 'jobs_rejects', 
    'email_suppression', 'email_sends',
    'match_batch', 'job_queue_dead_letter'
)
ORDER BY tablename;

-- Check that indexes were created
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%_idx'
ORDER BY tablename, indexname;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'matches', 'email_sends', 'match_batch')
ORDER BY tablename;

SELECT '🎉 Phase 1 database truth migration completed successfully!' as status;
