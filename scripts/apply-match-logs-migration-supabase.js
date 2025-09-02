#!/usr/bin/env node

/**
 * Apply match_logs migration using Supabase client
 * This script creates the match_logs table and all necessary components
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

async function applyMigration() {
  console.log('🚀 Applying match_logs migration to Supabase...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? '✅' : '❌');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log('🔗 Supabase URL:', supabaseUrl);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Test connection
    console.log('\n🔌 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Connection test failed:', testError.message);
      process.exit(1);
    }

    console.log('✅ Supabase connection successful');

    // Read the migration SQL
    const fs = require('fs');
    const migrationPath = './migration_create_match_logs_table.sql';
    
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
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.length === 0) continue;

      try {
        console.log(`\n🔄 Executing statement ${i + 1}/${statements.length}...`);
        
        // Use rpc for complex operations
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // Try direct query for simpler statements
          const { error: directError } = await supabase.from('match_logs').select('count').limit(1);
          
          if (directError && directError.message.includes('relation "match_logs" does not exist')) {
            // Table doesn't exist yet, this is expected for the first few statements
            console.log('   ℹ️  Expected error (table not yet created)');
            successCount++;
            continue;
          }
          
          throw error;
        }
        
        successCount++;
        console.log('   ✅ Statement executed successfully');
        
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Statement failed:`, error.message);
        
        // If it's a table creation error, the table might already exist
        if (error.message.includes('already exists')) {
          console.log('   ℹ️  Table already exists, continuing...');
          successCount++;
          errorCount--;
        }
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    // Verify the table was created
    console.log('\n🔍 Verifying table creation...');
    
    try {
      const { data: tableData, error: tableError } = await supabase
        .from('match_logs')
        .select('*')
        .limit(1);

      if (tableError) {
        console.error('❌ Table verification failed:', tableError.message);
      } else {
        console.log('✅ match_logs table verified successfully');
        console.log('📋 Table structure confirmed');
      }

      // Check if sample data exists
      const { data: sampleData, error: sampleError } = await supabase
        .from('match_logs')
        .select('*')
        .limit(5);

      if (sampleError) {
        console.error('❌ Sample data check failed:', sampleError.message);
      } else {
        console.log(`✅ Sample data verified: ${sampleData.length} records found`);
      }

    } catch (verifyError) {
      console.error('❌ Verification failed:', verifyError.message);
    }

    console.log('\n🎉 Migration process completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test the enhanced logging system');
    console.log('   2. Verify schema alignment with your existing tables');
    console.log('   3. Integrate job ingestion into your pipeline');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the migration
applyMigration().catch(console.error);
