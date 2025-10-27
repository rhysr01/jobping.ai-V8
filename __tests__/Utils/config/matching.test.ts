/**
 * Tests for Matching Configuration
 */

import {
  isTestOrPerfMode,
  MATCHING_CONFIG,
  getScoringWeights,
  getCacheConfig,
  getAIConfig,
  getFallbackConfig,
  getThresholds
} from '@/Utils/config/matching';

describe('Matching Configuration', () => {
  describe('isTestOrPerfMode', () => {
    it('should return true in test environment', () => {
      process.env.NODE_ENV = 'test';
      expect(isTestOrPerfMode()).toBe(true);
    });

    it('should return true when JOBPING_TEST_MODE is set', () => {
      process.env.NODE_ENV = 'production';
      process.env.JOBPING_TEST_MODE = '1';
      expect(isTestOrPerfMode()).toBe(true);
    });

    it('should return false in production without test mode', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.JOBPING_TEST_MODE;
      expect(isTestOrPerfMode()).toBe(false);
    });

    it('should return false in development', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.JOBPING_TEST_MODE;
      expect(isTestOrPerfMode()).toBe(false);
    });
  });

  describe('MATCHING_CONFIG', () => {
    it('should have valid AI configuration', () => {
      expect(MATCHING_CONFIG.ai.model).toBe('gpt-4o-mini');
      expect(MATCHING_CONFIG.ai.maxTokens).toBe(2000);
      expect(MATCHING_CONFIG.ai.temperature).toBe(0.3);
      expect(MATCHING_CONFIG.ai.timeout).toBe(30000);
      expect(MATCHING_CONFIG.ai.clusterSize).toBe(3);
    });

    it('should have valid cache configuration', () => {
      expect(MATCHING_CONFIG.cache.ttl).toBe(30 * 60 * 1000);
      expect(MATCHING_CONFIG.cache.maxSize).toBe(5000);
      expect(MATCHING_CONFIG.cache.cleanupInterval).toBe(5 * 60 * 1000);
      expect(MATCHING_CONFIG.cache.warmEntries).toBe(2500);
    });

    it('should have valid scoring weights that sum to 100', () => {
      const weights = MATCHING_CONFIG.scoring.weights;
      const sum = weights.eligibility + weights.careerPath + weights.location;
      expect(sum).toBe(100);
    });

    it('should have valid score thresholds', () => {
      const thresholds = MATCHING_CONFIG.scoring.thresholds;
      expect(thresholds.excellent).toBe(0.8);
      expect(thresholds.good).toBe(0.7);
      expect(thresholds.confident).toBe(0.7);
      expect(thresholds.fair).toBe(0.5);
      expect(thresholds.minimum).toBe(0.5);
      expect(thresholds.poor).toBe(0.0);
    });

    it('should have valid confidence configuration', () => {
      const confidence = MATCHING_CONFIG.scoring.confidence;
      expect(confidence.uncertain_penalty).toBe(0.1);
      expect(confidence.unknown_penalty).toBe(0.15);
      expect(confidence.floor).toBe(0.3);
    });

    it('should have valid fallback configuration', () => {
      const fallback = MATCHING_CONFIG.fallback;
      expect(fallback.maxMatches).toBe(5);
      expect(fallback.maxEmergencyMatches).toBe(3);
      expect(fallback.lowConfidenceThreshold).toBe(0.6);
      expect(fallback.enableEmergencyFallback).toBe(true);
    });

    it('should have valid performance configuration', () => {
      const performance = MATCHING_CONFIG.performance;
      expect(performance.batchSize).toBe(50);
      expect(performance.maxConcurrent).toBe(10);
      expect(performance.timeoutMs).toBe(60000);
      expect(performance.retryAttempts).toBe(3);
    });
  });

  describe('getScoringWeights', () => {
    it('should return scoring weights', () => {
      const weights = getScoringWeights();
      expect(weights.eligibility).toBe(40);
      expect(weights.careerPath).toBe(35);
      expect(weights.location).toBe(25);
    });
  });

  describe('getCacheConfig', () => {
    it('should return cache configuration', () => {
      const config = getCacheConfig();
      expect(config.ttl).toBe(30 * 60 * 1000);
      expect(config.maxSize).toBe(5000);
      expect(config.cleanupInterval).toBe(5 * 60 * 1000);
      expect(config.warmEntries).toBe(2500);
    });
  });

  describe('getAIConfig', () => {
    it('should return AI configuration', () => {
      const config = getAIConfig();
      expect(config.model).toBe('gpt-4o-mini');
      expect(config.maxTokens).toBe(2000);
      expect(config.temperature).toBe(0.3);
      expect(config.timeout).toBe(30000);
      expect(config.clusterSize).toBe(3);
    });
  });

  describe('getFallbackConfig', () => {
    it('should return fallback configuration', () => {
      const config = getFallbackConfig();
      expect(config.maxMatches).toBe(5);
      expect(config.maxEmergencyMatches).toBe(3);
      expect(config.lowConfidenceThreshold).toBe(0.6);
      expect(config.enableEmergencyFallback).toBe(true);
    });
  });

  describe('getThresholds', () => {
    it('should return score thresholds', () => {
      const thresholds = getThresholds();
      expect(thresholds.excellent).toBe(0.8);
      expect(thresholds.good).toBe(0.7);
      expect(thresholds.confident).toBe(0.7);
      expect(thresholds.fair).toBe(0.5);
      expect(thresholds.minimum).toBe(0.5);
      expect(thresholds.poor).toBe(0.0);
    });
  });

  describe('configuration validation', () => {
    it('should have consistent threshold ordering', () => {
      const thresholds = MATCHING_CONFIG.scoring.thresholds;
      expect(thresholds.excellent).toBeGreaterThan(thresholds.good);
      expect(thresholds.good).toBeGreaterThanOrEqual(thresholds.confident);
      expect(thresholds.confident).toBeGreaterThan(thresholds.fair);
      expect(thresholds.fair).toBeGreaterThanOrEqual(thresholds.minimum);
      expect(thresholds.minimum).toBeGreaterThan(thresholds.poor);
    });

    it('should have reasonable AI configuration values', () => {
      const ai = MATCHING_CONFIG.ai;
      expect(ai.maxTokens).toBeGreaterThan(0);
      expect(ai.temperature).toBeGreaterThanOrEqual(0);
      expect(ai.temperature).toBeLessThanOrEqual(1);
      expect(ai.timeout).toBeGreaterThan(0);
      expect(ai.clusterSize).toBeGreaterThan(0);
    });

    it('should have reasonable cache configuration values', () => {
      const cache = MATCHING_CONFIG.cache;
      expect(cache.ttl).toBeGreaterThan(0);
      expect(cache.maxSize).toBeGreaterThan(0);
      expect(cache.cleanupInterval).toBeGreaterThan(0);
      expect(cache.warmEntries).toBeGreaterThan(0);
      expect(cache.warmEntries).toBeLessThanOrEqual(cache.maxSize);
    });

    it('should have reasonable performance configuration values', () => {
      const performance = MATCHING_CONFIG.performance;
      expect(performance.batchSize).toBeGreaterThan(0);
      expect(performance.maxConcurrent).toBeGreaterThan(0);
      expect(performance.timeoutMs).toBeGreaterThan(0);
      expect(performance.retryAttempts).toBeGreaterThanOrEqual(0);
    });
  });
});
