#!/usr/bin/env node

/**
 * E2E Matching Test Script
 * 
 * Tests the complete matching flow:
 * - Seeds 3 users (Tech, Marketing, Finance)
 * - Runs matching for each user
 * - Verifies { success: true } response
 * - Checks for rationale and confidence
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const API_KEY = process.env.SCRAPE_API_KEY || 'test-api-key';

const TEST_USERS = [
  {
    email: 'tech-test@jobping.ai',
    full_name: 'Tech Test User',
    target_cities: 'london|berlin|amsterdam',
    languages_spoken: 'English',
    company_types: 'startup,tech',
    roles_selected: 'software engineer,data scientist',
    professional_expertise: 'entry',
    career_path: 'tech',
    subscription_tier: 'free'
  },
  {
    email: 'marketing-test@jobping.ai',
    full_name: 'Marketing Test User',
    target_cities: 'paris|madrid|barcelona',
    languages_spoken: 'English,Spanish',
    company_types: 'startup,agency',
    roles_selected: 'marketing specialist,content creator',
    professional_expertise: 'entry',
    career_path: 'marketing',
    subscription_tier: 'free'
  },
  {
    email: 'finance-test@jobping.ai',
    full_name: 'Finance Test User',
    target_cities: 'frankfurt|zurich|dublin',
    languages_spoken: 'English,German',
    company_types: 'startup,enterprise',
    roles_selected: 'financial analyst,accountant',
    professional_expertise: 'entry',
    career_path: 'finance',
    subscription_tier: 'free'
  }
];

async function seedUser(userData) {
  console.log(`   📝 Seeding user: ${userData.email}`);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/webhook-tally`, {
      email: userData.email,
      full_name: userData.full_name,
      target_cities: userData.target_cities,
      languages_spoken: userData.languages_spoken,
      company_types: userData.company_types,
      roles_selected: userData.roles_selected,
      professional_expertise: userData.professional_expertise,
      career_path: userData.career_path,
      subscription_tier: userData.subscription_tier
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    });

    if (response.status === 200) {
      console.log(`   ✅ User seeded successfully`);
      return true;
    } else {
      console.log(`   ❌ Failed to seed user: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error seeding user: ${error.message}`);
    return false;
  }
}

async function testMatching(userData) {
  console.log(`   🎯 Testing matching for: ${userData.email}`);
  
  try {
    const response = await axios.post(`${API_BASE_URL}/match-users`, {
      limit: 5
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    });

    const data = response.data;
    
    // Check response structure
    const checks = {
      successTrue: data.success === true,
      hasMessage: !!data.message,
      hasResults: Array.isArray(data.results),
      resultsNotEmpty: data.results && data.results.length > 0
    };

    // Check individual user results
    let userResult = null;
    if (data.results) {
      userResult = data.results.find(r => r.user_email === userData.email);
    }

    if (userResult) {
      checks.hasUserResult = true;
      checks.hasMatches = userResult.matches_count >= 3;
      checks.hasRationale = userResult.matches && userResult.matches.some(m => m.match_reason);
      checks.hasConfidence = userResult.matches && userResult.matches.some(m => m.match_score);
    } else {
      checks.hasUserResult = false;
      checks.hasMatches = false;
      checks.hasRationale = false;
      checks.hasConfidence = false;
    }

    // Print results
    console.log(`   📊 Response:`);
    console.log(`      Success: ${data.success}`);
    console.log(`      Message: ${data.message}`);
    console.log(`      Results Count: ${data.results?.length || 0}`);
    
    if (userResult) {
      console.log(`      User Matches: ${userResult.matches_count}`);
      console.log(`      Has Rationale: ${checks.hasRationale ? '✅' : '❌'}`);
      console.log(`      Has Confidence: ${checks.hasConfidence ? '✅' : '❌'}`);
    }
    
    console.log(`   ✅ Checks:`);
    console.log(`      Success = true: ${checks.successTrue ? '✅' : '❌'}`);
    console.log(`      Has Message: ${checks.hasMessage ? '✅' : '❌'}`);
    console.log(`      Has Results: ${checks.hasResults ? '✅' : '❌'}`);
    console.log(`      Results Not Empty: ${checks.resultsNotEmpty ? '✅' : '❌'}`);
    console.log(`      Has User Result: ${checks.hasUserResult ? '✅' : '❌'}`);
    console.log(`      ≥ 3 Matches: ${checks.hasMatches ? '✅' : '❌'}`);
    console.log(`      Has Rationale: ${checks.hasRationale ? '✅' : '❌'}`);
    console.log(`      Has Confidence: ${checks.hasConfidence ? '✅' : '❌'}`);

    const allPassed = Object.values(checks).every(check => check);
    console.log(`   🎯 Overall: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    return {
      user: userData.email,
      passed: allPassed,
      checks,
      userResult
    };

  } catch (error) {
    console.error(`   ❌ Error testing matching: ${error.message}`);
    return {
      user: userData.email,
      passed: false,
      error: error.message
    };
  }
}

async function runE2ETests() {
  console.log('🚀 Starting E2E Matching Tests...');
  console.log(`   API Base URL: ${API_BASE_URL}`);
  console.log(`   Test Users: ${TEST_USERS.length}`);
  
  const results = [];
  
  // Seed users first
  console.log('\n📝 Seeding test users...');
  for (const userData of TEST_USERS) {
    await seedUser(userData);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Wait for users to be processed
  console.log('\n⏳ Waiting for user processing...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test matching for each user
  console.log('\n🎯 Testing matching for each user...');
  for (const userData of TEST_USERS) {
    const result = await testMatching(userData);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n📋 E2E MATCHING TEST SUMMARY');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total Users: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Users:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.user}: ${r.error || 'Requirements not met'}`);
    });
  }
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  runE2ETests().catch(error => {
    console.error('❌ E2E test failed:', error);
    process.exit(1);
  });
}

module.exports = { testMatching, runE2ETests };
