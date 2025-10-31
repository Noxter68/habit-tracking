import Logger from '@/utils/logger';
import { DEBUG_MODE, API_URL, ENVIRONMENT } from '@env';

// Default values as fallback
const defaults = {
  DEBUG_MODE: 'false',
  API_URL: 'http://localhost:3000',
  ENVIRONMENT: 'development',
};

// Create config with fallbacks
export const Config = {
  // Use imported value or fallback to default
  DEBUG_MODE: DEBUG_MODE || defaults.DEBUG_MODE,
  API_URL: API_URL || defaults.API_URL,
  ENVIRONMENT: ENVIRONMENT || defaults.ENVIRONMENT,

  // Computed values
  isDebug: (DEBUG_MODE || defaults.DEBUG_MODE) === 'true',
  isProduction: (ENVIRONMENT || defaults.ENVIRONMENT) === 'production',
  isDevelopment: (ENVIRONMENT || defaults.ENVIRONMENT) === 'development',
};
