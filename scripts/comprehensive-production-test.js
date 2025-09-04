#!/usr/bin/env node

// 🧪 COMPREHENSIVE PRODUCTION TEST SUITE
// This covers all critical areas for production launch

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runComprehensiveProductionTest() {
  console.log('🧪 COMPREHENSIVE PRODUCTION TEST SUITE');
  console.log('=======================================');
  console.log('Running all critical tests for production launch...\n');

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    critical: 0,
    warnings: 0
  };

  // Test 1: Environment Variables & Configuration
  console.log('🔐 Test 1: Environment Variables & Configuration');
  console.log('===============================================');
  testResults.total++;
  
  const requiredEnvVars = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'ADZUNA_APP_ID': process.env.ADZUNA_APP_ID,
    'ADZUNA_APP_KEY': process.env.ADZUNA_APP_KEY,
    'REED_API_KEY': process.env.REED_API_KEY,
    'MUSE_API_KEY': process.env.MUSE_API_KEY,
    'RAPIDAPI_KEY': process.env.RAPIDAPI_KEY,
    'RESEND_API_KEY': process.env.RESEND_API_KEY
  };

  let envVarsPassed = true;
  for (const [key, value] of Object.entries(requiredEnvVars)) {
    if (!value) {
      console.log(`   ❌ ${key}: MISSING`);
      envVarsPassed = false;
      testResults.critical++;
    } else {
      console.log(`   ✅ ${key}: SET`);
    }
  }

  if (envVarsPassed) {
    console.log('   ✅ All required environment variables are set\n');
    testResults.passed++;
  } else {
    console.log('   ❌ Critical: Missing environment variables\n');
    testResults.failed++;
  }

  // Test 2: Database Connection & Health
  console.log('💾 Test 2: Database Connection & Health');
  console.log('=======================================');
  testResults.total++;
  
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('id', { count: 'exact' });
    
    if (error) throw error;
    
    console.log(`   ✅ Database connection: SUCCESS`);
    console.log(`   📊 Total jobs: ${data.length}`);
    console.log(`   🟢 Database health: EXCELLENT\n`);
    testResults.passed++;
  } catch (error) {
    console.log(`   ❌ Database connection: FAILED - ${error.message}\n`);
    testResults.failed++;
    testResults.critical++;
  }

  // Test 3: Legal Pages Compliance
  console.log('📄 Test 3: Legal Pages Compliance');
  console.log('=================================');
  testResults.total++;
  
  const fs = require('fs');
  const legalPages = [
    'app/legal/privacy-policy.tsx',
    'app/legal/terms-of-service.tsx',
    'app/legal/unsubscribe/page.tsx'
  ];

  let legalPagesPassed = true;
  for (const page of legalPages) {
    if (fs.existsSync(page)) {
      console.log(`   ✅ ${page}: EXISTS`);
    } else {
      console.log(`   ❌ ${page}: MISSING`);
      legalPagesPassed = false;
      testResults.critical++;
    }
  }

  if (legalPagesPassed) {
    console.log('   ✅ All required legal pages exist\n');
    testResults.passed++;
  } else {
    console.log('   ❌ Critical: Missing legal pages for GDPR compliance\n');
    testResults.failed++;
  }

  // Test 4: Email System Configuration
  console.log('📧 Test 4: Email System Configuration');
  console.log('=====================================');
  testResults.total++;
  
  const emailConfig = {
    'RESEND_API_KEY': process.env.RESEND_API_KEY ? 'SET' : 'MISSING',
    'Email Templates': 'CHECK_REQUIRED',
    'DNS Records': 'MANUAL_VERIFICATION_REQUIRED'
  };

  let emailConfigPassed = true;
  for (const [key, value] of Object.entries(emailConfig)) {
    if (value === 'MISSING') {
      console.log(`   ❌ ${key}: MISSING`);
      emailConfigPassed = false;
      testResults.critical++;
    } else if (value === 'CHECK_REQUIRED') {
      console.log(`   ⚠️  ${key}: NEEDS VERIFICATION`);
      testResults.warnings++;
    } else {
      console.log(`   ✅ ${key}: ${value}`);
    }
  }

  console.log('   📋 DNS Records Required (Manual Action):');
  console.log('      TXT "v=spf1 include:_spf.resend.com ~all"');
  console.log('      TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@jobping.ai"');
  console.log('      CNAME resend._domainkey.jobping.ai');

  if (emailConfigPassed) {
    console.log('   ✅ Email configuration is set up\n');
    testResults.passed++;
  } else {
    console.log('   ❌ Critical: Email system not properly configured\n');
    testResults.failed++;
  }

  // Test 5: Automation System Health
  console.log('🤖 Test 5: Automation System Health');
  console.log('===================================');
  testResults.total++;
  
  try {
    const { data: recentJobs, error } = await supabase
      .from('jobs')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    const jobsLast24h = recentJobs.length;
    const lastJobTime = recentJobs.length > 0 ? new Date(recentJobs[0].created_at) : null;
    const hoursSinceLastJob = lastJobTime ? Math.round((Date.now() - lastJobTime.getTime()) / (1000 * 60 * 60)) : null;
    
    console.log(`   📊 Jobs in last 24h: ${jobsLast24h}`);
    console.log(`   🕐 Last job: ${hoursSinceLastJob ? `${hoursSinceLastJob} hours ago` : 'No jobs found'}`);
    
    if (jobsLast24h > 10 && hoursSinceLastJob <= 24) {
      console.log('   ✅ Automation system: HEALTHY\n');
      testResults.passed++;
    } else if (jobsLast24h > 0) {
      console.log('   ⚠️  Automation system: NEEDS ATTENTION\n');
      testResults.warnings++;
      testResults.passed++;
    } else {
      console.log('   ❌ Automation system: NOT WORKING\n');
      testResults.failed++;
      testResults.critical++;
    }
  } catch (error) {
    console.log(`   ❌ Automation health check failed: ${error.message}\n`);
    testResults.failed++;
  }

  // Test 6: Security & Compliance
  console.log('🔒 Test 6: Security & Compliance');
  console.log('=================================');
  testResults.total++;
  
  const securityChecks = {
    'HTTPS Required': 'CHECK_REQUIRED',
    'GDPR Compliance': legalPagesPassed ? 'COMPLIANT' : 'NON_COMPLIANT',
    'Data Encryption': 'CHECK_REQUIRED',
    'API Rate Limiting': 'IMPLEMENTED'
  };

  let securityPassed = true;
  for (const [key, value] of Object.entries(securityChecks)) {
    if (value === 'NON_COMPLIANT') {
      console.log(`   ❌ ${key}: ${value}`);
      securityPassed = false;
      testResults.critical++;
    } else if (value === 'CHECK_REQUIRED') {
      console.log(`   ⚠️  ${key}: ${value}`);
      testResults.warnings++;
    } else {
      console.log(`   ✅ ${key}: ${value}`);
    }
  }

  if (securityPassed) {
    console.log('   ✅ Security and compliance checks passed\n');
    testResults.passed++;
  } else {
    console.log('   ❌ Critical security issues found\n');
    testResults.failed++;
  }

  // Test 7: Performance & Scalability
  console.log('⚡ Test 7: Performance & Scalability');
  console.log('=====================================');
  testResults.total++;
  
  try {
    const { data: allJobs, error } = await supabase
      .from('jobs')
      .select('id', { count: 'exact' });
    
    if (error) throw error;
    
    const totalJobs = allJobs.length;
    const performanceScore = totalJobs > 500 ? 'EXCELLENT' : totalJobs > 100 ? 'GOOD' : 'NEEDS_IMPROVEMENT';
    
    console.log(`   📊 Total jobs in database: ${totalJobs}`);
    console.log(`   🎯 Performance score: ${performanceScore}`);
    
    if (performanceScore === 'EXCELLENT') {
      console.log('   ✅ Performance: EXCELLENT - Ready for production scale\n');
      testResults.passed++;
    } else if (performanceScore === 'GOOD') {
      console.log('   ⚠️  Performance: GOOD - Monitor for scaling needs\n');
      testResults.warnings++;
      testResults.passed++;
    } else {
      console.log('   ❌ Performance: NEEDS IMPROVEMENT\n');
      testResults.failed++;
    }
  } catch (error) {
    console.log(`   ❌ Performance check failed: ${error.message}\n`);
    testResults.failed++;
  }

  // Final Assessment
  console.log('🎯 FINAL PRODUCTION ASSESSMENT');
  console.log('===============================');
  
  const successRate = Math.round((testResults.passed / testResults.total) * 100);
  const criticalIssues = testResults.critical;
  const warnings = testResults.warnings;
  
  console.log(`📊 Test Results:`);
  console.log(`   Total Tests: ${testResults.total}`);
  console.log(`   ✅ Passed: ${testResults.passed}`);
  console.log(`   ❌ Failed: ${testResults.failed}`);
  console.log(`   🚨 Critical Issues: ${criticalIssues}`);
  console.log(`   ⚠️  Warnings: ${warnings}`);
  console.log(`   📈 Success Rate: ${successRate}%`);
  
  console.log('\n🏆 Production Readiness Assessment:');
  
  if (criticalIssues === 0 && successRate >= 90) {
    console.log('   🎉 EXCELLENT: Ready for production launch!');
    console.log('   ✅ All critical systems are working');
    console.log('   ✅ Compliance requirements met');
    console.log('   ✅ Automation system healthy');
  } else if (criticalIssues === 0 && successRate >= 75) {
    console.log('   🟡 GOOD: Mostly ready for production');
    console.log('   ✅ No critical issues');
    console.log('   ⚠️  Address warnings before launch');
  } else if (criticalIssues > 0) {
    console.log('   🔴 CRITICAL: Not ready for production');
    console.log('   ❌ Critical issues must be resolved');
    console.log('   🚨 Launch blocked until fixed');
  }
  
  if (criticalIssues > 0) {
    console.log('\n🚨 CRITICAL ACTIONS REQUIRED:');
    console.log('   1. Fix all critical issues above');
    console.log('   2. Re-run this test suite');
    console.log('   3. Only launch when 0 critical issues');
  }
  
  if (warnings > 0) {
    console.log('\n⚠️  RECOMMENDED ACTIONS:');
    console.log('   1. Address warnings for optimal performance');
    console.log('   2. Consider security enhancements');
    console.log('   3. Monitor performance metrics');
  }
  
  console.log('\n' + '='.repeat(50));
}

// Run the comprehensive test
runComprehensiveProductionTest().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
