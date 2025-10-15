/**
 * Tests for Scraper Utilities
 */

import {
  classifyEarlyCareer,
  inferRole,
  parseLocation,
  makeJobHash,
  validateJob,
  shouldSaveJob,
  convertToDatabaseFormat
} from '@/scrapers/utils';

describe('Scraper Utils - classifyEarlyCareer', () => {
  it('should detect graduate programs', () => {
    expect(classifyEarlyCareer({ title: 'Graduate Program - Consulting', description: 'For new graduates', url: '', company: '', location: '', source: '' })).toBe(true);
    expect(classifyEarlyCareer({ title: 'New Grad Software Engineer', description: '', url: '', company: '', location: '', source: '' })).toBe(true);
    expect(classifyEarlyCareer({ title: 'Graduate Scheme', description: '', url: '', company: '', location: '', source: '' })).toBe(true);
  });

  it('should detect internships', () => {
    expect(classifyEarlyCareer({ title: 'Summer Internship', description: 'For students', url: '', company: '', location: '', source: '' })).toBe(true);
    expect(classifyEarlyCareer({ title: 'Intern - Data Analytics', description: '', url: '', company: '', location: '', source: '' })).toBe(true);
    expect(classifyEarlyCareer({ title: 'Internship Program', description: '', url: '', company: '', location: '', source: '' })).toBe(true);
  });

  it('should detect junior/entry-level roles', () => {
    expect(classifyEarlyCareer({ title: 'Junior Developer', description: '', url: '', company: '', location: '', source: '' })).toBe(true);
    expect(classifyEarlyCareer({ title: 'Entry Level Analyst', description: '', url: '', company: '', location: '', source: '' })).toBe(true);
    expect(classifyEarlyCareer({ title: 'Trainee Consultant', description: '', url: '', company: '', location: '', source: '' })).toBe(true);
  });

  it('should detect analyst positions', () => {
    expect(classifyEarlyCareer({ title: 'Business Analyst', description: 'Entry level', url: '', company: '', location: '', source: '' })).toBe(true);
    expect(classifyEarlyCareer({ title: 'Analyst - Operations', description: '', url: '', company: '', location: '', source: '' })).toBe(true);
  });

  it('should reject senior roles', () => {
    expect(classifyEarlyCareer({ title: 'Senior Software Engineer', description: '', url: '', company: '', location: '', source: '' })).toBe(false);
    expect(classifyEarlyCareer({ title: 'Lead Developer', description: '', url: '', company: '', location: '', source: '' })).toBe(false);
    expect(classifyEarlyCareer({ title: 'Principal Consultant', description: '', url: '', company: '', location: '', source: '' })).toBe(false);
    expect(classifyEarlyCareer({ title: 'Director of Engineering', description: '', url: '', company: '', location: '', source: '' })).toBe(false);
  });

  it('should reject roles requiring extensive experience', () => {
    expect(classifyEarlyCareer({ title: 'Engineer', description: 'Minimum 5 years experience', url: '', company: '', location: '', source: '' })).toBe(false);
    expect(classifyEarlyCareer({ title: 'Analyst', description: 'Proven track record required', url: '', company: '', location: '', source: '' })).toBe(false);
    expect(classifyEarlyCareer({ title: 'Consultant', description: '3+ years relevant experience', url: '', company: '', location: '', source: '' })).toBe(false);
  });

  it('should allow roles with 1-2 years experience (still early career)', () => {
    // This is the fix mentioned in the code - don't exclude 1-2 year roles
    const job = { title: 'Analyst', description: 'Entry level, 1-2 years preferred', url: '', company: '', location: '', source: '' };
    const result = classifyEarlyCareer(job);

    expect(result).toBe(true); // Should still be classified as early career
  });

  it('should handle multilingual keywords', () => {
    // French
    expect(classifyEarlyCareer({ title: 'Stagiaire', description: 'Alternance', url: '', company: '', location: '', source: '' })).toBe(true);
    // German
    expect(classifyEarlyCareer({ title: 'Praktikum', description: 'Traineeprogramm', url: '', company: '', location: '', source: '' })).toBe(true);
    // Spanish
    expect(classifyEarlyCareer({ title: 'Prácticas', description: 'Recién titulado', url: '', company: '', location: '', source: '' })).toBe(true);
  });
});

describe('Scraper Utils - inferRole', () => {
  it('should infer software engineering roles', () => {
    expect(inferRole({ title: 'Software Engineer', description: '', url: '', company: '', location: '', source: '' })).toBe('software-engineering');
    expect(inferRole({ title: 'Software Developer', description: '', url: '', company: '', location: '', source: '' })).toBe('software-engineering');
  });

  it('should infer data science roles', () => {
    expect(inferRole({ title: 'Data Scientist', description: '', url: '', company: '', location: '', source: '' })).toBe('data-science');
    expect(inferRole({ title: 'Data Analyst', description: '', url: '', company: '', location: '', source: '' })).toBe('data-science');
    expect(inferRole({ title: 'Data Engineer', description: '', url: '', company: '', location: '', source: '' })).toBe('data-science');
  });

  it('should infer product management', () => {
    expect(inferRole({ title: 'Product Manager', description: '', url: '', company: '', location: '', source: '' })).toBe('product-management');
    expect(inferRole({ title: 'Product Owner', description: '', url: '', company: '', location: '', source: '' })).toBe('product-management');
  });

  it('should infer marketing roles', () => {
    expect(inferRole({ title: 'Marketing Specialist', description: '', url: '', company: '', location: '', source: '' })).toBe('marketing');
  });

  it('should infer consulting roles', () => {
    expect(inferRole({ title: 'Management Consultant', description: '', url: '', company: '', location: '', source: '' })).toBe('consulting');
  });

  it('should infer frontend/backend/fullstack', () => {
    expect(inferRole({ title: 'Frontend Developer', description: '', url: '', company: '', location: '', source: '' })).toBe('frontend-development');
    expect(inferRole({ title: 'Backend Engineer', description: '', url: '', company: '', location: '', source: '' })).toBe('backend-development');
    expect(inferRole({ title: 'Full Stack Developer', description: '', url: '', company: '', location: '', source: '' })).toBe('full-stack-development');
  });

  it('should return general for unclassified roles', () => {
    expect(inferRole({ title: 'Generic Position', description: '', url: '', company: '', location: '', source: '' })).toBe('general');
  });

  it('should be case insensitive', () => {
    expect(inferRole({ title: 'SOFTWARE ENGINEER', description: '', url: '', company: '', location: '', source: '' })).toBe('software-engineering');
    expect(inferRole({ title: 'software engineer', description: '', url: '', company: '', location: '', source: '' })).toBe('software-engineering');
  });
});

describe('Scraper Utils - parseLocation', () => {
  it('should parse EU capitals', () => {
    expect(parseLocation('London, UK').isEU).toBe(true);
    expect(parseLocation('Paris, France').isEU).toBe(true);
    expect(parseLocation('Berlin, Germany').isEU).toBe(true);
    expect(parseLocation('Dublin, Ireland').isEU).toBe(true);
  });

  it('should detect remote work', () => {
    expect(parseLocation('Remote').isRemote).toBe(true);
    expect(parseLocation('Remote - Europe').isRemote).toBe(true);
    expect(parseLocation('Work from anywhere').isRemote).toBe(true);
  });

  it('should detect Switzerland and Norway as EU (included)', () => {
    expect(parseLocation('Zurich, Switzerland').isEU).toBe(true);
    expect(parseLocation('Oslo, Norway').isEU).toBe(true);
  });

  it('should detect non-EU locations', () => {
    expect(parseLocation('New York, USA').isEU).toBe(false);
    expect(parseLocation('Tokyo, Japan').isEU).toBe(false);
    expect(parseLocation('Toronto, Canada').isEU).toBe(false);
  });

  it('should extract city from comma-separated location', () => {
    const result = parseLocation('Munich, Bavaria, Germany');

    expect(result.city).toBe('munich');
    expect(result.isEU).toBe(true);
  });
});

describe('Scraper Utils - shouldSaveJob', () => {
  it('should save early-career EU jobs', () => {
    const job = {
      title: 'Graduate Program',
      company: 'Tech Corp',
      location: 'London, UK',
      description: 'For graduates',
      url: 'url',
      source: 'test'
    };

    expect(shouldSaveJob(job)).toBe(true);
  });

  it('should not save non-early-career jobs', () => {
    const job = {
      title: 'Senior Engineer',
      company: 'Corp',
      location: 'London, UK',
      description: 'Extensive experience required',
      url: 'url',
      source: 'test'
    };

    expect(shouldSaveJob(job)).toBe(false);
  });

  it('should not save non-EU jobs', () => {
    const job = {
      title: 'Graduate Program',
      company: 'Corp',
      location: 'New York, USA',
      description: 'For graduates',
      url: 'url',
      source: 'test'
    };

    expect(shouldSaveJob(job)).toBe(false);
  });

  it('should save only if BOTH early-career AND EU', () => {
    const euNotEarly = {
      title: 'Senior Manager',
      company: 'Corp',
      location: 'London, UK',
      description: '',
      url: 'url',
      source: 'test'
    };

    const earlyNotEU = {
      title: 'Graduate Program',
      company: 'Corp',
      location: 'New York, USA',
      description: '',
      url: 'url',
      source: 'test'
    };

    expect(shouldSaveJob(euNotEarly)).toBe(false);
    expect(shouldSaveJob(earlyNotEU)).toBe(false);
  });
});

describe('Scraper Utils - validateJob', () => {
  it('should validate complete job', () => {
    const job = {
      title: 'Engineer',
      company: 'Corp',
      location: 'London',
      description: 'desc',
      url: 'url',
      source: 'test'
    };

    const result = validateJob(job);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should catch all required fields', () => {
    const job = {
      title: '',
      company: '',
      location: '',
      description: '',
      url: '',
      source: ''
    };

    const result = validateJob(job);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(expect.arrayContaining([
      'Title is required',
      'Company is required',
      'Location is required',
      'Description is required',
      'URL is required',
      'Source is required'
    ]));
  });
});

describe('Scraper Utils - convertToDatabaseFormat', () => {
  // Suppress console.log during tests
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should convert to database format', () => {
    const job = {
      title: 'Graduate Program',
      company: 'Tech Corp',
      location: 'London, UK',
      description: 'For graduates',
      url: 'https://example.com/job',
      source: 'test',
      posted_at: '2025-10-01'
    };

    const result = convertToDatabaseFormat(job);

    expect(result).toHaveProperty('job_hash');
    expect(result).toHaveProperty('title', 'Graduate Program');
    expect(result).toHaveProperty('company', 'Tech Corp');
    expect(result.categories).toContain('early-career');
    expect(result.experience_required).toBe('entry-level');
  });

  it('should mark remote jobs correctly', () => {
    const job = {
      title: 'Developer',
      company: 'Corp',
      location: 'Remote',
      description: 'desc',
      url: 'url',
      source: 'test'
    };

    const result = convertToDatabaseFormat(job);

    expect(result.work_environment).toBe('remote');
  });

  it('should classify experienced roles', () => {
    const job = {
      title: 'Senior Engineer',
      company: 'Corp',
      location: 'London, UK',
      description: '5+ years experience',
      url: 'url',
      source: 'test'
    };

    const result = convertToDatabaseFormat(job);

    expect(result.categories).toContain('experienced');
    expect(result.experience_required).toBe('experienced');
  });

  it('should include metadata', () => {
    const job = {
      title: 'Intern',
      company: 'Corp',
      location: 'Berlin, Germany',
      description: 'desc',
      url: 'url',
      source: 'test'
    };

    const result = convertToDatabaseFormat(job);

    expect(result.metadata).toHaveProperty('city');
    expect(result.metadata).toHaveProperty('isEU');
    expect(result.metadata).toHaveProperty('isEarlyCareer');
    expect(result.metadata.isEU).toBe(true);
  });
});

describe('Scraper Utils - makeJobHash', () => {
  it('should generate consistent hashes', () => {
    const job = { title: 'Engineer', company: 'Corp', location: 'London', description: '', url: '', source: '' };

    const hash1 = makeJobHash(job);
    const hash2 = makeJobHash(job);

    expect(hash1).toBe(hash2);
  });

  it('should generate different hashes for different jobs', () => {
    const job1 = { title: 'Engineer A', company: 'Corp', location: 'London', description: '', url: '', source: '' };
    const job2 = { title: 'Engineer B', company: 'Corp', location: 'London', description: '', url: '', source: '' };

    expect(makeJobHash(job1)).not.toBe(makeJobHash(job2));
  });

  it('should be case insensitive', () => {
    const job1 = { title: 'ENGINEER', company: 'CORP', location: 'LONDON', description: '', url: '', source: '' };
    const job2 = { title: 'engineer', company: 'corp', location: 'london', description: '', url: '', source: '' };

    expect(makeJobHash(job1)).toBe(makeJobHash(job2));
  });
});

describe('Scraper Utils - inferRole', () => {
  it('should identify software engineering', () => {
    expect(inferRole({ title: 'Software Engineer', description: '', url: '', company: '', location: '', source: '' })).toBe('software-engineering');
    expect(inferRole({ title: 'Software Developer', description: '', url: '', company: '', location: '', source: '' })).toBe('software-engineering');
  });

  it('should identify data roles', () => {
    expect(inferRole({ title: 'Data Scientist', description: '', url: '', company: '', location: '', source: '' })).toBe('data-science');
    expect(inferRole({ title: 'Data Analyst', description: '', url: '', company: '', location: '', source: '' })).toBe('data-science');
  });

  it('should identify product management', () => {
    expect(inferRole({ title: 'Product Manager', description: '', url: '', company: '', location: '', source: '' })).toBe('product-management');
  });

  it('should identify frontend/backend/fullstack', () => {
    expect(inferRole({ title: 'Frontend Developer', description: '', url: '', company: '', location: '', source: '' })).toBe('frontend-development');
    expect(inferRole({ title: 'Backend Engineer', description: '', url: '', company: '', location: '', source: '' })).toBe('backend-development');
    expect(inferRole({ title: 'Full Stack Developer', description: '', url: '', company: '', location: '', source: '' })).toBe('full-stack-development');
  });

  it('should identify cybersecurity', () => {
    expect(inferRole({ title: 'Security Analyst', description: '', url: '', company: '', location: '', source: '' })).toBe('cybersecurity');
  });

  it('should identify AI/ML roles', () => {
    expect(inferRole({ title: 'Machine Learning Engineer', description: '', url: '', company: '', location: '', source: '' })).toBe('ai-ml');
    expect(inferRole({ title: 'AI Engineer', description: '', url: '', company: '', location: '', source: '' })).toBe('ai-ml');
    // Note: "AI Researcher" matches 'research' pattern first
    expect(inferRole({ title: 'AI Researcher', description: '', url: '', company: '', location: '', source: '' })).toBe('research');
  });

  it('should return general for unclassified', () => {
    expect(inferRole({ title: 'Generic Position', description: '', url: '', company: '', location: '', source: '' })).toBe('general');
  });
});

describe('Scraper Utils - parseLocation edge cases', () => {
  it('should handle city-only input (known EU city)', () => {
    const result = parseLocation('London');
    expect(result.city).toBe('london');
    expect(result.isEU).toBe(true);
  });

  it('should normalize whitespace', () => {
    const result = parseLocation('  Berlin  ,  Germany  ');
    expect(result.isEU).toBe(true);
  });

  it('should handle partial country names', () => {
    expect(parseLocation('Madrid, Spain').isEU).toBe(true);
    expect(parseLocation('Warsaw, Poland').isEU).toBe(true);
  });

  it('should NOT mark remote-only as EU', () => {
    const result = parseLocation('Remote - Worldwide');
    expect(result.isRemote).toBe(true);
    expect(result.isEU).toBe(false);
  });

  it('should handle Nordic countries correctly', () => {
    expect(parseLocation('Copenhagen, Denmark').isEU).toBe(true);
    expect(parseLocation('Stockholm, Sweden').isEU).toBe(true);
    expect(parseLocation('Helsinki, Finland').isEU).toBe(true);
  });

  it('should detect common EU city abbreviations', () => {
    const result = parseLocation('LDN, GB');
    // GB is detected as UK
    expect(result.isEU).toBe(true);
  });
});

describe('Scraper Utils - classifyEarlyCareer edge cases', () => {
  it('should accept assistant roles', () => {
    expect(classifyEarlyCareer({ 
      title: 'Assistant Analyst', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe(true);
  });

  it('should detect fellowship programs', () => {
    expect(classifyEarlyCareer({ 
      title: 'Research Fellowship', 
      description: 'For early career researchers', 
      url: '', company: '', location: '', source: '' 
    })).toBe(true);
  });

  it('should detect apprenticeships', () => {
    expect(classifyEarlyCareer({ 
      title: 'Data Apprenticeship', 
      description: 'Learn while you work', 
      url: '', company: '', location: '', source: '' 
    })).toBe(true);
  });

  it('should reject VP/Chief/Executive roles', () => {
    expect(classifyEarlyCareer({ 
      title: 'VP of Engineering', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe(false);
    
    expect(classifyEarlyCareer({ 
      title: 'Chief Technology Officer', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe(false);
  });

  it('should reject architect roles', () => {
    expect(classifyEarlyCareer({ 
      title: 'Solutions Architect', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe(false);
  });

  it('should handle mixed signals - graduate program requiring experience', () => {
    expect(classifyEarlyCareer({ 
      title: 'Graduate Program', 
      description: 'Minimum 5 years experience', 
      url: '', company: '', location: '', source: '' 
    })).toBe(false);
  });

  it('should accept trainee with reasonable experience', () => {
    expect(classifyEarlyCareer({ 
      title: 'Trainee Developer', 
      description: '0-2 years experience', 
      url: '', company: '', location: '', source: '' 
    })).toBe(true);
  });
});

describe('Scraper Utils - inferRole comprehensive', () => {
  it('should identify sales roles', () => {
    expect(inferRole({ 
      title: 'Sales Representative', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe('sales');
  });

  it('should identify finance roles', () => {
    expect(inferRole({ 
      title: 'Finance Analyst', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe('finance');
  });

  it('should identify HR roles', () => {
    expect(inferRole({ 
      title: 'Human Resources Coordinator', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe('hr');
  });

  it('should identify operations roles', () => {
    expect(inferRole({ 
      title: 'Operations Manager', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe('operations');
  });

  it('should identify design roles', () => {
    expect(inferRole({ 
      title: 'UX Designer', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe('design');
  });

  it('should identify DevOps roles', () => {
    expect(inferRole({ 
      title: 'DevOps Engineer', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe('devops');
  });

  it('should identify mobile development', () => {
    expect(inferRole({ 
      title: 'Mobile Developer iOS', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe('mobile-development');
  });

  it('should identify QA roles', () => {
    expect(inferRole({ 
      title: 'Quality Assurance Engineer', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe('quality-assurance');
    
    expect(inferRole({ 
      title: 'Test Automation Engineer', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe('quality-assurance');
  });

  it('should identify business analytics', () => {
    expect(inferRole({ 
      title: 'Business Intelligence Analyst', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe('business-analytics');
  });

  it('should prioritize specific roles over general', () => {
    // Should match 'software engineering' before 'data science'
    expect(inferRole({ 
      title: 'Software Engineer in Data Team', 
      description: '', 
      url: '', company: '', location: '', source: '' 
    })).toBe('software-engineering');
  });
});

describe('Scraper Utils - makeJobHash edge cases', () => {
  it('should normalize multiple spaces', () => {
    const job1 = { title: 'Software   Engineer', company: 'Corp', location: 'London', description: '', url: '', source: '' };
    const job2 = { title: 'Software Engineer', company: 'Corp', location: 'London', description: '', url: '', source: '' };
    
    expect(makeJobHash(job1)).toBe(makeJobHash(job2));
  });

  it('should trim leading/trailing spaces', () => {
    const job1 = { title: '  Engineer  ', company: '  Corp  ', location: '  London  ', description: '', url: '', source: '' };
    const job2 = { title: 'Engineer', company: 'Corp', location: 'London', description: '', url: '', source: '' };
    
    expect(makeJobHash(job1)).toBe(makeJobHash(job2));
  });

  it('should generate alphanumeric hash', () => {
    const job = { title: 'Engineer', company: 'Corp', location: 'London', description: '', url: '', source: '' };
    const hash = makeJobHash(job);
    
    expect(hash).toMatch(/^[a-z0-9]+$/);
  });

  it('should generate non-empty hash', () => {
    const job = { title: 'A', company: 'B', location: 'C', description: '', url: '', source: '' };
    const hash = makeJobHash(job);
    
    expect(hash.length).toBeGreaterThan(0);
  });
});

describe('Scraper Utils - validateJob edge cases', () => {
  it('should reject whitespace-only fields', () => {
    const job = {
      title: '   ',
      company: '   ',
      location: '   ',
      description: '   ',
      url: '   ',
      source: '   '
    };
    
    const result = validateJob(job);
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should validate partial job (missing some fields)', () => {
    const job = {
      title: 'Engineer',
      company: 'Corp',
      location: '',
      description: '',
      url: '',
      source: ''
    };
    
    const result = validateJob(job);
    
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Location is required');
  });

  it('should report multiple missing fields', () => {
    const job = {
      title: 'Engineer',
      company: '',
      location: '',
      description: 'desc',
      url: '',
      source: 'test'
    };
    
    const result = validateJob(job);
    
    expect(result.errors).toContain('Company is required');
    expect(result.errors).toContain('Location is required');
    expect(result.errors).toContain('URL is required');
  });
});

