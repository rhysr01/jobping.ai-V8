/**
 * Tests for Email Verification System
 */

import { EmailVerificationOracle } from '@/Utils/emailVerification';

// Mock dependencies
jest.mock('resend', () => ({
  Resend: jest.fn()
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn()
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn()
}));

describe('EmailVerificationOracle', () => {
  let mockResendClient: any;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockResendClient = {
      emails: {
        send: jest.fn()
      }
    };

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    require('resend').Resend.mockImplementation(() => mockResendClient);
    require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabaseClient);
    require('crypto').randomBytes.mockReturnValue(Buffer.from('test-token-12345678901234567890123456789012', 'hex'));
    require('bcrypt').hash.mockResolvedValue('hashed-token');
    require('bcrypt').compare.mockResolvedValue(true);
  });

  describe('generateVerificationToken', () => {
    it('should generate and store verification token', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });

      const token = await EmailVerificationOracle.generateVerificationToken('test@example.com');

      expect(token).toBe('test-token-12345678901234567890123456789012');
      expect(require('crypto').randomBytes).toHaveBeenCalledWith(32);
      expect(require('bcrypt').hash).toHaveBeenCalledWith(token, 12);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        verification_token: 'hashed-token',
        verification_token_expires: expect.any(Date)
      });
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(EmailVerificationOracle.generateVerificationToken('test@example.com'))
        .rejects.toThrow('Database error');
    });

    it('should set token expiration to 24 hours', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });

      await EmailVerificationOracle.generateVerificationToken('test@example.com');

      const updateCall = mockSupabaseClient.update.mock.calls[0][0];
      const expiration = new Date(updateCall.verification_token_expires);
      const now = new Date();
      const hoursDiff = (expiration.getTime() - now.getTime()) / (1000 * 60 * 60);

      expect(hoursDiff).toBeCloseTo(24, 1);
    });
  });

  describe('generateVerificationTokenLegacy', () => {
    it('should generate legacy token', () => {
      const token = EmailVerificationOracle.generateVerificationTokenLegacy();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        verification_token: 'hashed-token',
        verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        email_verified: false
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockUser, error: null });
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });

      const result = await EmailVerificationOracle.verifyToken('test@example.com', 'test-token');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Email verified successfully');
    });

    it('should reject expired token', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        verification_token: 'hashed-token',
        verification_token_expires: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired
        email_verified: false
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await EmailVerificationOracle.verifyToken('test@example.com', 'test-token');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Token expired');
    });

    it('should reject invalid token', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        verification_token: 'hashed-token',
        verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        email_verified: false
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockUser, error: null });
      require('bcrypt').compare.mockResolvedValue(false);

      const result = await EmailVerificationOracle.verifyToken('test@example.com', 'invalid-token');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid token');
    });

    it('should handle user not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const result = await EmailVerificationOracle.verifyToken('test@example.com', 'test-token');

      expect(result.success).toBe(false);
      expect(result.message).toContain('User not found');
    });

    it('should handle already verified email', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        verification_token: 'hashed-token',
        verification_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        email_verified: true
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await EmailVerificationOracle.verifyToken('test@example.com', 'test-token');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Email already verified');
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      mockResendClient.emails.send.mockResolvedValue({ 
        id: 'email-123',
        to: 'test@example.com'
      });

      const result = await EmailVerificationOracle.sendVerificationEmail(
        'test@example.com',
        'John Doe',
        'test-token'
      );

      expect(result.success).toBe(true);
      expect(mockResendClient.emails.send).toHaveBeenCalledWith({
        from: 'JobPing <noreply@getjobping.com>',
        to: 'test@example.com',
        subject: 'Verify your email address',
        html: expect.stringContaining('test-token')
      });
    });

    it('should handle email sending errors', async () => {
      mockResendClient.emails.send.mockRejectedValue(new Error('Email sending failed'));

      const result = await EmailVerificationOracle.sendVerificationEmail(
        'test@example.com',
        'John Doe',
        'test-token'
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Email sending failed');
    });

    it('should handle missing name', async () => {
      mockResendClient.emails.send.mockResolvedValue({ 
        id: 'email-123',
        to: 'test@example.com'
      });

      const result = await EmailVerificationOracle.sendVerificationEmail(
        'test@example.com',
        undefined,
        'test-token'
      );

      expect(result.success).toBe(true);
      const sendCall = mockResendClient.emails.send.mock.calls[0][0];
      expect(sendCall.html).toContain('Hello!');
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        full_name: 'John Doe',
        email_verified: false
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockUser, error: null });
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });
      mockResendClient.emails.send.mockResolvedValue({ 
        id: 'email-123',
        to: 'test@example.com'
      });

      const result = await EmailVerificationOracle.resendVerificationEmail('test@example.com');

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.update).toHaveBeenCalled();
      expect(mockResendClient.emails.send).toHaveBeenCalled();
    });

    it('should handle user not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const result = await EmailVerificationOracle.resendVerificationEmail('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('User not found');
    });

    it('should handle already verified email', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        full_name: 'John Doe',
        email_verified: true
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await EmailVerificationOracle.resendVerificationEmail('test@example.com');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Email already verified');
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should cleanup expired tokens', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ data: null, error: null });

      const result = await EmailVerificationOracle.cleanupExpiredTokens();

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        verification_token: null,
        verification_token_expires: null
      });
    });

    it('should handle cleanup errors', async () => {
      mockSupabaseClient.eq.mockResolvedValue({ 
        data: null, 
        error: { message: 'Cleanup failed' } 
      });

      const result = await EmailVerificationOracle.cleanupExpiredTokens();

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cleanup failed');
    });
  });

  describe('getVerificationStatus', () => {
    it('should return verification status for verified user', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        email_verified: true,
        verification_token: null
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await EmailVerificationOracle.getVerificationStatus('test@example.com');

      expect(result.verified).toBe(true);
      expect(result.hasToken).toBe(false);
    });

    it('should return verification status for unverified user', async () => {
      const mockUser = {
        id: 'user1',
        email: 'test@example.com',
        email_verified: false,
        verification_token: 'hashed-token'
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockUser, error: null });

      const result = await EmailVerificationOracle.getVerificationStatus('test@example.com');

      expect(result.verified).toBe(false);
      expect(result.hasToken).toBe(true);
    });

    it('should handle user not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const result = await EmailVerificationOracle.getVerificationStatus('test@example.com');

      expect(result.verified).toBe(false);
      expect(result.hasToken).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle missing environment variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => EmailVerificationOracle.getSupabaseClient()).toThrow('Missing Supabase configuration');
    });

    it('should handle crypto randomBytes errors', async () => {
      require('crypto').randomBytes.mockImplementation(() => {
        throw new Error('Crypto error');
      });

      await expect(EmailVerificationOracle.generateVerificationToken('test@example.com'))
        .rejects.toThrow('Crypto error');
    });

    it('should handle bcrypt errors', async () => {
      require('bcrypt').hash.mockRejectedValue(new Error('Bcrypt error'));

      await expect(EmailVerificationOracle.generateVerificationToken('test@example.com'))
        .rejects.toThrow('Bcrypt error');
    });
  });
});