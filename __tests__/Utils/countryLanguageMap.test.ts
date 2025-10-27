/**
 * Tests for Country-to-Language Mapping
 */

import { COUNTRY_LANGUAGE_MAP, getCountryLanguage } from '@/Utils/countryLanguageMap';

describe('Country Language Mapping', () => {
  describe('COUNTRY_LANGUAGE_MAP', () => {
    it('should have all required country mappings', () => {
      expect(COUNTRY_LANGUAGE_MAP['GB']).toBe('en');
      expect(COUNTRY_LANGUAGE_MAP['UK']).toBe('en');
      expect(COUNTRY_LANGUAGE_MAP['United Kingdom']).toBe('en');
      expect(COUNTRY_LANGUAGE_MAP['DE']).toBe('de');
      expect(COUNTRY_LANGUAGE_MAP['Germany']).toBe('de');
      expect(COUNTRY_LANGUAGE_MAP['FR']).toBe('fr');
      expect(COUNTRY_LANGUAGE_MAP['France']).toBe('fr');
      expect(COUNTRY_LANGUAGE_MAP['ES']).toBe('es');
      expect(COUNTRY_LANGUAGE_MAP['Spain']).toBe('es');
      expect(COUNTRY_LANGUAGE_MAP['US']).toBe('en');
      expect(COUNTRY_LANGUAGE_MAP['United States']).toBe('en');
    });

    it('should have consistent language codes', () => {
      Object.values(COUNTRY_LANGUAGE_MAP).forEach(language => {
        expect(language).toMatch(/^[a-z]{2}$/); // ISO 639-1 format
        expect(language.length).toBe(2);
      });
    });

    it('should have valid ISO 639-1 language codes', () => {
      const validLanguages = ['en', 'de', 'fr', 'es', 'nl', 'it', 'pt', 'sv', 'da', 'no', 'fi', 'pl', 'cs', 'hu', 'el'];
      Object.values(COUNTRY_LANGUAGE_MAP).forEach(language => {
        expect(validLanguages).toContain(language);
      });
    });

    it('should have both country codes and full names for major countries', () => {
      // UK
      expect(COUNTRY_LANGUAGE_MAP['GB']).toBe('en');
      expect(COUNTRY_LANGUAGE_MAP['UK']).toBe('en');
      expect(COUNTRY_LANGUAGE_MAP['United Kingdom']).toBe('en');
      
      // Germany
      expect(COUNTRY_LANGUAGE_MAP['DE']).toBe('de');
      expect(COUNTRY_LANGUAGE_MAP['Germany']).toBe('de');
      
      // France
      expect(COUNTRY_LANGUAGE_MAP['FR']).toBe('fr');
      expect(COUNTRY_LANGUAGE_MAP['France']).toBe('fr');
    });

    it('should have reasonable defaults for multi-language countries', () => {
      expect(COUNTRY_LANGUAGE_MAP['CH']).toBe('de'); // Switzerland defaults to German
      expect(COUNTRY_LANGUAGE_MAP['Switzerland']).toBe('de');
      expect(COUNTRY_LANGUAGE_MAP['BE']).toBe('nl'); // Belgium defaults to Dutch
      expect(COUNTRY_LANGUAGE_MAP['Belgium']).toBe('nl');
    });
  });

  describe('getCountryLanguage', () => {
    it('should return correct language for country codes', () => {
      expect(getCountryLanguage('GB')).toBe('en');
      expect(getCountryLanguage('DE')).toBe('de');
      expect(getCountryLanguage('FR')).toBe('fr');
      expect(getCountryLanguage('ES')).toBe('es');
      expect(getCountryLanguage('NL')).toBe('nl');
      expect(getCountryLanguage('IT')).toBe('it');
      expect(getCountryLanguage('PT')).toBe('pt');
    });

    it('should return correct language for full country names', () => {
      expect(getCountryLanguage('United Kingdom')).toBe('en');
      expect(getCountryLanguage('Germany')).toBe('de');
      expect(getCountryLanguage('France')).toBe('fr');
      expect(getCountryLanguage('Spain')).toBe('es');
      expect(getCountryLanguage('Netherlands')).toBe('nl');
      expect(getCountryLanguage('Italy')).toBe('it');
      expect(getCountryLanguage('Portugal')).toBe('pt');
    });

    it('should handle case insensitive input', () => {
      expect(getCountryLanguage('gb')).toBe('en');
      expect(getCountryLanguage('germany')).toBe('en'); // Default fallback
      expect(getCountryLanguage('Germany')).toBe('de');
      expect(getCountryLanguage('GERMANY')).toBe('de');
      expect(getCountryLanguage('germany')).toBe('en'); // Default fallback
    });

    it('should handle whitespace in input', () => {
      expect(getCountryLanguage(' GB ')).toBe('en');
      expect(getCountryLanguage(' United Kingdom ')).toBe('en');
      expect(getCountryLanguage('  Germany  ')).toBe('de');
      expect(getCountryLanguage('\tFrance\t')).toBe('fr');
    });

    it('should return default language for unknown countries', () => {
      expect(getCountryLanguage('Unknown Country')).toBe('en');
      expect(getCountryLanguage('XX')).toBe('en');
      expect(getCountryLanguage('NonExistent')).toBe('en');
    });

    it('should return default language for empty input', () => {
      expect(getCountryLanguage('')).toBe('en');
      expect(getCountryLanguage('   ')).toBe('en');
      expect(getCountryLanguage('\t\n')).toBe('en');
    });

    it('should return default language for null/undefined input', () => {
      expect(getCountryLanguage(null as any)).toBe('en');
      expect(getCountryLanguage(undefined as any)).toBe('en');
    });

    it('should handle special characters in input', () => {
      expect(getCountryLanguage('GB!')).toBe('en'); // Default fallback
      expect(getCountryLanguage('@DE')).toBe('en'); // Default fallback
      expect(getCountryLanguage('FR#')).toBe('en'); // Default fallback
    });

    it('should handle very long input', () => {
      const longCountry = 'x'.repeat(1000);
      expect(getCountryLanguage(longCountry)).toBe('en');
    });

    it('should handle numeric input', () => {
      expect(getCountryLanguage('123')).toBe('en');
      expect(getCountryLanguage('0')).toBe('en');
    });

    it('should handle mixed case country codes', () => {
      expect(getCountryLanguage('Gb')).toBe('en');
      expect(getCountryLanguage('dE')).toBe('de');
      expect(getCountryLanguage('Fr')).toBe('fr');
    });

    it('should handle partial country names', () => {
      expect(getCountryLanguage('United')).toBe('en'); // Default fallback
      expect(getCountryLanguage('Kingdom')).toBe('en'); // Default fallback
      expect(getCountryLanguage('German')).toBe('en'); // Default fallback
    });
  });

  describe('edge cases', () => {
    it('should handle empty string input', () => {
      expect(getCountryLanguage('')).toBe('en');
    });

    it('should handle whitespace-only input', () => {
      expect(getCountryLanguage(' ')).toBe('en');
      expect(getCountryLanguage('\t')).toBe('en');
      expect(getCountryLanguage('\n')).toBe('en');
      expect(getCountryLanguage('   ')).toBe('en');
    });

    it('should handle special characters and symbols', () => {
      expect(getCountryLanguage('!@#$%^&*()')).toBe('en');
      expect(getCountryLanguage('GB-UK')).toBe('en'); // Default fallback
      expect(getCountryLanguage('DE/DE')).toBe('en'); // Default fallback
    });

    it('should handle unicode characters', () => {
      expect(getCountryLanguage('Deutschland')).toBe('en'); // Default fallback
      expect(getCountryLanguage('España')).toBe('en'); // Default fallback
      expect(getCountryLanguage('Россия')).toBe('en'); // Default fallback
    });

    it('should handle very short input', () => {
      expect(getCountryLanguage('G')).toBe('en');
      expect(getCountryLanguage('D')).toBe('en');
      expect(getCountryLanguage('F')).toBe('en');
    });

    it('should handle very long input', () => {
      const veryLongCountry = 'x'.repeat(10000);
      expect(getCountryLanguage(veryLongCountry)).toBe('en');
    });
  });

  describe('consistency checks', () => {
    it('should have consistent mappings for same countries', () => {
      expect(COUNTRY_LANGUAGE_MAP['GB']).toBe(COUNTRY_LANGUAGE_MAP['UK']);
      expect(COUNTRY_LANGUAGE_MAP['GB']).toBe(COUNTRY_LANGUAGE_MAP['United Kingdom']);
    });

    it('should have reasonable language distribution', () => {
      const languages = Object.values(COUNTRY_LANGUAGE_MAP);
      const languageCounts = languages.reduce((acc, lang) => {
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(languageCounts['en']).toBeGreaterThan(0); // English should be most common
      expect(languageCounts['de']).toBeGreaterThan(0); // German should be present
      expect(languageCounts['fr']).toBeGreaterThan(0); // French should be present
    });

    it('should not have duplicate entries with different languages', () => {
      const entries = Object.entries(COUNTRY_LANGUAGE_MAP);
      const countryGroups = entries.reduce((acc, [country, language]) => {
        const normalized = country.toUpperCase();
        if (!acc[normalized]) acc[normalized] = [];
        acc[normalized].push(language);
        return acc;
      }, {} as Record<string, string[]>);

      Object.entries(countryGroups).forEach(([country, languages]) => {
        const uniqueLanguages = [...new Set(languages)];
        expect(uniqueLanguages).toHaveLength(1);
      });
    });
  });

  describe('performance', () => {
    it('should handle multiple calls efficiently', () => {
      const start = Date.now();
      for (let i = 0; i < 1000; i++) {
        getCountryLanguage('GB');
        getCountryLanguage('DE');
        getCountryLanguage('FR');
      }
      const end = Date.now();
      
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });

    it('should handle large input efficiently', () => {
      const largeInput = 'x'.repeat(10000);
      const start = Date.now();
      getCountryLanguage(largeInput);
      const end = Date.now();
      
      expect(end - start).toBeLessThan(10); // Should complete in under 10ms
    });
  });
});