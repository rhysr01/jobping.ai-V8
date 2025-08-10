const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAPIKeysSchema() {
  console.log('🔍 Checking API Keys Table Schema...');
  
  try {
    // Check the table structure
    console.log('\n📋 Checking api_keys table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('api_keys')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table access error:', tableError);
      return;
    }

    console.log('✅ Table accessible');
    console.log('📊 Table columns:', Object.keys(tableData[0] || {}));

    // Try to insert a simple record to see what works
    console.log('\n🔑 Testing simple API key insertion...');
    const testKey = 'test-api-key';
    const keyHash = require('crypto').createHash('sha256').update(testKey).digest('hex');
    
    const simpleKeyData = {
      user_id: '29cc8cd0-fbaa-42f4-bfe9-37a073c80736', // Use the user we just created
      key_hash: keyHash,
      tier: 'free',
      is_active: true
    };

    console.log('📝 Inserting data:', simpleKeyData);
    
    const { data: insertData, error: insertError } = await supabase
      .from('api_keys')
      .insert(simpleKeyData)
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
      
      // Try without expires_at
      console.log('\n🔄 Trying without expires_at...');
      const { data: insertData2, error: insertError2 } = await supabase
        .from('api_keys')
        .insert({
          user_id: '29cc8cd0-fbaa-42f4-bfe9-37a073c80736',
          key_hash: keyHash + '-2',
          tier: 'free',
          is_active: true
        })
        .select();

      if (insertError2) {
        console.error('❌ Insert error 2:', insertError2);
      } else {
        console.log('✅ Simple insert successful:', insertData2);
      }
    } else {
      console.log('✅ Insert successful:', insertData);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkAPIKeysSchema();
