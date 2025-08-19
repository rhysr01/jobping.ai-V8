#!/usr/bin/env node

/**
 * Automated Scraping Scheduler
 * 
 * This script runs scraping operations on a schedule and can be used with:
 * - Cron jobs (Linux/Mac)
 * - Windows Task Scheduler
 * - GitHub Actions
 * - Vercel Cron Jobs
 */

const https = require('https');
const http = require('http');

// Configuration
const CONFIG = {
  // API endpoints
  scrapeUrl: process.env.SCRAPE_API_URL || 'http://localhost:3002/api/scrape',
  cleanupUrl: process.env.CLEANUP_API_URL || 'http://localhost:3002/api/cleanup-jobs',
  
  // API key for authentication
  apiKey: process.env.SCRAPE_API_KEY,
  
  // Scheduling options
  platforms: process.env.SCRAPE_PLATFORMS?.split(',') || ['all'],
  cleanupThreshold: parseInt(process.env.CLEANUP_THRESHOLD_DAYS) || 7,
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function makeRequest(url, options, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'JobPing-Scraper-Scheduler/1.0',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function triggerScraping() {
  log('🚀 Starting scheduled scraping...', 'blue');
  
  if (!CONFIG.apiKey) {
    log('❌ No API key provided. Set SCRAPE_API_KEY environment variable.', 'red');
    return false;
  }

  const scrapeData = {
    platforms: CONFIG.platforms,
    companies: [] // Use default companies from API
  };

  try {
    const response = await makeRequest(CONFIG.scrapeUrl, {
      method: 'POST',
      headers: {
        'x-api-key': CONFIG.apiKey
      }
    }, scrapeData);

    if (response.status === 200) {
      log('✅ Scraping completed successfully', 'green');
      log(`📊 Run ID: ${response.data.runId}`, 'cyan');
      
      // Log results summary
      if (response.data.results) {
        Object.entries(response.data.results).forEach(([platform, result]) => {
          if (Array.isArray(result)) {
            // Company-specific results
            result.forEach(companyResult => {
              if (companyResult.success) {
                log(`  ✅ ${companyResult.company}: ${companyResult.jobs} jobs`, 'green');
              } else {
                log(`  ❌ ${companyResult.company}: ${companyResult.error}`, 'red');
              }
            });
          } else {
            // Platform-wide results (like RemoteOK)
            if (result.success) {
              log(`  ✅ ${platform}: ${result.jobs} jobs`, 'green');
            } else {
              log(`  ❌ ${platform}: ${result.error}`, 'red');
            }
          }
        });
      }
      
      return true;
    } else {
      log(`❌ Scraping failed with status ${response.status}`, 'red');
      log(`Error: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Scraping request failed: ${error.message}`, 'red');
    return false;
  }
}

async function triggerCleanup() {
  log('🧹 Starting job cleanup...', 'blue');
  
  if (!CONFIG.apiKey) {
    log('❌ No API key provided. Set SCRAPE_API_KEY environment variable.', 'red');
    return false;
  }

  const cleanupData = {
    daysThreshold: CONFIG.cleanupThreshold
  };

  try {
    const response = await makeRequest(CONFIG.cleanupUrl, {
      method: 'POST',
      headers: {
        'x-api-key': CONFIG.apiKey
      }
    }, cleanupData);

    if (response.status === 200) {
      log('✅ Cleanup completed successfully', 'green');
      log(`📊 Jobs marked inactive: ${response.data.cleanup.jobsMarkedInactive}`, 'cyan');
      log(`📊 Total active jobs: ${response.data.stats.totalActive}`, 'cyan');
      log(`📊 Total inactive jobs: ${response.data.stats.totalInactive}`, 'cyan');
      return true;
    } else {
      log(`❌ Cleanup failed with status ${response.status}`, 'red');
      log(`Error: ${JSON.stringify(response.data)}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Cleanup request failed: ${error.message}`, 'red');
    return false;
  }
}

async function runWithRetry(operation, operationName) {
  for (let attempt = 1; attempt <= CONFIG.maxRetries; attempt++) {
    try {
      log(`🔄 Attempt ${attempt}/${CONFIG.maxRetries} for ${operationName}`, 'yellow');
      const success = await operation();
      
      if (success) {
        log(`✅ ${operationName} completed successfully`, 'green');
        return true;
      } else {
        log(`❌ ${operationName} failed`, 'red');
      }
    } catch (error) {
      log(`❌ ${operationName} error: ${error.message}`, 'red');
    }
    
    if (attempt < CONFIG.maxRetries) {
      log(`⏳ Waiting ${CONFIG.retryDelay}ms before retry...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
    }
  }
  
  log(`❌ ${operationName} failed after ${CONFIG.maxRetries} attempts`, 'red');
  return false;
}

async function main() {
  const startTime = Date.now();
  log('🎯 JobPing Scraper Scheduler Starting', 'bright');
  log(`📅 Platforms: ${CONFIG.platforms.join(', ')}`, 'cyan');
  log(`🧹 Cleanup threshold: ${CONFIG.cleanupThreshold} days`, 'cyan');
  
  // Run scraping
  const scrapingSuccess = await runWithRetry(triggerScraping, 'Scraping');
  
  // Run cleanup
  const cleanupSuccess = await runWithRetry(triggerCleanup, 'Cleanup');
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  log(`⏱️  Total execution time: ${duration} seconds`, 'cyan');
  
  if (scrapingSuccess && cleanupSuccess) {
    log('🎉 All operations completed successfully!', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some operations failed', 'yellow');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === 'scrape') {
  runWithRetry(triggerScraping, 'Scraping').then(success => {
    process.exit(success ? 0 : 1);
  });
} else if (command === 'cleanup') {
  runWithRetry(triggerCleanup, 'Cleanup').then(success => {
    process.exit(success ? 0 : 1);
  });
} else if (command === 'help' || command === '--help' || command === '-h') {
  console.log(`
JobPing Scraper Scheduler

Usage:
  node schedule-scraping.js [command]

Commands:
  scrape    - Run scraping only
  cleanup   - Run cleanup only
  (no args) - Run both scraping and cleanup

Environment Variables:
  SCRAPE_API_URL          - Scraping API endpoint
  CLEANUP_API_URL         - Cleanup API endpoint  
  SCRAPE_API_KEY          - API key for authentication
  SCRAPE_PLATFORMS        - Comma-separated platforms (default: all)
  CLEANUP_THRESHOLD_DAYS  - Days threshold for cleanup (default: 7)

Examples:
  # Run full schedule
  node schedule-scraping.js
  
  # Run only scraping
  node schedule-scraping.js scrape
  
  # Run only cleanup
  node schedule-scraping.js cleanup
  
  # With custom configuration
  SCRAPE_PLATFORMS=greenhouse,lever node schedule-scraping.js
`);
  process.exit(0);
} else {
  // Run full schedule (default)
  main().catch(error => {
    log(`💥 Fatal error: ${error.message}`, 'red');
    process.exit(1);
  });
}
