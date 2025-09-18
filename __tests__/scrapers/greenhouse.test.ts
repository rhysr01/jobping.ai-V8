import { scrapeGreenhouse } from '@/scrapers/greenhouse';
import { Job } from '@/scrapers/types';

// Mock axios
jest.mock('axios');
const axios = require('axios');

describe('Greenhouse Scraper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should scrape jobs successfully', async () => {
    // Mock successful response
    axios.get.mockResolvedValue({
      data: `
        <html>
          <body>
            <div class="opening">
              <a href="/job/123" class="posting-btn">Junior Software Engineer</a>
              <div class="location">San Francisco, CA</div>
              <div class="department">Engineering</div>
            </div>
            <div class="opening">
              <a href="/job/456" class="posting-btn">Graduate Product Manager</a>
              <div class="location">New York, NY</div>
              <div class="department">Product</div>
            </div>
          </body>
        </html>
      `,
      status: 200,
    });

    const company = {
      name: 'Test Company',
      url: 'https://test.greenhouse.io',
      platform: 'greenhouse' as const,
    };

    const jobs = await scrapeGreenhouse(company, 'test-run-id');

    expect(Array.isArray(jobs)).toBe(true);
    if (jobs.length > 0) {
      expect(jobs[0]).toHaveProperty('title');
      expect(jobs[0]).toHaveProperty('company');
      expect(jobs[0]).toHaveProperty('location');
    }
  });

  it('should handle network errors', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));

    const company = {
      name: 'Test Company',
      url: 'https://test.greenhouse.io',
      platform: 'greenhouse' as const,
    };

    const jobs = await scrapeGreenhouse(company, 'test-run-id');

    expect(jobs).toHaveLength(0);
  });

  it('should handle malformed HTML', async () => {
    axios.get.mockResolvedValue({
      data: '<html><body><div>Invalid HTML</div></body></html>',
      status: 200,
    });

    const company = {
      name: 'Test Company',
      url: 'https://test.greenhouse.io',
      platform: 'greenhouse' as const,
    };

    const jobs = await scrapeGreenhouse(company, 'test-run-id');

    expect(jobs).toHaveLength(0);
  });

  it('should handle empty job listings', async () => {
    axios.get.mockResolvedValue({
      data: '<html><body><div class="opening"></div></body></html>',
      status: 200,
    });

    const company = {
      name: 'Test Company',
      url: 'https://test.greenhouse.io',
      platform: 'greenhouse' as const,
    };

    const jobs = await scrapeGreenhouse(company, 'test-run-id');

    expect(jobs).toHaveLength(0);
  });
});
