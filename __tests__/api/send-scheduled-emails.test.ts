import { POST, GET } from '@/app/api/send-scheduled-emails/route';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          lt: jest.fn(() => ({
            order: jest.fn(() => ({
              gte: jest.fn(() => ({
                limit: jest.fn(() => Promise.resolve({
                  data: [
                    {
                      id: 1,
                      email: 'test@example.com',
                      full_name: 'Test User',
                      email_verified: true,
                      created_at: new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString(),
                      target_cities: ['London'],
                      languages_spoken: ['English'],
                      company_types: ['startup'],
                      roles_selected: ['software engineer'],
                      professional_experience: 'entry',
                      visa_required: false,
                      remote_preference: 'any'
                    }
                  ],
                  error: null
                }))
              }))
            }))
          }))
        }))
      }))
    }))
  }))
}));

jest.mock('@/Utils/emailUtils', () => ({
  sendMatchedJobsEmail: jest.fn(() => Promise.resolve())
}));

jest.mock('@/Utils/jobMatching', () => ({
  performEnhancedAIMatching: jest.fn(() => Promise.resolve([
    {
      id: 1,
      title: 'Software Engineer',
      company: 'Test Company',
      location: 'London',
      job_url: 'https://example.com/job1',
      match_reason: 'Great match for your skills'
    }
  ])),
  generateFallbackMatches: jest.fn(() => [
    {
      id: 2,
      title: 'Developer',
      company: 'Fallback Company',
      location: 'Remote',
      job_url: 'https://example.com/job2',
      match_reason: 'Fallback match'
    }
  ]),
  logMatchSession: jest.fn(() => Promise.resolve())
}));

jest.mock('openai', () => ({
  default: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(() => Promise.resolve({
          choices: [{ message: { content: 'AI response' } }]
        }))
      }
    }
  }))
}));

describe('/api/send-scheduled-emails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SCRAPE_API_KEY = 'test-api-key';
  });

  it('should return 401 for missing API key', async () => {
    const req = new NextRequest('http://localhost:3000/api/send-scheduled-emails', {
      method: 'POST',
      headers: {}
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 401 for invalid API key', async () => {
    const req = new NextRequest('http://localhost:3000/api/send-scheduled-emails', {
      method: 'POST',
      headers: {
        'x-api-key': 'wrong-key'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 405 for GET method', async () => {
    const req = new NextRequest('http://localhost:3000/api/send-scheduled-emails', {
      method: 'GET'
    });

    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.error).toBe('Method not allowed. This endpoint is designed for POST requests only.');
  });

  it('should return success for valid request with API key', async () => {
    const req = new NextRequest('http://localhost:3000/api/send-scheduled-emails', {
      method: 'POST',
      headers: {
        'x-api-key': 'test-api-key'
      }
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Scheduled email delivery completed');
    expect(data.usersProcessed).toBe(1);
    expect(data.emailsSent).toBe(1);
    expect(data.errors).toBe(0);
  });
});
