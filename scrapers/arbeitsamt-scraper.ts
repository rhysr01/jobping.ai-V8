/**
 * ARBEITSAMT API SCRAPER (German Federal Job Agency)
 * 
 * FREE EU EARLY-CAREER JOB SCRAPER
 * - No API key required (German government API)
 * - German federal job database
 * - Early-career filtering with German context
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

interface ArbeitsämtJob {
  hashId: string;
  titel: string;
  arbeitgeber: string;
  arbeitsort: {
    ort: string;
    plz: string;
    region: string;
  };
  stellenbeschreibung: string;
  externeUrl: string;
  modifikationsTimestamp: string;
  befristung: string;
  arbeitszeit: string;
  arbeitgeberAdresse: {
    strasse: string;
    hausnummer: string;
    plz: string;
    ort: string;
  };
}

interface ArbeitsämtResponse {
  stellenangebote: ArbeitsämtJob[];
  maxErgebnisse: number;
  page: number;
  size: number;
  facetten: any;
}

const ARBEITSAMT_CONFIG = {
  baseUrl: 'https://jobsuche.api.bund.dev/pc/v1/jobs',
  // ✅ NO API KEY REQUIRED - German government API!
  
  // German early-career keywords
  keywords: [
    'absolvent', 'berufseinsteiger', 'trainee', 'praktikum',
    'junior', 'einstieg', 'student', 'nachwuchs', 'azubi'
  ],
  
  // Location focus (major German cities)
  locations: [
    'Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln',
    'Düsseldorf', 'Stuttgart', 'Leipzig', 'Dresden', 'Hannover'
  ],
  
  // Rate limiting (very generous government API)
  requestInterval: 3000, // 3 second delay
  maxRequestsPerHour: 200,
  seenJobTTL: 72 * 60 * 60 * 1000, // 72 hours
  
  resultsPerPage: 100 // Max allowed
};

// Track-based query rotation (your proven approach)
type Track = 'A' | 'B' | 'C' | 'D' | 'E';

const ARBEITSAMT_TRACK_QUERIES: Record<Track, string> = {
  A: 'software entwickler OR IT absolvent', // IT focus
  B: 'trainee OR junior analyst', // Business focus
  C: 'marketing OR vertrieb absolvent', // Sales/Marketing focus
  D: 'datenanalyst OR business intelligence', // Data focus
  E: 'ingenieur OR techniker absolvent' // Engineering focus
};

export class ArbeitsämtScraper {
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
    const cutoff = Date.now() - ARBEITSAMT_CONFIG.seenJobTTL;
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
    
    if (this.hourlyRequestCount >= ARBEITSAMT_CONFIG.maxRequestsPerHour) {
      const waitTime = 60 * 60 * 1000 - (Date.now() - this.lastHourReset);
      if (waitTime > 0) {
        console.log(`⏰ Rate limit reached, waiting ${Math.round(waitTime / 1000 / 60)} minutes`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.resetHourlyCount();
      }
    }
    
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < ARBEITSAMT_CONFIG.requestInterval) {
      const delay = ARBEITSAMT_CONFIG.requestInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  private async makeRequest(params: Record<string, any>): Promise<ArbeitsämtResponse> {
    await this.throttleRequest();

    try {
      const response = await axios.get(ARBEITSAMT_CONFIG.baseUrl, {
        params: {
          was: params.was,
          wo: params.wo,
          page: params.page || 0,
          size: params.size || ARBEITSAMT_CONFIG.resultsPerPage,
          ...params
        },
        headers: {
          'User-Agent': 'JobPing/1.0 (https://jobping.ai)',
          'Accept': 'application/json'
        },
        timeout: 20000
      });

      this.requestCount++;
      this.hourlyRequestCount++;
      
      return response.data;

    } catch (error: any) {
      if (error.response?.status === 429) {
        console.warn('🚫 Rate limited by Arbeitsamt, backing off...');
        await new Promise(resolve => setTimeout(resolve, 10000));
        return this.makeRequest(params);
      }
      throw error;
    }
  }

  private convertToIngestJob(arbeitsämtJob: ArbeitsämtJob): IngestJob {
    const location = arbeitsämtJob.arbeitsort 
      ? `${arbeitsämtJob.arbeitsort.ort}, Germany`
      : 'Germany';

    return {
      title: arbeitsämtJob.titel,
      company: arbeitsämtJob.arbeitgeber,
      location: location,
      description: arbeitsämtJob.stellenbeschreibung || arbeitsämtJob.titel,
      url: arbeitsämtJob.externeUrl || `https://jobsuche.api.bund.dev/job/${arbeitsämtJob.hashId}`,
      posted_at: arbeitsämtJob.modifikationsTimestamp,
      source: 'arbeitsamt'
    };
  }

  public async scrapeWithTrackRotation(): Promise<{ jobs: IngestJob[]; metrics: any }> {
    const track = this.getTrackForDay();
    const query = ARBEITSAMT_TRACK_QUERIES[track];
    const allJobs: IngestJob[] = [];
    
    const metrics = {
      track,
      query,
      totalJobsFound: 0,
      earlyCareerJobs: 0,
      requestsUsed: 0,
      hourlyBudgetRemaining: ARBEITSAMT_CONFIG.maxRequestsPerHour - this.hourlyRequestCount,
      errors: 0,
      startTime: new Date().toISOString()
    };

    console.log(`🔄 Arbeitsamt scraping with Track ${track}: ${query}`);

    try {
      // Search Germany-wide for early-career positions
      const params = {
        was: query,
        wo: 'deutschland',
        page: 0,
        size: ARBEITSAMT_CONFIG.resultsPerPage
      };

      const response = await this.makeRequest(params);
      console.log(`📊 Found ${response.stellenangebote.length} jobs for "${query}"`);

      for (const job of response.stellenangebote) {
        if (!this.seenJobs.has(job.hashId)) {
          this.seenJobs.set(job.hashId, Date.now());
          
          try {
            const ingestJob = this.convertToIngestJob(job);
            
            // ✅ Apply early-career filtering with German context
            const isEarlyCareer = this.isGermanEarlyCareer(job) || classifyEarlyCareer(ingestJob);
            if (isEarlyCareer) {
              allJobs.push(ingestJob);
              console.log(`✅ Early-career: ${ingestJob.title} at ${ingestJob.company}`);
            } else {
              console.log(`🚫 Skipped senior: ${ingestJob.title} at ${ingestJob.company}`);
            }
          } catch (error) {
            console.warn(`Failed to process job ${job.hashId}:`, error);
            metrics.errors++;
          }
        }
      }

    } catch (error: any) {
      console.error(`❌ Error in Arbeitsamt scraping:`, error.message);
      metrics.errors++;
    }

    metrics.totalJobsFound = allJobs.length;
    metrics.earlyCareerJobs = allJobs.length;
    metrics.requestsUsed = this.requestCount;
    metrics.hourlyBudgetRemaining = ARBEITSAMT_CONFIG.maxRequestsPerHour - this.hourlyRequestCount;

    console.log(`📊 Arbeitsamt scraping complete: ${metrics.earlyCareerJobs} early-career jobs found`);

    return { jobs: allJobs, metrics };
  }

  private isGermanEarlyCareer(job: ArbeitsämtJob): boolean {
    const text = `${job.titel} ${job.stellenbeschreibung || ''}`.toLowerCase();
    
    const germanEarlyCareerKeywords = [
      'absolvent', 'berufseinsteiger', 'trainee', 'praktikum', 'ausbildung',
      'junior', 'einstieg', 'nachwuchs', 'azubi', 'duales studium',
      'ohne berufserfahrung', 'erste berufserfahrung', 'hochschulabsolvent'
    ];
    
    const germanSeniorKeywords = [
      'senior', 'leiter', 'manager', 'teamleiter', 'abteilungsleiter',
      'erfahren', 'langjährig', 'spezialist', 'experte', 'lead'
    ];
    
    const hasEarlyCareerKeyword = germanEarlyCareerKeywords.some(keyword => text.includes(keyword));
    const hasSeniorKeyword = germanSeniorKeywords.some(keyword => text.includes(keyword));
    
    return hasEarlyCareerKeyword && !hasSeniorKeyword;
  }

  public getStatus(): any {
    this.resetHourlyCount();
    
    return {
      isRunning: false,
      requestsThisHour: this.hourlyRequestCount,
      hourlyBudget: ARBEITSAMT_CONFIG.maxRequestsPerHour,
      hourlyBudgetRemaining: ARBEITSAMT_CONFIG.maxRequestsPerHour - this.hourlyRequestCount,
      seenJobsCount: this.seenJobs.size,
      lastRequestTime: new Date(this.lastRequestTime).toISOString()
    };
  }
}

// Standalone execution for testing
if (require.main === module) {
  async function testArbeitsämtScraper() {
    console.log('🧪 Testing Arbeitsamt Scraper...');
    
    const scraper = new ArbeitsämtScraper();
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
  
  testArbeitsämtScraper().catch(console.error);
}
