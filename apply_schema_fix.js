const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const schemaFixSQL = `
-- Fix API Keys Table Schema
-- Add missing columns to the api_keys table

-- Add missing columns
ALTER TABLE public.api_keys 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '1 year'),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Insert a test API key
INSERT INTO public.api_keys (user_id, key_hash, tier, is_active, expires_at)
SELECT 
  '29cc8cd0-fbaa-42f4-bfe9-37a073c80736',
  '4c806362b613f7496abf284146efd31da90e4b16169fe001841ca17290f427c4',
  'free',
  TRUE,
  (now() + INTERVAL '1 year')
ON CONFLICT (key_hash) DO NOTHING;
`;

async function applySchemaFix() {
  console.log('🔧 Applying API Keys Schema Fix...');
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
    console.log('\n' + schemaFixSQL);
    console.log('\n🔍 After running the SQL, test with: node test_api_keys.js');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('📝 Please run the SQL manually in your Supabase SQL Editor:');
    console.log('\n' + schemaFixSQL);
  }
}

// Run the fix
applySchemaFix();
