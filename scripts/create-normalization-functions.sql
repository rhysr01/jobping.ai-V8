-- ============================================================================
-- DETERMINISTIC NORMALIZATION FUNCTIONS
-- Same raw row → same normalized row every time
-- ============================================================================

-- ============================================================================
-- TITLE NORMALIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_title(raw_title TEXT)
RETURNS TEXT AS $$
BEGIN
    IF raw_title IS NULL OR TRIM(raw_title) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Remove extra whitespace, normalize case, remove special chars
    RETURN TRIM(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                INITCAP(TRIM(raw_title)),
                '\s+',
                ' ',
                'g'
            ),
            '[^\w\s\-\.\/]',
            '',
            'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- COMPANY NORMALIZATION  
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_company(raw_company TEXT)
RETURNS TEXT AS $$
BEGIN
    IF raw_company IS NULL OR TRIM(raw_company) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Remove common suffixes, normalize, clean up
    RETURN TRIM(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    unaccent(LOWER(TRIM(raw_company))),
                    '\s+(ltd|limited|inc|incorporated|corp|corporation|llc|gmbh|ag|sa|bv|ab|as|b\.v\.|n\.v\.)$',
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
-- URL CANONICALIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION canonicalize_url(raw_url TEXT)
RETURNS TEXT AS $$
BEGIN
    IF raw_url IS NULL OR TRIM(raw_url) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Basic URL cleaning - remove tracking params, normalize
    RETURN TRIM(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(
                        raw_url,
                        '[?&](utm_|fbclid|gclid|ref=|source=).*',
                        '',
                        'g'
                    ),
                    '/+$',
                    '',
                    'g'
                ),
                '^https?://',
                '',
                'g'
            ),
            '\s+',
            '',
            'g'
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- REMOTE TYPE INFERENCE
-- ============================================================================

CREATE OR REPLACE FUNCTION infer_remote_type(title TEXT, description TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    combined_text TEXT;
BEGIN
    combined_text := COALESCE(title, '') || ' ' || COALESCE(description, '');
    combined_text := LOWER(combined_text);
    
    -- Remote-first indicators
    IF combined_text ~ '\b(remote[- ]?first|distributed|work[ ]?from[ ]?home|wfh|fully[ ]?remote)\b' THEN
        RETURN 'remote';
    END IF;
    
    -- Hybrid indicators  
    IF combined_text ~ '\b(hybrid|flexible[ ]?working|2[ ]?days[ ]?office|3[ ]?days[ ]?office)\b' THEN
        RETURN 'hybrid';
    END IF;
    
    -- On-site indicators
    IF combined_text ~ '\b(on[- ]?site|office[ ]?based|in[ ]?person|onsite)\b' THEN
        RETURN 'on-site';
    END IF;
    
    -- Default to unclear if no clear indicators
    RETURN 'unclear';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- EMPLOYMENT TYPE INFERENCE
-- ============================================================================

CREATE OR REPLACE FUNCTION infer_employment_type(title TEXT, description TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    combined_text TEXT;
BEGIN
    combined_text := COALESCE(title, '') || ' ' || COALESCE(description, '');
    combined_text := LOWER(combined_text);
    
    -- Internship indicators
    IF combined_text ~ '\b(intern|internship|trainee|graduate[ ]?program)\b' THEN
        RETURN 'internship';
    END IF;
    
    -- Contract indicators
    IF combined_text ~ '\b(contract|freelance|consultant|temp|temporary)\b' THEN
        RETURN 'contract';
    END IF;
    
    -- Part-time indicators
    IF combined_text ~ '\b(part[ ]?time|p\.t\.|20[ ]?hours|25[ ]?hours)\b' THEN
        RETURN 'part-time';
    END IF;
    
    -- Default to full-time
    RETURN 'full-time';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- JOB SUMMARIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION summarize_job(description TEXT, max_length INTEGER DEFAULT 200)
RETURNS TEXT AS $$
BEGIN
    IF description IS NULL OR TRIM(description) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Clean and truncate description
    RETURN TRIM(
        REGEXP_REPLACE(
            SUBSTRING(
                REGEXP_REPLACE(
                    REGEXP_REPLACE(description, '<[^>]*>', ' ', 'g'),
                    '\s+',
                    ' ',
                    'g'
                ),
                1,
                max_length
            ),
            '\s+$',
            ''
        )
    ) || CASE 
        WHEN LENGTH(description) > max_length THEN '...'
        ELSE ''
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- ENHANCED FINGERPRINT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION job_fingerprint(
    p_company TEXT,
    p_title TEXT,
    p_location TEXT DEFAULT NULL,
    p_url TEXT DEFAULT NULL,
    p_posted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS VARCHAR(100) AS $$
DECLARE
    normalized_company TEXT;
    normalized_title TEXT;
    canonical_url TEXT;
    fingerprint_data TEXT;
BEGIN
    -- Normalize inputs
    normalized_company := normalize_company(p_company);
    normalized_title := normalize_title(p_title);
    canonical_url := canonicalize_url(p_url);
    
    -- Create fingerprint from normalized data
    fingerprint_data := COALESCE(normalized_company, '') || '|' || 
                       COALESCE(normalized_title, '') || '|' || 
                       COALESCE(p_location, '') || '|' || 
                       COALESCE(canonical_url, '') || '|' || 
                       COALESCE(p_posted_at::text, '');
    
    -- Return SHA256 hash
    RETURN encode(digest(fingerprint_data, 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- TEST THE FUNCTIONS
-- ============================================================================

-- Test normalization functions
SELECT 
    'FUNCTION TESTS' as test_type,
    normalize_title('  Software Engineer  ') as normalized_title,
    normalize_company('  ACME Corp. Ltd.  ') as normalized_company,
    canonicalize_url('https://example.com/job?utm_source=google') as canonical_url,
    infer_remote_type('Remote Software Engineer', 'Work from home') as remote_type,
    infer_employment_type('Software Engineer Intern', 'Internship position') as employment_type,
    summarize_job('This is a great opportunity for a software engineer to join our team and work on exciting projects.', 50) as summary,
    job_fingerprint('ACME Corp', 'Software Engineer', 'Amsterdam', 'https://example.com/job', NOW()) as fingerprint;
