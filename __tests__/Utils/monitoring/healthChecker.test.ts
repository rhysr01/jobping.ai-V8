/**
 * Tests for Health Checker
 */

import { HealthChecker, type HealthCheckResult, type ComponentHealth } from '@/Utils/monitoring/healthChecker';

// Mock dependencies
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

jest.mock('resend', () => ({
  Resend: jest.fn()
}));

describe('HealthChecker', () => {
  let healthChecker: HealthChecker;
  let mockSupabaseClient: any;
  let mockResendClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    mockResendClient = {
      emails: {
        send: jest.fn()
      }
    };

    require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabaseClient);
    require('resend').Resend.mockImplementation(() => mockResendClient);
    
    healthChecker = new HealthChecker();
  });

  describe('constructor', () => {
    it('should initialize with Supabase and Resend clients', () => {
      expect(healthChecker).toBeDefined();
      expect(require('@supabase/supabase-js').createClient).toHaveBeenCalled();
      expect(require('resend').Resend).toHaveBeenCalled();
    });
  });

  describe('performHealthCheck', () => {
    it('should perform comprehensive health check', async () => {
      // Mock successful database check
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { version: '1.0.0' }, 
        error: null 
      });

      // Mock successful email check
      mockResendClient.emails.send.mockResolvedValue({ 
        id: 'test-email-id' 
      });

      const result = await healthChecker.performHealthCheck();

      expect(result).toBeDefined();
      expect(result.status).toBe('healthy');
      expect(result.timestamp).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
      expect(result.components).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection failed' } 
      });

      mockResendClient.emails.send.mockResolvedValue({ 
        id: 'test-email-id' 
      });

      const result = await healthChecker.performHealthCheck();

      expect(result.components.database.status).toBe('unhealthy');
      expect(result.components.database.message).toContain('Database connection failed');
    });

    it('should handle email service errors', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { version: '1.0.0' }, 
        error: null 
      });

      mockResendClient.emails.send.mockRejectedValue(new Error('Email service unavailable'));

      const result = await healthChecker.performHealthCheck();

      expect(result.components.email.status).toBe('unhealthy');
      expect(result.components.email.message).toContain('Email service unavailable');
    });

    it('should calculate overall status correctly', async () => {
      // Mock all services healthy
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { version: '1.0.0' }, 
        error: null 
      });
      mockResendClient.emails.send.mockResolvedValue({ 
        id: 'test-email-id' 
      });

      const result = await healthChecker.performHealthCheck();

      expect(result.status).toBe('healthy');
    });

    it('should set degraded status when some components fail', async () => {
      // Mock database healthy, email failing
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { version: '1.0.0' }, 
        error: null 
      });
      mockResendClient.emails.send.mockRejectedValue(new Error('Email service degraded'));

      const result = await healthChecker.performHealthCheck();

      expect(result.status).toBe('degraded');
    });
  });

  describe('checkDatabase', () => {
    it('should return healthy status for successful database check', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { version: '1.0.0' }, 
        error: null 
      });

      const result = await healthChecker['checkDatabase']();

      expect(result.status).toBe('healthy');
      expect(result.message).toContain('Database connection successful');
      expect(result.response_time).toBeGreaterThan(0);
    });

    it('should return unhealthy status for database errors', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Connection timeout' } 
      });

      const result = await healthChecker['checkDatabase']();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Connection timeout');
    });

    it('should handle database query timeouts', async () => {
      mockSupabaseClient.single.mockRejectedValue(new Error('Query timeout'));

      const result = await healthChecker['checkDatabase']();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Query timeout');
    });
  });

  describe('checkEmailService', () => {
    it('should return healthy status for successful email check', async () => {
      mockResendClient.emails.send.mockResolvedValue({ 
        id: 'test-email-id' 
      });

      const result = await healthChecker['checkEmailService']();

      expect(result.status).toBe('healthy');
      expect(result.message).toContain('Email service operational');
      expect(result.response_time).toBeGreaterThan(0);
    });

    it('should return unhealthy status for email service errors', async () => {
      mockResendClient.emails.send.mockRejectedValue(new Error('API key invalid'));

      const result = await healthChecker['checkEmailService']();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('API key invalid');
    });

    it('should handle email service timeouts', async () => {
      mockResendClient.emails.send.mockRejectedValue(new Error('Request timeout'));

      const result = await healthChecker['checkEmailService']();

      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Request timeout');
    });
  });

  describe('checkQueue', () => {
    it('should return healthy status for queue check', async () => {
      const result = await healthChecker['checkQueue']();

      expect(result.status).toBe('healthy');
      expect(result.message).toContain('Queue system operational');
    });
  });

  describe('checkStorage', () => {
    it('should return healthy status for storage check', async () => {
      const result = await healthChecker['checkStorage']();

      expect(result.status).toBe('healthy');
      expect(result.message).toContain('Storage system operational');
    });
  });

  describe('checkExternalAPIs', () => {
    it('should return healthy status for external APIs check', async () => {
      const result = await healthChecker['checkExternalAPIs']();

      expect(result.status).toBe('healthy');
      expect(result.message).toContain('External APIs operational');
    });
  });

  describe('getSystemMetrics', () => {
    it('should return system metrics', () => {
      const metrics = healthChecker['getSystemMetrics']();

      expect(metrics.response_time).toBeGreaterThanOrEqual(0);
      expect(metrics.memory_usage).toBeDefined();
      expect(metrics.uptime).toBeGreaterThan(0);
    });

    it('should include memory usage information', () => {
      const metrics = healthChecker['getSystemMetrics']();

      expect(metrics.memory_usage).toHaveProperty('rss');
      expect(metrics.memory_usage).toHaveProperty('heapUsed');
      expect(metrics.memory_usage).toHaveProperty('heapTotal');
    });
  });

  describe('determineOverallStatus', () => {
    it('should return healthy when all components are healthy', () => {
      const components = {
        database: { status: 'healthy' } as ComponentHealth,
        email: { status: 'healthy' } as ComponentHealth,
        queue: { status: 'healthy' } as ComponentHealth,
        storage: { status: 'healthy' } as ComponentHealth,
        external_apis: { status: 'healthy' } as ComponentHealth
      };

      const status = healthChecker['determineOverallStatus'](components);
      expect(status).toBe('healthy');
    });

    it('should return degraded when some components are degraded', () => {
      const components = {
        database: { status: 'healthy' } as ComponentHealth,
        email: { status: 'degraded' } as ComponentHealth,
        queue: { status: 'healthy' } as ComponentHealth,
        storage: { status: 'healthy' } as ComponentHealth,
        external_apis: { status: 'healthy' } as ComponentHealth
      };

      const status = healthChecker['determineOverallStatus'](components);
      expect(status).toBe('degraded');
    });

    it('should return unhealthy when any component is unhealthy', () => {
      const components = {
        database: { status: 'unhealthy' } as ComponentHealth,
        email: { status: 'healthy' } as ComponentHealth,
        queue: { status: 'healthy' } as ComponentHealth,
        storage: { status: 'healthy' } as ComponentHealth,
        external_apis: { status: 'healthy' } as ComponentHealth
      };

      const status = healthChecker['determineOverallStatus'](components);
      expect(status).toBe('unhealthy');
    });
  });

  describe('edge cases', () => {
    it('should handle missing environment variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.RESEND_API_KEY;

      expect(() => new HealthChecker()).toThrow();
    });

    it('should handle very slow database responses', async () => {
      // Mock slow database response
      mockSupabaseClient.single.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ data: { version: '1.0.0' }, error: null }), 100)
        )
      );

      const result = await healthChecker['checkDatabase']();

      expect(result.status).toBe('healthy');
      expect(result.response_time).toBeGreaterThan(100);
    });

    it('should handle concurrent health checks', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { version: '1.0.0' }, 
        error: null 
      });
      mockResendClient.emails.send.mockResolvedValue({ 
        id: 'test-email-id' 
      });

      const promises = [
        healthChecker.performHealthCheck(),
        healthChecker.performHealthCheck(),
        healthChecker.performHealthCheck()
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.status).toBe('healthy');
      });
    });
  });
});