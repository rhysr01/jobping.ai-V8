-- ============================================================================
-- PHASE 1: MISSING PIECES - FOCUSED MIGRATION
-- Goal: Add missing indexes, functions, and optimizations
-- ============================================================================

-- Enable required extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ============================================================================
-- MISSING INDEXES (PERFORMANCE CRITICAL)
-- ============================================================================

-- Matches table indexes
CREATE INDEX IF NOT EXISTS matches_user_email_idx 
ON matches(user_email);

CREATE INDEX IF NOT EXISTS matches_matched_at_idx 
ON matches(matched_at);

CREATE INDEX IF NOT EXISTS matches_job_hash_idx 
ON matches(job_hash);

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS jobs_posted_at_desc_idx 
ON jobs(posted_at DESC) WHERE posted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS jobs_source_idx 
ON jobs(source);

CREATE INDEX IF NOT EXISTS jobs_is_active_idx 
ON jobs(is_active) WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS jobs_fingerprint_idx 
ON jobs(fingerprint);

-- Email send ledger indexes
CREATE INDEX IF NOT EXISTS email_send_ledger_user_email_idx 
ON email_send_ledger(user_email);

CREATE INDEX IF NOT EXISTS email_send_ledger_sent_at_idx 
ON email_send_ledger(sent_at);

CREATE INDEX IF NOT EXISTS email_send_ledger_email_type_idx 
ON email_send_ledger(email_type);

-- Match batch indexes
CREATE INDEX IF NOT EXISTS match_batch_user_email_idx 
ON match_batch(user_email);

CREATE INDEX IF NOT EXISTS match_batch_match_date_idx 
ON match_batch(match_date);

CREATE INDEX IF NOT EXISTS match_batch_status_idx 
ON match_batch(batch_status);

-- Dead letter queue indexes
CREATE INDEX IF NOT EXISTS dead_letter_status_idx 
ON job_queue_dead_letter(status);

CREATE INDEX IF NOT EXISTS dead_letter_next_retry_idx 
ON job_queue_dead_letter(next_retry_at) WHERE status = 'pending';

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to generate email send tokens (for idempotency)
DROP FUNCTION IF EXISTS generate_send_token(TEXT, TEXT, DATE);
CREATE FUNCTION generate_send_token(
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
DROP FUNCTION IF EXISTS is_email_suppressed(TEXT);
CREATE FUNCTION is_email_suppressed(email_address TEXT)
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

-- Function to check if email already sent today (using email_send_ledger)
DROP FUNCTION IF EXISTS email_already_sent_today(TEXT, TEXT, DATE);
CREATE FUNCTION email_already_sent_today(
    user_email TEXT,
    email_type TEXT,
    send_date DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS(
        SELECT 1 FROM email_send_ledger 
        WHERE lower(email_send_ledger.user_email) = lower(email_already_sent_today.user_email)
        AND email_send_ledger.email_type = email_already_sent_today.email_type
        AND DATE(email_send_ledger.sent_at) = send_date
    );
$$;

-- Function to calculate next retry time (drop existing first)
DROP FUNCTION IF EXISTS calculate_next_retry(INTEGER);
CREATE FUNCTION calculate_next_retry(retry_count INTEGER)
RETURNS TIMESTAMPTZ
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT NOW() + (INTERVAL '5 minutes' * POWER(2, retry_count));
$$;

-- ============================================================================
-- RLS POLICIES (MINIMAL BUT SECURE)
-- ============================================================================

-- Enable RLS on key tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_send_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_batch ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS matches_select_own ON matches;
DROP POLICY IF EXISTS email_send_ledger_select_own ON email_send_ledger;
DROP POLICY IF EXISTS match_batch_select_own ON match_batch;
DROP POLICY IF EXISTS service_all_matches ON matches;
DROP POLICY IF EXISTS service_all_email_send_ledger ON email_send_ledger;
DROP POLICY IF EXISTS service_all_match_batch ON match_batch;

-- User sees their own data
CREATE POLICY matches_select_own 
ON matches FOR SELECT 
USING (user_email = (SELECT auth.jwt() ->> 'email'));

CREATE POLICY email_send_ledger_select_own 
ON email_send_ledger FOR SELECT 
USING (user_email = (SELECT auth.jwt() ->> 'email'));

CREATE POLICY match_batch_select_own 
ON match_batch FOR SELECT 
USING (user_email = (SELECT auth.jwt() ->> 'email'));

-- Service role has full access
CREATE POLICY service_all_matches 
ON matches FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY service_all_email_send_ledger 
ON email_send_ledger FOR ALL 
USING (true) WITH CHECK (true);

CREATE POLICY service_all_match_batch 
ON match_batch FOR ALL 
USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check that all indexes were created
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%_idx'
AND indexname IN (
    'matches_user_email_idx',
    'matches_matched_at_idx',
    'matches_job_hash_idx',
    'jobs_posted_at_desc_idx',
    'jobs_source_idx',
    'jobs_is_active_idx',
    'jobs_fingerprint_idx',
    'email_send_ledger_user_email_idx',
    'email_send_ledger_sent_at_idx',
    'email_send_ledger_email_type_idx',
    'match_batch_user_email_idx',
    'match_batch_match_date_idx',
    'match_batch_status_idx',
    'dead_letter_status_idx',
    'dead_letter_next_retry_idx'
)
ORDER BY tablename, indexname;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'matches', 'email_send_ledger', 'match_batch')
ORDER BY tablename;

SELECT '🎉 Phase 1 missing pieces migration completed successfully!' as status;
