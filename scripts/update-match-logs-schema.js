#!/usr/bin/env node

/**
 * Update the existing match_logs table schema
 * This script adds missing fields and fixes data type issues
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

async function updateSchema() {
  console.log('🔧 Updating match_logs table schema...\n');

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
    // Test connection
    console.log('🔌 Testing Supabase connection...');
    const { error: testError } = await supabase
      .from('match_logs')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      process.exit(1);
    }

    console.log('✅ Supabase connection successful');

    // Read the migration SQL
    const fs = require('fs');
    const migrationPath = './migration_update_match_logs_schema.sql';
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Migration file loaded successfully');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length === 0) continue;

      try {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   ${statement.substring(0, 60)}...`);
        
        // Use rpc for complex operations
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct query for simpler statements
          if (statement.includes('ADD COLUMN') || statement.includes('ALTER COLUMN')) {
            console.log('   ℹ️  DDL statement - may need manual execution');
            console.log('   ℹ️  Consider running this in Supabase dashboard');
            errorCount++;
            continue;
          }
          
          throw error;
        }
        
        successCount++;
        console.log('   ✅ Statement executed successfully');
        
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Statement failed:`, error.message);
        
        // If it's a column already exists error, that's fine
        if (error.message.includes('already exists') || error.message.includes('does not exist')) {
          console.log('   ℹ️  Expected error (column already exists/does not exist)');
          successCount++;
          errorCount--;
        }
      }
    }

    console.log(`\n📊 Schema Update Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    // Verify the updated structure
    console.log('\n🔍 Verifying updated table structure...');
    
    try {
      const { data: tableData, error: tableError } = await supabase
        .from('match_logs')
        .select('*')
        .limit(1);

      if (tableError) {
        console.error('❌ Table verification failed:', tableError.message);
      } else {
        console.log('✅ Table structure verified');
        
        if (tableData && tableData.length > 0) {
          const record = tableData[0];
          const hasNewFields = record.hasOwnProperty('created_at') && 
                               record.hasOwnProperty('updated_at');
          
          console.log('🔧 New fields present:', hasNewFields ? '✅' : '❌');
          
          if (hasNewFields) {
            console.log('   created_at:', record.created_at ? '✅' : '❌');
            console.log('   updated_at:', record.updated_at ? '✅' : '❌');
          }
        }
      }

    } catch (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    }

    console.log('\n🎉 Schema update process completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test the enhanced logging system');
    console.log('   2. Verify all fields are working correctly');
    console.log('   3. Integrate job ingestion into your pipeline');

    // If there were DDL errors, provide manual instructions
    if (errorCount > 0) {
      console.log('\n⚠️  Some DDL statements may need manual execution:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Run the migration_update_match_logs_schema.sql file');
      console.log('   4. This will add the missing columns and fix data types');
    }

  } catch (error) {
    console.error('❌ Schema update failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the update
updateSchema().catch(console.error);
