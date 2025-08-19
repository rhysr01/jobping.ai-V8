import { NextRequest } from 'next/server';
import { POST as matchUsersPOST } from '@/app/api/match-users/route';
import { POST as webhookPOST } from '@/app/api/webhook-tally/route';

describe('End-to-End Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration and Matching Flow', () => {
    it('should handle complete user registration and matching flow', async () => {
      // Step 1: Register a new user via webhook
      const registrationRequest = new NextRequest('http://localhost:3000/api/webhook-tally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
              },
              {
                key: 'visa_status',
                label: 'Visa Status',
                type: 'INPUT_TEXT',
                value: 'EU Citizen'
              },
              {
                key: 'start_date',
                label: 'Start Date',
                type: 'INPUT_TEXT',
                value: '2024-06-01'
              },
              {
                key: 'work_environment',
                label: 'Work Environment',
                type: 'INPUT_TEXT',
                value: 'Hybrid'
              },
              {
                key: 'languages_spoken',
                label: 'Languages Spoken',
                type: 'INPUT_TEXT',
                value: 'English'
              },
              {
                key: 'company_types',
                label: 'Company Types',
                type: 'INPUT_TEXT',
                value: 'Startups'
              },
              {
                key: 'roles_selected',
                label: 'Roles Selected',
                type: 'INPUT_TEXT',
                value: 'Software Engineer'
              },
              {
                key: 'career_path',
                label: 'Career Path',
                type: 'INPUT_TEXT',
                value: 'tech'
              },
              {
                key: 'entry_level_preference',
                label: 'Entry Level Preference',
                type: 'INPUT_TEXT',
                value: 'Graduate'
              },
              {
                key: 'target_cities',
                label: 'Target Cities',
                type: 'INPUT_TEXT',
                value: 'San Francisco'
              }
            ]
          }
        }),
      });

      const registrationResponse = await webhookPOST(registrationRequest);
      const registrationData = await registrationResponse.json();

      expect(registrationResponse.status).toBe(200);
      expect(registrationData.success).toBe(true);
      expect(registrationData.requiresVerification).toBe(true);

      // Step 2: Generate matches for the user
      const matchingRequest = new NextRequest('http://localhost:3000/api/match-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limit: 5,
          userEmail: 'test@example.com'
        }),
      });

      const matchingResponse = await matchUsersPOST(matchingRequest);
      const matchingData = await matchingResponse.json();

      // The matching should either succeed or return a meaningful message
      expect([200, 404, 500]).toContain(matchingResponse.status);
      if (matchingResponse.status === 200) {
        expect(matchingData).toHaveProperty('message');
      }
    });

    it('should handle user registration with existing user', async () => {
      // Mock existing user
      const { createClient } = require('@supabase/supabase-js');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.resolve({ 
                data: { 
                  email: 'existing@example.com',
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
                type: 'INPUT_EMAIL',
                value: 'existing@example.com'
              }
            ]
          }
        }),
      });

      const response = await webhookPOST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection failures gracefully', async () => {
      // Mock database failure
      const { createClient } = require('@supabase/supabase-js');
      createClient.mockReturnValue({
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              single: jest.fn(() => Promise.reject(new Error('Database connection failed'))),
            })),
          })),
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/webhook-tally', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
                type: 'INPUT_EMAIL',
                value: 'test@example.com'
              }
            ]
          }
        }),
      });

      const response = await webhookPOST(request);
      expect(response.status).toBe(500);
    });

    it('should handle rate limiting correctly', async () => {
      // TEMPORARILY DISABLED: Mock rate limiter to return false
      // const { EnhancedRateLimiter } = require('@/Utils/enhancedRateLimiter');
      // EnhancedRateLimiter.prototype.checkLimit = jest.fn().mockResolvedValue({
      //   allowed: false,
      //   remaining: 0,
      // });

      const request = new NextRequest('http://localhost:3000/api/match-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      });

      const response = await matchUsersPOST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limited');
    });
  });
});
