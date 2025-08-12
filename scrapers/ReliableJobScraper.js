// 🎯 CORE SCRAPING LOGIC FRAMEWORK
// BULLETPROOF BASE SCRAPER CLASS

class ReliableJobScraper {
  constructor(config) {
    this.name = config.name;
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout || 15000;
    this.retries = config.retries || 3;
    this.delay = config.delay || 2000;
  }

  async scrapeWithRetry() {
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        console.log(`[${this.name}] Attempt ${attempt}/${this.retries}`);
        
        const jobs = await this.scrapeJobs();
        
        if (jobs && jobs.length > 0) {
          console.log(`[${this.name}] Success: ${jobs.length} jobs found`);
          return this.filterAndFormatJobs(jobs);
        }
        
        throw new Error('No jobs found');
        
      } catch (error) {
        console.error(`[${this.name}] Attempt ${attempt} failed:`, error.message);
        
        if (attempt === this.retries) {
          console.error(`[${this.name}] All attempts failed, returning empty array`);
          return [];
        }
        
        // Exponential backoff
        const backoffDelay = this.delay * Math.pow(2, attempt - 1);
        await this.sleep(backoffDelay);
      }
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  filterAndFormatJobs(jobs) {
    return jobs
      .filter(job => this.isGraduateAppropriate(job))
      .map(job => this.formatJob(job))
      .filter(job => job.title && job.company);
  }

  isGraduateAppropriate(job) {
    const title = (job.title || '').toLowerCase();
    const description = (job.description || '').toLowerCase();
    const combined = `${title} ${description}`;

    // Exclude senior positions
    const excludeKeywords = [
      'senior', 'lead', 'principal', 'director', 'head of', 'manager',
      '5+ years', '7+ years', 'experienced', 'expert'
    ];
    
    if (excludeKeywords.some(keyword => combined.includes(keyword))) {
      return false;
    }

    // Include graduate-appropriate roles
    const includeKeywords = [
      'graduate', 'junior', 'entry', 'intern', 'trainee', 'associate',
      '0-2 years', 'new grad', 'early career', 'recent graduate'
    ];

    const isExplicitlyGraduate = includeKeywords.some(keyword => combined.includes(keyword));
    
    // Common graduate role types
    const graduateRoles = [
      'developer', 'engineer', 'analyst', 'designer', 'consultant',
      'coordinator', 'specialist', 'assistant', 'associate'
    ];

    const isGraduateRole = graduateRoles.some(role => title.includes(role));

    return isExplicitlyGraduate || isGraduateRole;
  }

  formatJob(job) {
    return {
      title: this.cleanText(job.title),
      company: this.cleanText(job.company),
      location: this.cleanText(job.location),
      description: this.cleanText(job.description),
      url: job.url,
      posted_date: this.parseDate(job.posted_date),
      employment_type: job.employment_type || 'full-time',
      remote_work: this.determineRemoteWork(job),
      salary_range: job.salary_range || null,
      source: this.name.toLowerCase(),
      scraped_at: new Date().toISOString()
    };
  }

  cleanText(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ').substring(0, 500);
  }

  parseDate(dateStr) {
    if (!dateStr) return new Date();
    
    // Handle relative dates
    if (typeof dateStr === 'string') {
      const now = new Date();
      
      if (dateStr.includes('today')) return now;
      if (dateStr.includes('yesterday')) {
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }
      if (dateStr.includes('days ago')) {
        const days = parseInt(dateStr.match(/(\d+) days ago/)?.[1] || '1');
        return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      }
    }
    
    return new Date(dateStr);
  }

  determineRemoteWork(job) {
    const text = `${job.title} ${job.location} ${job.description}`.toLowerCase();
    
    if (text.includes('remote') || text.includes('work from home')) {
      return text.includes('hybrid') ? 'hybrid' : 'remote';
    }
    
    return 'on-site';
  }
}

module.exports = ReliableJobScraper;
