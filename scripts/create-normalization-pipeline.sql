-- ============================================================================
-- NORMALIZATION PIPELINE: Raw Input → Clean Output
-- Creates the backbone for consistent, email-ready job data
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- RAW JOBS TABLE (Dirty Input)
-- ============================================================================

CREATE TABLE IF NOT EXISTS raw_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(100) NOT NULL,
    external_id VARCHAR(255),
    raw_data JSONB NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processing_status VARCHAR(20) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'processed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for raw jobs
CREATE INDEX IF NOT EXISTS idx_raw_jobs_source ON raw_jobs(source);
CREATE INDEX IF NOT EXISTS idx_raw_jobs_status ON raw_jobs(processing_status);
CREATE INDEX IF NOT EXISTS idx_raw_jobs_fetched_at ON raw_jobs(fetched_at);

-- ============================================================================
-- JOBS TABLE (Clean Output) - Enhanced version of existing
-- ============================================================================

-- Add unique fingerprint constraint to existing jobs table
DO $$ 
DECLARE
    duplicate_count INTEGER;
BEGIN
    -- Add fingerprint column if it doesn't exist (larger size to handle job IDs)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'fingerprint') THEN
        ALTER TABLE jobs ADD COLUMN fingerprint VARCHAR(100);
    ELSE
        -- If column exists but is too small, increase it
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'jobs' AND column_name = 'fingerprint' AND character_maximum_length < 100) THEN
            ALTER TABLE jobs ALTER COLUMN fingerprint TYPE VARCHAR(100);
        END IF;
    END IF;
    
    -- Create fingerprint from key fields (only for NULL fingerprints)
    UPDATE jobs SET fingerprint = encode(
        digest(
            COALESCE(company, '') || '|' || 
            COALESCE(title, '') || '|' || 
            COALESCE(location_name, '') || '|' || 
            COALESCE(posted_at::text, ''),
            'sha256'
        ), 'hex'
    ) WHERE fingerprint IS NULL;
    
    -- Check for duplicate fingerprints
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT fingerprint, COUNT(*) as cnt
        FROM jobs 
        WHERE fingerprint IS NOT NULL
        GROUP BY fingerprint
        HAVING COUNT(*) > 1
    ) duplicates;
    
    -- If duplicates exist, make them unique by appending job ID
    IF duplicate_count > 0 THEN
        UPDATE jobs 
        SET fingerprint = fingerprint || '_' || id::text
        WHERE fingerprint IN (
            SELECT fingerprint 
            FROM jobs 
            WHERE fingerprint IS NOT NULL
            GROUP BY fingerprint 
            HAVING COUNT(*) > 1
        );
        
        RAISE NOTICE 'Fixed % duplicate fingerprints by appending job IDs', duplicate_count;
    END IF;
    
    -- Add unique constraint on fingerprint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint 
                   WHERE conname = 'jobs_fingerprint_unique') THEN
        ALTER TABLE jobs ADD CONSTRAINT jobs_fingerprint_unique UNIQUE (fingerprint);
    END IF;
    
    -- Add index for fingerprint lookups
    IF NOT EXISTS (SELECT 1 FROM pg_indexes 
                   WHERE indexname = 'idx_jobs_fingerprint') THEN
        CREATE INDEX idx_jobs_fingerprint ON jobs(fingerprint);
    END IF;
END $$;

-- ============================================================================
-- JOBS REJECTS TABLE (Failed Normalization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS jobs_rejects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_job_id UUID REFERENCES raw_jobs(id) ON DELETE CASCADE,
    source VARCHAR(100) NOT NULL,
    external_id VARCHAR(255),
    rejection_reason VARCHAR(100) NOT NULL,
    raw_data JSONB NOT NULL,
    error_details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for rejected jobs
CREATE INDEX IF NOT EXISTS idx_jobs_rejects_source ON jobs_rejects(source);
CREATE INDEX IF NOT EXISTS idx_jobs_rejects_reason ON jobs_rejects(rejection_reason);
CREATE INDEX IF NOT EXISTS idx_jobs_rejects_created_at ON jobs_rejects(created_at);

-- ============================================================================
-- NORMALIZATION FUNCTIONS
-- ============================================================================

-- Function to generate job fingerprint
CREATE OR REPLACE FUNCTION generate_job_fingerprint(
    p_company TEXT,
    p_title TEXT,
    p_location TEXT,
    p_posted_at TIMESTAMP WITH TIME ZONE
) RETURNS VARCHAR(64) AS $$
BEGIN
    RETURN encode(
        digest(
            COALESCE(p_company, '') || '|' || 
            COALESCE(p_title, '') || '|' || 
            COALESCE(p_location, '') || '|' || 
            COALESCE(p_posted_at::text, ''),
            'sha256'
        ), 'hex'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to normalize company name
CREATE OR REPLACE FUNCTION normalize_company_name(company_name TEXT) 
RETURNS TEXT AS $$
BEGIN
    IF company_name IS NULL OR TRIM(company_name) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Remove common suffixes and normalize
    RETURN TRIM(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    unaccent(LOWER(company_name)),
                    '\s+(ltd|limited|inc|incorporated|corp|corporation|llc|gmbh|ag|sa|bv|ab|as)$',
                    '',
                    'gi'
                ),
                '\s+',
                ' ',
                'g'
            ),
            '[^\w\s\-\.]',
            '',
            'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- PROCESSING TRIGGERS
-- ============================================================================

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to raw_jobs
DROP TRIGGER IF EXISTS update_raw_jobs_updated_at ON raw_jobs;
CREATE TRIGGER update_raw_jobs_updated_at
    BEFORE UPDATE ON raw_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist
SELECT 'raw_jobs' as table_name, count(*) as row_count FROM raw_jobs
UNION ALL
SELECT 'jobs_rejects' as table_name, count(*) as row_count FROM jobs_rejects;

-- Verify extensions are enabled
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pgcrypto', 'unaccent', 'pg_trgm');

-- Verify fingerprint constraint exists
SELECT conname, contype FROM pg_constraint WHERE conname = 'jobs_fingerprint_unique';
