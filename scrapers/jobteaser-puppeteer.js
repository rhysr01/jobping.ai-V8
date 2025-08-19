const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const crypto = require('crypto');

puppeteer.use(StealthPlugin());

class JobTeaserScraperEnhanced {
  constructor() {
    this.baseURL = 'https://www.jobteaser.com';
    this.alternativeURLs = [
      'https://www.jobteaser.com/en/job-offers',
      'https://www.jobteaser.com/fr/job-offers',
      'https://www.jobteaser.com/de/job-offers'
    ];
  }

  async scrapeWithPuppeteer(runId) {
    try {
      const browser = await puppeteer.launch({
        headless: true, // Set to false for debugging
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--window-size=1920,1080',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ],
        defaultViewport: null
      });

      const page = await browser.newPage();
      
      // Randomize viewport
      const viewports = [
        { width: 1920, height: 1080 },
        { width: 1366, height: 768 },
        { width: 1440, height: 900 }
      ];
      await page.setViewport(viewports[Math.floor(Math.random() * viewports.length)]);

      // Add human-like behavior
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        Object.defineProperty(navigator, 'platform', { get: () => 'MacIntel' });
      });

      // Set realistic user agent
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

      // Navigate with random delays
      await page.goto(this.baseURL, { 
        waitUntil: 'networkidle0',
        timeout: 60000 
      });

      // Random mouse movements and scrolling
      await this.simulateHumanBehavior(page);

      // Wait for Cloudflare challenge to complete
      await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 3000));

      // Check if we passed Cloudflare
      const title = await page.title();
      if (title.includes('Just a moment') || title.includes('Cloudflare')) {
        console.log('Cloudflare challenge detected, waiting...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }

      // Extract job listings
      const jobs = await this.extractJobs(page, runId);
      await browser.close();
      return jobs;
    } catch (error) {
      console.error('Puppeteer scraping failed:', error);
      return [];
    }
  }

  async simulateHumanBehavior(page) {
    // Random mouse movements
    await page.mouse.move(100, 100);
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.mouse.move(200, 300);
    
    // Random scrolling
    await page.evaluate(() => {
      window.scrollBy(0, Math.random() * 100);
    });
    
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  }

  async extractJobs(page, runId) {
    // Wait for job cards to load
    try {
      await page.waitForSelector('[data-testid="job-card"], .job-card, .offer-card', {
        timeout: 15000
      });
    } catch (e) {
      console.log('Job cards not found with standard selectors, trying alternatives...');
    }

    const jobs = await page.evaluate(() => {
      const jobs = [];
      
      // Multiple selector strategies
      const selectors = [
        '[data-testid="job-card"]',
        '.job-card',
        '.offer-card',
        'article[class*="job"]',
        'div[class*="offer"]'
      ];
      
      let jobElements = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          jobElements = Array.from(elements);
          break;
        }
      }

      jobElements.forEach(element => {
        const job = {
          title: element.querySelector('h2, h3, [class*="title"]')?.textContent?.trim(),
          company: element.querySelector('[class*="company"], [class*="employer"]')?.textContent?.trim(),
          location: element.querySelector('[class*="location"], [class*="city"]')?.textContent?.trim(),
          type: element.querySelector('[class*="contract"], [class*="type"]')?.textContent?.trim(),
          url: element.querySelector('a')?.href || window.location.href,
          postedDate: element.querySelector('[class*="date"], time')?.textContent?.trim()
        };
        
        if (job.title && job.company) {
          jobs.push(job);
        }
      });

      return jobs;
    });

    // Convert to Job format
    return jobs.map((job) => ({
      title: job.title,
      company: job.company,
      location: job.location || 'Location not specified',
      job_url: job.url,
      description: `Job at ${job.company} - ${job.title}`,
      categories: job.type || 'entry-level',
      experience_required: 'entry-level',
      work_environment: 'hybrid',
      language_requirements: '',
      source: 'jobteaser',
      job_hash: crypto.createHash('md5').update(`${job.title}-${job.company}-${job.url}`).digest('hex'),
      posted_at: new Date().toISOString(),
      original_posted_date: new Date().toISOString(),
      scraper_run_id: runId,
      company_profile_url: '',
      scrape_timestamp: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_active: true,
      created_at: new Date().toISOString()
    }));
  }
}

module.exports = JobTeaserScraperEnhanced;
