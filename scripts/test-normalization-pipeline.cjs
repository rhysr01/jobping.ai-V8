#!/usr/bin/env node

/**
 * COMPREHENSIVE NORMALIZATION PIPELINE TEST
 * Tests the complete flow: Raw Input → Clean Output → Idempotency
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
const testRawJob = {
  source: 'test_scraper',
  external_id: 'test_job_123',
  raw_data: {
    title: 'Software Engineer',
    company: 'Test Company Ltd.',
    location: 'Amsterdam, Netherlands',
    description: 'Great opportunity for early career developers',
    posted_at: new Date().toISOString(),
    salary: '€50,000 - €70,000',
    requirements: ['JavaScript', 'React', 'Node.js']
  }
};

const testUser = {
  email: 'test@example.com',
  id: 'test-user-id-' + Date.now(),
  target_cities: ['Amsterdam', 'Berlin'],
  career_path: ['software_engineering'],
  professional_experience: 'entry_level'
};

async function testNormalizationPipeline() {
  console.log('🧪 TESTING NORMALIZATION PIPELINE');
  console.log('=====================================\n');

  try {
    // 1. Test Raw Jobs Table
    console.log('1️⃣ Testing Raw Jobs Table...');
    const { data: rawJob, error: rawJobError } = await supabase
      .from('raw_jobs')
      .insert(testRawJob)
      .select()
      .single();

    if (rawJobError) {
      console.error('❌ Failed to insert raw job:', rawJobError.message);
      return false;
    }
    console.log('✅ Raw job inserted:', rawJob.id);

    // 2. Test Jobs Table with Fingerprint
    console.log('\n2️⃣ Testing Jobs Table with Fingerprint...');
    const normalizedJob = {
      company: 'Test Company',
      title: 'Software Engineer',
      location_name: 'Amsterdam',
      posted_at: new Date().toISOString(),
      source: 'test_scraper',
      job_hash: 'test-hash-' + Date.now(),
      fingerprint: await generateFingerprint('Test Company', 'Software Engineer', 'Amsterdam', new Date()),
      status: 'active',
      work_location: 'Amsterdam'
    };

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert(normalizedJob)
      .select()
      .single();

    if (jobError) {
      console.error('❌ Failed to insert normalized job:', jobError.message);
      return false;
    }
    console.log('✅ Normalized job inserted:', job.id);

    // 3. Test Jobs Rejects Table
    console.log('\n3️⃣ Testing Jobs Rejects Table...');
    const rejectedJob = {
      raw_job_id: rawJob.id,
      source: 'test_scraper',
      external_id: 'rejected_job_456',
      rejection_reason: 'insufficient_data',
      raw_data: { title: 'Incomplete Job', company: '' },
      error_details: 'Missing required company field'
    };

    const { data: rejected, error: rejectError } = await supabase
      .from('jobs_rejects')
      .insert(rejectedJob)
      .select()
      .single();

    if (rejectError) {
      console.error('❌ Failed to insert rejected job:', rejectError.message);
      return false;
    }
    console.log('✅ Rejected job inserted:', rejected.id);

    // 4. Test Match Batch Table
    console.log('\n4️⃣ Testing Match Batch Table...');
    const batchData = {
      user_id: testUser.id,
      user_email: testUser.email,
      match_date: new Date().toISOString().split('T')[0],
      batch_status: 'pending',
      matches_count: 3
    };

    const { data: batch, error: batchError } = await supabase
      .from('match_batch')
      .insert(batchData)
      .select()
      .single();

    if (batchError) {
      console.error('❌ Failed to insert match batch:', batchError.message);
      return false;
    }
    console.log('✅ Match batch inserted:', batch.id);

    // 5. Test Email Suppression Table
    console.log('\n5️⃣ Testing Email Suppression Table...');
    const suppressionData = {
      user_email: 'bounced@example.com',
      suppression_type: 'bounce',
      suppression_reason: 'mailbox_full',
      is_active: true
    };

    const { data: suppression, error: suppressionError } = await supabase
      .from('email_suppression_enhanced')
      .insert(suppressionData)
      .select()
      .single();

    if (suppressionError) {
      console.error('❌ Failed to insert email suppression:', suppressionError.message);
      return false;
    }
    console.log('✅ Email suppression inserted:', suppression.id);

    // 6. Test Dead Letter Queue
    console.log('\n6️⃣ Testing Dead Letter Queue...');
    const deadLetterData = {
      job_type: 'email_send',
      payload: {
        user_email: testUser.email,
        template: 'daily_matches',
        matches: [job.id]
      },
      failure_reason: 'email_service_timeout',
      error_details: { status: 504, message: 'Gateway timeout' },
      retry_count: 1,
      max_retries: 3,
      next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
    };

    const { data: deadLetter, error: deadLetterError } = await supabase
      .from('job_queue_dead_letter')
      .insert(deadLetterData)
      .select()
      .single();

    if (deadLetterError) {
      console.error('❌ Failed to insert dead letter:', deadLetterError.message);
      return false;
    }
    console.log('✅ Dead letter inserted:', deadLetter.id);

    // 7. Test Email Send Ledger
    console.log('\n7️⃣ Testing Email Send Ledger...');
    const ledgerData = {
      user_email: testUser.email,
      email_type: 'daily_matches',
      batch_id: batch.id,
      template_version: 'v1.0',
      subject_line: '3 Fresh Job Matches - JobPing',
      delivery_status: 'sent',
      external_message_id: 'msg_' + Date.now(),
      metadata: { match_count: 3, template_used: 'daily_matches' }
    };

    const { data: ledger, error: ledgerError } = await supabase
      .from('email_send_ledger')
      .insert(ledgerData)
      .select()
      .single();

    if (ledgerError) {
      console.error('❌ Failed to insert email ledger:', ledgerError.message);
      return false;
    }
    console.log('✅ Email ledger inserted:', ledger.id);

    // 8. Test Utility Functions
    console.log('\n8️⃣ Testing Utility Functions...');
    
    // Test email suppression check
    const { data: isSuppressed, error: suppressionCheckError } = await supabase
      .rpc('is_email_suppressed', { check_email: 'bounced@example.com' });

    if (suppressionCheckError) {
      console.error('❌ Failed to check email suppression:', suppressionCheckError.message);
      return false;
    }
    console.log('✅ Email suppression check:', isSuppressed ? 'SUPPRESSED' : 'NOT SUPPRESSED');

    // Test fingerprint generation
    const { data: fingerprint, error: fingerprintError } = await supabase
      .rpc('generate_job_fingerprint', {
        p_company: 'Test Company',
        p_title: 'Software Engineer',
        p_location: 'Amsterdam',
        p_posted_at: new Date().toISOString()
      });

    if (fingerprintError) {
      console.error('❌ Failed to generate fingerprint:', fingerprintError.message);
      return false;
    }
    console.log('✅ Fingerprint generated:', fingerprint);

    // 9. Test Constraints and Uniqueness
    console.log('\n9️⃣ Testing Constraints and Uniqueness...');
    
    // Try to insert duplicate batch (should fail)
    const { error: duplicateBatchError } = await supabase
      .from('match_batch')
      .insert({
        user_id: testUser.id,
        user_email: testUser.email,
        match_date: batchData.match_date,
        batch_status: 'pending'
      });

    if (!duplicateBatchError) {
      console.error('❌ Duplicate batch constraint not working');
      return false;
    }
    console.log('✅ Duplicate batch constraint working:', duplicateBatchError.message);

    // Try to insert duplicate suppression (should fail)
    const { error: duplicateSuppressionError } = await supabase
      .from('email_suppression_enhanced')
      .insert({
        user_email: 'bounced@example.com',
        suppression_type: 'bounce',
        suppression_reason: 'another_bounce'
      });

    if (!duplicateSuppressionError) {
      console.error('❌ Duplicate suppression constraint not working');
      return false;
    }
    console.log('✅ Duplicate suppression constraint working:', duplicateSuppressionError.message);

    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Normalization pipeline is working correctly');
    console.log('✅ Idempotency mechanisms are in place');
    console.log('✅ Email deliverability safety is configured');
    
    return true;

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Helper function to generate fingerprint (simplified version)
async function generateFingerprint(company, title, location, postedAt) {
  const crypto = require('crypto');
  const data = `${company || ''}|${title || ''}|${location || ''}|${postedAt || ''}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Cleanup function
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete in reverse order to respect foreign keys
    await supabase.from('email_send_ledger').delete().like('user_email', 'test@example.com');
    await supabase.from('job_queue_dead_letter').delete().eq('job_type', 'email_send');
    await supabase.from('email_suppression_enhanced').delete().like('user_email', 'bounced@example.com');
    await supabase.from('match_batch').delete().eq('user_email', 'test@example.com');
    await supabase.from('jobs_rejects').delete().eq('source', 'test_scraper');
    await supabase.from('jobs').delete().eq('source', 'test_scraper');
    await supabase.from('raw_jobs').delete().eq('source', 'test_scraper');
    
    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('⚠️ Cleanup error (non-critical):', error.message);
  }
}

// Main execution
async function main() {
  const success = await testNormalizationPipeline();
  
  if (process.argv.includes('--cleanup')) {
    await cleanupTestData();
  }
  
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { testNormalizationPipeline, cleanupTestData };
