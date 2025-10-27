/**
 * Tests for Match Logging Service
 */

import { logMatchSession, logJobMatch, type MatchSessionLog } from '@/Utils/matching/logging.service';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('Match Logging Service', () => {
  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabaseClient);
  });

  describe('logMatchSession', () => {
    it('should log AI success session', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });

      await logMatchSession(
        'test@example.com',
        'ai_success',
        5,
        {
          processingTimeMs: 1500,
          aiModel: 'gpt-4',
          aiCostUsd: 0.05,
          sessionId: 'session-123'
        }
      );

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('match_sessions');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        user_email: 'test@example.com',
        match_type: 'ai_success',
        matches_count: 5,
        processing_time_ms: 1500,
        ai_model: 'gpt-4',
        ai_cost_usd: 0.05,
        session_id: 'session-123'
      });
    });

    it('should log AI failed session', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });

      await logMatchSession(
        'test@example.com',
        'ai_failed',
        0,
        {
          errorMessage: 'API timeout',
          sessionId: 'session-456'
        }
      );

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        user_email: 'test@example.com',
        match_type: 'ai_failed',
        matches_count: 0,
        error_message: 'API timeout',
        session_id: 'session-456'
      });
    });

    it('should log fallback session', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });

      await logMatchSession(
        'test@example.com',
        'fallback',
        3,
        {
          processingTimeMs: 200,
          sessionId: 'session-789'
        }
      );

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        user_email: 'test@example.com',
        match_type: 'fallback',
        matches_count: 3,
        processing_time_ms: 200,
        session_id: 'session-789'
      });
    });

    it('should handle missing additional data', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });

      await logMatchSession('test@example.com', 'ai_success', 2);

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        user_email: 'test@example.com',
        match_type: 'ai_success',
        matches_count: 2
      });
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(logMatchSession('test@example.com', 'ai_success', 2)).resolves.not.toThrow();
    });
  });

  describe('logJobMatch', () => {
    it('should log job match with all fields', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });

      await logJobMatch({
        user_email: 'test@example.com',
        job_hash: 'job-hash-123',
        match_score: 85,
        match_reason: 'Great match for your skills',
        match_quality: 'good',
        match_algorithm: 'ai',
        session_id: 'session-123'
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('job_matches');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        user_email: 'test@example.com',
        job_hash: 'job-hash-123',
        match_score: 85,
        match_reason: 'Great match for your skills',
        match_quality: 'good',
        match_algorithm: 'ai',
        session_id: 'session-123'
      });
    });

    it('should log job match with minimal fields', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ data: null, error: null });

      await logJobMatch({
        user_email: 'test@example.com',
        job_hash: 'job-hash-456',
        match_score: 70,
        match_reason: 'Decent match',
        match_quality: 'fair',
        match_algorithm: 'rules'
      });

      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        user_email: 'test@example.com',
        job_hash: 'job-hash-456',
        match_score: 70,
        match_reason: 'Decent match',
        match_quality: 'fair',
        match_algorithm: 'rules'
      });
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(logJobMatch({
        user_email: 'test@example.com',
        job_hash: 'job-hash-789',
        match_score: 80,
        match_reason: 'Good match',
        match_quality: 'good',
        match_algorithm: 'ai'
      })).resolves.not.toThrow();
    });
  });

  describe('MatchSessionLog interface', () => {
    it('should have correct structure', () => {
      const log: MatchSessionLog = {
        user_email: 'test@example.com',
        match_type: 'ai_success',
        matches_count: 5,
        processing_time_ms: 1500,
        ai_model: 'gpt-4',
        ai_cost_usd: 0.05,
        error_message: 'Test error',
        session_id: 'session-123'
      };

      expect(log.user_email).toBe('test@example.com');
      expect(log.match_type).toBe('ai_success');
      expect(log.matches_count).toBe(5);
      expect(log.processing_time_ms).toBe(1500);
      expect(log.ai_model).toBe('gpt-4');
      expect(log.ai_cost_usd).toBe(0.05);
      expect(log.error_message).toBe('Test error');
      expect(log.session_id).toBe('session-123');
    });

    it('should allow optional fields', () => {
      const log: MatchSessionLog = {
        user_email: 'test@example.com',
        match_type: 'fallback',
        matches_count: 3
      };

      expect(log.user_email).toBe('test@example.com');
      expect(log.match_type).toBe('fallback');
      expect(log.matches_count).toBe(3);
      expect(log.processing_time_ms).toBeUndefined();
      expect(log.ai_model).toBeUndefined();
      expect(log.ai_cost_usd).toBeUndefined();
      expect(log.error_message).toBeUndefined();
      expect(log.session_id).toBeUndefined();
    });
  });

  describe('error handling', () => {
    it('should handle Supabase client creation errors', async () => {
      require('@supabase/supabase-js').createClient.mockImplementation(() => {
        throw new Error('Supabase client creation failed');
      });

      await expect(logMatchSession('test@example.com', 'ai_success', 2)).rejects.toThrow();
    });

    it('should handle missing environment variables', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      await expect(logMatchSession('test@example.com', 'ai_success', 2)).rejects.toThrow('Missing Supabase configuration');
    });
  });
});
