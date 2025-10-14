/**
 * Tests for Zod Validation Schemas
 */

import {
  subscribeSchema,
  userSchema,
  jobSchema,
  matchSchema,
  feedbackSchema,
  promoCodeSchema
} from '@/lib/schemas';

describe('Schemas - subscribeSchema', () => {
  it('should validate valid subscribe data', () => {
    const valid = {
      email: 'test@example.com',
      name: 'John Doe',
      plan: 'free' as const
    };

    expect(() => subscribeSchema.parse(valid)).not.toThrow();
  });

  it('should reject invalid email', () => {
    const invalid = {
      email: 'not-an-email',
      name: 'John Doe'
    };

    expect(() => subscribeSchema.parse(invalid)).toThrow();
  });

  it('should reject short name', () => {
    const invalid = {
      email: 'test@example.com',
      name: 'A'
    };

    expect(() => subscribeSchema.parse(invalid)).toThrow();
  });

  it('should default plan to free', () => {
    const data = {
      email: 'test@example.com',
      name: 'John Doe'
    };

    const result = subscribeSchema.parse(data);
    expect(result.plan).toBe('free');
  });

  it('should accept premium plan', () => {
    const data = {
      email: 'test@example.com',
      name: 'John Doe',
      plan: 'premium' as const
    };

    const result = subscribeSchema.parse(data);
    expect(result.plan).toBe('premium');
  });
});

describe('Schemas - userSchema', () => {
  it('should validate valid user data', () => {
    const valid = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      full_name: 'Jane Doe',
      subscription_active: true,
      active: true,
      email_verified: true,
      created_at: '2025-01-01T00:00:00.000Z'
    };

    expect(() => userSchema.parse(valid)).not.toThrow();
  });

  it('should reject invalid UUID', () => {
    const invalid = {
      id: 'not-a-uuid',
      email: 'user@example.com',
      full_name: 'Jane Doe',
      subscription_active: true,
      active: true,
      email_verified: true,
      created_at: '2025-01-01T00:00:00.000Z'
    };

    expect(() => userSchema.parse(invalid)).toThrow();
  });

  it('should accept optional target_cities', () => {
    const data = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      full_name: 'Jane Doe',
      subscription_active: true,
      active: true,
      email_verified: true,
      target_cities: ['London', 'Berlin'],
      created_at: '2025-01-01T00:00:00.000Z'
    };

    const result = userSchema.parse(data);
    expect(result.target_cities).toEqual(['London', 'Berlin']);
  });

  it('should accept optional roles_selected', () => {
    const data = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      full_name: 'Jane Doe',
      subscription_active: true,
      active: true,
      email_verified: true,
      roles_selected: ['developer', 'engineer'],
      created_at: '2025-01-01T00:00:00.000Z'
    };

    const result = userSchema.parse(data);
    expect(result.roles_selected).toEqual(['developer', 'engineer']);
  });
});

describe('Schemas - jobSchema', () => {
  it('should validate valid job data', () => {
    const valid = {
      id: 123,
      job_hash: 'abc123',
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'London',
      job_url: 'https://example.com/job',
      source: 'mantiks',
      active: true,
      created_at: '2025-01-01T00:00:00.000Z'
    };

    expect(() => jobSchema.parse(valid)).not.toThrow();
  });

  it('should reject invalid URL', () => {
    const invalid = {
      id: 123,
      job_hash: 'abc123',
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'London',
      job_url: 'not-a-url',
      source: 'mantiks',
      active: true,
      created_at: '2025-01-01T00:00:00.000Z'
    };

    expect(() => jobSchema.parse(invalid)).toThrow();
  });

  it('should accept optional description', () => {
    const data = {
      id: 123,
      job_hash: 'abc123',
      title: 'Software Engineer',
      company: 'Tech Corp',
      location: 'London',
      description: 'Great job opportunity',
      job_url: 'https://example.com/job',
      source: 'mantiks',
      active: true,
      created_at: '2025-01-01T00:00:00.000Z'
    };

    const result = jobSchema.parse(data);
    expect(result.description).toBe('Great job opportunity');
  });
});

describe('Schemas - matchSchema', () => {
  it('should validate valid match data', () => {
    const valid = {
      id: 1,
      user_email: 'user@example.com',
      job_hash: 'abc123',
      match_score: 0.85,
      created_at: '2025-01-01T00:00:00.000Z'
    };

    expect(() => matchSchema.parse(valid)).not.toThrow();
  });

  it('should reject match_score > 1', () => {
    const invalid = {
      id: 1,
      user_email: 'user@example.com',
      job_hash: 'abc123',
      match_score: 1.5,
      created_at: '2025-01-01T00:00:00.000Z'
    };

    expect(() => matchSchema.parse(invalid)).toThrow();
  });

  it('should reject match_score < 0', () => {
    const invalid = {
      id: 1,
      user_email: 'user@example.com',
      job_hash: 'abc123',
      match_score: -0.5,
      created_at: '2025-01-01T00:00:00.000Z'
    };

    expect(() => matchSchema.parse(invalid)).toThrow();
  });

  it('should accept optional match_reason', () => {
    const data = {
      id: 1,
      user_email: 'user@example.com',
      job_hash: 'abc123',
      match_score: 0.9,
      match_reason: 'Perfect match!',
      created_at: '2025-01-01T00:00:00.000Z'
    };

    const result = matchSchema.parse(data);
    expect(result.match_reason).toBe('Perfect match!');
  });
});

describe('Schemas - feedbackSchema', () => {
  it('should validate valid feedback', () => {
    const valid = {
      action: 'positive' as const,
      job: 'abc123',
      email: 'user@example.com'
    };

    expect(() => feedbackSchema.parse(valid)).not.toThrow();
  });

  it('should accept all feedback actions', () => {
    const actions = ['positive', 'negative', 'neutral'] as const;
    
    actions.forEach(action => {
      const data = {
        action,
        job: 'abc123',
        email: 'user@example.com'
      };
      expect(() => feedbackSchema.parse(data)).not.toThrow();
    });
  });

  it('should reject invalid action', () => {
    const invalid = {
      action: 'invalid',
      job: 'abc123',
      email: 'user@example.com'
    };

    expect(() => feedbackSchema.parse(invalid)).toThrow();
  });

  it('should accept optional score', () => {
    const data = {
      action: 'positive' as const,
      score: 4,
      job: 'abc123',
      email: 'user@example.com'
    };

    const result = feedbackSchema.parse(data);
    expect(result.score).toBe(4);
  });

  it('should reject score < 1', () => {
    const invalid = {
      action: 'positive' as const,
      score: 0,
      job: 'abc123',
      email: 'user@example.com'
    };

    expect(() => feedbackSchema.parse(invalid)).toThrow();
  });

  it('should reject score > 5', () => {
    const invalid = {
      action: 'positive' as const,
      score: 6,
      job: 'abc123',
      email: 'user@example.com'
    };

    expect(() => feedbackSchema.parse(invalid)).toThrow();
  });
});

describe('Schemas - promoCodeSchema', () => {
  it('should validate valid promo code', () => {
    const valid = {
      email: 'user@example.com',
      code: 'SAVE20'
    };

    expect(() => promoCodeSchema.parse(valid)).not.toThrow();
  });

  it('should reject short code', () => {
    const invalid = {
      email: 'user@example.com',
      code: 'AB'
    };

    expect(() => promoCodeSchema.parse(invalid)).toThrow();
  });

  it('should reject long code', () => {
    const invalid = {
      email: 'user@example.com',
      code: 'A'.repeat(51)
    };

    expect(() => promoCodeSchema.parse(invalid)).toThrow();
  });

  it('should accept 3-character code', () => {
    const data = {
      email: 'user@example.com',
      code: 'ABC'
    };

    expect(() => promoCodeSchema.parse(data)).not.toThrow();
  });

  it('should accept 50-character code', () => {
    const data = {
      email: 'user@example.com',
      code: 'A'.repeat(50)
    };

    expect(() => promoCodeSchema.parse(data)).not.toThrow();
  });
});

describe('Schemas - Edge Cases', () => {
  it('should reject malformed datetime strings', () => {
    const invalid = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      full_name: 'Jane Doe',
      subscription_active: true,
      active: true,
      email_verified: true,
      created_at: 'not-a-datetime'
    };

    expect(() => userSchema.parse(invalid)).toThrow();
  });

  it('should handle empty arrays in user schema', () => {
    const data = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'user@example.com',
      full_name: 'Jane Doe',
      subscription_active: true,
      active: true,
      email_verified: true,
      target_cities: [],
      roles_selected: [],
      created_at: '2025-01-01T00:00:00.000Z'
    };

    const result = userSchema.parse(data);
    expect(result.target_cities).toEqual([]);
    expect(result.roles_selected).toEqual([]);
  });

  it('should handle boundary match scores', () => {
    const min = {
      id: 1,
      user_email: 'user@example.com',
      job_hash: 'abc123',
      match_score: 0,
      created_at: '2025-01-01T00:00:00.000Z'
    };

    const max = {
      id: 1,
      user_email: 'user@example.com',
      job_hash: 'abc123',
      match_score: 1,
      created_at: '2025-01-01T00:00:00.000Z'
    };

    expect(() => matchSchema.parse(min)).not.toThrow();
    expect(() => matchSchema.parse(max)).not.toThrow();
  });
});

