import { AppConfig } from '../config/appConfig';

export const useDebugMode = () => {
  return {
    isEnabled: AppConfig.debug.enabled,
    showTestButtons: AppConfig.debug.showTestButtons,
    showDebugScreen: AppConfig.debug.showDebugScreen,
    environment: AppConfig.env.name,
  };
};
