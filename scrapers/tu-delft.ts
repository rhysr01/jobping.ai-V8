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
  'Accept-Language': 'en-NL,nl;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://www.google.com/',
  'DNT': '1',
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// TU Delft Career Portal URLs
const TUDELFT_URLS = [
  'https://www.tudelft.nl/en/careers/',
  'https://careercenter.tudelft.nl/',
  'https://www.tudelft.nl/en/student/career-support/job-opportunities/',
  'https://www.tudelft.nl/en/student/career-support/internships/',
  'https://www.tudelft.nl/en/student/career-support/graduate-opportunities/'
];

// Dutch graduate keywords
const DUTCH_GRADUATE_KEYWORDS = [
  'afgestudeerd', 'starter', 'junior', 'trainee', 'graduate',
  'recent afgestudeerd', 'nieuwe graduate', 'young professional',
  'traineeship', 'graduate programma', 'startfunctie', 'stagiair',
  'afstudeerstage', 'graduation internship', 'entry level'
];

// Dutch senior keywords to exclude
const DUTCH_SENIOR_KEYWORDS = [
  'senior', 'ervaren', 'lead', 'hoofd', 'manager', 'directeur',
  '5+ jaar', '3+ jaar ervaring', 'expert', 'specialist', 'medior'
];

export async function scrapeTUDelft(runId: string): Promise<Job[]> {
  const jobs: Job[] = [];
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const scrapeStart = Date.now();

  console.log('🇳🇱 Starting TU Delft career portal scraping...');

  try {
    for (const url of TUDELFT_URLS) {
      try {
        console.log(`📡 Scraping ${url}...`);
        
        const { data: html } = await axios.get(url, {
          headers: getRandomHeaders(userAgent),
          timeout: 15000,
        });

        const $ = cheerio.load(html);
        const pageJobs = parseTUDelftJobs($, url, runId);
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
    console.log(`🇳🇱 TU Delft scraping completed: ${jobs.length} jobs in ${duration}ms`);
    
    PerformanceMonitor.trackDuration('tu_delft_scraping', scrapeStart);
    
    return jobs;
    
  } catch (error) {
    console.error('❌ TU Delft scraping failed:', error);
    PerformanceMonitor.trackDuration('tu_delft_scraping', scrapeStart);
    return [];
  }
}

function parseTUDelftJobs($: cheerio.CheerioAPI, baseUrl: string, runId: string): Job[] {
  const jobs: Job[] = [];
  
  // Multiple parsing formats for TU Delft
  const parseFormats = [
    parseCareerCenterFormat,
    parseStudentPortalFormat,
    parseStandardFormat
  ];
  
  for (const parseFormat of parseFormats) {
    const foundJobs = parseFormat($, baseUrl, runId);
    if (foundJobs.length > 0) {
      jobs.push(...foundJobs);
      console.log(`🇳🇱 TU Delft: Found ${foundJobs.length} jobs using ${parseFormat.name}`);
      break;
    }
  }
  
  return jobs;
}

function parseCareerCenterFormat($: cheerio.CheerioAPI, baseUrl: string, runId: string): Job[] {
  const jobs: Job[] = [];
  
  // Career center specific selectors (often in Dutch)
  $('.vacature, .job-posting, .career-opportunity, .functie, .job-listing').each((_, element) => {
    try {
      const $job = $(element);
      
      const title = $job.find('.functietitel, .job-title, h3, h2, .title').first().text().trim();
      const company = $job.find('.bedrijf, .company, .werkgever, .employer').first().text().trim();
      const location = $job.find('.locatie, .location, .plaats, .city').first().text().trim() || 'Delft, Netherlands';
      const description = $job.find('.beschrijving, .description, .omschrijving, .details').first().text().trim();
      const jobUrl = $job.find('a').attr('href') || '';
      
      if (!title || !company || !jobUrl) return;

      // Filter for graduate/student opportunities
      if (!isGraduateRole(title, description)) return;

      const job = createTUDelftJob(title, company, location, description, jobUrl, runId, 'CareerCenter');
      jobs.push(job);
      
    } catch (error) {
      console.warn('⚠️ Error processing TU Delft career center job:', error);
    }
  });
  
  return jobs;
}

function parseStudentPortalFormat($: cheerio.CheerioAPI, baseUrl: string, runId: string): Job[] {
  const jobs: Job[] = [];
  
  // Student portal format
  $('.student-job, .graduate-opportunity, .stage, .afstuderen, .internship').each((_, element) => {
    try {
      const $job = $(element);
      
      const title = $job.find('h3, h2, .titel, .title').first().text().trim();
      const company = $job.find('.company, .bedrijf, .employer').first().text().trim();
      const location = $job.find('.location, .locatie, .city').first().text().trim() || 'Delft, Netherlands';
      const description = $job.find('.description, .beschrijving, p, .details').first().text().trim();
      const jobUrl = $job.find('a').attr('href') || '';
      
      if (!title || !company || !jobUrl) return;

      if (!isGraduateRole(title, description)) return;

      const job = createTUDelftJob(title, company, location, description, jobUrl, runId, 'StudentPortal');
      jobs.push(job);
      
    } catch (error) {
      console.warn('⚠️ Error processing TU Delft student portal job:', error);
    }
  });
  
  return jobs;
}

function parseStandardFormat($: cheerio.CheerioAPI, baseUrl: string, runId: string): Job[] {
  const jobs: Job[] = [];
  
  // Standard international format (English)
  $('.job-listing, .opportunity, .position, .career, .vacancy').each((_, element) => {
    try {
      const $job = $(element);
      
      const title = $job.find('h3, h2, .title, .job-title').first().text().trim();
      const company = $job.find('.company, .employer, .organisation').first().text().trim();
      const location = $job.find('.location, .city, .address').first().text().trim() || 'Netherlands';
      const description = $job.find('.description, p, .details, .summary').first().text().trim();
      const jobUrl = $job.find('a').attr('href') || '';
      
      if (!title || !company || !jobUrl) return;

      if (!isGraduateRole(title, description)) return;

      const job = createTUDelftJob(title, company, location, description, jobUrl, runId, 'Standard');
      jobs.push(job);
      
    } catch (error) {
      console.warn('⚠️ Error processing TU Delft standard job:', error);
    }
  });
  
  return jobs;
}

function createTUDelftJob(title: string, company: string, location: string, description: string, jobUrl: string, runId: string, source: string): Job {
  // Generate job hash
  const jobHash = crypto.createHash('md5').update(`${title}-${company}-${jobUrl}`).digest('hex');

  // Analyze job content
  const analysis = analyzeTUDelftJobContent(title, description);

  // Extract posting date
  const dateText = ''; // TU Delft doesn't always show dates prominently
  const dateResult = extractPostingDate(dateText, 'tu-delft', jobUrl);
  const postedAt = dateResult.success && dateResult.date ? dateResult.date : new Date().toISOString();

  return {
    job_hash: jobHash,
    title: title,
    company: company,
    location: location,
    job_url: jobUrl.startsWith('http') ? jobUrl : `https://www.tudelft.nl${jobUrl}`,
    description: description.slice(0, 2000),
    experience_required: analysis.experienceLevel,
    work_environment: analysis.workEnvironment,
    source: 'tu-delft',
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
}

function isGraduateRole(title: string, description: string): boolean {
  const text = `${title} ${description}`.toLowerCase();
  
  // Combine English and Dutch keywords
  const allGraduateKeywords = [
    'graduate', 'grad', 'recent graduate', 'new graduate', 'graduate programme',
    'graduate scheme', 'graduate trainee', 'graduate analyst', 'graduate engineer',
    'intern', 'internship', 'student', 'part-time', 'summer intern', 'placement',
    'entry level', 'entry-level', 'junior', 'trainee', 'associate', 'starter',
    '0-1 year', '0-2 year', 'no experience', 'campus', 'university', 'college',
    'final year', 'penultimate year', 'undergraduate', 'postgraduate',
    ...DUTCH_GRADUATE_KEYWORDS
  ];
  
  const allSeniorKeywords = [
    'senior', 'sr.', 'lead', 'principal', 'staff', 'director', 'manager',
    'head of', 'chief', 'vp', 'vice president', 'architect', 'expert',
    'specialist', '5+ year', '3+ year', 'experienced', 'mid-level',
    ...DUTCH_SENIOR_KEYWORDS
  ];
  
  const hasGraduateKeywords = allGraduateKeywords.some(keyword => text.includes(keyword));
  const hasSeniorKeywords = allSeniorKeywords.some(keyword => text.includes(keyword));
  
  return hasGraduateKeywords && !hasSeniorKeywords;
}

function analyzeTUDelftJobContent(title: string, description: string) {
  const content = `${title} ${description}`.toLowerCase();
  
  // Determine experience level
  let experienceLevel = 'entry-level';
  if (/\b(intern|internship|stagiair|afstudeerstage)\b/.test(content)) experienceLevel = 'internship';
  else if (/\b(graduate|grad|afgestudeerd)\b/.test(content)) experienceLevel = 'graduate';
  else if (/\b(junior|entry|associate|trainee|starter)\b/.test(content)) experienceLevel = 'entry-level';
  
  // Extract language requirements
  const languages: string[] = [];
  const langMatches = content.match(/\b(english|dutch|nederlands|german|french|spanish)\b/g);
  if (langMatches) {
    languages.push(...[...new Set(langMatches)]);
  }
  
  // Default to English for Dutch tech jobs
  if (languages.length === 0) {
    languages.push('English');
  }
  
  // Determine work environment
  let workEnvironment = 'hybrid';
  if (/\b(remote|work from home|wfh|thuiswerken)\b/.test(content)) workEnvironment = 'remote';
  else if (/\b(office|on-site|on site|kantoor)\b/.test(content)) workEnvironment = 'on-site';
  
  // Extract categories with engineering focus
  const categories: string[] = ['University Career Portal', 'Engineering'];
  if (experienceLevel === 'internship') categories.push('Internship');
  if (experienceLevel === 'graduate') categories.push('Graduate');
  if (experienceLevel === 'entry-level') categories.push('Entry-Level');
  
  // Add industry categories (engineering heavy)
  if (/\b(software|developer|programming|coding|tech)\b/.test(content)) categories.push('Technology');
  if (/\b(engineering|engineer|mechanical|electrical|civil)\b/.test(content)) categories.push('Engineering');
  if (/\b(research|academic|phd|onderzoek)\b/.test(content)) categories.push('Research');
  if (/\b(finance|banking|accounting|audit)\b/.test(content)) categories.push('Finance');
  if (/\b(consulting|strategy|management)\b/.test(content)) categories.push('Consulting');
  if (/\b(manufacturing|production|industrial)\b/.test(content)) categories.push('Manufacturing');
  
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
    console.log(`🚀 Starting TU Delft scrape with run ID: ${runId}`);
    
    const jobs = await scrapeTUDelft(runId);
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
