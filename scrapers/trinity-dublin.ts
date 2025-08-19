import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';
import { Job } from './types';
import { atomicUpsertJobs, extractPostingDate, extractProfessionalExpertise, extractCareerPath, extractStartDate } from '../Utils/jobMatching';
import { PerformanceMonitor } from '../Utils/performanceMonitor';

const USER_AGENTS = [
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

const getRandomHeaders = (userAgent: string) => ({
  'User-Agent': userAgent,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-IE,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://www.google.com/',
  'DNT': '1',
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Trinity Dublin Career Portal URLs
const TRINITY_URLS = [
  'https://www.tcd.ie/careers/students/jobs/',
  'https://www.tcd.ie/careers/students/graduate-opportunities/',
  'https://www.tcd.ie/careers/students/internships/',
  'https://www.tcd.ie/careers/students/part-time-work/'
];

export async function scrapeTrinityDublin(runId: string): Promise<Job[]> {
  const jobs: Job[] = [];
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const scrapeStart = Date.now();

  console.log('🎓 Starting Trinity Dublin career portal scraping...');

  try {
    for (const url of TRINITY_URLS) {
      try {
        console.log(`📡 Scraping ${url}...`);
        
        const { data: html } = await axios.get(url, {
          headers: getRandomHeaders(userAgent),
          timeout: 15000,
        });

        const $ = cheerio.load(html);
        const pageJobs = parseTrinityJobs($, url, runId);
        jobs.push(...pageJobs);

        console.log(`✅ ${url}: ${pageJobs.length} jobs found`);
        
        // Rate limiting between pages
        await sleep(2000 + Math.random() * 3000);
        
      } catch (error: any) {
        console.error(`❌ Failed to scrape ${url}:`, error.message);
        continue;
      }
    }

    const duration = Date.now() - scrapeStart;
    console.log(`🎓 Trinity Dublin scraping completed: ${jobs.length} jobs in ${duration}ms`);
    
    PerformanceMonitor.trackDuration('trinity_dublin_scraping', scrapeStart);
    
    return jobs;
    
  } catch (error) {
    console.error('❌ Trinity Dublin scraping failed:', error);
    PerformanceMonitor.trackDuration('trinity_dublin_scraping', scrapeStart);
    return [];
  }
}

function parseTrinityJobs($: cheerio.CheerioAPI, baseUrl: string, runId: string): Job[] {
  const jobs: Job[] = [];
  
  // Multiple selectors for Trinity's job listings
  const jobSelectors = [
    '.job-listing',
    '.career-opportunity',
    '.vacancy-item',
    '.job-card',
    '.opportunity-card',
    '.position-listing',
    '.job-item',
    '.career-item',
    '.graduate-opportunity',
    '.internship-opportunity'
  ];

  for (const selector of jobSelectors) {
    $(selector).each((_, element) => {
      try {
        const $job = $(element);
        
        const title = $job.find('.job-title, .position-title, h3, h2, .title, .vacancy-title').first().text().trim();
        const company = $job.find('.company-name, .employer, .organisation, .company, .recruiter').first().text().trim();
        const location = $job.find('.location, .job-location, .workplace, .city, .address').first().text().trim() || 'Dublin, Ireland';
        const description = $job.find('.job-description, .summary, .description, .details, p').first().text().trim();
        const jobUrl = $job.find('a').attr('href') || '';
        
        if (!title || !company || !jobUrl) return;

        // Filter for graduate/student opportunities
        if (!isGraduateRole(title, description)) return;

        // Generate job hash
        const jobHash = crypto.createHash('md5').update(`${title}-${company}-${jobUrl}`).digest('hex');

        // Analyze job content
        const analysis = analyzeTrinityJobContent(title, description);

        // Extract posting date
        const dateText = $job.find('.date, .posted-date, .closing-date, time').first().text().trim();
        const dateResult = extractPostingDate(dateText, 'trinity-dublin', jobUrl);
        const postedAt = dateResult.success && dateResult.date ? dateResult.date : new Date().toISOString();

        const job: Job = {
          job_hash: jobHash,
          title: title,
          company: company,
          location: location,
          job_url: jobUrl.startsWith('http') ? jobUrl : `https://www.tcd.ie${jobUrl}`,
          description: description.slice(0, 2000),
          experience_required: analysis.experienceLevel,
          work_environment: analysis.workEnvironment,
          source: 'trinity-dublin',
          categories: analysis.categories,
          company_profile_url: '',
          language_requirements: analysis.languages.join(', '),
          scrape_timestamp: new Date().toISOString(),
          original_posted_date: postedAt,
          posted_at: postedAt,
          last_seen_at: new Date().toISOString(),
          is_active: true,
          freshness_tier: analysis.freshnessTier,
          scraper_run_id: runId,
          created_at: new Date().toISOString()
        };

        jobs.push(job);
        
      } catch (error) {
        console.warn('⚠️ Error processing Trinity job:', error);
      }
    });

    if (jobs.length > 0) {
      console.log(`✅ Found ${jobs.length} jobs using selector: ${selector}`);
      break; // Use first successful selector
    }
  }

  return jobs;
}

function isGraduateRole(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  
  // Graduate/student keywords
  const graduateKeywords = [
    'graduate', 'grad', 'recent graduate', 'new graduate', 'graduate programme',
    'graduate scheme', 'graduate trainee', 'graduate analyst', 'graduate engineer',
    'intern', 'internship', 'student', 'part-time', 'summer intern', 'placement',
    'entry level', 'entry-level', 'junior', 'trainee', 'associate', 'starter',
    '0-1 year', '0-2 year', 'no experience', 'campus', 'university', 'college',
    'final year', 'penultimate year', 'undergraduate', 'postgraduate'
  ];

  // Senior keywords to exclude
  const seniorKeywords = [
    'senior', 'sr.', 'lead', 'principal', 'staff', 'director', 'manager',
    'head of', 'chief', 'vp', 'vice president', 'architect', 'expert',
    'specialist', '5+ year', '3+ year', 'experienced', 'mid-level'
  ];

  const hasGraduateKeywords = graduateKeywords.some(keyword => text.includes(keyword));
  const hasSeniorKeywords = seniorKeywords.some(keyword => text.includes(keyword));

  return hasGraduateKeywords && !hasSeniorKeywords;
}

function analyzeTrinityJobContent(title: string, description: string) {
  const content = `${title} ${description}`.toLowerCase();
  
  // Determine experience level
  let experienceLevel = 'entry-level';
  if (/\b(intern|internship)\b/.test(content)) experienceLevel = 'internship';
  else if (/\b(graduate|grad)\b/.test(content)) experienceLevel = 'graduate';
  else if (/\b(junior|entry|associate|trainee)\b/.test(content)) experienceLevel = 'entry-level';
  
  // Extract language requirements
  const languages: string[] = [];
  const langMatches = content.match(/\b(english|irish|german|french|spanish|dutch|italian)\b/g);
  if (langMatches) {
    languages.push(...[...new Set(langMatches)]);
  }
  
  // Default to English for Irish jobs
  if (languages.length === 0) {
    languages.push('English');
  }
  
  // Determine work environment
  let workEnvironment = 'hybrid';
  if (/\b(remote|work from home|wfh)\b/.test(content)) workEnvironment = 'remote';
  else if (/\b(office|on-site|on site)\b/.test(content)) workEnvironment = 'on-site';
  
  // Extract categories
  const categories: string[] = ['University Career Portal'];
  if (experienceLevel === 'internship') categories.push('Internship');
  if (experienceLevel === 'graduate') categories.push('Graduate');
  if (experienceLevel === 'entry-level') categories.push('Entry-Level');
  
  // Add industry categories
  if (/\b(software|developer|programming|coding)\b/.test(content)) categories.push('Technology');
  if (/\b(finance|banking|accounting|audit)\b/.test(content)) categories.push('Finance');
  if (/\b(consulting|strategy|management)\b/.test(content)) categories.push('Consulting');
  if (/\b(marketing|advertising|communications)\b/.test(content)) categories.push('Marketing');
  if (/\b(research|academic|phd)\b/.test(content)) categories.push('Research');
  
  // Determine freshness tier
  const freshnessTier = 'fresh'; // University jobs are typically fresh
  
  return {
    experienceLevel,
    languages,
    workEnvironment,
    categories,
    freshnessTier
  };
}

// CLI runner
if (require.main === module) {
  (async () => {
    const runId = crypto.randomUUID();
    console.log(`🚀 Starting Trinity Dublin scrape with run ID: ${runId}`);
    
    const jobs = await scrapeTrinityDublin(runId);
    if (jobs.length === 0) {
      console.log('ℹ️ No graduate jobs found.');
      return;
    }

    const result = await atomicUpsertJobs(jobs);
    
    if (!result.success) {
      console.error('❌ Atomic upsert failed:', result.errors);
    } else {
      console.log(`✅ Atomic upsert completed: ${result.inserted} inserted, ${result.updated} updated`);
    }
  })();
}
