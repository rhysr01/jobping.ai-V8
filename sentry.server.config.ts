import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
  debug: process.env.NODE_ENV === 'development',
  
  // Performance monitoring
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app: undefined }),
  ],
  
  // Custom tags for debugging
  beforeSend(event) {
    // Add custom context for server-side errors
    event.tags = {
      ...event.tags,
      service: 'jobping-api',
      platform: 'server'
    };
    
    // Add user context if available
    if (event.user) {
      event.tags.user_type = 'student';
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
