// 🔧 SCRAPER ORCHESTRATION SYSTEM
// MASTER SCRAPING CONTROLLER

const RemoteOKScraper = require('./RemoteOKScraper');

class JobScrapingOrchestrator {
  constructor() {
    this.scrapers = [
      new RemoteOKScraper()
      // More scrapers will be added here
    ];
    
    this.results = {
      successful: [],
      failed: [],
      totalJobs: 0
    };
  }

  async runAllScrapers() {
    console.log('🚀 Starting job scraping orchestration...');
    
    const promises = this.scrapers.map(async (scraper) => {
      try {
        console.log(`⚡ Starting ${scraper.name} scraper...`);
        const startTime = Date.now();
        
        const jobs = await scraper.scrapeWithRetry();
        
        const duration = Date.now() - startTime;
        console.log(`✅ ${scraper.name} completed in ${duration}ms`);
        
        this.results.successful.push({
          scraper: scraper.name,
          jobCount: jobs.length,
          jobs: jobs,
          duration: duration
        });
        
        this.results.totalJobs += jobs.length;
        
        return {
          scraper: scraper.name,
          status: 'success',
          jobs: jobs.length,
          duration: duration
        };
        
      } catch (error) {
        console.error(`❌ ${scraper.name} failed:`, error.message);
        
        this.results.failed.push({
          scraper: scraper.name,
          error: error.message
        });
        
        return {
          scraper: scraper.name,
          status: 'failed',
          error: error.message
        };
      }
    });

    const results = await Promise.allSettled(promises);
    
    this.printSummary();
    
    return this.results;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SCRAPING SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Total jobs found: ${this.results.totalJobs}`);
    console.log(`✅ Successful scrapers: ${this.results.successful.length}`);
    console.log(`❌ Failed scrapers: ${this.results.failed.length}`);
    
    if (this.results.successful.length > 0) {
      console.log('\n🎯 SUCCESSFUL SCRAPERS:');
      this.results.successful.forEach(result => {
        console.log(`   ${result.scraper}: ${result.jobCount} jobs (${result.duration}ms)`);
      });
    }
    
    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED SCRAPERS:');
      this.results.failed.forEach(result => {
        console.log(`   ${result.scraper}: ${result.error}`);
      });
    }
    
    console.log('='.repeat(60));
  }

  getAllJobs() {
    const allJobs = [];
    
    this.results.successful.forEach(result => {
      allJobs.push(...result.jobs);
    });
    
    // Remove duplicates based on title + company
    const uniqueJobs = this.removeDuplicates(allJobs);
    
    console.log(`🔄 Deduplicated: ${allJobs.length} → ${uniqueJobs.length} jobs`);
    
    return uniqueJobs;
  }

  removeDuplicates(jobs) {
    const seen = new Set();
    
    return jobs.filter(job => {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
      
      if (seen.has(key)) {
        return false;
      }
      
      seen.add(key);
      return true;
    });
  }

  // Get summary for API response
  getSummary() {
    return {
      total_jobs: this.results.totalJobs,
      successful_scrapers: this.results.successful.length,
      failed_scrapers: this.results.failed.length,
      scrapers: [
        ...this.results.successful.map(s => ({
          name: s.scraper,
          status: 'success',
          jobs: s.jobCount,
          duration: s.duration
        })),
        ...this.results.failed.map(f => ({
          name: f.scraper,
          status: 'failed',
          error: f.error
        }))
      ]
    };
  }
}

module.exports = JobScrapingOrchestrator;
