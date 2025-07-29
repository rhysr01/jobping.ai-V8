import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { Job } from './types';

export async function scrapeGreenhouse(company: {
  name: string;
  url: string;
  platform: 'greenhouse';
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

    $('.opening').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('a').text().trim();
        const relativeUrl = $el.find('a').attr('href') || '';
        const job_url = relativeUrl.startsWith('http') ? relativeUrl : `${company.url}${relativeUrl}`;
        const department = $el.closest('.department').find('h3').text().trim();
        const location = $el.find('.location').text().trim() || 'Unknown';
        const posted_at = new Date().toISOString();

        // Early-career filter
        const lower = title.toLowerCase();
        const isEarly = /intern|graduate|entry|junior|early[- ]?career/.test(lower);
        if (!title || !job_url || !isEarly) return;

        // Determine level
        const level = /intern/.test(lower)
          ? 'internship'
          : /graduate/.test(lower)
          ? 'graduate'
          : /entry|junior/.test(lower)
          ? 'entry'
          : 'other';

        // Infer work environment
        const env = /remote/.test(lower)
          ? 'remote'
          : /on[- ]?site/.test(lower)
          ? 'on-site'
          : 'hybrid';

        // Generate hash
        const job_hash = crypto.createHash('md5').update(`${title}-${company.name}-${job_url}`).digest('hex');

        const job: Job = {
          title,
          company: company.name,
          location,
          job_url,
          description: '',
          categories: [department, level, env].filter(Boolean),
          source: 'greenhouse',
          job_hash,
          scraped_at,
          posted_at,
        };

        jobs.push(job);
      } catch (err) {
        console.warn(`⚠️ Error parsing job at ${company.name}`, err);
      }
    });

    console.log(`✅ Scraped ${jobs.length} early-career jobs from ${company.name}`);
    return jobs;
  } catch (error) {
    console.error(`❌ Greenhouse scrape failed for ${company.name}:`, (error as Error).message);
    return [];
  }
}
