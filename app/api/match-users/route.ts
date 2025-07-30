import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import type { Job } from '../../../scrapers/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL! as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY! as string
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced types for intern/early-career focused matching
interface EnhancedMatchScore {
  overall_score: number;
  learning_score: number;
  experience_score: number;
  reputation_score: number;
  environment_score: number;
  location_score: number;
  values_score: number;
  stability_score: number;
  confidence: 'high' | 'medium' | 'low';
}

interface EnhancedMatchResult {
  job_id: string;
  match_score: number;
  match_reason: string;
  confidence: 'high' | 'medium' | 'low';
  match_quality: 'excellent' | 'good' | 'fair' | 'low';
  match_tags: string[];
  score_breakdown: EnhancedMatchScore;
  reasoning: {
    learning_potential: string;
    experience_fit: string;
    company_reputation: string;
    work_environment: string;
    location_consideration: string;
    mission_alignment: string;
    compensation: string;
  };
}

// Match log structure for GPT tracing
interface MatchLog {
  user_email: string;
  raw_prompt: string;
  raw_gpt_response: string;
  job_batch_ids: string[];
  timestamp: string;
  success: boolean;
  fallback_used: boolean;
}

// Enhanced user preference structure for interns
interface EnhancedUserPreferences {
  email: string;
  target_locations: {
    cities: string[];
    countries: string[];
    regions: string[];
    remote_preference: boolean;
  };
  experience_profile: {
    level: 'internship' | 'entry' | 'junior' | 'mid' | 'senior';
    years_experience: number;
    career_stage: 'student' | 'recent_graduate' | 'early_career' | 'career_changer';
  };
  work_preferences: {
    environment: 'remote' | 'hybrid' | 'on-site' | 'flexible';
    company_size: 'startup' | 'scaleup' | 'enterprise' | 'any';
    industry_focus: string[];
  };
  visa_requirements: {
    status: string;
    restrictions: string[];
    sponsorship_needed: boolean;
  };
  skills_profile: {
    technical_skills: string[];
    soft_skills: string[];
    languages: string[];
    certifications: string[];
  };
  career_goals: {
    path: string;
    target_roles: string[];
    growth_priorities: string[];
  };
}

// Enhanced job data structure
interface EnhancedJob extends Job {
  complexity_score: number;
  company_profile: {
    size: 'startup' | 'scaleup' | 'enterprise' | 'unknown';
    industry: string;
    growth_stage: 'early' | 'growth' | 'mature' | 'unknown';
    remote_friendly: boolean;
    reputation_tier: 'top_tier' | 'well_known' | 'established' | 'unknown' | 'poor';
    values_alignment: 'high' | 'medium' | 'low';
  };
  role_analysis: {
    level: 'internship' | 'entry' | 'junior' | 'mid' | 'senior';
    technical_focus: boolean;
    leadership_potential: boolean;
    learning_opportunities: string[];
    salary_signals: 'competitive' | 'market_rate' | 'benefits' | 'none' | 'low';
  };
}

// Original types (keeping for backward compatibility)
type MatchResult = {
  job_id: string;
  match_score: number;
  match_reason: string;
  match_quality?: 'excellent' | 'good' | 'fair' | 'low';
  match_tags?: string[];
};

type UserPreferences = {
  email: string;
  target_cities: string[];
  professional_experience: string;
  work_environment: string;
  visa_status: string;
  entry_level_preference: string;
  languages_spoken: string[];
  company_types: string[];
  career_path: string;
  roles_selected: string[];
};

export async function POST(req: NextRequest) {
  try {
    console.log("🎯 Starting Enhanced Intern-Focused AI job matching process...");
    
    const { userEmail, limit = 50 } = await req.json();
    
    if (!userEmail) {
      return NextResponse.json({ error: 'User email is required' }, { status: 400 });
    }

    // 1. Fetch user preferences
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (userError || !userData) {
      console.error('❌ User not found:', userEmail);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 2. Fetch recent jobs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .gte('scraped_at', sevenDaysAgo.toISOString())
      .order('scraped_at', { ascending: false })
      .limit(limit);

    if (jobsError) {
      console.error('❌ Failed to fetch jobs:', jobsError);
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      console.log('⚠️ No recent jobs found for matching');
      return NextResponse.json({ matches: [] });
    }

    console.log(`📊 Matching ${jobs.length} jobs for user: ${userEmail}`);

    // 3. Normalize and enrich user preferences for intern focus
    const enhancedUserPrefs = normalizeUserPreferences(userData);
    
    // 4. Enrich job data with intern-relevant metrics
    const enhancedJobs = enrichJobData(jobs);
    
    // 5. Run enhanced AI matching with fallback logic
    let matches: MatchResult[] = [];
    let fallbackUsed = false;
    
    try {
      matches = await performEnhancedAIMatching(enhancedJobs, enhancedUserPrefs);
    } catch (error) {
      console.error('❌ AI matching failed, using fallback:', error);
      matches = generateFallbackMatches(enhancedJobs, enhancedUserPrefs);
      fallbackUsed = true;
    }
    
    // 6. Store matches in database with enhanced data
    const matchEntries = matches.map(match => ({
      user_email: userEmail,
      job_hash: match.job_id,
      match_score: match.match_score,
      match_reason: match.match_reason,
      match_quality: getMatchQuality(match.match_score),
      match_tags: match.match_tags || [],
      matched_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from('matches')
      .upsert(matchEntries, { onConflict: 'user_email,job_hash' });

    if (insertError) {
      console.error('❌ Failed to store matches:', insertError);
    }

    // 7. Log match session for debugging and improvement
    await logMatchSession(userEmail, enhancedJobs, enhancedUserPrefs, fallbackUsed);

    console.log(`✅ Successfully matched ${matches.length} jobs for ${userEmail} (fallback: ${fallbackUsed})`);
    
    return NextResponse.json({ 
      matches,
      total_jobs_processed: jobs.length,
      user_email: userEmail,
      enhanced_matching: true,
      intern_focused: true,
      fallback_used: fallbackUsed,
      match_summary: {
        excellent_matches: matches.filter(m => getMatchQuality(m.match_score) === 'excellent').length,
        good_matches: matches.filter(m => getMatchQuality(m.match_score) === 'good').length,
        fair_matches: matches.filter(m => getMatchQuality(m.match_score) === 'fair').length,
        low_matches: matches.filter(m => getMatchQuality(m.match_score) === 'low').length,
      }
    });

  } catch (error: unknown) {
    console.error('🚨 Enhanced AI Matching Error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ error: 'Unknown server error' }, { status: 500 });
  }
}

// Enhanced user preference normalization for interns
function normalizeUserPreferences(userData: any): EnhancedUserPreferences {
  const targetCities = Array.isArray(userData.target_cities) 
    ? userData.target_cities 
    : [userData.target_cities].filter(Boolean);
  
  const languages = Array.isArray(userData.languages_spoken) 
    ? userData.languages_spoken 
    : [userData.languages_spoken].filter(Boolean);
  
  const companyTypes = Array.isArray(userData.company_types) 
    ? userData.company_types 
    : [userData.company_types].filter(Boolean);
  
  const roles = Array.isArray(userData.roles_selected) 
    ? userData.roles_selected 
    : [userData.roles_selected].filter(Boolean);

  return {
    email: userData.email,
    target_locations: {
      cities: targetCities,
      countries: extractCountries(targetCities),
      regions: extractRegions(targetCities),
      remote_preference: userData.work_environment?.toLowerCase().includes('remote') || false,
    },
    experience_profile: {
      level: inferExperienceLevel(userData.professional_experience),
      years_experience: extractYearsExperience(userData.professional_experience),
      career_stage: inferCareerStage(userData.professional_experience, userData.entry_level_preference),
    },
    work_preferences: {
      environment: normalizeWorkEnvironment(userData.work_environment),
      company_size: inferCompanySize(companyTypes),
      industry_focus: extractIndustries(userData.career_path, companyTypes),
    },
    visa_requirements: {
      status: userData.visa_status || 'Not specified',
      restrictions: extractVisaRestrictions(userData.visa_status),
      sponsorship_needed: userData.visa_status?.toLowerCase().includes('sponsor') || false,
    },
    skills_profile: {
      technical_skills: extractTechnicalSkills(userData.career_path, roles),
      soft_skills: extractSoftSkills(userData.career_path, roles),
      languages: languages,
      certifications: [],
    },
    career_goals: {
      path: userData.career_path || 'Not specified',
      target_roles: roles,
      growth_priorities: inferGrowthPriorities(userData.career_path, roles),
    },
  };
}

// Job data enrichment with intern-relevant metrics
function enrichJobData(jobs: Job[]): EnhancedJob[] {
  return jobs.map(job => ({
    ...job,
    complexity_score: calculateJobComplexity(job),
    company_profile: inferCompanyProfile(job),
    role_analysis: analyzeRole(job),
  }));
}

// Enhanced AI matching with intern-focused scoring
async function performEnhancedAIMatching(jobs: EnhancedJob[], userPrefs: EnhancedUserPreferences): Promise<MatchResult[]> {
  const matches: MatchResult[] = [];
  const batchSize = 8; // Smaller batches for more detailed analysis
  
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const batchMatches = await processEnhancedJobBatch(batch, userPrefs);
    matches.push(...batchMatches);
    
    if (i + batchSize < jobs.length) {
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  }
  
  return matches.sort((a, b) => b.match_score - a.match_score);
}

async function processEnhancedJobBatch(jobs: EnhancedJob[], userPrefs: EnhancedUserPreferences): Promise<MatchResult[]> {
  try {
    const prompt = buildEnhancedMatchingPrompt(jobs, userPrefs);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert job matching AI specializing in interns and early-career professionals. 
          
          Your task is to analyze job listings against detailed user preferences and provide comprehensive matching scores.
          
          CRITICAL REQUIREMENTS:
          1. Return ONLY valid JSON - no markdown, no explanations outside the JSON
          2. Be extremely strict with scoring - 0.9+ only for perfect matches
          3. Prioritize learning & growth over location for interns
          4. Consider company reputation and career development potential
          5. Use the exact JSON format specified`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.05, // Lower temperature for more consistent scoring
      max_tokens: 3000, // Increased for detailed analysis
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const parsedMatches = parseAndValidateEnhancedMatches(response, jobs);
    return parsedMatches;
    
  } catch (error) {
    console.error('❌ Enhanced AI Matching batch error:', error);
    return [];
  }
}

// Updated scoring framework for balanced intern/early-career satisfaction
function buildEnhancedMatchingPrompt(jobs: EnhancedJob[], userPrefs: EnhancedUserPreferences): string {
  const userContext = buildDetailedUserContext(userPrefs);
  const jobsContext = buildDetailedJobsContext(jobs);
  
  return `
======= USER PROFILE =======
${userContext}

======= JOBS TO MATCH ======
${jobsContext}

======= SCORING RULES ======

FEW-SHOT EXAMPLES FOR INTERNS/EARLY-CAREER:

Example 1 - Perfect Match (0.95):
User: CS Student, 0 years experience, wants learning opportunities, values sustainability
Job: Software Engineering Intern at Tesla, Austin, Hybrid, Competitive pay
Reasoning: Perfect experience level, excellent learning potential, strong company reputation, hybrid flexibility, sustainability mission alignment, good compensation

Example 2 - Good Match (0.80):
User: Business Graduate, 0-1 years, wants startup experience, location flexible
Job: Business Analyst at Stripe, Dublin, Hybrid, Market rate
Reasoning: Good experience level, strong learning potential, reputable fintech, hybrid work model, good location, competitive salary

Example 3 - Poor Match (0.35):
User: Marketing Student, 0 years, wants remote flexibility, values social impact
Job: Senior Marketing Director at Traditional Bank, New York, On-site, 5+ years
Reasoning: Wrong experience level, no remote option, too senior for intern, no mission alignment

BALANCED INTERN/EARLY-CAREER SCORING FRAMEWORK:

Learning & Growth Score (30% weight):
• Mentorship programs: 1.0
• Training/development opportunities: 0.9
• Fast-growing company: 0.8
• Established learning culture: 0.9
• No learning mentioned: 0.3

Experience Level Fit Score (20% weight):
• Perfect intern/entry level match: 1.0
• One level difference (intern vs graduate): 0.7
• Two levels difference: 0.4
• Major mismatch (intern vs senior): 0.1

Company Reputation Score (15% weight):
• Top-tier tech/finance/consulting: 1.0
• Well-known startup/scaleup: 0.8
• Established mid-size company: 0.7
• Unknown company: 0.5
• Poor reputation: 0.2

Work Environment Match Score (10% weight):
• Remote option available: 1.0
• Hybrid option available: 0.8
• On-site but flexible hours: 0.6
• Strict on-site requirement: 0.3

Location Match Score (10% weight):
• Exact city match: 1.0
• Same country: 0.8
• Same region: 0.6
• Different location but good opportunity: 0.7
• Wrong location: 0.4

Values & Mission Fit Score (10% weight):
• ESG/sustainability focus: 1.0
• Social impact/charity: 0.9
• Innovation/tech for good: 0.8
• Traditional corporate: 0.5
• No mission alignment: 0.3

Stability & Salary Signal Score (5% weight):
• Competitive pay mentioned: 1.0
• Market rate/competitive: 0.8
• Benefits mentioned: 0.7
• No compensation info: 0.5
• Low pay indicators: 0.3

======= OUTPUT FORMAT ======

Return ONLY valid JSON in this exact format:
[
  {
    "job_id": "job_hash_here",
    "match_score": 0.85,
    "match_reason": "Brief explanation focused on balanced factors",
    "confidence": "high",
    "match_tags": ["learning-focused", "reputable-company", "hybrid", "mission-aligned"],
    "score_breakdown": {
      "overall_score": 0.85,
      "learning_score": 0.9,
      "experience_score": 0.9,
      "reputation_score": 0.8,
      "environment_score": 0.8,
      "location_score": 0.7,
      "values_score": 0.9,
      "stability_score": 0.8,
      "confidence": "high"
    },
    "reasoning": {
      "learning_potential": "Strong mentorship and training programs",
      "experience_fit": "Perfect entry-level role for recent graduate",
      "company_reputation": "Well-known tech company with excellent brand",
      "work_environment": "Hybrid work model provides good balance",
      "location_consideration": "Good opportunity worth relocating for",
      "mission_alignment": "Company focuses on sustainability and innovation",
      "compensation": "Competitive pay and benefits package"
    }
  }
]`;
}

function buildDetailedUserContext(userPrefs: EnhancedUserPreferences): string {
  return `
DETAILED USER PROFILE (Intern/Early-Career Focus):
${userPrefs.email}

EXPERIENCE PROFILE:
- Career Stage: ${userPrefs.experience_profile.career_stage}
- Experience Level: ${userPrefs.experience_profile.level}
- Years Experience: ${userPrefs.experience_profile.years_experience}

WORK PREFERENCES:
- Environment: ${userPrefs.work_preferences.environment}
- Company Size: ${userPrefs.work_preferences.company_size}
- Industry Focus: ${userPrefs.work_preferences.industry_focus.join(', ') || 'Any'}

LOCATION PREFERENCES:
- Target Cities: ${userPrefs.target_locations.cities.join(', ') || 'Any'}
- Countries: ${userPrefs.target_locations.countries.join(', ') || 'Any'}
- Remote Preference: ${userPrefs.target_locations.remote_preference ? 'Yes' : 'No'}

VISA REQUIREMENTS:
- Status: ${userPrefs.visa_requirements.status}
- Sponsorship Needed: ${userPrefs.visa_requirements.sponsorship_needed ? 'Yes' : 'No'}
- Restrictions: ${userPrefs.visa_requirements.restrictions.join(', ') || 'None'}

SKILLS PROFILE:
- Technical Skills: ${userPrefs.skills_profile.technical_skills.join(', ') || 'Not specified'}
- Languages: ${userPrefs.skills_profile.languages.join(', ') || 'Any'}
- Soft Skills: ${userPrefs.skills_profile.soft_skills.join(', ') || 'Not specified'}

CAREER GOALS:
- Path: ${userPrefs.career_goals.path}
- Target Roles: ${userPrefs.career_goals.target_roles.join(', ') || 'Any'}
- Growth Priorities: ${userPrefs.career_goals.growth_priorities.join(', ') || 'Not specified'}`;
}

function buildDetailedJobsContext(jobs: EnhancedJob[]): string {
  return `
JOBS TO ANALYZE (Intern/Early-Career Focus):
${jobs.map((job, index) => `
Job ${index + 1}:
- Title: ${job.title}
- Company: ${job.company}
- Location: ${job.location}
- Categories: ${job.categories.join(', ')}
- Experience Required: ${job.experience_required || 'Not specified'}
- Work Environment: ${job.work_environment || 'Not specified'}
- Languages: ${job.language_requirements?.join(', ') || 'Not specified'}
- Source: ${job.source}
- Job Hash: ${job.job_hash}
- Complexity Score: ${job.complexity_score}
- Company Profile: ${JSON.stringify(job.company_profile)}
- Role Analysis: ${JSON.stringify(job.role_analysis)}
`).join('\n')}`;
}

// Utility functions for normalization and enrichment
function extractCountries(cities: string[]): string[] {
  const countryMap: Record<string, string> = {
    'london': 'UK', 'manchester': 'UK', 'birmingham': 'UK',
    'berlin': 'Germany', 'munich': 'Germany', 'hamburg': 'Germany',
    'amsterdam': 'Netherlands', 'rotterdam': 'Netherlands',
    'paris': 'France', 'lyon': 'France', 'marseille': 'France',
    'madrid': 'Spain', 'barcelona': 'Spain', 'valencia': 'Spain',
    'rome': 'Italy', 'milan': 'Italy', 'naples': 'Italy',
    'dublin': 'Ireland', 'cork': 'Ireland', 'galway': 'Ireland',
  };
  
  return cities
    .map(city => countryMap[city.toLowerCase()])
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index);
}

function extractRegions(cities: string[]): string[] {
  const regionMap: Record<string, string> = {
    'london': 'Europe', 'berlin': 'Europe', 'amsterdam': 'Europe',
    'paris': 'Europe', 'madrid': 'Europe', 'rome': 'Europe',
    'dublin': 'Europe', 'munich': 'Europe', 'barcelona': 'Europe',
  };
  
  return cities
    .map(city => regionMap[city.toLowerCase()])
    .filter(Boolean)
    .filter((value, index, self) => self.indexOf(value) === index);
}

function inferExperienceLevel(experience: string): 'internship' | 'entry' | 'junior' | 'mid' | 'senior' {
  const lower = experience.toLowerCase();
  if (/intern|internship/.test(lower)) return 'internship';
  if (/graduate|entry|0|new grad/.test(lower)) return 'entry';
  if (/junior|1-2|2-3/.test(lower)) return 'junior';
  if (/mid|3-5|4-6/.test(lower)) return 'mid';
  if (/senior|lead|5\+|6\+/.test(lower)) return 'senior';
  return 'entry';
}

function extractYearsExperience(experience: string): number {
  const match = experience.match(/(\d+)/);
  return match ? parseInt(match[1]) : 0;
}

function inferCareerStage(experience: string, entryLevel: string): 'student' | 'recent_graduate' | 'early_career' | 'career_changer' {
  const lower = experience.toLowerCase();
  if (/student|intern/.test(lower)) return 'student';
  if (/graduate|new grad|0 years/.test(lower)) return 'recent_graduate';
  if (/1-3|2-4|early career/.test(lower)) return 'early_career';
  return 'career_changer';
}

function normalizeWorkEnvironment(environment: string): 'remote' | 'hybrid' | 'on-site' | 'flexible' {
  const lower = environment.toLowerCase();
  if (/remote/.test(lower)) return 'remote';
  if (/hybrid/.test(lower)) return 'hybrid';
  if (/on.?site|office/.test(lower)) return 'on-site';
  return 'flexible';
}

function inferCompanySize(companyTypes: string[]): 'startup' | 'scaleup' | 'enterprise' | 'any' {
  const types = companyTypes.join(' ').toLowerCase();
  if (/startup/.test(types)) return 'startup';
  if (/scaleup|growth/.test(types)) return 'scaleup';
  if (/enterprise|corporate|fortune/.test(types)) return 'enterprise';
  return 'any';
}

function extractIndustries(careerPath: string, companyTypes: string[]): string[] {
  const industries = [];
  const combined = (careerPath + ' ' + companyTypes.join(' ')).toLowerCase();
  
  if (/tech|software|ai|ml/.test(combined)) industries.push('Technology');
  if (/finance|banking|fintech/.test(combined)) industries.push('Finance');
  if (/health|medical|biotech/.test(combined)) industries.push('Healthcare');
  if (/marketing|advertising/.test(combined)) industries.push('Marketing');
  if (/consulting|strategy/.test(combined)) industries.push('Consulting');
  
  return industries;
}

function extractVisaRestrictions(visaStatus: string): string[] {
  const restrictions = [];
  const lower = visaStatus.toLowerCase();
  
  if (/eu|european/.test(lower)) restrictions.push('EU Citizen');
  if (/sponsor/.test(lower)) restrictions.push('Sponsorship Required');
  if (/work permit/.test(lower)) restrictions.push('Work Permit Required');
  
  return restrictions;
}

function extractTechnicalSkills(careerPath: string, roles: string[]): string[] {
  const skills = [];
  const combined = (careerPath + ' ' + roles.join(' ')).toLowerCase();
  
  if (/software|developer|engineer|programming/.test(combined)) {
    skills.push('Programming', 'Software Development', 'Problem Solving');
  }
  if (/data|analytics|sql|python/.test(combined)) {
    skills.push('Data Analysis', 'SQL', 'Python', 'Statistics');
  }
  if (/marketing|social|content/.test(combined)) {
    skills.push('Digital Marketing', 'Content Creation', 'Social Media');
  }
  if (/design|ui|ux|creative/.test(combined)) {
    skills.push('Design', 'UI/UX', 'Creativity');
  }
  
  return skills;
}

function extractSoftSkills(careerPath: string, roles: string[]): string[] {
  const skills = [];
  const combined = (careerPath + ' ' + roles.join(' ')).toLowerCase();
  
  if (/leadership|manage/.test(combined)) skills.push('Leadership');
  if (/communication|presentation/.test(combined)) skills.push('Communication');
  if (/team|collaboration/.test(combined)) skills.push('Teamwork');
  if (/problem|analytical/.test(combined)) skills.push('Problem Solving');
  
  return skills;
}

function inferGrowthPriorities(careerPath: string, roles: string[]): string[] {
  const priorities = [];
  const combined = (careerPath + ' ' + roles.join(' ')).toLowerCase();
  
  if (/tech|software/.test(combined)) priorities.push('Technical Skills', 'Industry Knowledge');
  if (/startup|entrepreneur/.test(combined)) priorities.push('Business Acumen', 'Fast Growth');
  if (/leadership|manage/.test(combined)) priorities.push('Leadership Skills', 'Management');
  
  return priorities;
}

function calculateJobComplexity(job: Job): number {
  let score = 5; // Base score
  
  const title = job.title.toLowerCase();
  const description = job.description?.toLowerCase() || '';
  const combined = title + ' ' + description;
  
  if (/senior|lead|principal|architect/.test(combined)) score += 3;
  if (/junior|entry|graduate|intern/.test(combined)) score -= 2;
  if (/manager|director|head/.test(combined)) score += 2;
  
  return Math.max(1, Math.min(10, score));
}

function inferCompanyProfile(job: Job): any {
  const company = job.company.toLowerCase();
  const title = job.title.toLowerCase();
  const description = job.description?.toLowerCase() || '';
  const combined = company + ' ' + title + ' ' + description;
  
  let size: 'startup' | 'scaleup' | 'enterprise' | 'unknown' = 'unknown';
  let industry = 'Technology';
  let growthStage: 'early' | 'growth' | 'mature' | 'unknown' = 'unknown';
  let remoteFriendly = job.work_environment === 'remote';
  let reputationTier: 'top_tier' | 'well_known' | 'established' | 'unknown' | 'poor' = 'unknown';
  let valuesAlignment: 'high' | 'medium' | 'low' = 'low';
  
  // Determine company size and reputation
  if (/google|microsoft|meta|amazon|apple|netflix/.test(company)) {
    size = 'enterprise';
    reputationTier = 'top_tier';
  } else if (/stripe|airbnb|uber|lyft|spotify/.test(company)) {
    size = 'scaleup';
    reputationTier = 'well_known';
  } else if (/startup|incubator|accelerator/.test(company)) {
    size = 'startup';
    growthStage = 'early';
    reputationTier = 'unknown';
  } else if (/corp|enterprise|fortune/.test(company)) {
    size = 'enterprise';
    growthStage = 'mature';
    reputationTier = 'established';
  }
  
  // Detect values/mission alignment (important for Gen Z)
  if (/sustainability|esg|green|climate|renewable|clean energy|carbon/.test(combined)) {
    valuesAlignment = 'high';
  } else if (/social impact|charity|non.?profit|b.?corp|benefit corp|mission/.test(combined)) {
    valuesAlignment = 'high';
  } else if (/innovation|tech for good|ai for good|responsible tech/.test(combined)) {
    valuesAlignment = 'medium';
  } else if (/traditional|banking|insurance|consulting/.test(combined)) {
    valuesAlignment = 'low';
  }
  
  return { size, industry, growthStage, remoteFriendly, reputationTier, valuesAlignment };
}

function analyzeRole(job: Job): any {
  const title = job.title.toLowerCase();
  const description = job.description?.toLowerCase() || '';
  const combined = title + ' ' + description;
  
  const level = inferExperienceLevel(title);
  const technicalFocus = /software|developer|engineer|programming|data|analytics/.test(combined);
  const leadershipPotential = /lead|manage|direct|coordinate/.test(combined);
  const learningOpportunities = [];
  const salarySignals = detectSalarySignals(combined);
  
  if (/mentor|learning|training/.test(combined)) learningOpportunities.push('Mentorship');
  if (/new tech|cutting edge|innovation/.test(combined)) learningOpportunities.push('New Technologies');
  if (/growth|scale|fast/.test(combined)) learningOpportunities.push('Company Growth');
  
  return { level, technicalFocus, leadershipPotential, learningOpportunities, salarySignals };
}

function detectSalarySignals(description: string): 'competitive' | 'market_rate' | 'benefits' | 'none' | 'low' {
  const lower = description.toLowerCase();
  
  if (/competitive pay|competitive salary|competitive compensation/.test(lower)) {
    return 'competitive';
  } else if (/market rate|market salary|competitive market/.test(lower)) {
    return 'market_rate';
  } else if (/benefits|health insurance|401k|pension|stock options|equity/.test(lower)) {
    return 'benefits';
  } else if (/unpaid|volunteer|stipend only|low pay/.test(lower)) {
    return 'low';
  }
  
  return 'none';
}

function parseAndValidateEnhancedMatches(response: string, jobs: EnhancedJob[]): MatchResult[] {
  try {
    const cleanResponse = response.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(cleanResponse);
    
    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }
    
    const validMatches: MatchResult[] = [];
    const jobHashes = new Set(jobs.map(job => job.job_hash));
    
    for (const match of parsed) {
      if (
        typeof match === 'object' &&
        match.job_id &&
        typeof match.match_score === 'number' &&
        match.match_score >= 0 &&
        match.match_score <= 1 &&
        typeof match.match_reason === 'string' &&
        jobHashes.has(match.job_id)
      ) {
        const matchResult: MatchResult = {
          job_id: match.job_id,
          match_score: Math.round(match.match_score * 100) / 100,
          match_reason: match.match_reason.substring(0, 200),
          match_quality: getMatchQuality(Math.round(match.match_score * 100) / 100),
          match_tags: match.match_tags || generateMatchTags(match, jobs.find(j => j.job_hash === match.job_id))
        };
        
        validMatches.push(matchResult);
      }
    }
    
    return validMatches;
    
  } catch (error) {
    console.error('❌ Failed to parse enhanced AI response:', error);
    console.error('Raw response:', response);
    return [];
  }
}

// Helper function to generate fallback matches when GPT fails
function generateFallbackMatches(jobs: EnhancedJob[], userPrefs: EnhancedUserPreferences): MatchResult[] {
  console.log('🔄 Generating fallback matches...');
  
  return jobs.slice(0, 10).map(job => {
    const tags = generateMatchTagsFromJob(job);
    const score = 0.6; // Base fallback score
    
    return {
      job_id: job.job_hash,
      match_score: score,
      match_reason: "Similar to your preferences — basic fallback match",
      match_quality: getMatchQuality(score),
      match_tags: [...tags, 'fallback-match']
    };
  });
}

// Helper function to determine match quality label
function getMatchQuality(score: number): 'excellent' | 'good' | 'fair' | 'low' {
  if (score >= 0.85) return 'excellent';
  if (score >= 0.75) return 'good';
  if (score >= 0.65) return 'fair';
  return 'low';
}

// Helper function to generate match tags from GPT response
function generateMatchTags(match: any, job?: EnhancedJob): string[] {
  const tags: string[] = [];
  
  if (match.score_breakdown) {
    if (match.score_breakdown.learning_score >= 0.8) tags.push('learning-focused');
    if (match.score_breakdown.reputation_score >= 0.8) tags.push('reputable-company');
    if (match.score_breakdown.experience_score >= 0.8) tags.push('perfect-fit');
    if (match.score_breakdown.environment_score >= 0.8) tags.push('flexible-work');
    if (match.score_breakdown.values_score >= 0.8) tags.push('mission-aligned');
    if (match.score_breakdown.stability_score >= 0.8) tags.push('competitive-pay');
  }
  
  if (job) {
    tags.push(...generateMatchTagsFromJob(job));
  }
  
  return tags;
}

// Helper function to generate match tags from job data
function generateMatchTagsFromJob(job: EnhancedJob): string[] {
  const tags: string[] = [];
  
  // Company size tags
  if (job.company_profile.size === 'startup') tags.push('startup');
  if (job.company_profile.size === 'enterprise') tags.push('enterprise');
  if (job.company_profile.reputation_tier === 'top_tier') tags.push('top-tier');
  
  // Work environment tags
  if (job.work_environment === 'remote') tags.push('remote');
  if (job.work_environment === 'hybrid') tags.push('hybrid');
  
  // Experience level tags
  if (job.role_analysis.level === 'internship') tags.push('internship');
  if (job.role_analysis.level === 'entry') tags.push('entry-level');
  
  // Values alignment tags
  if (job.company_profile.values_alignment === 'high') tags.push('esg-focused');
  if (job.company_profile.values_alignment === 'high') tags.push('mission-driven');
  
  // Learning opportunities
  if (job.role_analysis.learning_opportunities.length > 0) tags.push('growth-role');
  if (job.role_analysis.learning_opportunities.includes('Mentorship')) tags.push('mentorship');
  
  // Salary signals
  if (job.role_analysis.salary_signals === 'competitive') tags.push('competitive-pay');
  if (job.role_analysis.salary_signals === 'benefits') tags.push('good-benefits');
  
  return tags;
}

// Helper function to log match sessions for debugging and improvement
async function logMatchSession(
  userEmail: string, 
  jobs: EnhancedJob[], 
  userPrefs: EnhancedUserPreferences, 
  fallbackUsed: boolean
): Promise<void> {
  try {
    const jobBatchIds = jobs.map(job => job.job_hash);
    
    // Create a simplified log entry (full prompts would be too large for database)
    const logEntry = {
      user_email: userEmail,
      job_batch_ids: jobBatchIds,
      timestamp: new Date().toISOString(),
      success: !fallbackUsed,
      fallback_used: fallbackUsed,
      jobs_processed: jobs.length,
      user_career_stage: userPrefs.experience_profile.career_stage,
      user_experience_level: userPrefs.experience_profile.level,
      user_work_preference: userPrefs.work_preferences.environment,
    };
    
    // Store in match_logs table (you'll need to create this table in Supabase)
    const { error } = await supabase
      .from('match_logs')
      .insert(logEntry);
    
    if (error) {
      console.error('❌ Failed to log match session:', error);
    } else {
      console.log('📝 Match session logged successfully');
    }
    
  } catch (error) {
    console.error('❌ Error logging match session:', error);
  }
}

// Keep original functions for backward compatibility
async function performAIMatching(jobs: Job[], userPrefs: UserPreferences): Promise<MatchResult[]> {
  // This now calls the enhanced version
  const enhancedJobs = enrichJobData(jobs);
  const enhancedUserPrefs = normalizeUserPreferences({ 
    email: userPrefs.email,
    target_cities: userPrefs.target_cities,
    professional_experience: userPrefs.professional_experience,
    work_environment: userPrefs.work_environment,
    visa_status: userPrefs.visa_status,
    entry_level_preference: userPrefs.entry_level_preference,
    languages_spoken: userPrefs.languages_spoken,
    company_types: userPrefs.company_types,
    career_path: userPrefs.career_path,
    roles_selected: userPrefs.roles_selected,
  });
  
  return performEnhancedAIMatching(enhancedJobs, enhancedUserPrefs);
}

async function processJobBatch(jobs: Job[], userPrefs: UserPreferences): Promise<MatchResult[]> {
  // This now calls the enhanced version
  const enhancedJobs = enrichJobData(jobs);
  const enhancedUserPrefs = normalizeUserPreferences({ 
    email: userPrefs.email,
    target_cities: userPrefs.target_cities,
    professional_experience: userPrefs.professional_experience,
    work_environment: userPrefs.work_environment,
    visa_status: userPrefs.visa_status,
    entry_level_preference: userPrefs.entry_level_preference,
    languages_spoken: userPrefs.languages_spoken,
    company_types: userPrefs.company_types,
    career_path: userPrefs.career_path,
    roles_selected: userPrefs.roles_selected,
  });
  
  return processEnhancedJobBatch(enhancedJobs, enhancedUserPrefs);
}

function buildMatchingPrompt(jobs: Job[], userPrefs: UserPreferences): string {
  // This now calls the enhanced version
  const enhancedJobs = enrichJobData(jobs);
  const enhancedUserPrefs = normalizeUserPreferences({ 
    email: userPrefs.email,
    target_cities: userPrefs.target_cities,
    professional_experience: userPrefs.professional_experience,
    work_environment: userPrefs.work_environment,
    visa_status: userPrefs.visa_status,
    entry_level_preference: userPrefs.entry_level_preference,
    languages_spoken: userPrefs.languages_spoken,
    company_types: userPrefs.company_types,
    career_path: userPrefs.career_path,
    roles_selected: userPrefs.roles_selected,
  });
  
  return buildEnhancedMatchingPrompt(enhancedJobs, enhancedUserPrefs);
}

function parseAndValidateMatches(response: string, jobs: Job[]): MatchResult[] {
  // This now calls the enhanced version
  const enhancedJobs = enrichJobData(jobs);
  return parseAndValidateEnhancedMatches(response, enhancedJobs);
} 