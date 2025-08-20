// Scraper Configuration and Feature Flags
// Enable/disable scrapers via env flags and manage debug modes

export interface ScraperConfig {
  // Platform toggles
  enableGreenhouse: boolean;
  enableLever: boolean;
  enableWorkday: boolean;
  enableRemoteOK: boolean;
  enableReliableScrapers: boolean;
  enableUniversityScrapers: boolean;
  
  // Feature flags
  debugMode: boolean;
  enableTelemetry: boolean;
  enableRateLimiting: boolean;
  enableBrowserPool: boolean;
  enableEmails: boolean;
  
  // Batch processing
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
  
  // Rate limiting
  requestsPerMinute: number;
  requestsPerHour: number;
  
  // Debug settings
  logSampleTitles: boolean;
  logFunnelCounts: boolean;
  logRawData: boolean;
}

export function getScraperConfig(): ScraperConfig {
  return {
    // Platform toggles (env-based)
    enableGreenhouse: process.env.ENABLE_GREENHOUSE_SCRAPER !== 'false',
    enableLever: process.env.ENABLE_LEVER_SCRAPER !== 'false',
    enableWorkday: process.env.ENABLE_WORKDAY_SCRAPER !== 'false',
    enableRemoteOK: process.env.ENABLE_REMOTEOK_SCRAPER !== 'false',
    enableReliableScrapers: process.env.ENABLE_RELIABLE_SCRAPERS !== 'false',
    enableUniversityScrapers: process.env.ENABLE_UNI_SCRAPERS === 'true',
    
    // Feature flags
    debugMode: process.env.SCRAPER_DEBUG_MODE === 'true',
    enableTelemetry: process.env.ENABLE_SCRAPER_TELEMETRY !== 'false',
    enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
    enableBrowserPool: process.env.ENABLE_BROWSER_POOL !== 'false',
    enableEmails: process.env.ENABLE_EMAILS !== 'false',
    
    // Batch processing
    batchSize: parseInt(process.env.SCRAPER_BATCH_SIZE || '100'),
    maxRetries: parseInt(process.env.SCRAPER_MAX_RETRIES || '3'),
    retryDelay: parseInt(process.env.SCRAPER_RETRY_DELAY || '2000'),
    
    // Rate limiting
    requestsPerMinute: parseInt(process.env.SCRAPER_REQUESTS_PER_MINUTE || '30'),
    requestsPerHour: parseInt(process.env.SCRAPER_REQUESTS_PER_HOUR || '1000'),
    
    // Debug settings
    logSampleTitles: process.env.SCRAPER_DEBUG_MODE === 'true',
    logFunnelCounts: process.env.SCRAPER_DEBUG_MODE === 'true',
    logRawData: process.env.SCRAPER_LOG_RAW_DATA === 'true'
  };
}

export function isPlatformEnabled(platform: string): boolean {
  const config = getScraperConfig();
  
  switch (platform.toLowerCase()) {
    case 'greenhouse':
      return config.enableGreenhouse;
    case 'lever':
      return config.enableLever;
    case 'workday':
      return config.enableWorkday;
    case 'remoteok':
      return config.enableRemoteOK;
    case 'reliable':
      return config.enableReliableScrapers;
    case 'university':
      return config.enableUniversityScrapers;
    default:
      return true; // Default to enabled for unknown platforms
  }
}

export function logScraperConfig(): void {
  const config = getScraperConfig();
  
  console.log('🔧 Scraper Configuration:');
  console.log(`   Platforms:`);
  console.log(`     Greenhouse: ${config.enableGreenhouse ? '✅' : '❌'}`);
  console.log(`     Lever: ${config.enableLever ? '✅' : '❌'}`);
  console.log(`     Workday: ${config.enableWorkday ? '✅' : '❌'}`);
  console.log(`     RemoteOK: ${config.enableRemoteOK ? '✅' : '❌'}`);
  console.log(`     Reliable: ${config.enableReliableScrapers ? '✅' : '❌'}`);
  console.log(`     University: ${config.enableUniversityScrapers ? '✅' : '❌'}`);
  console.log(`   Features:`);
  console.log(`     Debug Mode: ${config.debugMode ? '✅' : '❌'}`);
  console.log(`     Telemetry: ${config.enableTelemetry ? '✅' : '❌'}`);
  console.log(`     Rate Limiting: ${config.enableRateLimiting ? '✅' : '❌'}`);
  console.log(`     Browser Pool: ${config.enableBrowserPool ? '✅' : '❌'}`);
  console.log(`   Settings:`);
  console.log(`     Batch Size: ${config.batchSize}`);
  console.log(`     Max Retries: ${config.maxRetries}`);
  console.log(`     Requests/Min: ${config.requestsPerMinute}`);
}

// Platform-specific configurations
export const PLATFORM_CONFIGS = {
  greenhouse: {
    name: 'Greenhouse',
    baseDelay: 2000,
    maxConcurrent: 3,
    timeout: 15000,
    selectors: ['.opening', '.job-post', '.position', '[data-job-id]', '.careers-job']
  },
  lever: {
    name: 'Lever',
    baseDelay: 1500,
    maxConcurrent: 5,
    timeout: 12000,
    selectors: ['.posting', '.job', '.position', '[data-posting-id]']
  },
  workday: {
    name: 'Workday',
    baseDelay: 3000,
    maxConcurrent: 2,
    timeout: 20000,
    selectors: ['.job', '.position', '[data-automation-id]', '.careers-job']
  },
  remoteok: {
    name: 'RemoteOK',
    baseDelay: 1000,
    maxConcurrent: 10,
    timeout: 10000,
    apiEndpoint: 'https://remoteok.io/api'
  }
};

export function getPlatformConfig(platform: string) {
  return PLATFORM_CONFIGS[platform as keyof typeof PLATFORM_CONFIGS] || {
    name: platform,
    baseDelay: 2000,
    maxConcurrent: 5,
    timeout: 15000,
    selectors: []
  };
}
