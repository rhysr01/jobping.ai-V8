const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAndCreateAPIKey() {
  console.log('🔑 Checking and Creating API Key...');
  
  try {
    // Step 1: Check what's in the api_keys table
    console.log('\n📋 Step 1: Checking api_keys table contents...');
    const { data: keysData, error: keysError } = await supabase
      .from('api_keys')
      .select('*');
    
    if (keysError) {
      console.error('❌ Error fetching keys:', keysError);
      return;
    }

    console.log('📊 Current API keys:', keysData?.length || 0);
    if (keysData && keysData.length > 0) {
      console.log('🔑 Existing keys:', keysData.map(k => ({ id: k.id, key_hash: k.key_hash?.substring(0, 20) + '...', description: k.description })));
    }

    // Step 2: Check if we have a test user
    console.log('\n👤 Step 2: Checking for test user...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'test-api@jobping.ai')
      .single();
    
    if (userError) {
      console.error('❌ Error fetching user:', userError);
      return;
    }

    console.log('✅ Test user found:', userData);

    // Step 3: Create a test API key
    console.log('\n🔑 Step 3: Creating test API key...');
    const testKey = 'test-api-key';
    const keyHash = require('crypto').createHash('sha256').update(testKey).digest('hex');
    
    const apiKeyData = {
      key_hash: keyHash,
      description: 'Test API Key for Development',
      user_id: userData.id,
      tier: 'free',
      is_active: true,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    };

    console.log('📝 Inserting API key data:', {
      key_hash: keyHash.substring(0, 20) + '...',
      description: apiKeyData.description,
      user_id: apiKeyData.user_id
    });

    const { data: insertData, error: insertError } = await supabase
      .from('api_keys')
      .insert(apiKeyData)
      .select();

    if (insertError) {
      console.error('❌ API key creation failed:', insertError);
      return;
    }

    console.log('✅ API key created successfully:', insertData[0].id);

    // Step 4: Verify the API key works
    console.log('\n🔍 Step 4: Verifying API key...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (verifyError) {
      console.error('❌ API key verification failed:', verifyError);
    } else {
      console.log('✅ API key verified successfully');
      console.log('🎉 Test API key system is ready!');
      console.log('🔑 Test API key: test-api-key');
      console.log('📧 Test user: test-api@jobping.ai');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check and creation
checkAndCreateAPIKey();
