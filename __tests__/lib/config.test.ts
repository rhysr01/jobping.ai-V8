/**
 * Tests for Config Constants
 */

import {
  englishSeeds,
  localPacks,
  excludeNoise,
  targetCities
} from '@/lib/config';

describe('Config - englishSeeds', () => {
  it('should contain graduate keywords', () => {
    expect(englishSeeds).toContain('graduate programme');
    expect(englishSeeds).toContain('graduate program');
  });

  it('should contain entry level keywords', () => {
    expect(englishSeeds).toContain('entry level');
    expect(englishSeeds).toContain('junior');
  });

  it('should contain intern/trainee keywords', () => {
    expect(englishSeeds).toContain('intern');
    expect(englishSeeds).toContain('trainee');
  });

  it('should be an array', () => {
    expect(Array.isArray(englishSeeds)).toBe(true);
  });

  it('should have at least 5 keywords', () => {
    expect(englishSeeds.length).toBeGreaterThanOrEqual(5);
  });
});

describe('Config - localPacks', () => {
  it('should have Spanish keywords', () => {
    expect(localPacks.es).toBeDefined();
    expect(localPacks.es).toContain('programa de graduados');
    expect(localPacks.es).toContain('becario');
  });

  it('should have French keywords', () => {
    expect(localPacks.fr).toBeDefined();
    expect(localPacks.fr).toContain('stage');
    expect(localPacks.fr).toContain('VIE');
  });

  it('should have German keywords', () => {
    expect(localPacks.de).toBeDefined();
    expect(localPacks.de).toContain('Trainee');
    expect(localPacks.de).toContain('Praktikum');
  });

  it('should have Italian keywords', () => {
    expect(localPacks.it).toBeDefined();
    expect(localPacks.it).toContain('neolaureato');
    expect(localPacks.it).toContain('tirocinio');
  });

  it('should have English (empty array)', () => {
    expect(localPacks.en).toBeDefined();
    expect(Array.isArray(localPacks.en)).toBe(true);
  });

  it('should be an object with language keys', () => {
    expect(typeof localPacks).toBe('object');
    expect(Object.keys(localPacks)).toContain('es');
    expect(Object.keys(localPacks)).toContain('fr');
    expect(Object.keys(localPacks)).toContain('de');
    expect(Object.keys(localPacks)).toContain('it');
  });
});

describe('Config - excludeNoise', () => {
  it('should exclude senior titles', () => {
    expect(excludeNoise).toContain('Senior');
    expect(excludeNoise).toContain('Sr');
  });

  it('should exclude leadership titles', () => {
    expect(excludeNoise).toContain('Lead');
    expect(excludeNoise).toContain('Principal');
    expect(excludeNoise).toContain('Director');
    expect(excludeNoise).toContain('Head');
    expect(excludeNoise).toContain('Manager');
  });

  it('should exclude irrelevant job types', () => {
    expect(excludeNoise).toContain('Nurse');
    expect(excludeNoise).toContain('Warehouse');
    expect(excludeNoise).toContain('Construction');
  });

  it('should be an array', () => {
    expect(Array.isArray(excludeNoise)).toBe(true);
  });

  it('should have at least 10 noise keywords', () => {
    expect(excludeNoise.length).toBeGreaterThanOrEqual(10);
  });
});

describe('Config - targetCities', () => {
  it('should include London', () => {
    expect(targetCities).toContain('London');
  });

  it('should include major European cities', () => {
    expect(targetCities).toContain('Berlin');
    expect(targetCities).toContain('Paris');
    expect(targetCities).toContain('Madrid');
    expect(targetCities).toContain('Amsterdam');
  });

  it('should include German cities', () => {
    expect(targetCities).toContain('Berlin');
    expect(targetCities).toContain('Hamburg');
    expect(targetCities).toContain('Munich');
  });

  it('should include Italian cities', () => {
    expect(targetCities).toContain('Milan');
    expect(targetCities).toContain('Rome');
  });

  it('should include other European hubs', () => {
    expect(targetCities).toContain('Zurich');
    expect(targetCities).toContain('Brussels');
    expect(targetCities).toContain('Dublin');
  });

  it('should be an array', () => {
    expect(Array.isArray(targetCities)).toBe(true);
  });

  it('should have at least 10 cities', () => {
    expect(targetCities.length).toBeGreaterThanOrEqual(10);
  });

  it('should contain only strings', () => {
    targetCities.forEach(city => {
      expect(typeof city).toBe('string');
    });
  });

  it('should have no empty strings', () => {
    targetCities.forEach(city => {
      expect(city.length).toBeGreaterThan(0);
    });
  });
});

describe('Config - Cross-validation', () => {
  it('should have distinct seeds and noise keywords', () => {
    const seedsLower = englishSeeds.map(s => s.toLowerCase());
    const noiseLower = excludeNoise.map(n => n.toLowerCase());
    
    // Seeds and noise should not overlap
    const overlap = seedsLower.filter(s => noiseLower.includes(s));
    expect(overlap.length).toBe(0);
  });

  it('should have all local packs as arrays', () => {
    Object.values(localPacks).forEach(pack => {
      expect(Array.isArray(pack)).toBe(true);
    });
  });

  it('should have non-empty local packs (except en)', () => {
    Object.keys(localPacks).forEach(lang => {
      if (lang !== 'en') {
        expect(localPacks[lang].length).toBeGreaterThan(0);
      }
    });
  });
});

