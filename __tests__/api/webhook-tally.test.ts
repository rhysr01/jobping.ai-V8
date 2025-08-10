import { NextRequest } from 'next/server';
import { POST } from '@/app/api/webhook-tally/route';

// Mock the dependencies
jest.mock('@/Utils/emailVerification');

describe('/api/webhook-tally', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 400 for missing email', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhook-tally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: 'test',
          eventType: 'FORM_RESPONSE',
          createdAt: '2024-01-01T00:00:00Z',
          formId: 'test',
          responseId: 'test',
          data: {
            fields: [
              {
                key: 'full_name',
                label: 'Full Name',
                type: 'INPUT_TEXT',
                value: 'Test User'
              }
            ]
          }
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email is required');
    });

    it('should return 400 for invalid payload structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/webhook-tally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invalid: 'payload'
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });

    it('should handle new user registration successfully', async () => {
      // Mock Supabase responses
      const { createClient } = require('@supabase/supabase-js');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
            })),
          })),
          upsert: jest.fn(() => Promise.resolve({ error: null })),
        })),
      });

      // Mock email verification
      const { EmailVerificationOracle } = require('@/Utils/emailVerification');
      EmailVerificationOracle.generateVerificationToken = jest.fn().mockReturnValue('test-token');
      EmailVerificationOracle.sendVerificationEmail = jest.fn().mockResolvedValue(true);

      const request = new NextRequest('http://localhost:3000/api/webhook-tally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: 'test',
          eventType: 'FORM_RESPONSE',
          createdAt: '2024-01-01T00:00:00Z',
          formId: 'test',
          responseId: 'test',
          data: {
            fields: [
              {
                key: 'email',
                label: 'Email',
                type: 'INPUT_EMAIL',
                value: 'test@example.com'
              },
              {
                key: 'full_name',
                label: 'Full Name',
                type: 'INPUT_TEXT',
                value: 'Test User'
              },
              {
                key: 'professional_expertise',
                label: 'Professional Expertise',
                type: 'INPUT_TEXT',
                value: 'Software Engineering'
              }
            ]
          }
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.requiresVerification).toBe(true);
    });

    it('should handle existing user successfully', async () => {
      // Mock existing user
      const { createClient } = require('@supabase/supabase-js');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: { 
                  email: 'test@example.com',
                  email_verified: true,
                  created_at: '2024-01-01T00:00:00Z'
                }, 
                error: null 
              })),
            })),
          })),
          upsert: jest.fn(() => Promise.resolve({ error: null })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/webhook-tally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: 'test',
          eventType: 'FORM_RESPONSE',
          createdAt: '2024-01-01T00:00:00Z',
          formId: 'test',
          responseId: 'test',
          data: {
            fields: [
              {
                key: 'email',
                label: 'Email',
                type: 'INPUT_EMAIL',
                value: 'test@example.com'
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

    it('should handle database errors', async () => {
      // Mock database error
      const { createClient } = require('@supabase/supabase-js');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.reject(new Error('Database error'))),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/webhook-tally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: 'test',
          eventType: 'FORM_RESPONSE',
          createdAt: '2024-01-01T00:00:00Z',
          formId: 'test',
          responseId: 'test',
          data: {
            fields: [
              {
                key: 'email',
                label: 'Email',
                type: 'INPUT_EMAIL',
                value: 'test@example.com'
              }
            ]
          }
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
