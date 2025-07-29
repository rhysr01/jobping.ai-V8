import { companyList } from './companylist';
import { scrapeGreenhouse } from './greenhouse';
import { scrapeLever } from './lever';
import { Job } from './types';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function scrapeAllCareerSites(): Promise<Job[]> {
  const allJobs: Job[] = [];

  for (const company of companyList) {
    try {
      let scrapedJobs: Job[] = [];

      if (company.platform === 'greenhouse') {
        scrapedJobs = await scrapeGreenhouse(company);
      } else if (company.platform === 'lever') {
        scrapedJobs = await scrapeLever(company);
      } else if (company.platform === 'workday') {
        scrapedJobs = await scrapeWorkday(company);
      } else {
        console.warn(`⚠️ Skipping ${company.name} — unknown platform: ${company.platform}`);
        continue;
      }

      // Enrich and clean jobs
      const validJobs: Job[] = scrapedJobs
        .filter(job => job.title && job.company && job.job_url)
        .map(job => ({
          ...job,
          job_hash: crypto
            .createHash('md5')
            .update(`${job.title}-${job.company}-${job.job_url}`)
            .digest('hex'),
          scraped_at: new Date().toISOString()
        }));

      if (validJobs.length === 0) {
        console.warn(`⚠️ ${company.name} returned no valid jobs`);
        continue;
      }

      const { error } = await supabase.from('jobs').upsert(validJobs, {
        onConflict: 'job_hash'
      });

      if (error) {
        console.error(`❌ Supabase insert failed for ${company.name}:`, error.message);
        continue;
      }

      console.log(`✅ ${company.name}: ${validJobs.length} jobs inserted/updated`);
      allJobs.push(...validJobs);
    } catch (err) {
      console.error(`❌ Error scraping ${company.name}:`, err);
    }
  }

  console.log(`🎉 Done scraping ${allJobs.length} jobs across ${companyList.length} companies.`);
  return allJobs;
}

// CLI support
if (require.main === module) {
  scrapeAllCareerSites();
}
