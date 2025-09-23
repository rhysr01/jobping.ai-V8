#!/usr/bin/env node

/**
 * JobSpy Preview Script - Test quality before saving to database
 * Shows exactly what jobs will be collected and their quality
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
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  return lines.slice(1).map(line => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (values[i] || '').replace(/^"|"$/g, '').trim(); });
    return obj;
  });
}

function hasRequiredFields(job) {
  return {
    title: job.title && job.title.trim().length > 3,
    company: job.company && job.company.trim().length > 1,
    job_url: job.job_url && (job.job_url.startsWith('http') || job.job_url.includes('.')),
    location: job.location && job.location.trim().length > 3,
    description: job.description && job.description.trim().length > 50,
  };
}

function isEarlyCareerJob(job) {
  const title = (job.title || '').toLowerCase();
  const description = (job.description || '').toLowerCase();
  const fullText = `${title} ${description}`;
  const earlyCareerTerms = [
    'graduate program', 'graduate programme', 'grad program', 'graduate scheme',
    'graduate trainee', 'graduate role', 'new graduate', 'recent graduate',
    'entry level', 'entry-level', 'junior', 'trainee', 'associate',
    'intern', 'internship', 'apprentice', 'apprenticeship',
    '0-2 years', '1-3 years', 'no experience required', 'no experience necessary',
    'fresh graduate', 'new grad', 'campus hire', 'university hire'
  ];
  const seniorTerms = [
    'senior', 'lead', 'principal', 'director', 'manager', 'head of',
    'chief', 'vp', 'vice president', 'architect', 'expert', 'specialist',
    '5+ years', '7+ years', '10+ years', 'experienced professional',
    'minimum 3 years', 'minimum 5 years', 'at least 3 years'
  ];
  const hasEarly = earlyCareerTerms.some(term => fullText.includes(term));
  const hasSenior = seniorTerms.some(term => fullText.includes(term));
  return hasEarly && !hasSenior;
}

function analyzeJob(job, index) {
  console.log(`\n${index + 1}. ${job.title} at ${job.company}`);
  console.log(`   Location: ${job.location}`);
  console.log(`   URL: ${job.job_url ? '✅' : '❌'} ${job.job_url || 'Missing'}`);
  const fields = hasRequiredFields(job);
  const fieldStatus = Object.entries(fields).map(([k, v]) => `${k}:${v ? '✅' : '❌'}`).join(' ');
  console.log(`   Fields: ${fieldStatus}`);
  const early = isEarlyCareerJob(job);
  console.log(`   Early Career: ${early ? '✅' : '❌'}`);
  if (job.description && job.description.length > 100) {
    console.log(`   Description: ${job.description.substring(0, 100)}...`);
  }
  const allValid = Object.values(fields).every(Boolean);
  const overall = allValid && early ? '✅ HIGH QUALITY' : '❌ WOULD BE REJECTED';
  console.log(`   Overall: ${overall}`);
  return allValid && early;
}

async function main() {
  console.log('🔍 JOBSPY PREVIEW - Test Job Quality');
  console.log('===================================');
  const pythonCmd = findPython();
  console.log(`🐍 Using: ${pythonCmd}\n`);

  const testCity = { city: 'London', country: 'united kingdom', fullLocation: 'London, United Kingdom' };
  const testTerm = 'graduate program';
  console.log(`🧪 Testing: "${testTerm}" in ${testCity.city}`);
  console.log('This will show you exactly what quality jobs would be found...\n');

  const sites = ['linkedin'];
  const py = spawnSync(pythonCmd, ['-c', `
import sys
from jobspy import scrape_jobs
import pandas as pd
try:
    print("🔄 Running JobSpy search...", file=sys.stderr)
    df = scrape_jobs(
        site_name=${JSON.stringify(sites)},
        search_term='''${testTerm}''',
        location='''${testCity.fullLocation}''',
        country_indeed='''${testCity.country}''',
        results_wanted=12,
        hours_old=672,
        distance=25,
        job_type='fulltime'
    )
    if len(df) == 0:
        print("title,company,location,job_url,description,date_posted")
    else:
        required_cols = ['title','company','location','job_url','description','date_posted']
        available = [c for c in required_cols if c in df.columns]
        print(df[available].to_csv(index=False))
except Exception as e:
    import sys
    print(f"ERROR: {str(e)}", file=sys.stderr)
    sys.exit(1)
`], { encoding: 'utf8', timeout: 90000 });

  if (py.status !== 0) {
    console.error('❌ JobSpy failed:', py.stderr || py.stdout);
    process.exit(1);
  }
  const jobs = parseCsv(py.stdout);
  console.log(`📊 Found ${jobs.length} raw jobs from JobSpy`);
  console.log('\n📋 DETAILED JOB ANALYSIS:');
  console.log('========================');
  let quality = 0;
  jobs.forEach((job, idx) => { if (analyzeJob(job, idx)) quality++; });
  console.log('\n📈 SUMMARY:');
  console.log('===========');
  console.log(`Total jobs scraped: ${jobs.length}`);
  console.log(`High quality jobs: ${quality}`);
  console.log(`Quality rate: ${jobs.length ? Math.round((quality/jobs.length)*100) : 0}%`);
}

main().catch(e => { console.error('💥 Preview failed:', e.message); process.exit(1); });


