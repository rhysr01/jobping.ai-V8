#!/usr/bin/env node

/**
 * Smoke Test Harness for JobPing Scrapers
 * 
 * Usage:
 * - Local dev: 
 *   export BASE_URL=http://localhost:3000
 *   export SCRAPE_API_KEY=***
 *   export NEXT_PUBLIC_SUPABASE_URL=***
 *   export SUPABASE_SERVICE_ROLE_KEY=***
 *   npm run scrape:smoke
 * 
 * - Against Vercel prod:
 *   export BASE_URL=https://<your-vercel-domain>
 *   # Same keys as above (use production values)
 *   npm run scrape:smoke
 * 
 * Toggle platforms: Edit the platforms array below
 * 
 * Expected thresholds:
 * - Each platform should return jobs > 0 at least once
 * - Duplicates (count - distinct) should be < 5% of total for that source
 * - missing_posted_at should be < 10% (warning if higher)
 * - last_hour > 0 after a run
 * 
 * Artifacts: JSON results saved under ./tmp/scrape-results/
 */

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const PLATFORMS = [
  'greenhouse'
  // Add or remove platforms as needed
  // Available: 'remoteok', 'greenhouse', 'lever', 'workday', 'reliable'
];

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SCRAPE_API_KEY = process.env.SCRAPE_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validation
if (!SCRAPE_API_KEY) {
  console.error('❌ Missing SCRAPE_API_KEY environment variable');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ScrapeResult {
  platform: string;
  raw?: number;
  filtered?: number;
  upserted?: number;
  updated?: number;
  errors?: number;
  jobs?: number;
  inserted?: number;
  duration: number;
  response: any;
  timestamp: string;
}

interface DatabaseStats {
  total: number;
  unique_hashes: number;
  last_hour: number;
  missing_posted_at: number;
  duplicates: number;
  top_locations: Array<{ location: string; c: number }>;
  latest_jobs: Array<{ title: string; company: string; job_url: string; posted_at: string }>;
}

async function ensureResultsDir(): Promise<void> {
  const resultsDir = path.join(process.cwd(), 'tmp', 'scrape-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
    console.log(`📁 Created results directory: ${resultsDir}`);
  }
}

async function scrapePlatform(platform: string): Promise<ScrapeResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  console.log(`\n🚀 Starting scrape for ${platform}...`);
  
  try {
    const response = await axios.post(
      `${BASE_URL}/api/scrape`,
      { platforms: [platform] },
      {
        headers: {
          'x-api-key': SCRAPE_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 300000 // 5 minutes timeout
      }
    );
    
    const duration = (Date.now() - startTime) / 1000;
    const responseData = response.data;
    
    // Extract metrics from response
    const result: ScrapeResult = {
      platform,
      duration,
      response: responseData,
      timestamp,
      raw: responseData.raw || responseData.jobs,
      filtered: responseData.filtered,
      upserted: responseData.upserted || responseData.inserted,
      updated: responseData.updated,
      errors: responseData.errors?.length || 0,
      jobs: responseData.jobs,
      inserted: responseData.inserted
    };
    
    // Log compact funnel line
    const metrics = [
      `raw=${result.raw || 0}`,
      result.filtered ? `filtered=${result.filtered}` : null,
      `upserted=${result.upserted || 0}`,
      result.updated ? `updated=${result.updated}` : null,
      `errors=${result.errors}`,
      `duration=${duration.toFixed(1)}s`
    ].filter(Boolean).join(' ');
    
    console.log(`📊 PLATFORM=${platform} ${metrics}`);
    
    // Save full JSON result
    const filename = `${timestamp.replace(/[:.]/g, '-')}-${platform}.json`;
    const filepath = path.join(process.cwd(), 'tmp', 'scrape-results', filename);
    fs.writeFileSync(filepath, JSON.stringify(responseData, null, 2));
    console.log(`💾 Saved result to: ${filename}`);
    
    return result;
    
  } catch (error: any) {
    const duration = (Date.now() - startTime) / 1000;
    console.error(`❌ PLATFORM=${platform} FAILED duration=${duration.toFixed(1)}s`);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    
    return {
      platform,
      duration,
      response: { error: error.message },
      timestamp,
      raw: 0,
      upserted: 0,
      errors: 1
    };
  }
}

async function getDatabaseStats(platform: string): Promise<DatabaseStats> {
  console.log(`\n📊 Database stats for ${platform}:`);
  
  // Total jobs
  const { data: totalData } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('source', platform);
  
  // Unique hashes - using a simple query instead of RPC
  const { data: allJobHashes } = await supabase
    .from('jobs')
    .select('job_hash')
    .eq('source', platform)
    .not('job_hash', 'is', null);
  
  const uniqueHashes = new Set((allJobHashes || []).map(row => row.job_hash));
  const unique_hashes = uniqueHashes.size;
  
  // Last hour
  const { data: lastHourData } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('source', platform)
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString());
  
  // Missing posted_at
  const { data: missingPostedData } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('source', platform)
    .is('posted_at', null);
  
  // Top locations
  const { data: locationsData } = await supabase
    .from('jobs')
    .select('location')
    .eq('source', platform)
    .not('location', 'is', null);
  
  // Count locations manually since Supabase doesn't support GROUP BY with count
  const locationCounts = (locationsData || []).reduce((acc: Record<string, number>, row) => {
    const loc = row.location || 'Unknown';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {});
  
  const topLocations = Object.entries(locationCounts)
    .map(([location, c]) => ({ location, c: c as number }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 5);
  
  // Latest jobs
  const { data: latestJobs } = await supabase
    .from('jobs')
    .select('title, company, job_url, posted_at')
    .eq('source', platform)
    .order('created_at', { ascending: false })
    .limit(5);
  
  const total = totalData?.length || 0;
  const last_hour = lastHourData?.length || 0;
  const missing_posted_at = missingPostedData?.length || 0;
  const duplicates = Math.max(0, total - unique_hashes);
  
  const stats: DatabaseStats = {
    total,
    unique_hashes,
    last_hour,
    missing_posted_at,
    duplicates,
    top_locations: topLocations,
    latest_jobs: latestJobs || []
  };
  
  // Print stats table
  console.log(`┌─────────────────────┬──────────┐`);
  console.log(`│ Metric              │ Count    │`);
  console.log(`├─────────────────────┼──────────┤`);
  console.log(`│ Total jobs          │ ${total.toString().padStart(8)} │`);
  console.log(`│ Unique hashes       │ ${unique_hashes.toString().padStart(8)} │`);
  console.log(`│ Last hour           │ ${last_hour.toString().padStart(8)} │`);
  console.log(`│ Missing posted_at   │ ${missing_posted_at.toString().padStart(8)} │`);
  console.log(`│ Duplicates          │ ${duplicates.toString().padStart(8)} │`);
  console.log(`└─────────────────────┴──────────┘`);
  
  // Top locations
  if (topLocations.length > 0) {
    console.log(`\nTop locations:`);
    topLocations.forEach(({ location, c }) => {
      console.log(`  ${location}: ${c}`);
    });
  }
  
  // Latest jobs
  if (latestJobs && latestJobs.length > 0) {
    console.log(`\nLatest 5 jobs:`);
    latestJobs.forEach((job, i) => {
      console.log(`  ${i + 1}. ${job.title} @ ${job.company}`);
      console.log(`     Posted: ${job.posted_at || 'Unknown'}`);
      console.log(`     URL: ${job.job_url?.substring(0, 60)}...`);
    });
  }
  
  return stats;
}

function checkThresholds(platform: string, stats: DatabaseStats, scrapeResult: ScrapeResult): void {
  console.log(`\n🔍 Threshold checks for ${platform}:`);
  
  // Jobs > 0
  const hasJobs = stats.total > 0;
  console.log(`  ✅ Has jobs: ${hasJobs ? 'PASS' : '❌ FAIL'} (${stats.total})`);
  
  // Duplicates < 5%
  const duplicateRate = stats.total > 0 ? (stats.duplicates / stats.total) * 100 : 0;
  const duplicatesOk = duplicateRate < 5;
  console.log(`  ${duplicatesOk ? '✅' : '⚠️'} Duplicates: ${duplicatesOk ? 'PASS' : 'WARN'} (${duplicateRate.toFixed(1)}%)`);
  
  // Missing posted_at < 10%
  const missingRate = stats.total > 0 ? (stats.missing_posted_at / stats.total) * 100 : 0;
  const missingOk = missingRate < 10;
  console.log(`  ${missingOk ? '✅' : '⚠️'} Missing posted_at: ${missingOk ? 'PASS' : 'WARN'} (${missingRate.toFixed(1)}%)`);
  
  // Last hour > 0 (if we just scraped)
  const recentActivity = stats.last_hour > 0;
  console.log(`  ${recentActivity ? '✅' : '⚠️'} Recent activity: ${recentActivity ? 'PASS' : 'WARN'} (${stats.last_hour} in last hour)`);
}

async function main(): Promise<void> {
  console.log(`🎯 JobPing Scraper Smoke Test`);
  console.log(`🌐 Target: ${BASE_URL}`);
  console.log(`🗂️ Platforms: ${PLATFORMS.join(', ')}`);
  
  await ensureResultsDir();
  
  const results: ScrapeResult[] = [];
  const allStats: Record<string, DatabaseStats> = {};
  
  // Process each platform
  for (const platform of PLATFORMS) {
    const result = await scrapePlatform(platform);
    results.push(result);
    
    if (result.errors === 0) {
      const stats = await getDatabaseStats(platform);
      allStats[platform] = stats;
      checkThresholds(platform, stats, result);
    }
    
    // Small delay between platforms
    if (PLATFORMS.indexOf(platform) < PLATFORMS.length - 1) {
      console.log('\n⏱️ Waiting 2 seconds before next platform...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Final summary
  console.log(`\n📋 FINAL SUMMARY`);
  console.log(`===============`);
  
  const totalInserted = results.reduce((sum, r) => sum + (r.upserted || 0), 0);
  const totalUpdated = results.reduce((sum, r) => sum + (r.updated || 0), 0);
  const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);
  
  console.log(`Total inserted this run: ${totalInserted}`);
  console.log(`Total updated this run: ${totalUpdated}`);
  console.log(`Total errors: ${totalErrors}`);
  
  // Platforms with zero results
  const zeroPlatforms = results.filter(r => (r.upserted || 0) === 0).map(r => r.platform);
  if (zeroPlatforms.length > 0) {
    console.log(`\n⚠️ Platforms with zero results: ${zeroPlatforms.join(', ')}`);
  }
  
  // High missing posted_at warnings
  const highMissingPlatforms = Object.entries(allStats)
    .filter(([_, stats]) => stats.total > 0 && (stats.missing_posted_at / stats.total) >= 0.1)
    .map(([platform, stats]) => `${platform} (${((stats.missing_posted_at / stats.total) * 100).toFixed(1)}%)`);
  
  if (highMissingPlatforms.length > 0) {
    console.log(`\n⚠️ High missing posted_at: ${highMissingPlatforms.join(', ')}`);
  }
  
  // Next actions
  console.log(`\n🚀 Next actions:`);
  if (zeroPlatforms.length > 0) {
    console.log(`   - Investigate zero-result platforms: ${zeroPlatforms.join(', ')}`);
  }
  if (highMissingPlatforms.length > 0) {
    console.log(`   - Review posted_at extraction for: ${highMissingPlatforms.map(p => p.split(' ')[0]).join(', ')}`);
  }
  if (totalErrors > 0) {
    console.log(`   - Check error logs for failed requests`);
  }
  if (zeroPlatforms.length === 0 && highMissingPlatforms.length === 0 && totalErrors === 0) {
    console.log(`   - All platforms look healthy! 🎉`);
  }
  
  console.log(`\n📁 Results saved in ./tmp/scrape-results/`);
  console.log(`✅ Smoke test completed`);
}

// Run the main function and handle errors
main().catch((error) => {
  console.error('\n💥 Smoke test failed:');
  console.error(error);
  process.exit(1);
});
