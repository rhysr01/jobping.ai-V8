// utils/jobMatching.ts
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// Types for type safety
export interface Job {
 id: string;
 title: string;
 company: string;
 location: string;
 job_url: string;
 description: string;
 categories: string;
 experience_required: string;
 work_environment: string;
 language_requirements: string;
 job_hash: string;
 created_at: string;
}

export interface UserPreferences {
 email: string;
 full_name: string;
 professional_expertise: string;
 visa_status: string;
 start_date: string;
 work_environment: string;
 target_date: string;
 languages_spoken: string;
 company_types: string;
 roles_selected: string;
 career_path: string;
 entry_level_preference: string;
}

export interface JobMatch {
 job_index: number;
 job_hash: string;
 match_score: number;
 match_reason: string;
 match_quality: string;
 match_tags: string;
}

export interface NormalizedUserProfile {
 name: string;
 visaStatus: 'eu-citizen' | 'non-eu-visa-required' | 'non-eu-no-visa';
 targetRoles: string[];
 workPreference: 'remote' | 'hybrid' | 'office' | 'no-preference';
 languages: string[];
 companyTypes: string[];
 availability: string;
 experienceLevel: string;
 careerFocus: string;
}

export interface EnrichedJob extends Job {
 visaFriendly: boolean;
 experienceLevel: 'entry' | 'junior' | 'mid' | 'senior';
 workEnvironment: 'remote' | 'hybrid' | 'office' | 'unclear';
 languageRequirements: string[];
 complexityScore: number;
}

// 1. Build AI Matching Prompt
export function buildMatchingPrompt(jobs: EnrichedJob[], userProfile: NormalizedUserProfile): string {
 const userContext = buildUserContext(userProfile);
 const jobsContext = buildJobsContext(jobs);
 
 return `You are an AI career advisor specializing in European graduate job matching for IE University students. Your goal is to identify the most relevant opportunities based on specific career preferences and visa constraints.

USER PROFILE:
${userContext}

AVAILABLE POSITIONS (${jobs.length} total):
${jobsContext}

MATCHING CRITERIA:
1. VISA REQUIREMENTS: Critical - match visa status to job requirements
2. ROLE ALIGNMENT: Match selected roles to job titles and responsibilities  
3. LOCATION FIT: Consider target countries and language requirements
4. EXPERIENCE LEVEL: Focus on entry-level and graduate-appropriate positions
5. WORK ENVIRONMENT: Match remote/hybrid/office preferences

TASK:
Analyze each position and select the TOP 5 matches. Be selective - only include genuinely relevant opportunities.

For each selected match, respond with this exact JSON structure:
{
 "job_index": [1-${jobs.length}],
 "match_score": [1-10 integer],
 "match_reason": "[Concise explanation focusing on why this role fits their specific situation]",
 "match_tags": ["key", "matching", "factors"]
}

SCORING GUIDELINES:
- 9-10: Perfect fit - meets all major criteria including visa/location needs
- 7-8: Strong match - aligns well with role preferences and constraints
- 5-6: Decent fit - some alignment but may have compromises
- 1-4: Poor fit - significant mismatches (don't include these)

IMPORTANT:
- Heavily prioritize visa compatibility for non-EU students
- Match specific roles selected by user
- Consider language barriers realistically
- Focus on entry-level positions suitable for recent graduates
- Respect work environment preferences

Return ONLY a valid JSON array of matches. No additional text.`;
}

// 2. Perform Enhanced AI Matching
export async function performEnhancedAIMatching(
 jobs: Job[],
 userPrefs: UserPreferences,
 openai: OpenAI
): Promise<JobMatch[]> {
 try {
   // Normalize and enrich data
   const normalizedProfile = normalizeUserPreferences(userPrefs);
   const enrichedJobs = jobs.map(enrichJobData);
   
   // Build prompt and call OpenAI
   const prompt = buildMatchingPrompt(enrichedJobs, normalizedProfile);
   
   const response = await openai.chat.completions.create({
     model: 'gpt-4',
     messages: [{ role: 'user', content: prompt }],
     temperature: 0.3,
     max_tokens: 2000,
   });
   
   const content = response.choices[0]?.message?.content;
   if (!content) {
     throw new Error('No content in OpenAI response');
   }
   
   // Parse and validate response
   const matches = parseAndValidateMatches(content, jobs);
   
   // Log successful matching
   await logMatchSession(userPrefs.email, 'ai_success', jobs.length, matches.length);
   
   return matches;
   
 } catch (error) {
   console.error('AI matching failed:', error);
   
       // Log failure and use fallback
    await logMatchSession(userPrefs.email, 'ai_failed', jobs.length, 0, error instanceof Error ? error.message : 'Unknown error');
   
   return generateFallbackMatches(jobs, userPrefs);
 }
}

// 3. Parse and Validate AI Response
export function parseAndValidateMatches(response: string, jobs: Job[]): JobMatch[] {
 try {
   // Clean up response
   const cleanResponse = response
     .replace(/```json\n?/g, '')
     .replace(/```\n?/g, '')
     .trim();
   
   const matches = JSON.parse(cleanResponse);
   
   if (!Array.isArray(matches)) {
     throw new Error('Response is not an array');
   }
   
   // Validate and transform each match
   const validMatches = matches
     .filter(validateSingleMatch)
     .filter(match => match.job_index >= 1 && match.job_index <= jobs.length)
     .map(match => transformToJobMatch(match, jobs))
     .slice(0, 5); // Ensure max 5 matches
   
   return validMatches;
   
 } catch (error) {
   console.error('Failed to parse AI response:', error);
   console.error('Raw response:', response);
   throw new Error(`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`);
 }
}

// 4. Generate Fallback Matches
export function generateFallbackMatches(jobs: Job[], userPrefs: UserPreferences): JobMatch[] {
 console.log(`Generating fallback matches for ${userPrefs.email}`);
 
 const normalizedProfile = normalizeUserPreferences(userPrefs);
 
 const scoredJobs = jobs.map((job, index) => {
   const enrichedJob = enrichJobData(job);
   const score = calculateFallbackScore(enrichedJob, normalizedProfile);
   
   return {
     job_index: index + 1,
     job_hash: job.job_hash,
     match_score: score,
     match_reason: generateFallbackReason(enrichedJob, normalizedProfile),
     match_quality: getMatchQuality(score),
     match_tags: generateFallbackTags(enrichedJob, normalizedProfile)
   };
 });
 
 return scoredJobs
   .filter(match => match.match_score >= 5)
   .sort((a, b) => b.match_score - a.match_score)
   .slice(0, 5);
}

// 5. Get Match Quality Label
export function getMatchQuality(score: number): string {
 if (score >= 9) return 'excellent';
 if (score >= 7) return 'good';
 if (score >= 5) return 'fair';
 return 'poor';
}

// 6. Log Match Session
export async function logMatchSession(
 userEmail: string,
 matchType: 'ai_success' | 'ai_failed' | 'fallback',
 jobsProcessed: number,
 matchesGenerated: number,
 errorMessage?: string
): Promise<void> {
 try {
   const supabase = createClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!
   );
   
   await supabase.from('match_logs').insert({
     user_email: userEmail,
     job_batch_id: `batch_${Date.now()}`,
     success: matchType === 'ai_success',
     fallback_used: matchType === 'fallback' || matchType === 'ai_failed',
     jobs_processed: jobsProcessed,
     matches_generated: matchesGenerated,
     error_message: errorMessage,
     match_type: matchType,
     timestamp: new Date().toISOString()
   });
   
   console.log(`Logged ${matchType} session for ${userEmail}`);
 } catch (error) {
   console.error('Failed to log match session:', error);
 }
}

// 7. Normalize User Preferences
export function normalizeUserPreferences(userPrefs: UserPreferences): NormalizedUserProfile {
 return {
   name: userPrefs.full_name || 'Student',
   visaStatus: normalizeVisaStatus(userPrefs.visa_status),
   targetRoles: parseCommaSeparated(userPrefs.roles_selected),
   workPreference: normalizeWorkEnvironment(userPrefs.work_environment),
   languages: parseCommaSeparated(userPrefs.languages_spoken),
   companyTypes: parseCommaSeparated(userPrefs.company_types),
   availability: userPrefs.start_date || 'flexible',
   experienceLevel: userPrefs.entry_level_preference || 'graduate',
   careerFocus: userPrefs.career_path || 'exploring'
 };
}

// 8. Enrich Job Data
export function enrichJobData(job: Job): EnrichedJob {
 const description = job.description?.toLowerCase() || '';
 const title = job.title?.toLowerCase() || '';
 
 return {
   ...job,
   visaFriendly: detectVisaFriendly(description, title),
   experienceLevel: determineExperienceLevel(description, title),
   workEnvironment: detectWorkEnvironment(description),
   languageRequirements: extractLanguageRequirements(job.language_requirements || ''),
   complexityScore: calculateComplexityScore(description, title)
 };
}

// Helper Functions
function buildUserContext(profile: NormalizedUserProfile): string {
 const visaStatusMap = {
   'eu-citizen': 'EU Citizen - No visa restrictions',
   'non-eu-visa-required': 'Non-EU - REQUIRES VISA SPONSORSHIP (CRITICAL)',
   'non-eu-no-visa': 'Non-EU with existing work authorization'
 };

 return `
Name: ${profile.name}
Visa Status: ${visaStatusMap[profile.visaStatus]}
Target Roles: ${profile.targetRoles.join(', ') || 'Open to opportunities'}
Work Preference: ${profile.workPreference}
Languages: ${profile.languages.join(', ') || 'Not specified'}
Company Types: ${profile.companyTypes.join(', ') || 'Any'}
Availability: ${profile.availability}
Experience Level: ${profile.experienceLevel}
Career Focus: ${profile.careerFocus}

CONSTRAINTS:
- ${profile.visaStatus === 'non-eu-visa-required' ? 
   'MUST HAVE VISA SPONSORSHIP - Non-negotiable requirement' : 
   'No visa restrictions'}
- Experience: Entry-level to junior positions only
- Work Setup: ${profile.workPreference}
`.trim();
}

function buildJobsContext(jobs: EnrichedJob[]): string {
 return jobs.map((job, idx) => `[${idx + 1}] ${job.title}
Company: ${job.company}
Location: ${job.location}
${job.visaFriendly ? '✓ VISA SPONSORSHIP AVAILABLE' : '✗ No visa sponsorship mentioned'}
${job.experienceLevel === 'entry' ? '✓ ENTRY LEVEL' : `⚠ ${job.experienceLevel.toUpperCase()} level`}
Work: ${job.workEnvironment}
Languages: ${job.languageRequirements.join(', ') || 'Not specified'}
Categories: ${job.categories}
Description: ${job.description.slice(0, 300)}${job.description.length > 300 ? '...' : ''}
---`).join('\n\n');
}

function validateSingleMatch(match: any): boolean {
 return (
   typeof match.job_index === 'number' &&
   typeof match.match_score === 'number' &&
   match.match_score >= 1 && match.match_score <= 10 &&
   typeof match.match_reason === 'string' &&
   match.match_reason.length > 0 &&
   Array.isArray(match.match_tags)
 );
}

function transformToJobMatch(match: any, jobs: Job[]): JobMatch {
 const job = jobs[match.job_index - 1];
 
 return {
   job_index: match.job_index,
   job_hash: job.job_hash,
   match_score: Math.min(10, Math.max(1, match.match_score)),
   match_reason: match.match_reason.slice(0, 500),
   match_quality: getMatchQuality(match.match_score),
   match_tags: match.match_tags.join(',')
 };
}

function calculateFallbackScore(job: EnrichedJob, profile: NormalizedUserProfile): number {
 let score = 5;
 
 // Critical visa check
 if (profile.visaStatus === 'non-eu-visa-required') {
   score += job.visaFriendly ? 4 : -3;
 }
 
 // Role matching
 if (profile.targetRoles.length > 0) {
   const roleMatch = profile.targetRoles.some(role => 
     job.title.toLowerCase().includes(role) || 
     job.description.toLowerCase().includes(role)
   );
   score += roleMatch ? 3 : 0;
 }
 
 // Experience level
 if (job.experienceLevel === 'entry') score += 2;
 if (job.experienceLevel === 'senior') score -= 2;
 
 // Work environment
 if (profile.workPreference !== 'no-preference' && 
     job.workEnvironment === profile.workPreference) {
   score += 2;
 }
 
 return Math.min(10, Math.max(1, score));
}

function generateFallbackReason(job: EnrichedJob, profile: NormalizedUserProfile): string {
 const reasons = [];
 
 if (job.visaFriendly && profile.visaStatus === 'non-eu-visa-required') {
   reasons.push('Offers visa sponsorship');
 }
 
 if (job.experienceLevel === 'entry') {
   reasons.push('Entry-level position suitable for graduates');
 }
 
 if (profile.targetRoles.some(role => 
     job.title.toLowerCase().includes(role.toLowerCase()))) {
   reasons.push('Matches your role interests');
 }
 
 return reasons.length > 0 ? reasons.join(', ') : 'Good fit based on your profile';
}

function generateFallbackTags(job: EnrichedJob, profile: NormalizedUserProfile): string {
 const tags = [];
 
 if (job.visaFriendly) tags.push('visa-friendly');
 if (job.experienceLevel === 'entry') tags.push('entry-level');
 if (job.workEnvironment === 'remote') tags.push('remote');
 if (job.workEnvironment === 'hybrid') tags.push('hybrid');
 
 return tags.join(',');
}

// Utility functions
function normalizeVisaStatus(status: string): 'eu-citizen' | 'non-eu-visa-required' | 'non-eu-no-visa' {
 if (!status) return 'eu-citizen';
 if (status.includes('non-eu-visa')) return 'non-eu-visa-required';
 if (status.includes('non-eu-no')) return 'non-eu-no-visa';
 return 'eu-citizen';
}

function normalizeWorkEnvironment(env: string): 'remote' | 'hybrid' | 'office' | 'no-preference' {
 if (!env) return 'no-preference';
 if (env.includes('remote')) return 'remote';
 if (env.includes('hybrid')) return 'hybrid';
 if (env.includes('office')) return 'office';
 return 'no-preference';
}

function parseCommaSeparated(str: string): string[] {
 return str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
}

function detectVisaFriendly(description: string, title: string): boolean {
 const indicators = [
   'visa sponsorship', 'work permit', 'international candidates',
   'relocation support', 'sponsorship available', 'work visa'
 ];
 
 return indicators.some(indicator => 
   description.includes(indicator) || title.includes(indicator)
 );
}

function determineExperienceLevel(description: string, title: string): 'entry' | 'junior' | 'mid' | 'senior' {
 const text = `${description} ${title}`;
 
 if (text.includes('senior') || text.includes('lead') || text.includes('principal')) return 'senior';
 if (text.includes('mid') || text.includes('3-5 years') || text.includes('intermediate')) return 'mid';
 if (text.includes('junior') || text.includes('1-2 years')) return 'junior';
 if (text.includes('graduate') || text.includes('entry') || text.includes('trainee')) return 'entry';
 
 return 'entry'; // Default for students
}

function detectWorkEnvironment(description: string): 'remote' | 'hybrid' | 'office' | 'unclear' {
 if (description.includes('remote') || description.includes('work from home')) return 'remote';
 if (description.includes('hybrid')) return 'hybrid';
 if (description.includes('office') || description.includes('on-site')) return 'office';
 return 'unclear';
}

function extractLanguageRequirements(langStr: string): string[] {
 if (!langStr) return [];
 
 const languages = langStr.toLowerCase().split(',').map(s => s.trim());
 const common = ['english', 'spanish', 'german', 'french', 'dutch', 'italian'];
 
 return languages.filter(lang => 
   common.some(commonLang => lang.includes(commonLang))
 );
}

function calculateComplexityScore(description: string, title: string): number {
 const complexityWords = [
   'senior', 'lead', 'architect', 'principal', 'expert', 
   'advanced', 'complex', 'strategic', 'leadership'
 ];
 
 const text = `${description} ${title}`.toLowerCase();
 const matches = complexityWords.filter(word => text.includes(word)).length;
 
 return Math.min(10, matches * 2);
}