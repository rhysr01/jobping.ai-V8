-- Migration: Add updated_at column to jobs table
-- This fixes the "record new has no field updated_at" error

-- Add updated_at column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic updated_at timestamp
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs;
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();

-- Update existing jobs to have updated_at equal to created_at
UPDATE public.jobs 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- Verify the migration
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'jobs' 
  AND column_name IN ('created_at', 'updated_at')
ORDER BY column_name;

-- Show trigger info
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'update_jobs_updated_at';

-- Comments
COMMENT ON COLUMN public.jobs.updated_at IS 'Timestamp when the job record was last updated';
COMMENT ON TRIGGER update_jobs_updated_at ON public.jobs IS 'Automatically updates updated_at timestamp on job record changes';
