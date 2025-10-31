const IS_DEBUG_MODE = true;

export const AppConfig = {
  // Debug settings
  debug: {
    enabled: IS_DEBUG_MODE,
    showDebugScreen: IS_DEBUG_MODE,
    showTestButtons: IS_DEBUG_MODE,
    logNetworkRequests: IS_DEBUG_MODE,
    showPerformanceMonitor: IS_DEBUG_MODE,
  },

  // API settings
  api: {
    baseUrl: 'http://localhost:3000',
    timeout: 30000,
    retryAttempts: 3,
  },

  // Environment
  env: {
    name: 'development',
    isDev: true,
    isStaging: false,
    isProd: false,
  },
} as const;
