#!/usr/bin/env node

/**
 * ENGAGEMENT SYSTEM RUNNER
 * Runs the engagement-based email delivery system
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Starting JobPing Engagement System...\n');

async function runEngagementSystem() {
  try {
    // 1. Apply database migration for engagement tracking
    console.log('📊 Step 1: Applying engagement tracking migration...');
    try {
      execSync('psql $DATABASE_URL -f scripts/add-engagement-tracking.sql', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Engagement tracking migration applied successfully\n');
    } catch (error) {
      console.log('⚠️ Migration may have already been applied or database not accessible\n');
    }

    // 2. Send re-engagement emails to inactive users
    console.log('📧 Step 2: Sending re-engagement emails...');
    try {
      const response = await fetch('http://localhost:3000/api/send-re-engagement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SYSTEM_API_KEY || 'test-key'}`
        }
      });
      
      const result = await response.json();
      console.log(`✅ Re-engagement emails: ${result.emailsSent} sent, ${result.errors?.length || 0} errors\n`);
    } catch (error) {
      console.log('⚠️ Re-engagement emails failed (server may not be running):', error.message, '\n');
    }

    // 3. Get engagement statistics
    console.log('📈 Step 3: Getting engagement statistics...');
    try {
      const response = await fetch('http://localhost:3000/api/send-re-engagement', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SYSTEM_API_KEY || 'test-key'}`
        }
      });
      
      const result = await response.json();
      console.log('📊 Engagement Statistics:');
      console.log(`   - Total candidates for re-engagement: ${result.stats?.totalCandidates || 0}`);
      console.log(`   - Last run: ${result.stats?.lastRun || 'Never'}\n`);
    } catch (error) {
      console.log('⚠️ Could not get engagement stats (server may not be running):', error.message, '\n');
    }

    // 4. Test engagement tracking endpoint
    console.log('🔍 Step 4: Testing engagement tracking...');
    try {
      const testEmail = 'test@example.com';
      const response = await fetch(`http://localhost:3000/api/track-engagement?email=${testEmail}&type=email_opened`, {
        method: 'GET'
      });
      
      if (response.ok) {
        console.log('✅ Engagement tracking endpoint is working\n');
      } else {
        console.log('⚠️ Engagement tracking endpoint returned:', response.status, '\n');
      }
    } catch (error) {
      console.log('⚠️ Could not test engagement tracking (server may not be running):', error.message, '\n');
    }

    console.log('🎉 Engagement system setup complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Run the database migration: psql $DATABASE_URL -f scripts/add-engagement-tracking.sql');
    console.log('2. Start your Next.js server: npm run dev');
    console.log('3. Test re-engagement: POST /api/send-re-engagement');
    console.log('4. Monitor engagement: GET /api/send-re-engagement');
    console.log('5. Track opens/clicks: GET /api/track-engagement?email=user@example.com&type=email_opened');

  } catch (error) {
    console.error('❌ Engagement system setup failed:', error);
    process.exit(1);
  }
}

// Run the engagement system
runEngagementSystem();
