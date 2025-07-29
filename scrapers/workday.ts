import axios from 'axios';
import crypto from 'crypto';
import { Job } from './types';

export async function scrapeWorkday(company: {
  name: string;
  url: string;
  platform: 'workday';
  tags?: string[];
}): Promise<Job[]> {
  const jobs: Job[] = [];
  const scraped_at = new Date().toISOString();

  try {
    const { data, headers } = await axios.get(company.url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        Accept: 'application/json, text/html',
      },
    });

    if (typeof data !== 'object' || !data) {
      console.warn(`⚠️ Unexpected response type for ${company.name}`);
      return [];
    }

    const keys = Object.keys(data);
    const jobListKey = keys.find((k) => Array.isArray(data[k]));
    const jobArray = jobListKey ? data[jobListKey] : [];

    if (!Array.isArray(jobArray)) {
      console.warn(`⚠️ No valid job list found in Workday response for ${company.name}`);
      return [];
    }

    for (const post of jobArray) {
      try {
        const title = post.title?.trim() || '';
        const location = post.location || 'Unknown';
        const job_url = post.externalPath ? `https://workday.com${post.externalPath}` : '';
        const posted_at = post.postedDate || scraped_at;

        const lower = title.toLowerCase();
        const isEarly = /intern|graduate|entry|junior|early[- ]?career/.test(lower);
        if (!title || !job_url || !isEarly) continue;

        const level = /intern/.test(lower)
          ? 'internship'
          : /graduate/.test(lower)
          ? 'graduate'
          : /entry|junior/.test(lower)
          ? 'entry'
          : 'other';

        const env = /remote/.test(lower)
          ? 'remote'
          : /on[- ]?site/.test(lower)
          ? 'on-site'
          : 'hybrid';

        const job_hash = crypto.createHash('md5').update(`${title}-${company.name}-${job_url}`).digest('hex');

        jobs.push({
          title,
          company: company.name,
          location,
          job_url,
          description: '',
          categories: [level, env, ...(company.tags || [])],
          source: 'workday',
          job_hash,
          scraped_at,
          posted_at,
        });
      } catch (err) {
        console.warn(`⚠️ Failed to parse job from ${company.name}:`, err);
      }
    }

    console.log(`✅ Scraped ${jobs.length} early-career jobs from ${company.name}`);
    return jobs;
  } catch (error) {
    console.error(`❌ Workday scrape failed for ${company.name}:`, (error as Error).message);
    return [];
  }
}

// Local CLI test runner
if (require.main === module) {
  const testCompany = {
    name: 'ExampleCompany',
    url: 'https://careers.examplecompany.com/api/jobs',
    platform: 'workday',
    tags: ['test', 'example']
  };

  scrapeWorkday(testCompany)
    .then((jobs) => {
      if (jobs.length === 0) throw new Error('🛑 No jobs returned');
      console.log(`🧪 Test run: scraped ${jobs.length} jobs`);
      console.log('Fields available:', Object.keys(jobs[0] || {}));
      console.log(jobs.slice(0, 3));
    })
    .catch((err) => console.error('🛑 Test scrape failed:', err));
}
