/**
 * Tests for Structured Logging System
 */

import { Logger, type LogEntry } from '@/Utils/monitoring/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleDebugSpy: jest.SpyInstance;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env;
    
    // Mock console methods
    consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation(() => {});
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set default log level
    process.env.LOG_LEVEL = 'info';
    
    logger = new Logger('test-component');
  });

  afterEach(() => {
    consoleDebugSpy.mockRestore();
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize with component name', () => {
      const testLogger = new Logger('my-component');
      expect(testLogger).toBeDefined();
    });

    it('should use default log level when LOG_LEVEL not set', () => {
      delete process.env.LOG_LEVEL;
      const testLogger = new Logger('test');
      expect(testLogger).toBeDefined();
    });

    it('should use custom log level from environment', () => {
      process.env.LOG_LEVEL = 'debug';
      const testLogger = new Logger('test');
      expect(testLogger).toBeDefined();
    });
  });

  describe('debug', () => {
    it('should log debug message when level allows', () => {
      process.env.LOG_LEVEL = 'debug';
      const debugLogger = new Logger('test');
      
      debugLogger.debug('Debug message');
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG test: Debug message')
      );
    });

    it('should not log debug message when level is higher', () => {
      process.env.LOG_LEVEL = 'info';
      const infoLogger = new Logger('test');
      
      infoLogger.debug('Debug message');
      
      expect(consoleDebugSpy).not.toHaveBeenCalled();
    });

    it('should include metadata in debug log', () => {
      process.env.LOG_LEVEL = 'debug';
      const debugLogger = new Logger('test');
      
      debugLogger.debug('Debug message', { key: 'value' });
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('metadata={"key":"value"}')
      );
    });
  });

  describe('info', () => {
    it('should log info message', () => {
      logger.info('Info message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO test-component: Info message')
      );
    });

    it('should include user ID in info log', () => {
      logger.setUserId('user123');
      logger.info('Info message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('user=user123')
      );
    });

    it('should include request ID in info log', () => {
      logger.setRequestId('req456');
      logger.info('Info message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('req=req456')
      );
    });

    it('should include both user and request ID', () => {
      logger.setUserId('user123');
      logger.setRequestId('req456');
      logger.info('Info message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('user=user123 req=req456')
      );
    });
  });

  describe('warn', () => {
    it('should log warning message', () => {
      logger.warn('Warning message');
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('WARN test-component: Warning message')
      );
    });

    it('should include error details in warning', () => {
      const error = new Error('Test error');
      logger.warn('Warning message', { error });
      
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('metadata={"error":{}}')
      );
    });

    it('should not log warning when level is higher', () => {
      process.env.LOG_LEVEL = 'error';
      const errorLogger = new Logger('test');
      
      errorLogger.warn('Warning message');
      
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('error', () => {
    it('should log error message', () => {
      logger.error('Error message');
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('ERROR test-component: Error message')
      );
    });

    it('should include error object details', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      logger.error('Error message', error);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('error=Error: Test error')
      );
    });

    it('should handle error without stack trace', () => {
      const error = new Error('Custom error message');
      error.name = 'CustomError';
      
      logger.error('Error message', error);
      
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('error=CustomError: Custom error message')
      );
    });
  });

  describe('logLevel filtering', () => {
    it('should log all levels when set to debug', () => {
      process.env.LOG_LEVEL = 'debug';
      const debugLogger = new Logger('test');
      
      debugLogger.debug('Debug message');
      debugLogger.info('Info message');
      debugLogger.warn('Warning message');
      debugLogger.error('Error message');
      
      expect(consoleDebugSpy).toHaveBeenCalledTimes(1); // debug only
      expect(console.info).toHaveBeenCalledTimes(1); // info only
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('should log info, warn, error when set to info', () => {
      process.env.LOG_LEVEL = 'info';
      const infoLogger = new Logger('test');
      
      infoLogger.debug('Debug message');
      infoLogger.info('Info message');
      infoLogger.warn('Warning message');
      infoLogger.error('Error message');
      
      expect(console.info).toHaveBeenCalledTimes(1); // info only
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('should log warn, error when set to warn', () => {
      process.env.LOG_LEVEL = 'warn';
      const warnLogger = new Logger('test');
      
      warnLogger.debug('Debug message');
      warnLogger.info('Info message');
      warnLogger.warn('Warning message');
      warnLogger.error('Error message');
      
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });

    it('should log only error when set to error', () => {
      process.env.LOG_LEVEL = 'error';
      const errorLogger = new Logger('test');
      
      errorLogger.debug('Debug message');
      errorLogger.info('Info message');
      errorLogger.warn('Warning message');
      errorLogger.error('Error message');
      
      expect(consoleDebugSpy).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('metadata handling', () => {
    it('should handle simple metadata object', () => {
      logger.info('Message', { key: 'value', number: 123 });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('metadata={"key":"value","number":123}')
      );
    });

    it('should handle nested metadata object', () => {
      logger.info('Message', { 
        user: { id: '123', name: 'John' },
        settings: { theme: 'dark' }
      });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('metadata={"user":{"id":"123","name":"John"},"settings":{"theme":"dark"}}')
      );
    });

    it('should handle array metadata', () => {
      logger.info('Message', { items: [1, 2, 3], tags: ['a', 'b'] });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('metadata={"items":[1,2,3],"tags":["a","b"]}')
      );
    });

    it('should handle null and undefined metadata', () => {
      logger.info('Message', { nullValue: null, undefinedValue: undefined });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('metadata={"nullValue":null}')
      );
    });
  });

  describe('timestamp formatting', () => {
    it('should include timestamp in log entries', () => {
      const beforeTime = new Date().toISOString();
      logger.info('Message');
      const afterTime = new Date().toISOString();
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
      );
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      logger.info('');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO test-component: ')
      );
    });

    it('should handle very long message', () => {
      const longMessage = 'x'.repeat(1000);
      logger.info(longMessage);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining(longMessage)
      );
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Message with special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
      logger.info(specialMessage);
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining(specialMessage)
      );
    });

    it('should handle circular reference in metadata', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      logger.info('Message', { circular });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('metadata=[Circular Reference]')
      );
    });

    it('should handle function in metadata', () => {
      logger.info('Message', { func: () => 'test' });
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('metadata={}')
      );
    });
  });

  describe('component name handling', () => {
    it('should handle empty component name', () => {
      const emptyLogger = new Logger('');
      emptyLogger.info('Message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO : Message')
      );
    });

    it('should handle component name with special characters', () => {
      const specialLogger = new Logger('test-component_123');
      specialLogger.info('Message');
      
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('INFO test-component_123: Message')
      );
    });
  });
});
