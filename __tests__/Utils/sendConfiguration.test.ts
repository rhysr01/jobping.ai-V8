/**
 * Tests for Send Configuration System
 */

import {
  SEND_PLAN,
  MATCH_RULES,
  SendPlan,
  MatchRules,
  SendLedgerEntry,
  getSendPlan,
  canSendThisWeek,
  recordSend,
  getWeeklyStats,
  getNextSendDate,
  calculateJobsToSend,
  validateSendPlan,
  getTierFromUser,
  shouldSendEarlyAccess,
  getSignupBonusJobs
} from '@/Utils/sendConfiguration';

describe('Send Configuration System', () => {
  describe('SEND_PLAN', () => {
    it('should have valid free plan configuration', () => {
      expect(SEND_PLAN.free.days).toEqual(['Thu']);
      expect(SEND_PLAN.free.perSend).toBe(5);
      expect(SEND_PLAN.free.pullsPerWeek).toBe(1);
      expect(SEND_PLAN.free.signupBonus).toBe(10);
      expect(SEND_PLAN.free.earlyAccessHours).toBeUndefined();
    });

    it('should have valid premium plan configuration', () => {
      expect(SEND_PLAN.premium.days).toEqual(['Mon', 'Wed', 'Fri']);
      expect(SEND_PLAN.premium.perSend).toBe(5);
      expect(SEND_PLAN.premium.pullsPerWeek).toBe(3);
      expect(SEND_PLAN.premium.signupBonus).toBe(10);
      expect(SEND_PLAN.premium.earlyAccessHours).toBe(24);
    });

    it('should have consistent perSend values', () => {
      expect(SEND_PLAN.free.perSend).toBe(SEND_PLAN.premium.perSend);
    });

    it('should have consistent signupBonus values', () => {
      expect(SEND_PLAN.free.signupBonus).toBe(SEND_PLAN.premium.signupBonus);
    });
  });

  describe('MATCH_RULES', () => {
    it('should have valid match rules', () => {
      expect(MATCH_RULES.minScore).toBe(65);
      expect(MATCH_RULES.lookbackDays).toBe(30);
      expect(MATCH_RULES.maxPerCompanyPerSend).toBe(2);
    });

    it('should have reasonable score threshold', () => {
      expect(MATCH_RULES.minScore).toBeGreaterThanOrEqual(50);
      expect(MATCH_RULES.minScore).toBeLessThanOrEqual(100);
    });

    it('should have reasonable lookback period', () => {
      expect(MATCH_RULES.lookbackDays).toBeGreaterThanOrEqual(7);
      expect(MATCH_RULES.lookbackDays).toBeLessThanOrEqual(90);
    });

    it('should have reasonable company limit', () => {
      expect(MATCH_RULES.maxPerCompanyPerSend).toBeGreaterThan(0);
      expect(MATCH_RULES.maxPerCompanyPerSend).toBeLessThanOrEqual(5);
    });
  });

  describe('getSendPlan', () => {
    it('should return free plan for free tier', () => {
      const plan = getSendPlan('free');
      expect(plan).toEqual(SEND_PLAN.free);
    });

    it('should return premium plan for premium tier', () => {
      const plan = getSendPlan('premium');
      expect(plan).toEqual(SEND_PLAN.premium);
    });

    it('should return free plan for unknown tier', () => {
      const plan = getSendPlan('unknown' as any);
      expect(plan).toEqual(SEND_PLAN.free);
    });

    it('should return free plan for null tier', () => {
      const plan = getSendPlan(null as any);
      expect(plan).toEqual(SEND_PLAN.free);
    });

    it('should return free plan for undefined tier', () => {
      const plan = getSendPlan(undefined as any);
      expect(plan).toEqual(SEND_PLAN.free);
    });
  });

  describe('canSendThisWeek', () => {
    it('should allow send for free user on Thursday', () => {
      const thursday = new Date('2024-01-04'); // Thursday
      const result = canSendThisWeek('free', thursday);
      expect(result).toBe(true);
    });

    it('should not allow send for free user on other days', () => {
      const monday = new Date('2024-01-01'); // Monday
      const result = canSendThisWeek('free', monday);
      expect(result).toBe(false);
    });

    it('should allow send for premium user on Monday', () => {
      const monday = new Date('2024-01-01'); // Monday
      const result = canSendThisWeek('premium', monday);
      expect(result).toBe(true);
    });

    it('should allow send for premium user on Wednesday', () => {
      const wednesday = new Date('2024-01-03'); // Wednesday
      const result = canSendThisWeek('premium', wednesday);
      expect(result).toBe(true);
    });

    it('should allow send for premium user on Friday', () => {
      const friday = new Date('2024-01-05'); // Friday
      const result = canSendThisWeek('premium', friday);
      expect(result).toBe(true);
    });

    it('should not allow send for premium user on other days', () => {
      const tuesday = new Date('2024-01-02'); // Tuesday
      const result = canSendThisWeek('premium', tuesday);
      expect(result).toBe(false);
    });

    it('should handle unknown tier', () => {
      const thursday = new Date('2024-01-04'); // Thursday
      const result = canSendThisWeek('unknown' as any, thursday);
      expect(result).toBe(false);
    });
  });

  describe('recordSend', () => {
    it('should record send for free user', () => {
      const ledger: SendLedgerEntry[] = [];
      const result = recordSend(ledger, 'user123', 'free', 5);
      
      expect(result.success).toBe(true);
      expect(ledger).toHaveLength(1);
      expect(ledger[0].user_id).toBe('user123');
      expect(ledger[0].tier).toBe('free');
      expect(ledger[0].sends_used).toBe(1);
      expect(ledger[0].jobs_sent).toBe(5);
    });

    it('should record send for premium user', () => {
      const ledger: SendLedgerEntry[] = [];
      const result = recordSend(ledger, 'user456', 'premium', 5);
      
      expect(result.success).toBe(true);
      expect(ledger).toHaveLength(1);
      expect(ledger[0].user_id).toBe('user456');
      expect(ledger[0].tier).toBe('premium');
      expect(ledger[0].sends_used).toBe(1);
      expect(ledger[0].jobs_sent).toBe(5);
    });

    it('should update existing ledger entry', () => {
      const ledger: SendLedgerEntry[] = [{
        user_id: 'user123',
        week_start: '2024-01-01',
        tier: 'free',
        sends_used: 1,
        jobs_sent: 5,
        created_at: new Date().toISOString()
      }];
      
      const result = recordSend(ledger, 'user123', 'free', 5);
      
      expect(result.success).toBe(true);
      expect(ledger).toHaveLength(1);
      expect(ledger[0].sends_used).toBe(2);
      expect(ledger[0].jobs_sent).toBe(10);
    });

    it('should handle invalid user ID', () => {
      const ledger: SendLedgerEntry[] = [];
      const result = recordSend(ledger, '', 'free', 5);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid user ID');
    });

    it('should handle invalid tier', () => {
      const ledger: SendLedgerEntry[] = [];
      const result = recordSend(ledger, 'user123', 'invalid' as any, 5);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid tier');
    });

    it('should handle negative jobs sent', () => {
      const ledger: SendLedgerEntry[] = [];
      const result = recordSend(ledger, 'user123', 'free', -5);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid jobs sent');
    });
  });

  describe('getWeeklyStats', () => {
    it('should return stats for user with sends', () => {
      const ledger: SendLedgerEntry[] = [{
        user_id: 'user123',
        week_start: '2024-01-01',
        tier: 'free',
        sends_used: 2,
        jobs_sent: 10,
        created_at: new Date().toISOString()
      }];
      
      const stats = getWeeklyStats(ledger, 'user123', '2024-01-01');
      
      expect(stats.sendsUsed).toBe(2);
      expect(stats.jobsSent).toBe(10);
      expect(stats.remainingSends).toBe(-1); // Over limit
    });

    it('should return zero stats for user with no sends', () => {
      const ledger: SendLedgerEntry[] = [];
      const stats = getWeeklyStats(ledger, 'user123', '2024-01-01');
      
      expect(stats.sendsUsed).toBe(0);
      expect(stats.jobsSent).toBe(0);
      expect(stats.remainingSends).toBe(1); // Free tier limit
    });

    it('should handle missing ledger entry', () => {
      const ledger: SendLedgerEntry[] = [{
        user_id: 'user456',
        week_start: '2024-01-01',
        tier: 'free',
        sends_used: 1,
        jobs_sent: 5,
        created_at: new Date().toISOString()
      }];
      
      const stats = getWeeklyStats(ledger, 'user123', '2024-01-01');
      
      expect(stats.sendsUsed).toBe(0);
      expect(stats.jobsSent).toBe(0);
      expect(stats.remainingSends).toBe(1);
    });
  });

  describe('getNextSendDate', () => {
    it('should return next Thursday for free user', () => {
      const monday = new Date('2024-01-01'); // Monday
      const nextSend = getNextSendDate('free', monday);
      
      expect(nextSend.getDay()).toBe(4); // Thursday
    });

    it('should return next Monday for premium user', () => {
      const friday = new Date('2024-01-05'); // Friday
      const nextSend = getNextSendDate('premium', friday);
      
      expect(nextSend.getDay()).toBe(1); // Monday
    });

    it('should handle current day correctly', () => {
      const thursday = new Date('2024-01-04'); // Thursday
      const nextSend = getNextSendDate('free', thursday);
      
      expect(nextSend.getDay()).toBe(4); // Thursday
    });
  });

  describe('calculateJobsToSend', () => {
    it('should return signup bonus for new user', () => {
      const jobs = calculateJobsToSend('free', true, 0);
      expect(jobs).toBe(10); // Signup bonus
    });

    it('should return regular amount for existing user', () => {
      const jobs = calculateJobsToSend('free', false, 0);
      expect(jobs).toBe(5); // Regular perSend
    });

    it('should return regular amount for premium user', () => {
      const jobs = calculateJobsToSend('premium', false, 0);
      expect(jobs).toBe(5); // Regular perSend
    });

    it('should handle negative previous sends', () => {
      const jobs = calculateJobsToSend('free', false, -1);
      expect(jobs).toBe(5); // Should not be negative
    });
  });

  describe('validateSendPlan', () => {
    it('should validate correct send plan', () => {
      const plan: SendPlan = {
        days: ['Mon', 'Wed', 'Fri'],
        perSend: 5,
        pullsPerWeek: 3,
        signupBonus: 10
      };
      
      const result = validateSendPlan(plan);
      expect(result.valid).toBe(true);
    });

    it('should reject plan with invalid days', () => {
      const plan: SendPlan = {
        days: ['InvalidDay'],
        perSend: 5,
        pullsPerWeek: 1,
        signupBonus: 10
      };
      
      const result = validateSendPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid days');
    });

    it('should reject plan with negative perSend', () => {
      const plan: SendPlan = {
        days: ['Mon'],
        perSend: -5,
        pullsPerWeek: 1,
        signupBonus: 10
      };
      
      const result = validateSendPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid perSend');
    });

    it('should reject plan with zero pullsPerWeek', () => {
      const plan: SendPlan = {
        days: ['Mon'],
        perSend: 5,
        pullsPerWeek: 0,
        signupBonus: 10
      };
      
      const result = validateSendPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid pullsPerWeek');
    });
  });

  describe('getTierFromUser', () => {
    it('should return premium for premium user', () => {
      const user = { subscription_tier: 'premium' };
      const tier = getTierFromUser(user);
      expect(tier).toBe('premium');
    });

    it('should return free for free user', () => {
      const user = { subscription_tier: 'free' };
      const tier = getTierFromUser(user);
      expect(tier).toBe('free');
    });

    it('should return free for user with no tier', () => {
      const user = {};
      const tier = getTierFromUser(user);
      expect(tier).toBe('free');
    });

    it('should return free for user with null tier', () => {
      const user = { subscription_tier: null };
      const tier = getTierFromUser(user);
      expect(tier).toBe('free');
    });
  });

  describe('shouldSendEarlyAccess', () => {
    it('should return true for premium user', () => {
      const result = shouldSendEarlyAccess('premium');
      expect(result).toBe(true);
    });

    it('should return false for free user', () => {
      const result = shouldSendEarlyAccess('free');
      expect(result).toBe(false);
    });

    it('should return false for unknown tier', () => {
      const result = shouldSendEarlyAccess('unknown' as any);
      expect(result).toBe(false);
    });
  });

  describe('getSignupBonusJobs', () => {
    it('should return signup bonus for free user', () => {
      const jobs = getSignupBonusJobs('free');
      expect(jobs).toBe(10);
    });

    it('should return signup bonus for premium user', () => {
      const jobs = getSignupBonusJobs('premium');
      expect(jobs).toBe(10);
    });

    it('should return zero for unknown tier', () => {
      const jobs = getSignupBonusJobs('unknown' as any);
      expect(jobs).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle very large job counts', () => {
      const jobs = calculateJobsToSend('free', false, 1000);
      expect(jobs).toBe(5); // Should cap at perSend
    });

    it('should handle date edge cases', () => {
      const invalidDate = new Date('invalid');
      const result = canSendThisWeek('free', invalidDate);
      expect(result).toBe(false);
    });

    it('should handle empty ledger array', () => {
      const stats = getWeeklyStats([], 'user123', '2024-01-01');
      expect(stats.sendsUsed).toBe(0);
      expect(stats.jobsSent).toBe(0);
    });
  });
});
