// types.ts - Corrected to match your actual Supabase schema

// Freshness tiers for job prioritization
export enum FreshnessTier {
  ULTRA_FRESH = 'ultra_fresh',    // < 24 hours
  FRESH = 'fresh',                // 1-3 days
  RECENT = 'recent',              // 3-7 days
  STALE = 'stale',                // 7-30 days
  OLD = 'old'                     // > 30 days
}

// Job structure matching your Supabase schema exactly
export interface Job {
  id?: number;                          // int4 Identity column (auto-generated PK)
  job_hash: string;                     // text Non-nullable, UNIQUE (jobs_job_hash_unique)
  title: string;                        // text Non-nullable
  company: string;                      // text Non-nullable
  location: string;                     // text Non-nullable
  job_url: string;                      // text Non-nullable
  description: string;                  // text Non-nullable
  experience_required: string;          // text Non-nullable
  work_environment: string;             // text Non-nullable
  source: string;                       // text Non-nullable
  categories: string[];                 // text[] Non-nullable (added)
  company_profile_url: string;          // text Non-nullable (added)
  language_requirements: string[];      // text[] Non-nullable (added)
  scrape_timestamp: string;             // timestamptz Non-nullable (renamed from scraped_at)
  original_posted_date: string;         // timestamp Non-nullable
  posted_at: string;                    // timestamp Non-nullable
  last_seen_at: string;                 // timestamp Non-nullable (added for lifecycle tracking)
  is_active: boolean;                   // boolean Non-nullable, default true (added for lifecycle)
  freshness_tier?: string;              // varchar Nullable
  scraper_run_id?: string;              // uuid Nullable
  created_at: string;                   // timestamptz Non-nullable, default now()
}

// Utility interface for atomic upserts
export interface JobUpsertResult {
  success: boolean;
  inserted: number;
  updated: number;
  errors: string[];
  jobs: Job[];
}

// Date extraction result
export interface DateExtractionResult {
  success: boolean;
  date?: string;
  confidence: 'high' | 'medium' | 'low';
  source: string;
}

// User structure matching your Supabase schema exactly
export interface User {
  id?: string;                          // uuid Identity column (auto-generated PK)
  email: string;                        // text Non-nullable
  full_name: string;                    // text Non-nullable
  professional_expertise: string;       // text Non-nullable
  start_date: string;                   // date Non-nullable
  work_environment: string;             // text Non-nullable
  visa_status: string;                  // text Non-nullable
  entry_level_preference: string;       // text Non-nullable
  career_path: string;                  // text Non-nullable
  cv_url: string;                       // text Non-nullable
  linkedin_url: string;                 // text Non-nullable
  languages_spoken: string[];           // text[] Non-nullable - Array of languages
  company_types: string[];              // text[] Non-nullable - Array of company types
  roles_selected: string[];             // text[] Non-nullable - Array of selected roles
  target_cities: string[];              // text[] Non-nullable - Array of target cities
  created_at: string;                   // timestamptz Non-nullable, default now()
  updated_at: string;                   // timestamptz Non-nullable, default now()
}

// Match structure matching your Supabase schema exactly
export interface Match {
  id?: number;                          // int4 Identity column (PK)
  user_email: string;                   // text Non-nullable
  job_hash: string;                     // text Non-nullable
  match_score: number;                  // numeric Non-nullable
  match_reason: string;                 // text Non-nullable
  match_quality: string;                // text Non-nullable
  match_tags: string;                   // text Non-nullable
  matched_at: string;                   // timestamptz Non-nullable
  created_at: string;                   // timestamptz Non-nullable
}

// Match logs structure matching your Supabase schema exactly
export interface MatchLog {
  id?: number;                          // int4 Identity column (PK)
  job_batch_id: string;                 // text Non-nullable
  matches_generated: number;            // int4 Non-nullable
  error_message?: string;               // text Nullable
  match_type?: string;                  // text Nullable
  user_email: string;                   // text Non-nullable
  success: boolean;                     // boolean Non-nullable
  fallback_used: boolean;               // boolean Non-nullable
  jobs_processed: number;               // int4 Non-nullable
  user_career_stage: string;            // text Non-nullable
  user_experience_level: string;        // text Non-nullable
  user_work_preference: string;         // text Non-nullable
  timestamp: string;                    // timestamp Non-nullable
}

// Tally form field mapping (based on your form)
export interface TallyFormData {
  // Basic Info
  full_name: string;                    // "What's your full name?"
  email: string;                        // "What's your email address?"
  
  // Background
  professional_expertise: string;       // "What's your professional background/expertise?"
  
  // Preferences  
  roles_selected: string;              // Multi-select role checkboxes (comma-separated)
  work_environment: string;            // "What's your preferred work environment?"
  career_path: string;                 // "What's your preferred career path?"
  
  // Location & Timing
  start_date: string;                  // "How soon can you start?"
  
  // Skills & Requirements
  languages_spoken: string;            // "What languages do you speak?" (comma-separated)
  visa_status: string;                 // "What's your visa/work authorization status?"
  entry_level_preference: string;      // "What level of experience are you looking for?"
  company_types: string;               // "What types of companies interest you?" (comma-separated)
  target_cities?: string;              // "What cities are you targeting?" (comma-separated)
}

// Enhanced company structure for your 50-company list
export interface FocusedCompany {
  name: string;
  platform: 'greenhouse' | 'lever' | 'workday' | 'custom';
  url: string;
  backup_urls?: string[];
  tags: string[];
  city: string;
  country: string;
  visa_sponsorship: boolean;
  priority: 'high' | 'medium' | 'low';
  ie_alumni_count?: number;
  graduate_program_confirmed: boolean;
  typical_roles: string[];
  application_difficulty: 'easy' | 'medium' | 'competitive';
  early_career_focus: {
    graduate_program: boolean;
    internship_program: boolean;
    entry_level_roles: boolean;
    rotational_program: boolean;
  };
}

// Tally webhook payload structure
export interface TallyWebhookPayload {
  eventId: string;
  eventType: string;
  createdAt: string;
  data: {
    responseId: string;
    submissionId: string;
    respondentId: string;
    formId: string;
    formName: string;
    createdAt: string;
    fields: Array<{
      key: string;
      label: string;
      type: string;
      value: string | string[];
    }>;
  };
}

// Function to map Tally form data to User record
export function mapTallyDataToUser(tallyData: TallyFormData): User {
  return {
    email: tallyData.email,
    full_name: tallyData.full_name,
    professional_expertise: tallyData.professional_expertise,
    start_date: tallyData.start_date,
    work_environment: tallyData.work_environment,
    visa_status: tallyData.visa_status,
    entry_level_preference: tallyData.entry_level_preference,
    career_path: tallyData.career_path,
    cv_url: '', // Default empty - will be updated later
    linkedin_url: '', // Default empty - will be updated later
    languages_spoken: tallyData.languages_spoken.split(',').map(lang => lang.trim()),
    company_types: tallyData.company_types.split(',').map(type => type.trim()),
    roles_selected: tallyData.roles_selected.split(',').map(role => role.trim()),
    target_cities: tallyData.target_cities?.split(',').map(city => city.trim()) || [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Function to extract Tally form data from webhook payload
export function extractTallyFormData(payload: TallyWebhookPayload): TallyFormData {
  const userData: Partial<TallyFormData> = {};
  
  payload.data.fields.forEach(field => {
    const value = Array.isArray(field.value) ? field.value.join(', ') : field.value;
    
    // Map Tally field keys to our data structure
    switch (field.key.toLowerCase()) {
      case 'full_name':
      case 'name':
        userData.full_name = value;
        break;
      case 'email':
      case 'email_address':
        userData.email = value;
        break;
      case 'professional_expertise':
      case 'background':
      case 'expertise':
        userData.professional_expertise = value;
        break;
      case 'roles_selected':
      case 'target_roles':
      case 'preferred_roles':
        userData.roles_selected = value;
        break;
      case 'work_environment':
      case 'work_preference':
        userData.work_environment = value;
        break;
      case 'career_path':
        userData.career_path = value;
        break;
      case 'start_date':
      case 'availability':
        userData.start_date = value;
        break;
      case 'languages_spoken':
      case 'languages':
        userData.languages_spoken = value;
        break;
      case 'visa_status':
        userData.visa_status = value;
        break;
      case 'entry_level_preference':
      case 'experience_level':
        userData.entry_level_preference = value;
        break;
      case 'company_types':
      case 'company_preference':
        userData.company_types = value;
        break;
      case 'target_cities':
        userData.target_cities = value;
        break;
    }
  });

  return userData as TallyFormData;
}

// Type guards for validation
export function isValidJob(obj: any): obj is Job {
  return (
    typeof obj.title === 'string' &&
    typeof obj.company === 'string' &&
    typeof obj.location === 'string' &&
    typeof obj.job_url === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.job_hash === 'string' &&
    typeof obj.source === 'string'
  );
}

export function isValidUser(obj: any): obj is User {
  return (
    typeof obj.email === 'string' &&
    typeof obj.full_name === 'string' &&
    obj.email.includes('@')
  );
}

// Constants matching your Tally form options
export const WORK_ENVIRONMENTS = [
  'remote', 'hybrid', 'office', 'no-preference'
] as const;

export const VISA_STATUS_OPTIONS = [
  'eu-citizen', 'non-eu-visa-required', 'non-eu-no-visa'
] as const;

export const CAREER_PATHS = [
  'consulting', 'finance', 'tech', 'marketing', 'operations', 'entrepreneurship'
] as const;

export const TARGET_CITIES = [
  'Madrid', 'Dublin', 'London', 'Amsterdam', 'Berlin', 
  'Paris', 'Stockholm', 'Zurich'
] as const;

export type WorkEnvironment = typeof WORK_ENVIRONMENTS[number];
export type VisaStatus = typeof VISA_STATUS_OPTIONS[number];
export type CareerPath = typeof CAREER_PATHS[number];
export type TargetCity = typeof TARGET_CITIES[number];