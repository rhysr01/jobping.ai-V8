import {
  getBaseUrl,
  getEmailDomain,
  getCanonicalDomain,
  getUnsubscribeEmail,
  getUnsubscribeUrl,
  getListUnsubscribeHeader,
} from '@/Utils/url-helpers';

describe('url-helpers', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getBaseUrl', () => {
    it('should use NEXT_PUBLIC_URL if set', () => {
      process.env.NEXT_PUBLIC_URL = 'https://custom.example.com';
      delete process.env.NEXT_PUBLIC_DOMAIN;
      delete process.env.VERCEL_URL;
      expect(getBaseUrl()).toBe('https://custom.example.com');
    });

    it('should use NEXT_PUBLIC_DOMAIN if NEXT_PUBLIC_URL not set', () => {
      delete process.env.NEXT_PUBLIC_URL;
      process.env.NEXT_PUBLIC_DOMAIN = 'https://domain.example.com';
      delete process.env.VERCEL_URL;
      expect(getBaseUrl()).toBe('https://domain.example.com');
    });

    it('should use VERCEL_URL if other vars not set', () => {
      delete process.env.NEXT_PUBLIC_URL;
      delete process.env.NEXT_PUBLIC_DOMAIN;
      process.env.VERCEL_URL = 'app.vercel.app';
      expect(getBaseUrl()).toBe('https://app.vercel.app');
    });

    it('should return default if no env vars set', () => {
      delete process.env.NEXT_PUBLIC_URL;
      delete process.env.NEXT_PUBLIC_DOMAIN;
      delete process.env.VERCEL_URL;
      expect(getBaseUrl()).toBe('https://getjobping.com');
    });
  });

  describe('getEmailDomain', () => {
    it('should use EMAIL_DOMAIN if set', () => {
      process.env.EMAIL_DOMAIN = 'custom.example.com';
      expect(getEmailDomain()).toBe('custom.example.com');
    });

    it('should return default if EMAIL_DOMAIN not set', () => {
      delete process.env.EMAIL_DOMAIN;
      expect(getEmailDomain()).toBe('getjobping.com');
    });

    it('should trim whitespace', () => {
      process.env.EMAIL_DOMAIN = '  custom.example.com  ';
      expect(getEmailDomain()).toBe('custom.example.com');
    });
  });

  describe('getCanonicalDomain', () => {
    it('should always return canonical domain', () => {
      expect(getCanonicalDomain()).toBe('getjobping.com');
    });
  });

  describe('getUnsubscribeEmail', () => {
    it('should use EMAIL_DOMAIN if set', () => {
      process.env.EMAIL_DOMAIN = 'custom.example.com';
      expect(getUnsubscribeEmail()).toBe('unsubscribe@custom.example.com');
    });

    it('should use default domain if EMAIL_DOMAIN not set', () => {
      delete process.env.EMAIL_DOMAIN;
      expect(getUnsubscribeEmail()).toBe('unsubscribe@getjobping.com');
    });
  });

  describe('getUnsubscribeUrl', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_URL = 'https://example.com';
    });

    it('should generate unsubscribe URL with encoded email', () => {
      const url = getUnsubscribeUrl('test@example.com');
      expect(url).toBe('https://example.com/api/unsubscribe/one-click?email=test%40example.com');
    });

    it('should handle email with special characters', () => {
      const url = getUnsubscribeUrl('test+tag@example.com');
      expect(url).toContain('test%2Btag%40example.com');
    });

    it('should use correct base URL', () => {
      process.env.NEXT_PUBLIC_URL = 'https://custom.example.com';
      const url = getUnsubscribeUrl('test@example.com');
      expect(url).toContain('https://custom.example.com');
    });
  });

  describe('getListUnsubscribeHeader', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_URL = 'https://example.com';
      process.env.EMAIL_DOMAIN = 'example.com';
    });

    it('should generate List-Unsubscribe header', () => {
      const header = getListUnsubscribeHeader();
      expect(header).toContain('https://example.com/api/email/unsubscribe');
      expect(header).toContain('mailto:unsubscribe@example.com');
    });

    it('should include email placeholder', () => {
      const header = getListUnsubscribeHeader();
      expect(header).toContain('{email}');
    });
  });
});

