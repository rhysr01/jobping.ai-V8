-- Migration: Create match_logs table for tracking matching sessions
-- This table tracks AI matching performance, fallback usage, and user engagement
-- Updated to match the actual JobPing database schema

-- Create the match_logs table
CREATE TABLE IF NOT EXISTS public.match_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    block_send BOOLEAN DEFAULT false,
    block_processed BOOLEAN DEFAULT false,
    user_career_path TEXT,
    user_professional_expertise TEXT,
    user_work_preference TEXT,
    match_job_id UUID,
    matches_generated BIGINT DEFAULT 0,
    error_message TEXT,
    match_type TEXT CHECK (match_type IN ('ai_success', 'ai_failed', 'fallback', 'manual')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_logs_user_email ON public.match_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_match_logs_timestamp ON public.match_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_match_logs_match_type ON public.match_logs(match_type);
CREATE INDEX IF NOT EXISTS idx_match_logs_block_send ON public.match_logs(block_send);
CREATE INDEX IF NOT EXISTS idx_match_logs_block_processed ON public.match_logs(block_processed);

-- Create a composite index for common queries
CREATE INDEX IF NOT EXISTS idx_match_logs_user_timestamp ON public.match_logs(user_email, timestamp DESC);

-- Add RLS policies
ALTER TABLE public.match_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "service_role_full_access_match_logs" ON public.match_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Users can only see their own logs
CREATE POLICY "users_can_view_own_logs" ON public.match_logs
    FOR SELECT USING (auth.email() = user_email);

-- Grant permissions
GRANT ALL ON public.match_logs TO service_role;
GRANT SELECT ON public.match_logs TO authenticated;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_match_logs_updated_at 
    BEFORE UPDATE ON public.match_logs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing
INSERT INTO public.match_logs (
    user_email, 
    match_type, 
    matches_generated, 
    user_career_path,
    user_professional_expertise,
    user_work_preference,
    error_message
) VALUES 
    ('test@example.com', 'ai_success', 15, 'Strategy & Business Design', 'Consulting', 'Hybrid'),
    ('test@example.com', 'fallback', 12, 'Data & Analytics', 'Data Analysis', 'Remote'),
    ('premium@example.com', 'ai_success', 25, 'Finance & Investment', 'Investment Banking', 'Office');

-- Log the migration
INSERT INTO public.match_logs (
    user_email, 
    match_type, 
    matches_generated, 
    error_message,
    user_career_path
) VALUES (
    'system@jobping.com', 
    'ai_success', 
    0, 
    'match_logs table created successfully - schema aligned with JobPing requirements',
    'System'
);
