import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from '@/app/api/webhook-tally/route';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}));

jest.mock('@/Utils/jobMatching', () => ({
  performEnhancedAIMatching: jest.fn(() => Promise.resolve([])),
  generateFallbackMatches: jest.fn(() => []),
  logMatchSession: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/Utils/emailUtils', () => ({
  sendMatchedJobsEmail: jest.fn(() => Promise.resolve()),
  sendWelcomeEmail: jest.fn(() => Promise.resolve()),
}));

jest.mock('@/Utils/emailVerification', () => ({
  EmailVerificationOracle: {
    sendVerificationEmail: jest.fn(() => Promise.resolve()),
  },
}));

describe('/api/webhook-tally', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 400 for invalid request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhook-tally', {
        method: 'POST',
        body: JSON.stringify({ invalid: 'data' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 400 for missing email', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhook-tally', {
        method: 'POST',
        body: JSON.stringify({
          eventId: 'test-event',
          eventType: 'FORM_RESPONSE',
          createdAt: '2024-01-01T00:00:00Z',
          formId: 'test-form',
          responseId: 'test-response',
          data: {
            fields: [
              {
                key: 'name',
                label: 'Full Name',
                type: 'text',
                value: 'John Doe'
              }
            ]
          }
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Email is required');
    });

    it('should return 200 for valid webhook data', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhook-tally', {
        method: 'POST',
        body: JSON.stringify({
          eventId: 'test-event',
          eventType: 'FORM_RESPONSE',
          createdAt: '2024-01-01T00:00:00Z',
          formId: 'test-form',
          responseId: 'test-response',
          data: {
            fields: [
              {
                key: 'email',
                label: 'Email',
                type: 'email',
                value: 'test@example.com'
              },
              {
                key: 'name',
                label: 'Full Name',
                type: 'text',
                value: 'John Doe'
              },
              {
                key: 'cities',
                label: 'Target Cities',
                type: 'text',
                value: ['New York', 'San Francisco']
              }
            ]
          }
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      const mockSupabase = require('@supabase/supabase-js').createClient();
      mockSupabase.from.mockReturnValue({
        insert: jest.fn(() => Promise.resolve({ error: { message: 'Database error' } })),
      });

      const request = new NextRequest('http://localhost:3000/api/webhook-tally', {
        method: 'POST',
        body: JSON.stringify({
          eventId: 'test-event',
          eventType: 'FORM_RESPONSE',
          createdAt: '2024-01-01T00:00:00Z',
          formId: 'test-form',
          responseId: 'test-response',
          data: {
            fields: [
              {
                key: 'email',
                label: 'Email',
                type: 'email',
                value: 'test@example.com'
              }
            ]
          }
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET', () => {
    it('should return 405 for GET method', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhook-tally', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(405);
      expect(data.error).toContain('Method not allowed');
    });
  });
});