/**
 * Tests for Memory Management and Cleanup Utilities
 */

import { MemoryManager, type MemoryConfig, type MemoryStats } from '@/Utils/performance/memoryManager';

// Mock process.memoryUsage
const mockMemoryUsage = jest.fn();

describe('MemoryManager', () => {
  let memoryManager: MemoryManager;
  let originalMemoryUsage: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock process.memoryUsage
    originalMemoryUsage = process.memoryUsage;
    process.memoryUsage = mockMemoryUsage;
    
    // Default mock memory usage (100MB used, 1GB total)
    mockMemoryUsage.mockReturnValue({
      rss: 100 * 1024 * 1024, // 100MB
      heapTotal: 1024 * 1024 * 1024, // 1GB
      heapUsed: 100 * 1024 * 1024, // 100MB
      external: 0,
      arrayBuffers: 0
    });
  });

  afterEach(() => {
    // Restore original process.memoryUsage
    process.memoryUsage = originalMemoryUsage;
    
    // Clean up any running intervals
    if (memoryManager) {
      memoryManager.stopMonitoring();
    }
  });

  describe('constructor', () => {
    it('should initialize with default config', () => {
      memoryManager = new MemoryManager();

      expect(memoryManager).toBeDefined();
      expect(memoryManager.getConfig().maxMemoryUsage).toBe(512);
      expect(memoryManager.getConfig().gcThreshold).toBe(0.8);
      expect(memoryManager.getConfig().cleanupInterval).toBe(30000);
      expect(memoryManager.getConfig().enableMonitoring).toBe(false); // Disabled in test
    });

    it('should initialize with custom config', () => {
      const customConfig: Partial<MemoryConfig> = {
        maxMemoryUsage: 1024,
        gcThreshold: 0.9,
        cleanupInterval: 60000,
        enableMonitoring: false
      };

      memoryManager = new MemoryManager(customConfig);

      expect(memoryManager.getConfig().maxMemoryUsage).toBe(1024);
      expect(memoryManager.getConfig().gcThreshold).toBe(0.9);
      expect(memoryManager.getConfig().cleanupInterval).toBe(60000);
      expect(memoryManager.getConfig().enableMonitoring).toBe(false);
    });

    it('should disable monitoring in test environment', () => {
      memoryManager = new MemoryManager({ enableMonitoring: true });

      expect(memoryManager.getConfig().enableMonitoring).toBe(false);
    });
  });

  describe('getMemoryStats', () => {
    it('should return current memory statistics', () => {
      memoryManager = new MemoryManager();

      const stats = memoryManager.getMemoryStats();

      expect(stats.used).toBe(100); // 100MB
      expect(stats.total).toBe(1024); // 1GB
      expect(stats.free).toBe(924); // 1GB - 100MB
      expect(stats.percentage).toBeCloseTo(9.77, 1); // 100/1024 * 100
      expect(stats.timestamp).toBeDefined();
    });

    it('should handle zero total memory', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0
      });

      memoryManager = new MemoryManager();

      const stats = memoryManager.getMemoryStats();

      expect(stats.used).toBe(0);
      expect(stats.total).toBe(0);
      expect(stats.free).toBe(0);
      expect(stats.percentage).toBe(0);
    });

    it('should handle very large memory usage', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 2048 * 1024 * 1024, // 2GB
        heapTotal: 4096 * 1024 * 1024, // 4GB
        heapUsed: 2048 * 1024 * 1024, // 2GB
        external: 0,
        arrayBuffers: 0
      });

      memoryManager = new MemoryManager();

      const stats = memoryManager.getMemoryStats();

      expect(stats.used).toBe(2048);
      expect(stats.total).toBe(4096);
      expect(stats.free).toBe(2048);
      expect(stats.percentage).toBe(50);
    });
  });

  describe('isMemoryUsageHigh', () => {
    it('should return true when memory usage exceeds threshold', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 900 * 1024 * 1024, // 900MB
        heapTotal: 1024 * 1024 * 1024, // 1GB
        heapUsed: 900 * 1024 * 1024, // 900MB
        external: 0,
        arrayBuffers: 0
      });

      memoryManager = new MemoryManager({ gcThreshold: 0.8 });

      expect(memoryManager.isMemoryUsageHigh()).toBe(true);
    });

    it('should return false when memory usage is below threshold', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 100 * 1024 * 1024, // 100MB
        heapTotal: 1024 * 1024 * 1024, // 1GB
        heapUsed: 100 * 1024 * 1024, // 100MB
        external: 0,
        arrayBuffers: 0
      });

      memoryManager = new MemoryManager({ gcThreshold: 0.8 });

      expect(memoryManager.isMemoryUsageHigh()).toBe(false);
    });

    it('should use custom threshold', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 600 * 1024 * 1024, // 600MB
        heapTotal: 1024 * 1024 * 1024, // 1GB
        heapUsed: 600 * 1024 * 1024, // 600MB
        external: 0,
        arrayBuffers: 0
      });

      memoryManager = new MemoryManager({ gcThreshold: 0.5 });

      expect(memoryManager.isMemoryUsageHigh()).toBe(true);
    });
  });

  describe('forceGarbageCollection', () => {
    it('should trigger garbage collection', () => {
      memoryManager = new MemoryManager();

      const result = memoryManager.forceGarbageCollection();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Garbage collection triggered');
    });

    it('should update last GC time', () => {
      memoryManager = new MemoryManager();

      const beforeGc = memoryManager.getLastGcTime();
      
      // Wait a bit to ensure time difference
      jest.advanceTimersByTime(100);
      
      memoryManager.forceGarbageCollection();
      
      const afterGc = memoryManager.getLastGcTime();
      
      expect(afterGc).toBeGreaterThan(beforeGc);
    });
  });

  describe('addCleanupCallback', () => {
    it('should add cleanup callback', () => {
      memoryManager = new MemoryManager();
      const callback = jest.fn();

      memoryManager.addCleanupCallback(callback);

      expect(memoryManager.getCleanupCallbacks().size).toBe(1);
    });

    it('should add multiple cleanup callbacks', () => {
      memoryManager = new MemoryManager();
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      memoryManager.addCleanupCallback(callback1);
      memoryManager.addCleanupCallback(callback2);

      expect(memoryManager.getCleanupCallbacks().size).toBe(2);
    });
  });

  describe('removeCleanupCallback', () => {
    it('should remove cleanup callback', () => {
      memoryManager = new MemoryManager();
      const callback = jest.fn();

      memoryManager.addCleanupCallback(callback);
      expect(memoryManager.getCleanupCallbacks().size).toBe(1);

      memoryManager.removeCleanupCallback(callback);
      expect(memoryManager.getCleanupCallbacks().size).toBe(0);
    });

    it('should handle removing non-existent callback', () => {
      memoryManager = new MemoryManager();
      const callback = jest.fn();

      memoryManager.removeCleanupCallback(callback);

      expect(memoryManager.getCleanupCallbacks().size).toBe(0);
    });
  });

  describe('runCleanup', () => {
    it('should run all cleanup callbacks', () => {
      memoryManager = new MemoryManager();
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      memoryManager.addCleanupCallback(callback1);
      memoryManager.addCleanupCallback(callback2);

      memoryManager.runCleanup();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    it('should handle callback errors gracefully', () => {
      memoryManager = new MemoryManager();
      const callback1 = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });
      const callback2 = jest.fn();

      memoryManager.addCleanupCallback(callback1);
      memoryManager.addCleanupCallback(callback2);

      // Should not throw
      expect(() => memoryManager.runCleanup()).not.toThrow();

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('startMonitoring', () => {
    it('should start monitoring when enabled', () => {
      // Mock setInterval
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      memoryManager = new MemoryManager({ enableMonitoring: true });

      expect(setIntervalSpy).toHaveBeenCalled();
      
      setIntervalSpy.mockRestore();
    });

    it('should not start monitoring when disabled', () => {
      const setIntervalSpy = jest.spyOn(global, 'setInterval');
      
      memoryManager = new MemoryManager({ enableMonitoring: false });

      expect(setIntervalSpy).not.toHaveBeenCalled();
      
      setIntervalSpy.mockRestore();
    });
  });

  describe('stopMonitoring', () => {
    it('should stop monitoring', () => {
      memoryManager = new MemoryManager({ enableMonitoring: false });
      
      // Manually start monitoring
      memoryManager.startMonitoring();
      
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      memoryManager.stopMonitoring();

      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config: Partial<MemoryConfig> = {
        maxMemoryUsage: 1024,
        gcThreshold: 0.9,
        cleanupInterval: 60000
      };

      memoryManager = new MemoryManager(config);

      const returnedConfig = memoryManager.getConfig();

      expect(returnedConfig.maxMemoryUsage).toBe(1024);
      expect(returnedConfig.gcThreshold).toBe(0.9);
      expect(returnedConfig.cleanupInterval).toBe(60000);
    });
  });

  describe('getLastGcTime', () => {
    it('should return last GC time', () => {
      memoryManager = new MemoryManager();

      const lastGcTime = memoryManager.getLastGcTime();

      expect(lastGcTime).toBe(0); // Initial value
    });

    it('should return updated GC time after force GC', () => {
      memoryManager = new MemoryManager();

      memoryManager.forceGarbageCollection();
      const lastGcTime = memoryManager.getLastGcTime();

      expect(lastGcTime).toBeGreaterThan(0);
    });
  });

  describe('getCleanupCallbacks', () => {
    it('should return cleanup callbacks set', () => {
      memoryManager = new MemoryManager();
      const callback = jest.fn();

      memoryManager.addCleanupCallback(callback);

      const callbacks = memoryManager.getCleanupCallbacks();

      expect(callbacks).toBeInstanceOf(Set);
      expect(callbacks.size).toBe(1);
      expect(callbacks.has(callback)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle process.memoryUsage throwing error', () => {
      mockMemoryUsage.mockImplementation(() => {
        throw new Error('Memory usage error');
      });

      memoryManager = new MemoryManager();

      expect(() => memoryManager.getMemoryStats()).toThrow('Memory usage error');
    });

    it('should handle negative memory values', () => {
      mockMemoryUsage.mockReturnValue({
        rss: -100,
        heapTotal: 1024 * 1024 * 1024,
        heapUsed: -100,
        external: 0,
        arrayBuffers: 0
      });

      memoryManager = new MemoryManager();

      const stats = memoryManager.getMemoryStats();

      expect(stats.used).toBe(0); // Should be clamped to 0
      expect(stats.total).toBe(1024);
      expect(stats.free).toBe(1024);
    });

    it('should handle very small memory values', () => {
      mockMemoryUsage.mockReturnValue({
        rss: 1,
        heapTotal: 2,
        heapUsed: 1,
        external: 0,
        arrayBuffers: 0
      });

      memoryManager = new MemoryManager();

      const stats = memoryManager.getMemoryStats();

      expect(stats.used).toBe(0); // Should be rounded to 0
      expect(stats.total).toBe(0);
      expect(stats.free).toBe(0);
    });
  });
});
});