/**
 * Tests for AI Cost Management System
 */

import { AICostManager } from '@/Utils/ai-cost-manager';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}));

describe('AICostManager', () => {
  let costManager: AICostManager;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    require('@supabase/supabase-js').createClient.mockReturnValue(mockSupabaseClient);
    
    // Set default environment variables
    process.env.AI_MAX_DAILY_COST = '15';
    process.env.AI_MAX_CALLS_PER_USER = '5';
    process.env.AI_MAX_CALLS_PER_DAY = '200';
    process.env.AI_EMERGENCY_STOP = '20';
    
    costManager = new AICostManager();
  });

  describe('constructor', () => {
    it('should initialize with default limits', () => {
      expect(costManager).toBeDefined();
    });

    it('should use environment variables for limits', () => {
      process.env.AI_MAX_DAILY_COST = '25';
      process.env.AI_MAX_CALLS_PER_USER = '10';
      process.env.AI_MAX_CALLS_PER_DAY = '500';
      process.env.AI_EMERGENCY_STOP = '30';

      const customCostManager = new AICostManager();
      expect(customCostManager).toBeDefined();
    });

    it('should handle missing environment variables', () => {
      delete process.env.AI_MAX_DAILY_COST;
      delete process.env.AI_MAX_CALLS_PER_USER;
      delete process.env.AI_MAX_CALLS_PER_DAY;
      delete process.env.AI_EMERGENCY_STOP;

      const defaultCostManager = new AICostManager();
      expect(defaultCostManager).toBeDefined();
    });
  });

  describe('canMakeAICall', () => {
    it('should allow AI call when under limits', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { daily_cost: 5, daily_calls: 10 }, 
        error: null 
      });

      const result = await costManager.canMakeAICall('user123', 'gpt-4o-mini');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('Within limits');
    });

    it('should block AI call when daily cost limit exceeded', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { daily_cost: 20, daily_calls: 10 }, 
        error: null 
      });

      const result = await costManager.canMakeAICall('user123', 'gpt-4o-mini');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Daily cost limit');
    });

    it('should block AI call when daily calls limit exceeded', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { daily_cost: 5, daily_calls: 250 }, 
        error: null 
      });

      const result = await costManager.canMakeAICall('user123', 'gpt-4o-mini');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Daily calls limit');
    });

    it('should block AI call when user calls limit exceeded', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { daily_cost: 5, daily_calls: 10, user_calls: { user123: 10 } }, 
        error: null 
      });

      const result = await costManager.canMakeAICall('user123', 'gpt-4o-mini');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('User calls limit');
    });

    it('should handle emergency stop threshold', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { daily_cost: 25, daily_calls: 10 }, 
        error: null 
      });

      const result = await costManager.canMakeAICall('user123', 'gpt-4o-mini');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Emergency stop');
    });

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const result = await costManager.canMakeAICall('user123', 'gpt-4o-mini');

      expect(result.allowed).toBe(true); // Should allow when database fails
      expect(result.reason).toContain('Database error');
    });

    it('should handle missing cost data', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: null, 
        error: null 
      });

      const result = await costManager.canMakeAICall('user123', 'gpt-4o-mini');

      expect(result.allowed).toBe(true);
      expect(result.reason).toBe('No previous data');
    });
  });

  describe('recordAICall', () => {
    it('should record AI call successfully', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ error: null });

      const result = await costManager.recordAICall('user123', 'gpt-4o-mini', 0.05);

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });

    it('should handle recording errors', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ 
        error: { message: 'Insert failed' } 
      });

      const result = await costManager.recordAICall('user123', 'gpt-4o-mini', 0.05);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Insert failed');
    });

    it('should record different AI models', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ error: null });

      await costManager.recordAICall('user123', 'gpt-4o-mini', 0.05);
      await costManager.recordAICall('user123', 'gpt-4o', 0.15);

      expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(2);
    });

    it('should record different costs', async () => {
      mockSupabaseClient.insert.mockResolvedValue({ error: null });

      await costManager.recordAICall('user123', 'gpt-4o-mini', 0.01);
      await costManager.recordAICall('user123', 'gpt-4o-mini', 0.10);

      expect(mockSupabaseClient.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCostMetrics', () => {
    it('should return current cost metrics', async () => {
      const mockMetrics = {
        daily_cost: 10.50,
        daily_calls: 25,
        user_calls: { user123: 5, user456: 3 },
        last_reset: '2024-01-01'
      };

      mockSupabaseClient.single.mockResolvedValue({ data: mockMetrics, error: null });

      const metrics = await costManager.getCostMetrics();

      expect(metrics.dailyCost).toBe(10.50);
      expect(metrics.dailyCalls).toBe(25);
      expect(metrics.userCalls).toEqual({ user123: 5, user456: 3 });
      expect(metrics.lastReset).toBe('2024-01-01');
    });

    it('should handle missing metrics data', async () => {
      mockSupabaseClient.single.mockResolvedValue({ data: null, error: null });

      const metrics = await costManager.getCostMetrics();

      expect(metrics.dailyCost).toBe(0);
      expect(metrics.dailyCalls).toBe(0);
      expect(metrics.userCalls).toEqual({});
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const metrics = await costManager.getCostMetrics();

      expect(metrics.dailyCost).toBe(0);
      expect(metrics.dailyCalls).toBe(0);
      expect(metrics.userCalls).toEqual({});
    });
  });

  describe('resetDailyMetrics', () => {
    it('should reset daily metrics', async () => {
      mockSupabaseClient.update.mockResolvedValue({ error: null });

      const result = await costManager.resetDailyMetrics();

      expect(result.success).toBe(true);
      expect(mockSupabaseClient.update).toHaveBeenCalled();
    });

    it('should handle reset errors', async () => {
      mockSupabaseClient.update.mockResolvedValue({ 
        error: { message: 'Update failed' } 
      });

      const result = await costManager.resetDailyMetrics();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Update failed');
    });
  });

  describe('getModelCost', () => {
    it('should return correct cost for gpt-4o-mini', () => {
      const cost = costManager.getModelCost('gpt-4o-mini');
      expect(cost).toBeGreaterThan(0);
    });

    it('should return correct cost for gpt-4o', () => {
      const cost = costManager.getModelCost('gpt-4o');
      expect(cost).toBeGreaterThan(0);
    });

    it('should return higher cost for gpt-4o than gpt-4o-mini', () => {
      const miniCost = costManager.getModelCost('gpt-4o-mini');
      const fullCost = costManager.getModelCost('gpt-4o');
      
      expect(fullCost).toBeGreaterThan(miniCost);
    });

    it('should return default cost for unknown model', () => {
      const cost = costManager.getModelCost('unknown-model');
      expect(cost).toBeGreaterThan(0);
    });
  });

  describe('isEmergencyStop', () => {
    it('should return true when cost exceeds emergency threshold', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { daily_cost: 25 }, 
        error: null 
      });

      const result = await costManager.isEmergencyStop();

      expect(result).toBe(true);
    });

    it('should return false when cost is below emergency threshold', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { daily_cost: 10 }, 
        error: null 
      });

      const result = await costManager.isEmergencyStop();

      expect(result).toBe(false);
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      const result = await costManager.isEmergencyStop();

      expect(result).toBe(false); // Should not trigger emergency stop on error
    });
  });

  describe('edge cases', () => {
    it('should handle missing environment variables', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => new AICostManager()).toThrow();
    });

    it('should handle invalid cost values', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { daily_cost: -5, daily_calls: 10 }, 
        error: null 
      });

      const result = await costManager.canMakeAICall('user123', 'gpt-4o-mini');

      expect(result.allowed).toBe(true); // Should handle negative costs gracefully
    });

    it('should handle very large cost values', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { daily_cost: 999999, daily_calls: 10 }, 
        error: null 
      });

      const result = await costManager.canMakeAICall('user123', 'gpt-4o-mini');

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Emergency stop');
    });

    it('should handle concurrent calls', async () => {
      mockSupabaseClient.single.mockResolvedValue({ 
        data: { daily_cost: 5, daily_calls: 10 }, 
        error: null 
      });

      const promises = [
        costManager.canMakeAICall('user123', 'gpt-4o-mini'),
        costManager.canMakeAICall('user123', 'gpt-4o-mini'),
        costManager.canMakeAICall('user123', 'gpt-4o-mini')
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.allowed).toBe(true);
      });
    });
  });
});