//  OPTIMIZED EMAIL MODULE EXPORTS - PRODUCTION READY

// Types
export * from './types';

// Core functions - OPTIMIZED VERSION
export { 
  sendWelcomeEmail, 
  sendMatchedJobsEmail, 
  sendBatchEmails,
  EMAIL_PERFORMANCE_METRICS 
} from './sender';

// Templates - GMAIL-OPTIMIZED (Light background, high contrast, large text, no emojis)
// export { 
//   createWelcomeEmailOptimized as createWelcomeEmail, 
//   createJobMatchesEmailOptimized as createJobMatchesEmail
// } from './textGenerator';

// Production-ready templates (brand aligned + VML fallbacks)
export { 
  createWelcomeEmail, 
  createJobMatchesEmail 
} from './productionReadyTemplates';

// Clients (if needed externally)
export { getResendClient, getSupabaseClient, EMAIL_CONFIG } from './clients';

// Feedback system integration
export { EmailFeedbackIntegration, emailFeedbackHelpers } from './feedbackIntegration';

// Email preview system
export { EmailPreviewSystem, emailPreview } from './emailPreview';

// Performance monitoring
export { EMAIL_PERFORMANCE_METRICS as performanceMetrics } from './sender';
