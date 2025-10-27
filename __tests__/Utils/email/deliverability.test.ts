/**
 * Tests for Email Deliverability System
 */

import {
  validateEmailDeliverability,
  recordBounce,
  recordUnsubscribe,
  getDeliverabilityMetrics,
  shouldPauseSending,
  getBounceRecords,
  getUnsubscribeRecords,
  cleanupOldRecords,
  type EmailDeliverabilityMetrics,
  type BounceRecord,
  type UnsubscribeRecord
} from '@/Utils/email/deliverability';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('Email Deliverability System', () => {
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabaseClient);
  });

  describe('validateEmailDeliverability', () => {
    it('should validate email deliverability setup', async () => {
      const result = await validateEmailDeliverability('test@example.com');

      expect(result.isValid).toBeDefined();
      expect(result.checks).toBeDefined();
      expect(result.checks.spf).toBeDefined();
      expect(result.checks.dkim).toBeDefined();
      expect(result.checks.dmarc).toBeDefined();
    });

    it('should check SPF record', async () => {
      const result = await validateEmailDeliverability('test@example.com');

      expect(result.checks.spf).toHaveProperty('valid');
      expect(result.checks.spf).toHaveProperty('record');
    });

    it('should check DKIM record', async () => {
      const result = await validateEmailDeliverability('test@example.com');

      expect(result.checks.dkim).toHaveProperty('valid');
      expect(result.checks.dkim).toHaveProperty('record');
    });

    it('should check DMARC record', async () => {
      const result = await validateEmailDeliverability('test@example.com');

      expect(result.checks.dmarc).toHaveProperty('valid');
      expect(result.checks.dmarc).toHaveProperty('record');
    });
  });

  describe('recordBounce', () => {
    it('should record hard bounce', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });

      const result = await recordBounce('test@example.com', 'hard', 'Invalid email address');

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        email: 'test@example.com',
        bounce_type: 'hard',
        reason: 'Invalid email address',
        timestamp: expect.any(Date),
        retry_count: 0
      });
    });

    it('should record soft bounce', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });

      const result = await recordBounce('test@example.com', 'soft', 'Mailbox full');

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        email: 'test@example.com',
        bounce_type: 'soft',
        reason: 'Mailbox full',
        timestamp: expect.any(Date),
        retry_count: 0
      });
    });

    it('should record complaint', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });

      const result = await recordBounce('test@example.com', 'complaint', 'User marked as spam');

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        email: 'test@example.com',
        bounce_type: 'complaint',
        reason: 'User marked as spam',
        timestamp: expect.any(Date),
        retry_count: 0
      });
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const result = await recordBounce('test@example.com', 'hard', 'Invalid email');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('recordUnsubscribe', () => {
    it('should record email link unsubscribe', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });

      const result = await recordUnsubscribe('test@example.com', 'email_link', 'User clicked unsubscribe');

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        email: 'test@example.com',
        reason: 'User clicked unsubscribe',
        timestamp: expect.any(Date),
        source: 'email_link'
      });
    });

    it('should record dashboard unsubscribe', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });

      const result = await recordUnsubscribe('test@example.com', 'dashboard');

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        email: 'test@example.com',
        reason: undefined,
        timestamp: expect.any(Date),
        source: 'dashboard'
      });
    });

    it('should record complaint unsubscribe', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });

      const result = await recordUnsubscribe('test@example.com', 'complaint', 'User marked as spam');

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        email: 'test@example.com',
        reason: 'User marked as spam',
        timestamp: expect.any(Date),
        source: 'complaint'
      });
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const result = await recordUnsubscribe('test@example.com', 'email_link');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Database error');
    });
  });

  describe('getDeliverabilityMetrics', () => {
    it('should return deliverability metrics', async () => {
      const mockMetrics = {
        total_sent: 1000,
        total_delivered: 950,
        total_bounced: 30,
        total_complaints: 5,
        total_unsubscribes: 15,
        total_spam: 2
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockMetrics, error: null });

      const result = await getDeliverabilityMetrics();

      expect(result.deliveryRate).toBeCloseTo(95, 1);
      expect(result.bounceRate).toBeCloseTo(3, 1);
      expect(result.complaintRate).toBeCloseTo(0.5, 1);
      expect(result.unsubscribeRate).toBeCloseTo(1.5, 1);
      expect(result.spamRate).toBeCloseTo(0.2, 1);
      expect(result.lastChecked).toBeDefined();
    });

    it('should handle missing metrics data', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const result = await getDeliverabilityMetrics();

      expect(result.deliveryRate).toBe(0);
      expect(result.bounceRate).toBe(0);
      expect(result.complaintRate).toBe(0);
      expect(result.unsubscribeRate).toBe(0);
      expect(result.spamRate).toBe(0);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const result = await getDeliverabilityMetrics();

      expect(result.deliveryRate).toBe(0);
      expect(result.bounceRate).toBe(0);
      expect(result.complaintRate).toBe(0);
      expect(result.unsubscribeRate).toBe(0);
      expect(result.spamRate).toBe(0);
    });
  });

  describe('shouldPauseSending', () => {
    it('should pause sending when bounce rate is high', async () => {
      const mockMetrics = {
        total_sent: 1000,
        total_delivered: 800,
        total_bounced: 200, // 20% bounce rate
        total_complaints: 5,
        total_unsubscribes: 15,
        total_spam: 2
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockMetrics, error: null });

      const result = await shouldPauseSending();

      expect(result.shouldPause).toBe(true);
      expect(result.reason).toContain('bounce rate');
    });

    it('should pause sending when complaint rate is high', async () => {
      const mockMetrics = {
        total_sent: 1000,
        total_delivered: 950,
        total_bounced: 30,
        total_complaints: 20, // 2% complaint rate
        total_unsubscribes: 15,
        total_spam: 2
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockMetrics, error: null });

      const result = await shouldPauseSending();

      expect(result.shouldPause).toBe(true);
      expect(result.reason).toContain('complaint rate');
    });

    it('should not pause sending when rates are normal', async () => {
      const mockMetrics = {
        total_sent: 1000,
        total_delivered: 950,
        total_bounced: 30,
        total_complaints: 5,
        total_unsubscribes: 15,
        total_spam: 2
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockMetrics, error: null });

      const result = await shouldPauseSending();

      expect(result.shouldPause).toBe(false);
      expect(result.reason).toContain('Normal rates');
    });
  });

  describe('getBounceRecords', () => {
    it('should return bounce records', async () => {
      const mockBounces = [
        {
          email: 'test1@example.com',
          bounce_type: 'hard',
          reason: 'Invalid email',
          timestamp: new Date(),
          retry_count: 0
        },
        {
          email: 'test2@example.com',
          bounce_type: 'soft',
          reason: 'Mailbox full',
          timestamp: new Date(),
          retry_count: 1
        }
      ];

      mockSupabaseClient.limit.mockResolvedValue({ data: mockBounces, error: null });

      const result = await getBounceRecords(10);

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('test1@example.com');
      expect(result[0].bounceType).toBe('hard');
      expect(result[1].email).toBe('test2@example.com');
      expect(result[1].bounceType).toBe('soft');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.limit.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const result = await getBounceRecords(10);

      expect(result).toEqual([]);
    });
  });

  describe('getUnsubscribeRecords', () => {
    it('should return unsubscribe records', async () => {
      const mockUnsubscribes = [
        {
          email: 'test1@example.com',
          reason: 'User clicked unsubscribe',
          timestamp: new Date(),
          source: 'email_link'
        },
        {
          email: 'test2@example.com',
          reason: 'User marked as spam',
          timestamp: new Date(),
          source: 'complaint'
        }
      ];

      mockSupabaseClient.limit.mockResolvedValue({ data: mockUnsubscribes, error: null });

      const result = await getUnsubscribeRecords(10);

      expect(result).toHaveLength(2);
      expect(result[0].email).toBe('test1@example.com');
      expect(result[0].source).toBe('email_link');
      expect(result[1].email).toBe('test2@example.com');
      expect(result[1].source).toBe('complaint');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.limit.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const result = await getUnsubscribeRecords(10);

      expect(result).toEqual([]);
    });
  });

  describe('cleanupOldRecords', () => {
    it('should cleanup old bounce records', async () => {
      mockSupabaseClient.lte.mockResolvedValue({ data: null, error: null });

      const result = await cleanupOldRecords(30);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('timestamp', expect.any(Date));
    });

    it('should cleanup old unsubscribe records', async () => {
      mockSupabaseClient.lte.mockResolvedValue({ data: null, error: null });

      const result = await cleanupOldRecords(30);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.lte).toHaveBeenCalledWith('timestamp', expect.any(Date));
    });

    it('should handle cleanup errors', async () => {
      mockSupabaseClient.lte.mockResolvedValue({ 
        data: null, 
        error: { message: 'Cleanup failed' } 
      });

      const result = await cleanupOldRecords(30);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cleanup failed');
    });
  });

  describe('edge cases', () => {
    it('should handle missing environment variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => require('@supabase/supabase-js').createClient()).toThrow();
    });

    it('should handle invalid email addresses', async () => {
      const result = await validateEmailDeliverability('invalid-email');

      expect(result.isValid).toBe(false);
    });

    it('should handle empty bounce reason', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });

      const result = await recordBounce('test@example.com', 'hard', '');

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        email: 'test@example.com',
        bounce_type: 'hard',
        reason: '',
        timestamp: expect.any(Date),
        retry_count: 0
      });
    });
  });
});