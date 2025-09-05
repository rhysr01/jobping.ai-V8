/**
 * EURES SCRAPER (EU Job Mobility Portal)
 * 
 * FREE EU EARLY-CAREER JOB SCRAPER
 * - No API key required (web scraping)
 * - EU-wide job mobility coverage
 * - Early-career filtering with multi-language support
 * - Track-based query rotation (A/B/C/D/E)
 * - Rate limiting and circuit breakers
 * - Comprehensive metrics and logging
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { classifyEarlyCareer } from './utils.js';

interface IngestJob {
  title: string;
  company: string;
  location: string;
  description: string;
  url: string;
  posted_at: string;
  source: string;
}

interface EURESJob {
  id: string;
  title: string;
  employer: string;
  location: string;
  description: string;
  url: string;
  postedDate: string;
  country: string;
  contractType: string;
}

const EURES_CONFIG = {
  baseUrl: 'https://eures.europa.eu/portal/jv-se/search',
  
  // EU-wide early-career keywords in multiple languages
  keywords: [
    'graduate', 'junior', 'entry level', 'trainee', 'intern',
    'absolvent', 'berufseinsteiger', 'stagiaire', 'diplomé',
    'laureato', 'becario', 'praktykant', 'čerstvý absolvent'
  ],
  
  // EU countries for job search
  countries: [
    'GB', 'IE', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH',
    'SE', 'DK', 'NO', 'FI', 'PL', 'CZ', 'HU', 'PT', 'GR'
  ],
  
  // Rate limiting (web scraping - be conservative)
  requestInterval: 5000, // 5 second delay
  maxRequestsPerHour: 30,
  seenJobTTL: 96 * 60 * 60 * 1000, // 96 hours (EURES updates slowly)
  
  maxResultsPerSearch: 50
};

// Track-based query rotation (your proven approach)
type Track = 'A' | 'B' | 'C' | 'D' | 'E';

const EURES_TRACK_QUERIES: Record<Track, string> = {
  A: 'software OR developer OR IT graduate', // Tech focus
  B: 'business analyst OR consultant trainee', // Business focus
  C: 'marketing OR sales graduate', // Growth focus
  D: 'data analyst OR research junior', // Analytics focus
  E: 'engineer OR technical graduate' // Engineering focus
};

export class EUREScraper {
  private requestCount = 0;
  private hourlyRequestCount = 0;
  private lastRequestTime = 0;
  private lastHourReset = Date.now();
  private seenJobs: Map<string, number> = new Map();

  constructor() {
    this.cleanupSeenJobs();
    setInterval(() => this.cleanupSeenJobs(), 60 * 60 * 1000);
  }

  private cleanupSeenJobs(): void {
    const cutoff = Date.now() - EURES_CONFIG.seenJobTTL;
    for (const [jobId, timestamp] of this.seenJobs.entries()) {
      if (timestamp < cutoff) {
        this.seenJobs.delete(jobId);
      }
    }
  }

  private resetHourlyCount(): void {
    const now = Date.now();
    if (now - this.lastHourReset > 60 * 60 * 1000) {
      this.hourlyRequestCount = 0;
      this.lastHourReset = now;
    }
  }

  private getTrackForDay(): Track {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const tracks: Track[] = ['A', 'B', 'C', 'D', 'E'];
    return tracks[dayOfYear % 5];
  }

  private async throttleRequest(): Promise<void> {
    this.resetHourlyCount();
    
    if (this.hourlyRequestCount >= EURES_CONFIG.maxRequestsPerHour) {
      const waitTime = 60 * 60 * 1000 - (Date.now() - this.lastHourReset);
      if (waitTime > 0) {
        console.log(`⏰ Rate limit reached, waiting ${Math.round(waitTime / 1000 / 60)} minutes`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.resetHourlyCount();
      }
    }
    
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < EURES_CONFIG.requestInterval) {
      const delay = EURES_CONFIG.requestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async makeRequest(params: Record<string, any>): Promise<string> {
    await this.throttleRequest();

    try {
      const response = await axios.get(EURES_CONFIG.baseUrl, {
        params: {
          lang: 'en',
          keywords: params.keywords,
          countryCode: params.countryCode || 'EU',
          page: params.page || 1,
          ...params
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JobPingBot/1.0; +https://jobping.ai/bot)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 20000
      });

      this.requestCount++;
      this.hourlyRequestCount++;
      
      return response.data;

    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn('🚫 Rate limited by EURES, backing off...');
        await new Promise(resolve => setTimeout(resolve, 15000)); // 15 second backoff
        return this.makeRequest(params);
      }
      throw error;
    }
  }

  private parseJobsFromHTML(html: string): EURESJob[] {
    const $ = cheerio.load(html);
    const jobs: EURESJob[] = [];

    // EURES job listing selector (may need adjustment based on actual HTML structure)
    $('.job-item, .vacancy-item, .eures-job, .search-result-item').each((index, element) => {
      try {
        const $job = $(element);
        
        // Extract job details with multiple possible selectors
        const title = $job.find('.job-title, .vacancy-title, h3 a, .title a, .result-title').first().text().trim();
        const employer = $job.find('.employer, .company, .employer-name, .result-employer').first().text().trim();
        const location = $job.find('.location, .job-location, .workplace, .result-location').first().text().trim();
        const description = $job.find('.description, .job-description, .summary, .result-description').first().text().trim();
        const url = $job.find('a').first().attr('href') || '';
        const postedDate = $job.find('.date, .posted-date, .publication-date, .result-date').first().text().trim();
        
        // Extract country from location or other indicators
        const country = this.extractCountryFromLocation(location);
        
        // Generate unique ID
        const id = `eures_${title.toLowerCase().replace(/\s+/g, '_')}_${employer.toLowerCase().replace(/\s+/g, '_')}`;

        if (title && employer && location) {
          jobs.push({
            id,
            title,
            employer,
            location,
            description: description || title,
            url: url.startsWith('http') ? url : `https://eures.europa.eu${url}`,
            postedDate: postedDate || new Date().toISOString(),
            country,
            contractType: 'Full-time' // Default
          });
        }
      } catch (error) {
        console.warn(`Failed to parse EURES job element:`, error);
      }
    });

    return jobs;
  }

  private extractCountryFromLocation(location: string): string {
    const countryMappings: Record<string, string> = {
      'germany': 'DE', 'deutschland': 'DE', 'allemagne': 'DE',
      'united kingdom': 'GB', 'uk': 'GB', 'britain': 'GB',
      'france': 'FR', 'frankreich': 'FR', 'francia': 'FR',
      'spain': 'ES', 'españa': 'ES', 'espagne': 'ES',
      'italy': 'IT', 'italia': 'IT', 'italie': 'IT',
      'netherlands': 'NL', 'holland': 'NL', 'pays-bas': 'NL',
      'belgium': 'BE', 'belgique': 'BE', 'belgië': 'BE',
      'austria': 'AT', 'österreich': 'AT', 'autriche': 'AT',
      'switzerland': 'CH', 'schweiz': 'CH', 'suisse': 'CH',
      'sweden': 'SE', 'schweden': 'SE', 'suède': 'SE',
      'denmark': 'DK', 'dänemark': 'DK', 'danemark': 'DK',
      'ireland': 'IE', 'irland': 'IE', 'irlande': 'IE',
      'poland': 'PL', 'polen': 'PL', 'pologne': 'PL'
    };

    const lowerLocation = location.toLowerCase();
    for (const [country, code] of Object.entries(countryMappings)) {
      if (lowerLocation.includes(country)) {
        return code;
      }
    }

    return 'EU'; // Default to EU if country can't be determined
  }

  private convertToIngestJob(euresJob: EURESJob): IngestJob {
    return {
      title: euresJob.title,
      company: euresJob.employer,
      location: euresJob.location,
      description: euresJob.description,
      url: euresJob.url,
      posted_at: euresJob.postedDate,
      source: 'eures'
    };
  }

  public async scrapeWithTrackRotation(): Promise<{ jobs: IngestJob[]; metrics: any }> {
    const track = this.getTrackForDay();
    const query = EURES_TRACK_QUERIES[track];
    const allJobs: IngestJob[] = [];
    
    const metrics = {
      track,
      query,
      totalJobsFound: 0,
      earlyCareerJobs: 0,
      requestsUsed: 0,
      hourlyBudgetRemaining: EURES_CONFIG.maxRequestsPerHour - this.hourlyRequestCount,
      errors: 0,
      startTime: new Date().toISOString()
    };

    console.log(`🔄 EURES scraping with Track ${track}: ${query}`);

    try {
      // Search EU-wide for early-career positions
      const params = {
        keywords: query,
        countryCode: 'EU',
        page: 1
      };

      const html = await this.makeRequest(params);
      const euresJobs = this.parseJobsFromHTML(html);
      
      console.log(`📊 Found ${euresJobs.length} jobs for "${query}"`);

      for (const job of euresJobs) {
        if (!this.seenJobs.has(job.id)) {
          this.seenJobs.set(job.id, Date.now());
          
          try {
            const ingestJob = this.convertToIngestJob(job);
            
            // ✅ Apply early-career filtering
            const isEarlyCareer = classifyEarlyCareer(ingestJob);
            if (isEarlyCareer) {
              allJobs.push(ingestJob);
              console.log(`✅ Early-career: ${ingestJob.title} at ${ingestJob.company} (${job.country})`);
            } else {
              console.log(`🚫 Skipped senior: ${ingestJob.title} at ${ingestJob.company}`);
            }
          } catch (error) {
            console.warn(`Failed to process job ${job.id}:`, error);
            metrics.errors++;
          }
        }
      }

      // If we have budget and few results, try a broader search
      if (allJobs.length < 10 && this.hourlyRequestCount < EURES_CONFIG.maxRequestsPerHour - 2) {
        console.log(`📄 Low results, trying broader search...`);
        
        const broadParams = {
          keywords: 'graduate OR junior OR trainee',
          countryCode: 'EU',
          page: 1
        };

        const broadHtml = await this.makeRequest(broadParams);
        const broadJobs = this.parseJobsFromHTML(broadHtml);
        
        for (const job of broadJobs) {
          if (!this.seenJobs.has(job.id)) {
            this.seenJobs.set(job.id, Date.now());
            
            const ingestJob = this.convertToIngestJob(job);
            const isEarlyCareer = classifyEarlyCareer(ingestJob);
            if (isEarlyCareer) {
              allJobs.push(ingestJob);
              console.log(`✅ Early-career (broad): ${ingestJob.title} at ${ingestJob.company}`);
            }
          }
        }
      }

    } catch (error: any) {
      console.error(`❌ Error in EURES scraping:`, error.message);
      metrics.errors++;
    }

    metrics.totalJobsFound = allJobs.length;
    metrics.earlyCareerJobs = allJobs.length;
    metrics.requestsUsed = this.requestCount;
    metrics.hourlyBudgetRemaining = EURES_CONFIG.maxRequestsPerHour - this.hourlyRequestCount;

    console.log(`📊 EURES scraping complete: ${metrics.earlyCareerJobs} early-career jobs found`);

    return { jobs: allJobs, metrics };
  }

  public getStatus(): any {
    this.resetHourlyCount();
    
    return {
      isRunning: false,
      requestsThisHour: this.hourlyRequestCount,
      hourlyBudget: EURES_CONFIG.maxRequestsPerHour,
      hourlyBudgetRemaining: EURES_CONFIG.maxRequestsPerHour - this.hourlyRequestCount,
      seenJobsCount: this.seenJobs.size,
      lastRequestTime: new Date(this.lastRequestTime).toISOString()
    };
  }
}

// Standalone execution for testing
if (require.main === module) {
  async function testEUREScraper() {
    console.log('🧪 Testing EURES Scraper...');
    
    const scraper = new EUREScraper();
    const result = await scraper.scrapeWithTrackRotation();
    
    console.log(`\n📊 Results:`);
    console.log(`- Jobs found: ${result.jobs.length}`);
    console.log(`- Track: ${result.metrics.track}`);
    console.log(`- Query: ${result.metrics.query}`);
    console.log(`- Requests used: ${result.metrics.requestsUsed}`);
    console.log(`- Errors: ${result.metrics.errors}`);
    
    if (result.jobs.length > 0) {
      console.log(`\n🎯 Sample jobs:`);
      result.jobs.slice(0, 3).forEach((job, i) => {
        console.log(`${i + 1}. ${job.title} at ${job.company} (${job.location})`);
      });
    }
  }
  
  testEUREScraper().catch(console.error);
}
