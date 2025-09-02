#!/usr/bin/env node

/**
 * Simple test script for matching logs system
 * Run with: node scripts/test-matching-logs.js
 */

console.log('🧪 Testing Matching Logs System...\n');

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => Promise.resolve({ error: null }))
  }))
};

// Mock the createClient function
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Test the logMatchSession function
async function testMatchingLogs() {
  try {
    console.log('📝 Testing logMatchSession function...');
    
    // Test 1: Basic logging
    console.log('   Test 1: Basic AI success logging');
    await logMatchSession('test@example.com', 'ai_success', 50, 15);
    
    // Test 2: Enhanced logging with metadata
    console.log('   Test 2: Enhanced logging with metadata');
    await logMatchSession('premium@example.com', 'ai_success', 100, 25, undefined, {
      processingTimeMs: 2100,
      aiModelUsed: 'gpt-4',
      cacheHit: true,
      userTier: 'premium',
      jobFreshnessDistribution: { ultra_fresh: 40, fresh: 50, comprehensive: 10 }
    });
    
    // Test 3: Fallback logging
    console.log('   Test 3: Fallback logging');
    await logMatchSession('user@example.com', 'fallback', 45, 12, undefined, {
      processingTimeMs: 800,
      userTier: 'free'
    });
    
    // Test 4: Error logging
    console.log('   Test 4: Error logging');
    await logMatchSession('error@example.com', 'ai_failed', 30, 0, 'API rate limit exceeded', {
      processingTimeMs: 5000,
      aiModelUsed: 'gpt-4',
      userTier: 'free'
    });
    
    console.log('\n✅ All matching logs tests completed successfully!');
    console.log('📊 Supabase calls made:', mockSupabase.from.mock.calls.length);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testMatchingLogs().then(() => {
  console.log('\n🏁 Test script completed');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Test script failed:', error);
  process.exit(1);
});
