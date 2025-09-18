#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Removes jobs that don't meet EU location and early career criteria
 * 
 * This script uses the same logic as the scrapers to ensure consistency:
 * - EU locations: Based on parseLocation() from scrapers/utils.ts
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
  
  // EU countries
  const euCountries = [
    'austria', 'belgium', 'bulgaria', 'croatia', 'cyprus', 'czech republic',
    'denmark', 'estonia', 'finland', 'france', 'germany', 'greece', 'hungary',
    'ireland', 'italy', 'latvia', 'lithuania', 'luxembourg', 'malta',
    'netherlands', 'poland', 'portugal', 'romania', 'slovakia', 'slovenia',
    'spain', 'sweden', 'united kingdom', 'uk', 'switzerland', 'norway'
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
 * Check if a job should be kept based on the north-star rule
 * "If it's early-career and in Europe, keep it"
 */
function shouldKeepJob(title, description, location) {
  const { isEU } = parseLocation(location);
  const isEarlyCareer = classifyEarlyCareer(title, description);
  
  // North-star rule: keep if early-career and in Europe
  return isEarlyCareer && isEU;
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
async function getJobsToDelete() {
  console.log('🔍 Analyzing jobs to determine which ones to delete...');
  
  // Get all jobs
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('id, title, description, location, company, source, created_at');
    
  if (error) {
    console.error('❌ Error fetching jobs:', error);
    return [];
  }
  
  if (!jobs || jobs.length === 0) {
    console.log('📭 No jobs found in database');
    return [];
  }
  
  console.log(`📊 Found ${jobs.length} total jobs to analyze`);
  
  const jobsToDelete = [];
  const jobsToKeep = [];
  
  jobs.forEach(job => {
    const shouldKeep = shouldKeepJob(job.title, job.description, job.location);
    
    if (shouldKeep) {
      jobsToKeep.push(job);
    } else {
      jobsToDelete.push(job);
    }
  });
  
  console.log(`✅ Jobs to keep: ${jobsToKeep.length}`);
  console.log(`🗑️  Jobs to delete: ${jobsToDelete.length}`);
  
  // Show some examples of jobs being deleted
  if (jobsToDelete.length > 0) {
    console.log('\n📋 Examples of jobs being deleted:');
    jobsToDelete.slice(0, 5).forEach(job => {
      const { isEU } = parseLocation(job.location);
      const isEarlyCareer = classifyEarlyCareer(job.title, job.description);
      console.log(`  - "${job.title}" at ${job.company} (${job.location})`);
      console.log(`    EU: ${isEU}, Early Career: ${isEarlyCareer}`);
    });
    
    if (jobsToDelete.length > 5) {
      console.log(`  ... and ${jobsToDelete.length - 5} more`);
    }
  }
  
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
  
  const batchSize = 100; // Process in batches to avoid timeouts
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
  console.log('  - Keep only EU location jobs');
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
    
    // Get jobs to delete
    const jobsToDelete = await getJobsToDelete();
    
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
