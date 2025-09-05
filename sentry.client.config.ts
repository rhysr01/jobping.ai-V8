import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  debug: process.env.NODE_ENV === 'development',
  
  // Performance monitoring
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/jobping\.ai/,
        /^https:\/\/.*\.vercel\.app/,
      ],
    }),
  ],
  
  // Custom tags for debugging
  beforeSend(event) {
    // Add custom context
    if (event.user) {
      event.tags = {
        ...event.tags,
        user_type: 'student',
        platform: 'web'
      };
    }
    return event;
  },
  
  // Filter out noise
  beforeBreadcrumb(breadcrumb) {
    // Filter out console logs in production
    if (process.env.NODE_ENV === 'production' && breadcrumb.category === 'console') {
      return null;
    }
    return breadcrumb;
  }
});
