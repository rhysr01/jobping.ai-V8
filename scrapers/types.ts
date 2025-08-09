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
  id?: string;                          // uuid primary key (optional for inserts)
  categories: string;                   // text field
  title: string;                        // text field  
  company: string;                      // text field
  location: string;                     // text field
  job_url: string;                      // text field (unique)
  description: string;                  // text field
  experience_required: string;          // text field
  work_environment: string;             // text field
  source: string;                       // text field ('greenhouse', 'lever', etc.)
  job_hash: string;                     // text field (deduplication key)
  posted_at: string;                    // timestamp
  language_requirements: string;        // text field
  professional_expertise: string;       // text field
  start_date: string;                   // text field
  work_environment: string;             // text field
  visa_status: string;                  // text field
  entry_level_preference: string;       // text field
  career_path: string;                  // text field
  created_at: string;                   // timestamp
  scraper_run_id: string;               // text field
  company_profile_url: string;          // text field
  freshness_tier?: FreshnessTier;       // calculated field for prioritization
  extracted_posted_date?: string;       // real posting date if extracted
  scrape_timestamp?: string;            // when we scraped it
  last_seen_at?: string;                // when job was last seen (for lifecycle tracking)
  is_active?: boolean;                  // whether job is still active
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
  email: string;                        // text primary key
  full_name: string;                    // text field
  professional_expertise: string;       // text field
  start_date: string;                   // text field
  work_environment: string;             // text field
  visa_status: string;                  // text field
  entry_level_preference: string;       // text field
  career_path: string;                  // text field
  created_at: string;                   // timestamp
  updated_at: string;                   // timestamp
  target_date: string;                  // text field
  languages_spoken: string;             // text field
  company_types: string;                // text field
  roles_selected: string;               // text field
  active?: boolean;                     // For your app logic
}

// Match structure matching your Supabase schema
export interface Match {
  user_email: string;                   // text (FK to users)
  job_hash: string;                     // text (FK to jobs)
  match_score: number;                  // float (relevance AI)
  match_reason: string;                 // text (AI explanation)
  match_quality: string;                // text ('high', 'med', etc.)
  match_tags: string;                   // text field
  matched_at: string;                   // timestamp
  created_at: string;                   // timestamp
}

// Match logs structure matching your Supabase schema
export interface MatchLog {
  user_email: string;                   // text (FK to users)
  job_batch_id: string;                 // text field
  success: boolean;                     // bool field
  fallback_used: boolean;               // bool field
  jobs_processed: number;               // int field
  user_career_stage: string;            // text field
  user_experience_lvl: string;          // text field
  user_work_preference: string;         // text field
  timestamp: string;                    // timestamp field
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
  target_date: string;                 // "When are you looking to start?"
  start_date: string;                  // "How soon can you start?"
  
  // Skills & Requirements
  languages_spoken: string;            // "What languages do you speak?" (comma-separated)
  visa_status: string;                 // "What's your visa/work authorization status?"
  entry_level_preference: string;      // "What level of experience are you looking for?"
  company_types: string;               // "What types of companies interest you?" (comma-separated)
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
    target_date: tallyData.target_date,
    languages_spoken: tallyData.languages_spoken,
    company_types: tallyData.company_types,
    roles_selected: tallyData.roles_selected,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    active: true
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
      case 'target_date':
      case 'graduation_date':
        userData.target_date = value;
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