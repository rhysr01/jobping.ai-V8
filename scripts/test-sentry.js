#!/usr/bin/env node
/**
 * Test Sentry Health Check
 * 
 * Run this script to test if Sentry is working:
 * node scripts/test-sentry.js
 */

import { getSentryHealthStatus, isSentryConfigured } from '../lib/sentry-health.js';

console.log('🔍 Checking Sentry Configuration...\n');

const status = getSentryHealthStatus();

console.log('Status:', {
  configured: status.configured ? '✅' : '❌',
  serverSide: status.serverSide ? '✅' : '❌',
  clientSide: status.clientSide ? '✅' : '❌',
  environment: status.environment,
  release: status.release,
});

if (status.configured) {
  console.log('\n✅ Sentry is configured!');
  console.log('\nTo test it fully:');
  console.log('1. Start your dev server: npm run dev');
  console.log('2. Visit: http://localhost:3000/api/test-sentry');
  console.log('3. Check your Sentry dashboard for test events');
} else {
  console.log('\n❌ Sentry is not configured');
  console.log('\nTo set it up:');
  console.log('1. Add SENTRY_DSN to your .env.local file');
  console.log('2. Or set it in Vercel → Settings → Environment Variables');
  console.log('3. Redeploy your application');
}

console.log('\n📋 Environment Variables:');
console.log(`  SENTRY_DSN: ${process.env.SENTRY_DSN ? '✅ Set' : '❌ Not set'}`);
console.log(`  NEXT_PUBLIC_SENTRY_DSN: ${process.env.NEXT_PUBLIC_SENTRY_DSN ? '✅ Set' : '❌ Not set'}`);

