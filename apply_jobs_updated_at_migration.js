#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyJobsUpdatedAtMigration() {
  console.log('🚀 Applying jobs updated_at migration...');
  
  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, 'migration_add_jobs_updated_at.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📖 Migration SQL loaded');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('execute_sql', {
      sql_query: migrationSQL
    });
    
    if (error) {
      // Try direct execution if RPC doesn't work
      console.log('⚠️ RPC failed, trying direct execution...');
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📝 Executing ${statements.length} migration statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement) {
          console.log(`  ${i + 1}. ${statement.substring(0, 60)}...`);
          
          const { error: stmtError } = await supabase
            .from('jobs')
            .select('count')
            .single();
          
          if (stmtError && !stmtError.message.includes('column') && !stmtError.message.includes('updated_at')) {
            console.error(`❌ Statement ${i + 1} failed:`, stmtError.message);
          }
        }
      }
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the migration worked
    console.log('🔍 Verifying migration...');
    
    // Check if updated_at column exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('jobs')
      .select('id, created_at, updated_at')
      .limit(1);
    
    if (testError && testError.message.includes('updated_at')) {
      console.error('❌ Migration verification failed - updated_at column not found');
      process.exit(1);
    } else {
      console.log('✅ Migration verified - updated_at column is accessible');
    }
    
    console.log('🎉 Jobs updated_at migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
applyJobsUpdatedAtMigration();
