/**
 * useDailyMotivation.ts
 *
 * Hook to manage daily motivation modal display
 * Shows the modal once per day when the user opens the app
 */

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@daily_motivation_last_shown';

/**
 * Get today's date string in YYYY-MM-DD format
 */
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const useDailyMotivation = () => {
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestMode, setIsTestMode] = useState(false);

  /**
   * Check if the modal should be shown today
   */
  const checkShouldShow = useCallback(async () => {
    try {
      const lastShownDate = await AsyncStorage.getItem(STORAGE_KEY);
      const todayDate = getTodayDateString();

      // If never shown or last shown date is different from today, show the modal
      if (!lastShownDate || lastShownDate !== todayDate) {
        setShowModal(true);
        setIsTestMode(false);
        // Save today's date
        await AsyncStorage.setItem(STORAGE_KEY, todayDate);
      }
    } catch (error) {
      console.error('Error checking daily motivation:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initialize check on mount
   */
  useEffect(() => {
    // Small delay to let the app settle before showing the modal
    const timer = setTimeout(() => {
      checkShouldShow();
    }, 1000);

    return () => clearTimeout(timer);
  }, [checkShouldShow]);

  /**
   * Close the modal
   */
  const closeModal = useCallback(() => {
    setShowModal(false);
    setIsTestMode(false);
  }, []);

  /**
   * Force show the modal (useful for testing)
   */
  const forceShow = useCallback(async () => {
    setShowModal(true);
    setIsTestMode(true);
  }, []);

  /**
   * Reset the storage (useful for testing)
   */
  const resetStorage = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting daily motivation storage:', error);
    }
  }, []);

  return {
    showModal,
    closeModal,
    isLoading,
    forceShow,
    resetStorage,
    isTestMode,
  };
};
