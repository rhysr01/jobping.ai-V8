const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const actualSchemaFixSQL = `
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
`;

async function applyActualSchemaFix() {
  console.log('🔧 Applying Actual Schema Fix for API Keys...');
  console.log('📊 Database URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('🔑 Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');
  
  try {
    // Test connection first
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('📝 Please run this SQL manually in your Supabase SQL Editor:');
    console.log('\n' + actualSchemaFixSQL);
    console.log('\n🔍 After running the SQL, test with: node test_api_keys.js');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('📝 Please run the SQL manually in your Supabase SQL Editor:');
    console.log('\n' + actualSchemaFixSQL);
  }
}

// Run the fix
applyActualSchemaFix();
