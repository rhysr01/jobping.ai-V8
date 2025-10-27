/**
 * Tests for Error Handler
 */

import {
  ErrorCode,
  ErrorSeverity,
  AppError,
  ValidationError,
  AuthenticationError,
  ResourceError,
  ExternalServiceError,
  SystemError,
  createErrorResponse,
  handleError,
  logError,
  getErrorSeverity,
  isRetryableError,
  getRetryDelay
} from '@/Utils/error-handling/errorHandler';

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn()
}));

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ErrorCode enum', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND');
      expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    });
  });

  describe('ErrorSeverity enum', () => {
    it('should have all expected severity levels', () => {
      expect(ErrorSeverity.LOW).toBe('low');
      expect(ErrorSeverity.MEDIUM).toBe('medium');
      expect(ErrorSeverity.HIGH).toBe('high');
      expect(ErrorSeverity.CRITICAL).toBe('critical');
    });
  });

  describe('AppError', () => {
    it('should create error with all properties', () => {
      const error = new AppError(
        'Test error message',
        400,
        ErrorCode.VALIDATION_ERROR,
        ErrorSeverity.MEDIUM,
        { field: 'email' }
      );

      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.details).toEqual({ field: 'email' });
      expect(error.timestamp).toBeDefined();
      expect(error.id).toBeDefined();
    });

    it('should generate unique error IDs', () => {
      const error1 = new AppError('Error 1', 400, ErrorCode.VALIDATION_ERROR);
      const error2 = new AppError('Error 2', 400, ErrorCode.VALIDATION_ERROR);

      expect(error1.id).not.toBe(error2.id);
    });

    it('should use default values for optional parameters', () => {
      const error = new AppError('Test error');

      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.details).toBeUndefined();
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with correct defaults', () => {
      const error = new ValidationError('Invalid input', { field: 'email' });

      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error with correct defaults', () => {
      const error = new AuthenticationError('Invalid token');

      expect(error.message).toBe('Invalid token');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });
  });

  describe('ResourceError', () => {
    it('should create resource error with correct defaults', () => {
      const error = new ResourceError('User not found', ErrorCode.NOT_FOUND);

      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create external service error with correct defaults', () => {
      const error = new ExternalServiceError('Database connection failed', ErrorCode.DATABASE_ERROR);

      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(502);
      expect(error.code).toBe(ErrorCode.DATABASE_ERROR);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
    });
  });

  describe('SystemError', () => {
    it('should create system error with correct defaults', () => {
      const error = new SystemError('Internal server error');

      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(error.severity).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response for AppError', () => {
      const error = new AppError('Test error', 400, ErrorCode.VALIDATION_ERROR);
      const response = createErrorResponse(error);

      expect(response.status).toBe(400);
      const responseData = response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Test error');
      expect(responseData.code).toBe(ErrorCode.VALIDATION_ERROR);
    });

    it('should create error response for standard Error', () => {
      const error = new Error('Standard error');
      const response = createErrorResponse(error);

      expect(response.status).toBe(500);
      const responseData = response.json();
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Standard error');
    });

    it('should include details in response when available', () => {
      const error = new AppError('Test error', 400, ErrorCode.VALIDATION_ERROR, ErrorSeverity.MEDIUM, { field: 'email' });
      const response = createErrorResponse(error);

      const responseData = response.json();
      expect(responseData.details).toEqual({ field: 'email' });
    });
  });

  describe('handleError', () => {
    it('should handle AppError correctly', () => {
      const error = new AppError('Test error', 400, ErrorCode.VALIDATION_ERROR);
      const response = handleError(error);

      expect(response.status).toBe(400);
      expect(require('@sentry/nextjs').captureException).toHaveBeenCalledWith(error);
    });

    it('should handle standard Error correctly', () => {
      const error = new Error('Standard error');
      const response = handleError(error);

      expect(response.status).toBe(500);
      expect(require('@sentry/nextjs').captureException).toHaveBeenCalledWith(error);
    });

    it('should handle unknown error types', () => {
      const error = 'String error';
      const response = handleError(error as any);

      expect(response.status).toBe(500);
      expect(require('@sentry/nextjs').captureException).toHaveBeenCalledWith(error);
    });
  });

  describe('logError', () => {
    it('should log error with Sentry', () => {
      const error = new AppError('Test error', 400, ErrorCode.VALIDATION_ERROR);
      logError(error, { userId: 'user123' });

      expect(require('@sentry/nextjs').captureException).toHaveBeenCalledWith(error);
      expect(require('@sentry/nextjs').setContext).toHaveBeenCalledWith('error', { userId: 'user123' });
    });

    it('should add breadcrumb for error', () => {
      const error = new AppError('Test error', 400, ErrorCode.VALIDATION_ERROR);
      logError(error);

      expect(require('@sentry/nextjs').addBreadcrumb).toHaveBeenCalledWith({
        message: 'Error occurred',
        level: 'error',
        data: {
          errorId: error.id,
          errorCode: error.code,
          severity: error.severity
        }
      });
    });
  });

  describe('getErrorSeverity', () => {
    it('should return correct severity for different error codes', () => {
      expect(getErrorSeverity(ErrorCode.VALIDATION_ERROR)).toBe(ErrorSeverity.MEDIUM);
      expect(getErrorSeverity(ErrorCode.UNAUTHORIZED)).toBe(ErrorSeverity.HIGH);
      expect(getErrorSeverity(ErrorCode.DATABASE_ERROR)).toBe(ErrorSeverity.HIGH);
      expect(getErrorSeverity(ErrorCode.INTERNAL_ERROR)).toBe(ErrorSeverity.CRITICAL);
    });

    it('should return MEDIUM for unknown error codes', () => {
      expect(getErrorSeverity('UNKNOWN_ERROR' as ErrorCode)).toBe(ErrorSeverity.MEDIUM);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable error codes', () => {
      expect(isRetryableError(ErrorCode.TIMEOUT_ERROR)).toBe(true);
      expect(isRetryableError(ErrorCode.NETWORK_ERROR)).toBe(true);
      expect(isRetryableError(ErrorCode.EXTERNAL_SERVICE_ERROR)).toBe(true);
    });

    it('should return false for non-retryable error codes', () => {
      expect(isRetryableError(ErrorCode.VALIDATION_ERROR)).toBe(false);
      expect(isRetryableError(ErrorCode.UNAUTHORIZED)).toBe(false);
      expect(isRetryableError(ErrorCode.NOT_FOUND)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return exponential backoff delay', () => {
      expect(getRetryDelay(1)).toBe(1000);
      expect(getRetryDelay(2)).toBe(2000);
      expect(getRetryDelay(3)).toBe(4000);
      expect(getRetryDelay(4)).toBe(8000);
    });

    it('should cap delay at maximum value', () => {
      expect(getRetryDelay(10)).toBe(30000); // Max delay
      expect(getRetryDelay(20)).toBe(30000); // Max delay
    });

    it('should handle zero attempt number', () => {
      expect(getRetryDelay(0)).toBe(1000);
    });
  });

  describe('error serialization', () => {
    it('should serialize error to JSON correctly', () => {
      const error = new AppError('Test error', 400, ErrorCode.VALIDATION_ERROR, ErrorSeverity.MEDIUM, { field: 'email' });
      const serialized = JSON.stringify(error);

      const parsed = JSON.parse(serialized);
      expect(parsed.message).toBe('Test error');
      expect(parsed.statusCode).toBe(400);
      expect(parsed.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(parsed.severity).toBe(ErrorSeverity.MEDIUM);
      expect(parsed.details).toEqual({ field: 'email' });
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.id).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle null error', () => {
      const response = handleError(null as any);
      expect(response.status).toBe(500);
    });

    it('should handle undefined error', () => {
      const response = handleError(undefined as any);
      expect(response.status).toBe(500);
    });

    it('should handle error with circular references', () => {
      const error = new Error('Circular error');
      (error as any).circular = error;
      
      const response = handleError(error);
      expect(response.status).toBe(500);
    });
  });
});