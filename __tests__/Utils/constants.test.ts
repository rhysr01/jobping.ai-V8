/**
 * Tests for Application Constants
 */

import {
  HTTP_STATUS,
  ERROR_CODES,
  API_MESSAGES,
  ENV,
  TIMEOUTS
} from '@/Utils/constants';

describe('Application Constants', () => {
  describe('HTTP_STATUS', () => {
    it('should have success codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.ACCEPTED).toBe(202);
      expect(HTTP_STATUS.NO_CONTENT).toBe(204);
    });

    it('should have client error codes', () => {
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.FORBIDDEN).toBe(403);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.TOO_MANY_REQUESTS).toBe(429);
    });

    it('should have server error codes', () => {
      expect(HTTP_STATUS.INTERNAL_ERROR).toBe(500);
      expect(HTTP_STATUS.BAD_GATEWAY).toBe(502);
      expect(HTTP_STATUS.SERVICE_UNAVAILABLE).toBe(503);
      expect(HTTP_STATUS.GATEWAY_TIMEOUT).toBe(504);
    });
  });

  describe('ERROR_CODES', () => {
    it('should have auth error codes', () => {
      expect(ERROR_CODES.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN');
      expect(ERROR_CODES.INVALID_TOKEN).toBe('INVALID_TOKEN');
    });

    it('should have validation error codes', () => {
      expect(ERROR_CODES.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ERROR_CODES.MISSING_FIELDS).toBe('MISSING_FIELDS');
      expect(ERROR_CODES.INVALID_FORMAT).toBe('INVALID_FORMAT');
    });

    it('should have resource error codes', () => {
      expect(ERROR_CODES.NOT_FOUND).toBe('NOT_FOUND');
      expect(ERROR_CODES.ALREADY_EXISTS).toBe('ALREADY_EXISTS');
    });

    it('should have system error codes', () => {
      expect(ERROR_CODES.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ERROR_CODES.SERVICE_UNAVAILABLE).toBe('SERVICE_UNAVAILABLE');
      expect(ERROR_CODES.DATABASE_ERROR).toBe('DATABASE_ERROR');
    });

    it('should have job matching error codes', () => {
      expect(ERROR_CODES.MATCHING_FAILED).toBe('MATCHING_FAILED');
      expect(ERROR_CODES.AI_TIMEOUT).toBe('AI_TIMEOUT');
      expect(ERROR_CODES.NO_JOBS_AVAILABLE).toBe('NO_JOBS_AVAILABLE');
    });
  });

  describe('API_MESSAGES', () => {
    it('should have success messages', () => {
      expect(API_MESSAGES.SUCCESS).toBe('Operation completed successfully');
      expect(API_MESSAGES.CREATED).toBe('Resource created successfully');
      expect(API_MESSAGES.UPDATED).toBe('Resource updated successfully');
      expect(API_MESSAGES.DELETED).toBe('Resource deleted successfully');
    });

    it('should have auth messages', () => {
      expect(API_MESSAGES.UNAUTHORIZED).toBe('Authentication required');
      expect(API_MESSAGES.FORBIDDEN).toBe('Access denied');
      expect(API_MESSAGES.INVALID_CREDENTIALS).toBe('Invalid credentials provided');
    });

    it('should have validation messages', () => {
      expect(API_MESSAGES.VALIDATION_FAILED).toBe('Request validation failed');
      expect(API_MESSAGES.MISSING_REQUIRED_FIELDS).toBe('Required fields are missing');
      expect(API_MESSAGES.INVALID_DATA_FORMAT).toBe('Invalid data format provided');
    });

    it('should have resource messages', () => {
      expect(API_MESSAGES.NOT_FOUND).toBe('Resource not found');
      expect(API_MESSAGES.ALREADY_EXISTS).toBe('Resource already exists');
    });

    it('should have system messages', () => {
      expect(API_MESSAGES.INTERNAL_ERROR).toBe('An internal server error occurred');
      expect(API_MESSAGES.SERVICE_UNAVAILABLE).toBe('Service temporarily unavailable');
    });

    it('should have job matching messages', () => {
      expect(API_MESSAGES.MATCHING_SUCCESS).toBe('Job matching completed successfully');
      expect(API_MESSAGES.MATCHING_FAILED).toBe('Job matching failed');
      expect(API_MESSAGES.NO_MATCHES_FOUND).toBe('No suitable job matches found');
    });
  });

  describe('ENV helpers', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development';
      expect(ENV.isDevelopment()).toBe(true);
      expect(ENV.isProduction()).toBe(false);
    });

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      expect(ENV.isProduction()).toBe(true);
      expect(ENV.isDevelopment()).toBe(false);
    });

    it('should detect test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(ENV.isTest()).toBe(true);
    });

    it('should detect test mode via JOBPING_TEST_MODE', () => {
      process.env.NODE_ENV = 'development';
      process.env.JOBPING_TEST_MODE = '1';
      expect(ENV.isTest()).toBe(true);
    });
  });

  describe('TIMEOUTS', () => {
    it('should have API request timeout', () => {
      expect(TIMEOUTS.API_REQUEST).toBe(30000);
      expect(TIMEOUTS.API_REQUEST).toBeGreaterThan(0);
    });

    it('should have database query timeout', () => {
      expect(TIMEOUTS.DATABASE_QUERY).toBe(10000);
      expect(TIMEOUTS.DATABASE_QUERY).toBeGreaterThan(0);
    });

    it('should have AI matching timeout', () => {
      expect(TIMEOUTS.AI_MATCHING).toBe(20000);
      expect(TIMEOUTS.AI_MATCHING).toBeGreaterThan(0);
    });

    it('should have webhook processing timeout', () => {
      expect(TIMEOUTS.WEBHOOK_PROCESSING).toBe(15000);
      expect(TIMEOUTS.WEBHOOK_PROCESSING).toBeGreaterThan(0);
    });

    it('should have email send timeout', () => {
      expect(TIMEOUTS.EMAIL_SEND).toBe(10000);
      expect(TIMEOUTS.EMAIL_SEND).toBeGreaterThan(0);
    });

    it('should have reasonable timeout values', () => {
      // All timeouts should be between 1 second and 1 minute
      Object.values(TIMEOUTS).forEach((timeout) => {
        expect(timeout).toBeGreaterThanOrEqual(1000);
        expect(timeout).toBeLessThanOrEqual(60000);
      });
    });
  });
});

