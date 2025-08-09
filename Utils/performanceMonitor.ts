// ================================
// PERFORMANCE MONITORING SYSTEM
// ================================

/**
 * Simple performance monitoring that integrates with your existing system
 */
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  private static maxMeasurements = 100;

  /**
   * Track duration of an operation
   */
  static trackDuration(operation: string, startTime: number): void {
    const duration = Date.now() - startTime;
    
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    this.metrics.get(operation)!.push(duration);
    
    // Keep only last N measurements
    const measurements = this.metrics.get(operation)!;
    if (measurements.length > this.maxMeasurements) {
      measurements.splice(0, measurements.length - this.maxMeasurements);
    }
  }

  /**
   * Get average time for an operation
   */
  static getAverageTime(operation: string): number {
    const measurements = this.metrics.get(operation) || [];
    if (measurements.length === 0) return 0;
    
    return measurements.reduce((a, b) => a + b, 0) / measurements.length;
  }

  /**
   * Get all measurements for an operation
   */
  static getMeasurements(operation: string): number[] {
    return this.metrics.get(operation) || [];
  }

  /**
   * Get performance statistics for an operation
   */
  static getStats(operation: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    median: number;
    p95: number;
  } {
    const measurements = this.getMeasurements(operation);
    if (measurements.length === 0) {
      return { count: 0, average: 0, min: 0, max: 0, median: 0, p95: 0 };
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const count = measurements.length;
    const average = measurements.reduce((a, b) => a + b, 0) / count;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95 = sorted[p95Index] || sorted[sorted.length - 1];

    return { count, average, min, max, median, p95 };
  }

  /**
   * Log performance report for all operations
   */
  static logPerformanceReport(): void {
    console.log('\n📊 Performance Report:');
    console.log('='.repeat(50));
    
    for (const [operation, measurements] of this.metrics) {
      const stats = this.getStats(operation);
      console.log(`  ${operation}:`);
      console.log(`    Count: ${stats.count} samples`);
      console.log(`    Average: ${stats.average.toFixed(2)}ms`);
      console.log(`    Min: ${stats.min}ms, Max: ${stats.max}ms`);
      console.log(`    Median: ${stats.median}ms, P95: ${stats.p95}ms`);
      console.log('');
    }
  }

  /**
   * Get performance report as JSON
   */
  static getPerformanceReport(): Record<string, any> {
    const report: Record<string, any> = {};
    
    for (const [operation] of this.metrics) {
      report[operation] = this.getStats(operation);
    }
    
    return report;
  }

  /**
   * Clear all metrics
   */
  static clearMetrics(): void {
    this.metrics.clear();
    console.log('🧹 Performance metrics cleared');
  }

  /**
   * Clear metrics for a specific operation
   */
  static clearOperation(operation: string): void {
    this.metrics.delete(operation);
    console.log(`🧹 Cleared metrics for ${operation}`);
  }

  /**
   * Set maximum number of measurements to keep
   */
  static setMaxMeasurements(max: number): void {
    this.maxMeasurements = max;
    console.log(`📊 Set max measurements to ${max}`);
  }

  /**
   * Get current metrics summary
   */
  static getSummary(): {
    totalOperations: number;
    totalMeasurements: number;
    operations: string[];
  } {
    const operations = Array.from(this.metrics.keys());
    const totalMeasurements = Array.from(this.metrics.values())
      .reduce((sum, measurements) => sum + measurements.length, 0);

    return {
      totalOperations: operations.length,
      totalMeasurements,
      operations
    };
  }
}

/**
 * Performance tracking decorator for functions
 */
export function trackPerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      try {
        const result = await method.apply(this, args);
        PerformanceMonitor.trackDuration(operation, startTime);
        return result;
      } catch (error) {
        PerformanceMonitor.trackDuration(operation, startTime);
        throw error;
      }
    };
  };
}

/**
 * Performance tracking for async functions
 */
export function trackAsyncPerformance(operation: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      try {
        const result = await method.apply(this, args);
        PerformanceMonitor.trackDuration(operation, startTime);
        return result;
      } catch (error) {
        PerformanceMonitor.trackDuration(operation, startTime);
        throw error;
      }
    };
  };
}
