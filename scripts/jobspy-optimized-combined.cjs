#!/usr/bin/env node

/**
 * 🎯 JOBSPY OPTIMIZED COMBINED - Strategic Multilingual Approach
 * 
 * Combines your proven city-specific terms with both LinkedIn + Indeed
 * Uses multilingual coverage for better results
 * Focuses on quality over quantity with strategic combinations
 */

const { spawnSync } = require('child_process');
const { createClient } = require('@supabase/supabase-js');

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

async function runCombinedSearch(searchTerm, city, country, resultsWanted = 200) {
  console.log(`🔎 [LinkedIn+Indeed] "${searchTerm}" in ${city}, ${country} (${resultsWanted} results)`);
  
  const py = spawnSync(findPython(), ['-c', `
from jobspy import scrape_jobs
import pandas as pd
try:
  df = scrape_jobs(
    site_name=['linkedin', 'indeed'],
    search_term='''${searchTerm.replace(/'/g, "''")}''',
    location='''${city}''',
    country_indeed='''${country}''',
    results_wanted=${resultsWanted},
    hours_old=504,
    distance=25,
    sort='date'
  )
  if len(df) > 0:
    cols=[c for c in ['title','company','location','job_url','company_description','skills'] if c in df.columns]
    print(df[cols].to_csv(index=False))
  else:
    print("title,company,location,job_url,company_description,skills")
except Exception as e:
  import sys
  print(f"Error: {e}", file=sys.stderr)
  print("title,company,location,job_url,company_description,skills")
`], { encoding: 'utf8', timeout: 90000 });

  if (py.status !== 0) {
    const sig = py.signal ? `, signal ${py.signal}` : '';
    const err = py.error ? `, error ${py.error.message || py.error}` : '';
    console.error(`❌ Search failed: ${(py.stderr || py.stdout || '').trim() || `status ${py.status}`}${sig}${err}`);
    return [];
  }
  
  const rows = parseCsv(py.stdout);
  console.log(`   → Found ${rows.length} jobs`);
  return rows;
}

async function main() {
  console.log('🎯 JobSpy Optimized Combined - Strategic Multilingual Approach');
  console.log('============================================================');
  console.log('📋 Strategy: City-specific terms + LinkedIn+Indeed + Multilingual\n');
  
  // Strategic city-specific terms (from your proven jobspy-save.cjs)
  const STRATEGIC_SEARCHES = {
    'London': [
      'Graduate Programme',
      'Graduate Scheme', 
      'Graduate Analyst',
      'Management Trainee',
      'Investment Banking Graduate',
      'Consulting Graduate Scheme',
      'Finance Graduate Programme',
      'Summer Internship'
    ],
    'Dublin': [
      'Graduate Programme',
      'Graduate Analyst',
      'Finance Graduate Programme',
      'Audit Graduate Trainee',
      'Consulting Graduate Programme',
      'Tech Graduate',
      'Summer Internship'
    ],
    'Madrid': [
      'Programa de Graduados',
      'Programa Jóvenes Talentos',
      'Graduate Programme',
      'Analista Junior Graduate',
      'Consultoría Programa Graduate',
      'Finanzas Programa Graduate',
      'Prácticas remuneradas'
    ],
    'Berlin': [
      'Trainee Programm',
      'Absolventenprogramm',
      'Graduate Analyst',
      'Consulting Graduate Programme',
      'Finance Graduate Programme',
      'Praktikum bezahlt',
      'Werkstudent Teilzeit'
    ],
    'Amsterdam': [
      'Graduate Programme',
      'Traineeship',
      'Junior Analyst Graduate',
      'Data Analytics Graduate Programme',
      'Operations Graduate Trainee',
      'Marketing Graduate Programme',
      'Meewerkstage',
      'Afstudeerstage'
    ],
    'Paris': [
      'Programme Jeune Diplômé',
      'Graduate Programme',
      'Analyste Graduate',
      'Consulting Graduate Programme',
      'Finance Graduate Programme',
      'Stage rémunéré',
      'Alternance apprentissage',
      'VIE Volontariat International'
    ],
    'Brussels': [
      'Young Graduate Program',
      'Graduate Programme',
      'Consulting Graduate Programme',
      'Finance Graduate Programme',
      'Audit Graduate Trainee',
      'Stage rémunéré',
      'Stagiair betaald'
    ],
    'Zurich': [
      'Graduate Programme',
      'Trainee Programm',
      'Junior Analyst',
      'Finance Graduate',
      'Consulting Graduate',
      'Praktikum',
      'Stage'
    ],
    'Milan': [
      'Graduate Programme',
      'Programma Neolaureati',
      'Analista Junior',
      'Consulting Graduate',
      'Finance Graduate',
      'Tirocinio',
      'Stage'
    ]
  };

  const cities = [
    ['London', 'united kingdom'],
    ['Dublin', 'ireland'], 
    ['Madrid', 'spain'],
    ['Berlin', 'germany'],
    ['Amsterdam', 'netherlands'],
    ['Paris', 'france'],
    ['Brussels', 'belgium'],
    ['Zurich', 'switzerland'],
    ['Milan', 'italy']
  ];

  const allJobs = [];
  let searchCount = 0;
  let successfulSearches = 0;

  // Strategic approach: 3-4 targeted searches per city with both sites
  for (const [city, country] of cities) {
    console.log(`\n🌍 ${city}, ${country}:`);
    
    const cityTerms = STRATEGIC_SEARCHES[city] || ['Graduate Programme'];
    
    // Use top 3-4 most specific terms for each city
    for (const term of cityTerms.slice(0, 4)) {
      try {
        const jobs = await runCombinedSearch(term, city, country, 200);
        allJobs.push(...jobs);
        searchCount++;
        if (jobs.length > 0) successfulSearches++;
        await sleep(4000); // Slightly longer rate limiting for combined sites
      } catch (error) {
        console.error(`❌ Search failed for ${term}:`, error.message);
      }
    }
    
    console.log(`   City total: ${allJobs.length} jobs collected`);
  }

  console.log(`\n📊 Collection Summary:`);
  console.log(`   Total searches: ${searchCount}`);
  console.log(`   Successful: ${successfulSearches}`);
  console.log(`   Raw jobs: ${allJobs.length}`);

  // Quality filtering (same as your original)
  const hasRequiredFields = j => (
    (j.title||'').trim().length > 3 &&
    (j.company||'').trim().length > 1 &&
    (j.location||'').trim().length > 3 &&
    (j.job_url||j.url||'').trim().startsWith('http')
  );

  const earlyCareerTerms = [
    'graduate','entry level','entry-level','junior','associate','trainee','intern','internship',
    'graduado','becario','prácticas','nivel inicial','asociado',
    'absolvent','praktikum','werkstudent','einsteiger',
    'starter','afgestudeerd','stage',
    'jeune diplômé','stagiaire','alternance','débutant','apprenti',
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
    
    const hasEarlyCareer = includesAny(title, earlyCareerTerms) || includesAny(desc, earlyCareerTerms);
    if (!hasEarlyCareer) return false;
    
    const titleIsExplicitEarlyCareer = includesAny(title, earlyCareerTerms);
    if (!titleIsExplicitEarlyCareer && !includesAny(fullText, businessRelevantTerms)) {
      return false;
    }
    
    if (includesAny(title, seniorExclusions)) return false;
    if (includesAny(fullText, jobTypeExclusions)) return false;
    
    return true;
  });

  // Per-city caps
  const perCityCap = 250;
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

  console.log(`\n📈 Quality Results:`);
  console.log(`   Quality filtered: ${qualityFiltered.length}`);
  console.log(`   Final after caps: ${finalJobs.length}`);
  
  console.log(`\n🏙️ Per-City Breakdown:`);
  for (const [cityKey, count] of cityJobCounts) {
    console.log(`   ${cityKey}: ${count} jobs`);
  }

  if (finalJobs.length === 0) {
    console.log('\n⚠️  No jobs passed quality filters. Showing sample raw jobs:');
    allJobs.slice(0, 3).forEach((job, i) => {
      console.log(`${i+1}. "${job.title}" at ${job.company} (${job.location})`);
    });
    return;
  }

  console.log(`\n💾 Saving ${finalJobs.length} jobs to database...`);
  await saveJobs(finalJobs, 'jobspy-optimized');
  
  console.log(`\n🎉 Optimized Combined Complete!`);
  console.log(`   Strategy: City-specific + LinkedIn+Indeed + Multilingual`);
  console.log(`   Volume: ${finalJobs.length} quality jobs`);
  console.log(`   Efficiency: ${Math.round(finalJobs.length / searchCount)} jobs per search`);
  
  if (finalJobs.length > 1500) {
    console.log(`\n🚀 EXCELLENT! Strategic approach delivering high volume!`);
  } else if (finalJobs.length > 800) {
    console.log(`\n✅ Great results! Quality-focused approach working well.`);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
