import type { Config } from '@lhci/cli';

const config: Config = {
  ci: {
    collect: {
      url: ['http://localhost:4173/'],
      startServerCommand: 'npm run build:prod',
      startServerReadyPattern: 'ready on',
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'metrics:lcp': ['error', { maxNumericValue: 2500 }],
        'metrics:cls': ['error', { maxNumericValue: 0.1 }],
        'metrics:tbt': ['error', { maxNumericValue: 200 }],
      },
    },
  },
};

export default config;

