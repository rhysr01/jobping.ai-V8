#!/usr/bin/env node

const axios = require('axios');

// Test Greenhouse board existence
async function testGreenhouseBoard(boardId) {
  try {
    const response = await axios.get(`https://boards-api.greenhouse.io/v1/boards/${boardId}/jobs`, {
      timeout: 10000,
      headers: { 'Accept': 'application/json' },
      validateStatus: (status) => status < 500 // Accept 404 as a valid response
    });
    
    if (response.status === 404) {
      return { exists: false, error: '404 - Board not found', success: false };
    }
    
    const jobs = response.data?.jobs || [];
    const euJobs = jobs.filter(job => {
      const text = JSON.stringify(job).toLowerCase();
      return /london|dublin|berlin|amsterdam|paris|madrid|stockholm|zurich|copenhagen|vienna|brussels|prague|warsaw|barcelona|milan|rome|lisbon|athens|helsinki|oslo|eu\s|europe|remote.*eu|emea/i.test(text);
    });
    
    const earlyCareerJobs = jobs.filter(job => {
      const text = JSON.stringify(job).toLowerCase();
      return /graduate|intern|entry.level|junior|trainee|apprentice|early.career|campus|new.grad/i.test(text);
    });
    
    return {
      exists: true,
      totalJobs: jobs.length,
      euJobs: euJobs.length,
      earlyCareerJobs: earlyCareerJobs.length,
      success: true
    };
  } catch (error) {
    return {
      exists: false,
      error: error.response?.status || error.message,
      success: false
    };
  }
}

// Test Ashby board existence  
async function testAshbyBoard(boardId) {
  try {
    const response = await axios.get(`https://api.ashbyhq.com/posting-api/job-board/${boardId}`, {
      timeout: 10000,
      headers: { 'Accept': 'application/json' },
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 404) {
      return { exists: false, error: '404 - Board not found', success: false };
    }
    
    const jobs = response.data || [];
    const euJobs = jobs.filter(job => {
      const text = JSON.stringify(job).toLowerCase();
      return /london|dublin|berlin|amsterdam|paris|madrid|stockholm|zurich|copenhagen|vienna|brussels|prague|warsaw|barcelona|milan|rome|lisbon|athens|helsinki|oslo|eu\s|europe|remote.*eu|emea/i.test(text);
    });
    
    const earlyCareerJobs = jobs.filter(job => {
      const text = JSON.stringify(job).toLowerCase();
      return /graduate|intern|entry.level|junior|trainee|apprentice|early.career|campus|new.grad/i.test(text);
    });
    
    return {
      exists: true,
      totalJobs: jobs.length,
      euJobs: euJobs.length,
      earlyCareerJobs: earlyCareerJobs.length,
      success: true
    };
  } catch (error) {
    return {
      exists: false,
      error: error.response?.status || error.message,
      success: false
    };
  }
}

// Comprehensive list of candidates to verify
const greenhouseCandidates = [
  // Tech companies known to use Greenhouse
  'stripe', 'coinbase', 'airbnb', 'dropbox', 'github', 'gitlab',
  'twilio', 'sendgrid', 'segment', 'asana', 'calendly', 'airtable',
  'webflow', 'retool', 'vercel', 'netlify', 'algolia',
  
  // Fintech companies  
  'wise', 'checkout', 'plaid', 'brex', 'ramp',
  
  // European companies
  'monzo', 'revolut', 'n26', 'adyen', 'mollie', 'zalando',
  'deliveryhero', 'hellofresh', 'getyourguide', 'bookingcom',
  'sumup', 'contentful', 'personio',
  
  // Gaming companies
  'riotgames', 'king', 'supercell', 'rovio', 'ubisoft',
  
  // Consulting (less likely but worth checking)
  'mckinsey', 'bain', 'bcg', 'deloitte', 'pwc', 'ey', 'kpmg',
  
  // Other tech
  'snowflake', 'databricks', 'confluent', 'hashicorp',
  'okta', 'auth0', 'crowdstrike', 'darktrace'
];

const ashbyCandidates = [
  // Known Ashby users
  'anthropic', 'openai', 'scale', 'huggingface',
  'coinbase', 'opensea', 'polygon', 'alchemy',
  'airtable', 'notion', 'linear', 'figma', 'miro',
  'vercel', 'netlify', 'retool', 'planetscale',
  'typeform', 'monday', 'clickup', 'loom',
  'buffer', 'zapier', 'doist', 'calendly',
  
  // Potential Ashby users (newer companies)
  'discord', 'canva', 'figma', 'framer',
  'clerk', 'supabase', 'railway', 'render',
  'fly', 'convex', 'inngest', 'neon',
  
  // AI/ML companies (likely Ashby users)
  'mistral', 'cohere', 'stability', 'replicate',
  'runpod', 'modalcom', 'wandb'
];

async function runVerification() {
  const results = {
    greenhouse: { verified: [], failed: [] },
    ashby: { verified: [], failed: [] }
  };
  
  console.log('🔍 Verifying Greenhouse candidates...\n');
  
  for (const candidate of greenhouseCandidates) {
    process.stdout.write(`Testing ${candidate}... `);
    const result = await testGreenhouseBoard(candidate);
    
    if (result.success && (result.euJobs > 0 || result.earlyCareerJobs > 0)) {
      console.log(`✅ ${result.totalJobs} jobs (${result.euJobs} EU, ${result.earlyCareerJobs} early-career)`);
      results.greenhouse.verified.push({
        boardId: candidate,
        totalJobs: result.totalJobs,
        euJobs: result.euJobs,
        earlyCareerJobs: result.earlyCareerJobs
      });
    } else if (result.success) {
      console.log(`⚠️  ${result.totalJobs} jobs (no EU/early-career matches)`);
      results.greenhouse.failed.push({ boardId: candidate, reason: 'No relevant jobs' });
    } else {
      console.log(`❌ ${result.error}`);
      results.greenhouse.failed.push({ boardId: candidate, reason: result.error });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Be respectful
  }
  
  console.log('\n🔍 Verifying Ashby candidates...\n');
  
  for (const candidate of ashbyCandidates) {
    process.stdout.write(`Testing ${candidate}... `);
    const result = await testAshbyBoard(candidate);
    
    if (result.success && (result.euJobs > 0 || result.earlyCareerJobs > 0)) {
      console.log(`✅ ${result.totalJobs} jobs (${result.euJobs} EU, ${result.earlyCareerJobs} early-career)`);
      results.ashby.verified.push({
        boardId: candidate,
        totalJobs: result.totalJobs,
        euJobs: result.euJobs,
        earlyCareerJobs: result.earlyCareerJobs
      });
    } else if (result.success) {
      console.log(`⚠️  ${result.totalJobs} jobs (no EU/early-career matches)`);
      results.ashby.failed.push({ boardId: candidate, reason: 'No relevant jobs' });
    } else {
      console.log(`❌ ${result.error}`);
      results.ashby.failed.push({ boardId: candidate, reason: result.error });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Be respectful
  }
  
  // Generate summary report
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`\n🌿 GREENHOUSE - ${results.greenhouse.verified.length} verified companies:`);
  results.greenhouse.verified
    .sort((a, b) => (b.euJobs + b.earlyCareerJobs) - (a.euJobs + a.earlyCareerJobs))
    .forEach(company => {
      const score = company.euJobs + company.earlyCareerJobs;
      const priority = score >= 10 ? 'HIGH' : score >= 5 ? 'MED' : 'LOW';
      console.log(`  ${priority.padEnd(4)} | ${company.boardId.padEnd(20)} | ${company.totalJobs.toString().padStart(3)} total | ${company.euJobs.toString().padStart(2)} EU | ${company.earlyCareerJobs.toString().padStart(2)} early-career`);
    });
  
  console.log(`\n🚀 ASHBY - ${results.ashby.verified.length} verified companies:`);
  results.ashby.verified
    .sort((a, b) => (b.euJobs + b.earlyCareerJobs) - (a.euJobs + a.earlyCareerJobs))
    .forEach(company => {
      const score = company.euJobs + company.earlyCareerJobs;
      const priority = score >= 10 ? 'HIGH' : score >= 5 ? 'MED' : 'LOW';
      console.log(`  ${priority.padEnd(4)} | ${company.boardId.padEnd(20)} | ${company.totalJobs.toString().padStart(3)} total | ${company.euJobs.toString().padStart(2)} EU | ${company.earlyCareerJobs.toString().padStart(2)} early-career`);
    });
  
  // Generate configuration files
  generateConfig(results);
}

function generateConfig(results) {
  console.log('\n📝 Generating curated configuration files...');
  
  // Generate Greenhouse config
  const greenhouseConfig = results.greenhouse.verified
    .filter(company => company.euJobs > 0 || company.earlyCareerJobs > 0)
    .map(company => `"${company.boardId}"`)
    .join(',\n  ');
  
  const greenhouseFile = `// ✅ VERIFIED Greenhouse Boards - EU Early-Career Focus
// Generated: ${new Date().toISOString()}
// Total verified: ${results.greenhouse.verified.length} companies

export const VERIFIED_GREENHOUSE_BOARDS = [
  ${greenhouseConfig}
];

// Companies ranked by relevance (EU + Early-Career jobs)
export const GREENHOUSE_PRIORITY = {
  high: [
    ${results.greenhouse.verified
      .filter(c => (c.euJobs + c.earlyCareerJobs) >= 10)
      .map(c => `"${c.boardId}"`)
      .join(',\n    ')}
  ],
  medium: [
    ${results.greenhouse.verified
      .filter(c => (c.euJobs + c.earlyCareerJobs) >= 5 && (c.euJobs + c.earlyCareerJobs) < 10)
      .map(c => `"${c.boardId}"`)
      .join(',\n    ')}
  ],
  low: [
    ${results.greenhouse.verified
      .filter(c => (c.euJobs + c.earlyCareerJobs) < 5 && (c.euJobs + c.earlyCareerJobs) > 0)
      .map(c => `"${c.boardId}"`)
      .join(',\n    ')}
  ]
};`;

  // Generate Ashby config
  const ashbyConfig = results.ashby.verified
    .filter(company => company.euJobs > 0 || company.earlyCareerJobs > 0)
    .map(company => {
      const score = company.euJobs + company.earlyCareerJobs;
      const priority = score >= 10 ? 'high' : score >= 5 ? 'medium' : 'low';
      return `  { name: '${company.boardId}', boardId: '${company.boardId}', priority: '${priority}', euOffices: ['Remote'] }`;
    })
    .join(',\n');

  const ashbyFile = `// ✅ VERIFIED Ashby Companies - EU Early-Career Focus  
// Generated: ${new Date().toISOString()}
// Total verified: ${results.ashby.verified.length} companies

export const VERIFIED_ASHBY_COMPANIES = [
${ashbyConfig}
];`;

  // Write files
  require('fs').writeFileSync('/Users/rhysrowlands/jobping/scrapers/config/verified-greenhouse.js', greenhouseFile);
  require('fs').writeFileSync('/Users/rhysrowlands/jobping/scrapers/config/verified-ashby.js', ashbyFile);
  
  console.log('✅ Generated: scrapers/config/verified-greenhouse.js');
  console.log('✅ Generated: scrapers/config/verified-ashby.js');
  
  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Review the generated config files');
  console.log('2. Update your scrapers to use the verified lists');
  console.log('3. Test the high-priority companies first');
  console.log('4. Monitor job volume improvements');
}

runVerification().catch(console.error);
