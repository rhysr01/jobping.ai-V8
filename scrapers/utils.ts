import crypto from 'crypto';

/**
 * Generates a unique hash to deduplicate job listings across scrapers.
 */
export function generateJobHash(title: string, company: string, jobUrl: string): string {
  return crypto
    .createHash('md5')
    .update(`${title}-${company}-${jobUrl}`)
    .digest('hex');
}

/**
 * Cleans whitespace and formatting from scraped HTML or text.
 */
export function cleanText(input: string): string {
  return input.replace(/<[^>]*>/g, '')     // remove HTML tags
              .replace(/&nbsp;/g, ' ')     // decode non-breaking spaces
              .replace(/\s+/g, ' ')        // compress whitespace
              .trim();
}

/**
 * Standardizes a job location to a readable, city-level format.
 */
export function normalizeLocation(location: string): string {
  return location
    .replace(/remote/gi, 'Remote')
    .replace(/united kingdom/gi, 'UK')
    .replace(/united states/gi, 'USA')
    .replace(/[^a-zA-Z0-9 ,]/g, '') // strip weird chars
    .trim();
}

/**
 * Attempts to detect early-career roles from text.
 */
export function isEarlyCareer(text: string): boolean {
  const lower = text.toLowerCase();
  return /intern|graduate|entry[- ]?level|junior|early[- ]?career|new grad/.test(lower);
}

/**
 * Infers job level based on title/description.
 */
export function inferSeniorityLevel(text: string): 'internship' | 'graduate' | 'entry' | 'junior' | 'other' {
  const lower = text.toLowerCase();
  if (/intern/.test(lower)) return 'internship';
  if (/graduate/.test(lower)) return 'graduate';
  if (/entry/.test(lower)) return 'entry';
  if (/junior/.test(lower)) return 'junior';
  return 'other';
}

/**
 * Infer work environment based on keywords.
 */
export function detectWorkEnvironment(text: string): 'remote' | 'hybrid' | 'on-site' | null {
  const lower = text.toLowerCase();
  if (/remote/.test(lower)) return 'remote';
  if (/hybrid/.test(lower)) return 'hybrid';
  if (/on[- ]?site|office/.test(lower)) return 'on-site';
  return null;
}

/**
 * Detect languages required (basic keyword matching).
 */
export function detectLanguageRequirements(text: string): string[] {
  const lower = text.toLowerCase();
  const knownLanguages = ['english', 'french', 'german', 'spanish', 'italian', 'portuguese', 'dutch'];

  return knownLanguages.filter(lang => lower.includes(lang));
}

/**
 * Logs scraper-level errors clearly with context.
 */
export function logJobError(company: string, err: unknown): void {
  console.error(`❌ [${company}] Scraper error:`, err instanceof Error ? err.message : err);
}

/**
 * Returns current UTC timestamp in ISO format.
 */
export function getTodayISO(): string {
  return new Date().toISOString();
}
