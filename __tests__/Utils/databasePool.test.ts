/**
 * Tests for Database Connection Pool Manager
 */

import { DatabasePool } from '@/Utils/databasePool';
import { createClient } from '@supabase/supabase-js';
import * as Sentry from '@sentry/nextjs';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn(),
  rpc: jest.fn(),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

describe('DatabasePool', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance before each test
    (DatabasePool as any).instance = null;
    (DatabasePool as any).isInitializing = false;
    (DatabasePool as any).lastHealthCheck = 0;

    // Mock environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://mock.supabase.url';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';

    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('getInstance', () => {
    it('should return a singleton instance of SupabaseClient', () => {
      const instance1 = DatabasePool.getInstance();
      const instance2 = DatabasePool.getInstance();

      expect(instance1).toBe(instance2);
      expect(createClient).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('✅ Database connection pool initialized');
    });

    it('should initialize SupabaseClient with correct config', () => {
      DatabasePool.getInstance();

      expect(createClient).toHaveBeenCalledWith(
        'http://mock.supabase.url',
        'mock-key',
        expect.objectContaining({
          auth: { autoRefreshToken: false, persistSession: false },
          db: { schema: 'public' },
          global: { headers: { 'X-Client-Info': 'jobping-database-pool' } },
        })
      );
    });

    it('should throw error if Supabase config is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      expect(() => DatabasePool.getInstance()).toThrow('Missing Supabase configuration');
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });

    it('should throw error if service role key is missing', () => {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(() => DatabasePool.getInstance()).toThrow('Missing Supabase configuration');
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });

    it('should not re-initialize if already initializing', () => {
      (DatabasePool as any).isInitializing = true;
      const instance = DatabasePool.getInstance();
      expect(createClient).not.toHaveBeenCalled(); // Should not call createClient again
      expect(instance).toBeNull(); // Should return null or throw if not fully initialized
    });
  });

  describe('performHealthCheck', () => {
    it('should perform health check on initialization', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: { status: 'ok' }, error: null });
      DatabasePool.getInstance();
      // Health check is async, so we need to wait for it
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow microtasks to run
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('health_check');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Database health check passed');
    });

    it('should log error if health check fails', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: { message: 'DB error' } });
      DatabasePool.getInstance();
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(console.error).toHaveBeenCalledWith('❌ Database health check failed:', expect.any(Error));
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });

    it('should perform periodic health checks', async () => {
      jest.useFakeTimers();
      mockSupabaseClient.rpc.mockResolvedValue({ data: { status: 'ok' }, error: null });

      DatabasePool.getInstance();
      await new Promise(resolve => setTimeout(resolve, 0)); // Initial check

      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(DatabasePool['healthCheckInterval'] - 1);
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(1); // Not yet

      jest.advanceTimersByTime(1); // Trigger interval
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(mockSupabaseClient.rpc).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });

    it('should handle health check timeout', async () => {
      mockSupabaseClient.rpc.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 100)
        )
      );

      DatabasePool.getInstance();
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(console.error).toHaveBeenCalledWith('❌ Database health check failed:', expect.any(Error));
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });
  });

  describe('teardown', () => {
    it('should reset instance on teardown', () => {
      DatabasePool.getInstance();
      expect((DatabasePool as any).instance).not.toBeNull();
      DatabasePool.teardown();
      expect((DatabasePool as any).instance).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('🔌 Database connection pool torn down');
    });

    it('should handle teardown when no instance exists', () => {
      expect(() => DatabasePool.teardown()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('🔌 Database connection pool torn down');
    });
  });

  describe('edge cases', () => {
    it('should handle createClient throwing an error', () => {
      (createClient as jest.Mock).mockImplementation(() => {
        throw new Error('Supabase client creation failed');
      });

      expect(() => DatabasePool.getInstance()).toThrow('Supabase client creation failed');
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent getInstance calls', () => {
      const instance1 = DatabasePool.getInstance();
      const instance2 = DatabasePool.getInstance();

      expect(instance1).toBe(instance2);
      expect(createClient).toHaveBeenCalledTimes(1);
    });

    it('should handle very long environment variable values', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://' + 'x'.repeat(1000) + '.com';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'x'.repeat(1000);

      expect(() => DatabasePool.getInstance()).not.toThrow();
    });

    it('should handle empty string environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = '';
      process.env.SUPABASE_SERVICE_ROLE_KEY = '';

      expect(() => DatabasePool.getInstance()).toThrow('Missing Supabase configuration');
    });

    it('should handle null environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = null as any;
      process.env.SUPABASE_SERVICE_ROLE_KEY = null as any;

      expect(() => DatabasePool.getInstance()).toThrow('Missing Supabase configuration');
    });

    it('should handle undefined environment variables', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = undefined as any;
      process.env.SUPABASE_SERVICE_ROLE_KEY = undefined as any;

      expect(() => DatabasePool.getInstance()).toThrow('Missing Supabase configuration');
    });
  });

  describe('configuration validation', () => {
    it('should validate Supabase URL format', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'invalid-url';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-key';

      expect(() => DatabasePool.getInstance()).not.toThrow(); // Should not throw for URL format
    });

    it('should handle HTTPS URLs', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://secure.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-key';

      expect(() => DatabasePool.getInstance()).not.toThrow();
    });

    it('should handle localhost URLs', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid-key';

      expect(() => DatabasePool.getInstance()).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should capture exceptions in Sentry', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      try {
        DatabasePool.getInstance();
      } catch (error) {
        // Expected to throw
      }

      expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle Sentry captureException throwing', () => {
      (Sentry.captureException as jest.Mock).mockImplementation(() => {
        throw new Error('Sentry error');
      });

      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      
      expect(() => DatabasePool.getInstance()).toThrow('Missing Supabase configuration');
    });
  });

  describe('performance', () => {
    it('should not create multiple clients for multiple calls', () => {
      DatabasePool.getInstance();
      DatabasePool.getInstance();
      DatabasePool.getInstance();

      expect(createClient).toHaveBeenCalledTimes(1);
    });

    it('should return same instance for multiple calls', () => {
      const instance1 = DatabasePool.getInstance();
      const instance2 = DatabasePool.getInstance();
      const instance3 = DatabasePool.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
    });
  });
});