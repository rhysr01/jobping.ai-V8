#!/usr/bin/env node

/**
 * Quick schema check for match_logs table
 * This will show what we have and what we need
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

async function quickSchemaCheck() {
  console.log('🔍 Quick Schema Check for match_logs table...\n');

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
    // Get current table structure
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
      console.log('📋 Current Table Structure:');
      console.log('='.repeat(60));
      
      Object.entries(record).forEach(([key, value]) => {
        const type = typeof value;
        const isNull = value === null;
        const displayValue = isNull ? 'NULL' : 
                           type === 'string' ? `"${value}"` : 
                           type === 'object' ? JSON.stringify(value) : value;
        
        console.log(`${key.padEnd(30)} | ${type.padEnd(10)} | ${displayValue}`);
      });
      
      console.log('='.repeat(60));
      
      // Check what we need
      const requiredFields = {
        'created_at': 'timestamptz',
        'updated_at': 'timestamptz',
        'user_career_path': 'text',
        'user_professional_experience': 'text', 
        'user_work_preference': 'text',
        'error_message': 'text'
      };
      
      const existingFields = Object.keys(record);
      const missingFields = Object.keys(requiredFields).filter(field => !existingFields.includes(field));
      const typeIssues = [];
      
      // Check for type issues
      if (record.user_career_path && typeof record.user_career_path === 'object') {
        typeIssues.push('user_career_path should be text, not object');
      }
      if (record.user_professional_experience && typeof record.user_professional_experience === 'object') {
        typeIssues.push('user_professional_experience should be text, not object');
      }
      if (record.user_work_preference && typeof record.user_work_preference === 'object') {
        typeIssues.push('user_work_preference should be text, not object');
      }
      if (record.error_message && typeof record.error_message === 'object') {
        typeIssues.push('error_message should be text, not object');
      }
      
      console.log('\n📊 Analysis:');
      console.log(`✅ Existing fields: ${existingFields.length}`);
      console.log(`❌ Missing fields: ${missingFields.length}`);
      console.log(`🔧 Type issues: ${typeIssues.length}`);
      
      if (missingFields.length > 0) {
        console.log('\n❌ Missing required fields:');
        missingFields.forEach(field => {
          console.log(`   - ${field} (${requiredFields[field]})`);
        });
      }
      
      if (typeIssues.length > 0) {
        console.log('\n🔧 Data type issues:');
        typeIssues.forEach(issue => console.log(`   - ${issue}`));
      }
      
      // Provide next steps
      if (missingFields.length === 0 && typeIssues.length === 0) {
        console.log('\n🎉 Table structure is perfect!');
        console.log('✅ No migration needed');
        console.log('🚀 Ready to test enhanced logging');
      } else {
        console.log('\n🔧 Migration needed:');
        console.log('   1. Follow the manual migration instructions');
        console.log('   2. Run the SQL in Supabase dashboard');
        console.log('   3. Test the system after migration');
        
        console.log('\n📋 Migration file: scripts/manual-migration-instructions.md');
        console.log('⏱️  Estimated time: 5-10 minutes');
      }
      
    } else {
      console.log('ℹ️  Table is empty, no structure to analyze');
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
quickSchemaCheck().catch(console.error);
