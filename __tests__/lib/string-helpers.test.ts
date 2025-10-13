import { normalizeStringToArray, truncate, capitalize, toKebabCase } from '@/lib/string-helpers';

describe('string-helpers', () => {
  describe('normalizeStringToArray', () => {
    it('handles comma-separated strings', () => {
      expect(normalizeStringToArray('london, paris, berlin')).toEqual(['london', 'paris', 'berlin']);
    });

    it('handles pipe-separated strings', () => {
      expect(normalizeStringToArray('london|paris|berlin')).toEqual(['london', 'paris', 'berlin']);
    });

    it('handles arrays', () => {
      expect(normalizeStringToArray(['london', 'paris'])).toEqual(['london', 'paris']);
    });

    it('handles null/undefined', () => {
      expect(normalizeStringToArray(null)).toEqual([]);
      expect(normalizeStringToArray(undefined)).toEqual([]);
      expect(normalizeStringToArray('')).toEqual([]);
    });

    it('trims whitespace', () => {
      expect(normalizeStringToArray('  london  ,  paris  ')).toEqual(['london', 'paris']);
    });

    it('handles single values', () => {
      expect(normalizeStringToArray('london')).toEqual(['london']);
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('keeps short strings unchanged', () => {
      expect(truncate('hello', 10)).toBe('hello');
    });

    it('handles exact length', () => {
      expect(truncate('hello', 5)).toBe('hello');
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('handles empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('handles already capitalized strings', () => {
      expect(capitalize('Hello')).toBe('Hello');
    });
  });

  describe('toKebabCase', () => {
    it('converts camelCase to kebab-case', () => {
      expect(toKebabCase('helloWorld')).toBe('hello-world');
    });

    it('converts spaces to dashes', () => {
      expect(toKebabCase('hello world')).toBe('hello-world');
    });

    it('handles underscores', () => {
      expect(toKebabCase('hello_world')).toBe('hello-world');
    });

    it('handles mixed case with spaces', () => {
      expect(toKebabCase('Hello World Test')).toBe('hello-world-test');
    });
  });
});

