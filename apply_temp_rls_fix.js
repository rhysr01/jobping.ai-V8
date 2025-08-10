const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const tempRLSFixSQL = `
-- ========================================
-- TEMPORARY RLS DISABLE FOR TESTING
-- ========================================

-- Disable RLS on all tables temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean slate
DROP POLICY IF EXISTS "jobping_users_service_access" ON public.users;
DROP POLICY IF EXISTS "jobping_jobs_service_access" ON public.jobs;
DROP POLICY IF EXISTS "jobping_matches_service_access" ON public.matches;
DROP POLICY IF EXISTS "jobping_users_own_data" ON public.users;
DROP POLICY IF EXISTS "jobping_jobs_public_read" ON public.jobs;
DROP POLICY IF EXISTS "jobping_matches_own_email" ON public.matches;

-- Grant full access to service role
GRANT ALL PRIVILEGES ON public.users TO service_role;
GRANT ALL PRIVILEGES ON public.jobs TO service_role;
GRANT ALL PRIVILEGES ON public.matches TO service_role;
`;

async function applyTempRLSFix() {
  console.log('🔓 Applying Temporary RLS Disable...');
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
    console.log('\n' + tempRLSFixSQL);
    console.log('\n🔍 After running the SQL, test with: node test_rls_direct.js');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('📝 Please run the SQL manually in your Supabase SQL Editor:');
    console.log('\n' + tempRLSFixSQL);
  }
}

// Run the fix
applyTempRLSFix();
