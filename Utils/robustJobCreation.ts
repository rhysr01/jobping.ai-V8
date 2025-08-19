// Robust Job Creation Utility
// Implements minimal viable record, early-career gate, and comprehensive tagging

import * as crypto from 'crypto';
import { Job, createJobCategories, extractCareerPathFromCategories } from '../scrapers/types';

export interface JobCreationResult {
  job: Job | null;
  funnelStage: 'raw' | 'eligibility' | 'career_tagging' | 'location_tagging' | 'finalized';
  reason?: string;
}

export interface FunnelTelemetry {
  raw: number;
  eligible: number;
  careerTagged: number;
  locationTagged: number;
  inserted: number;
  updated: number;
  errors: string[];
  samples: string[];
}

// Standardized funnel logging function
export function logFunnelMetrics(platform: string, funnel: FunnelTelemetry): void {
  const eligibleRatio = funnel.raw > 0 ? (funnel.eligible / funnel.raw * 100).toFixed(1) : '0.0';
  const unknownLocationPct = funnel.raw > 0 ? 
    ((funnel.raw - funnel.locationTagged) / funnel.raw * 100).toFixed(1) : '0.0';
  
  console.log(`📊 ${platform.toUpperCase()} FUNNEL: Raw=${funnel.raw}, Eligible=${funnel.eligible} (${eligibleRatio}%), Career=${funnel.careerTagged}, Location=${funnel.locationTagged}, Inserted=${funnel.inserted}, Updated=${funnel.updated}, Errors=${funnel.errors.length}, UnknownLocation=${unknownLocationPct}%`);
  
  if (funnel.samples.length > 0) {
    console.log(`📝 ${platform.toUpperCase()} SAMPLES: ${funnel.samples.slice(0, 5).join(' | ')}`);
  }
  
  // Enforce early-career ratio requirements
  const ratio = funnel.raw > 0 ? funnel.eligible / funnel.raw : 0;
  const minRatio = platform === 'workday' ? 0.5 : 0.7;
  
  if (ratio < minRatio) {
    console.warn(`⚠️ ${platform.toUpperCase()}: Eligible ratio ${(ratio * 100).toFixed(1)}% below minimum ${(minRatio * 100)}%`);
  }
  
  // Enforce location caps
  const unknownLocationRatio = funnel.raw > 0 ? (funnel.raw - funnel.locationTagged) / funnel.raw : 0;
  const maxUnknownLocation = platform === 'remoteok' ? 0.4 : 0.25;
  
  if (unknownLocationRatio > maxUnknownLocation) {
    console.warn(`⚠️ ${platform.toUpperCase()}: Unknown location ratio ${(unknownLocationRatio * 100).toFixed(1)}% exceeds cap ${(maxUnknownLocation * 100)}%`);
  }
}

// Early-career eligibility check (recall-first, safe)
export function isEarlyCareerEligible(title: string, description: string): { eligible: boolean; uncertain: boolean; reason: string } {
  const content = `${title} ${description}`.toLowerCase();
  
  // Positive signals (any of these = eligible)
  const positiveSignals = [
    'intern', 'internship', 'graduate', 'trainee', 'junior', 'entry[- ]level',
    '0-2 years', 'no experience required', 'new grad', 'recent graduate',
    'entry level', 'associate', 'assistant', 'coordinator'
  ];
  
  const hasPositiveSignal = positiveSignals.some(signal => 
    new RegExp(`\\b${signal.replace('[- ]', '[- ]?')}\\b`).test(content)
  );
  
  // Strong senior signals (exclude only when unambiguous)
  const seniorSignals = [
    'senior', 'sr\\.', 'principal', 'staff', 'lead', 'director', 'architect',
    '10\\+ years', 'experienced.*(5|6|7|8|9|10)', 'vp', 'vice president',
    'head of', 'chief', 'manager.*(5|6|7|8|9|10)'
  ];
  
  const hasStrongSeniorSignal = seniorSignals.some(signal => 
    new RegExp(`\\b${signal}\\b`).test(content)
  );
  
  // Check for ambiguous cases (e.g., "manager trainee", "specialist (graduate)")
  const ambiguousCases = [
    'manager trainee', 'trainee manager', 'graduate specialist',
    'junior manager', 'associate director', 'entry level lead'
  ];
  
  const isAmbiguous = ambiguousCases.some(ambiguous => 
    content.includes(ambiguous)
  );
  
  if (hasPositiveSignal && !hasStrongSeniorSignal) {
    return { eligible: true, uncertain: false, reason: 'positive_signal' };
  }
  
  if (isAmbiguous) {
    return { eligible: true, uncertain: true, reason: 'ambiguous_case' };
  }
  
  if (hasStrongSeniorSignal) {
    return { eligible: false, uncertain: false, reason: 'senior_signal' };
  }
  
  // Default: include if no clear signals (permissive)
  return { eligible: true, uncertain: true, reason: 'no_clear_signals' };
}

// Location tagging (EU-first, permissive)
export function extractLocationTags(location: string, isRemote: boolean): string[] {
  const locationLower = location.toLowerCase().trim();
  
  // EU countries and cities
  const euCountries = [
    'germany', 'france', 'italy', 'spain', 'netherlands', 'belgium', 'austria',
    'ireland', 'denmark', 'sweden', 'finland', 'norway', 'switzerland',
    'poland', 'czech republic', 'hungary', 'romania', 'bulgaria', 'croatia',
    'slovenia', 'slovakia', 'estonia', 'latvia', 'lithuania', 'luxembourg',
    'malta', 'cyprus', 'greece', 'portugal'
  ];
  
  const euCities = [
    'berlin', 'munich', 'hamburg', 'frankfurt', 'cologne', 'stuttgart',
    'paris', 'lyon', 'marseille', 'toulouse', 'nice', 'nantes',
    'madrid', 'barcelona', 'valencia', 'seville', 'bilbao',
    'amsterdam', 'rotterdam', 'the hague', 'utrecht', 'eindhoven',
    'brussels', 'antwerp', 'ghent', 'bruges',
    'vienna', 'salzburg', 'innsbruck', 'graz',
    'dublin', 'cork', 'galway', 'limerick',
    'copenhagen', 'aarhus', 'odense', 'aalborg',
    'stockholm', 'gothenburg', 'malmo', 'uppsala',
    'helsinki', 'tampere', 'turku', 'oulu',
    'oslo', 'bergen', 'trondheim', 'stavanger',
    'zurich', 'geneva', 'basel', 'bern', 'lausanne',
    'warsaw', 'krakow', 'wroclaw', 'gdansk', 'poznan',
    'prague', 'brno', 'ostrava', 'plzen',
    'budapest', 'debrecen', 'szeged', 'miskolc',
    'bucharest', 'cluj-napoca', 'timisoara', 'iasi',
    'sofia', 'plovdiv', 'varna', 'burgas',
    'zagreb', 'split', 'rijeka', 'osijek',
    'ljubljana', 'maribor', 'celje', 'kranj',
    'bratislava', 'kosice', 'zilina', 'nitra',
    'tallinn', 'tartu', 'narva', 'parnu',
    'riga', 'daugavpils', 'liepaja', 'jelgava',
    'vilnius', 'kaunas', 'klaipeda', 'siauliai',
    'luxembourg city', 'esch-sur-alzette', 'differdange',
    'valletta', 'birgu', 'sliema', 'st julians',
    'nicosia', 'limassol', 'larnaca', 'paphos',
    'athens', 'thessaloniki', 'patras', 'heraklion',
    'lisbon', 'porto', 'braga', 'coimbra'
  ];
  
  // Check for EU location
  const isEUCountry = euCountries.some(country => locationLower.includes(country));
  const isEUCity = euCities.some(city => locationLower.includes(city));
  
  if (isEUCountry || isEUCity) {
    const locationTag = locationLower.replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    return [`loc:${locationTag}`];
  }
  
  // Check for EU remote
  if (isRemote && (locationLower.includes('eu') || locationLower.includes('europe') || locationLower.includes('emea'))) {
    return ['loc:eu-remote'];
  }
  
  // Unknown location
  return ['loc:unknown'];
}

// URL/locator robustness
export function createJobUrl(jobUrl: string, companyUrl: string, title: string): { url: string; tags: string[] } {
  let finalUrl = jobUrl;
  const tags: string[] = [];
  
  // Canonicalize URL
  if (finalUrl) {
    finalUrl = finalUrl.toLowerCase().trim();
    // Remove query parameters and hash
    finalUrl = finalUrl.split('?')[0].split('#')[0];
    // Remove trailing slash
    finalUrl = finalUrl.replace(/\/$/, '');
  }
  
  // If no direct URL, use company careers page
  if (!finalUrl || finalUrl === companyUrl) {
    finalUrl = companyUrl;
    tags.push('locator:manual');
  }
  
  // Add search hint
  const titleWords = title.toLowerCase().split(/\s+/).slice(0, 3);
  const searchHint = titleWords.join('|');
  tags.push(`hint:${searchHint}`);
  
  return { url: finalUrl, tags };
}

// Create job hash (stable dedup)
export function createJobHash(title: string, company: string, url: string): string {
  const canonicalTitle = title.toLowerCase().trim();
  const canonicalCompany = company.toLowerCase().trim();
  const canonicalUrl = url.toLowerCase().trim().split('?')[0].split('#')[0].replace(/\/$/, '');
  
  return crypto.createHash('md5').update(`${canonicalTitle}-${canonicalCompany}-${canonicalUrl}`).digest('hex');
}

// Calculate freshness tier based on posted date
function calculateFreshnessTier(postedAt: string): string {
  const postedDate = new Date(postedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 48) return 'ultra_fresh';
  if (hoursDiff < 168) return 'fresh'; // 7 days
  return 'comprehensive';
}

// Robust job creation with all requirements
export function createRobustJob(params: {
  title: string;
  company: string;
  location: string;
  jobUrl: string;
  companyUrl: string;
  description: string;
  department?: string;
  postedAt?: string;
  runId: string;
  source: string;
  isRemote?: boolean;
}): JobCreationResult {
  const { title, company, location, jobUrl, companyUrl, description, department, postedAt, runId, source, isRemote = false } = params;
  
  // 1. Minimal viable record check
  if (!title || !company) {
    return { job: null, funnelStage: 'raw', reason: 'missing_title_or_company' };
  }
  
  // 2. Early-career eligibility check
  const eligibility = isEarlyCareerEligible(title, description);
  if (!eligibility.eligible) {
    console.log(`⚠️ Filtered out "${title}" - ${eligibility.reason}`);
    return { job: null, funnelStage: 'eligibility', reason: eligibility.reason };
  }
  
  // 3. URL/locator handling
  const urlResult = createJobUrl(jobUrl, companyUrl, title);
  
  // 4. Location tagging
  const locationTags = extractLocationTags(location, isRemote);
  
  // 5. Career path extraction
  const { extractCareerPath } = require('./jobMatching');
  const careerPath = extractCareerPath(title, description);
  
  // 6. Build tags
  const tags = [
    // Early-career marker
    eligibility.uncertain ? 'eligibility:uncertain' : 'early-career',
    // Location
    ...locationTags,
    // URL/locator
    ...urlResult.tags,
    // Freshness
    postedAt ? 'freshness:known' : 'freshness:unknown',
    // Department
    department ? `dept:${department.toLowerCase().replace(/\s+/g, '-')}` : 'dept:general'
  ];
  
  // 7. Create categories with career path
  const categories = createJobCategories(careerPath, tags);
  
  // 8. Create job hash
  const jobHash = createJobHash(title, company, urlResult.url);
  
  // 9. Build final job object
  const job: Job = {
    title: title.trim(),
    company: company.trim(),
    location: location || 'unknown',
    job_url: urlResult.url,
    description: description ? description.trim().slice(0, 2000) : 'Description not available',
    categories,
    experience_required: eligibility.uncertain ? 'uncertain' : 'early-career',
    work_environment: isRemote ? 'remote' : 'hybrid',
    language_requirements: [], // Default to empty array
    source,
    job_hash: jobHash,
    posted_at: postedAt || new Date().toISOString(),
    scraper_run_id: runId,
    company_profile_url: companyUrl,
    scrape_timestamp: new Date().toISOString(),
    original_posted_date: postedAt || new Date().toISOString(),
    last_seen_at: new Date().toISOString(),
    is_active: true,
    freshness_tier: calculateFreshnessTier(postedAt || new Date().toISOString()),
    created_at: new Date().toISOString(),
  };
  
  return { 
    job, 
    funnelStage: 'finalized',
    reason: eligibility.uncertain ? 'eligible_uncertain' : 'eligible_clear'
  };
}

// Funnel telemetry tracking
export class FunnelTelemetryTracker {
  private telemetry: FunnelTelemetry = {
    raw: 0,
    eligible: 0,
    careerTagged: 0,
    locationTagged: 0,
    inserted: 0,
    updated: 0,
    errors: [],
    samples: []
  };
  
  recordRaw() { this.telemetry.raw++; }
  recordEligibility() { this.telemetry.eligible++; }
  recordCareerTagging() { this.telemetry.careerTagged++; }
  recordLocationTagging() { this.telemetry.locationTagged++; }
  recordInserted() { this.telemetry.inserted++; }
  recordUpdated() { this.telemetry.updated++; }
  recordError(error: string) { this.telemetry.errors.push(error); }
  
  addSampleTitle(title: string) {
    if (this.telemetry.samples.length < 5) {
      this.telemetry.samples.push(title);
    }
  }
  
  getTelemetry(): FunnelTelemetry {
    return { ...this.telemetry };
  }
  
  logTelemetry(platform: string) {
    const eligibleRatio = this.telemetry.raw > 0 ? (this.telemetry.eligible / this.telemetry.raw).toFixed(2) : '0.00';
    console.log(`📊 ${platform.toUpperCase()} FUNNEL: Raw=${this.telemetry.raw}, Eligible=${this.telemetry.eligible}, Career=${this.telemetry.careerTagged}, Location=${this.telemetry.locationTagged}, Inserted=${this.telemetry.inserted}, Updated=${this.telemetry.updated}, Errors=${this.telemetry.errors.length}, EligibleRatio=${eligibleRatio}`);
    
    if (this.telemetry.samples.length > 0) {
      console.log(`   Sample titles:`);
      this.telemetry.samples.forEach((title, i) => {
        console.log(`     ${i + 1}. ${title}`);
      });
    }
    
    if (this.telemetry.errors.length > 0) {
      console.log(`   Errors:`);
      this.telemetry.errors.forEach((error, i) => {
        console.log(`     ${i + 1}. ${error}`);
      });
    }
    
    // Sanity check
    if (this.telemetry.raw > 0 && this.telemetry.inserted + this.telemetry.updated === 0) {
      console.warn(`⚠️ Suspicious: ${this.telemetry.raw} raw jobs but 0 upserts`);
    }
  }
}
