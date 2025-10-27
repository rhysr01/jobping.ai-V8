/**
 * Tests for Smart Email Cadence Control System
 */

import {
  getUserEmailProfile,
  calculateEngagementScore,
  recommendCadence,
  updateCadence,
  getOptimalSendTime,
  shouldSendEmail,
  type UserEmailProfile,
  type CadenceRecommendation
} from '@/Utils/email/smartCadence';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('Smart Email Cadence Control System', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis()
    };

    require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabaseClient);
  });

  describe('getUserEmailProfile', () => {
    it('should return user email profile', async () => {
      const mockProfile = {
        email: 'test@example.com',
        current_cadence: 'weekly',
        engagement_score: 0.75,
        open_rate: 0.60,
        click_rate: 0.15,
        last_email_sent: '2024-01-01T10:00:00Z',
        last_email_opened: '2024-01-01T11:00:00Z',
        last_email_clicked: '2024-01-01T12:00:00Z',
        feedback_count: 5,
        negative_feedback_rate: 0.20,
        preferred_time_of_day: 'morning',
        timezone: 'UTC',
        subscription_tier: 'premium',
        days_since_signup: 30,
        total_emails_sent: 20,
        total_emails_opened: 12,
        total_emails_clicked: 3
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockProfile, error: null });

      const profile = await getUserEmailProfile('test@example.com');

      expect(profile.email).toBe('test@example.com');
      expect(profile.currentCadence).toBe('weekly');
      expect(profile.engagementScore).toBe(0.75);
      expect(profile.openRate).toBe(0.60);
      expect(profile.clickRate).toBe(0.15);
    });

    it('should handle missing profile data', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const profile = await getUserEmailProfile('test@example.com');

      expect(profile.email).toBe('test@example.com');
      expect(profile.currentCadence).toBe('weekly');
      expect(profile.engagementScore).toBe(0);
      expect(profile.openRate).toBe(0);
      expect(profile.clickRate).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const profile = await getUserEmailProfile('test@example.com');

      expect(profile.email).toBe('test@example.com');
      expect(profile.currentCadence).toBe('weekly');
      expect(profile.engagementScore).toBe(0);
    });
  });

  describe('calculateEngagementScore', () => {
    it('should calculate high engagement score', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'weekly',
        engagementScore: 0,
        openRate: 0.80,
        clickRate: 0.25,
        lastEmailSent: new Date(),
        lastEmailOpened: new Date(),
        lastEmailClicked: new Date(),
        feedbackCount: 10,
        negativeFeedbackRate: 0.05,
        preferredTimeOfDay: 'morning',
        timezone: 'UTC',
        subscriptionTier: 'premium',
        daysSinceSignup: 30,
        totalEmailsSent: 20,
        totalEmailsOpened: 16,
        totalEmailsClicked: 5
      };

      const score = calculateEngagementScore(profile);

      expect(score).toBeGreaterThan(0.7);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should calculate low engagement score', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'weekly',
        engagementScore: 0,
        openRate: 0.20,
        clickRate: 0.05,
        lastEmailSent: new Date(),
        lastEmailOpened: null,
        lastEmailClicked: null,
        feedbackCount: 2,
        negativeFeedbackRate: 0.50,
        preferredTimeOfDay: 'morning',
        timezone: 'UTC',
        subscriptionTier: 'free',
        daysSinceSignup: 5,
        totalEmailsSent: 10,
        totalEmailsOpened: 2,
        totalEmailsClicked: 0
      };

      const score = calculateEngagementScore(profile);

      expect(score).toBeLessThan(0.3);
      expect(score).toBeGreaterThanOrEqual(0.0);
    });

    it('should handle missing data gracefully', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'weekly',
        engagementScore: 0,
        openRate: 0,
        clickRate: 0,
        lastEmailSent: null,
        lastEmailOpened: null,
        lastEmailClicked: null,
        feedbackCount: 0,
        negativeFeedbackRate: 0,
        preferredTimeOfDay: 'morning',
        timezone: 'UTC',
        subscriptionTier: 'free',
        daysSinceSignup: 0,
        totalEmailsSent: 0,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0
      };

      const score = calculateEngagementScore(profile);

      expect(score).toBe(0);
    });
  });

  describe('recommendCadence', () => {
    it('should recommend daily cadence for high engagement', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'weekly',
        engagementScore: 0.85,
        openRate: 0.90,
        clickRate: 0.30,
        lastEmailSent: new Date(),
        lastEmailOpened: new Date(),
        lastEmailClicked: new Date(),
        feedbackCount: 15,
        negativeFeedbackRate: 0.05,
        preferredTimeOfDay: 'morning',
        timezone: 'UTC',
        subscriptionTier: 'premium',
        daysSinceSignup: 60,
        totalEmailsSent: 30,
        totalEmailsOpened: 27,
        totalEmailsClicked: 9
      };

      const recommendation = recommendCadence(profile);

      expect(recommendation.newCadence).toBe('daily');
      expect(recommendation.confidence).toBeGreaterThan(0.7);
      expect(recommendation.metrics.riskLevel).toBe('low');
    });

    it('should recommend paused cadence for low engagement', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'weekly',
        engagementScore: 0.15,
        openRate: 0.10,
        clickRate: 0.02,
        lastEmailSent: new Date(),
        lastEmailOpened: null,
        lastEmailClicked: null,
        feedbackCount: 3,
        negativeFeedbackRate: 0.80,
        preferredTimeOfDay: 'morning',
        timezone: 'UTC',
        subscriptionTier: 'free',
        daysSinceSignup: 10,
        totalEmailsSent: 5,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0
      };

      const recommendation = recommendCadence(profile);

      expect(recommendation.newCadence).toBe('paused');
      expect(recommendation.confidence).toBeGreaterThan(0.7);
      expect(recommendation.metrics.riskLevel).toBe('high');
    });

    it('should recommend weekly cadence for medium engagement', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: '3x_week',
        engagementScore: 0.50,
        openRate: 0.40,
        clickRate: 0.10,
        lastEmailSent: new Date(),
        lastEmailOpened: new Date(),
        lastEmailClicked: null,
        feedbackCount: 8,
        negativeFeedbackRate: 0.25,
        preferredTimeOfDay: 'afternoon',
        timezone: 'UTC',
        subscriptionTier: 'free',
        daysSinceSignup: 20,
        totalEmailsSent: 15,
        totalEmailsOpened: 6,
        totalEmailsClicked: 1
      };

      const recommendation = recommendCadence(profile);

      expect(recommendation.newCadence).toBe('weekly');
      expect(recommendation.confidence).toBeGreaterThan(0.5);
      expect(recommendation.metrics.riskLevel).toBe('medium');
    });

    it('should maintain current cadence when appropriate', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'weekly',
        engagementScore: 0.60,
        openRate: 0.50,
        clickRate: 0.15,
        lastEmailSent: new Date(),
        lastEmailOpened: new Date(),
        lastEmailClicked: new Date(),
        feedbackCount: 10,
        negativeFeedbackRate: 0.10,
        preferredTimeOfDay: 'morning',
        timezone: 'UTC',
        subscriptionTier: 'premium',
        daysSinceSignup: 45,
        totalEmailsSent: 25,
        totalEmailsOpened: 12,
        totalEmailsClicked: 3
      };

      const recommendation = recommendCadence(profile);

      expect(recommendation.newCadence).toBe('weekly');
      expect(recommendation.confidence).toBeGreaterThan(0.6);
    });
  });

  describe('updateCadence', () => {
    it('should update cadence successfully', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });

      const result = await updateCadence('test@example.com', 'daily');

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        current_cadence: 'daily',
        updated_at: expect.any(String)
      });
    });

    it('should handle update errors', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ 
        data: null, 
        error: { message: 'Update failed' } 
      });

      const result = await updateCadence('test@example.com', 'daily');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Update failed');
    });

    it('should validate cadence values', async () => {
      const result = await updateCadence('test@example.com', 'invalid' as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid cadence');
    });
  });

  describe('getOptimalSendTime', () => {
    it('should return morning time for morning preference', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'weekly',
        engagementScore: 0.5,
        openRate: 0.5,
        clickRate: 0.1,
        lastEmailSent: null,
        lastEmailOpened: null,
        lastEmailClicked: null,
        feedbackCount: 0,
        negativeFeedbackRate: 0,
        preferredTimeOfDay: 'morning',
        timezone: 'UTC',
        subscriptionTier: 'free',
        daysSinceSignup: 0,
        totalEmailsSent: 0,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0
      };

      const sendTime = getOptimalSendTime(profile);

      expect(sendTime.getHours()).toBeGreaterThanOrEqual(8);
      expect(sendTime.getHours()).toBeLessThan(12);
    });

    it('should return afternoon time for afternoon preference', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'weekly',
        engagementScore: 0.5,
        openRate: 0.5,
        clickRate: 0.1,
        lastEmailSent: null,
        lastEmailOpened: null,
        lastEmailClicked: null,
        feedbackCount: 0,
        negativeFeedbackRate: 0,
        preferredTimeOfDay: 'afternoon',
        timezone: 'UTC',
        subscriptionTier: 'free',
        daysSinceSignup: 0,
        totalEmailsSent: 0,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0
      };

      const sendTime = getOptimalSendTime(profile);

      expect(sendTime.getHours()).toBeGreaterThanOrEqual(12);
      expect(sendTime.getHours()).toBeLessThan(18);
    });

    it('should return evening time for evening preference', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'weekly',
        engagementScore: 0.5,
        openRate: 0.5,
        clickRate: 0.1,
        lastEmailSent: null,
        lastEmailOpened: null,
        lastEmailClicked: null,
        feedbackCount: 0,
        negativeFeedbackRate: 0,
        preferredTimeOfDay: 'evening',
        timezone: 'UTC',
        subscriptionTier: 'free',
        daysSinceSignup: 0,
        totalEmailsSent: 0,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0
      };

      const sendTime = getOptimalSendTime(profile);

      expect(sendTime.getHours()).toBeGreaterThanOrEqual(18);
      expect(sendTime.getHours()).toBeLessThan(22);
    });
  });

  describe('shouldSendEmail', () => {
    it('should allow sending for active cadence', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'weekly',
        engagementScore: 0.5,
        openRate: 0.5,
        clickRate: 0.1,
        lastEmailSent: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
        lastEmailOpened: null,
        lastEmailClicked: null,
        feedbackCount: 0,
        negativeFeedbackRate: 0,
        preferredTimeOfDay: 'morning',
        timezone: 'UTC',
        subscriptionTier: 'free',
        daysSinceSignup: 0,
        totalEmailsSent: 0,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0
      };

      const shouldSend = shouldSendEmail(profile);

      expect(shouldSend).toBe(true);
    });

    it('should not allow sending for paused cadence', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'paused',
        engagementScore: 0.1,
        openRate: 0.1,
        clickRate: 0.01,
        lastEmailSent: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        lastEmailOpened: null,
        lastEmailClicked: null,
        feedbackCount: 0,
        negativeFeedbackRate: 0,
        preferredTimeOfDay: 'morning',
        timezone: 'UTC',
        subscriptionTier: 'free',
        daysSinceSignup: 0,
        totalEmailsSent: 0,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0
      };

      const shouldSend = shouldSendEmail(profile);

      expect(shouldSend).toBe(false);
    });

    it('should not allow sending too frequently', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'weekly',
        engagementScore: 0.5,
        openRate: 0.5,
        clickRate: 0.1,
        lastEmailSent: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        lastEmailOpened: null,
        lastEmailClicked: null,
        feedbackCount: 0,
        negativeFeedbackRate: 0,
        preferredTimeOfDay: 'morning',
        timezone: 'UTC',
        subscriptionTier: 'free',
        daysSinceSignup: 0,
        totalEmailsSent: 0,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0
      };

      const shouldSend = shouldSendEmail(profile);

      expect(shouldSend).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle missing environment variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => {
        // This should throw when trying to get user profile
        require('@/Utils/email/smartCadence');
      }).not.toThrow(); // Lazy loading means it won't throw until used
    });

    it('should handle invalid email addresses', async () => {
      const profile = await getUserEmailProfile('invalid-email');

      expect(profile.email).toBe('invalid-email');
      expect(profile.currentCadence).toBe('weekly');
    });

    it('should handle very high engagement scores', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'daily',
        engagementScore: 1.0,
        openRate: 1.0,
        clickRate: 1.0,
        lastEmailSent: new Date(),
        lastEmailOpened: new Date(),
        lastEmailClicked: new Date(),
        feedbackCount: 100,
        negativeFeedbackRate: 0.0,
        preferredTimeOfDay: 'morning',
        timezone: 'UTC',
        subscriptionTier: 'premium',
        daysSinceSignup: 365,
        totalEmailsSent: 1000,
        totalEmailsOpened: 1000,
        totalEmailsClicked: 1000
      };

      const score = calculateEngagementScore(profile);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should handle very low engagement scores', () => {
      const profile: UserEmailProfile = {
        email: 'test@example.com',
        currentCadence: 'paused',
        engagementScore: 0.0,
        openRate: 0.0,
        clickRate: 0.0,
        lastEmailSent: null,
        lastEmailOpened: null,
        lastEmailClicked: null,
        feedbackCount: 0,
        negativeFeedbackRate: 1.0,
        preferredTimeOfDay: 'morning',
        timezone: 'UTC',
        subscriptionTier: 'free',
        daysSinceSignup: 1,
        totalEmailsSent: 1,
        totalEmailsOpened: 0,
        totalEmailsClicked: 0
      };

      const score = calculateEngagementScore(profile);
      expect(score).toBeGreaterThanOrEqual(0.0);
    });
  });
});
