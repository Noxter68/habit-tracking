// src/hooks/useAppConfig.ts
import { Config } from '../config';

/**
 * Hook to access app configuration
 * Uses environment variables from .env file
 */
export const useAppConfig = () => {
  return Config;
};

/**
 * Hook to check if debug mode is enabled
 * @returns boolean - true if DEBUG_MODE=true in .env
 */
export const useDebugMode = () => {
  return Config.debug.enabled;
};
