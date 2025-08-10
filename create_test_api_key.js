const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestAPIKey() {
  console.log('🔑 Creating Test API Key...');
  
  try {
    // Step 1: Create a test user
    console.log('\n👤 Step 1: Creating test user...');
    const testUser = {
      email: 'test-api@jobping.ai',
      full_name: 'Test API User',
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
      email_verified: true,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (userError) {
      console.error('❌ User creation failed:', userError);
      return;
    }

    console.log('✅ Test user created:', userData.id);

    // Step 2: Create test API key
    console.log('\n🔑 Step 2: Creating test API key...');
    const testKey = 'test-api-key';
    const keyHash = require('crypto').createHash('sha256').update(testKey).digest('hex');
    
    const apiKeyData = {
      user_id: userData.id,
      key_hash: keyHash,
      tier: 'free',
      is_active: true,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    };

    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .insert(apiKeyData)
      .select()
      .single();

    if (keyError) {
      console.error('❌ API key creation failed:', keyError);
      return;
    }

    console.log('✅ Test API key created:', keyData.id);
    console.log('🔑 Test API key hash:', keyHash);
    console.log('📧 Test user email:', testUser.email);

    // Step 3: Verify the API key works
    console.log('\n🔍 Step 3: Verifying API key...');
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
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the creation
createTestAPIKey();
