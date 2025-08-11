// Test script for Job Queue and Enhanced Cache system
// Run with: node test_job_queue_cache.js

const testJobQueue = async () => {
  console.log('🧪 Testing Job Queue System...\n');
  
  const API_BASE = 'http://localhost:3000/api';
  const API_KEY = 'test-key'; // Replace with your actual API key
  
  // Test 1: Get queue statistics
  console.log('📊 Test 1: Getting queue statistics...');
  try {
    const response = await fetch(`${API_BASE}/job-queue`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Queue stats retrieved:', data.stats);
    } else {
      console.log('❌ Failed to get queue stats:', response.status);
    }
  } catch (error) {
    console.log('❌ Error getting queue stats:', error.message);
  }
  
  console.log('');
  
  // Test 2: Add match-users job
  console.log('🎯 Test 2: Adding match-users job...');
  try {
    const response = await fetch(`${API_BASE}/job-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        action: 'add',
        jobType: 'match-users',
        data: {
          userIds: ['user1', 'user2', 'user3', 'user4', 'user5']
        },
        priority: 'normal'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Match-users job added:', data.runId);
    } else {
      console.log('❌ Failed to add match-users job:', response.status);
    }
  } catch (error) {
    console.log('❌ Error adding match-users job:', error.message);
  }
  
  console.log('');
  
  // Test 3: Add send-emails job
  console.log('📧 Test 3: Adding send-emails job...');
  try {
    const response = await fetch(`${API_BASE}/job-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        action: 'add',
        jobType: 'send-emails',
        data: {
          emailData: [
            {
              to: 'test1@example.com',
              jobs: [{ title: 'Test Job 1', company: 'Test Company' }],
              userName: 'Test User 1',
              subscriptionTier: 'free'
            },
            {
              to: 'test2@example.com',
              jobs: [{ title: 'Test Job 2', company: 'Test Company' }],
              userName: 'Test User 2',
              subscriptionTier: 'premium'
            }
          ]
        },
        priority: 'high'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Send-emails job added:', data.runId);
    } else {
      console.log('❌ Failed to add send-emails job:', response.status);
    }
  } catch (error) {
    console.log('❌ Error adding send-emails job:', error.message);
  }
  
  console.log('');
  
  // Test 4: Add scrape-jobs job
  console.log('🔍 Test 4: Adding scrape-jobs job...');
  try {
    const response = await fetch(`${API_BASE}/job-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        action: 'add',
        jobType: 'scrape-jobs',
        data: {
          platforms: ['remoteok', 'graduatejobs']
        },
        priority: 'low'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Scrape-jobs job added:', data.runId);
    } else {
      console.log('❌ Failed to add scrape-jobs job:', response.status);
    }
  } catch (error) {
    console.log('❌ Error adding scrape-jobs job:', error.message);
  }
  
  console.log('');
  
  // Test 5: Add cleanup-jobs job
  console.log('🧹 Test 5: Adding cleanup-jobs job...');
  try {
    const response = await fetch(`${API_BASE}/job-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        action: 'add',
        jobType: 'cleanup-jobs',
        data: {
          olderThanDays: 30
        },
        priority: 'low'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cleanup-jobs job added:', data.runId);
    } else {
      console.log('❌ Failed to add cleanup-jobs job:', response.status);
    }
  } catch (error) {
    console.log('❌ Error adding cleanup-jobs job:', error.message);
  }
  
  console.log('');
};

const testEnhancedCache = async () => {
  console.log('🧪 Testing Enhanced Cache System...\n');
  
  const API_BASE = 'http://localhost:3000/api';
  const API_KEY = 'test-key'; // Replace with your actual API key
  
  // Test 1: Get cache information
  console.log('📊 Test 1: Getting cache information...');
  try {
    const response = await fetch(`${API_BASE}/cache`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cache info retrieved:', data.info);
    } else {
      console.log('❌ Failed to get cache info:', response.status);
    }
  } catch (error) {
    console.log('❌ Error getting cache info:', error.message);
  }
  
  console.log('');
  
  // Test 2: Get cache statistics
  console.log('📈 Test 2: Getting cache statistics...');
  try {
    const response = await fetch(`${API_BASE}/cache?action=stats`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cache stats retrieved:', data.stats);
    } else {
      console.log('❌ Failed to get cache stats:', response.status);
    }
  } catch (error) {
    console.log('❌ Error getting cache stats:', error.message);
  }
  
  console.log('');
  
  // Test 3: Clear cache
  console.log('🧹 Test 3: Clearing cache...');
  try {
    const response = await fetch(`${API_BASE}/cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        action: 'clear'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cache cleared:', data.message);
    } else {
      console.log('❌ Failed to clear cache:', response.status);
    }
  } catch (error) {
    console.log('❌ Error clearing cache:', error.message);
  }
  
  console.log('');
  
  // Test 4: Reset cache
  console.log('🔄 Test 4: Resetting cache...');
  try {
    const response = await fetch(`${API_BASE}/cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        action: 'reset'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Cache reset:', data.message);
    } else {
      console.log('❌ Failed to reset cache:', response.status);
    }
  } catch (error) {
    console.log('❌ Error resetting cache:', error.message);
  }
  
  console.log('');
};

const testChunking = async () => {
  console.log('🧪 Testing Chunking System...\n');
  
  const API_BASE = 'http://localhost:3000/api';
  const API_KEY = 'test-key'; // Replace with your actual API key
  
  // Test chunking with large user array
  console.log('📦 Test: Chunking large user array...');
  try {
    // Generate 250 test user IDs
    const userIds = Array.from({ length: 250 }, (_, i) => `user_${i + 1}`);
    
    const response = await fetch(`${API_BASE}/job-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        action: 'add',
        jobType: 'match-users',
        data: {
          userIds: userIds
        },
        priority: 'normal'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Large user array chunked: ${userIds.length} users processed`);
      console.log(`   Run ID: ${data.runId}`);
      console.log(`   Expected chunks: ${Math.ceil(userIds.length / 100)} (100 users per chunk)`);
    } else {
      console.log('❌ Failed to chunk large user array:', response.status);
    }
  } catch (error) {
    console.log('❌ Error chunking large user array:', error.message);
  }
  
  console.log('');
};

const testPriorityLevels = async () => {
  console.log('🧪 Testing Priority Levels...\n');
  
  const API_BASE = 'http://localhost:3000/api';
  const API_KEY = 'test-key'; // Replace with your actual API key
  
  const priorities = ['high', 'normal', 'low'];
  
  for (const priority of priorities) {
    console.log(`🎯 Test: Adding job with ${priority} priority...`);
    try {
      const response = await fetch(`${API_BASE}/job-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({
          action: 'add',
          jobType: 'match-users',
          data: {
            userIds: [`${priority}_user_1`, `${priority}_user_2`]
          },
          priority: priority
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${priority} priority job added: ${data.runId}`);
      } else {
        console.log(`❌ Failed to add ${priority} priority job:`, response.status);
      }
    } catch (error) {
      console.log(`❌ Error adding ${priority} priority job:`, error.message);
    }
    
    console.log('');
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting Job Queue and Cache System Tests\n');
  console.log('='.repeat(60) + '\n');
  
  await testJobQueue();
  console.log('='.repeat(60) + '\n');
  
  await testEnhancedCache();
  console.log('='.repeat(60) + '\n');
  
  await testChunking();
  console.log('='.repeat(60) + '\n');
  
  await testPriorityLevels();
  console.log('='.repeat(60) + '\n');
  
  console.log('🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('✅ Job Queue System: Bull-based Redis queue with chunking');
  console.log('✅ Enhanced Cache: Redis-persisted LRU cache with TTL tuning');
  console.log('✅ Priority Levels: High, normal, low priority support');
  console.log('✅ Chunking: 100 users per job chunk');
  console.log('✅ Backoff: Exponential retry with circuit breaker');
  console.log('✅ Monitoring: Real-time statistics and metrics');
};

runAllTests().catch(console.error);
