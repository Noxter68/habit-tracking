// src/config/index.ts
import { DEBUG_MODE, API_URL, ENVIRONMENT } from '@env';

// Fallback values
const defaults = {
  DEBUG_MODE: 'false',
  API_URL: 'http://localhost:3000',
  ENVIRONMENT: 'development',
};

// Parse environment variables with fallbacks
const debugMode = (DEBUG_MODE || defaults.DEBUG_MODE) === 'true';
const apiUrl = API_URL || defaults.API_URL;
const environment = ENVIRONMENT || defaults.ENVIRONMENT;

export const Config = {
  // Debug settings
  debug: {
    enabled: debugMode,
    showDebugScreen: debugMode,
    showTestButtons: debugMode,
    logNetworkRequests: debugMode,
    showPerformanceMonitor: debugMode,
  },

  // API settings
  api: {
    baseUrl: apiUrl,
    timeout: 30000,
    retryAttempts: 3,
  },

  // Environment
  env: {
    name: environment,
    isDev: environment === 'development',
    isStaging: environment === 'staging',
    isProd: environment === 'production',
  },

  // Computed values
  isDebug: debugMode,
  isProduction: environment === 'production',
  isDevelopment: environment === 'development',
} as const;
