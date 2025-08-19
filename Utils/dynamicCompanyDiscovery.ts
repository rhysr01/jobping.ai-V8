/**
 * Dynamic Company Discovery System
 * Automatically finds companies with active EARLY-CAREER job openings
 * Focused on entry-level, graduate, and internship positions
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

interface Company {
  name: string;
  url: string;
  platform: 'greenhouse' | 'lever' | 'workday';
  jobCount?: number;
  lastChecked?: string;
}

interface PlatformConfig {
  baseUrl: string;
  jobSelectors: string[];
  searchPatterns?: string[];
  commonCompanies: string[];
}

const PLATFORM_CONFIGS: Record<string, PlatformConfig> = {
  greenhouse: {
    baseUrl: 'https://boards.greenhouse.io',
    jobSelectors: ['.style_result__abf_o', 'li[data-object-id]', '.styles_card__59ahF', 'a[aria-label]'],
    searchPatterns: ['data-object-id=', 'style_result__'],
    commonCompanies: [
      // Companies that actually use Greenhouse for job hosting
      'gitlab', 'figma', 'discord', 'airtable', 'elastic', 'twilio',
      'mongodb', 'datadog', 'lever', 'greenhouse', 'intercom',
      'notion', 'vercel', 'supabase', 'linear', 'framer',
      // Legacy - some may redirect
      'google', 'microsoft', 'meta', 'amazon', 'apple', 'netflix',
      'salesforce', 'oracle', 'ibm', 'intel', 'nvidia', 'adobe',
      'stripe', 'shopify', 'square', 'snowflake', 'databricks', 'hashicorp',
      // Fintech (heavy grad hiring)
      'plaid', 'robinhood', 'coinbase', 'affirm', 'chime', 'klarna',
      // Consulting/Enterprise (large grad programs)
      'accenture', 'deloitte', 'pwc', 'ey', 'kpmg', 'mckinsey',
      // Scale-ups with rotation programs
      'canva', 'figma', 'notion', 'airtable', 'asana', 'slack',
      // Companies with known intern-to-hire pipelines
      'uber', 'lyft', 'airbnb', 'pinterest', 'twitter', 'discord'
    ]
  },
  lever: {
    baseUrl: 'https://jobs.lever.co',
    jobSelectors: ['.posting', '.posting-btn', '.postings-group .posting'],
    commonCompanies: [
      // Known graduate-friendly Lever companies
      'spotify', 'discord', 'reddit', 'canva', 'linear', 'notion', 'figma',
      // Startups with intern programs
      'segment', 'mixpanel', 'amplitude', 'heap', 'superhuman', 'postman', 'retool',
      // Growing tech companies
      'cloudflare', 'vercel', 'planetscale', 'railway', 'supabase', 'hashicorp',
      'clerk', 'resend', 'cal', 'prisma', 'turborepo', 'temporal', 'checkr',
      // AI/ML companies (hot market for grads)
      'anthropic', 'openai', 'huggingface', 'replicate', 'modal', 'scale',
      // Fintech & Crypto
      'ripple', 'consensys', 'chainalysis', 'messari', 'anchorage', 'alchemy',
      // Major tech companies that use Lever
      'dropbox', 'grammarly', 'instacart', 'oscar', 'lime', 'github',
      // Healthcare tech
      'flatiron', 'tempus', 'moderna', 'guardant', 'veracyte',
      // Media & Content
      'buzzfeed', 'vimeo', 'coursera', 'udemy', 'duolingo', 'masterclass',
      // E-commerce & Marketplaces
      'etsy', 'poshmark', 'mercari', 'reverb', 'stockx', 'faire',
      // DevTools & Infrastructure
      'docker', 'elastic', 'mongodb', 'databricks', 'snowflake', 'datadog',
      // Social & Communication
      'whatsapp', 'telegram', 'signal', 'zoom', 'miro', 'loom',
      // Transportation & Logistics
      'waymo', 'cruise', 'bird', 'getaround', 'flexport', 'convoy',
      // Real Estate & PropTech
      'compass', 'opendoor', 'zillow', 'redfin', 'apartmentlist',
      // Food & Delivery
      'doordash', 'gopuff', 'getir', 'gorillas', 'flink'
    ]
  }
};

class DynamicCompanyDiscovery {
  private cache: Map<string, Company[]> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get active companies for a platform with caching
   */
  async getActiveCompanies(platform: 'greenhouse' | 'lever', limit: number = 15): Promise<Company[]> {
    const cacheKey = `${platform}-${limit}`;
    const now = Date.now();
    
    // Check cache
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey)! > now) {
      console.log(`📋 Using cached companies for ${platform}`);
      return this.cache.get(cacheKey)!;
    }

    console.log(`🔍 Discovering active ${platform} companies...`);
    const activeCompanies = await this.discoverActiveCompanies(platform, limit);
    
    // Update cache
    this.cache.set(cacheKey, activeCompanies);
    this.cacheExpiry.set(cacheKey, now + this.CACHE_DURATION);
    
    return activeCompanies;
  }

  /**
   * Discover companies with active job openings
   */
  private async discoverActiveCompanies(platform: 'greenhouse' | 'lever', limit: number): Promise<Company[]> {
    const config = PLATFORM_CONFIGS[platform];
    const activeCompanies: Company[] = [];
    const companiesChecked = new Set<string>();

    // Test companies in batches to avoid rate limiting
    const batchSize = 3;
    const companies = [...config.commonCompanies];
    
    for (let i = 0; i < companies.length && activeCompanies.length < limit; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (companyName) => {
        if (companiesChecked.has(companyName)) return null;
        companiesChecked.add(companyName);
        
        try {
          const url = `${config.baseUrl}/${companyName}`;
          const jobCount = await this.checkCompanyJobCount(url, config.jobSelectors);
          
          if (jobCount > 0) {
            console.log(`✅ ${companyName}: ${jobCount} jobs`);
            return {
              name: companyName,
              url,
              platform,
              jobCount,
              lastChecked: new Date().toISOString()
            };
          } else {
            console.log(`⚪ ${companyName}: 0 jobs`);
            return null;
          }
        } catch (error) {
          console.log(`❌ ${companyName}: ${error instanceof Error ? error.message : 'Error'}`);
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      const validCompanies = batchResults.filter(company => company !== null) as Company[];
      activeCompanies.push(...validCompanies);

      // Small delay between batches
      if (i + batchSize < companies.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`🎯 Found ${activeCompanies.length} active ${platform} companies`);
    return activeCompanies.slice(0, limit);
  }

  /**
   * Check how many EARLY-CAREER jobs a company has
   */
  private async checkCompanyJobCount(url: string, selectors: string[]): Promise<number> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        timeout: 8000,
        maxRedirects: 5
      });
      
      // Check if redirected away from Greenhouse completely
      const finalUrl = response.request.res.responseUrl || url;
      if (!finalUrl.includes('greenhouse.io')) {
        console.log(`⚠️ ${url} redirects away from Greenhouse to ${finalUrl}`);
        return 0;
      }
      
      // If redirected to job-boards.greenhouse.io, update the URL for parsing
      const html = response.data;

      const $ = cheerio.load(html);
      
      // First try JSON-based job data (modern Greenhouse)
      let jobCount = 0;
      
      // Look for Next.js data script tag
      const scriptTags = $('script[id="__NEXT_DATA__"]');
      if (scriptTags.length > 0) {
        try {
          const jsonData = JSON.parse(scriptTags.first().html() || '{}');
          const jobs = jsonData?.props?.pageProps?.serverState?.initialResults?.['www:prod:careers']?.results?.[0]?.hits;
          if (Array.isArray(jobs)) {
            jobCount = jobs.length;
            console.log(`📊 Found ${jobCount} jobs via JSON parsing for ${url}`);
            return jobCount;
          }
        } catch (error) {
          console.log(`⚠️ JSON parsing failed for ${url}, falling back to HTML selectors`);
        }
      }
      
      // Fallback to HTML selectors for legacy Greenhouse sites
      let allJobElements = $();
      for (const selector of selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          allJobElements = elements;
          break;
        }
      }
      
      if (allJobElements.length === 0) {
        return 0;
      }
      
      jobCount = allJobElements.length;

      // Filter for early-career jobs
      const earlyCareerKeywords = [
        'intern', 'internship', 'graduate', 'grad', 'entry', 'junior', 'new grad',
        'recent graduate', 'associate', 'trainee', 'apprentice', 'student',
        'early career', 'rotation', 'development program', 'leadership program',
        '0-1 year', '0-2 year', 'no experience', 'campus', 'university'
      ];

      let earlyCareerCount = 0;
      allJobElements.each((_, element) => {
        const $el = $(element);
        const jobText = $el.text().toLowerCase();
        
        // Check if job matches early-career criteria
        const isEarlyCareer = earlyCareerKeywords.some(keyword => 
          jobText.includes(keyword)
        );
        
        // Also exclude clearly senior positions
        const isSenior = /\b(senior|sr\.|lead|principal|staff|director|manager|mgr|head.of|chief|vp|vice.president|architect|expert|specialist.*(5|6|7|8|9|10)\+?.years)\b/.test(jobText);
        
        if (isEarlyCareer && !isSenior) {
          earlyCareerCount++;
        }
      });
      
      // If no early-career jobs found but company has jobs, still return 1 
      // (they might have unlabeled early-career roles)
      if (earlyCareerCount === 0 && allJobElements.length > 0) {
        // Check if company is known for graduate hiring
        const companyName = url.split('/').pop()?.toLowerCase() || '';
        const gradFriendlyCompanies = [
          'google', 'microsoft', 'meta', 'amazon', 'apple', 'netflix',
          'stripe', 'coinbase', 'spotify', 'discord', 'canva'
        ];
        
        if (gradFriendlyCompanies.includes(companyName)) {
          return Math.min(allJobElements.length, 5); // Cap at 5 for known grad-friendly companies
        }
      }
      
      return earlyCareerCount;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('404 Not Found');
      }
      throw new Error(error.message || 'Request failed');
    }
  }

  /**
   * Get fallback companies when discovery fails
   */
  getFallbackCompanies(platform: 'greenhouse' | 'lever'): Company[] {
    const config = PLATFORM_CONFIGS[platform];
    
    // Return first few companies as fallback
    return config.commonCompanies.slice(0, 3).map(name => ({
      name,
      url: `${config.baseUrl}/${name}`,
      platform,
      jobCount: 0, // Unknown
      lastChecked: new Date().toISOString()
    }));
  }

  /**
   * Clear cache for testing
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }
}

// Export singleton instance
export const companyDiscovery = new DynamicCompanyDiscovery();

// Utility function for easy integration
export async function getActiveCompaniesForPlatform(
  platform: 'greenhouse' | 'lever', 
  limit: number = 15
): Promise<Company[]> {
  try {
    return await companyDiscovery.getActiveCompanies(platform, limit);
  } catch (error) {
    console.error(`❌ Company discovery failed for ${platform}:`, error);
    return companyDiscovery.getFallbackCompanies(platform);
  }
}
