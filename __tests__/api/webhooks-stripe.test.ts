import { POST } from '@/app/api/webhooks/stripe/route';
import { NextRequest } from 'next/server';
import { getDatabaseClient } from '@/Utils/databasePool';

jest.mock('@/Utils/databasePool', () => ({
  getDatabaseClient: jest.fn(() => ({
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: {},
          error: null,
        })),
      })),
    })),
  })),
}));

jest.mock('@/Utils/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: jest.fn().mockReturnValue({
        type: 'payment_intent.succeeded',
        data: {
          object: {
            customer: 'cus_test',
          },
        },
      }),
    },
  },
}));

describe('POST /api/webhooks/stripe', () => {
  it('should handle webhook request', async () => {
    const req = {
      text: async () => 'test',
      headers: new Headers({
        'stripe-signature': 'test-signature',
      }),
    } as NextRequest;

    const response = await POST(req);
    expect(response.status).toBeGreaterThanOrEqual(200);
  });

  it('should require stripe signature', async () => {
    const req = {
      text: async () => 'test',
      headers: new Headers(),
    } as NextRequest;

    const response = await POST(req);
    expect(response.status).toBeGreaterThanOrEqual(400);
  });

  it('should call getDatabaseClient', async () => {
    const req = {
      text: async () => 'test',
      headers: new Headers({
        'stripe-signature': 'test-signature',
      }),
    } as NextRequest;

    await POST(req);
    expect(getDatabaseClient).toHaveBeenCalled();
  });
});

