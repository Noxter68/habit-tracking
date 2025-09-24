import { AppConfig } from '../config/appConfig';

export const useAppConfig = () => {
  return AppConfig;
};

export const useDebugMode = () => {
  return AppConfig.debug.enabled;
};
