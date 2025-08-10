const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAPIKeys() {
  console.log('🔑 Testing API Keys System...');
  
  try {
    // Test 1: Check if api_keys table exists
    console.log('\n📋 Test 1: Checking api_keys table...');
    const { data: tableData, error: tableError } = await supabase
      .from('api_keys')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.error('❌ api_keys table error:', tableError);
      console.log('💡 The api_keys table might not exist or be accessible');
    } else {
      console.log('✅ api_keys table accessible');
    }

    // Test 2: Check what tables exist
    console.log('\n📋 Test 2: Checking available tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');
    
    if (tablesError) {
      console.log('⚠️ Could not get tables via RPC, trying direct query...');
      // Try to query information_schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (schemaError) {
        console.error('❌ Schema access error:', schemaError);
      } else {
        console.log('✅ Schema access working');
      }
    } else {
      console.log('✅ Available tables:', tables);
    }

    // Test 3: Test the test API key directly
    console.log('\n🔑 Test 3: Testing test-api-key...');
    const testKey = 'test-api-key';
    const keyHash = require('crypto').createHash('sha256').update(testKey).digest('hex');
    console.log('Key hash:', keyHash);
    
    // Try to find this key in the database
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .single();
    
    if (keyError) {
      console.error('❌ Key lookup error:', keyError);
    } else {
      console.log('✅ Key found:', keyData);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testAPIKeys();
