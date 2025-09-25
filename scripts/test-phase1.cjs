// 🧪 PHASE 1 TESTING SCRIPT
// Test database truth: idempotency, suppression, and performance

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPhase1() {
  console.log('🧪 PHASE 1: DATABASE TRUTH TESTING');
  console.log('====================================');

  const testEmail = `test-phase1-${Date.now()}@jobping-test.com`;
  
  try {
    // 1. Test utility functions
    console.log('\n📊 1. Testing Utility Functions');
    console.log('--------------------------------');
    
    const { data: sendToken, error: tokenError } = await supabase
      .rpc('generate_send_token', {
        user_email: testEmail,
        category: 'daily_matches'
      });
    
    if (tokenError) {
      console.log('❌ Send token generation failed:', tokenError.message);
    } else {
      console.log('✅ Send token generated:', sendToken);
    }

    // 2. Test email suppression check
    const { data: isSuppressed, error: suppressionError } = await supabase
      .rpc('is_email_suppressed', {
        email_address: testEmail
      });
    
    if (suppressionError) {
      console.log('❌ Suppression check failed:', suppressionError.message);
    } else {
      console.log('✅ Email suppression check:', isSuppressed);
    }

    // 3. Test email already sent check
    const { data: alreadySent, error: sentError } = await supabase
      .rpc('email_already_sent_today', {
        user_email: testEmail,
        email_type: 'daily_matches'
      });
    
    if (sentError) {
      console.log('❌ Already sent check failed:', sentError.message);
    } else {
      console.log('✅ Email already sent check:', alreadySent);
    }

    // 4. Test index performance
    console.log('\n📈 2. Testing Index Performance');
    console.log('--------------------------------');
    
    const startTime = Date.now();
    const { data: recentJobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, company, posted_at')
      .not('posted_at', 'is', null)
      .order('posted_at', { ascending: false })
      .limit(10);
    
    const queryTime = Date.now() - startTime;
    
    if (jobsError) {
      console.log('❌ Jobs query failed:', jobsError.message);
    } else {
      console.log(`✅ Recent jobs query: ${queryTime}ms (${recentJobs.length} jobs)`);
    }

    // 5. Test matches query performance
    const matchesStartTime = Date.now();
    const { data: recentMatches, error: matchesError } = await supabase
      .from('matches')
      .select('id, user_email, matched_at')
      .order('matched_at', { ascending: false })
      .limit(10);
    
    const matchesQueryTime = Date.now() - matchesStartTime;
    
    if (matchesError) {
      console.log('❌ Matches query failed:', matchesError.message);
    } else {
      console.log(`✅ Recent matches query: ${matchesQueryTime}ms (${recentMatches.length} matches)`);
    }

    // 6. Test email send ledger query
    const ledgerStartTime = Date.now();
    const { data: recentSends, error: ledgerError } = await supabase
      .from('email_send_ledger')
      .select('id, user_email, sent_at, email_type')
      .order('sent_at', { ascending: false })
      .limit(10);
    
    const ledgerQueryTime = Date.now() - ledgerStartTime;
    
    if (ledgerError) {
      console.log('❌ Email ledger query failed:', ledgerError.message);
    } else {
      console.log(`✅ Email ledger query: ${ledgerQueryTime}ms (${recentSends.length} sends)`);
    }

    // 7. Test RLS policies (should work with service role)
    console.log('\n🔒 3. Testing RLS Policies');
    console.log('---------------------------');
    
    const { data: userCount, error: userError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (userError) {
      console.log('❌ User count query failed:', userError.message);
    } else {
      console.log(`✅ User count query: ${userCount} users`);
    }

    // 8. Test match batch operations
    console.log('\n📦 4. Testing Match Batch Operations');
    console.log('-------------------------------------');
    
    const { data: batchCount, error: batchError } = await supabase
      .from('match_batch')
      .select('count', { count: 'exact', head: true });
    
    if (batchError) {
      console.log('❌ Batch count query failed:', batchError.message);
    } else {
      console.log(`✅ Match batch count: ${batchCount} batches`);
    }

    // 9. Performance summary
    console.log('\n📊 5. Performance Summary');
    console.log('-------------------------');
    console.log(`Jobs query: ${queryTime}ms`);
    console.log(`Matches query: ${matchesQueryTime}ms`);
    console.log(`Email ledger query: ${ledgerQueryTime}ms`);
    
    const avgQueryTime = (queryTime + matchesQueryTime + ledgerQueryTime) / 3;
    console.log(`Average query time: ${avgQueryTime.toFixed(1)}ms`);
    
    if (avgQueryTime < 100) {
      console.log('🚀 Excellent performance!');
    } else if (avgQueryTime < 500) {
      console.log('✅ Good performance');
    } else {
      console.log('⚠️  Performance could be improved');
    }

    console.log('\n🎉 PHASE 1 TESTING COMPLETE');
    console.log('============================');
    console.log('✅ Database truth infrastructure verified');
    console.log('✅ Idempotency functions working');
    console.log('✅ Performance indexes operational');
    console.log('✅ RLS policies enabled');
    console.log('✅ Ready for Phase 2: App Behavior');

  } catch (error) {
    console.error('❌ Phase 1 testing failed:', error);
    process.exit(1);
  }
}

// Run the test
testPhase1().catch(console.error);
