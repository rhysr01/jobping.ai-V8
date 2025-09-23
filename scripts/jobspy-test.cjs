#!/usr/bin/env node

/**
 * 🧪 JOBSPY ENHANCEMENT TEST - Quick Volume Comparison
 * 
 * Tests just 2 cities with both old and new approaches to show improvement
 */

const { spawnSync } = require('child_process');

function parseCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h=>h.trim());
  return lines.slice(1).map(line => {
    const cols = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.trim());
    const obj = {}; headers.forEach((h,i)=> obj[h]=(cols[i]||'').replace(/^"|"$/g,''));
    return obj;
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testSearch(description, searchTerm, city, country, sites, resultsWanted) {
  console.log(`\n🔎 ${description}`);
  console.log(`   Search: "${searchTerm}" in ${city} [${sites.join(',')}] (${resultsWanted} results)`);
  
  const sitesStr = sites.map(s => `'${s}'`).join(',');
  
  const py = spawnSync('/opt/homebrew/bin/python3.11', ['-c', `
from jobspy import scrape_jobs
import pandas as pd
try:
  df = scrape_jobs(
    site_name=[${sitesStr}],
    search_term='''${searchTerm.replace(/'/g, "''")}''',
    location='''${city}''',
    country_indeed='''${country}''',
    results_wanted=${resultsWanted},
    hours_old=504,
    distance=25,
    sort='date'
  )
  if len(df) > 0:
    cols=[c for c in ['title','company','location','job_url'] if c in df.columns]
    print(df[cols].to_csv(index=False))
  else:
    print("title,company,location,job_url")
except Exception as e:
  import sys
  print(f"Error: {e}", file=sys.stderr)
  print("title,company,location,job_url")
`], { encoding: 'utf8', timeout: 30000 });

  if (py.status !== 0) {
    console.log(`   ❌ Failed: ${py.stderr || py.stdout || `status ${py.status}`}`);
    return 0;
  }
  
  const rows = parseCsv(py.stdout);
  console.log(`   ✅ Found: ${rows.length} jobs`);
  
  // Show sample job titles
  if (rows.length > 0) {
    console.log(`   📋 Sample titles:`);
    rows.slice(0, 3).forEach((job, i) => {
      console.log(`      ${i+1}. "${job.title}" at ${job.company}`);
    });
  }
  
  return rows.length;
}

async function main() {
  console.log('🧪 JobSpy Enhancement Test - Volume Comparison\n');
  console.log('Testing Dublin and London with old vs new approaches...\n');
  
  let oldApproachTotal = 0;
  let newApproachTotal = 0;
  
  // ==================
  // OLD APPROACH TEST  
  // ==================
  console.log('📊 OLD APPROACH (Current Script Style):');
  
  // Dublin - old way (specific term, LinkedIn only, 100 results)
  const dublinOld = await testSearch(
    'Dublin - Old Approach',
    'Graduate Programme',
    'Dublin',
    'ireland',
    ['linkedin'],
    100
  );
  oldApproachTotal += dublinOld;
  await sleep(5000);
  
  // London - old way
  const londonOld = await testSearch(
    'London - Old Approach', 
    'Graduate Programme',
    'London',
    'united kingdom',
    ['linkedin'],
    50  // Your current script uses 50 for London
  );
  oldApproachTotal += londonOld;
  await sleep(5000);
  
  console.log(`\n📈 OLD APPROACH TOTAL: ${oldApproachTotal} jobs`);
  
  // ==================
  // NEW APPROACH TEST
  // ==================
  console.log('\n🚀 NEW APPROACH (Enhanced Multi-Site Strategy):');
  
  // Dublin - new way (broad term, multiple sites, 300 results)
  const dublinNew1 = await testSearch(
    'Dublin - Broad Search (LinkedIn + Indeed)',
    'graduate',
    'Dublin', 
    'ireland',
    ['linkedin', 'indeed'],
    300
  );
  newApproachTotal += dublinNew1;
  await sleep(5000);
  
  const dublinNew2 = await testSearch(
    'Dublin - Alternative Sites',
    'junior',
    'Dublin',
    'ireland', 
    ['glassdoor'],
    300
  );
  newApproachTotal += dublinNew2;
  await sleep(5000);
  
  // London - new way
  const londonNew1 = await testSearch(
    'London - Broad Search (LinkedIn + Indeed)',
    'graduate',
    'London',
    'united kingdom',
    ['linkedin', 'indeed'],
    300
  );
  newApproachTotal += londonNew1;
  await sleep(5000);
  
  const londonNew2 = await testSearch(
    'London - Alternative Sites',
    'entry level',
    'London',
    'united kingdom',
    ['glassdoor'],
    300
  );
  newApproachTotal += londonNew2;
  await sleep(5000);
  
  console.log(`\n📈 NEW APPROACH TOTAL: ${newApproachTotal} jobs`);
  
  // ==================
  // COMPARISON RESULTS
  // ==================
  console.log('\n' + '='.repeat(60));
  console.log('🎯 VOLUME COMPARISON RESULTS');
  console.log('='.repeat(60));
  console.log(`OLD APPROACH: ${oldApproachTotal} jobs`);
  console.log(`NEW APPROACH: ${newApproachTotal} jobs`);
  console.log(`IMPROVEMENT:  ${Math.round(newApproachTotal / Math.max(oldApproachTotal, 1) * 10) / 10}x more jobs`);
  console.log(`INCREASE:     +${newApproachTotal - oldApproachTotal} additional jobs`);
  
  if (newApproachTotal > oldApproachTotal * 2) {
    console.log('\n🎉 EXCELLENT! New approach is showing 2x+ improvement!');
    console.log('   Ready to run the full enhanced script on all 9 cities.');
  } else if (newApproachTotal > oldApproachTotal) {
    console.log('\n✅ Good improvement shown. Enhancement is working!');
    console.log('   The full 9-city script should provide even better results.');
  } else {
    console.log('\n⚠️  Enhancement not showing expected improvement in test.');
    console.log('   This could be due to API rate limits or site-specific issues.');
    console.log('   Try running at a different time or check your JobSpy setup.');
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. If results look good, run: node jobspy-enhanced.cjs');
  console.log('2. Monitor the full run for 5-10x improvement across all cities');
  console.log('3. Compare database job counts before/after');
}

main().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
