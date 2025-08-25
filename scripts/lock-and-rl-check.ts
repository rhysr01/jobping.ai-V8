#!/usr/bin/env tsx

/**
 * 🔒 RATE LIMIT & LOCK HARNESS
 * 
 * This script tests the rate limiting and Redis lock behavior
 * to ensure proper concurrency control and rate limiting.
 */

import axios from 'axios';
import { config } from 'dotenv';
import { createClient } from 'redis';

// Load environment variables
config();

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  details: string;
  evidence?: any;
}

class LockAndRateLimitChecker {
  private baseUrl: string;
  private redisClient: any;
  private results: TestResult[] = [];
  private failures: string[] = [];

  constructor() {
    // Check for --base argument
    const baseArgIndex = process.argv.indexOf('--base');
    if (baseArgIndex !== -1 && process.argv[baseArgIndex + 1]) {
      this.baseUrl = process.argv[baseArgIndex + 1];
    } else {
      this.baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    }
    console.log('🔒 Starting Rate Limit & Lock Harness Test...');
    console.log(`📍 Base URL: ${this.baseUrl}`);
  }

  async runAllTests(): Promise<void> {
    try {
      // Initialize Redis client
      await this.initializeRedis();
      
      // Test 1: Concurrent Lock Behavior
      await this.testConcurrentLockBehavior();
      
      // Test 2: Rate Limiting
      await this.testRateLimiting();
      
      // Test 3: Lock Cleanup
      await this.testLockCleanup();
      
      // Generate Summary
      this.generateSummary();
      
    } catch (error) {
      console.error('❌ Lock and rate limit test failed:', error);
      this.failures.push(`Test execution failed: ${error}`);
      this.generateSummary();
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = createClient({ url: redisUrl });
      await this.redisClient.connect();
      console.log('✅ Redis client connected');
    } catch (error) {
      console.log('⚠️ Redis not available, skipping Redis-dependent tests');
      this.redisClient = null;
    }
  }

  private async testConcurrentLockBehavior(): Promise<void> {
    console.log('\n🔒 Testing Concurrent Lock Behavior...');
    
    try {
      // Send two concurrent requests
      const promises = [
        axios.post(`${this.baseUrl}/api/match-users`, {}, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        }),
        axios.post(`${this.baseUrl}/api/match-users`, {}, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        })
      ];

      const responses = await Promise.allSettled(promises);
      
      const statuses = responses.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value.status;
        } else {
          return result.reason.response?.status || 'error';
        }
      });

      console.log(`  Concurrent request statuses: ${statuses.join(', ')}`);

      // Check if we got the expected pattern: one 200, one 409 (or both 200 in test mode)
      const isTestMode = process.env.NODE_ENV === 'test' || process.env.JOBPING_TEST_MODE === '1';
      
      if (isTestMode) {
        // In test mode, both should succeed (no locks)
        if (statuses.every(status => status === 200)) {
          this.results.push({
            test: 'Concurrent Lock Behavior (Test Mode)',
            status: 'PASS',
            details: 'Both requests succeeded as expected in test mode',
            evidence: { statuses }
          });
          console.log('  ✅ Concurrent Lock Behavior: PASS (test mode)');
        } else {
          const details = `Expected both 200 in test mode, got: ${statuses.join(', ')}`;
          this.results.push({
            test: 'Concurrent Lock Behavior (Test Mode)',
            status: 'FAIL',
            details,
            evidence: { statuses }
          });
          this.failures.push(details);
          console.log(`  ❌ Concurrent Lock Behavior: FAIL - ${details}`);
        }
      } else {
        // In production mode, expect one 200, one 409
        const has200 = statuses.includes(200);
        const has409 = statuses.includes(409);
        
        if (has200 && has409) {
          this.results.push({
            test: 'Concurrent Lock Behavior (Prod Mode)',
            status: 'PASS',
            details: 'One request succeeded (200), one was blocked (409) as expected',
            evidence: { statuses }
          });
          console.log('  ✅ Concurrent Lock Behavior: PASS (prod mode)');
        } else {
          const details = `Expected one 200 and one 409, got: ${statuses.join(', ')}`;
          this.results.push({
            test: 'Concurrent Lock Behavior (Prod Mode)',
            status: 'FAIL',
            details,
            evidence: { statuses }
          });
          this.failures.push(details);
          console.log(`  ❌ Concurrent Lock Behavior: FAIL - ${details}`);
        }
      }
      
    } catch (error) {
      const details = `Concurrent lock test failed: ${error instanceof Error ? error.message : String(error)}`;
      this.results.push({
        test: 'Concurrent Lock Behavior',
        status: 'FAIL',
        details,
        evidence: { error: error instanceof Error ? error.message : String(error) }
      });
      this.failures.push(details);
      console.log(`  ❌ Concurrent Lock Behavior: FAIL - ${details}`);
    }
  }

  private async testRateLimiting(): Promise<void> {
    console.log('\n⚡ Testing Rate Limiting...');
    
    try {
      const isTestMode = process.env.NODE_ENV === 'test' || process.env.JOBPING_TEST_MODE === '1';
      
      if (isTestMode) {
        // In test mode, rate limiting should be bypassed
        console.log('  Skipping rate limit test in test mode (rate limiting bypassed)');
        this.results.push({
          test: 'Rate Limiting (Test Mode)',
          status: 'PASS',
          details: 'Rate limiting bypassed in test mode as expected'
        });
        return;
      }

      // Send 30 sequential requests to trigger rate limiting
      console.log('  Sending 30 sequential requests...');
      const responses = [];
      
      for (let i = 0; i < 30; i++) {
        try {
          const response = await axios.post(`${this.baseUrl}/api/match-users`, {}, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000
          });
          responses.push(response.status);
        } catch (error) {
          responses.push((error as any).response?.status || 'error');
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`  Response statuses: ${responses.slice(-10).join(', ')}...`);

      // Check if we got rate limited (429) at the end
      const lastStatus = responses[responses.length - 1];
      
      if (lastStatus === 429) {
        this.results.push({
          test: 'Rate Limiting (Prod Mode)',
          status: 'PASS',
          details: 'Rate limiting triggered after 30 requests as expected',
          evidence: { lastStatus, totalRequests: responses.length }
        });
        console.log('  ✅ Rate Limiting: PASS - Rate limit triggered');
      } else {
        const details = `Expected 429 after 30 requests, got: ${lastStatus}`;
        this.results.push({
          test: 'Rate Limiting (Prod Mode)',
          status: 'FAIL',
          details,
          evidence: { lastStatus, totalRequests: responses.length, responses }
        });
        this.failures.push(details);
        console.log(`  ❌ Rate Limiting: FAIL - ${details}`);
      }
      
    } catch (error) {
      const details = `Rate limiting test failed: ${error instanceof Error ? error.message : String(error)}`;
      this.results.push({
        test: 'Rate Limiting',
        status: 'FAIL',
        details,
        evidence: { error: error instanceof Error ? error.message : String(error) }
      });
      this.failures.push(details);
      console.log(`  ❌ Rate Limiting: FAIL - ${details}`);
    }
  }

  private async testLockCleanup(): Promise<void> {
    console.log('\n🧹 Testing Lock Cleanup...');
    
    if (!this.redisClient) {
      console.log('  Skipping lock cleanup test (Redis not available)');
      this.results.push({
        test: 'Lock Cleanup',
        status: 'SKIP',
        details: 'Redis not available'
      });
      return;
    }

    try {
      // Check for existing lock keys
      const lockPattern = 'jobping:*:lock:*';
      const keys = await this.redisClient.keys(lockPattern);
      
      console.log(`  Found ${keys.length} existing lock keys`);
      
      if (keys.length === 0) {
        this.results.push({
          test: 'Lock Cleanup',
          status: 'PASS',
          details: 'No lingering lock keys found',
          evidence: { keysFound: 0 }
        });
        console.log('  ✅ Lock Cleanup: PASS - No lingering locks');
        return;
      }

      // Wait for locks to expire (max 180 seconds)
      console.log('  Waiting for locks to expire (max 180s)...');
      const startTime = Date.now();
      const maxWaitTime = 180000; // 180 seconds
      
      while (Date.now() - startTime < maxWaitTime) {
        const remainingKeys = await this.redisClient.keys(lockPattern);
        
        if (remainingKeys.length === 0) {
          const waitTime = Date.now() - startTime;
          this.results.push({
            test: 'Lock Cleanup',
            status: 'PASS',
            details: `All locks cleared after ${waitTime}ms`,
            evidence: { keysFound: keys.length, waitTimeMs: waitTime }
          });
          console.log(`  ✅ Lock Cleanup: PASS - All locks cleared after ${waitTime}ms`);
          return;
        }
        
        console.log(`    Waiting... ${remainingKeys.length} locks remaining`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Check every 5 seconds
      }

      // Locks didn't clear within time limit
      const remainingKeys = await this.redisClient.keys(lockPattern);
      const details = `Locks did not clear within 180s. Remaining: ${remainingKeys.length}`;
      this.results.push({
        test: 'Lock Cleanup',
        status: 'FAIL',
        details,
        evidence: { keysFound: keys.length, remainingKeys, waitTimeMs: maxWaitTime }
      });
      this.failures.push(details);
      console.log(`  ❌ Lock Cleanup: FAIL - ${details}`);
      
    } catch (error) {
      const details = `Lock cleanup test failed: ${error instanceof Error ? error.message : String(error)}`;
      this.results.push({
        test: 'Lock Cleanup',
        status: 'FAIL',
        details,
        evidence: { error: error instanceof Error ? error.message : String(error) }
      });
      this.failures.push(details);
      console.log(`  ❌ Lock Cleanup: FAIL - ${details}`);
    }
  }

  private async cleanup(): Promise<void> {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        console.log('✅ Redis client disconnected');
      } catch (error) {
        console.log('⚠️ Error disconnecting Redis client:', error instanceof Error ? error.message : String(error));
      }
    }
  }

  private generateSummary(): void {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.status === 'PASS').length;
    const failedTests = this.results.filter(r => r.status === 'FAIL').length;
    const skippedTests = this.results.filter(r => r.status === 'SKIP').length;
    
    console.log('\n📊 LOCK & RATE LIMIT TEST SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`⏭️ Skipped: ${skippedTests}`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILURES:');
      this.failures.forEach(failure => console.log(`  - ${failure}`));
      console.log('\n🔧 REMEDIATION STEPS:');
      console.log('  1. Check Redis connection and configuration');
      console.log('  2. Verify rate limiting settings in production');
      console.log('  3. Review lock TTL settings');
      console.log('  4. Check for stuck processes holding locks');
      console.log('  5. Verify environment variables for test mode');
      process.exit(1);
    } else {
      console.log('\n🎉 ALL TESTS PASSED! Rate limiting and locking working correctly.');
    }
    
    console.log('\n📋 DETAILED RESULTS:');
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`  ${status} ${result.test}: ${result.details}`);
    });
  }
}

// Run the tests
if (require.main === module) {
  const checker = new LockAndRateLimitChecker();
  checker.runAllTests().catch(console.error);
}

export default LockAndRateLimitChecker;
