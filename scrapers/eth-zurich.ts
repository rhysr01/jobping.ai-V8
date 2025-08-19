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
  'Accept-Language': 'en-CH,de;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://www.google.com/',
  'DNT': '1',
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ETH Zurich Career Portal URLs
const ETH_URLS = [
  'https://ethz.ch/en/the-eth-zurich/working-teaching-and-research/working-at-eth-zurich/jobs.html',
  'https://ethz.ch/en/the-eth-zurich/working-teaching-and-research/working-at-eth-zurich/student-jobs.html',
  'https://ethz.ch/en/the-eth-zurich/working-teaching-and-research/working-at-eth-zurich/internships.html',
  'https://ethz.ch/en/the-eth-zurich/working-teaching-and-research/working-at-eth-zurich/graduate-opportunities.html',
  'https://ethz.ch/en/the-eth-zurich/working-teaching-and-research/working-at-eth-zurich/career-services.html'
];

// Swiss/German graduate keywords
const SWISS_GRADUATE_KEYWORDS = [
  'absolvent', 'absolventin', 'junior', 'trainee', 'graduate',
  'recent graduate', 'new graduate', 'young professional',
  'traineeship', 'graduate programme', 'einstiegsposition',
  'praktikant', 'praktikantin', 'internship', 'entry level',
  'berufseinsteiger', 'berufseinsteigerin', 'starter'
];

// Swiss/German senior keywords to exclude
const SWISS_SENIOR_KEYWORDS = [
  'senior', 'erfahren', 'lead', 'leiter', 'manager', 'direktor',
  '5+ jahre', '3+ jahre erfahrung', 'expert', 'spezialist',
  'chef', 'haupt', 'ober', 'leitend'
];

export async function scrapeETHZurich(runId: string): Promise<Job[]> {
  const jobs: Job[] = [];
  const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  const scrapeStart = Date.now();

  console.log('🇨🇭 Starting ETH Zurich career portal scraping...');

  try {
    for (const url of ETH_URLS) {
      try {
        console.log(`📡 Scraping ${url}...`);
        
        const { data: html } = await axios.get(url, {
          headers: getRandomHeaders(userAgent),
          timeout: 15000,
        });

        const $ = cheerio.load(html);
        const pageJobs = parseETHJobs($, url, runId);
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
    console.log(`🇨🇭 ETH Zurich scraping completed: ${jobs.length} jobs in ${duration}ms`);
    
    PerformanceMonitor.trackDuration('eth_zurich_scraping', scrapeStart);
    
    return jobs;
    
  } catch (error) {
    console.error('❌ ETH Zurich scraping failed:', error);
    PerformanceMonitor.trackDuration('eth_zurich_scraping', scrapeStart);
    return [];
  }
}

function parseETHJobs($: cheerio.CheerioAPI, baseUrl: string, runId: string): Job[] {
  const jobs: Job[] = [];
  
  // Multiple parsing formats for ETH Zurich
  const parseFormats = [
    parseAcademicFormat,
    parseStudentJobsFormat,
    parseStandardFormat
  ];
  
  for (const parseFormat of parseFormats) {
    const foundJobs = parseFormat($, baseUrl, runId);
    if (foundJobs.length > 0) {
      jobs.push(...foundJobs);
      console.log(`🇨🇭 ETH Zurich: Found ${foundJobs.length} jobs using ${parseFormat.name}`);
      break;
    }
  }
  
  return jobs;
}

function parseAcademicFormat($: cheerio.CheerioAPI, baseUrl: string, runId: string): Job[] {
  const jobs: Job[] = [];
  
  // Academic/research positions (often in German/English)
  $('.job-listing, .position, .vacancy, .stelle, .job-posting, .career-opportunity').each((_, element) => {
    try {
      const $job = $(element);
      
      const title = $job.find('.job-title, .position-title, h3, h2, .title, .stellenbezeichnung').first().text().trim();
      const company = $job.find('.company, .employer, .organisation, .institut, .department').first().text().trim() || 'ETH Zurich';
      const location = $job.find('.location, .job-location, .ort, .stadt, .city').first().text().trim() || 'Zurich, Switzerland';
      const description = $job.find('.job-description, .description, .beschreibung, .details, p').first().text().trim();
      const jobUrl = $job.find('a').attr('href') || '';
      
      if (!title || !jobUrl) return;

      // Filter for graduate/student opportunities
      if (!isGraduateRole(title, description)) return;

      const job = createETHJob(title, company, location, description, jobUrl, runId, 'Academic');
      jobs.push(job);
      
    } catch (error) {
      console.warn('⚠️ Error processing ETH academic job:', error);
    }
  });
  
  return jobs;
}

function parseStudentJobsFormat($: cheerio.CheerioAPI, baseUrl: string, runId: string): Job[] {
  const jobs: Job[] = [];
  
  // Student-specific positions
  $('.student-job, .studentenjob, .praktikum, .internship, .graduate-opportunity').each((_, element) => {
    try {
      const $job = $(element);
      
      const title = $job.find('h3, h2, .title, .titel').first().text().trim();
      const company = $job.find('.company, .employer, .organisation').first().text().trim() || 'ETH Zurich';
      const location = $job.find('.location, .city, .ort').first().text().trim() || 'Zurich, Switzerland';
      const description = $job.find('.description, .beschreibung, p, .details').first().text().trim();
      const jobUrl = $job.find('a').attr('href') || '';
      
      if (!title || !jobUrl) return;

      if (!isGraduateRole(title, description)) return;

      const job = createETHJob(title, company, location, description, jobUrl, runId, 'StudentJobs');
      jobs.push(job);
      
    } catch (error) {
      console.warn('⚠️ Error processing ETH student job:', error);
    }
  });
  
  return jobs;
}

function parseStandardFormat($: cheerio.CheerioAPI, baseUrl: string, runId: string): Job[] {
  const jobs: Job[] = [];
  
  // Standard international format
  $('.job-listing, .opportunity, .position, .career, .vacancy, .job').each((_, element) => {
    try {
      const $job = $(element);
      
      const title = $job.find('h3, h2, .title, .job-title').first().text().trim();
      const company = $job.find('.company, .employer, .organisation').first().text().trim() || 'ETH Zurich';
      const location = $job.find('.location, .city, .address').first().text().trim() || 'Switzerland';
      const description = $job.find('.description, p, .details, .summary').first().text().trim();
      const jobUrl = $job.find('a').attr('href') || '';
      
      if (!title || !jobUrl) return;

      if (!isGraduateRole(title, description)) return;

      const job = createETHJob(title, company, location, description, jobUrl, runId, 'Standard');
      jobs.push(job);
      
    } catch (error) {
      console.warn('⚠️ Error processing ETH standard job:', error);
    }
  });
  
  return jobs;
}

function createETHJob(title: string, company: string, location: string, description: string, jobUrl: string, runId: string, source: string): Job {
  // Generate job hash
  const jobHash = crypto.createHash('md5').update(`${title}-${company}-${jobUrl}`).digest('hex');

  // Analyze job content
  const analysis = analyzeETHJobContent(title, description);

  // Extract posting date
  const dateText = ''; // ETH doesn't always show dates prominently
  const dateResult = extractPostingDate(dateText, 'eth-zurich', jobUrl);
  const postedAt = dateResult.success && dateResult.date ? dateResult.date : new Date().toISOString();

  return {
    job_hash: jobHash,
    title: title,
    company: company,
    location: location,
    job_url: jobUrl.startsWith('http') ? jobUrl : `https://ethz.ch${jobUrl}`,
    description: description.slice(0, 2000),
    experience_required: analysis.experienceLevel,
    work_environment: analysis.workEnvironment,
    source: 'eth-zurich',
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
  
  // Combine English and Swiss/German keywords
  const allGraduateKeywords = [
    'graduate', 'grad', 'recent graduate', 'new graduate', 'graduate programme',
    'graduate scheme', 'graduate trainee', 'graduate analyst', 'graduate engineer',
    'intern', 'internship', 'student', 'part-time', 'summer intern', 'placement',
    'entry level', 'entry-level', 'junior', 'trainee', 'associate', 'starter',
    '0-1 year', '0-2 year', 'no experience', 'campus', 'university', 'college',
    'final year', 'penultimate year', 'undergraduate', 'postgraduate',
    ...SWISS_GRADUATE_KEYWORDS
  ];
  
  const allSeniorKeywords = [
    'senior', 'sr.', 'lead', 'principal', 'staff', 'director', 'manager',
    'head of', 'chief', 'vp', 'vice president', 'architect', 'expert',
    'specialist', '5+ year', '3+ year', 'experienced', 'mid-level',
    ...SWISS_SENIOR_KEYWORDS
  ];
  
  const hasGraduateKeywords = allGraduateKeywords.some(keyword => text.includes(keyword));
  const hasSeniorKeywords = allSeniorKeywords.some(keyword => text.includes(keyword));
  
  return hasGraduateKeywords && !hasSeniorKeywords;
}

function analyzeETHJobContent(title: string, description: string) {
  const content = `${title} ${description}`.toLowerCase();
  
  // Determine experience level
  let experienceLevel = 'entry-level';
  if (/\b(intern|internship|praktikum|praktikant)\b/.test(content)) experienceLevel = 'internship';
  else if (/\b(graduate|grad|absolvent)\b/.test(content)) experienceLevel = 'graduate';
  else if (/\b(junior|entry|associate|trainee|starter|einstieg)\b/.test(content)) experienceLevel = 'entry-level';
  
  // Extract language requirements
  const languages: string[] = [];
  const langMatches = content.match(/\b(english|german|deutsch|french|français|italian|italiano|swiss)\b/g);
  if (langMatches) {
    languages.push(...[...new Set(langMatches)]);
  }
  
  // Default to English for Swiss tech jobs
  if (languages.length === 0) {
    languages.push('English');
  }
  
  // Determine work environment
  let workEnvironment = 'hybrid';
  if (/\b(remote|work from home|wfh|homeoffice)\b/.test(content)) workEnvironment = 'remote';
  else if (/\b(office|on-site|on site|büro)\b/.test(content)) workEnvironment = 'on-site';
  
  // Extract categories with Swiss focus (engineering + finance)
  const categories: string[] = ['University Career Portal', 'Swiss Market'];
  if (experienceLevel === 'internship') categories.push('Internship');
  if (experienceLevel === 'graduate') categories.push('Graduate');
  if (experienceLevel === 'entry-level') categories.push('Entry-Level');
  
  // Add industry categories (Swiss strengths)
  if (/\b(software|developer|programming|coding|tech)\b/.test(content)) categories.push('Technology');
  if (/\b(engineering|engineer|mechanical|electrical|civil)\b/.test(content)) categories.push('Engineering');
  if (/\b(finance|banking|accounting|audit|fintech)\b/.test(content)) categories.push('Finance');
  if (/\b(research|academic|phd|forschung)\b/.test(content)) categories.push('Research');
  if (/\b(consulting|strategy|management)\b/.test(content)) categories.push('Consulting');
  if (/\b(pharmaceutical|biotech|medtech|healthcare)\b/.test(content)) categories.push('Healthcare');
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
    console.log(`🚀 Starting ETH Zurich scrape with run ID: ${runId}`);
    
    const jobs = await scrapeETHZurich(runId);
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
