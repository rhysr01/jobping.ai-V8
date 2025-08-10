-- Fix API Keys Table to match expected schema
-- Add missing columns that the code expects

-- Add missing columns to api_keys table
ALTER TABLE public.api_keys 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS tier VARCHAR(20) DEFAULT 'free',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '1 year'),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Insert a test API key with the correct structure
INSERT INTO public.api_keys (key_hash, description, user_id, tier, is_active, expires_at)
SELECT 
  '4c806362b613f7496abf284146efd31da90e4b16169fe001841ca17290f427c4',
  'Test API Key for Development',
  '29cc8cd0-fbaa-42f4-bfe9-37a073c80736',
  'free',
  TRUE,
  (now() + INTERVAL '1 year')
WHERE EXISTS (SELECT 1 FROM public.users WHERE id = '29cc8cd0-fbaa-42f4-bfe9-37a073c80736')
ON CONFLICT (key_hash) DO NOTHING;

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

-- Show the result
SELECT 'API Keys Table Fixed' as status, COUNT(*) as total_keys FROM public.api_keys;
