// 1. REMOTEOK - API BASED (NO PUPPETEER)

const ReliableJobScraper = require('./ReliableJobScraper');
const axios = require('axios');

class RemoteOKScraper extends ReliableJobScraper {
  constructor() {
    super({
      name: 'RemoteOK',
      baseUrl: 'https://remoteok.io/api',
      timeout: 10000
    });
  }

  async scrapeJobs() {
    try {
      console.log(`[${this.name}] Fetching from API: ${this.baseUrl}`);
      
      const response = await axios.get(this.baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        },
        timeout: this.timeout
      });

      console.log(`[${this.name}] API response received, processing jobs...`);

      // RemoteOK returns array with first item being metadata
      const jobs = response.data.slice(1);

      const processedJobs = jobs.map(job => ({
        title: job.position,
        company: job.company,
        location: 'Remote',
        description: job.description || job.position || '',
        url: `https://remoteok.io/remote-jobs/${job.id}`,
        posted_date: new Date(job.date * 1000),
        employment_type: 'full-time',
        salary_range: job.salary_min && job.salary_max ? 
          `$${job.salary_min}k - $${job.salary_max}k` : null,
        tags: job.tags || []
      }));

      console.log(`[${this.name}] Processed ${processedJobs.length} raw jobs`);
      return processedJobs;

    } catch (error) {
      throw new Error(`RemoteOK API failed: ${error.message}`);
    }
  }
}

module.exports = RemoteOKScraper;
