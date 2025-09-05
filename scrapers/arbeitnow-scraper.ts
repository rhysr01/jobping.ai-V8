/**
 * ARBEITNOW API SCRAPER (Germany + Remote EU)
 * 
 * FREE EU EARLY-CAREER JOB SCRAPER
 * - No API key required
 * - Germany + Remote EU coverage
 * - Early-career filtering with classifyEarlyCareer()
 * - Track-based query rotation (A/B/C/D/E)
 * - Rate limiting and circuit breakers
 * - Comprehensive metrics and logging
 */

import axios from 'axios';
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

interface ArbeitnowJob {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
}

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

// Arbeitnow Configuration
const ARBEITNOW_CONFIG = {
  baseUrl: 'https://www.arbeitnow.com/api/job-board-api',
  // ✅ NO API KEY REQUIRED - completely free!
  
  // Query rotation for early-career diversity (your proven pattern)
  queries: [
    'graduate', 'junior', 'entry', 'trainee', 'praktikum',
    'berufseinsteiger', 'absolvent', 'student', 'intern', 'apprentice'
  ],
  
  // Categories focusing on graduate-friendly roles
  categories: [
    'software-development', 'data-science', 'marketing', 'sales',
    'business-development', 'product-management', 'design', 'finance'
  ],
  
  // Rate limiting (generous - no official limits)
  requestInterval: 2000, // 2 second delay between requests
  maxRequestsPerHour: 100,
  seenJobTTL: 48 * 60 * 60 * 1000, // 48 hours
  
  // Results per page (up to 50)
  resultsPerPage: 50
};

// Track-based query rotation (your proven approach)
type Track = 'A' | 'B' | 'C' | 'D' | 'E';

const TRACK_QUERIES: Record<Track, string> = {
  A: 'graduate developer OR junior software', // Tech focus
  B: 'trainee consultant OR entry analyst', // Business focus
  C: 'junior marketing OR graduate sales', // Growth focus
  D: 'data analyst OR business intelligence', // Analytics focus
  E: 'product manager OR UX designer' // Product/Design focus
};

export class ArbeitnowScraper {
  private requestCount = 0;
  private hourlyRequestCount = 0;
  private lastRequestTime = 0;
  private lastHourReset = Date.now();
  private seenJobs: Map<string, number> = new Map();

  constructor() {
    this.cleanupSeenJobs();
    setInterval(() => this.cleanupSeenJobs(), 60 * 60 * 1000); // Cleanup every hour
  }

  private cleanupSeenJobs(): void {
    const cutoff = Date.now() - ARBEITNOW_CONFIG.seenJobTTL;
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
    
    if (this.hourlyRequestCount >= ARBEITNOW_CONFIG.maxRequestsPerHour) {
      const waitTime = 60 * 60 * 1000 - (Date.now() - this.lastHourReset);
      if (waitTime > 0) {
        console.log(`⏰ Rate limit reached, waiting ${Math.round(waitTime / 1000 / 60)} minutes`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.resetHourlyCount();
      }
    }
    
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < ARBEITNOW_CONFIG.requestInterval) {
      const delay = ARBEITNOW_CONFIG.requestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async makeRequest(params: Record<string, any>): Promise<ArbeitnowResponse> {
    await this.throttleRequest();

    try {
      const response = await axios.get(ARBEITNOW_CONFIG.baseUrl, {
        params: {
          search: params.search,
          location: params.location,
          page: params.page || 1,
          ...params
        },
        headers: {
          'User-Agent': 'JobPing/1.0 (https://jobping.ai)',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      this.requestCount++;
      this.hourlyRequestCount++;
      
      return response.data;

    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn('🚫 Rate limited by Arbeitnow, backing off...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return this.makeRequest(params);
      }
      throw error;
    }
  }

  private convertToIngestJob(arbeitnowJob: ArbeitnowJob): IngestJob {
    return {
      title: arbeitnowJob.title,
      company: arbeitnowJob.company_name,
      location: arbeitnowJob.remote ? 'Remote, Germany' : (arbeitnowJob.location || 'Germany'),
      description: arbeitnowJob.description,
      url: arbeitnowJob.url,
      posted_at: new Date(arbeitnowJob.created_at * 1000).toISOString(),
      source: 'arbeitnow'
    };
  }

  public async scrapeWithTrackRotation(): Promise<{ jobs: IngestJob[]; metrics: any }> {
    const track = this.getTrackForDay();
    const query = TRACK_QUERIES[track];
    const allJobs: IngestJob[] = [];
    
    const metrics = {
      track,
      query,
      totalJobsFound: 0,
      earlyCareerJobs: 0,
      requestsUsed: 0,
      hourlyBudgetRemaining: ARBEITNOW_CONFIG.maxRequestsPerHour - this.hourlyRequestCount,
      errors: 0,
      startTime: new Date().toISOString()
    };

    console.log(`🔄 Arbeitnow scraping with Track ${track}: ${query}`);

    try {
      // Search with early-career focused query
      const params = {
        search: query,
        location: 'remote', // Focus on remote to get EU-wide coverage
        page: 1
      };

      const response = await this.makeRequest(params);
      console.log(`📊 Found ${response.data.length} jobs for "${query}"`);

      for (const job of response.data) {
        const jobKey = `${job.slug}_${job.company_name}`;
        if (!this.seenJobs.has(jobKey)) {
          this.seenJobs.set(jobKey, Date.now());
          
          try {
            const ingestJob = this.convertToIngestJob(job);
            
            // ✅ Apply your proven early-career filtering
            const isEarlyCareer = classifyEarlyCareer(ingestJob);
            if (isEarlyCareer) {
              allJobs.push(ingestJob);
              console.log(`✅ Early-career: ${ingestJob.title} at ${ingestJob.company}`);
            } else {
              console.log(`🚫 Skipped senior: ${ingestJob.title} at ${ingestJob.company}`);
            }
          } catch (error) {
            console.warn(`Failed to process job ${job.slug}:`, error);
            metrics.errors++;
          }
        }
      }

      // If we have budget and results, try page 2
      if (response.meta.last_page > 1 && this.hourlyRequestCount < ARBEITNOW_CONFIG.maxRequestsPerHour - 2) {
        console.log(`📄 Fetching page 2...`);
        
        const page2Response = await this.makeRequest({ ...params, page: 2 });
        
        for (const job of page2Response.data) {
          const jobKey = `${job.slug}_${job.company_name}`;
          if (!this.seenJobs.has(jobKey)) {
            this.seenJobs.set(jobKey, Date.now());
            
            const ingestJob = this.convertToIngestJob(job);
            const isEarlyCareer = classifyEarlyCareer(ingestJob);
            if (isEarlyCareer) {
              allJobs.push(ingestJob);
              console.log(`✅ Early-career (p2): ${ingestJob.title} at ${ingestJob.company}`);
            }
          }
        }
      }

    } catch (error: any) {
      console.error(`❌ Error in Arbeitnow scraping:`, error.message);
      metrics.errors++;
    }

    metrics.totalJobsFound = allJobs.length;
    metrics.earlyCareerJobs = allJobs.length;
    metrics.requestsUsed = this.requestCount;
    metrics.hourlyBudgetRemaining = ARBEITNOW_CONFIG.maxRequestsPerHour - this.hourlyRequestCount;

    console.log(`📊 Arbeitnow scraping complete: ${metrics.earlyCareerJobs} early-career jobs found`);

    return { jobs: allJobs, metrics };
  }

  public getStatus(): any {
    this.resetHourlyCount();
    
    return {
      isRunning: false,
      requestsThisHour: this.hourlyRequestCount,
      hourlyBudget: ARBEITNOW_CONFIG.maxRequestsPerHour,
      hourlyBudgetRemaining: ARBEITNOW_CONFIG.maxRequestsPerHour - this.hourlyRequestCount,
      seenJobsCount: this.seenJobs.size,
      lastRequestTime: new Date(this.lastRequestTime).toISOString()
    };
  }
}

// Standalone execution for testing
if (require.main === module) {
  async function testArbeitnowScraper() {
    console.log('🧪 Testing Arbeitnow Scraper...');
    
    const scraper = new ArbeitnowScraper();
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
  
  testArbeitnowScraper().catch(console.error);
}
