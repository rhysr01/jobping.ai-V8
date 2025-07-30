import { scrapeRemoteOK } from './remoteok';
import { scrapeAllCareerSites } from './scrapecareersite';
import { createClient } from '@supabase/supabase-js';
import type { Job } from './types';
import dotenv from 'dotenv';
import { getTodayISO, cleanText, normalizeLocation, inferSeniorityLevel, detectWorkEnvironment, detectLanguageRequirements } from './utils';
import crypto from 'crypto';

dotenv.config();

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('❌ Missing required Supabase environment variables.');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function scrapeAll(): Promise<void> {
  console.log('🚀 Starting full scrape run for JobPing...');
  const scraped_at = getTodayISO();
  const scraperRunId = crypto.randomUUID(); // Set once at the start of scraping

  const allSources: { name: string; scrapeFn: () => Promise<Job[]> }[] = [
    { name: 'RemoteOK', scrapeFn: scrapeRemoteOK },
    { name: 'Career Sites', scrapeFn: scrapeAllCareerSites },
    // Add future sources here
  ];

  let totalJobs: Job[] = [];
  const summary: Record<string, number> = {};

  for (const source of allSources) {
    console.log(`🔍 Scraping ${source.name}...`);
    const start = Date.now();
    try {
      const jobs = await source.scrapeFn();
      const enriched = jobs.map((job) => ({ ...job, scraped_at }));
      totalJobs = totalJobs.concat(enriched);
      summary[source.name] = enriched.length;
      const duration = Date.now() - start;
      console.log(`✅ ${source.name}: ${enriched.length} jobs scraped in ${duration}ms`);
    } catch (error) {
      console.error({
        source: source.name,
        error: error instanceof Error ? error.message : error,
        timestamp: getTodayISO(),
      });
      summary[source.name] = 0;
    }
  }

  // Deduplication by job_hash
  const seen = new Set<string>();
  const dedupedJobs = totalJobs.filter((job) => {
    if (seen.has(job.job_hash)) return false;
    seen.add(job.job_hash);
    return true;
  });

  console.log(`🧼 Cleaned jobs count: ${dedupedJobs.length}`);

  // Enrich and validate jobs
  const enrichedJobs = dedupedJobs.map(job => enrichJobData(job)).filter(Boolean) as Job[];
  
  console.log(`✨ Enriched jobs count: ${enrichedJobs.length}`);

  if (enrichedJobs.length === 0) {
    console.warn('⚠️ No valid jobs to insert. Exiting.');
    return;
  }

  // Add scraper_run_id to each job
  const jobsWithRunId = enrichedJobs.map(job => ({ ...job, scraper_run_id: scraperRunId }));

  const { error } = await supabase.from('jobs').upsert(jobsWithRunId, {
    onConflict: 'job_hash',
  });

  if (error) {
    console.error('❌ Supabase insert failed:', error.message);
  } else {
    console.log(`✅ Inserted/Updated ${dedupedJobs.length} jobs into Supabase.`);
  }

  console.log('\n📊 Summary Report:');
  for (const [source, count] of Object.entries(summary)) {
    console.log(`- ${source}: ${count} jobs`);
  }
}

// Enrich job data with additional fields for better AI matching
function enrichJobData(job: Job): Job | null {
  try {
    // Clean and normalize text fields
    const cleanedTitle = cleanText(job.title);
    const cleanedCompany = cleanText(job.company);
    const cleanedLocation = normalizeLocation(job.location);
    const cleanedDescription = job.description ? cleanText(job.description) : '';

    // Skip jobs with invalid data
    if (!cleanedTitle || !cleanedCompany || !cleanedLocation) {
      return null;
    }

    // Infer additional fields if not present
    const enrichedJob: Job = {
      ...job,
      title: cleanedTitle,
      company: cleanedCompany,
      location: cleanedLocation,
      description: cleanedDescription,
      experience_required: job.experience_required || inferExperienceLevel(cleanedTitle, cleanedDescription),
      work_environment: job.work_environment || detectWorkEnvironment(cleanedTitle + ' ' + cleanedDescription),
      language_requirements: job.language_requirements || detectLanguageRequirements(cleanedTitle + ' ' + cleanedDescription),
      categories: enrichCategories(job.categories, cleanedTitle, cleanedDescription),
    };

    return enrichedJob;
  } catch (error) {
    console.error('❌ Error enriching job data:', error);
    return null;
  }
}

// Infer experience level from title and description
function inferExperienceLevel(title: string, description: string): string {
  const text = (title + ' ' + description).toLowerCase();
  
  if (/intern|internship/.test(text)) return '0 years (Internship)';
  if (/graduate|entry[- ]?level|junior|new grad/.test(text)) return '0-1 years';
  if (/mid[- ]?level|intermediate/.test(text)) return '2-4 years';
  if (/senior|lead|principal/.test(text)) return '5+ years';
  
  return 'Not specified';
}

// Enrich categories based on job content
function enrichCategories(existingCategories: string[], title: string, description: string): string[] {
  const text = (title + ' ' + description).toLowerCase();
  const enriched = [...existingCategories];

  // Add early-career indicators
  if (/intern|graduate|entry[- ]?level|junior|new grad/.test(text)) {
    if (!enriched.includes('Early Career')) enriched.push('Early Career');
  }

  // Add remote indicators
  if (/remote/.test(text)) {
    if (!enriched.includes('Remote')) enriched.push('Remote');
  }

  // Add tech indicators
  if (/software|developer|engineer|programming|coding|tech/.test(text)) {
    if (!enriched.includes('Tech')) enriched.push('Tech');
  }

  return enriched;
}

// Run directly
if (require.main === module) {
  scrapeAll()
    .then(() => console.log('🎉 JobPing scrape complete'))
    .catch((err) => {
      console.error('🚨 Scrape failed:', err);
      process.exit(1);
    });
}
