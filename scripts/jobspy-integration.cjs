#!/usr/bin/env node

/**
 * JobSpy Integration Test and Quick Start Script
 * - Verifies Python
 * - Verifies/installs JobSpy (python-jobspy)
 * - Runs a sample scrape and prints a preview
 */

const { spawn } = require('child_process');

console.log('🚀 JOBSPY INTEGRATION TEST\n==========================\n');

async function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'pipe', ...opts });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('close', code => {
      resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
    child.on('error', reject);
  });
}

async function detectPython() {
  console.log('🐍 Checking Python installation...');
  // Prefer python3.11 if available (JobSpy requires >=3.10)
  const candidates = ['python3.11', 'python3', 'python'];
  let py = null;
  let res = null;
  for (const c of candidates) {
    const r = await run(c, ['--version']);
    if (r.code === 0) {
      py = c;
      res = r;
      break;
    }
  }
  if (!py) throw new Error('No suitable Python found (tried python3.11, python3, python)');
  console.log(`✅ Using ${py}: ${res.stdout || res.stderr}`);
  return py;
}

async function checkJobSpy(python) {
  console.log('📦 Checking JobSpy installation...');
  const res = await run(python, ['-m', 'jobspy', '--help']);
  if (res.code === 0) {
    console.log('✅ JobSpy installed and accessible');
    return true;
  }
  console.log('❌ JobSpy not found, installing...');
  await installJobSpy(python);
  return true;
}

async function installJobSpy(python) {
  console.log('📥 Installing JobSpy (python-jobspy)...');
  // Try pip tied to this python first
  let res = await run(python, ['-m', 'pip', 'install', 'python-jobspy']);
  if (res.code === 0) {
    console.log('✅ JobSpy installed successfully');
    return;
  }
  // Fallback to global pip
  console.log('⚠️ python -m pip failed, trying pip');
  res = await run('pip', ['install', 'python-jobspy']);
  if (res.code === 0) {
    console.log('✅ JobSpy installed successfully (via pip)');
    return;
  }
  // Try pip3 as additional fallback
  console.log('⚠️ pip not found or failed, trying pip3');
  res = await run('pip3', ['install', 'python-jobspy']);
  if (res.code === 0) {
    console.log('✅ JobSpy installed successfully (via pip3)');
    return;
  }
  console.error(res.stdout || res.stderr);
  throw new Error('Failed to install JobSpy. Try: python -m pip install python-jobspy');
}

async function runSampleScrape(python) {
  console.log('🧪 Running sample JobSpy scrape (Indeed, Frontend, Amsterdam)...');
  // Minimal sample: small limit to avoid long runs
  const script = `
from jobspy import scrape_jobs
import pandas as pd
try:
  df = scrape_jobs(
    site_name=['indeed'],
    search_term='Frontend Developer',
    location='Amsterdam, Netherlands',
    results_wanted=10,
    hours_old=72
  )
  # Print a compact preview to stdout
  cols = ['title','company','location','job_url']
  cols = [c for c in cols if c in df.columns]
  print(df[cols].head(5).to_csv(index=False))
except Exception as e:
  import sys, traceback
  print('ERROR:' + str(e), file=sys.stderr)
  traceback.print_exc()
  sys.exit(2)
`.trim();

  const res = await run(python, ['-c', script]);
  if (res.code !== 0) {
    console.error('❌ Sample scrape failed');
    if (res.stderr) console.error(res.stderr);
    throw new Error('Sample scrape failed');
  }
  console.log('✅ Sample scrape output (preview):');
  console.log('---------------------------------');
  console.log(res.stdout || '(no rows)');
  console.log('---------------------------------');
}

(async () => {
  try {
    const python = await detectPython();
    await checkJobSpy(python);
    await runSampleScrape(python);
    console.log('🎉 JobSpy integration looks good!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Integration test failed:', err.message || err);
    process.exit(1);
  }
})();


