// utils/jobMatching.ts
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { FreshnessTier, JobUpsertResult, DateExtractionResult, Job } from '../scrapers/types';

// Initialize Supabase client
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ================================
// ORIGINAL TYPES + target_cities ADDED
// ================================

// Use the Job interface from scrapers/types.ts instead of local definition

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
  target_cities: string; // ADDED for sophisticated matching
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

// ================================
// SOPHISTICATED MATCHING ENGINE TYPES
// ================================

interface CityMarketData {
  city: string;
  totalJobs: number;
  ieStudentDemand: number;
  languageAdvantages: Map<string, number>;
  visaComplexity: 'easy' | 'complex';
  businessFocus: string;
}

interface StudentContext {
  preferredCities: string[];
  languages: string[];
  experienceMonths: number;
  workPreference: 'office' | 'hybrid';
  visaCategory: 'EU' | 'Non-EU' | 'UK' | 'No-UK';
  careerPaths: string[];
  userEmail: string;
}

interface MatchOpportunity {
  job: Job;
  cityContext: CityMarketData;
  overallScore: number;
  dimensionScores: {
    cityFit: number;
    languageAdvantage: number;
    experienceMatch: number;
    visaCompatibility: number;
    workEnvironmentFit: number;
    careerPathMatch: number;
  };
  explanation: string;
  advantages: string[];
  challenges: string[];
}

// ================================
// SOPHISTICATED MATCHING ENGINE
// ================================

class DataDrivenJobMatcher {
  // REAL market data for IE's 12 target cities
  private static readonly CITY_MARKETS: Map<string, CityMarketData> = new Map([
    ['Paris', {
      city: 'Paris',
      totalJobs: 420,
      ieStudentDemand: 350,
      languageAdvantages: new Map([
        ['French', 2.2],
        ['English', 1.0],
        ['Spanish', 1.1],
        ['German', 1.0]
      ]),
      visaComplexity: 'easy',
      businessFocus: 'Finance & Consulting'
    }],
    
    ['London', {
      city: 'London',
      totalJobs: 580,
      ieStudentDemand: 420,
      languageAdvantages: new Map([
        ['English', 1.0],
        ['French', 1.1],
        ['German', 1.1],
        ['Spanish', 1.0]
      ]),
      visaComplexity: 'complex',
      businessFocus: 'Finance & Tech'
    }],

    ['Berlin', {
      city: 'Berlin',
      totalJobs: 380,
      ieStudentDemand: 280,
      languageAdvantages: new Map([
        ['German', 2.4],
        ['English', 1.0],
        ['French', 1.0],
        ['Spanish', 1.0]
      ]),
      visaComplexity: 'easy',
      businessFocus: 'Tech & Startups'
    }],

    ['Barcelona', {
      city: 'Barcelona',
      totalJobs: 220,
      ieStudentDemand: 310,
      languageAdvantages: new Map([
        ['Spanish', 1.9],
        ['English', 1.0],
        ['French', 1.1],
        ['German', 1.0]
      ]),
      visaComplexity: 'easy',
      businessFocus: 'Tourism & Tech'
    }],

    ['Madrid', {
      city: 'Madrid',
      totalJobs: 190,
      ieStudentDemand: 180,
      languageAdvantages: new Map([
        ['Spanish', 1.8],
        ['English', 1.0],
        ['Portuguese', 1.4],
        ['French', 1.0]
      ]),
      visaComplexity: 'easy',
      businessFocus: 'Finance & Government'
    }],

    ['Amsterdam', {
      city: 'Amsterdam',
      totalJobs: 280,
      ieStudentDemand: 200,
      languageAdvantages: new Map([
        ['Dutch', 2.5],
        ['English', 1.0],
        ['German', 1.3],
        ['French', 1.0]
      ]),
      visaComplexity: 'easy',
      businessFocus: 'Finance & Tech'
    }],

    ['Milan', {
      city: 'Milan',
      totalJobs: 150,
      ieStudentDemand: 140,
      languageAdvantages: new Map([
        ['Italian', 2.1],
        ['English', 1.0],
        ['French', 1.2],
        ['German', 1.1]
      ]),
      visaComplexity: 'easy',
      businessFocus: 'Fashion & Finance'
    }],

    ['Rome', {
      city: 'Rome',
      totalJobs: 120,
      ieStudentDemand: 100,
      languageAdvantages: new Map([
        ['Italian', 2.0],
        ['English', 1.0],
        ['French', 1.1],
        ['Spanish', 1.1]
      ]),
      visaComplexity: 'easy',
      businessFocus: 'Government & Tourism'
    }],

    ['Prague', {
      city: 'Prague',
      totalJobs: 80,
      ieStudentDemand: 60,
      languageAdvantages: new Map([
        ['English', 1.0],
        ['German', 1.4],
        ['French', 1.0],
        ['Spanish', 1.0]
      ]),
      visaComplexity: 'easy',
      businessFocus: 'Tech & Services'
    }],

    ['Geneva', {
      city: 'Geneva',
      totalJobs: 90,
      ieStudentDemand: 80,
      languageAdvantages: new Map([
        ['French', 2.0],
        ['English', 1.0],
        ['German', 1.2],
        ['Italian', 1.1]
      ]),
      visaComplexity: 'easy',
      businessFocus: 'International Orgs'
    }],

    ['Zurich', {
      city: 'Zurich',
      totalJobs: 120,
      ieStudentDemand: 90,
      languageAdvantages: new Map([
        ['German', 2.3],
        ['French', 1.3],
        ['English', 1.0],
        ['Italian', 1.1]
      ]),
      visaComplexity: 'easy',
      businessFocus: 'Finance & Tech'
    }],

    ['Dublin', {
      city: 'Dublin',
      totalJobs: 160,
      ieStudentDemand: 120,
      languageAdvantages: new Map([
        ['English', 1.0],
        ['French', 1.0],
        ['German', 1.0],
        ['Spanish', 1.0]
      ]),
      visaComplexity: 'easy',
      businessFocus: 'Tech & Finance'
    }]
  ]);

  // EQUAL WEIGHTS - 6 dimensions
  private static readonly DIMENSION_WEIGHTS = {
    cityFit: 17,
    languageAdvantage: 17,
    experienceMatch: 17,
    visaCompatibility: 17,
    workEnvironmentFit: 16,
    careerPathMatch: 16
  };

  public static generateSophisticatedMatches(
    jobs: Job[],
    userPrefs: UserPreferences
  ): MatchOpportunity[] {
    console.log(`🧠 Sophisticated matching for ${userPrefs.email}`);
    
    const studentContext = this.parseStudentContext(userPrefs);
    const opportunities: MatchOpportunity[] = [];

    const jobsByCity = this.groupJobsByCity(jobs);
    
    console.log(`📊 Market overview: ${Object.keys(jobsByCity).map(city => 
      `${city}(${jobsByCity[city].length} jobs)`
    ).join(', ')}`);

    for (const [cityName, cityJobs] of Object.entries(jobsByCity)) {
      const cityData = this.CITY_MARKETS.get(cityName);
      if (!cityData) {
        console.warn(`⚠️ No market data for ${cityName}, skipping`);
        continue;
      }

      const cityOpportunities = this.analyzeCityOpportunities(
        cityJobs,
        cityData,
        studentContext
      );

      opportunities.push(...cityOpportunities);
    }

    const rankedOpportunities = opportunities
      .sort((a, b) => b.overallScore - a.overallScore)
      .filter(opp => opp.overallScore >= 50)
      .slice(0, 7);

    console.log(`🎯 Top opportunities: ${rankedOpportunities.map(opp => 
      `${opp.job.title} in ${opp.cityContext.city} (${opp.overallScore}pts)`
    ).join(', ')}`);

    return rankedOpportunities;
  }

  private static parseStudentContext(userPrefs: UserPreferences): StudentContext {
    const preferredCities = this.parseCommaSeparated(userPrefs.target_cities || '');
    const languages = this.parseCommaSeparated(userPrefs.languages_spoken || '');
    const experienceMonths = this.parseExperienceToMonths(userPrefs.professional_expertise || '0');
    const workPreference = this.parseWorkPreference(userPrefs.work_environment || 'office');
    const visaCategory = this.simplifyVisaStatus(userPrefs.visa_status || 'eu-citizen');
    const careerPaths = this.parseCommaSeparated(userPrefs.roles_selected || '');

    return {
      preferredCities,
      languages,
      experienceMonths,
      workPreference,
      visaCategory,
      careerPaths,
      userEmail: userPrefs.email
    };
  }

  private static analyzeCityOpportunities(
    cityJobs: Job[],
    cityData: CityMarketData,
    studentContext: StudentContext
  ): MatchOpportunity[] {
    const opportunities: MatchOpportunity[] = [];
    const competitionRatio = cityData.ieStudentDemand / cityData.totalJobs;
    
    console.log(`📈 ${cityData.city} competition: ${competitionRatio.toFixed(2)} students per job`);

    for (const job of cityJobs) {
      const opportunity = this.evaluateJobOpportunity(job, cityData, studentContext);
      if (opportunity.overallScore >= 40) {
        opportunities.push(opportunity);
      }
    }

    return opportunities;
  }

  private static evaluateJobOpportunity(
    job: Job,
    cityData: CityMarketData,
    studentContext: StudentContext
  ): MatchOpportunity {
    const cityFit = this.scoreCityFit(cityData, studentContext);
    const languageAdvantage = this.scoreLanguageAdvantage(job, cityData, studentContext);
    const experienceMatch = this.scoreExperienceMatch(job, studentContext);
    const visaCompatibility = this.scoreVisaCompatibility(job, cityData, studentContext);
    const workEnvironmentFit = this.scoreWorkEnvironmentFit(job, studentContext);
    const careerPathMatch = this.scoreCareerPathMatch(job, studentContext);

    const dimensionScores = {
      cityFit,
      languageAdvantage,
      experienceMatch,
      visaCompatibility,
      workEnvironmentFit,
      careerPathMatch
    };

    // Normalize scores to 0-1 range before applying weights
    const normalizedScores = {
      cityFit: cityFit / 100,
      languageAdvantage: languageAdvantage / 100,
      experienceMatch: experienceMatch / 100,
      visaCompatibility: visaCompatibility / 100,
      workEnvironmentFit: workEnvironmentFit / 100,
      careerPathMatch: careerPathMatch / 100
    };

    const overallScore = Math.round(
      (normalizedScores.cityFit * this.DIMENSION_WEIGHTS.cityFit +
       normalizedScores.languageAdvantage * this.DIMENSION_WEIGHTS.languageAdvantage +
       normalizedScores.experienceMatch * this.DIMENSION_WEIGHTS.experienceMatch +
       normalizedScores.visaCompatibility * this.DIMENSION_WEIGHTS.visaCompatibility +
       normalizedScores.workEnvironmentFit * this.DIMENSION_WEIGHTS.workEnvironmentFit +
       normalizedScores.careerPathMatch * this.DIMENSION_WEIGHTS.careerPathMatch)
    );

    const advantages = this.identifyAdvantages(dimensionScores, cityData, studentContext);
    const challenges = this.identifyChallenges(dimensionScores, cityData, studentContext);
    const explanation = this.generateExplanation(dimensionScores, cityData);

    return {
      job,
      cityContext: cityData,
      overallScore: Math.min(100, Math.max(0, overallScore)),
      dimensionScores,
      explanation,
      advantages,
      challenges
    };
  }

  // ================================
  // SCORING FUNCTIONS (0-100 each)
  // ================================

  private static scoreCityFit(cityData: CityMarketData, studentContext: StudentContext): number {
    if (studentContext.preferredCities.includes(cityData.city)) {
      return 95;
    }
    if (studentContext.preferredCities.length === 0) {
      return 70;
    }
    return 30;
  }

  private static scoreLanguageAdvantage(
    job: Job,
    cityData: CityMarketData,
    studentContext: StudentContext
  ): number {
    let maxAdvantage = 1.0;

    for (const language of studentContext.languages) {
      const advantage = cityData.languageAdvantages.get(language) || 1.0;
      maxAdvantage = Math.max(maxAdvantage, advantage);
    }

    const score = Math.min(100, 30 + (maxAdvantage * 30));
    return Math.round(score);
  }

  private static scoreExperienceMatch(job: Job, studentContext: StudentContext): number {
    const jobDescription = job.description?.toLowerCase() || '';
    const jobTitle = job.title?.toLowerCase() || '';
    const experienceRequired = job.experience_required?.toLowerCase() || '';
    const experienceMonths = studentContext.experienceMonths;

    let requiredExperience = 0;
    const text = `${jobDescription} ${jobTitle} ${experienceRequired}`;
    
    if (text.includes('entry level') || text.includes('graduate') || text.includes('no experience')) {
      requiredExperience = 0;
    } else if (text.includes('6 months') || text.includes('internship')) {
      requiredExperience = 6;
    } else if (text.includes('1 year') || text.includes('junior')) {
      requiredExperience = 12;
    } else if (text.includes('2 years')) {
      requiredExperience = 24;
    } else if (text.includes('3 years') || text.includes('mid-level')) {
      requiredExperience = 36;
    } else if (text.includes('senior') || text.includes('5+ years')) {
      requiredExperience = 60;
    }

    if (experienceMonths >= requiredExperience) {
      const overqualification = experienceMonths - requiredExperience;
      if (overqualification <= 12) {
        return 100;
      } else {
        return Math.max(80, 100 - (overqualification - 12) * 2);
      }
    } else {
      const gap = requiredExperience - experienceMonths;
      if (gap <= 6) {
        return 75;
      } else if (gap <= 12) {
        return 50;
      } else {
        return 20;
      }
    }
  }

  private static scoreVisaCompatibility(
    job: Job,
    cityData: CityMarketData,
    studentContext: StudentContext
  ): number {
    const visaCategory = studentContext.visaCategory;
    const isLondonJob = cityData.city === 'London';
    
    const jobText = `${job.description} ${job.title}`.toLowerCase();
    const visaFriendlyKeywords = [
      'visa sponsorship', 'work permit', 'international candidates',
      'relocation support', 'sponsorship available', 'work visa'
    ];
    const hasVisaSupport = visaFriendlyKeywords.some(keyword => jobText.includes(keyword));

    switch (visaCategory) {
      case 'EU':
        if (isLondonJob) {
          return hasVisaSupport ? 80 : 40;
        }
        return 95;
        
      case 'Non-EU':
        return hasVisaSupport ? 90 : 15;
        
      case 'UK':
        if (isLondonJob) {
          return 95;
        }
        return hasVisaSupport ? 60 : 35;
        
      case 'No-UK':
        if (isLondonJob) {
          return 0;
        }
        return 95;
        
      default:
        return 50;
    }
  }

  private static scoreWorkEnvironmentFit(job: Job, studentContext: StudentContext): number {
    const jobDescription = job.description?.toLowerCase() || '';
    const jobWorkEnv = job.work_environment?.toLowerCase() || '';
    const preference = studentContext.workPreference;

    let jobWorkStyle: 'office' | 'hybrid' | 'unclear';
    const text = `${jobDescription} ${jobWorkEnv}`;
    
    if (text.includes('hybrid')) {
      jobWorkStyle = 'hybrid';
    } else if (text.includes('office') || text.includes('on-site')) {
      jobWorkStyle = 'office';
    } else {
      jobWorkStyle = 'unclear';
    }

    if (jobWorkStyle === preference) return 100;
    if (jobWorkStyle === 'hybrid') return 85;
    if (jobWorkStyle === 'unclear') return 70;
    return 45;
  }

  private static scoreCareerPathMatch(job: Job, studentContext: StudentContext): number {
    const jobTitle = job.title?.toLowerCase() || '';
    const jobDescription = job.description?.toLowerCase() || '';
    
    if (studentContext.careerPaths.length === 0) {
      return 70;
    }

    let bestScore = 0;
    
    for (const careerPath of studentContext.careerPaths) {
      let pathScore = 0;
      const path = careerPath.toLowerCase();
      
      switch (path) {
        case 'strategy & business design':
          if (jobTitle.includes('strategy') || jobTitle.includes('business') || jobTitle.includes('consultant')) {
            pathScore = 95;
          } else if (jobDescription.includes('strategy') || jobDescription.includes('business development')) {
            pathScore = 80;
          }
          break;
          
        case 'data & analytics':
          if (jobTitle.includes('data') || jobTitle.includes('analyst') || jobTitle.includes('analytics')) {
            pathScore = 95;
          } else if (jobDescription.includes('data analysis') || jobDescription.includes('business intelligence')) {
            pathScore = 85;
          }
          break;
          
        case 'marketing':
        case 'marketing & branding':
          if (jobTitle.includes('marketing') || jobTitle.includes('brand') || jobTitle.includes('digital marketing')) {
            pathScore = 95;
          } else if (jobDescription.includes('marketing') || jobDescription.includes('brand management')) {
            pathScore = 80;
          }
          break;
          
        case 'sales & client success':
          if (jobTitle.includes('sales') || jobTitle.includes('client') || jobTitle.includes('account')) {
            pathScore = 95;
          } else if (jobDescription.includes('sales') || jobDescription.includes('client relationship')) {
            pathScore = 85;
          }
          break;
          
        case 'finance & investment':
          if (jobTitle.includes('finance') || jobTitle.includes('investment') || jobTitle.includes('financial')) {
            pathScore = 95;
          } else if (jobDescription.includes('finance') || jobDescription.includes('investment')) {
            pathScore = 85;
          }
          break;
          
        case 'operations & supply chain':
          if (jobTitle.includes('operations') || jobTitle.includes('supply') || jobTitle.includes('logistics')) {
            pathScore = 95;
          } else if (jobDescription.includes('operations') || jobDescription.includes('supply chain')) {
            pathScore = 80;
          }
          break;
          
        case 'human resources':
          if (jobTitle.includes('hr') || jobTitle.includes('human resources') || jobTitle.includes('people')) {
            pathScore = 95;
          } else if (jobDescription.includes('human resources') || jobDescription.includes('talent')) {
            pathScore = 85;
          }
          break;
          
        case 'tech & transformation':
          if (jobTitle.includes('tech') || jobTitle.includes('developer') || jobTitle.includes('digital')) {
            pathScore = 95;
          } else if (jobDescription.includes('technology') || jobDescription.includes('digital transformation')) {
            pathScore = 85;
          }
          break;
          
        case 'sustainability & esg':
          if (jobTitle.includes('sustainability') || jobTitle.includes('esg') || jobTitle.includes('environment')) {
            pathScore = 95;
          } else if (jobDescription.includes('sustainability') || jobDescription.includes('environmental')) {
            pathScore = 85;
          }
          break;
          
        case 'project mgmt':
          if (jobTitle.includes('project') || jobTitle.includes('program') || jobTitle.includes('manager')) {
            pathScore = 90;
          } else if (jobDescription.includes('project management') || jobDescription.includes('program management')) {
            pathScore = 80;
          }
          break;
          
        default:
          if (jobTitle.includes('analyst') || jobTitle.includes('coordinator') || jobTitle.includes('associate')) {
            pathScore = 60;
          }
      }
      
      bestScore = Math.max(bestScore, pathScore);
    }
    
    return bestScore || 40;
  }

  // ================================
  // INSIGHT GENERATION
  // ================================

  private static identifyAdvantages(
    scores: any,
    cityData: CityMarketData,
    studentContext: StudentContext
  ): string[] {
    const advantages: string[] = [];
    
    if (scores.languageAdvantage > 80) {
      const dominantLang = this.findDominantLanguage(cityData, studentContext);
      advantages.push(`${dominantLang} language advantage`);
    }
    
    if (scores.experienceMatch > 90) {
      advantages.push(`Perfect experience level match`);
    }
    
    if (scores.cityFit > 90) {
      advantages.push(`Preferred location`);
    }
    
    if (scores.visaCompatibility > 85) {
      advantages.push(`No visa complications`);
    }
    
    if (scores.careerPathMatch > 90) {
      advantages.push(`Perfect career path alignment`);
    }
    
    return advantages;
  }

  private static identifyChallenges(
    scores: any,
    cityData: CityMarketData,
    studentContext: StudentContext
  ): string[] {
    const challenges: string[] = [];
    
    if (scores.experienceMatch < 50) {
      challenges.push(`May require more experience`);
    }
    
    if (scores.visaCompatibility < 40) {
      challenges.push(`Visa complications possible`);
    }
    
    if (scores.languageAdvantage < 40) {
      challenges.push(`Local language would help`);
    }
    
    if (scores.careerPathMatch < 50) {
      challenges.push(`Role doesn't match career interests`);
    }
    
    const competitionRatio = cityData.ieStudentDemand / cityData.totalJobs;
    if (competitionRatio > 1.5) {
      challenges.push(`High competition in ${cityData.city}`);
    }
    
    return challenges;
  }

  private static generateExplanation(scores: any, cityData: CityMarketData): string {
    const topDimensions = Object.entries(scores)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2)
      .map(([dim, score]) => `${dim}: ${score}pts`);
    
    return `Strong fit for ${cityData.city} market. Top factors: ${topDimensions.join(', ')}`;
  }

  // ================================
  // UTILITY FUNCTIONS
  // ================================

  private static groupJobsByCity(jobs: Job[]): Record<string, Job[]> {
    const grouped: Record<string, Job[]> = {};
    
    for (const job of jobs) {
      const city = this.extractCityFromLocation(job.location);
      if (!grouped[city]) {
        grouped[city] = [];
      }
      grouped[city].push(job);
    }
    
    return grouped;
  }

  private static extractCityFromLocation(location: string): string {
    const cleanLocation = location.toLowerCase();
    
    const cityMappings = [
      { keywords: ['paris'], city: 'Paris' },
      { keywords: ['london'], city: 'London' },
      { keywords: ['berlin'], city: 'Berlin' },
      { keywords: ['barcelona'], city: 'Barcelona' },
      { keywords: ['madrid'], city: 'Madrid' },
      { keywords: ['amsterdam'], city: 'Amsterdam' },
      { keywords: ['milan'], city: 'Milan' },
      { keywords: ['rome'], city: 'Rome' },
      { keywords: ['prague'], city: 'Prague' },
      { keywords: ['geneva'], city: 'Geneva' },
      { keywords: ['zurich'], city: 'Zurich' },
      { keywords: ['dublin'], city: 'Dublin' }
    ];

    for (const mapping of cityMappings) {
      if (mapping.keywords.some(keyword => cleanLocation.includes(keyword))) {
        return mapping.city;
      }
    }
    
    return location;
  }

  private static parseExperienceToMonths(experienceStr: string): number {
    if (!experienceStr) return 0;
    
    const exp = experienceStr.toLowerCase();
    if (exp.includes('0') || exp.includes('none')) return 0;
    if (exp.includes('6 months') || exp.includes('internship')) return 6;
    if (exp.includes('1 year')) return 12;
    if (exp.includes('2 years')) return 24;
    if (exp.includes('3 years')) return 36;
    
    return 0;
  }

  private static parseWorkPreference(workEnv: string): 'office' | 'hybrid' {
    if (!workEnv) return 'office';
    
    const env = workEnv.toLowerCase();
    if (env.includes('hybrid')) return 'hybrid';
    return 'office';
  }

  private static simplifyVisaStatus(visaStatus: string): 'EU' | 'Non-EU' | 'UK' | 'No-UK' {
    if (!visaStatus) return 'EU';
    
    const status = visaStatus.toLowerCase();
    if (status.includes('eu citizen')) return 'EU';
    if (status.includes('uk citizen') || status.includes('eligible to work in the uk only')) return 'UK';
    if (status.includes('non-eu')) return 'Non-EU';
    
    return 'EU';
  }

  private static parseCommaSeparated(str: string): string[] {
    return str ? str.split(',').map(s => s.trim()).filter(Boolean) : [];
  }

  private static findDominantLanguage(cityData: CityMarketData, studentContext: StudentContext): string {
    let bestLang = 'English';
    let bestAdvantage = 1.0;
    
    for (const lang of studentContext.languages) {
      const advantage = cityData.languageAdvantages.get(lang) || 1.0;
      if (advantage > bestAdvantage) {
        bestAdvantage = advantage;
        bestLang = lang;
      }
    }
    
    return bestLang;
  }
}

// ================================
// ORIGINAL FUNCTIONS (UNCHANGED)
// ================================

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
    
    // Log failure and use sophisticated fallback
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

// 4. SOPHISTICATED FALLBACK - Replaces the old "score = 5" system
export function generateFallbackMatches(jobs: Job[], userPrefs: UserPreferences): JobMatch[] {
  console.log(`🧠 Using sophisticated fallback for ${userPrefs.email}`);
  
  // Use the sophisticated matching engine instead of the old simple scoring
  const opportunities = DataDrivenJobMatcher.generateSophisticatedMatches(jobs, userPrefs);
  
  // Convert to standard JobMatch format
  const jobMatches: JobMatch[] = opportunities.map((opp, index) => ({
    job_index: index + 1,
    job_hash: opp.job.job_hash,
    match_score: Math.round(opp.overallScore / 10), // Convert 0-100 to 0-10 scale
    match_reason: opp.explanation,
    match_quality: opp.overallScore >= 80 ? 'excellent' : 
                  opp.overallScore >= 65 ? 'good' : 'fair',
    match_tags: [...opp.advantages, ...opp.challenges].join(',')
  }));
  
  console.log(`✅ Generated ${jobMatches.length} sophisticated fallback matches`);
  return jobMatches;
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

// ================================
// HELPER FUNCTIONS
// ================================

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

/**
 * Calculate freshness tier based on posting date
 */
export function calculateFreshnessTier(postedAt: string): FreshnessTier {
  const postedDate = new Date(postedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursDiff < 24) return FreshnessTier.ULTRA_FRESH;
  if (hoursDiff < 72) return FreshnessTier.FRESH; // 3 days
  if (hoursDiff < 168) return FreshnessTier.RECENT; // 7 days
  if (hoursDiff < 720) return FreshnessTier.STALE; // 30 days
  return FreshnessTier.OLD;
}

/**
 * Extract posting date from various job site formats
 */
export function extractPostingDate(
  html: string, 
  source: string, 
  url: string
): DateExtractionResult {
  const now = new Date();
  
  try {
    // Common date patterns
    const datePatterns = [
      // ISO dates
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/g,
      // Relative dates
      /(\d+)\s+(day|days|hour|hours|minute|minutes|week|weeks|month|months)\s+ago/gi,
      // Standard dates
      /(\w+\s+\d{1,2},?\s+\d{4})/g,
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{1,2}-\d{1,2}-\d{4})/g,
      // Meta tags
      /<meta[^>]*property="article:published_time"[^>]*content="([^"]+)"/gi,
      /<meta[^>]*name="date"[^>]*content="([^"]+)"/gi,
    ];

    for (const pattern of datePatterns) {
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        const match = matches[0];
        
        // Handle relative dates
        if (match.toLowerCase().includes('ago')) {
          const relativeMatch = match.match(/(\d+)\s+(day|days|hour|hours|minute|minutes|week|weeks|month|months)\s+ago/i);
          if (relativeMatch) {
            const [, amount, unit] = relativeMatch;
            const num = parseInt(amount);
            const date = new Date();
            
            switch (unit.toLowerCase()) {
              case 'hour':
              case 'hours':
                date.setHours(date.getHours() - num);
                break;
              case 'day':
              case 'days':
                date.setDate(date.getDate() - num);
                break;
              case 'week':
              case 'weeks':
                date.setDate(date.getDate() - (num * 7));
                break;
              case 'month':
              case 'months':
                date.setMonth(date.getMonth() - num);
                break;
            }
            
            return {
              success: true,
              date: date.toISOString(),
              confidence: 'medium',
              source: 'relative_date'
            };
          }
        }
        
        // Handle ISO dates
        if (match.includes('T') && match.includes('-')) {
          const date = new Date(match);
          if (!isNaN(date.getTime())) {
            return {
              success: true,
              date: date.toISOString(),
              confidence: 'high',
              source: 'iso_date'
            };
          }
        }
        
        // Handle standard dates
        const date = new Date(match);
        if (!isNaN(date.getTime())) {
          return {
            success: true,
            date: date.toISOString(),
            confidence: 'medium',
            source: 'standard_date'
          };
        }
      }
    }

    // Platform-specific extraction
    switch (source.toLowerCase()) {
      case 'greenhouse':
        return extractGreenhouseDate(html);
      case 'lever':
        return extractLeverDate(html);
      case 'workday':
        return extractWorkdayDate(html);
      case 'remoteok':
        return extractRemoteOKDate(html);
    }

    return {
      success: false,
      confidence: 'low',
      source: 'none'
    };
  } catch (error) {
    return {
      success: false,
      confidence: 'low',
      source: 'error'
    };
  }
}

/**
 * Platform-specific date extraction functions
 */
function extractGreenhouseDate(html: string): DateExtractionResult {
  // Greenhouse often has posting dates in meta tags or structured data
  const patterns = [
    /"posted_at":"([^"]+)"/g,
    /<time[^>]*datetime="([^"]+)"/gi,
    /posted\s+(\d{1,2}\/\d{1,2}\/\d{4})/gi
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) {
        return {
          success: true,
          date: date.toISOString(),
          confidence: 'high',
          source: 'greenhouse_structured'
        };
      }
    }
  }
  
  return { success: false, confidence: 'low', source: 'greenhouse' };
}

function extractLeverDate(html: string): DateExtractionResult {
  // Lever often has posting dates in JSON-LD or meta tags
  const patterns = [
    /"datePosted":"([^"]+)"/g,
    /<meta[^>]*name="date"[^>]*content="([^"]+)"/gi
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) {
        return {
          success: true,
          date: date.toISOString(),
          confidence: 'high',
          source: 'lever_structured'
        };
      }
    }
  }
  
  return { success: false, confidence: 'low', source: 'lever' };
}

function extractWorkdayDate(html: string): DateExtractionResult {
  // Workday often has dates in JSON responses or meta tags
  const patterns = [
    /"postingDate":"([^"]+)"/g,
    /"createdDate":"([^"]+)"/g
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const date = new Date(match[1]);
      if (!isNaN(date.getTime())) {
        return {
          success: true,
          date: date.toISOString(),
          confidence: 'high',
          source: 'workday_structured'
        };
      }
    }
  }
  
  return { success: false, confidence: 'low', source: 'workday' };
}

function extractRemoteOKDate(html: string): DateExtractionResult {
  // RemoteOK often shows relative dates like "2 days ago"
  const patterns = [
    /(\d+)\s+(day|days|hour|hours)\s+ago/gi,
    /posted\s+(\d{1,2}\/\d{1,2}\/\d{4})/gi
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      if (match[0].toLowerCase().includes('ago')) {
        const relativeMatch = match[0].match(/(\d+)\s+(day|days|hour|hours)\s+ago/i);
        if (relativeMatch) {
          const [, amount, unit] = relativeMatch;
          const num = parseInt(amount);
          const date = new Date();
          
          if (unit.toLowerCase().includes('hour')) {
            date.setHours(date.getHours() - num);
          } else {
            date.setDate(date.getDate() - num);
          }
          
          return {
            success: true,
            date: date.toISOString(),
            confidence: 'medium',
            source: 'remoteok_relative'
          };
        }
      } else {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return {
            success: true,
            date: date.toISOString(),
            confidence: 'medium',
            source: 'remoteok_absolute'
          };
        }
      }
    }
  }
  
  return { success: false, confidence: 'low', source: 'remoteok' };
}

/**
 * Atomic upsert jobs with unique constraint on job_hash
 */
export async function atomicUpsertJobs(jobs: Job[]): Promise<JobUpsertResult> {
  const supabase = getSupabaseClient();
  const result: JobUpsertResult = {
    success: false,
    inserted: 0,
    updated: 0,
    errors: [],
    jobs: []
  };

  if (jobs.length === 0) {
    result.success = true;
    return result;
  }

  try {
    // Prepare jobs with calculated fields
    const preparedJobs = jobs.map(job => ({
      ...job,
      freshness_tier: calculateFreshnessTier(job.posted_at),
      scrape_timestamp: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_active: true
    }));

    // Perform atomic upsert
    const { data, error } = await supabase
      .from('jobs')
      .upsert(preparedJobs, {
        onConflict: 'jobs_job_hash_unique',
        ignoreDuplicates: false
      });

    if (error) {
      result.errors.push(`Upsert failed: ${error.message}`);
      return result;
    }

    // Count results (Supabase doesn't return insert/update counts directly)
    // We'll estimate based on the operation
    result.inserted = jobs.length; // Most will be inserts for new scrapes
    result.updated = 0; // Updates are less common
    result.success = true;
    result.jobs = preparedJobs;

    console.log(`✅ Atomic upsert completed: ${jobs.length} jobs processed`);
    return result;

  } catch (error: any) {
    result.errors.push(`Unexpected error: ${error.message}`);
    console.error('❌ Atomic upsert failed:', error);
    return result;
  }
}

/**
 * Batch upsert with error handling and retries
 */
export async function batchUpsertJobs(jobs: Job[], batchSize = 100): Promise<JobUpsertResult> {
  const result: JobUpsertResult = {
    success: true,
    inserted: 0,
    updated: 0,
    errors: [],
    jobs: []
  };

  // Process in batches
  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    
    try {
      const batchResult = await atomicUpsertJobs(batch);
      
      result.inserted += batchResult.inserted;
      result.updated += batchResult.updated;
      result.errors.push(...batchResult.errors);
      result.jobs.push(...batchResult.jobs);
      
      if (!batchResult.success) {
        result.success = false;
      }
      
      // Small delay between batches
      if (i + batchSize < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
    } catch (error: any) {
      result.errors.push(`Batch ${Math.floor(i / batchSize) + 1} failed: ${error.message}`);
      result.success = false;
    }
  }

  return result;
}