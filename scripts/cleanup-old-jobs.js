#!/usr/bin/env node

/**
 * DEPRECATED: This file is kept for backwards compatibility only.
 * Please use scripts/cleanup-jobs.js instead.
 * 
 * This wrapper simply redirects to the new script.
 */

console.log('⚠️  Warning: cleanup-old-jobs.js is deprecated. Use cleanup-jobs.js instead.');
console.log('🔄 Redirecting to scripts/cleanup-jobs.js...\n');

// Import and run the actual cleanup script
require('./cleanup-jobs.js');
