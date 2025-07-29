import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { Job } from './types';

export async function scrapeLever(company: {
  name: string;
  url: string;
  platform: 'lever';
  tags?: string[];
}): Promise<Job[]> {
  const jobs: Job[] = [];
  const scraped_at = new Date().toISOString();

  try {
    const { data: html } = await axios.get(company.url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
    });

    const $ = cheerio.load(html);

    $('.posting').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('.posting-title > h5').text().trim();
        const location = $el.find('.posting-categories > span').first().text().trim() || 'Remote';
        const department = $el.find('.posting-categories > span').last().text().trim();
        const relativeUrl = $el.find('a').attr('href') || '';

        const job_url = relativeUrl.startsWith('http')
          ? relativeUrl
          : relativeUrl.startsWith('/')
          ? `https://jobs.lever.co${relativeUrl}`
          : `${company.url.replace(/\/$/, '')}/${relativeUrl}`;

        const posted_at = new Date().toISOString();

        const lower = title.toLowerCase();
        const isEarly = /intern|graduate|entry|junior|early[- ]?career/.test(lower);
        if (!title || !job_url || !isEarly) return;

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

        const job: Job = {
          title,
          company: company.name,
          location,
          job_url,
          description: '',
          categories: [department.toLowerCase(), level, env].filter(Boolean),
          source: 'lever',
          job_hash,
          scraped_at,
          posted_at,
        };

        jobs.push(job);
      } catch (err) {
        console.warn(`⚠️ Error parsing Lever job at ${company.name}:`, err);
      }
    });

    console.log(`✅ Scraped ${jobs.length} early-career jobs from ${company.name}`);
    return jobs;
  } catch (error) {
    console.error(`❌ Lever scrape failed for ${company.name}:`, (error as Error).message);
    return [];
  }
}

// Allow local testing of this scraper
if (require.main === module) {
  const testCompany = {
    name: 'ExampleCompany',
    url: 'https://jobs.lever.co/examplecompany',
    platform: 'lever',
    tags: ['test', 'example']
  };

  scrapeLever(testCompany)
    .then((jobs) => {
      console.log(`🧪 Test run: scraped ${jobs.length} jobs`);
      console.log(jobs.slice(0, 3)); // Show first 3 for inspection
    })
    .catch((err) => console.error('🛑 Test scrape failed:', err));
}
