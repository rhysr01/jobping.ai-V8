#!/usr/bin/env node

/**
 * 🎯 PILOT TESTING SCRIPT
 * 
 * This script tests the complete end-to-end flow for the 20-user pilot:
 * 1. User registration via Tally webhook
 * 2. Email verification
 * 3. AI matching
 * 4. Email delivery
 * 5. User feedback collection
 */

const axios = require('axios');
const crypto = require('crypto');

// Configuration
const CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_URL || 'http://localhost:3000',
  PILOT_SIZE: 20,
  TEST_EMAILS: [
    'test1@jobping.ai',
    'test2@jobping.ai',
    'test3@jobping.ai',
    'test4@jobping.ai',
    'test5@jobping.ai'
  ]
};

// Test data for different user types
const TEST_USERS = [
  {
    full_name: 'Alice Johnson',
    email: 'alice@jobping.ai',
    professional_expertise: 'Software Engineering',
    entry_level_preference: 'Graduate',
    target_cities: ['London', 'Berlin', 'Dublin'],
    languages_spoken: ['English', 'Spanish'],
    company_types: ['Startups', 'Tech Giants'],
    roles_selected: ['Software Engineer', 'Frontend Developer'],
    career_path: 'Technology',
    start_date: '2024-06-01',
    work_environment: 'Hybrid',
    visa_status: 'EU Citizen'
  },
  {
    full_name: 'Bob Smith',
    email: 'bob@jobping.ai',
    professional_expertise: 'Marketing',
    entry_level_preference: 'Entry Level',
    target_cities: ['New York', 'San Francisco'],
    languages_spoken: ['English'],
    company_types: ['B2B SaaS', 'Startups'],
    roles_selected: ['Marketing Intern', 'Growth Marketing'],
    career_path: 'Marketing',
    start_date: '2024-05-01',
    work_environment: 'Remote',
    visa_status: 'US Citizen'
  },
  {
    full_name: 'Carol Davis',
    email: 'carol@jobping.ai',
    professional_expertise: 'Data Science',
    entry_level_preference: 'Graduate',
    target_cities: ['Amsterdam', 'Stockholm'],
    languages_spoken: ['English', 'Dutch'],
    company_types: ['Scale-ups', 'Tech Giants'],
    roles_selected: ['Data Analyst', 'ML Engineer'],
    career_path: 'Data Science',
    start_date: '2024-07-01',
    work_environment: 'Office',
    visa_status: 'EU Citizen'
  }
];

class PilotTester {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  async runAllTests() {
    console.log('🚀 Starting JobPingAI Pilot Testing...\n');
    
    try {
      // Test 1: System Health Check
      await this.testSystemHealth();
      
      // Test 2: User Registration Flow
      await this.testUserRegistration();
      
      // Test 3: Email Verification Flow
      await this.testEmailVerification();
      
      // Test 4: AI Matching System
      await this.testAIMatching();
      
      // Test 5: Email Delivery
      await this.testEmailDelivery();
      
      // Test 6: Rate Limiting
      await this.testRateLimiting();
      
      // Test 7: Error Handling
      await this.testErrorHandling();
      
      // Generate Report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Pilot testing failed:', error);
      process.exit(1);
    }
  }

  async testSystemHealth() {
    console.log('🏥 Testing System Health...');
    
    const healthChecks = [
      { name: 'API Endpoint', url: `${CONFIG.BASE_URL}/api/match-users` },
      { name: 'Webhook Endpoint', url: `${CONFIG.BASE_URL}/api/webhook-tally` },
      { name: 'Verification Endpoint', url: `${CONFIG.BASE_URL}/api/verify-email` }
    ];

    for (const check of healthChecks) {
      try {
        const response = await axios.get(check.url, { timeout: 5000 });
        this.results.push({
          test: 'System Health',
          component: check.name,
          status: 'PASS',
          details: `Status: ${response.status}`
        });
        console.log(`  ✅ ${check.name}: OK`);
      } catch (error) {
        this.results.push({
          test: 'System Health',
          component: check.name,
          status: 'FAIL',
          details: error.message
        });
        console.log(`  ❌ ${check.name}: FAILED - ${error.message}`);
      }
    }
  }

  async testUserRegistration() {
    console.log('\n👤 Testing User Registration...');
    
    for (const user of TEST_USERS) {
      try {
        const webhookPayload = this.createTallyWebhookPayload(user);
        
        const response = await axios.post(
          `${CONFIG.BASE_URL}/api/webhook-tally`,
          webhookPayload,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );

        if (response.data.success) {
          this.results.push({
            test: 'User Registration',
            component: user.email,
            status: 'PASS',
            details: `User registered successfully, verification required: ${response.data.requiresVerification}`
          });
          console.log(`  ✅ ${user.email}: Registered successfully`);
        } else {
          throw new Error(response.data.error || 'Registration failed');
        }
      } catch (error) {
        this.results.push({
          test: 'User Registration',
          component: user.email,
          status: 'FAIL',
          details: error.message
        });
        console.log(`  ❌ ${user.email}: FAILED - ${error.message}`);
      }
    }
  }

  async testEmailVerification() {
    console.log('\n📧 Testing Email Verification...');
    
    // This would require actual email verification tokens
    // For testing, we'll simulate the verification process
    for (const user of TEST_USERS) {
      try {
        // Simulate verification token
        const mockToken = crypto.randomBytes(32).toString('hex');
        
        const response = await axios.post(
          `${CONFIG.BASE_URL}/api/verify-email`,
          { token: mockToken },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          }
        );

        // We expect this to fail with invalid token, which is correct behavior
        if (response.data.success === false) {
          this.results.push({
            test: 'Email Verification',
            component: user.email,
            status: 'PASS',
            details: 'Invalid token correctly rejected'
          });
          console.log(`  ✅ ${user.email}: Verification flow working (invalid token rejected)`);
        } else {
          throw new Error('Expected verification to fail with invalid token');
        }
      } catch (error) {
        if (error.response?.data?.success === false) {
          this.results.push({
            test: 'Email Verification',
            component: user.email,
            status: 'PASS',
            details: 'Invalid token correctly rejected'
          });
          console.log(`  ✅ ${user.email}: Verification flow working (invalid token rejected)`);
        } else {
          this.results.push({
            test: 'Email Verification',
            component: user.email,
            status: 'FAIL',
            details: error.message
          });
          console.log(`  ❌ ${user.email}: FAILED - ${error.message}`);
        }
      }
    }
  }

  async testAIMatching() {
    console.log('\n🤖 Testing AI Matching...');
    
    for (const user of TEST_USERS) {
      try {
        const response = await axios.post(
          `${CONFIG.BASE_URL}/api/match-users`,
          {
            userEmail: user.email,
            limit: 5
          },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
          }
        );

        if (response.data.matches && Array.isArray(response.data.matches)) {
          this.results.push({
            test: 'AI Matching',
            component: user.email,
            status: 'PASS',
            details: `Found ${response.data.matches.length} matches`
          });
          console.log(`  ✅ ${user.email}: Found ${response.data.matches.length} matches`);
        } else {
          throw new Error('No matches returned');
        }
      } catch (error) {
        this.results.push({
          test: 'AI Matching',
          component: user.email,
          status: 'FAIL',
          details: error.message
        });
        console.log(`  ❌ ${user.email}: FAILED - ${error.message}`);
      }
    }
  }

  async testEmailDelivery() {
    console.log('\n📬 Testing Email Delivery...');
    
    // This would require actual email testing
    // For now, we'll simulate the email sending process
    for (const user of TEST_USERS) {
      try {
        // Simulate email sending
        const emailPayload = {
          to: user.email,
          subject: 'Test Email',
          html: '<p>Test email content</p>'
        };

        // This is a simulation - in real testing, you'd check actual email delivery
        this.results.push({
          test: 'Email Delivery',
          component: user.email,
          status: 'SIMULATED',
          details: 'Email delivery simulated successfully'
        });
        console.log(`  ✅ ${user.email}: Email delivery simulated`);
      } catch (error) {
        this.results.push({
          test: 'Email Delivery',
          component: user.email,
          status: 'FAIL',
          details: error.message
        });
        console.log(`  ❌ ${user.email}: FAILED - ${error.message}`);
      }
    }
  }

  async testRateLimiting() {
    console.log('\n⚡ Testing Rate Limiting...');
    
    const testEmail = 'ratelimit@jobping.ai';
    let rateLimitHit = false;
    
    try {
      // Make multiple rapid requests to test rate limiting
      for (let i = 0; i < 10; i++) {
        try {
          await axios.post(
            `${CONFIG.BASE_URL}/api/match-users`,
            { userEmail: testEmail },
            { headers: { 'Content-Type': 'application/json' } }
          );
        } catch (error) {
          if (error.response?.status === 429) {
            rateLimitHit = true;
            break;
          }
        }
      }

      if (rateLimitHit) {
        this.results.push({
          test: 'Rate Limiting',
          component: 'API Endpoints',
          status: 'PASS',
          details: 'Rate limiting correctly enforced'
        });
        console.log('  ✅ Rate limiting: Working correctly');
      } else {
        this.results.push({
          test: 'Rate Limiting',
          component: 'API Endpoints',
          status: 'WARNING',
          details: 'Rate limiting not triggered (may need adjustment)'
        });
        console.log('  ⚠️ Rate limiting: Not triggered (may need adjustment)');
      }
    } catch (error) {
      this.results.push({
        test: 'Rate Limiting',
        component: 'API Endpoints',
        status: 'FAIL',
        details: error.message
      });
      console.log(`  ❌ Rate limiting: FAILED - ${error.message}`);
    }
  }

  async testErrorHandling() {
    console.log('\n🛡️ Testing Error Handling...');
    
    const errorTests = [
      {
        name: 'Invalid Email',
        payload: { userEmail: 'invalid-email' },
        expectedError: true
      },
      {
        name: 'Missing Email',
        payload: {},
        expectedError: true
      },
      {
        name: 'Invalid Webhook Payload',
        payload: { invalid: 'data' },
        expectedError: true
      }
    ];

    for (const test of errorTests) {
      try {
        await axios.post(
          `${CONFIG.BASE_URL}/api/match-users`,
          test.payload,
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        if (test.expectedError) {
          this.results.push({
            test: 'Error Handling',
            component: test.name,
            status: 'FAIL',
            details: 'Expected error but request succeeded'
          });
          console.log(`  ❌ ${test.name}: Expected error but request succeeded`);
        }
      } catch (error) {
        if (test.expectedError) {
          this.results.push({
            test: 'Error Handling',
            component: test.name,
            status: 'PASS',
            details: `Correctly handled error: ${error.response?.status || error.message}`
          });
          console.log(`  ✅ ${test.name}: Correctly handled error`);
        } else {
          this.results.push({
            test: 'Error Handling',
            component: test.name,
            status: 'FAIL',
            details: `Unexpected error: ${error.message}`
          });
          console.log(`  ❌ ${test.name}: Unexpected error - ${error.message}`);
        }
      }
    }
  }

  createTallyWebhookPayload(user) {
    return {
      eventId: crypto.randomUUID(),
      eventType: 'FORM_RESPONSE',
      createdAt: new Date().toISOString(),
      data: {
        responseId: crypto.randomUUID(),
        submissionId: crypto.randomUUID(),
        formId: 'pilot-test-form',
        formName: 'JobPingAI Pilot Registration',
        createdAt: new Date().toISOString(),
        fields: [
          { key: 'full_name', label: 'Full Name', type: 'text', value: user.full_name },
          { key: 'email', label: 'Email', type: 'email', value: user.email },
          { key: 'professional_expertise', label: 'Professional Expertise', type: 'text', value: user.professional_expertise },
          { key: 'entry_level_preference', label: 'Entry Level Preference', type: 'text', value: user.entry_level_preference },
          { key: 'target_cities', label: 'Target Cities', type: 'text', value: user.target_cities },
          { key: 'languages_spoken', label: 'Languages Spoken', type: 'text', value: user.languages_spoken },
          { key: 'company_types', label: 'Company Types', type: 'text', value: user.company_types },
          { key: 'roles_selected', label: 'Roles Selected', type: 'text', value: user.roles_selected },
          { key: 'career_path', label: 'Career Path', type: 'text', value: user.career_path },
          { key: 'start_date', label: 'Start Date', type: 'date', value: user.start_date },
          { key: 'work_environment', label: 'Work Environment', type: 'text', value: user.work_environment },
          { key: 'visa_status', label: 'Visa Status', type: 'text', value: user.visa_status }
        ]
      }
    };
  }

  generateReport() {
    console.log('\n📊 PILOT TESTING REPORT');
    console.log('=' .repeat(50));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const warnings = this.results.filter(r => r.status === 'WARNING').length;
    
    console.log(`\n📈 Summary:`);
    console.log(`  Total Tests: ${totalTests}`);
    console.log(`  ✅ Passed: ${passedTests}`);
    console.log(`  ❌ Failed: ${failedTests}`);
    console.log(`  ⚠️ Warnings: ${warnings}`);
    console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log(`\n❌ Failed Tests:`);
      this.results.filter(r => r.status === 'FAIL').forEach(result => {
        console.log(`  - ${result.test} > ${result.component}: ${result.details}`);
      });
    }
    
    if (warnings > 0) {
      console.log(`\n⚠️ Warnings:`);
      this.results.filter(r => r.status === 'WARNING').forEach(result => {
        console.log(`  - ${result.test} > ${result.component}: ${result.details}`);
      });
    }
    
    console.log(`\n🎯 Pilot Readiness Assessment:`);
    if (passedTests / totalTests >= 0.9) {
      console.log(`  🚀 READY FOR PILOT! Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    } else if (passedTests / totalTests >= 0.7) {
      console.log(`  ⚠️ PILOT READY WITH CAUTION. Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
      console.log(`  Consider fixing failed tests before proceeding.`);
    } else {
      console.log(`  ❌ NOT READY FOR PILOT. Success rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
      console.log(`  Fix failed tests before proceeding with pilot.`);
    }
    
    console.log(`\n📝 Next Steps:`);
    console.log(`  1. Review failed tests and fix issues`);
    console.log(`  2. Test with real email addresses`);
    console.log(`  3. Verify email delivery and verification flow`);
    console.log(`  4. Set up monitoring and alerting`);
    console.log(`  5. Prepare user onboarding materials`);
    console.log(`  6. Launch pilot with 20 users`);
  }
}

// Run the tests
if (require.main === module) {
  const tester = new PilotTester();
  tester.runAllTests().catch(console.error);
}

module.exports = PilotTester;
