import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { Job } from './types';

// Initialize Supabase once, no duplicates
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function scrapeRemoteOK(): Promise<Job[]> {
  const jobs: Job[] = [];
  const url = 'https://remoteok.com/';
  const scraped_at = new Date().toISOString();

  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (JobPingAI Scraper)',
        Accept: 'text/html',
      },
    });

    const $ = cheerio.load(html);

    $('tr.job').each((_, el) => {
      try {
        const $el = $(el);
        const title = $el.find('.company_and_position [itemprop="title"]').text().trim();
        const company = $el.find('.company_and_position [itemprop="name"]').text().trim();
        const location = $el.find('.location').text().trim() || 'Remote';
        const description = $el.find('.description').text().trim() || '';
        const relativeUrl = $el.attr('data-href');
        const job_url = relativeUrl ? `https://remoteok.com${relativeUrl}` : '';
        const posted_at = new Date().toISOString(); // fallback if no posted date

        // Early-career relevance filter
        const lower = `${title} ${description}`.toLowerCase();
        const isEarly = /intern|graduate|entry|junior|early[- ]?career/.test(lower);
        if (!title || !company || !job_url || !isEarly) return;

        // Determine seniority level
        const level = /intern/.test(lower)
          ? 'internship'
          : /graduate/.test(lower)
          ? 'graduate'
          : /entry|junior/.test(lower)
          ? 'entry'
          : 'other';

        // Generate a unique hash to deduplicate jobs
        const job_hash = crypto.createHash('md5').update(`${title}-${company}-${job_url}`).digest('hex');

        const job: Job = {
          title,
          company,
          location,
          categories: ['Remote', 'Tech', level],
          experience_required: null,
          description,
          job_url,
          source: 'remoteok',
          posted_at,
          job_hash,
          scraped_at,
        };

        jobs.push(job);
      } catch (err) {
        console.warn('⚠️ Failed to parse a job row:', err);
      }
    });

    console.log(`✅ Scraped ${jobs.length} early-career jobs from RemoteOK`);
    return jobs;
  } catch (error) {
    console.error('❌ RemoteOK scrape failed:', (error as Error).message);
    return [];
  }
}

// CLI run: `npx tsx scrapers/remoteok.ts`
if (require.main === module) {
  (async () => {
    const jobs = await scrapeRemoteOK();
    if (jobs.length === 0) {
      console.log('ℹ️ No early-career jobs found.');
      return;
    }

    const { error } = await supabase.from('jobs').upsert(jobs, {
      onConflict: 'job_hash',
    });

    if (error) {
      console.error('❌ Supabase insert failed:', error.message);
    } else {
      console.log(`✅ Inserted/Updated ${jobs.length} jobs into Supabase`);
    }
  })();
}
