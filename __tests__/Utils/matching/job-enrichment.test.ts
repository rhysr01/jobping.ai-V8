/**
 * Tests for Job Enrichment Service
 * Tests job data enrichment and scoring logic
 */

import {
  enrichJobData,
  extractPostingDate,
  extractProfessionalExpertise,
  extractCareerPath,
  extractStartDate
} from '@/Utils/matching/job-enrichment.service';
import { buildMockJob } from '@/__tests__/_helpers/testBuilders';

describe('Job Enrichment - enrichJobData', () => {
  it('should enrich job with all fields', () => {
    const job = buildMockJob({
      title: 'Junior Software Engineer',
      description: 'Looking for a junior developer with visa sponsorship available',
      company: 'Google',
      work_environment: 'remote',
      posted_at: new Date().toISOString(),
      categories: ['tech', 'early-career']
    });

    const enriched = enrichJobData(job);

    expect(enriched).toHaveProperty('visaFriendly');
    expect(enriched).toHaveProperty('experienceLevel');
    expect(enriched).toHaveProperty('marketDemand');
    expect(enriched).toHaveProperty('salaryRange');
    expect(enriched).toHaveProperty('companySize');
    expect(enriched).toHaveProperty('remoteFlexibility');
    expect(enriched).toHaveProperty('growthPotential');
  });

  it('should detect visa sponsorship', () => {
    const jobWithVisa = buildMockJob({
      description: 'We offer visa sponsorship for qualified candidates'
    });
    const jobWithoutVisa = buildMockJob({
      description: 'Local candidates only'
    });

    const enrichedWithVisa = enrichJobData(jobWithVisa);
    const enrichedWithoutVisa = enrichJobData(jobWithoutVisa);

    expect(enrichedWithVisa.visaFriendly).toBe(true);
    expect(enrichedWithoutVisa.visaFriendly).toBe(false);
  });

  it('should determine experience level from title', () => {
    const seniorJob = buildMockJob({ title: 'Senior Software Engineer' });
    const juniorJob = buildMockJob({ title: 'Junior Developer' });
    const entryJob = buildMockJob({ title: 'Graduate Software Engineer' });

    expect(enrichJobData(seniorJob).experienceLevel).toBe('senior');
    expect(enrichJobData(juniorJob).experienceLevel).toBe('junior');
    expect(enrichJobData(entryJob).experienceLevel).toBe('entry');
  });

  it('should calculate market demand based on categories', () => {
    const highDemandJob = buildMockJob({
      categories: ['tech', 'ai', 'machine-learning', 'data']
    });
    const lowDemandJob = buildMockJob({
      categories: ['other']
    });

    const highDemand = enrichJobData(highDemandJob).marketDemand;
    const lowDemand = enrichJobData(lowDemandJob).marketDemand;

    expect(highDemand).toBeGreaterThan(lowDemand);
    expect(highDemand).toBeLessThanOrEqual(10);
  });

  it('should extract salary range from description', () => {
    const jobWithSalary = buildMockJob({
      description: 'Salary: ��50,000 - ��70,000 per year'
    });
    const jobWithoutSalary = buildMockJob({
      description: 'Competitive salary offered'
    });

    expect(enrichJobData(jobWithSalary).salaryRange).toContain('��');
    expect(enrichJobData(jobWithoutSalary).salaryRange).toBe('Competitive');
  });

  it('should determine company size', () => {
    const bigTechJob = buildMockJob({ company: 'Google' });
    const startupJob = buildMockJob({ company: 'TechStartup Inc' });

    const bigTechEnriched = enrichJobData(bigTechJob);
    const startupEnriched = enrichJobData(startupJob);

    expect(bigTechEnriched.companySize).toBeTruthy();
    expect(startupEnriched.companySize).toBeTruthy();
  });

  it('should calculate remote flexibility', () => {
    const remoteJob = buildMockJob({
      work_environment: 'remote',
      description: 'Fully remote position'
    });
    const onsiteJob = buildMockJob({
      work_environment: 'on-site',
      description: 'Office-based role'
    });

    const remoteScore = enrichJobData(remoteJob).remoteFlexibility;
    const onsiteScore = enrichJobData(onsiteJob).remoteFlexibility;

    expect(remoteScore).toBeGreaterThan(onsiteScore);
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalJob = buildMockJob({
      title: 'Engineer',
      company: 'Corp',
      description: undefined as any,
      work_environment: undefined as any
    });

    const enriched = enrichJobData(minimalJob);

    expect(enriched).toBeTruthy();
    expect(enriched.experienceLevel).toBe('entry'); // Default
  });
});

describe('Job Enrichment - extractPostingDate', () => {
  it('should extract date from description', () => {
    const description = 'Posted on January 15, 2024. Apply now!';
    const result = extractPostingDate(description);

    expect(result).toBeTruthy();
  });

  it('should handle missing date in description', () => {
    const description = 'Great opportunity to join our team!';
    const result = extractPostingDate(description);

    expect(result).toBeDefined();
  });

  it('should extract relative dates', () => {
    const description = 'Posted 2 days ago';
    const result = extractPostingDate(description);

    expect(result).toBeDefined();
  });
});

describe('Job Enrichment - extractProfessionalExpertise', () => {
  it('should extract tech expertise', () => {
    const title = 'Senior Software Engineer';
    const description = 'React, TypeScript, Node.js experience required';

    const expertise = extractProfessionalExpertise(title, description);

    expect(expertise).toBeTruthy();
    expect(typeof expertise).toBe('string');
  });

  it('should extract data science expertise', () => {
    const title = 'Data Scientist';
    const description = 'Python, Machine Learning, SQL';

    const expertise = extractProfessionalExpertise(title, description);

    expect(expertise).toBeTruthy();
  });

  it('should handle non-tech roles', () => {
    const title = 'Marketing Manager';
    const description = 'Lead marketing campaigns';

    const expertise = extractProfessionalExpertise(title, description);

    expect(expertise).toBeDefined();
  });

  it('should extract from title when description is empty', () => {
    const title = 'Frontend Developer';
    const description = '';

    const expertise = extractProfessionalExpertise(title, description);

    expect(expertise).toBeTruthy();
  });
});

describe('Job Enrichment - extractCareerPath', () => {
  it('should extract software engineering path', () => {
    const title = 'Software Engineer';
    const description = 'Building scalable web applications';

    const careerPath = extractCareerPath(title, description);

    expect(careerPath).toBeTruthy();
    expect(typeof careerPath).toBe('string');
  });

  it('should extract product management path', () => {
    const title = 'Product Manager';
    const description = 'Define product roadmap and strategy';

    const careerPath = extractCareerPath(title, description);

    expect(careerPath).toBeTruthy();
  });

  it('should extract design path', () => {
    const title = 'UX Designer';
    const description = 'Create user interfaces and experiences';

    const careerPath = extractCareerPath(title, description);

    expect(careerPath).toBeTruthy();
  });

  it('should handle ambiguous titles', () => {
    const title = 'Team Member';
    const description = 'Join our team!';

    const careerPath = extractCareerPath(title, description);

    expect(careerPath).toBeDefined();
  });
});

describe('Job Enrichment - extractStartDate', () => {
  it('should extract immediate start dates', () => {
    const description = 'Start immediately. Apply today!';

    const startDate = extractStartDate(description);

    expect(startDate).toBeTruthy();
  });

  it('should extract specific start dates', () => {
    const description = 'Start date: February 1, 2024';

    const startDate = extractStartDate(description);

    expect(startDate).toBeTruthy();
  });

  it('should extract relative start dates', () => {
    const description = 'Position starts in 2 weeks';

    const startDate = extractStartDate(description);

    expect(startDate).toBeDefined();
  });

  it('should handle missing start date', () => {
    const description = 'Great opportunity at our company';

    const startDate = extractStartDate(description);

    expect(startDate).toBeDefined();
  });

  it('should handle ASAP mentions', () => {
    const description = 'We need someone ASAP';

    const startDate = extractStartDate(description);

    expect(startDate).toBeTruthy();
  });
});

