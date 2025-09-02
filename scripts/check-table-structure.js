#!/usr/bin/env node

/**
 * Check the actual structure of the existing match_logs table
 * This will help us understand what fields already exist
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

async function checkTableStructure() {
  console.log('🔍 Checking match_logs table structure...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Get table structure by examining a sample record
    console.log('📋 Examining table structure...');
    
    const { data: sampleData, error: sampleError } = await supabase
      .from('match_logs')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Failed to get sample data:', sampleError.message);
      return;
    }

    if (sampleData && sampleData.length > 0) {
      const record = sampleData[0];
      console.log('✅ Table structure analysis:');
      console.log('='.repeat(50));
      
      Object.entries(record).forEach(([key, value]) => {
        const type = typeof value;
        const isNull = value === null;
        const displayValue = isNull ? 'NULL' : 
                           type === 'string' ? `"${value}"` : 
                           type === 'object' ? JSON.stringify(value) : value;
        
        console.log(`${key.padEnd(25)} | ${type.padEnd(10)} | ${displayValue}`);
      });
      
      console.log('='.repeat(50));
      
      // Check which fields we need to add
      const existingFields = Object.keys(record);
      const requiredFields = [
        'id', 'user_email', 'timestamp', 'match_type', 'matches_generated',
        'user_career_path', 'user_professional_expertise', 'user_work_preference',
        'error_message', 'created_at', 'updated_at'
      ];
      
      const missingFields = requiredFields.filter(field => !existingFields.includes(field));
      const extraFields = existingFields.filter(field => !requiredFields.includes(field));
      
      console.log('\n📊 Field Analysis:');
      console.log(`✅ Existing fields: ${existingFields.length}`);
      console.log(`❌ Missing fields: ${missingFields.length}`);
      console.log(`🔧 Extra fields: ${extraFields.length}`);
      
      if (missingFields.length > 0) {
        console.log('\n❌ Missing required fields:');
        missingFields.forEach(field => console.log(`   - ${field}`));
      }
      
      if (extraFields.length > 0) {
        console.log('\n🔧 Extra fields (can be kept):');
        extraFields.forEach(field => console.log(`   - ${field}`));
      }
      
      // Check if we need to migrate or just update
      if (missingFields.length === 0) {
        console.log('\n🎉 Table structure is already correct!');
        console.log('✅ No migration needed');
      } else if (missingFields.length <= 3) {
        console.log('\n🔧 Minor updates needed:');
        console.log('   Adding missing fields...');
      } else {
        console.log('\n⚠️  Significant changes needed:');
        console.log('   Consider recreating table or major migration');
      }
      
    } else {
      console.log('ℹ️  Table is empty, no structure to analyze');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the check
checkTableStructure().catch(console.error);
