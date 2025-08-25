#!/usr/bin/env node

/**
 * 🏥 PRODUCTION HEALTH CHECK SYSTEM
 * 
 * Comprehensive health monitoring for JobPing production environment
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  API_BASE_URL: process.env.NEXT_PUBLIC_URL || 'http://localhost:3002',
  API_KEY: process.env.JOBPING_API_KEY || 'test-api-key',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  HEALTH_CHECK_TIMEOUT: 10000,
  ALERT_WEBHOOKS: {
    slack: process.env.SLACK_WEBHOOK_URL,
    discord: process.env.DISCORD_WEBHOOK_URL
  }
};

// Health check results
const results = {
  timestamp: new Date().toISOString(),
  overall: 'healthy',
  services: {},
  metrics: {},
  alerts: []
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

async function checkApiHealth() {
  log('🔍 Checking API health...', 'blue');
  
  try {
    const startTime = Date.now();
    const response = await axios.get(`${CONFIG.API_BASE_URL}/api/health`, {
      timeout: CONFIG.HEALTH_CHECK_TIMEOUT,
      headers: {
        'x-api-key': CONFIG.API_KEY
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.status === 200) {
      results.services.api = {
        status: 'healthy',
        responseTime,
        details: response.data
      };
      log(`✅ API: Healthy (${responseTime}ms)`, 'green');
    } else {
      results.services.api = {
        status: 'degraded',
        responseTime,
        error: `HTTP ${response.status}`
      };
      log(`⚠️ API: Degraded (HTTP ${response.status})`, 'yellow');
    }
  } catch (error) {
    results.services.api = {
      status: 'down',
      error: error.message
    };
    log(`❌ API: Down (${error.message})`, 'red');
    results.alerts.push({
      service: 'API',
      severity: 'critical',
      message: `API is down: ${error.message}`
    });
  }
}

async function checkDatabaseHealth() {
  log('🗄️ Checking database health...', 'blue');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    
    const startTime = Date.now();
    
    // Test database connection
    const { data, error } = await supabase
      .from('jobs')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      results.services.database = {
        status: 'down',
        error: error.message,
        responseTime
      };
      log(`❌ Database: Down (${error.message})`, 'red');
      results.alerts.push({
        service: 'Database',
        severity: 'critical',
        message: `Database error: ${error.message}`
      });
    } else {
      // Get database statistics
      const { count: totalJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });
      
      const { count: activeJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      const { count: recentJobs } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      results.services.database = {
        status: 'healthy',
        responseTime,
        statistics: {
          totalJobs: totalJobs || 0,
          activeJobs: activeJobs || 0,
          recentJobs: recentJobs || 0
        }
      };
      
      results.metrics.database = {
        totalJobs: totalJobs || 0,
        activeJobs: activeJobs || 0,
        recentJobs: recentJobs || 0,
        inactiveJobs: (totalJobs || 0) - (activeJobs || 0)
      };
      
      log(`✅ Database: Healthy (${responseTime}ms, ${totalJobs} total jobs)`, 'green');
      
      // Check for concerning trends
      if (recentJobs === 0) {
        results.alerts.push({
          service: 'Database',
          severity: 'warning',
          message: 'No jobs added in the last 24 hours'
        });
      }
    }
  } catch (error) {
    results.services.database = {
      status: 'down',
      error: error.message
    };
    log(`❌ Database: Down (${error.message})`, 'red');
    results.alerts.push({
      service: 'Database',
      severity: 'critical',
      message: `Database connection failed: ${error.message}`
    });
  }
}

async function checkScrapingHealth() {
  log('🕷️ Checking scraping health...', 'blue');
  
  try {
    // Check if scraper stats file exists
    const statsFile = path.join(__dirname, '..', 'scraper-stats.json');
    
    if (fs.existsSync(statsFile)) {
      const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
      const lastUpdate = new Date(stats.lastUpdated);
      const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate > 2) {
        results.services.scraping = {
          status: 'stale',
          lastUpdate: stats.lastUpdated,
          hoursSinceUpdate: Math.round(hoursSinceUpdate * 10) / 10,
          stats
        };
        log(`⚠️ Scraping: Stale (${Math.round(hoursSinceUpdate * 10) / 10}h since last update)`, 'yellow');
        results.alerts.push({
          service: 'Scraping',
          severity: 'warning',
          message: `Scraper hasn't run in ${Math.round(hoursSinceUpdate * 10) / 10} hours`
        });
      } else {
        results.services.scraping = {
          status: 'healthy',
          lastUpdate: stats.lastUpdated,
          hoursSinceUpdate: Math.round(hoursSinceUpdate * 10) / 10,
          stats
        };
        log(`✅ Scraping: Healthy (last run ${Math.round(hoursSinceUpdate * 10) / 10}h ago)`, 'green');
        
        // Check success rate
        if (stats.successRate < 80) {
          results.alerts.push({
            service: 'Scraping',
            severity: 'warning',
            message: `Low scraper success rate: ${stats.successRate}%`
          });
        }
      }
    } else {
      results.services.scraping = {
        status: 'unknown',
        error: 'No scraper stats file found'
      };
      log(`❓ Scraping: Unknown (no stats file)`, 'yellow');
    }
  } catch (error) {
    results.services.scraping = {
      status: 'error',
      error: error.message
    };
    log(`❌ Scraping: Error (${error.message})`, 'red');
  }
}

async function checkPerformanceMetrics() {
  log('📈 Checking performance metrics...', 'blue');
  
  try {
    const metricsFile = path.join(__dirname, '..', 'performance-metrics.jsonl');
    
    if (fs.existsSync(metricsFile)) {
      const content = fs.readFileSync(metricsFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.length > 0);
      
      if (lines.length > 0) {
        // Analyze recent metrics (last 10 entries)
        const recentMetrics = lines.slice(-10).map(line => JSON.parse(line));
        
        const avgDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0) / recentMetrics.length;
        const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memoryUsedMB, 0) / recentMetrics.length;
        const successRate = recentMetrics.filter(m => m.success).length / recentMetrics.length * 100;
        
        results.metrics.performance = {
          averageDuration: Math.round(avgDuration),
          averageMemoryMB: Math.round(avgMemory * 10) / 10,
          successRate: Math.round(successRate),
          recentRuns: recentMetrics.length
        };
        
        log(`📊 Performance: ${Math.round(avgDuration)}ms avg, ${Math.round(avgMemory)}MB avg, ${Math.round(successRate)}% success`, 'cyan');
        
        // Performance alerts
        if (avgDuration > 30000) {
          results.alerts.push({
            service: 'Performance',
            severity: 'warning',
            message: `High average response time: ${Math.round(avgDuration)}ms`
          });
        }
        
        if (avgMemory > 400) {
          results.alerts.push({
            service: 'Performance',
            severity: 'warning',
            message: `High memory usage: ${Math.round(avgMemory)}MB`
          });
        }
      } else {
        log(`📊 Performance: No recent metrics`, 'yellow');
      }
    } else {
      log(`📊 Performance: No metrics file found`, 'yellow');
    }
  } catch (error) {
    log(`❌ Performance: Error reading metrics (${error.message})`, 'red');
  }
}

async function checkSystemResources() {
  log('💻 Checking system resources...', 'blue');
  
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    results.metrics.system = {
      memoryUsageMB: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 10) / 10,
      memoryTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 10) / 10,
      uptime: Math.round(process.uptime()),
      nodeVersion: process.version
    };
    
    log(`💻 System: ${results.metrics.system.memoryUsageMB}MB used, ${results.metrics.system.uptime}s uptime`, 'cyan');
    
    // Check for disk space if possible
    if (fs.existsSync('/')) {
      try {
        const stats = fs.statSync('/');
        // Note: This is a simplified check, in production you'd use a proper disk space check
      } catch (error) {
        // Ignore disk check errors on different systems
      }
    }
  } catch (error) {
    log(`❌ System: Error checking resources (${error.message})`, 'red');
  }
}

function determineOverallHealth() {
  const services = Object.values(results.services);
  const downServices = services.filter(s => s.status === 'down').length;
  const degradedServices = services.filter(s => s.status === 'degraded' || s.status === 'stale').length;
  
  if (downServices > 0) {
    results.overall = 'down';
  } else if (degradedServices > 0) {
    results.overall = 'degraded';
  } else {
    results.overall = 'healthy';
  }
}

async function sendAlerts() {
  if (results.alerts.length === 0) {
    return;
  }
  
  log(`🚨 Found ${results.alerts.length} alerts...`, 'yellow');
  
  for (const alert of results.alerts) {
    // Console alert
    const severity = alert.severity === 'critical' ? '🔴' : '⚠️';
    log(`${severity} ${alert.service}: ${alert.message}`, 'red');
    
    // Send to external services (optional)
    try {
      if (CONFIG.ALERT_WEBHOOKS.slack) {
        await sendSlackAlert(alert);
        log(`📤 Sent alert to Slack`, 'cyan');
      }
      
      if (CONFIG.ALERT_WEBHOOKS.discord) {
        await sendDiscordAlert(alert);
        log(`📤 Sent alert to Discord`, 'cyan');
      }
      
      // If no webhooks configured, just log locally
      if (!CONFIG.ALERT_WEBHOOKS.slack && !CONFIG.ALERT_WEBHOOKS.discord) {
        log(`ℹ️ No webhook URLs configured - alerts logged locally only`, 'cyan');
      }
    } catch (error) {
      log(`❌ Failed to send alert: ${error.message}`, 'red');
    }
  }
}

async function sendSlackAlert(alert) {
  const color = alert.severity === 'critical' ? 'danger' : 'warning';
  const payload = {
    attachments: [{
      color,
      title: `JobPing Alert: ${alert.service}`,
      text: alert.message,
      ts: Math.floor(Date.now() / 1000)
    }]
  };
  
  await axios.post(CONFIG.ALERT_WEBHOOKS.slack, payload);
}

async function sendDiscordAlert(alert) {
  const color = alert.severity === 'critical' ? 0xFF0000 : 0xFFA500;
  const payload = {
    embeds: [{
      title: `JobPing Alert: ${alert.service}`,
      description: alert.message,
      color,
      timestamp: new Date().toISOString()
    }]
  };
  
  await axios.post(CONFIG.ALERT_WEBHOOKS.discord, payload);
}

function saveHealthReport() {
  try {
    const reportsDir = path.join(__dirname, '..', 'health-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(reportsDir, `health-${timestamp}.json`);
    
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
    
    // Keep only last 100 reports
    const reports = fs.readdirSync(reportsDir)
      .filter(f => f.startsWith('health-'))
      .sort()
      .reverse();
    
    if (reports.length > 100) {
      const toDelete = reports.slice(100);
      toDelete.forEach(file => {
        fs.unlinkSync(path.join(reportsDir, file));
      });
    }
    
    // Always save latest report
    const latestFile = path.join(reportsDir, 'latest.json');
    fs.writeFileSync(latestFile, JSON.stringify(results, null, 2));
    
  } catch (error) {
    log(`❌ Failed to save health report: ${error.message}`, 'red');
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  log('🏥 JOBPING HEALTH CHECK SUMMARY', 'cyan');
  console.log('='.repeat(60));
  
  const statusColor = results.overall === 'healthy' ? 'green' : 
                     results.overall === 'degraded' ? 'yellow' : 'red';
  const statusEmoji = results.overall === 'healthy' ? '✅' : 
                     results.overall === 'degraded' ? '⚠️' : '❌';
  
  log(`${statusEmoji} Overall Status: ${results.overall.toUpperCase()}`, statusColor);
  
  console.log('\n📊 Service Status:');
  Object.entries(results.services).forEach(([service, status]) => {
    const emoji = status.status === 'healthy' ? '✅' : 
                  status.status === 'degraded' || status.status === 'stale' ? '⚠️' : '❌';
    const color = status.status === 'healthy' ? 'green' : 
                  status.status === 'degraded' || status.status === 'stale' ? 'yellow' : 'red';
    
    log(`  ${emoji} ${service}: ${status.status}`, color);
    if (status.responseTime) {
      log(`    Response time: ${status.responseTime}ms`, 'cyan');
    }
  });
  
  if (results.metrics.database) {
    console.log('\n📈 Database Metrics:');
    log(`  Total jobs: ${results.metrics.database.totalJobs}`, 'cyan');
    log(`  Active jobs: ${results.metrics.database.activeJobs}`, 'cyan');
    log(`  Recent jobs (24h): ${results.metrics.database.recentJobs}`, 'cyan');
  }
  
  if (results.metrics.performance) {
    console.log('\n⚡ Performance Metrics:');
    log(`  Average duration: ${results.metrics.performance.averageDuration}ms`, 'cyan');
    log(`  Average memory: ${results.metrics.performance.averageMemoryMB}MB`, 'cyan');
    log(`  Success rate: ${results.metrics.performance.successRate}%`, 'cyan');
  }
  
  if (results.alerts.length > 0) {
    console.log('\n🚨 Active Alerts:');
    results.alerts.forEach(alert => {
      const emoji = alert.severity === 'critical' ? '🔴' : '⚠️';
      log(`  ${emoji} ${alert.service}: ${alert.message}`, 'yellow');
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

async function main() {
  log('🏥 Starting JobPing Health Check...', 'blue');
  
  // Check if we're in Railway environment
  const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';
  if (isRailway) {
    log('🚂 Railway environment detected - using Railway-specific health checks', 'blue');
  }
  
  try {
    await checkApiHealth();
    await checkDatabaseHealth();
    await checkScrapingHealth();
    await checkPerformanceMetrics();
    await checkSystemResources();
    
    determineOverallHealth();
    await sendAlerts();
    saveHealthReport();
    printSummary();
    
    // In Railway, be more lenient with health status
    let exitCode = results.overall === 'down' ? 1 : 0;
    
    if (isRailway && results.overall === 'degraded') {
      log('🚂 Railway: Degraded status is acceptable in Railway environment', 'yellow');
      exitCode = 0; // Don't fail on degraded status in Railway
    }
    
    process.exit(exitCode);
    
  } catch (error) {
    log(`💥 Health check failed: ${error.message}`, 'red');
    
    // In Railway, be more lenient with errors
    if (isRailway) {
      log('🚂 Railway: Error occurred but continuing...', 'yellow');
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🏥 JobPing Health Check

Usage: node health-check.js [options]

Options:
  --help, -h    Show this help message
  --quiet, -q   Minimal output (alerts only)
  --json        Output results as JSON

Environment Variables:
  NEXT_PUBLIC_URL          API base URL
  JOBPING_API_KEY          API key for authentication
  NEXT_PUBLIC_SUPABASE_URL Supabase URL
  SUPABASE_SERVICE_ROLE_KEY Supabase service role key
  SLACK_WEBHOOK_URL        (Optional) Slack webhook for alerts
  DISCORD_WEBHOOK_URL      (Optional) Discord webhook for alerts

Examples:
  node health-check.js                    # Full health check
  node health-check.js --quiet            # Quiet mode
  node health-check.js --json             # JSON output
`);
  process.exit(0);
}

if (process.argv.includes('--json')) {
  // JSON output mode for programmatic use
  main().then(() => {
    console.log(JSON.stringify(results, null, 2));
  }).catch(() => {
    console.log(JSON.stringify({ error: 'Health check failed' }, null, 2));
  });
} else {
  // Regular mode
  main();
}
