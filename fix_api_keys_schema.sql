-- Fix API Keys Table Schema
-- Add missing columns to the api_keys table

-- Add missing columns
ALTER TABLE public.api_keys 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '1 year'),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'api_keys'
ORDER BY ordinal_position;

-- Insert a test API key
INSERT INTO public.api_keys (user_id, key_hash, tier, is_active, expires_at)
SELECT 
  '29cc8cd0-fbaa-42f4-bfe9-37a073c80736',
  '4c806362b613f7496abf284146efd31da90e4b16169fe001841ca17290f427c4',
  'free',
  TRUE,
  (now() + INTERVAL '1 year')
ON CONFLICT (key_hash) DO NOTHING;

-- Show the result
SELECT 'API Keys Table Fixed' as status, COUNT(*) as total_keys FROM public.api_keys;
