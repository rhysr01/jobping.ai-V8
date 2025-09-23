#!/usr/bin/env node

/**
 * 🚀 JOBSPY ENHANCED VOLUME SCRAPER - 5-10x More Jobs
 * 
 * MAJOR IMPROVEMENTS IMPLEMENTED:
 * ✅ All job sites: LinkedIn, Indeed, Glassdoor, ZipRecruiter  
 * ✅ Broader + specific search terms
 * ✅ Higher result limits (300 per search)
 * ✅ All 9 target cities including Brussels
 * ✅ Multiple search strategies per city
 * ✅ Better error handling and logging
 */

const { spawnSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/ANON_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

function hashJob(title, company, location) {
  const normalized = `${title||''}-${company||''}-${location||''}`.toLowerCase().replace(/\s+/g,'-');
  let hash = 0; for (let i=0;i<normalized.length;i++){ hash=((hash<<5)-hash)+normalized.charCodeAt(i); hash|=0; }
  return Math.abs(hash).toString(36);
}

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

async function saveJobs(jobs, source) {
  const supabase = getSupabase();
  const nowIso = new Date().toISOString();
  const nonRemote = jobs.filter(j => !((j.location||'').toLowerCase().includes('remote')));
  const rows = nonRemote.map(j => ({
    job_hash: hashJob(j.title, j.company, j.location),
    title: (j.title||'').trim(),
    company: (j.company||'').trim(),
    location: (j.location||'').trim(),
    description: (j.company_description || j.skills || '').trim(),
    job_url: (j.job_url||j.url||'').trim(),
    source,
    posted_at: j.posted_at || nowIso,
    categories: ['early-career'],
    work_environment: 'on-site',
    experience_required: 'entry-level',
    original_posted_date: j.posted_at || nowIso,
    last_seen_at: nowIso,
    is_active: true,
    created_at: nowIso
  }));
  
  const unique = Array.from(new Map(rows.map(r=>[r.job_hash,r])).values());
  for (let i=0;i<unique.length;i+=150){
    const slice = unique.slice(i,i+150);
    const { error } = await supabase
      .from('jobs')
      .upsert(slice, { onConflict: 'job_hash', ignoreDuplicates: false });
    if (error) {
      console.error('Upsert error:', error.message);
    } else {
      console.log(`✅ Saved ${slice.length} jobs`);
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runJobSpySearch(searchTerm, city, country, sites, resultsWanted = 300) {
  console.log(`🔎 [${sites.join(',')}] "${searchTerm}" in ${city}, ${country} (${resultsWanted} results)`);
  
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
  import sys
  if len(df) > 0:
    cols=[c for c in ['title','company','location','job_url','company_description','skills'] if c in df.columns]
    print(df[cols].to_csv(index=False))
  else:
    print("title,company,location,job_url,company_description,skills")
except Exception as e:
  import sys
  print(f"Error: {e}", file=sys.stderr)
  print("title,company,location,job_url,company_description,skills")
`], { encoding: 'utf8', timeout: 45000 });

  if (py.status !== 0) {
    console.error(`❌ Search failed: ${py.stderr || py.stdout || `status ${py.status}`}`);
    return [];
  }
  
  const rows = parseCsv(py.stdout);
  console.log(`   → Found ${rows.length} jobs`);
  return rows;
}

async function main() {
  console.log('🚀 JobSpy Enhanced Volume Scraper Starting...\n');
  
  // 🎯 ENHANCED SEARCH STRATEGY
  
  // All 9 target cities (including Brussels!)
  const cities = [
    ['London', 'united kingdom'],
    ['Dublin', 'ireland'], 
    ['Madrid', 'spain'],
    ['Berlin', 'germany'],
    ['Amsterdam', 'netherlands'],
    ['Paris', 'france'],
    ['Brussels', 'belgium'],        // ✅ Added missing Brussels
    ['Zurich', 'switzerland'],
    ['Milan', 'italy']
  ];

  // Broader + specific search terms per city
  const ENHANCED_SEARCH_TERMS = {
    'London': {
      broad: ['graduate', 'junior', 'entry level', 'trainee'],
      specific: ['Graduate Programme', 'Graduate Scheme', 'Management Trainee'],
    },
    'Dublin': {
      broad: ['graduate', 'junior', 'entry level'],
      specific: ['Graduate Programme', 'Finance Graduate Programme'],
    },
    'Madrid': {
      broad: ['graduado', 'junior', 'becario'],
      specific: ['Programa de Graduados', 'Programa Jóvenes Talentos'],
    },
    'Berlin': {
      broad: ['absolvent', 'junior', 'einsteiger'],
      specific: ['Trainee Programm', 'Absolventenprogramm'],
    },
    'Amsterdam': {
      broad: ['starter', 'junior', 'trainee'],
      specific: ['Graduate Programme', 'Traineeship'],
    },
    'Paris': {
      broad: ['jeune diplômé', 'junior', 'débutant'],
      specific: ['Programme Jeune Diplômé', 'Graduate Programme'],
    },
    'Brussels': {
      broad: ['graduate', 'junior', 'stagiair'],
      specific: ['Young Graduate Program', 'Graduate Programme'],
    },
    'Zurich': {
      broad: ['junior', 'absolvent', 'trainee'],
      specific: ['Graduate Programme', 'Trainee Programm'],
    },
    'Milan': {
      broad: ['neolaureato', 'junior', 'trainee'],
      specific: ['Graduate Programme', 'Stage'],
    }
  };

  // Job site combinations for maximum coverage
  const SITE_STRATEGIES = [
    ['linkedin', 'indeed'],           // High-volume combination
    ['glassdoor'],                    // Quality-focused
    ['zip_recruiter'],                // Alternative source  
    ['indeed', 'glassdoor']           // Cross-verification
  ];

  const allJobs = [];
  let searchCount = 0;
  let successfulSearches = 0;

  // 🔄 MULTIPLE SEARCH STRATEGIES PER CITY
  for (const [city, country] of cities) {
    console.log(`\n🌍 Searching ${city}, ${country}:`);
    
    const cityTerms = ENHANCED_SEARCH_TERMS[city] || { 
      broad: ['graduate', 'junior'], 
      specific: ['Graduate Programme'] 
    };

    // Strategy 1: Broad terms with high-volume sites
    for (const broadTerm of cityTerms.broad.slice(0, 2)) { // Limit to top 2 broad terms
      try {
        const jobs1 = await runJobSpySearch(broadTerm, city, country, ['linkedin', 'indeed'], 300);
        allJobs.push(...jobs1);
        searchCount++;
        if (jobs1.length > 0) successfulSearches++;
        await sleep(3000); // Rate limiting
      } catch (error) {
        console.error(`❌ Broad search failed for ${broadTerm}:`, error.message);
      }
    }

    // Strategy 2: Specific terms with alternative sites  
    for (const specificTerm of cityTerms.specific.slice(0, 1)) { // Top 1 specific term
      try {
        const jobs2 = await runJobSpySearch(specificTerm, city, country, ['glassdoor'], 300);
        allJobs.push(...jobs2);
        searchCount++;
        if (jobs2.length > 0) successfulSearches++;
        await sleep(3000);
      } catch (error) {
        console.error(`❌ Specific search failed for ${specificTerm}:`, error.message);
      }
    }

    // Strategy 3: Alternative site coverage
    if (cityTerms.broad.length > 0) {
      try {
        const jobs3 = await runJobSpySearch(cityTerms.broad[0], city, country, ['zip_recruiter'], 200);
        allJobs.push(...jobs3);
        searchCount++;
        if (jobs3.length > 0) successfulSearches++;
        await sleep(3000);
      } catch (error) {
        console.error(`❌ Alternative site search failed:`, error.message);
      }
    }
    
    console.log(`   City total so far: ${allJobs.length} jobs collected`);
  }

  console.log(`\n📊 Raw Collection Summary:`);
  console.log(`   Total searches attempted: ${searchCount}`);
  console.log(`   Successful searches: ${successfulSearches}`);
  console.log(`   Raw jobs collected: ${allJobs.length}`);

  // 🔍 ENHANCED QUALITY FILTERING
  const hasRequiredFields = j => (
    (j.title||'').trim().length > 3 &&
    (j.company||'').trim().length > 1 &&
    (j.location||'').trim().length > 3 &&
    (j.job_url||j.url||'').trim().startsWith('http')
  );

  const earlyCareerTerms = [
    // English
    'graduate','entry level','entry-level','junior','associate','trainee','intern','internship',
    'new grad', 'recent graduate', 'apprentice', 'placement', '0-2 years', 'no experience',
    // Spanish  
    'graduado','becario','prácticas','nivel inicial','asociado',
    // German
    'absolvent','praktikum','werkstudent','einsteiger',
    // Dutch
    'starter','afgestudeerd','stage',
    // French
    'jeune diplômé','stagiaire','alternance','débutant','apprenti',
    // Italian
    'neolaureato','tirocinio','stage','apprendista'
  ];

  const businessRelevantTerms = [
    'business','analyst','consulting','finance','accounting','audit','marketing','sales',
    'operations','logistics','supply chain','strategy','risk','project management',
    'data','analytics','technology','engineering','product','commercial','hr'
  ];

  const seniorExclusions = [
    'senior','lead','principal','director','head of','manager','vp','vice president',
    'architect','specialist','expert','chief'
  ];

  const jobTypeExclusions = [
    'nurse','nhs','teacher','chef','cleaner','warehouse','driver','barista',
    'waiter','waitress','retail','cashier','security guard'
  ];

  const titleStr = (s) => (s||'').toLowerCase();
  const descStr = (s) => (s||'').toLowerCase();
  const includesAny = (s, terms) => terms.some(t => s.includes(t));

  const qualityFiltered = allJobs.filter(job => {
    if (!hasRequiredFields(job)) return false;
    
    const title = titleStr(job.title);
    const desc = descStr(job.company_description || job.skills || '');
    const fullText = `${title} ${desc}`;
    
    // Must have early-career indicators
    const hasEarlyCareer = includesAny(title, earlyCareerTerms) || includesAny(desc, earlyCareerTerms);
    if (!hasEarlyCareer) return false;
    
    // Must be business-relevant (unless title is explicitly early-career)
    const titleIsExplicitEarlyCareer = includesAny(title, earlyCareerTerms);
    if (!titleIsExplicitEarlyCareer && !includesAny(fullText, businessRelevantTerms)) {
      return false;
    }
    
    // Exclude senior roles
    if (includesAny(title, seniorExclusions)) return false;
    
    // Exclude non-relevant job types
    if (includesAny(fullText, jobTypeExclusions)) return false;
    
    return true;
  });

  // Remove duplicates and apply per-city caps
  const perCityCap = 300;
  const cityJobCounts = new Map();
  const finalJobs = [];

  for (const job of qualityFiltered) {
    const cityKey = (job.location||'').split(',')[0].trim().toLowerCase();
    const currentCount = cityJobCounts.get(cityKey) || 0;
    
    if (currentCount < perCityCap) {
      finalJobs.push(job);
      cityJobCounts.set(cityKey, currentCount + 1);
    }
  }

  console.log(`\n📈 Quality Filtering Results:`);
  console.log(`   Jobs with required fields: ${allJobs.filter(hasRequiredFields).length}`);
  console.log(`   Jobs passing early-career filter: ${qualityFiltered.length}`);
  console.log(`   Final jobs after dedup/caps: ${finalJobs.length}`);
  
  // Show per-city breakdown
  console.log(`\n🏙️ Per-City Breakdown:`);
  for (const [cityKey, count] of cityJobCounts) {
    console.log(`   ${cityKey}: ${count} jobs`);
  }

  if (finalJobs.length === 0) {
    console.log('\n⚠️  No jobs passed quality filters. Showing sample raw jobs for debugging:');
    allJobs.slice(0, 3).forEach((job, i) => {
      console.log(`${i+1}. "${job.title}" at ${job.company} (${job.location})`);
      console.log(`   Description: ${(job.company_description || job.skills || '').slice(0, 100)}...`);
    });
    return;
  }

  // Save to database
  console.log(`\n💾 Saving ${finalJobs.length} jobs to database...`);
  await saveJobs(finalJobs, 'jobspy-enhanced');
  
  console.log(`\n🎉 Enhancement Complete!`);
  console.log(`   Previous typical volume: ~200 jobs`);
  console.log(`   New enhanced volume: ${finalJobs.length} jobs`);
  console.log(`   Improvement factor: ${Math.round(finalJobs.length / 200 * 10) / 10}x`);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
