-- Migration: Fix database schema to match code expectations
-- This migration adds missing columns and fixes data types

-- 1. Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token TEXT,
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE;

-- 2. Fix data types for array fields in users table
-- Convert TEXT columns to proper array types for better querying
ALTER TABLE public.users 
ALTER COLUMN languages_spoken TYPE TEXT[] USING 
  CASE 
    WHEN languages_spoken IS NULL THEN NULL
    WHEN languages_spoken = '' THEN '{}'
    ELSE string_to_array(languages_spoken, ',')
  END,
ALTER COLUMN company_types TYPE TEXT[] USING 
  CASE 
    WHEN company_types IS NULL THEN NULL
    WHEN company_types = '' THEN '{}'
    ELSE string_to_array(company_types, ',')
  END,
ALTER COLUMN roles_selected TYPE TEXT[] USING 
  CASE 
    WHEN roles_selected IS NULL THEN NULL
    WHEN roles_selected = '' THEN '{}'
    ELSE string_to_array(roles_selected, ',')
  END,
ALTER COLUMN target_cities TYPE TEXT[] USING 
  CASE 
    WHEN target_cities IS NULL THEN NULL
    WHEN target_cities = '' THEN '{}'
    ELSE string_to_array(target_cities, ',')
  END;

-- 3. Add missing columns to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS is_sent BOOLEAN DEFAULT FALSE;

-- 4. Add missing columns to matches table
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS matched_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS freshness_tier VARCHAR;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified) WHERE email_verified = FALSE;
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON public.users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_jobs_freshness_tier ON public.jobs(freshness_tier);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_is_sent ON public.jobs(is_sent) WHERE is_sent = FALSE;
CREATE INDEX IF NOT EXISTS idx_matches_user_email ON public.matches(user_email);
CREATE INDEX IF NOT EXISTS idx_matches_matched_at ON public.matches(matched_at);

-- 6. Add comments to document the schema
COMMENT ON COLUMN public.users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN public.users.verification_token IS 'Temporary token for email verification (24-hour expiry)';
COMMENT ON COLUMN public.users.active IS 'Whether the user account is active';
COMMENT ON COLUMN public.users.languages_spoken IS 'Array of languages the user speaks professionally';
COMMENT ON COLUMN public.users.company_types IS 'Array of preferred company types';
COMMENT ON COLUMN public.users.roles_selected IS 'Array of preferred job roles';
COMMENT ON COLUMN public.users.target_cities IS 'Array of target cities for job search';
COMMENT ON COLUMN public.jobs.is_sent IS 'Whether this job has been sent to users';
COMMENT ON COLUMN public.matches.matched_at IS 'When the match was created';
COMMENT ON COLUMN public.matches.freshness_tier IS 'Freshness tier of the matched job';

-- 7. Update existing data to set default values
UPDATE public.users SET 
  email_verified = FALSE,
  active = TRUE
WHERE email_verified IS NULL OR active IS NULL;

UPDATE public.jobs SET 
  is_sent = FALSE,
  status = COALESCE(status, 'active')
WHERE is_sent IS NULL OR status IS NULL;

-- 8. Set up triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
