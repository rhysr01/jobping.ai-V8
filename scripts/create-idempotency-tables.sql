-- ============================================================================
-- IDEMPOTENCY + DELIVERABILITY SAFETY
-- No double emails; no mailing bad addresses
-- ============================================================================

-- ============================================================================
-- MATCH BATCH TABLE (Prevent Double Emails)
-- ============================================================================

CREATE TABLE IF NOT EXISTS match_batch (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    match_date DATE NOT NULL,
    batch_status VARCHAR(20) DEFAULT 'pending' CHECK (batch_status IN ('pending', 'processing', 'sent', 'failed')),
    matches_count INTEGER DEFAULT 0,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one batch per user per day
    CONSTRAINT unique_user_daily_batch UNIQUE (user_id, match_date)
);

-- Indexes for match batch
CREATE INDEX IF NOT EXISTS idx_match_batch_user_email ON match_batch(user_email);
CREATE INDEX IF NOT EXISTS idx_match_batch_date ON match_batch(match_date);
CREATE INDEX IF NOT EXISTS idx_match_batch_status ON match_batch(batch_status);
CREATE INDEX IF NOT EXISTS idx_match_batch_created_at ON match_batch(created_at);

-- ============================================================================
-- EMAIL SUPPRESSION TABLE (Domain Reputation Protection)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_suppression_enhanced (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL UNIQUE,
    suppression_type VARCHAR(50) NOT NULL CHECK (suppression_type IN ('bounce', 'complaint', 'unsubscribe', 'manual')),
    suppression_reason TEXT,
    event_data JSONB,
    suppressed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL = permanent
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for email suppression
CREATE INDEX IF NOT EXISTS idx_email_suppression_email ON email_suppression_enhanced(user_email);
CREATE INDEX IF NOT EXISTS idx_email_suppression_type ON email_suppression_enhanced(suppression_type);
CREATE INDEX IF NOT EXISTS idx_email_suppression_active ON email_suppression_enhanced(is_active);
CREATE INDEX IF NOT EXISTS idx_email_suppression_expires ON email_suppression_enhanced(expires_at);

-- ============================================================================
-- JOB QUEUE DEAD LETTER TABLE (Failed Job Recovery)
-- ============================================================================

CREATE TABLE IF NOT EXISTS job_queue_dead_letter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_job_id UUID,
    job_type VARCHAR(100) NOT NULL, -- 'match_generation', 'email_send', 'data_processing', etc.
    payload JSONB NOT NULL,
    failure_reason TEXT NOT NULL,
    error_details JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'failed' CHECK (status IN ('failed', 'retrying', 'abandoned', 'recovered')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for dead letter queue
CREATE INDEX IF NOT EXISTS idx_dead_letter_type ON job_queue_dead_letter(job_type);
CREATE INDEX IF NOT EXISTS idx_dead_letter_status ON job_queue_dead_letter(status);
CREATE INDEX IF NOT EXISTS idx_dead_letter_next_retry ON job_queue_dead_letter(next_retry_at);
CREATE INDEX IF NOT EXISTS idx_dead_letter_created_at ON job_queue_dead_letter(created_at);

-- ============================================================================
-- EMAIL SEND LEDGER (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_send_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL, -- 'daily_matches', 'welcome', 'verification', etc.
    batch_id UUID REFERENCES match_batch(id),
    template_version VARCHAR(20),
    subject_line TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivery_status VARCHAR(20) DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'bounced', 'complained', 'failed')),
    external_message_id VARCHAR(255), -- From email service provider
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for email send ledger
CREATE INDEX IF NOT EXISTS idx_email_ledger_user ON email_send_ledger(user_email);
CREATE INDEX IF NOT EXISTS idx_email_ledger_type ON email_send_ledger(email_type);
CREATE INDEX IF NOT EXISTS idx_email_ledger_sent_at ON email_send_ledger(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_ledger_status ON email_send_ledger(delivery_status);
CREATE INDEX IF NOT EXISTS idx_email_ledger_batch ON email_send_ledger(batch_id);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to check if email is suppressed
CREATE OR REPLACE FUNCTION is_email_suppressed(check_email VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
    suppression_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO suppression_count
    FROM email_suppression_enhanced
    WHERE user_email = check_email
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN suppression_count > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get next retry time with exponential backoff
CREATE OR REPLACE FUNCTION calculate_next_retry(retry_count INTEGER, base_delay_minutes INTEGER DEFAULT 5)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    -- Exponential backoff: 5min, 25min, 125min, then abandon
    RETURN NOW() + (base_delay_minutes * POWER(5, retry_count)) * INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Apply updated_at trigger to new tables
CREATE TRIGGER update_match_batch_updated_at
    BEFORE UPDATE ON match_batch
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_suppression_updated_at
    BEFORE UPDATE ON email_suppression_enhanced
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dead_letter_updated_at
    BEFORE UPDATE ON job_queue_dead_letter
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all tables exist and have expected structure
SELECT 
    'match_batch' as table_name,
    count(*) as row_count,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'match_batch') as column_count
FROM match_batch
UNION ALL
SELECT 
    'email_suppression_enhanced' as table_name,
    count(*) as row_count,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'email_suppression_enhanced') as column_count
FROM email_suppression_enhanced
UNION ALL
SELECT 
    'job_queue_dead_letter' as table_name,
    count(*) as row_count,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'job_queue_dead_letter') as column_count
FROM job_queue_dead_letter
UNION ALL
SELECT 
    'email_send_ledger' as table_name,
    count(*) as row_count,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'email_send_ledger') as column_count
FROM email_send_ledger;

-- Verify constraints exist
SELECT conname, contype, confrelid::regclass as table_name
FROM pg_constraint 
WHERE conname IN ('unique_user_daily_batch', 'email_suppression_enhanced_user_email_key');
