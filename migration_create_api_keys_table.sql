-- Migration: Create API keys table for authentication
-- This table stores API keys for user authentication

-- Create API keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  tier VARCHAR(20) DEFAULT 'free',
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON public.api_keys(expires_at);

-- Create API key usage tracking table
CREATE TABLE IF NOT EXISTS public.api_key_usage (
  id SERIAL PRIMARY KEY,
  key_hash TEXT NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  ip_address INET,
  success BOOLEAN NOT NULL,
  response_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for usage tracking
CREATE INDEX IF NOT EXISTS idx_api_key_usage_key_hash ON public.api_key_usage(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_created_at ON public.api_key_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_endpoint ON public.api_key_usage(endpoint);

-- Add comments
COMMENT ON TABLE public.api_keys IS 'API keys for user authentication';
COMMENT ON COLUMN public.api_keys.key_hash IS 'Hashed API key for security';
COMMENT ON COLUMN public.api_keys.tier IS 'User tier (free, premium, etc.)';
COMMENT ON COLUMN public.api_keys.is_active IS 'Whether the API key is active';
COMMENT ON COLUMN public.api_keys.expires_at IS 'When the API key expires';

COMMENT ON TABLE public.api_key_usage IS 'API key usage tracking for monitoring';
COMMENT ON COLUMN public.api_key_usage.key_hash IS 'Hashed API key';
COMMENT ON COLUMN public.api_key_usage.endpoint IS 'API endpoint accessed';
COMMENT ON COLUMN public.api_key_usage.ip_address IS 'IP address of the request';
COMMENT ON COLUMN public.api_key_usage.success IS 'Whether the request was successful';

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_keys_updated_at 
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW EXECUTE FUNCTION update_api_keys_updated_at();

-- Insert a test API key for development
INSERT INTO public.api_keys (user_id, key_hash, tier, is_active, expires_at)
SELECT 
  (SELECT id FROM public.users LIMIT 1),
  'test-api-key-hash',
  'free',
  TRUE,
  (now() + INTERVAL '1 year')
WHERE EXISTS (SELECT 1 FROM public.users LIMIT 1)
ON CONFLICT (key_hash) DO NOTHING;
