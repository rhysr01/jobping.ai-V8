const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateAPIKey() {
  console.log('🔑 Updating API Key with proper values...');
  
  try {
    // Step 1: Get the test user
    console.log('\n👤 Step 1: Getting test user...');
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

    // Step 2: Update the API key
    console.log('\n🔑 Step 2: Updating API key...');
    const keyHash = '4c806362b613f7496abf284146efd31da90e4b16169fe001841ca17290f427c4';
    
    const updateData = {
      user_id: userData.id,
      tier: 'free',
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    };

    console.log('📝 Updating API key with:', updateData);

    const { data: updateResult, error: updateError } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('key_hash', keyHash)
      .select();

    if (updateError) {
      console.error('❌ API key update failed:', updateError);
      return;
    }

    console.log('✅ API key updated successfully:', updateResult[0]);

    // Step 3: Verify the updated API key
    console.log('\n🔍 Step 3: Verifying updated API key...');
    const { data: verifyData, error: verifyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .single();

    if (verifyError) {
      console.error('❌ API key verification failed:', verifyError);
    } else {
      console.log('✅ API key verified successfully');
      console.log('🎉 API key system is fully ready!');
      console.log('🔑 Test API key: test-api-key');
      console.log('📧 Test user: test-api@jobping.ai');
      console.log('📊 Updated API key data:', verifyData);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the update
updateAPIKey();
