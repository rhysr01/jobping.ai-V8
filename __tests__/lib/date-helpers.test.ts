import { 
  getDateDaysAgo, 
  getDateHoursAgo, 
  getDateMinutesAgo,
  isWithinDays,
  getStartOfToday,
  getEndOfToday,
  toUTCString
} from '@/lib/date-helpers';

describe('date-helpers', () => {
  describe('getDateDaysAgo', () => {
    it('returns date N days ago at midnight UTC', () => {
      const date = getDateDaysAgo(7);
      const expected = new Date();
      expected.setUTCDate(expected.getUTCDate() - 7);
      expected.setUTCHours(0, 0, 0, 0);
      
      // Allow 1 second tolerance for test execution time
      expect(Math.abs(date.getTime() - expected.getTime())).toBeLessThan(1000);
    });

    it('handles 0 days (today at midnight)', () => {
      const date = getDateDaysAgo(0);
      expect(date.getUTCHours()).toBe(0);
      expect(date.getUTCMinutes()).toBe(0);
      expect(date.getUTCSeconds()).toBe(0);
      expect(date.getUTCMilliseconds()).toBe(0);
    });

    it('handles 30 days ago', () => {
      const date = getDateDaysAgo(30);
      const expected = new Date();
      expected.setUTCDate(expected.getUTCDate() - 30);
      expected.setUTCHours(0, 0, 0, 0);
      
      expect(Math.abs(date.getTime() - expected.getTime())).toBeLessThan(1000);
    });
  });

  describe('getDateHoursAgo', () => {
    it('returns date N hours ago', () => {
      const date = getDateHoursAgo(24);
      const expected = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      expect(Math.abs(date.getTime() - expected.getTime())).toBeLessThan(1000);
    });

    it('handles fractional hours', () => {
      const date = getDateHoursAgo(1.5);
      const expected = new Date(Date.now() - 1.5 * 60 * 60 * 1000);
      
      expect(Math.abs(date.getTime() - expected.getTime())).toBeLessThan(1000);
    });
  });

  describe('getDateMinutesAgo', () => {
    it('returns date N minutes ago', () => {
      const date = getDateMinutesAgo(30);
      const expected = new Date(Date.now() - 30 * 60 * 1000);
      
      expect(Math.abs(date.getTime() - expected.getTime())).toBeLessThan(1000);
    });
  });

  describe('isWithinDays', () => {
    it('returns true for recent dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      expect(isWithinDays(yesterday, 7)).toBe(true);
    });

    it('returns false for old dates', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      expect(isWithinDays(twoWeeksAgo, 7)).toBe(false);
    });

    it('handles string dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      expect(isWithinDays(yesterday.toISOString(), 7)).toBe(true);
    });

    it('returns true for exact cutoff date', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      expect(isWithinDays(sevenDaysAgo, 7)).toBe(true);
    });
  });

  describe('getStartOfToday', () => {
    it('returns start of day in UTC', () => {
      const start = getStartOfToday();
      
      expect(start.getUTCHours()).toBe(0);
      expect(start.getUTCMinutes()).toBe(0);
      expect(start.getUTCSeconds()).toBe(0);
      expect(start.getUTCMilliseconds()).toBe(0);
    });

    it('returns a Date object', () => {
      const start = getStartOfToday();
      expect(start).toBeInstanceOf(Date);
    });
  });

  describe('getEndOfToday', () => {
    it('returns end of day in UTC', () => {
      const end = getEndOfToday();
      
      expect(end.getUTCHours()).toBe(23);
      expect(end.getUTCMinutes()).toBe(59);
      expect(end.getUTCSeconds()).toBe(59);
      expect(end.getUTCMilliseconds()).toBe(999);
    });

    it('returns a Date object', () => {
      const end = getEndOfToday();
      expect(end).toBeInstanceOf(Date);
    });
  });

  describe('toUTCString', () => {
    it('formats date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = toUTCString(date);
      
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('handles current date', () => {
      const now = new Date();
      const result = toUTCString(now);
      
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('handles midnight dates', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const result = toUTCString(date);
      
      expect(result).toBe('2024-01-01T00:00:00.000Z');
    });

    it('handles end of day dates', () => {
      const date = new Date('2024-01-01T23:59:59.999Z');
      const result = toUTCString(date);
      
      expect(result).toBe('2024-01-01T23:59:59.999Z');
    });
  });

  describe('Edge Cases', () => {
    it('getDateDaysAgo handles negative days', () => {
      const future = getDateDaysAgo(-7);
      const expected = new Date();
      expected.setUTCDate(expected.getUTCDate() + 7);
      expected.setUTCHours(0, 0, 0, 0);
      
      expect(Math.abs(future.getTime() - expected.getTime())).toBeLessThan(1000);
    });

    it('getDateHoursAgo handles 0 hours', () => {
      const now = getDateHoursAgo(0);
      const expected = new Date();
      
      expect(Math.abs(now.getTime() - expected.getTime())).toBeLessThan(1000);
    });

    it('getDateMinutesAgo handles 0 minutes', () => {
      const now = getDateMinutesAgo(0);
      const expected = new Date();
      
      expect(Math.abs(now.getTime() - expected.getTime())).toBeLessThan(1000);
    });

    it('getDateMinutesAgo handles large values', () => {
      const date = getDateMinutesAgo(1440); // 24 hours
      const expected = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      expect(Math.abs(date.getTime() - expected.getTime())).toBeLessThan(1000);
    });

    it('isWithinDays handles 0 days', () => {
      const now = new Date();
      expect(isWithinDays(now, 0)).toBe(true);
    });

    it('isWithinDays handles future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      expect(isWithinDays(tomorrow, 7)).toBe(true);
    });

    it('getStartOfToday is before getEndOfToday', () => {
      const start = getStartOfToday();
      const end = getEndOfToday();
      
      expect(start.getTime()).toBeLessThan(end.getTime());
    });

    it('getStartOfToday and getEndOfToday are same day', () => {
      const start = getStartOfToday();
      const end = getEndOfToday();
      
      expect(start.getUTCDate()).toBe(end.getUTCDate());
      expect(start.getUTCMonth()).toBe(end.getUTCMonth());
      expect(start.getUTCFullYear()).toBe(end.getUTCFullYear());
    });
  });

  describe('Real-world Scenarios', () => {
    it('can calculate job age in days', () => {
      const posted = getDateDaysAgo(3);
      const cutoff = getDateDaysAgo(7);
      
      expect(posted.getTime()).toBeGreaterThan(cutoff.getTime());
    });

    it('can check if job is within last week', () => {
      const threeDaysAgo = getDateDaysAgo(3);
      
      expect(isWithinDays(threeDaysAgo, 7)).toBe(true);
    });

    it('can determine if cache is expired', () => {
      const cacheTime = getDateDaysAgo(2);
      
      // Cache 2 days old should NOT be within last day
      expect(isWithinDays(cacheTime, 1)).toBe(false);
    });

    it('can create date ranges for queries', () => {
      const start = getStartOfToday();
      const end = getEndOfToday();
      const rangeMs = end.getTime() - start.getTime();
      const expectedMs = 24 * 60 * 60 * 1000 - 1; // 23:59:59.999
      
      expect(Math.abs(rangeMs - expectedMs)).toBeLessThan(1000);
    });

    it('can format dates for API responses', () => {
      const date = getStartOfToday();
      const formatted = toUTCString(date);
      const parsed = new Date(formatted);
      
      expect(parsed.getTime()).toBe(date.getTime());
    });

    it('can calculate time elapsed', () => {
      const oneHourAgo = getDateHoursAgo(1);
      const now = new Date();
      const elapsed = now.getTime() - oneHourAgo.getTime();
      const expectedMs = 60 * 60 * 1000;
      
      expect(Math.abs(elapsed - expectedMs)).toBeLessThan(1000);
    });
  });
});

