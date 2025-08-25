const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

async function applyEmailTrackingMigration() {
  console.log('🚀 Applying email tracking migration...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migration_add_email_tracking.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 Executing migration SQL...');
    
    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
    
    console.log('✅ Email tracking migration applied successfully!');
    
    // Verify the migration by checking if the new columns exist
    console.log('🔍 Verifying migration...');
    
    const { data: columns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'users')
      .in('column_name', ['email_count', 'onboarding_complete', 'email_phase'])
      .order('column_name');
    
    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      process.exit(1);
    }
    
    console.log('📊 Migration verification results:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    // Check existing user data
    const { data: userStats, error: statsError } = await supabase
      .from('users')
      .select('email_count, onboarding_complete, email_phase')
      .limit(1000);
    
    if (statsError) {
      console.error('❌ User stats check failed:', statsError);
    } else {
      const stats = {
        total: userStats.length,
        withEmailCount: userStats.filter(u => u.email_count !== null).length,
        onboardingComplete: userStats.filter(u => u.onboarding_complete === true).length,
        inWelcomePhase: userStats.filter(u => u.email_phase === 'welcome').length,
        inFollowupPhase: userStats.filter(u => u.email_phase === 'followup').length,
        inRegularPhase: userStats.filter(u => u.email_phase === 'regular').length
      };
      
      console.log('📈 User data statistics:');
      console.log(`  - Total users: ${stats.total}`);
      console.log(`  - Users with email count: ${stats.withEmailCount}`);
      console.log(`  - Onboarding complete: ${stats.onboardingComplete}`);
      console.log(`  - Welcome phase: ${stats.inWelcomePhase}`);
      console.log(`  - Followup phase: ${stats.inFollowupPhase}`);
      console.log(`  - Regular phase: ${stats.inRegularPhase}`);
    }
    
    console.log('🎉 Email tracking migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyEmailTrackingMigration();
