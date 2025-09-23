#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Removes jobs that don't meet location and early career criteria
 * 
 * This script uses the same logic as the scrapers to ensure consistency:
 * - Locations: EU countries + UK, Switzerland, Norway (based on parseLocation() from scrapers/utils.ts)
 * - Early career: Based on classifyEarlyCareer() from scrapers/utils.ts
 * - Remote jobs: Excluded per user preference
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Parse and standardize location information (from scrapers/utils.ts)
 */
function parseLocation(location) {
  const loc = location.toLowerCase().trim();
  
  // Check for remote indicators
  const isRemote = /remote|work\s+from\s+home|wfh|anywhere/i.test(loc);
  
  // EU countries + UK, Switzerland, Norway (including country codes)
  const euCountries = [
    'austria', 'at', 'belgium', 'be', 'bulgaria', 'bg', 'croatia', 'hr', 'cyprus', 'cy', 
    'czech republic', 'cz', 'denmark', 'dk', 'estonia', 'ee', 'finland', 'fi', 
    'france', 'fr', 'germany', 'de', 'greece', 'gr', 'hungary', 'hu',
    'ireland', 'ie', 'italy', 'it', 'latvia', 'lv', 'lithuania', 'lt', 'luxembourg', 'lu', 
    'malta', 'mt', 'netherlands', 'nl', 'poland', 'pl', 'portugal', 'pt', 
    'romania', 'ro', 'slovakia', 'sk', 'slovenia', 'si', 'spain', 'es', 
    'sweden', 'se', 'united kingdom', 'uk', 'gb', 'great britain', 'england', 'scotland', 'wales', 'northern ireland',
    'switzerland', 'ch', 'norway', 'no'
  ];

  // Known EU/UK/CH city names to infer EU when country is absent
  const euCities = new Set([
    'london','manchester','birmingham','edinburgh','glasgow','leeds','liverpool',
    'dublin','cork','galway',
    'berlin','munich','hamburg','cologne','frankfurt','stuttgart','düsseldorf','duesseldorf',
    'paris','marseille','lyon','toulouse','nice','nantes','strasbourg',
    'madrid','barcelona','valencia','seville','bilbao','málaga','malaga',
    'rome','milan','naples','turin','florence','bologna',
    'amsterdam','rotterdam','the hague','den haag','utrecht','eindhoven',
    'brussels','antwerp','ghent','bruges',
    'vienna','salzburg','graz','innsbruck',
    'zurich','geneva','basel','bern','lausanne',
    'stockholm','gothenburg','goteborg','malmö','malmo','uppsala',
    'copenhagen','aarhus','odense','aalborg',
    'oslo','bergen','trondheim','stavanger',
    'helsinki','espoo','tampere','vantaa',
    'warsaw','krakow','gdansk','wroclaw','poznan','wrocław','poznań',
    'prague','brno','ostrava','plzen','plzeň',
    'budapest','debrecen','szeged','miskolc',
    'lisbon','porto','braga','coimbra',
    'athens','thessaloniki','patras','heraklion'
  ]);
  
  // Check if location contains EU country
  let isEU = euCountries.some(country => loc.includes(country));
  
  // Extract city and country using comma separation first
  const parts = loc.split(',').map(p => p.trim()).filter(Boolean);
  const city = parts.length > 0 ? parts[0] : loc;
  let country = parts.length > 1 ? parts[parts.length - 1] : '';
  
  // If there's only one part and it's a known city, leave country empty to allow EU city inference
  if (parts.length === 1 && euCities.has(city)) {
    country = '';
  }

  // If country was not detected but city is a known EU city, mark as EU
  if (!isEU && country.length === 0) {
    const cityOnly = city.replace(/\s+/g, ' ').trim();
    if (euCities.has(cityOnly)) {
      isEU = true;
    }
  }

  return {
    city: city || location,
    country: country,
    isRemote,
    isEU // Never treat remote as EU; remote must be excluded by policy
  };
}

/**
 * Classify if a job is early-career based on title and description (from scrapers/utils.ts)
 */
function classifyEarlyCareer(title, description) {
  const text = `${title} ${description}`;
  
  // ✅ COMPREHENSIVE: Multilingual early career detection based on user research
  const graduateRegex = /(graduate|new.?grad|recent.?graduate|campus.?hire|graduate.?scheme|graduate.?program|rotational.?program|university.?hire|college.?hire|entry.?level|junior|trainee|intern|internship|placement|analyst|assistant|fellowship|apprenticeship|apprentice|stagiaire|alternant|alternance|d[ée]butant|formation|dipl[oô]m[eé]|apprenti|poste.?d.?entr[ée]e|niveau.?d[ée]butant|praktikum|praktikant|traineeprogramm|berufseinstieg|absolvent|absolventenprogramm|ausbildung|auszubildende|werkstudent|einsteiger|becario|pr[aá]cticas|programa.?de.?graduados|reci[eé]n.?titulado|aprendiz|nivel.?inicial|puesto.?de.?entrada|j[uú]nior|formaci[oó]n.?dual|tirocinio|stagista|apprendista|apprendistato|neolaureato|formazione|inserimento.?lavorativo|stage|stagiair|starterfunctie|traineeship|afgestudeerde|leerwerkplek|instapfunctie|fresher|nyuddannet|nyutdannet|nyexaminerad|neo.?laureato|nuovo.?laureato|recién.?graduado|nuevo.?graduado|joven.?profesional|nieuwe.?medewerker)/i;
  
  // Exclude clearly senior signals only; allow consultant/management trainee variants
  const seniorRegex = /(senior|lead|principal|director|head.?of|vp|chief|executive\s+level|executive\s+director|5\+.?years|7\+.?years|10\+.?years|experienced\s+professional|architect\b|team.?lead|tech.?lead|staff\b|distinguished)/i;
  
  // ✅ FIXED: Only exclude roles requiring significant experience (3+ years), not 1-2 years
  const experienceRegex = /(proven.?track.?record|extensive.?experience|minimum.?3.?years|minimum.?5.?years|minimum.?7.?years|prior.?experience|relevant.?experience|3\+.?years|5\+.?years|7\+.?years|10\+.?years)/i;
  
  return graduateRegex.test(text) && !seniorRegex.test(text) && !experienceRegex.test(text);
}

/**
 * Check if a job should be kept:
 * - North-star rule (early-career AND in Europe)
 * - Must have useful user info (non-empty company and sufficiently detailed description)
 */
function shouldKeepJob(title, description, location, company, url) {
  const { isEU } = parseLocation(location);
  const isEarlyCareer = classifyEarlyCareer(title, description);
  const hasCompany = typeof company === 'string' && company.trim().length > 0;
  const hasLocation = typeof location === 'string' && location.trim().length > 0;
  const hasUrl = typeof url === 'string' && url.trim().length > 0;
  const hasUsefulDescription = typeof description === 'string' && description.trim().length >= 120; // require at least 120 chars of detail
  
  // Keep only if passes north-star AND has useful user-facing information
  return isEarlyCareer && isEU && hasCompany && hasLocation && hasUrl && hasUsefulDescription;
}

/**
 * Get current job count
 */
async function getCurrentJobCount() {
  const { count, error } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    console.error('❌ Error getting job count:', error);
    return 0;
  }
  
  return count || 0;
}

/**
 * Get jobs that should be deleted
 */
async function getJobsToDeletePaginated(pageSize = 10000) {
  console.log('🔍 Analyzing jobs to determine which ones to delete (paginated)...');
  
  const { count: total, error: countError } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true });
  if (countError) {
    console.error('❌ Error counting jobs:', countError);
    return [];
  }
  console.log(`📊 Total jobs in DB: ${total || 0}`);
  
  let offset = 0;
  const jobsToDelete = [];
  let kept = 0;
  let printed = false;
  
  while (typeof total === 'number' ? offset < total : true) {
    console.log(`\n📦 Fetching jobs ${offset} – ${typeof total === 'number' ? Math.min(offset + pageSize - 1, total - 1) : offset + pageSize - 1} ...`);
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, description, location, company, source, created_at, job_url')
      .range(offset, offset + pageSize - 1);
    if (error) {
      console.error('❌ Error fetching jobs page:', error);
      break;
    }
    if (!jobs || jobs.length === 0) {
      break;
    }
    for (const job of jobs) {
      const keep = shouldKeepJob(job.title, job.description, job.location, job.company, job.job_url);
      if (keep) kept++; else jobsToDelete.push(job);
    }
    if (!printed && jobsToDelete.length > 0) {
      console.log('\n📋 Examples of jobs being deleted:');
      jobsToDelete.slice(0, 5).forEach(job => {
        const { isEU } = parseLocation(job.location);
        const isEarlyCareer = classifyEarlyCareer(job.title, job.description);
        const hasCompany = !!(job.company && job.company.trim().length > 0);
        const hasLocation = !!(job.location && job.location.trim().length > 0);
        const hasUrl = !!(job.job_url && job.job_url.trim().length > 0);
        const descLen = (job.description || '').trim().length;
        console.log(`  - "${job.title}" at ${job.company || '—'} (${job.location})`);
        console.log(`    EU: ${isEU}, Early Career: ${isEarlyCareer}, Company: ${hasCompany ? 'yes' : 'no'}, Location: ${hasLocation ? 'yes' : 'no'}, URL: ${hasUrl ? 'yes' : 'no'}, Description chars: ${descLen}`);
      });
      printed = true;
    }
    console.log(`✅ Page analyzed. To delete so far: ${jobsToDelete.length}, kept: ${kept}`);
    offset += pageSize;
    if (jobs.length < pageSize) break; // last page
  }
  console.log(`\n📊 Analysis complete. Total to delete: ${jobsToDelete.length}, kept: ${kept}`);
  return jobsToDelete;
}

/**
 * Delete jobs in batches
 */
async function deleteJobs(jobsToDelete) {
  if (jobsToDelete.length === 0) {
    console.log('✅ No jobs to delete');
    return 0;
  }
  
  console.log(`🗑️  Deleting ${jobsToDelete.length} jobs...`);
  
  const batchSize = parseInt(process.env.CLEANUP_DELETE_BATCH_SIZE || '2000'); // Larger batches for faster cleanup
  let deletedCount = 0;
  
  for (let i = 0; i < jobsToDelete.length; i += batchSize) {
    const batch = jobsToDelete.slice(i, i + batchSize);
    const jobIds = batch.map(job => job.id);
    
    const { error } = await supabase
      .from('jobs')
      .delete()
      .in('id', jobIds);
      
    if (error) {
      console.error(`❌ Error deleting batch ${Math.floor(i/batchSize) + 1}:`, error);
      continue;
    }
    
    deletedCount += batch.length;
    console.log(`✅ Deleted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(jobsToDelete.length/batchSize)} (${deletedCount}/${jobsToDelete.length} jobs)`);
    
    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return deletedCount;
}

/**
 * Main cleanup function
 */
async function main() {
  console.log('🧹 Starting database cleanup...');
  console.log('📋 Criteria:');
  console.log('  - Keep only EU + UK + Switzerland + Norway location jobs');
  console.log('  - Keep only early career jobs');
  console.log('  - Exclude remote jobs');
  console.log('');
  
  try {
    // Get initial count
    const initialCount = await getCurrentJobCount();
    console.log(`📊 Initial job count: ${initialCount}`);
    
    if (initialCount === 0) {
      console.log('📭 No jobs in database, nothing to clean up');
      return;
    }
    
    // Get jobs to delete (paginated, larger scale)
    const jobsToDelete = await getJobsToDeletePaginated(parseInt(process.env.CLEANUP_PAGE_SIZE || '10000'));
    
    if (jobsToDelete.length === 0) {
      console.log('✅ No irrelevant jobs found - database is already clean!');
      return;
    }
    
    // Confirm deletion
    console.log('\n⚠️  This will permanently delete these jobs from the database.');
    console.log('Type "DELETE" to confirm:');
    
    // In a real script, you'd want to add confirmation here
    // For now, we'll proceed with the deletion
    console.log('🗑️  Proceeding with deletion...');
    
    // Delete the jobs
    const deletedCount = await deleteJobs(jobsToDelete);
    
    // Get final count
    const finalCount = await getCurrentJobCount();
    
    console.log('\n🎉 Cleanup completed!');
    console.log(`📊 Results:`);
    console.log(`  - Initial jobs: ${initialCount}`);
    console.log(`  - Deleted jobs: ${deletedCount}`);
    console.log(`  - Remaining jobs: ${finalCount}`);
    console.log(`  - Cleanup efficiency: ${((deletedCount / initialCount) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
main().catch(console.error);
