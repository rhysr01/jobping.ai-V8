// types.ts

// Core job structure
export type Job = {
  title: string;
  company: string;
  location: string;
  job_url: string;
  description?: string;
  categories: string[];         // e.g. ['Tech', 'Graduate Program', 'Remote']
  experience_required?: string | null; // Optional textual value like "0-1 years"
  language_requirements?: string[];    // e.g. ['English', 'Spanish']
  work_environment?: 'remote' | 'hybrid' | 'on-site' | null;
  source: 'remoteok' | 'greenhouse' | 'lever' | 'workday' | 'custom';
  job_hash: string;             // Unique hash for deduplication
  posted_at?: string;           // From site if available
  scraped_at: string;           // When we scraped this job
};

// Internal company structure
export type Company = {
  name: string;
  platform: 'greenhouse' | 'lever' | 'workday' | 'custom';
  url: string;
  tags: string[];               // e.g. ['Tech', 'Consulting', 'Graduate Program']
  locations?: string[];         // e.g. ['London', 'Dublin', 'Berlin']
};

// Cleaned job with matching fields inferred for AI scoring
export type ParsedJob = Job & {
  level: 'internship' | 'graduate' | 'entry' | 'other';
  matchesLocation?: boolean;
  matchesLanguage?: boolean;
};
