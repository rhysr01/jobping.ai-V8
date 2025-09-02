#!/usr/bin/env node

/**
 * Script to apply the match_logs table migration
 * Run with: node scripts/apply-match-logs-migration.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Applying Match Logs Migration...\n');

async function applyMigration() {
  try {
    // Check if migration file exists
    const migrationPath = path.join(__dirname, '..', 'migration_create_match_logs_table.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }
    
    console.log('✅ Migration file found');
    
    // Read migration content
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    console.log('📊 Migration file size:', migrationContent.length, 'characters');
    
    // Check for key components
    const checks = {
      'CREATE TABLE': migrationContent.includes('CREATE TABLE'),
      'CREATE INDEX': migrationContent.includes('CREATE INDEX'),
      'CREATE POLICY': migrationContent.includes('CREATE POLICY'),
      'INSERT INTO': migrationContent.includes('INSERT INTO'),
      'RLS enabled': migrationContent.includes('ENABLE ROW LEVEL SECURITY'),
      'Triggers': migrationContent.includes('CREATE TRIGGER')
    };
    
    console.log('\n📋 Migration Components Check:');
    Object.entries(checks).forEach(([component, exists]) => {
      console.log(`   ${component}: ${exists ? '✅' : '❌'}`);
    });
    
    // Check if all required components are present
    const allComponentsPresent = Object.values(checks).every(Boolean);
    
    if (!allComponentsPresent) {
      console.error('\n❌ Migration file is missing required components');
      process.exit(1);
    }
    
    console.log('\n✅ Migration file is complete and ready');
    
    // Instructions for manual application
    console.log('\n📝 To apply this migration:');
    console.log('   1. Connect to your database:');
    console.log('      psql -d your_database_name -U your_username');
    console.log('   2. Run the migration:');
    console.log('      \\i ' + migrationPath);
    console.log('   3. Verify the table was created:');
    console.log('      \\dt match_logs');
    console.log('   4. Check the sample data:');
    console.log('      SELECT * FROM match_logs LIMIT 5;');
    
    // Alternative: Direct SQL execution
    console.log('\n🔧 Alternative: Direct SQL execution');
    console.log('   You can also copy and paste the SQL directly into your database client');
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Apply the migration to your database');
    console.log('   2. Test the enhanced logging with real data');
    console.log('   3. Monitor matching performance and fallback usage');
    console.log('   4. Use the logs to optimize the matching algorithm');
    
    console.log('\n✅ Migration preparation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error preparing migration:', error.message);
    process.exit(1);
  }
}

// Run the migration preparation
applyMigration().then(() => {
  console.log('\n🏁 Script completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Script failed:', error);
  process.exit(1);
});
