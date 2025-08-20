import { normalizeCategoriesForRead, safeParseCategories } from '../../Utils/jobMatching';

describe('Categories Normalization', () => {
  describe('normalizeCategoriesForRead', () => {
    it('should handle string categories', () => {
      const result = normalizeCategoriesForRead('career:tech|early-career|loc:berlin');
      expect(result).toBe('career:tech|early-career|loc:berlin');
    });

    it('should handle array categories', () => {
      const result = normalizeCategoriesForRead(['career:tech', 'early-career', 'loc:berlin']);
      expect(result).toBe('career:tech|early-career|loc:berlin');
    });

    it('should handle object categories', () => {
      const result = normalizeCategoriesForRead({
        career: 'tech',
        location: 'berlin',
        type: 'early-career'
      });
      expect(result).toBe('tech|berlin|early-career');
    });

    it('should handle null/undefined', () => {
      const result = normalizeCategoriesForRead(null);
      expect(result).toBe('career:unknown|loc:unknown');
    });

    it('should handle empty array', () => {
      const result = normalizeCategoriesForRead([]);
      expect(result).toBe('');
    });

    it('should filter out falsy values', () => {
      const result = normalizeCategoriesForRead(['career:tech', null, 'early-career', undefined, 'loc:berlin']);
      expect(result).toBe('career:tech|early-career|loc:berlin');
    });
  });

  describe('safeParseCategories', () => {
    it('should parse string categories correctly', () => {
      const result = safeParseCategories('career:tech|early-career|loc:berlin');
      expect(result).toEqual(['career:tech', 'early-career', 'loc:berlin']);
    });

    it('should parse array categories correctly', () => {
      const result = safeParseCategories(['career:tech', 'early-career', 'loc:berlin']);
      expect(result).toEqual(['career:tech', 'early-career', 'loc:berlin']);
    });

    it('should handle null/undefined', () => {
      const result = safeParseCategories(null);
      expect(result).toEqual(['career:unknown', 'loc:unknown']);
    });

    it('should trim whitespace', () => {
      const result = safeParseCategories(' career:tech | early-career | loc:berlin ');
      expect(result).toEqual(['career:tech', 'early-career', 'loc:berlin']);
    });

    it('should filter out empty tags', () => {
      const result = safeParseCategories('career:tech||early-career||loc:berlin');
      expect(result).toEqual(['career:tech', 'early-career', 'loc:berlin']);
    });

    it('should handle mixed types safely', () => {
      const result = safeParseCategories(['career:tech', null, 'early-career', undefined, 'loc:berlin']);
      expect(result).toEqual(['career:tech', 'early-career', 'loc:berlin']);
    });
  });

  describe('Integration: Categories parsing in job matching', () => {
    it('should handle legacy categories format without crashing', () => {
      // Simulate a job with legacy categories format
      const mockJob = {
        id: 1,
        title: 'Test Job',
        company: 'Test Company',
        categories: ['career:tech', 'early-career', 'loc:berlin'] // Array format
      };

      // This should not throw an error
      expect(() => {
        const normalized = normalizeCategoriesForRead(mockJob.categories);
        const parsed = safeParseCategories(mockJob.categories);
        expect(normalized).toBe('career:tech|early-career|loc:berlin');
        expect(parsed).toEqual(['career:tech', 'early-career', 'loc:berlin']);
      }).not.toThrow();
    });

    it('should handle string categories format correctly', () => {
      // Simulate a job with string categories format
      const mockJob = {
        id: 1,
        title: 'Test Job',
        company: 'Test Company',
        categories: 'career:tech|early-career|loc:berlin' // String format
      };

      // This should work correctly
      const normalized = normalizeCategoriesForRead(mockJob.categories);
      const parsed = safeParseCategories(mockJob.categories);
      
      expect(normalized).toBe('career:tech|early-career|loc:berlin');
      expect(parsed).toEqual(['career:tech', 'early-career', 'loc:berlin']);
    });

    it('should handle null categories gracefully', () => {
      // Simulate a job with null categories
      const mockJob = {
        id: 1,
        title: 'Test Job',
        company: 'Test Company',
        categories: null
      };

      // This should provide safe defaults
      const normalized = normalizeCategoriesForRead(mockJob.categories);
      const parsed = safeParseCategories(mockJob.categories);
      
      expect(normalized).toBe('career:unknown|loc:unknown');
      expect(parsed).toEqual(['career:unknown', 'loc:unknown']);
    });
  });
});
