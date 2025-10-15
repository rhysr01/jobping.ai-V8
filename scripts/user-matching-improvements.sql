-- ============================================================================
-- USER & MATCHING IMPROVEMENTS
-- ============================================================================
-- Enhances user profiles and adds smart matching features
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: USER PROFILE IMPROVEMENTS
-- ============================================================================

-- 1. Infer languages from target cities (if user didn't provide)
UPDATE users
SET 
  languages_spoken = ARRAY(
    SELECT DISTINCT lang FROM (
      SELECT UNNEST(ARRAY['English']) as lang 
      WHERE EXISTS (
        SELECT 1 FROM UNNEST(target_cities) AS city 
        WHERE city IN ('London', 'Dublin', 'Edinburgh', 'Manchester', 'Birmingham')
      )
      UNION
      SELECT UNNEST(ARRAY['German']) as lang
      WHERE EXISTS (
        SELECT 1 FROM UNNEST(target_cities) AS city 
        WHERE city IN ('Berlin', 'München', 'Munich', 'Frankfurt', 'Hamburg', 'Zurich', 'Zürich')
      )
      UNION
      SELECT UNNEST(ARRAY['French']) as lang
      WHERE EXISTS (
        SELECT 1 FROM UNNEST(target_cities) AS city 
        WHERE city IN ('Paris', 'Lyon', 'Brussels', 'Bruxelles', 'Geneva', 'Genève')
      )
      UNION
      SELECT UNNEST(ARRAY['Italian']) as lang
      WHERE EXISTS (
        SELECT 1 FROM UNNEST(target_cities) AS city 
        WHERE city IN ('Milan', 'Milano', 'Rome', 'Roma', 'Turin', 'Torino')
      )
      UNION
      SELECT UNNEST(ARRAY['Spanish']) as lang
      WHERE EXISTS (
        SELECT 1 FROM UNNEST(target_cities) AS city 
        WHERE city IN ('Madrid', 'Barcelona', 'Valencia')
      )
      UNION
      SELECT UNNEST(ARRAY['Dutch']) as lang
      WHERE EXISTS (
        SELECT 1 FROM UNNEST(target_cities) AS city 
        WHERE city IN ('Amsterdam', 'Rotterdam', 'Utrecht', 'The Hague')
      )
    ) langs
  ),
  updated_at = now()
WHERE active = true
  AND (languages_spoken IS NULL OR languages_spoken = '{}' OR array_length(languages_spoken, 1) = 0);

-- 2. Normalize role names for better matching
UPDATE users
SET 
  roles_selected = ARRAY(
    SELECT DISTINCT 
      CASE
        -- Normalize variations
        WHEN LOWER(role) LIKE '%business analyst%' THEN 'Business Analyst'
        WHEN LOWER(role) LIKE '%data analyst%' THEN 'Data Analyst'
        WHEN LOWER(role) LIKE '%financial analyst%' THEN 'Financial Analyst'
        WHEN LOWER(role) LIKE '%consultant%' THEN 'Consultant'
        WHEN LOWER(role) LIKE '%strategy%' THEN 'Strategy Analyst'
        WHEN LOWER(role) LIKE '%product%' THEN 'Product Analyst'
        WHEN LOWER(role) LIKE '%software%' OR LOWER(role) LIKE '%developer%' THEN 'Software Developer'
        ELSE role
      END
    FROM UNNEST(roles_selected) AS role
  ),
  updated_at = now()
WHERE active = true
  AND roles_selected IS NOT NULL;

-- ============================================================================
-- PART 2: ADD NEW USER FIELDS FOR BETTER MATCHING
-- ============================================================================

-- Add preferred company sizes
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'preferred_company_sizes') THEN
    ALTER TABLE users ADD COLUMN preferred_company_sizes TEXT[] DEFAULT '{}';
    COMMENT ON COLUMN users.preferred_company_sizes IS 'Startup, Scale-up, Enterprise, etc.';
  END IF;
END $$;

-- Add industry preferences
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'industries') THEN
    ALTER TABLE users ADD COLUMN industries TEXT[] DEFAULT '{}';
    COMMENT ON COLUMN users.industries IS 'Finance, Tech, Consulting, Healthcare, etc.';
  END IF;
END $$;

-- Add salary expectations
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'min_salary') THEN
    ALTER TABLE users ADD COLUMN min_salary INTEGER;
    COMMENT ON COLUMN users.min_salary IS 'Minimum salary expectation in EUR/year';
  END IF;
END $$;

-- Add excluded companies (user blacklist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'excluded_companies') THEN
    ALTER TABLE users ADD COLUMN excluded_companies TEXT[] DEFAULT '{}';
    COMMENT ON COLUMN users.excluded_companies IS 'Companies to exclude from matching';
  END IF;
END $$;

-- Add skills/keywords for matching
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'skills') THEN
    ALTER TABLE users ADD COLUMN skills TEXT[] DEFAULT '{}';
    COMMENT ON COLUMN users.skills IS 'Python, Excel, SQL, PowerPoint, etc.';
  END IF;
END $$;

-- Add job alert frequency preference
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'email_frequency') THEN
    ALTER TABLE users ADD COLUMN email_frequency TEXT DEFAULT 'weekly';
    ALTER TABLE users ADD CONSTRAINT email_frequency_check 
      CHECK (email_frequency IN ('daily', 'weekly', 'biweekly'));
    COMMENT ON COLUMN users.email_frequency IS 'How often to send job alerts';
  END IF;
END $$;

-- Add match quality threshold
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'min_match_score') THEN
    ALTER TABLE users ADD COLUMN min_match_score NUMERIC DEFAULT 0.7;
    COMMENT ON COLUMN users.min_match_score IS 'Minimum match score to include (0.0-1.0)';
  END IF;
END $$;

-- ============================================================================
-- PART 3: ADD MATCH TRACKING FIELDS
-- ============================================================================

-- Track which jobs user has seen (to avoid duplicates)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'seen_job_hashes') THEN
    ALTER TABLE users ADD COLUMN seen_job_hashes TEXT[] DEFAULT '{}';
    COMMENT ON COLUMN users.seen_job_hashes IS 'Job hashes already sent to user';
  END IF;
END $$;

-- Track application clicks
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'users' AND column_name = 'clicked_job_hashes') THEN
    ALTER TABLE users ADD COLUMN clicked_job_hashes TEXT[] DEFAULT '{}';
    COMMENT ON COLUMN users.clicked_job_hashes IS 'Jobs user clicked to apply';
  END IF;
END $$;

-- ============================================================================
-- PART 4: ENHANCE JOBS TABLE FOR MATCHING
-- ============================================================================

-- Add company size classification
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'jobs' AND column_name = 'company_size') THEN
    ALTER TABLE jobs ADD COLUMN company_size TEXT;
    COMMENT ON COLUMN jobs.company_size IS 'Startup, Scale-up, Enterprise';
  END IF;
END $$;

-- Add industry tags
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'jobs' AND column_name = 'industries') THEN
    ALTER TABLE jobs ADD COLUMN industries TEXT[] DEFAULT '{}';
    COMMENT ON COLUMN jobs.industries IS 'Finance, Tech, Consulting, etc.';
  END IF;
END $$;

-- Add required skills extracted from description
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'jobs' AND column_name = 'required_skills') THEN
    ALTER TABLE jobs ADD COLUMN required_skills TEXT[] DEFAULT '{}';
    COMMENT ON COLUMN jobs.required_skills IS 'Skills extracted from job description';
  END IF;
END $$;

-- Add sponsorship availability flag
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'jobs' AND column_name = 'visa_sponsorship') THEN
    ALTER TABLE jobs ADD COLUMN visa_sponsorship BOOLEAN DEFAULT NULL;
    COMMENT ON COLUMN jobs.visa_sponsorship IS 'Whether company sponsors visas';
  END IF;
END $$;

-- ============================================================================
-- PART 5: EXTRACT INDUSTRIES FROM JOB DATA
-- ============================================================================

UPDATE jobs
SET 
  industries = ARRAY(
    SELECT DISTINCT industry FROM (
      SELECT 'Finance' as industry
      WHERE LOWER(title || ' ' || COALESCE(description, '')) ~ 'financ|banking|investment|trading|fund'
      
      UNION
      
      SELECT 'Consulting' as industry
      WHERE LOWER(title || ' ' || COALESCE(description, '')) ~ 'consult|strategy|advisory'
      
      UNION
      
      SELECT 'Technology' as industry
      WHERE LOWER(title || ' ' || COALESCE(description, '')) ~ 'tech|software|developer|engineer|IT|data'
      
      UNION
      
      SELECT 'Healthcare' as industry
      WHERE LOWER(title || ' ' || COALESCE(description, '')) ~ 'health|medical|pharma|hospital'
      
      UNION
      
      SELECT 'Energy' as industry
      WHERE LOWER(title || ' ' || COALESCE(description, '')) ~ 'energy|renewable|oil|gas|solar'
      
      UNION
      
      SELECT 'Consumer Goods' as industry
      WHERE LOWER(title || ' ' || COALESCE(description, '')) ~ 'retail|consumer|fmcg|e-commerce'
    ) inds
  ),
  updated_at = now()
WHERE is_active = true
  AND (industries IS NULL OR industries = '{}');

-- ============================================================================
-- PART 6: DETECT VISA SPONSORSHIP
-- ============================================================================

UPDATE jobs
SET 
  visa_sponsorship = CASE
    WHEN description IS NULL THEN NULL
    WHEN LOWER(description) ~ 'visa sponsor|sponsorship available|work permit|work authorization' THEN true
    WHEN LOWER(description) ~ 'no sponsor|sponsorship not available|right to work required' THEN false
    ELSE NULL
  END,
  updated_at = now()
WHERE is_active = true
  AND description IS NOT NULL;

-- ============================================================================
-- STATISTICS
-- ============================================================================

SELECT 
  '========================================' as divider;

SELECT 
  'USER PROFILE IMPROVEMENTS' as section;

SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN array_length(languages_spoken, 1) > 0 THEN 1 END) as has_languages,
  COUNT(CASE WHEN array_length(skills, 1) > 0 THEN 1 END) as has_skills,
  COUNT(CASE WHEN min_salary IS NOT NULL THEN 1 END) as has_salary_pref,
  ROUND(100.0 * COUNT(CASE WHEN array_length(languages_spoken, 1) > 0 THEN 1 END) / COUNT(*), 2) || '%' as pct_with_languages
FROM users
WHERE active = true;

SELECT 
  'JOB DATA ENRICHMENT' as section;

SELECT 
  COUNT(*) as total_active_jobs,
  COUNT(CASE WHEN array_length(industries, 1) > 0 THEN 1 END) as has_industries,
  COUNT(CASE WHEN visa_sponsorship IS NOT NULL THEN 1 END) as has_sponsorship_info,
  ROUND(100.0 * COUNT(CASE WHEN array_length(industries, 1) > 0 THEN 1 END) / COUNT(*), 2) || '%' as pct_with_industries
FROM jobs
WHERE is_active = true;

-- Sample of improved user data
SELECT 
  'SAMPLE USER PROFILES' as section;

SELECT 
  target_cities,
  languages_spoken,
  industries,
  email_frequency,
  min_match_score
FROM users
WHERE active = true
LIMIT 3;

-- Sample of enriched jobs
SELECT 
  'SAMPLE ENRICHED JOBS' as section;

SELECT 
  title,
  city,
  country,
  industries,
  language_requirements,
  visa_sponsorship
FROM jobs
WHERE is_active = true
  AND array_length(industries, 1) > 0
LIMIT 10;

COMMIT;

