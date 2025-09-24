export const AppConfig = {
  // Debug settings
  debug: {
    enabled: process.env.DEBUG_MODE === 'true' || __DEV__,
    showDebugScreen: process.env.DEBUG_MODE === 'true',
    logNetworkRequests: process.env.DEBUG_MODE === 'true',
    showPerformanceMonitor: __DEV__,
  },

  // API settings
  api: {
    baseUrl: process.env.API_URL || 'http://localhost:3000',
    timeout: 30000,
    retryAttempts: 3,
  },

  // Feature flags
  features: {
    dailyChallenge: true,
    debugTools: process.env.DEBUG_MODE === 'true',
    analytics: process.env.ENVIRONMENT === 'production',
  },

  // Environment
  env: {
    name: process.env.ENVIRONMENT || 'development',
    isDev: process.env.ENVIRONMENT === 'development' || __DEV__,
    isStaging: process.env.ENVIRONMENT === 'staging',
    isProd: process.env.ENVIRONMENT === 'production',
  },
} as const;
