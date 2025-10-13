import { GET } from '@/app/api/health/route';

// Mock the health checker
jest.mock('@/Utils/monitoring/healthChecker', () => ({
  healthChecker: {
    performHealthCheck: jest.fn(() => Promise.resolve({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'healthy', responseTime: 50 },
        redis: { status: 'healthy', responseTime: 10 },
      },
      duration: 60
    }))
  }
}));

describe('GET /api/health', () => {
  it('returns 200 status for healthy system', async () => {
    const response = await GET();
    
    expect(response.status).toBe(200);
  });

  it('returns health status object', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('checks');
    expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
  });

  it('includes system checks', async () => {
    const response = await GET();
    const data = await response.json();
    
    expect(data).toHaveProperty('checks');
    expect(data.checks).toHaveProperty('database');
    expect(data.duration).toBeGreaterThanOrEqual(0);
  });

  it('returns 503 for unhealthy system', async () => {
    const { healthChecker } = require('@/Utils/monitoring/healthChecker');
    healthChecker.performHealthCheck.mockResolvedValueOnce({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'unhealthy', error: 'Connection failed' }
      }
    });

    const response = await GET();
    
    expect(response.status).toBe(503);
  });

  it('returns 200 for degraded system', async () => {
    const { healthChecker } = require('@/Utils/monitoring/healthChecker');
    healthChecker.performHealthCheck.mockResolvedValueOnce({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'healthy' },
        redis: { status: 'degraded', responseTime: 500 }
      }
    });

    const response = await GET();
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.status).toBe('degraded');
  });
});

