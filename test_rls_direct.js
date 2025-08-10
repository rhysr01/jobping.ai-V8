const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRLSPolicies() {
  console.log('🔍 Testing RLS Policies Directly...');
  
  try {
    // Test 1: Check if we can read from users table
    console.log('\n📖 Test 1: Reading from users table...');
    const { data: readData, error: readError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ Read failed:', readError);
    } else {
      console.log('✅ Read successful:', readData?.length || 0, 'records');
    }

    // Test 2: Check if we can insert into users table
    console.log('\n📝 Test 2: Inserting into users table...');
    const testUser = {
      email: 'test-rls@jobping.ai',
      full_name: 'RLS Test User',
      professional_expertise: 'Software Engineering',
      entry_level_preference: 'Graduate',
      target_cities: ['London'],
      languages_spoken: ['English'],
      company_types: ['Startups'],
      roles_selected: ['Software Engineer'],
      career_path: ['Technology'],
      start_date: '2024-06-01',
      work_environment: ['Hybrid'],
      visa_status: ['EU Citizen'],
      email_verified: false,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
      console.error('Error details:', JSON.stringify(insertError, null, 2));
    } else {
      console.log('✅ Insert successful:', insertData);
    }

    // Test 3: Check if we can update users table
    console.log('\n🔄 Test 3: Updating users table...');
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ full_name: 'Updated RLS Test User' })
      .eq('email', 'test-rls@jobping.ai')
      .select();

    if (updateError) {
      console.error('❌ Update failed:', updateError);
    } else {
      console.log('✅ Update successful:', updateData);
    }

    // Test 4: Check if we can delete from users table
    console.log('\n🗑️ Test 4: Deleting from users table...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('email', 'test-rls@jobping.ai')
      .select();

    if (deleteError) {
      console.error('❌ Delete failed:', deleteError);
    } else {
      console.log('✅ Delete successful:', deleteData);
    }

    // Test 5: Check RLS policies
    console.log('\n🔐 Test 5: Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_rls_policies');

    if (policiesError) {
      console.log('⚠️ Could not fetch policies via RPC, trying direct query...');
      // Try a direct query to check policies
      const { data: directPolicies, error: directError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (directError) {
        console.error('❌ Direct query failed:', directError);
      } else {
        console.log('✅ Direct query successful - RLS might be disabled or policies are working');
      }
    } else {
      console.log('✅ Policies fetched:', policies);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testRLSPolicies();
