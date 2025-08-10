const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createSimpleAPIKey() {
  console.log('🔑 Creating Simple API Key...');
  
  try {
    // Step 1: Check the actual table structure
    console.log('\n📋 Step 1: Checking actual table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('api_keys')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access error:', tableError);
      return;
    }

    console.log('✅ Table accessible');
    if (tableData && tableData.length > 0) {
      console.log('📊 Available columns:', Object.keys(tableData[0]));
    } else {
      console.log('📊 Table is empty, checking schema...');
    }

    // Step 2: Create a simple API key with only existing columns
    console.log('\n🔑 Step 2: Creating simple API key...');
    const testKey = 'test-api-key';
    const keyHash = require('crypto').createHash('sha256').update(testKey).digest('hex');
    
    // Only use columns that we know exist
    const simpleKeyData = {
      key_hash: keyHash,
      description: 'Test API Key for Development'
    };

    console.log('📝 Inserting simple API key data:', {
      key_hash: keyHash.substring(0, 20) + '...',
      description: simpleKeyData.description
    });

    const { data: insertData, error: insertError } = await supabase
      .from('api_keys')
      .insert(simpleKeyData)
      .select();

    if (insertError) {
      console.error('❌ API key creation failed:', insertError);
      return;
    }

    console.log('✅ API key created successfully:', insertData[0].id);

    // Step 3: Verify the API key works
    console.log('\n🔍 Step 3: Verifying API key...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .single();

    if (verifyError) {
      console.error('❌ API key verification failed:', verifyError);
    } else {
      console.log('✅ API key verified successfully');
      console.log('🎉 Simple API key system is ready!');
      console.log('🔑 Test API key: test-api-key');
      console.log('📊 API key data:', verifyData);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the creation
createSimpleAPIKey();
