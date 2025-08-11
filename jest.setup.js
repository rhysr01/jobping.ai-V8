require('@testing-library/jest-dom');

// Polyfill for TextEncoder/TextDecoder (required for cheerio and other web APIs)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill for crypto.randomUUID (required for Node.js < 19)
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => require('crypto').randomUUID(),
  };
}

// Polyfill for ReadableStream (required for undici/fetch)
if (!global.ReadableStream) {
  global.ReadableStream = class ReadableStream {
    constructor() {
      // Mock implementation
    }
  };
}

// Polyfill for WritableStream (required for undici/fetch)
if (!global.WritableStream) {
  global.WritableStream = class WritableStream {
    constructor() {
      // Mock implementation
    }
  };
}

// Polyfill for TransformStream (required for undici/fetch)
if (!global.TransformStream) {
  global.TransformStream = class TransformStream {
    constructor() {
      // Mock implementation
    }
  };
}

// Polyfill for MessagePort (required for undici/fetch)
if (!global.MessagePort) {
  global.MessagePort = class MessagePort {
    constructor() {
      // Mock implementation
    }
  };
}

// Polyfill for MessageChannel (required for undici/fetch)
if (!global.MessageChannel) {
  global.MessageChannel = class MessageChannel {
    constructor() {
      this.port1 = new global.MessagePort();
      this.port2 = new global.MessagePort();
    }
  };
}

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.RESEND_API_KEY = 'test-resend-key';
process.env.NEXT_PUBLIC_URL = 'http://localhost:3000';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(url, options = {}) {
      this._url = url;
      this._method = options.method || 'GET';
      this._headers = new Map(Object.entries(options.headers || {}));
      this._body = options.body;
    }
    
    get url() {
      return this._url;
    }
    
    get method() {
      return this._method;
    }
    
    get headers() {
      return this._headers;
    }
    
    json() {
      return Promise.resolve(JSON.parse(this._body || '{}'));
    }
  },
  NextResponse: {
    json: jest.fn((data, options = {}) => ({
      json: () => Promise.resolve(data),
      status: options.status || 200,
      headers: new Map(Object.entries(options.headers || {})),
    })),
  },
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '/';
  },
}));

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      gte: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      upsert: jest.fn(() => Promise.resolve({ error: null })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      update: jest.fn(() => Promise.resolve({ error: null })),
      delete: jest.fn(() => Promise.resolve({ error: null })),
    })),
    auth: {
      signUp: jest.fn(() => Promise.resolve({ data: null, error: null })),
      signIn: jest.fn(() => Promise.resolve({ data: null, error: null })),
    },
  })),
}));

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn(() => Promise.resolve({
          choices: [{ message: { content: 'test response' } }],
        })),
      },
    },
  })),
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    isOpen: true,
    on: jest.fn(),
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    zAdd: jest.fn(() => Promise.resolve(1)),
    zCard: jest.fn(() => Promise.resolve(0)),
    zRemRangeByScore: jest.fn(() => Promise.resolve(0)),
  })),
}));

// Mock EnhancedRateLimiter
jest.mock('@/Utils/enhancedRateLimiter', () => ({
  EnhancedRateLimiter: {
    getInstance: jest.fn(() => ({
      checkLimit: jest.fn(() => Promise.resolve({ allowed: true, remaining: 10 })),
    })),
  },
}));

// Mock PerformanceMonitor
jest.mock('@/Utils/performanceMonitor', () => ({
  PerformanceMonitor: {
    trackDuration: jest.fn(),
    logPerformanceReport: jest.fn(),
  },
}));

// Mock AdvancedMonitoring
jest.mock('@/Utils/advancedMonitoring', () => ({
  AdvancedMonitoringOracle: {
    analyzeSystemHealth: jest.fn(() => Promise.resolve({ status: 'healthy' })),
    generateDailyReport: jest.fn(() => Promise.resolve({ health: { overall: 'healthy' } })),
  },
}));

// Mock AutoScaling
jest.mock('@/Utils/autoScaling', () => ({
  AutoScalingOracle: {
    checkScalingNeeds: jest.fn(() => Promise.resolve([])),
    implementRecommendation: jest.fn(() => Promise.resolve()),
  },
}));

// Mock UserSegmentation
jest.mock('@/Utils/userSegmentation', () => ({
  UserSegmentationOracle: {
    analyzeUserBehavior: jest.fn(() => Promise.resolve({ segmentDistribution: {} })),
    getUserAnalysis: jest.fn(() => Promise.resolve({ engagementScore: 0.5, segments: [], recommendations: [] })),
  },
}));

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn(() => ({
    emails: {
      send: jest.fn(() => Promise.resolve({ id: 'test-id' })),
    },
  })),
}));

// Global test utilities
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
