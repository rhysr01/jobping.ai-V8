/**
 * JobPing Job Ingestion System
 * Implements the "If it's early-career and in Europe, save it — always" rule
 */

import type { Job } from '@/scrapers/types';

// Early-career signals that MUST be present for a job to be saved
const EARLY_CAREER_SIGNALS = {
  // Title-based signals (highest priority)
  title: [
    'intern', 'internship', 'graduate', 'junior', 'entry-level', 'entry level',
    'trainee', 'apprentice', 'student', 'new graduate', 'recent graduate',
    'first job', 'entry position', 'starter', 'beginner', 'associate'
  ],
  
  // Description-based signals
  description: [
    '0-2 years', '0 to 2 years', 'no experience required', 'no experience needed',
    'entry level', 'junior level', 'graduate program', 'training program',
    'will train', 'we will train', 'mentorship', 'learning opportunity',
    'career development', 'growth opportunity', 'recent graduate', 'new graduate'
  ],
  
  // Experience level signals
  experience: [
    '0 years', '1 year', '2 years', '3 years', 'no experience',
    'entry level', 'junior', 'associate', 'trainee', 'intern'
  ]
};

// Senior signals that should cause a job to be discarded
const SENIOR_SIGNALS = [
  'senior', 'lead', 'principal', 'manager', 'director', 'head of',
  '10+ years', '15+ years', '20+ years', 'expert', 'specialist',
  'architect', 'consultant', 'advisor', 'strategist'
];

// European countries and regions
const EUROPEAN_REGIONS = [
  // Western Europe
  'United Kingdom', 'UK', 'England', 'Scotland', 'Wales', 'Northern Ireland',
  'Ireland', 'France', 'Germany', 'Netherlands', 'Belgium', 'Luxembourg',
  'Switzerland', 'Austria', 'Italy', 'Spain', 'Portugal',
  
  // Northern Europe
  'Denmark', 'Norway', 'Sweden', 'Finland', 'Iceland',
  
  // Eastern Europe
  'Poland', 'Czech Republic', 'Slovakia', 'Hungary', 'Romania', 'Bulgaria',
  'Croatia', 'Slovenia', 'Estonia', 'Latvia', 'Lithuania',
  
  // Southern Europe
  'Greece', 'Cyprus', 'Malta',
  
  // Remote indicators
  'Remote', 'EU Remote', 'Europe Remote', 'EMEA Remote', 'European Remote'
];

// Career paths mapping for better role identification
const CAREER_PATHS = {
  'Strategy & Business Design': [
    'consulting', 'strategy', 'business design', 'transformation', 'corporate development',
    'business analyst', 'strategy analyst', 'transformation analyst'
  ],
  
  'Data & Analytics': [
    'data analyst', 'business intelligence', 'data scientist', 'research analyst',
    'analytics', 'insights', 'reporting', 'data'
  ],
  
  'Retail & Luxury': [
    'retail', 'merchandising', 'luxury', 'brand', 'fashion', 'consumer goods',
    'retail management', 'brand strategy', 'merchandising analyst'
  ],
  
  'Sales & Client Success': [
    'sales', 'client success', 'account manager', 'business development',
    'customer success', 'sales development', 'account executive'
  ],
  
  'Marketing & Growth': [
    'marketing', 'digital marketing', 'brand marketing', 'content', 'growth',
    'social media', 'SEO', 'PPC', 'growth marketing'
  ],
  
  'Finance & Investment': [
    'finance', 'investment', 'banking', 'venture capital', 'private equity',
    'investment analyst', 'financial analyst', 'corporate finance'
  ],
  
  'Operations & Supply Chain': [
    'operations', 'supply chain', 'logistics', 'procurement', 'process',
    'operations analyst', 'supply chain analyst', 'logistics coordinator'
  ],
  
  'Product & Innovation': [
    'product', 'innovation', 'product management', 'innovation analyst',
    'product operations', 'product analyst'
  ],
  
  'Tech & Transformation': [
    'IT', 'digital transformation', 'business analyst', 'product owner',
    'digital', 'transformation', 'IT analyst'
  ],
  
  'Sustainability & ESG': [
    'sustainability', 'ESG', 'environmental', 'social', 'governance',
    'sustainability analyst', 'ESG consultant', 'impact investing'
  ]
};

export interface JobIngestionResult {
  shouldSave: boolean;
  eligibility: 'early-career' | 'uncertain' | 'senior';
  careerPath?: string;
  location: 'europe' | 'remote-europe' | 'unknown';
  confidence: number; // 0-1
  reasons: string[];
  metadata: {
    earlyCareerSignals: string[];
    seniorSignals: string[];
    locationSignals: string[];
    careerPathSignals: string[];
  };
}

/**
 * Main job ingestion function - implements the "save if early-career and in Europe" rule
 */
export function ingestJob(job: Job): JobIngestionResult {
  const result: JobIngestionResult = {
    shouldSave: false,
    eligibility: 'uncertain',
    location: 'unknown',
    confidence: 0,
    reasons: [],
    metadata: {
      earlyCareerSignals: [],
      seniorSignals: [],
      locationSignals: [],
      careerPathSignals: []
    }
  };

  const title = job.title?.toLowerCase() || '';
  const description = job.description?.toLowerCase() || '';
  const location = job.location?.toLowerCase() || '';
  const combinedText = `${title} ${description}`.toLowerCase();

  // 1. Check for early-career eligibility (MUST HAVE)
  const earlyCareerScore = checkEarlyCareerEligibility(combinedText, result.metadata);
  
  if (earlyCareerScore === 0) {
    result.eligibility = 'senior';
    result.reasons.push('No early-career signals found');
    result.confidence = 0.9;
    return result;
  }

  // 2. Check for senior signals (MUST NOT HAVE)
  const seniorScore = checkSeniorSignals(combinedText, result.metadata);
  
  if (seniorScore > 0.7) {
    result.eligibility = 'senior';
    result.reasons.push('Strong senior-level signals detected');
    result.confidence = 0.8;
    return result;
  }

  // 3. Determine eligibility level
  if (earlyCareerScore > 0.7) {
    result.eligibility = 'early-career';
  } else if (earlyCareerScore > 0.3) {
    result.eligibility = 'uncertain';
  }

  // 4. Check location (MUST BE IN EUROPE)
  const locationResult = checkEuropeanLocation(location, result.metadata);
  result.location = locationResult.type;
  
  if (locationResult.type === 'unknown') {
    result.reasons.push('Location not clearly in Europe');
    result.confidence = Math.min(result.confidence, 0.5);
  }

  // 5. Determine if job should be saved
  // Rule: Save if early-career and in Europe (even if location is uncertain)
  if (result.eligibility === 'early-career' && locationResult.type !== 'unknown') {
    result.shouldSave = true;
    result.confidence = Math.max(result.confidence, 0.8);
    result.reasons.push('Clear early-career role in European location');
  } else if (result.eligibility === 'early-career' && locationResult.type === 'unknown') {
    result.shouldSave = true;
    result.confidence = Math.max(result.confidence, 0.6);
    result.reasons.push('Early-career role with uncertain location - saving for investigation');
  } else if (result.eligibility === 'uncertain' && locationResult.type !== 'unknown') {
    result.shouldSave = true;
    result.confidence = Math.max(result.confidence, 0.5);
    result.reasons.push('Uncertain eligibility but clear European location - saving for review');
  } else {
    result.shouldSave = false;
    result.reasons.push('Does not meet minimum criteria for saving');
  }

  // 6. Identify career path (bonus - doesn't affect saving decision)
  const careerPath = identifyCareerPath(combinedText);
  if (careerPath) {
    result.careerPath = careerPath;
    result.reasons.push(`Career path identified: ${careerPath}`);
  }

  return result;
}

/**
 * Check if job has early-career signals
 */
function checkEarlyCareerEligibility(text: string, metadata: JobIngestionResult['metadata']): number {
  let score = 0;
  let totalSignals = 0;

  // Check title signals (highest weight)
  for (const signal of EARLY_CAREER_SIGNALS.title) {
    if (text.includes(signal)) {
      score += 2; // Title signals get double weight
      totalSignals++;
      metadata.earlyCareerSignals.push(signal);
    }
  }

  // Check description signals
  for (const signal of EARLY_CAREER_SIGNALS.description) {
    if (text.includes(signal)) {
      score += 1;
      totalSignals++;
      metadata.earlyCareerSignals.push(signal);
    }
  }

  // Check experience signals
  for (const signal of EARLY_CAREER_SIGNALS.experience) {
    if (text.includes(signal)) {
      score += 1.5;
      totalSignals++;
      metadata.earlyCareerSignals.push(signal);
    }
  }

  // Normalize score to 0-1 range
  return totalSignals > 0 ? Math.min(score / (totalSignals * 2), 1) : 0;
}

/**
 * Check for senior-level signals
 */
function checkSeniorSignals(text: string, metadata: JobIngestionResult['metadata']): number {
  let score = 0;
  let totalSignals = 0;

  for (const signal of SENIOR_SIGNALS) {
    if (text.includes(signal.toLowerCase())) {
      score += 1;
      totalSignals++;
      metadata.seniorSignals.push(signal);
    }
  }

  return totalSignals > 0 ? Math.min(score / totalSignals, 1) : 0;
}

/**
 * Check if location is in Europe
 */
function checkEuropeanLocation(location: string, metadata: JobIngestionResult['metadata']): {
  type: 'europe' | 'remote-europe' | 'unknown';
  confidence: number;
} {
  const locationLower = location.toLowerCase();
  
  // Check for remote indicators first
  if (locationLower.includes('remote') || locationLower.includes('eu') || 
      locationLower.includes('europe') || locationLower.includes('emea')) {
    metadata.locationSignals.push('Remote/European region');
    return { type: 'remote-europe', confidence: 0.8 };
  }

  // Check for specific European countries/cities
  for (const region of EUROPEAN_REGIONS) {
    if (locationLower.includes(region.toLowerCase())) {
      metadata.locationSignals.push(region);
      return { type: 'europe', confidence: 0.9 };
    }
  }

  // Check for common European city patterns
  const europeanCityPatterns = [
    'london', 'paris', 'berlin', 'madrid', 'barcelona', 'amsterdam', 'rome',
    'milan', 'zurich', 'dublin', 'copenhagen', 'stockholm', 'oslo', 'helsinki'
  ];

  for (const city of europeanCityPatterns) {
    if (locationLower.includes(city)) {
      metadata.locationSignals.push(city);
      return { type: 'europe', confidence: 0.8 };
    }
  }

  return { type: 'unknown', confidence: 0.3 };
}

/**
 * Identify career path based on job content
 */
function identifyCareerPath(text: string): string | undefined {
  let bestMatch = '';
  let bestScore = 0;

  for (const [careerPath, keywords] of Object.entries(CAREER_PATHS)) {
    let score = 0;
    
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = careerPath;
    }
  }

  // Only return if we have a reasonable match
  return bestScore >= 2 ? bestMatch : undefined;
}

/**
 * Batch process multiple jobs for ingestion
 */
export function batchIngestJobs(jobs: Job[]): {
  saved: Job[];
  discarded: Job[];
  results: Map<string, JobIngestionResult>;
} {
  const saved: Job[] = [];
  const discarded: Job[] = [];
  const results = new Map<string, JobIngestionResult>();

  for (const job of jobs) {
    const result = ingestJob(job);
    results.set(job.job_hash || String(job.id) || `job_${Date.now()}_${Math.random()}`, result);

    if (result.shouldSave) {
      saved.push(job);
    } else {
      discarded.push(job);
    }
  }

  return { saved, discarded, results };
}

/**
 * Generate ingestion report
 */
export function generateIngestionReport(results: Map<string, JobIngestionResult>): {
  totalJobs: number;
  savedJobs: number;
  discardedJobs: number;
  eligibilityBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
  careerPathBreakdown: Record<string, number>;
  averageConfidence: number;
} {
  const totalJobs = results.size;
  let savedJobs = 0;
  let discardedJobs = 0;
  const eligibilityCounts: Record<string, number> = {};
  const locationCounts: Record<string, number> = {};
  const careerPathCounts: Record<string, number> = {};
  let totalConfidence = 0;

  for (const result of results.values()) {
    if (result.shouldSave) {
      savedJobs++;
    } else {
      discardedJobs++;
    }

    // Count eligibility levels
    eligibilityCounts[result.eligibility] = (eligibilityCounts[result.eligibility] || 0) + 1;
    
    // Count locations
    locationCounts[result.location] = (locationCounts[result.location] || 0) + 1;
    
    // Count career paths
    if (result.careerPath) {
      careerPathCounts[result.careerPath] = (careerPathCounts[result.careerPath] || 0) + 1;
    }

    totalConfidence += result.confidence;
  }

  return {
    totalJobs,
    savedJobs,
    discardedJobs,
    eligibilityBreakdown: eligibilityCounts,
    locationBreakdown: locationCounts,
    careerPathBreakdown: careerPathCounts,
    averageConfidence: totalJobs > 0 ? totalConfidence / totalJobs : 0
  };
}
