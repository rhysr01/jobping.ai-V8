#!/usr/bin/env node

/**
 * 🧪 JOBSPY QUICK TEST - Compare volume between old vs improved terms
 * - Builds on existing JobSpy helpers (same parsing and python detection patterns)
 * - Runs a small set of terms across 2-3 cities
 * - Prints totals and % improvement
 */

const { spawnSync } = require('child_process');

function findPython() {
  const candidates = ['python3.11', 'python3.12', 'python3.10', 'python3', 'python'];
  for (const py of candidates) {
    try {
      const test = spawnSync(py, ['-c', 'import jobspy; print("OK")'], { encoding: 'utf8', stdio: 'pipe' });
      if (test.status === 0) return py;
    } catch (_) {}
  }
  throw new Error('No Python with JobSpy found');
}

function parseCsv(csv) {
  const trimmed = (csv || '').trim();
  if (!trimmed) return [];
  const lines = trimmed.split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (values[i] || '').replace(/^"|"$/g, '').trim(); });
    return obj;
  });
}

async function testCity(city, country, pythonCmd) {
  console.log(`\n🧪 TESTING ${city.toUpperCase()}`);
  console.log('================');

  const oldTerms = ['graduate', 'internship', 'junior', 'entry level'];

  const newTerms = city === 'London' ? [
    'graduate programme', 'graduate analyst', 'management trainee',
    'investment banking graduate', 'consulting graduate', 'finance graduate',
    'summer internship', 'rotational program'
  ] : city === 'Dublin' ? [
    'graduate programme', 'graduate analyst', 'finance graduate',
    'tech graduate', 'consulting graduate', 'management trainee'
  ] : [
    'graduate program', 'graduate analyst', 'trainee program',
    'junior analyst', 'entry level analyst', 'management trainee'
  ];

  // OLD approach (smaller, generic)
  console.log(`\n🔴 OLD APPROACH (${oldTerms.length} generic terms):`);
  let oldTotal = 0;
  for (const [i, term] of oldTerms.slice(0, 2).entries()) {
    try {
      console.log(`   ${i + 1}. "${term}"`);
      const py = spawnSync(pythonCmd, ['-c', `
from jobspy import scrape_jobs
df = scrape_jobs(
    site_name=['indeed'],
    search_term='''${term.replace(/'/g, "''")}''',
    location='''${city}''',
    country_indeed='''${country}''',
    results_wanted=50,
    hours_old=168
)
print(len(df))
`], { encoding: 'utf8', timeout: 30000 });
      if (py.status === 0) {
        const count = parseInt((py.stdout || '').trim(), 10) || 0;
        oldTotal += count;
        console.log(`      → ${count} jobs`);
      } else {
        console.log(`      → Error: ${(py.stderr || '').trim() || 'Failed'}`);
      }
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.log(`      → Error: ${err.message}`);
    }
  }

  // NEW approach (specific, multiple sites, larger window)
  console.log(`\n🟢 NEW APPROACH (${newTerms.length} specific terms):`);
  let newTotal = 0;
  for (const [i, term] of newTerms.slice(0, 3).entries()) {
    try {
      console.log(`   ${i + 1}. "${term}"`);
      const py = spawnSync(pythonCmd, ['-c', `
from jobspy import scrape_jobs
df = scrape_jobs(
    site_name=['indeed','linkedin'],
    search_term='''${term.replace(/'/g, "''")}''',
    location='''${city}''',
    country_indeed='''${country}''',
    results_wanted=80,
    hours_old=336,
    sort='date'
)
print(len(df))
`], { encoding: 'utf8', timeout: 40000 });
      if (py.status === 0) {
        const count = parseInt((py.stdout || '').trim(), 10) || 0;
        newTotal += count;
        console.log(`      → ${count} jobs`);
      } else {
        console.log(`      → Error: ${(py.stderr || '').trim() || 'Failed'}`);
      }
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      console.log(`      → Error: ${err.message}`);
    }
  }

  const pct = oldTotal === 0 ? (newTotal > 0 ? 100 : 0) : Math.round(((newTotal - oldTotal) / Math.max(1, oldTotal)) * 100);
  console.log(`\n📊 ${city} COMPARISON:`);
  console.log(`   Old total: ${oldTotal}`);
  console.log(`   New total: ${newTotal}`);
  console.log(`   Improvement: ${pct}%`);
  return { city, oldTotal, newTotal, pct };
}

async function main() {
  console.log('🧪 JOBSPY QUICK TEST - Volume comparison');
  console.log('========================================');
  const pythonCmd = findPython();
  console.log(`🐍 Using: ${pythonCmd}`);

  const cities = [
    ['London', 'united kingdom'],
    ['Dublin', 'ireland'],
    ['Amsterdam', 'netherlands']
  ];

  const results = [];
  for (const [city, country] of cities) {
    const r = await testCity(city, country, pythonCmd);
    results.push(r);
  }

  const sum = arr => arr.reduce((a, b) => a + b, 0);
  const oldSum = sum(results.map(r => r.oldTotal));
  const newSum = sum(results.map(r => r.newTotal));
  const pct = oldSum === 0 ? (newSum > 0 ? 100 : 0) : Math.round(((newSum - oldSum) / Math.max(1, oldSum)) * 100);

  console.log('\n==============================');
  console.log('📈 OVERALL COMPARISON (ALL CITIES)');
  console.log('==============================');
  console.log(`Old total: ${oldSum}`);
  console.log(`New total: ${newSum}`);
  console.log(`Improvement: ${pct}%`);
}

main().catch(err => { console.error('💥 Quick test failed:', err.message || err); process.exit(1); });


