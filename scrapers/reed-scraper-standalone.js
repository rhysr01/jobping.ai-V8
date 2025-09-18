"use strict";
// Reed.co.uk Scraper (API v1.0) - UK + Dublin early-career focus
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const { validateJob, convertToDatabaseFormat, classifyEarlyCareer, parseLocation } = require('./utils.js');

const REED_API = 'https://www.reed.co.uk/api/1.0/search';
const LOCATIONS = [
  'London',
  'Manchester',
  'Birmingham',
  'Edinburgh',
  'Dublin'
];

const EARLY_TERMS = [
  'graduate', 'entry level', 'junior', 'trainee', 'intern', 'internship'
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function buildAuthHeader() {
  const key = process.env.REED_API_KEY || '';
  const token = Buffer.from(`${key}:`).toString('base64');
  return `Basic ${token}`;
}

async function fetchReedPage(params) {
  const headers = {
    'Authorization': buildAuthHeader(),
    'Accept': 'application/json',
    'User-Agent': 'JobPing/1.0 (+https://jobping.com)'
  };
  const resp = await axios.get(REED_API, { params, headers, timeout: 20000 });
  return resp.data;
}

function toIngestJob(reedJob) {
  return {
    title: reedJob.jobTitle || '',
    company: reedJob.employerName || '',
    location: reedJob.locationName || '',
    description: reedJob.jobDescription || '',
    url: reedJob.jobUrl || '',
    posted_at: reedJob.date || new Date().toISOString(),
    source: 'reed'
  };
}

async function scrapeLocation(location) {
  const jobs = [];
  // Reed pagination: resultsToTake, resultsToSkip
  const resultsPerPage = 50;
  for (const term of EARLY_TERMS) {
    for (let page = 0; page < 3; page++) {
      const params = {
        keywords: term,
        locationName: location,
        resultsToTake: resultsPerPage,
        resultsToSkip: page * resultsPerPage,
        distanceFromLocation: 15,
        permanent: true,
        contract: true,
        partTime: true,
        fullTime: true,
        minimumSalary: 0,
        maximumSalary: 0,
        postedByRecruitmentAgency: true,
        postedByDirectEmployer: true,
      };
      try {
        const data = await fetchReedPage(params);
        const items = Array.isArray(data.results) ? data.results : [];
        if (!items.length) break;
        for (const r of items) {
          const j = toIngestJob(r);
          // Policy: exclude remote
          const { isRemote, isEU } = parseLocation(j.location);
          if (isRemote) continue;
          // EU/UK/IE focus
          if (!isEU && !j.location.toLowerCase().includes('dublin')) continue;
          // Early-career (allow by intent terms too)
          if (!(classifyEarlyCareer(j) || EARLY_TERMS.some(t => j.title.toLowerCase().includes(t)))) continue;
          if (validateJob(j).valid) {
            jobs.push(j);
          }
        }
        await sleep(1000);
      } catch (e) {
        if (e.response && e.response.status === 429) {
          await sleep(6000);
          page--; // retry same page
          continue;
        }
        console.warn(`Reed error for ${location} ${term}:`, e.message);
        break;
      }
    }
  }
  return jobs;
}

async function saveJobsToDB(jobs) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  const supabase = createClient(url, key);
  const dbJobs = jobs.map(convertToDatabaseFormat);
  const { data, error } = await supabase
    .from('jobs')
    .upsert(dbJobs, { onConflict: 'dedupe_key', ignoreDuplicates: false });
  if (error) throw error;
  return Array.isArray(data) ? data.length : dbJobs.length;
}

(async () => {
  if (!process.env.REED_API_KEY) {
    console.log('⚠️ REED_API_KEY missing; skipping Reed run');
    process.exit(0);
  }
  const all = [];
  for (const loc of LOCATIONS) {
    console.log(`📍 Reed: ${loc}`);
    const jobs = await scrapeLocation(loc);
    console.log(`  ➜ ${loc}: ${jobs.length} jobs`);
    all.push(...jobs);
    await sleep(1000);
  }
  // Deduplicate
  const seen = new Set();
  const unique = all.filter(j => {
    const key = `${j.title.toLowerCase()}|${j.company.toLowerCase()}|${j.location.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  console.log(`📊 Reed total unique: ${unique.length}`);
  let inserted = 0;
  try {
    inserted = await saveJobsToDB(unique);
  } catch (e) {
    console.error('❌ Reed DB save failed:', e.message);
  }
  console.log(`✅ Reed: ${inserted} jobs saved to database`);
})().catch(e => { console.error('❌ Reed fatal:', e.message); process.exit(1); });


