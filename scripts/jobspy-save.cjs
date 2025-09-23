#!/usr/bin/env node

/**
 * Save early-career jobs from JobSpy to Supabase (EU cities)
 * - Runs JobSpy per city/term
 * - Parses CSV output
 * - Filters out remote
 * - Upserts into 'jobs' table using job_hash
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
    // Better CSV parsing that handles quoted fields with commas
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
    job_url: (j.job_url || j.url || '').trim(),
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

function pickPythonCommand() {
  const fromEnv = process.env.PYTHON && process.env.PYTHON.trim();
  const candidates = [
    fromEnv,
    '/opt/homebrew/bin/python3.11',
    '/usr/local/bin/python3.11',
    'python3.11',
    'python3',
    'python'
  ].filter(Boolean);
  for (const cmd of candidates) {
    try {
      const res = spawnSync(cmd, ['-V'], { encoding: 'utf8', timeout: 3000 });
      if (res.status === 0 || (res.stdout || res.stderr)) {
        return cmd;
      }
    } catch {}
  }
  return 'python3';
}

async function main() {
  // City-specific graduate/early-career search terms
  const CITY_TERMS = {
    'London': [
      'Graduate Programme',
      'Graduate Scheme',
      'Graduate Analyst',
      'Management Trainee',
      'Audit Graduate Trainee',
      'Finance Graduate Programme',
      'Strategy Graduate Analyst',
      'Consulting Graduate Scheme',
      'Summer Internship',
      'Industrial Placement'
    ],
    'Dublin': [
      'Graduate Programme',
      'Graduate Analyst',
      'Finance Graduate Programme',
      'Audit Graduate Trainee',
      'Consulting Graduate Programme',
      'Risk Graduate Analyst',
      'Marketing Graduate Programme',
      'Operations Graduate Trainee',
      'Summer Internship',
      'Internship Dublin (Paid)'
    ],
    'Amsterdam': [
      'Graduate Programme',
      'Traineeship',
      'Junior Analyst (Graduate)',
      'Data & Analytics Graduate Programme',
      'Operations Graduate Trainee',
      'Marketing Graduate Programme',
      'Meewerkstage',
      'Afstudeerstage',
      'Summer Internship',
      'Internship Amsterdam (Paid)'
    ],
    'Brussels': [
      'Young Graduate Program',
      'Graduate Programme',
      'Consulting Graduate Programme',
      'Finance Graduate Programme',
      'Audit Graduate Trainee',
      'Strategy Graduate Analyst',
      'Stage rémunéré',
      'Stagiair (betaald)',
      'Summer Internship',
      'Internship Brussels (Paid)'
    ],
    'Berlin': [
      'Trainee Programm',
      'Absolventenprogramm',
      'Graduate Analyst',
      'Consulting Graduate Programme',
      'Finance Graduate Programme',
      'Audit Graduate Trainee',
      'Praktikum (bezahlt)',
      'Werkstudent (Teilzeit)',
      'Summer Internship',
      'Internship Berlin (Paid)'
    ],
    'Paris': [
      'Programme Jeune Diplômé',
      'Graduate Programme',
      'Analyste Graduate',
      'Consulting Graduate Programme',
      'Finance Graduate Programme',
      'Audit Graduate (Auditeur Junior)',
      'Stage rémunéré',
      'Alternance (apprentissage)',
      'VIE (Volontariat International)',
      'Summer Internship Paris'
    ],
    'Madrid': [
      'Programa de Graduados',
      'Programa Jóvenes Talentos',
      'Graduate Programme',
      'Analista Junior (Graduate)',
      'Consultoría Programa Graduate',
      'Finanzas Programa Graduate',
      'Prácticas remuneradas',
      'Becario (pagado)',
      'Summer Internship Madrid',
      'Internship Madrid (Paid)'
    ]
  };

  // Multilingual early-career equivalents per country
  const MULTI = {
    'united kingdom': [ 'graduate', 'entry level', 'junior', 'trainee', 'associate', 'internship' ],
    'ireland': [ 'graduate', 'entry level', 'junior', 'trainee', 'associate', 'internship' ],
    'spain': [ 'graduado', 'junior', 'becario', 'prácticas', 'nivel inicial', 'trainee', 'asociado' ],
    'germany': [ 'absolvent', 'junior', 'praktikum', 'werkstudent', 'einsteiger', 'trainee', 'associate' ],
    'netherlands': [ 'starter', 'junior', 'trainee', 'afgestudeerd', 'associate', 'stage' ],
    'france': [ 'jeune diplômé', 'junior', 'stagiaire', 'alternance', 'débutant', 'apprenti', 'associate' ],
    'switzerland': [ 'junior', 'praktikum', 'absolvent', 'stage', 'jeune diplômé', 'trainee' ],
    'italy': [ 'neolaureato', 'junior', 'tirocinio', 'stage', 'entry level', 'apprendista', 'trainee' ]
  };
  const cities = [
    ['London','united kingdom'],
    ['Dublin','ireland'],
    ['Madrid','spain'],
    ['Berlin','germany'],
    ['Amsterdam','netherlands'],
    ['Paris','france'],
    ['Zurich','switzerland'],
    ['Milan','italy']
  ];

  const collected = [];
  // Build at most 10 searches across all cities using round-robin
  const combos = [];
  const cityPriority = [
    ['Dublin','ireland'],
    ['London','united kingdom'],
    ['Madrid','spain'],
    ['Berlin','germany'],
    ['Amsterdam','netherlands'],
    ['Paris','france'],
    ['Brussels','belgium'],
    ['Zurich','switzerland'],
    ['Milan','italy']
  ];
  // No generic localization; terms are already city-appropriate

  // Dynamic generation: keep trying until we have 10 non-empty fetches, with fallbacks
  const usedLondon = { used: false };
  const successes = [];
  let attempts = 0;
  let round = 0;
  const pythonCmd = pickPythonCommand();
  outer: while (successes.length < 10 && attempts < 40) {
    for (const [city, country] of cityPriority) {
      if (successes.length >= 10 || attempts >= 40) break outer;
      if (city === 'London') { if (usedLondon.used) continue; usedLondon.used = true; }
      const cityTerms = CITY_TERMS[city] || ['Graduate Programme'];
      const base = cityTerms[round % cityTerms.length];
      const variants = [ base ];
      for (const term of variants) {
        attempts++;
        console.log(`\n🔎 Fetching: ${term} in ${city}, ${country}`);
        let py;
        let tries = 0;
        const maxTries = 2;
        while (tries < maxTries) {
          tries++;
          py = spawnSync(pythonCmd, ['-c', `
from jobspy import scrape_jobs
import pandas as pd
df = scrape_jobs(
  site_name=['linkedin'],
  search_term='''${term.replace(/'/g, "''")}''',
  location='''${city}''',
  country_indeed='''${country}''',
  results_wanted=${city === 'London' ? 50 : 100},
  hours_old=504,
  distance=20,
  sort='date'
)
import sys
print('Available columns:', list(df.columns), file=sys.stderr)
cols=[c for c in ['title','company','location','job_url','company_description','skills'] if c in df.columns]
print(df[cols].to_csv(index=False))
`], { encoding: 'utf8', timeout: 20000 });
          if (py.status === 0) break;
          console.error('Python error:', (py.stderr && py.stderr.trim()) || (py.stdout && py.stdout.trim()) || `status ${py.status}`);
          if (tries < maxTries) console.log('↻ Retrying...');
        }
        if (!py || py.status !== 0) continue;
        const rows = parseCsv(py.stdout);
        console.log(`→ Collected ${rows.length} rows`);
        if (rows.length > 0) {
          rows.forEach(r => collected.push(r));
          successes.push({ city, country, term, count: rows.length });
          break; // move to next city
        }
      }
    }
    round++;
  }

  // Quality gate: required fields and description length
  const hasFields = j => (
    (j.title||'').trim().length > 3 &&
    (j.company||'').trim().length > 1 &&
    (j.location||'').trim().length > 3 &&
    (j.job_url||j.url||'').trim().startsWith('http')
  );
  const titleStr = s => (s||'').toLowerCase();
  const descStr = s => (s||'').toLowerCase();
  const includesAny = (s, arr) => arr.some(t => s.includes(t));
  const excludesAll = (s, arr) => !arr.some(t => s.includes(t));
  const earlyTerms = [
    // English
    'graduate','entry level','entry-level','junior','associate','trainee','intern','internship',
    // Spanish
    'graduado','becario','prácticas','nivel inicial','asociado',
    // German
    'absolvent','praktikum','werkstudent','einsteiger',
    // Dutch
    'starter','afgestudeerd','stage',
    // French
    'jeune diplômé','stagiaire','alternance','débutant','apprenti',
    // Swiss (mix of DE/FR)
    'praktikum','stage','jeune diplômé',
    // Italian
    'neolaureato','tirocinio','stage','apprendista'
  ];
  const bizAxesStrict = ['consult','sales','business analyst','strategy','operations','logistic','supply chain','finance','account','audit','marketing','brand','commercial','product','data','ai'];
  const bizAxesLoose = ['business','analyst','scheme','program','operations','marketing','sales','finance','account','audit','logistics','supply','chain','consult','strategy','hr','human resources','risk','project','management','data','analytics','product','tech','technology','engineering'];
  const seniorTerms = ['senior','lead','principal','director','head of','vp','vice president','architect','specialist','manager'];
  const noisyExclusions = ['nurse','nhs','teacher','chef','cleaner','warehouse','driver','barista','waiter','waitress'];
  // Additional exclusion: overly generic consultant roles
  const consultantExclusion = [' consultant '];
  const qualityFiltered = collected.filter(j => {
    if (!hasFields(j)) return false;
    const t = titleStr(j.title);
    const d = descStr(j.company_description || j.skills || '');
    const full = `${t} ${d}`;
    const hasEarly = includesAny(t, earlyTerms) || includesAny(d, earlyTerms);
    if (!hasEarly) return false;
    // If title is explicitly early-career, bypass business-axis check; else apply normal rule
    const titleHasExplicitEarly = includesAny(t, earlyTerms);
    const bizOk = titleHasExplicitEarly ? true : includesAny(full, hasEarly ? bizAxesLoose : bizAxesStrict);
    if (!bizOk) return false;
    if (!titleHasExplicitEarly && !excludesAll(full, seniorTerms)) return false;
    if (!excludesAll(full, noisyExclusions)) return false;
    if (!titleHasExplicitEarly && !excludesAll(` ${t} `, consultantExclusion)) return false;
    return true;
  });
  // Cap per city+term to prevent volume spikes
  const capPerCombo = 200;
  const perKey = new Map();
  const capped = [];
  for (const j of qualityFiltered) {
    const keyCity = (j.location||'').split(',')[0].trim().toLowerCase();
    const key = `${keyCity}`;
    const used = perKey.get(key) || 0;
    if (used < capPerCombo) {
      capped.push(j); perKey.set(key, used+1);
    }
  }
  console.log(`\n🧾 Total collected: ${collected.length}`);
  console.log(`✅ Passing quality gate (fields + biz/early terms, no senior/noise): ${qualityFiltered.length}`);
  console.log(`🎚️ After per-city cap (${capPerCombo}): ${capped.length}`);
  
  // Debug: show sample titles that failed
  if (collected.length > 0 && qualityFiltered.length === 0) {
    console.log('\n🔍 Sample titles that failed quality gate:');
    collected.slice(0, 3).forEach((j, i) => {
      const t = (j.title||'').toLowerCase();
      const d = (j.company_description || j.skills || '').toLowerCase();
      const hasEarly = earlyTerms.some(term => t.includes(term) || d.includes(term));
      const titleHasExplicitEarly = earlyTerms.some(term => t.includes(term));
      const descLen = (j.company_description || j.skills || '').trim().length;
      const hasFields = (
        (j.title||'').trim().length > 3 &&
        (j.company||'').trim().length > 1 &&
        (j.location||'').trim().length > 3 &&
        (j.job_url||j.url||'').trim().startsWith('http') &&
        true
      );
      console.log(`${i+1}. "${j.title}" (${j.company}) - hasEarly: ${hasEarly}, titleHasExplicitEarly: ${titleHasExplicitEarly}, hasFields: ${hasFields}, descLen: ${descLen}`);
      console.log(`   Raw job object:`, JSON.stringify(j, null, 2));
    });
  }
  await saveJobs(capped, 'jobspy-indeed');
  console.log('🎉 Done');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });

// Export main function for wrapper usage
module.exports = {
  main
};
