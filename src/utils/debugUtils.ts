// src/utils/debugUtils.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Debug utilities for development and testing
 * These should be removed or disabled in production
 */
export const DebugUtils = {
  /**
   * Clear daily challenge data for a specific user
   */
  clearDailyChallengeForUser: async (userId: string): Promise<void> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const collectedKey = `daily_challenge_${userId}_${today}`;
      await AsyncStorage.removeItem(collectedKey);
      console.log(`✅ Cleared daily challenge for user ${userId} on ${today}`);
    } catch (error) {
      console.error('❌ Error clearing daily challenge:', error);
    }
  },

  /**
   * Clear all daily challenge data (for all users and dates)
   */
  clearAllDailyChallenges: async (): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const dailyChallengeKeys = keys.filter((key) => key.startsWith('daily_challenge_'));

      if (dailyChallengeKeys.length > 0) {
        await AsyncStorage.multiRemove(dailyChallengeKeys);
        console.log(`✅ Cleared ${dailyChallengeKeys.length} daily challenge entries`);
      } else {
        console.log('ℹ️ No daily challenge data to clear');
      }
    } catch (error) {
      console.error('❌ Error clearing all daily challenges:', error);
    }
  },

  /**
   * View current daily challenge status for a user
   */
  viewDailyChallengeStatus: async (userId: string): Promise<void> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const collectedKey = `daily_challenge_${userId}_${today}`;
      const value = await AsyncStorage.getItem(collectedKey);

      console.log('📊 Daily Challenge Status:');
      console.log(`   User ID: ${userId}`);
      console.log(`   Date: ${today}`);
      console.log(`   Collected: ${value === 'true' ? '✅ Yes' : '❌ No'}`);
    } catch (error) {
      console.error('❌ Error viewing daily challenge status:', error);
    }
  },

  /**
   * Clear daily challenges older than X days
   */
  clearOldDailyChallenges: async (daysToKeep: number = 7): Promise<void> => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const dailyChallengeKeys = keys.filter((key) => key.startsWith('daily_challenge_'));

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const keysToRemove: string[] = [];

      for (const key of dailyChallengeKeys) {
        // Extract date from key (format: daily_challenge_userId_YYYY-MM-DD)
        const parts = key.split('_');
        const dateStr = parts[parts.length - 1];
        const keyDate = new Date(dateStr);

        if (keyDate < cutoffDate) {
          keysToRemove.push(key);
        }
      }

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
        console.log(`✅ Cleared ${keysToRemove.length} old daily challenge entries`);
      } else {
        console.log('ℹ️ No old daily challenge data to clear');
      }
    } catch (error) {
      console.error('❌ Error clearing old daily challenges:', error);
    }
  },
};

// Development-only hook for easy access in components
export const useDebugDailyChallenge = () => {
  return {
    clearToday: (userId: string) => DebugUtils.clearDailyChallengeForUser(userId),
    clearAll: () => DebugUtils.clearAllDailyChallenges(),
    viewStatus: (userId: string) => DebugUtils.viewDailyChallengeStatus(userId),
    clearOld: (days?: number) => DebugUtils.clearOldDailyChallenges(days),
  };
};
