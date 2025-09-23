#!/usr/bin/env node

/**
 * JobSpy Diagnostic Tool
 * Quickly diagnose JobSpy installation and configuration issues
 */

const { spawnSync } = require('child_process');

console.log('🔧 JOBSPY DIAGNOSTIC TOOL');
console.log('========================');
console.log('');

function runCommand(cmd, args = []) {
  try {
    const result = spawnSync(cmd, args, { 
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 10000
    });
    return {
      success: result.status === 0,
      stdout: result.stdout?.trim() || '',
      stderr: result.stderr?.trim() || '',
      error: result.error
    };
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: '',
      error: error.message
    };
  }
}

// 1. Check Python installations
console.log('🐍 1. PYTHON INSTALLATIONS');
console.log('==========================');

const pythonCandidates = ['python3.11', 'python3.12', 'python3.10', 'python3', 'python'];
let workingPython = null;

for (const py of pythonCandidates) {
  const version = runCommand(py, ['--version']);
  if (version.success) {
    console.log(`✅ ${py}: ${version.stdout || version.stderr}`);
    
    // Check if this Python has JobSpy
    const jobspyCheck = runCommand(py, ['-c', 'import jobspy; print(jobspy.__version__)']);
    if (jobspyCheck.success) {
      console.log(`   🟢 JobSpy installed: v${jobspyCheck.stdout}`);
      if (!workingPython) workingPython = py;
    } else {
      console.log(`   🔴 JobSpy NOT installed`);
    }
  } else {
    console.log(`❌ ${py}: not found`);
  }
}

console.log('');

// 2. Show installation commands
console.log('🛠️ 2. INSTALLATION COMMANDS');
console.log('===========================');

if (!workingPython) {
  console.log('❌ No Python with JobSpy found!');
  console.log('');
  console.log('Install JobSpy with one of these commands:');
  
  for (const py of pythonCandidates) {
    const check = runCommand(py, ['--version']);
    if (check.success) {
      console.log(`   ${py} -m pip install python-jobspy`);
    }
  }
  
  console.log('');
  console.log('Alternative installation methods:');
  console.log('   pip3 install python-jobspy');
  console.log('   pip install python-jobspy');
  
} else {
  console.log(`✅ Working Python found: ${workingPython}`);
  console.log('JobSpy is properly installed!');
}

console.log('');

// 3. Test JobSpy functionality
console.log('🧪 3. JOBSPY FUNCTIONALITY TEST');
console.log('==============================');

if (workingPython) {
  console.log(`Testing with ${workingPython}...`);
  
  const testScript = `
from jobspy import scrape_jobs
import pandas as pd

try:
    print("Testing JobSpy basic functionality...")
    df = scrape_jobs(
        site_name=['indeed'],
        search_term='developer',
        location='London, UK',
        results_wanted=2,
        hours_old=168
    )
    print(f"✅ Test successful! Found {len(df)} jobs")
    if len(df) > 0:
        print("Sample columns:", list(df.columns)[:5])
except Exception as e:
    print(f"❌ Test failed: {e}")
    import traceback
    traceback.print_exc()
`;

  const test = runCommand(workingPython, ['-c', testScript]);
  if (test.success) {
    console.log('✅ JobSpy functionality test PASSED');
    console.log('Output:', test.stdout);
  } else {
    console.log('❌ JobSpy functionality test FAILED');
    console.log('Error:', test.stderr);
  }
} else {
  console.log('❌ Skipping test - no working Python with JobSpy found');
}

console.log('');

// 4. Environment check
console.log('🌍 4. ENVIRONMENT CHECK');
console.log('=====================');

// Check if Supabase env vars are set
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
];

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Set (${process.env[envVar].substring(0, 20)}...)`);
  } else {
    console.log(`❌ ${envVar}: Not set`);
  }
}

console.log('');

// 5. File check
console.log('📁 5. FILE CHECK');
console.log('===============');

const requiredFiles = [
  'scripts/jobspy-save.cjs',
  'scripts/jobspy-integration.js'
];

const fs = require('fs');

for (const file of requiredFiles) {
  try {
    const stats = fs.statSync(file);
    console.log(`✅ ${file}: Exists (${stats.size} bytes)`);
  } catch (error) {
    console.log(`❌ ${file}: Not found`);
  }
}

console.log('');

// 6. Summary and recommendations
console.log('📋 6. SUMMARY & NEXT STEPS');
console.log('=========================');

if (workingPython) {
  console.log('✅ DIAGNOSIS: JobSpy is working correctly!');
  console.log('');
  console.log('Ready to run:');
  console.log('   node scripts/jobspy-save.cjs');
  console.log('');
  console.log('Or test with small sample:');
  console.log(`   ${workingPython} -c "from jobspy import scrape_jobs; print(scrape_jobs(site_name=['indeed'], search_term='developer', location='London', results_wanted=3))"`);
} else {
  console.log('❌ DIAGNOSIS: JobSpy installation needed');
  console.log('');
  console.log('Action required:');
  console.log('1. Install Python if needed');
  console.log('2. Install JobSpy: python3 -m pip install python-jobspy');
  console.log('3. Test: python3 -c "import jobspy; print(\'OK\')"');
  console.log('4. Re-run this diagnostic');
}

console.log('');
console.log('🎯 For help:');
console.log('   JobSpy docs: https://github.com/speedyapply/JobSpy');
console.log('   Python install: https://python.org');
