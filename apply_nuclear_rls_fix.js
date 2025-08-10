const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const nuclearRLSFixSQL = `
-- ========================================
-- NUCLEAR RLS FIX - COMPLETE CLEANUP
-- ========================================

-- Step 1: Disable RLS on all tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies on these tables (nuclear option)
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    RAISE NOTICE '🧨 NUCLEAR CLEANUP: Dropping ALL policies...';
    
    -- Drop ALL existing policies on your tables
    FOR pol IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'jobs', 'matches')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 
                      pol.policyname, pol.tablename);
        RAISE NOTICE '💥 Dropped policy % on table %', pol.policyname, pol.tablename;
    END LOOP;
    
    RAISE NOTICE '🎯 Nuclear cleanup complete';
END $$;

-- Step 3: Grant ALL privileges to service role
GRANT ALL PRIVILEGES ON SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- Step 4: Specific grants for your tables
GRANT ALL PRIVILEGES ON public.users TO service_role;
GRANT ALL PRIVILEGES ON public.jobs TO service_role;
GRANT ALL PRIVILEGES ON public.matches TO service_role;
`;

async function applyNuclearRLSFix() {
  console.log('🧨 Applying Nuclear RLS Fix...');
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
    console.log('📝 Please run this NUCLEAR SQL manually in your Supabase SQL Editor:');
    console.log('\n' + nuclearRLSFixSQL);
    console.log('\n🔍 After running the SQL, test with: node test_rls_direct.js');
    console.log('⚠️ This will completely disable RLS on all tables!');
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('📝 Please run the SQL manually in your Supabase SQL Editor:');
    console.log('\n' + nuclearRLSFixSQL);
  }
}

// Run the nuclear fix
applyNuclearRLSFix();
