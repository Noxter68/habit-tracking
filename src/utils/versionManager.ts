import AsyncStorage from '@react-native-async-storage/async-storage';
import appConfig from '../../app.json';

const STORAGE_KEY = '@app_last_seen_version';

export const versionManager = {
  getCurrentVersion: (): string => {
    return appConfig.expo.version;
  },

  getLastSeenVersion: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error reading version:', error);
      return null;
    }
  },

  setLastSeenVersion: async (version: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, version);
    } catch (error) {
      console.error('Error saving version:', error);
    }
  },

  // Pour forcer la réapparition de la modal (utile pour tester)
  clearLastSeenVersion: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      console.log('Version history cleared - modal will show again');
    } catch (error) {
      console.error('Error clearing version:', error);
    }
  },

  compareVersions: (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;

      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    return 0;
  },

  shouldShowUpdate: async (): Promise<boolean> => {
    const currentVersion = versionManager.getCurrentVersion();
    const lastSeenVersion = await versionManager.getLastSeenVersion();

    if (!lastSeenVersion) return true;

    return versionManager.compareVersions(currentVersion, lastSeenVersion) > 0;
  },
};
