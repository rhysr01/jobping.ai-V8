-- Fix Row Level Security (RLS) policies for Supabase tables
-- Run this in your Supabase SQL Editor

-- Create policies for the users table to allow service role access
CREATE POLICY "Allow service role full access to users" 
ON public.users 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create policies for the jobs table to allow service role access
CREATE POLICY "Allow service role full access to jobs" 
ON public.jobs 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create policies for the matches table to allow service role access
CREATE POLICY "Allow service role full access to matches" 
ON public.matches 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create policies for the match_logs table to allow service role access
CREATE POLICY "Allow service role full access to match_logs" 
ON public.match_logs 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Optional: Allow authenticated users to read their own data
CREATE POLICY "Users can read own data" 
ON public.users 
FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Users can read their own matches" 
ON public.matches 
FOR SELECT 
TO authenticated 
USING (user_email = auth.email());

-- Grant necessary permissions to service role
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.jobs TO service_role;
GRANT ALL ON public.matches TO service_role;
GRANT ALL ON public.match_logs TO service_role;
