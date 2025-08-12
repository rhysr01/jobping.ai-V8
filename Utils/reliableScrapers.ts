// Integration layer for reliable scrapers in TypeScript API
import { Job } from '../scrapers/types';

// Temporarily use a simple implementation until we can properly integrate the JS modules
// const JobScrapingOrchestrator = require('../scrapers/JobScrapingOrchestrator');

export async function runReliableScrapers(runId: string): Promise<Job[]> {
  console.log(`🚀 Starting reliable scraper system for run ${runId}`);
  
  try {
    // For now, use the proven RemoteOK API approach directly
    const axios = require('axios');
    const crypto = require('crypto');
    
    console.log('📡 Fetching from RemoteOK API...');
    const response = await axios.get('https://remoteok.io/api', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    // RemoteOK returns array with first item being metadata
    const rawJobs = response.data.slice(1);
    
    // Filter for graduate-appropriate jobs
    const graduateJobs = rawJobs.filter((job: any) => {
      const title = (job.position || '').toLowerCase();
      const description = (job.description || '').toLowerCase();
      const combined = `${title} ${description}`;

      // Exclude senior positions
      const excludeKeywords = ['senior', 'lead', 'principal', 'director', 'head of', 'manager', '5+ years', '7+ years'];
      if (excludeKeywords.some(keyword => combined.includes(keyword))) {
        return false;
      }

      // Include graduate-appropriate roles
      const includeKeywords = ['graduate', 'junior', 'entry', 'intern', 'trainee', 'associate', 'developer', 'engineer', 'analyst'];
      return includeKeywords.some(keyword => combined.includes(keyword));
    });
    
    console.log(`🎯 Found ${graduateJobs.length} graduate-appropriate jobs from ${rawJobs.length} total`);
    
    // Convert to our Job interface format
    const formattedJobs: Job[] = graduateJobs.map((job: any) => ({
      job_hash: crypto.createHash('md5').update(`${job.position}-${job.company}-remote-${runId}`).digest('hex'),
      title: job.position,
      company: job.company,
      location: 'Remote',
      job_url: `https://remoteok.io/remote-jobs/${job.id}`,
      description: job.description || job.position || '',
      experience_required: determineExperienceLevel(job),
      work_environment: 'remote',
      source: 'reliable-remoteok',
      categories: determineCategories(job),
      company_profile_url: `https://${job.company.toLowerCase().replace(/\s+/g, '')}.com`,
      language_requirements: 'English',
      scrape_timestamp: new Date().toISOString(),
      original_posted_date: new Date(job.date * 1000).toISOString(),
      posted_at: new Date(job.date * 1000).toISOString(),
      last_seen_at: new Date().toISOString(),
      is_active: true,
      freshness_tier: 'fresh',
      scraper_run_id: runId,
      created_at: new Date().toISOString()
    }));

    console.log(`✅ Reliable scrapers completed: ${formattedJobs.length} jobs formatted`);
    return formattedJobs;
    
  } catch (error) {
    console.error('❌ Reliable scrapers failed:', error);
    return [];
  }
}

function determineExperienceLevel(job: any): string {
  const text = `${job.position || ''} ${job.description || ''}`.toLowerCase();
  
  if (text.includes('intern') || text.includes('internship')) {
    return 'Internship';
  }
  
  if (text.includes('graduate') || text.includes('grad ') || text.includes('new grad')) {
    return 'Graduate';
  }
  
  if (text.includes('junior') || text.includes('entry') || text.includes('associate')) {
    return 'Entry Level';
  }
  
  return 'Entry Level'; // Default for graduate-filtered jobs
}

function determineCategories(job: any): string {
  const text = `${job.position || ''} ${job.description || ''}`.toLowerCase();
  const categories = [];
  
  // Technology
  if (text.includes('developer') || text.includes('engineer') || text.includes('software') || 
      text.includes('programmer') || text.includes('tech') || text.includes('mobile') ||
      text.includes('backend') || text.includes('frontend') || text.includes('full stack')) {
    categories.push('technology');
  }
  
  // Data & Analytics
  if (text.includes('data') || text.includes('analyst') || text.includes('analytics') || 
      text.includes('scientist') || text.includes('ml') || text.includes('ai')) {
    categories.push('data');
  }
  
  // Product & Design
  if (text.includes('product') || text.includes('design') || text.includes('ux') || 
      text.includes('ui') || text.includes('user experience')) {
    categories.push('product');
  }
  
  // Marketing & Sales
  if (text.includes('marketing') || text.includes('sales') || text.includes('customer') || 
      text.includes('support') || text.includes('experience')) {
    categories.push('marketing');
  }
  
  // Business & Consulting
  if (text.includes('business') || text.includes('consultant') || text.includes('analyst') || 
      text.includes('coordinator') || text.includes('manager')) {
    categories.push('business');
  }
  
  // Always add graduate tag
  categories.push('graduate');
  
  return categories.length > 0 ? categories.join(',') : 'graduate,general';
}
